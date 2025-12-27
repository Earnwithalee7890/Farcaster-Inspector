import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateTrustLevel } from '@/lib/scoring';
import duneAPI from '@/lib/dune';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const DUNE_API_KEY = process.env.DUNE_API_KEY;

function estimateAccountAge(fid: number): { days: number; label: string } {
    const fidsPerDay = 818;
    const daysSinceStart = Math.floor(fid / fidsPerDay);
    const accountAgeDays = 1100 - daysSinceStart;

    if (accountAgeDays > 730) return { days: accountAgeDays, label: 'OG (2+ years)' };
    if (accountAgeDays > 365) return { days: accountAgeDays, label: 'Veteran (1+ year)' };
    if (accountAgeDays > 180) return { days: accountAgeDays, label: 'Established (6+ months)' };
    if (accountAgeDays > 30) return { days: accountAgeDays, label: 'New (1-6 months)' };
    return { days: accountAgeDays, label: 'Very New (<1 month)' };
}

function analyzeUserForSpam(user: any) {
    const accountAge = estimateAccountAge(user.fid);
    const spamIndicators: string[] = [];
    let spamScore = 0;

    // Low followers with high following ratio (follow-back farmers)
    if (user.follower_count < 10 && user.following_count > 100) {
        spamIndicators.push('Follow-back farmer');
        spamScore += 30;
    }

    // Very new account with suspicious activity
    if (accountAge.days < 30 && user.following_count > 500) {
        spamIndicators.push('New mass follower');
        spamScore += 25;
    }

    // No profile picture
    if (!user.pfp_url || user.pfp_url.includes('default')) {
        spamIndicators.push('No profile picture');
        spamScore += 10;
    }

    // No bio
    if (!user.profile?.bio?.text || user.profile.bio.text.length < 5) {
        spamIndicators.push('No bio');
        spamScore += 10;
    }

    // Very low engagement score (Neynar score)
    const neynarScore = user.score || user.experimental?.neynar_user_score || 0;
    if (neynarScore > 0 && neynarScore < 0.2) {
        spamIndicators.push('Low engagement');
        spamScore += 15;
    }

    // No power badge and very low followers
    if (!user.power_badge && user.follower_count < 5) {
        spamIndicators.push('Minimal presence');
        spamScore += 10;
    }

    // Determine status with clear labels
    let status = 'safe';
    let statusEmoji = '✅';
    if (spamScore >= 50) {
        status = 'spam';
        statusEmoji = '🚨';
    } else if (spamScore >= 30) {
        status = 'suspicious';
        statusEmoji = '⚠️';
    }

    const trustLevel = calculateTrustLevel(neynarScore, 0, user.power_badge);

    return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        bio: user.profile?.bio?.text || '',
        follower_count: user.follower_count,
        following_count: user.following_count,
        power_badge: user.power_badge || false,
        neynar_score: neynarScore,
        account_age: accountAge,
        spam_score: spamScore,
        spam_indicators: spamIndicators,
        trust_level: trustLevel,
        status: status,
        status_emoji: statusEmoji,
        should_review: spamScore >= 30
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const fidsParam = searchParams.get('fids');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'Neynar API Key not configured' }, { status: 500 });
    }

    // ==================== METHOD 1: Direct FIDs provided ====================
    // This always works (FREE) - user provides FIDs to analyze
    if (fidsParam) {
        try {
            const fids = fidsParam.split(',')
                .map(f => f.trim())
                .filter(f => f && !isNaN(Number(f)))
                .slice(0, 100);

            if (fids.length === 0) {
                return NextResponse.json({ error: 'No valid FIDs provided' }, { status: 400 });
            }

            console.log(`[Following] Analyzing ${fids.length} provided FIDs`);

            const userResponse = await axios.get(
                `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`,
                { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
            );

            const users = userResponse.data.users || [];
            const processedUsers = users.map(analyzeUserForSpam);
            processedUsers.sort((a: any, b: any) => b.spam_score - a.spam_score);

            const stats = {
                total: processedUsers.length,
                spam: processedUsers.filter((u: any) => u.status === 'spam').length,
                suspicious: processedUsers.filter((u: any) => u.status === 'suspicious').length,
                safe: processedUsers.filter((u: any) => u.status === 'safe').length,
                needs_review: processedUsers.filter((u: any) => u.should_review).length
            };

            return NextResponse.json({
                success: true,
                users: processedUsers,
                stats,
                method: 'direct',
                message: `Analyzed ${stats.total} accounts - ${stats.spam} spam, ${stats.suspicious} suspicious, ${stats.safe} safe`
            });

        } catch (error: any) {
            console.error('[Following] Bulk analysis error:', error.response?.data || error.message);
            return NextResponse.json({
                success: false,
                error: error.response?.data?.message || 'Failed to analyze users'
            }, { status: 500 });
        }
    }

    // ==================== METHOD 2: Automatic following scan ====================
    if (fid) {
        let followingFids: number[] | null = null;
        let method = '';

        // Try Dune first (might work with free tier for smaller queries)
        if (DUNE_API_KEY) {
            console.log(`[Following] Trying Dune API for FID: ${fid}...`);
            try {
                followingFids = await duneAPI.getUserFollowingFids(parseInt(fid), limit);
                if (followingFids && followingFids.length > 0) {
                    method = 'dune';
                    console.log(`[Following] Dune returned ${followingFids.length} FIDs`);
                }
            } catch (e) {
                console.log('[Following] Dune failed, trying Neynar...');
            }
        }

        // Try Neynar if Dune didn't work
        if (!followingFids && NEYNAR_API_KEY) {
            try {
                console.log(`[Following] Trying Neynar API for FID: ${fid}...`);
                const followingResponse = await axios.get(
                    `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=${limit}`,
                    { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
                );

                const users = followingResponse.data.users || [];
                followingFids = users.map((u: any) => (u.user || u).fid);
                method = 'neynar';
                console.log(`[Following] Neynar returned ${followingFids?.length || 0} FIDs`);
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || '';

                if (errorMessage.includes('paid plan') || errorMessage.includes('Upgrade') || error.response?.status === 402) {
                    console.log('[Following] Paid plan required');

                    return NextResponse.json({
                        success: false,
                        requiresManualMode: true,
                        error: 'Automatic scanning requires API upgrade',
                        hint: 'Use Batch Analyze mode instead - it\'s FREE! Paste FIDs to analyze.',
                        instructions: [
                            'Open your Warpcast Following page',
                            'Copy FIDs of accounts you want to check',
                            'Paste them in Batch Analyze mode',
                            'Get spam analysis for up to 100 accounts!'
                        ]
                    }, { status: 402 });
                }

                console.error('[Following] Neynar error:', error.response?.data || error.message);
            }
        }

        // If we got FIDs, fetch user details and analyze
        if (followingFids && followingFids.length > 0) {
            try {
                const userResponse = await axios.get(
                    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${followingFids.slice(0, 100).join(',')}`,
                    { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
                );

                const users = userResponse.data.users || [];
                const processedUsers = users.map(analyzeUserForSpam);
                processedUsers.sort((a: any, b: any) => b.spam_score - a.spam_score);

                const stats = {
                    total: processedUsers.length,
                    spam: processedUsers.filter((u: any) => u.status === 'spam').length,
                    suspicious: processedUsers.filter((u: any) => u.status === 'suspicious').length,
                    safe: processedUsers.filter((u: any) => u.status === 'safe').length,
                    needs_review: processedUsers.filter((u: any) => u.should_review).length
                };

                return NextResponse.json({
                    success: true,
                    users: processedUsers,
                    stats,
                    method,
                    message: `Scanned ${stats.total} accounts - ${stats.spam} spam 🚨, ${stats.suspicious} suspicious ⚠️, ${stats.safe} safe ✅`
                });

            } catch (error: any) {
                console.error('[Following] User analysis error:', error.response?.data || error.message);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to analyze following accounts'
                }, { status: 500 });
            }
        }

        // Neither Dune nor Neynar worked
        return NextResponse.json({
            success: false,
            requiresManualMode: true,
            error: 'Could not automatically fetch your following list',
            hint: 'Use Batch Analyze mode to check accounts manually',
            instructions: [
                'Go to your Warpcast Following page',
                'Pick accounts that look suspicious',
                'Enter their FIDs in Batch Analyze mode',
                'We\'ll check if they\'re spam!'
            ]
        }, { status: 402 });
    }

    return NextResponse.json({
        error: 'FID or FIDs parameter required',
        usage: {
            automatic: '/api/following?fid=338060',
            manual: '/api/following?fids=1,2,3,4,5'
        }
    }, { status: 400 });
}
