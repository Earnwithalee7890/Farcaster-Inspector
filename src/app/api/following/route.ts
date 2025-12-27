import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateTrustLevel } from '@/lib/scoring';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

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
        spamIndicators.push('New account, mass following');
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

    // Very low engagement score
    const neynarScore = user.score || user.experimental?.neynar_user_score || 0;
    if (neynarScore < 0.2) {
        spamIndicators.push('Low engagement');
        spamScore += 15;
    }

    // No power badge and very low followers
    if (!user.power_badge && user.follower_count < 5) {
        spamIndicators.push('Minimal presence');
        spamScore += 10;
    }

    // Determine status
    let status = 'healthy';
    if (spamScore >= 50) status = 'spam';
    else if (spamScore >= 30) status = 'suspicious';

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
        should_review: spamScore >= 30
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const fidsParam = searchParams.get('fids'); // For manual FID list input

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'Neynar API Key not configured' }, { status: 500 });
    }

    // If user provides a list of FIDs directly, analyze those (works without paid plan)
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

            // Fetch user data for the provided FIDs (this is FREE!)
            const userResponse = await axios.get(
                `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`,
                { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
            );

            const users = userResponse.data.users || [];
            const processedUsers = users.map(analyzeUserForSpam);

            // Sort by spam score (highest first)
            processedUsers.sort((a: any, b: any) => b.spam_score - a.spam_score);

            // Calculate stats
            const spamCount = processedUsers.filter((u: any) => u.status === 'spam').length;
            const suspiciousCount = processedUsers.filter((u: any) => u.status === 'suspicious').length;
            const healthyCount = processedUsers.filter((u: any) => u.status === 'healthy').length;
            const reviewCount = processedUsers.filter((u: any) => u.should_review).length;

            return NextResponse.json({
                success: true,
                users: processedUsers,
                stats: {
                    total: processedUsers.length,
                    spam: spamCount,
                    suspicious: suspiciousCount,
                    healthy: healthyCount,
                    needs_review: reviewCount
                },
                pagination: { has_more: false, next_cursor: null },
                message: `Found ${reviewCount} accounts worth reviewing out of ${processedUsers.length}`
            });

        } catch (error: any) {
            console.error('[Following] Bulk analysis error:', error.response?.data || error.message);
            return NextResponse.json({
                error: error.response?.data?.message || 'Failed to analyze users'
            }, { status: 500 });
        }
    }

    // Try to fetch following directly (requires paid Neynar plan)
    if (fid) {
        try {
            console.log(`[Following] Attempting to fetch following list for FID: ${fid}`);

            const followingResponse = await axios.get(
                `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=25`,
                { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
            );

            const followingData = followingResponse.data;
            const users = followingData.users || [];

            const processedUsers = users.map((followItem: any) => {
                const user = followItem.user || followItem;
                return analyzeUserForSpam(user);
            });

            processedUsers.sort((a: any, b: any) => b.spam_score - a.spam_score);

            const spamCount = processedUsers.filter((u: any) => u.status === 'spam').length;
            const suspiciousCount = processedUsers.filter((u: any) => u.status === 'suspicious').length;
            const healthyCount = processedUsers.filter((u: any) => u.status === 'healthy').length;
            const reviewCount = processedUsers.filter((u: any) => u.should_review).length;

            return NextResponse.json({
                success: true,
                users: processedUsers,
                stats: {
                    total: processedUsers.length,
                    spam: spamCount,
                    suspicious: suspiciousCount,
                    healthy: healthyCount,
                    needs_review: reviewCount
                },
                pagination: {
                    has_more: !!followingData.next?.cursor,
                    next_cursor: followingData.next?.cursor || null
                },
                message: `Found ${reviewCount} accounts worth reviewing out of ${processedUsers.length} following`
            });

        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || '';

            // Check if it's a paid plan error
            if (errorMessage.includes('paid plan') || errorMessage.includes('Upgrade') || error.response?.status === 402) {
                console.log('[Following] Paid plan required - returning manual mode instructions');

                return NextResponse.json({
                    success: false,
                    requiresManualMode: true,
                    error: 'The "Scan Following" feature requires a Neynar paid plan.',
                    hint: 'Use "Batch Analyze" mode instead! You can paste FIDs from your following list.',
                    instructions: [
                        '1. Go to your Warpcast Following page',
                        '2. Use browser console to extract FIDs, or',
                        '3. Manually enter FIDs in Batch Analyze mode',
                        '4. We can analyze up to 100 accounts for free!'
                    ]
                }, { status: 402 });
            }

            console.error('[Following] Error:', error.response?.data || error.message);
            return NextResponse.json({
                success: false,
                error: errorMessage || 'Failed to fetch following list'
            }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'FID or FIDs parameter required' }, { status: 400 });
}
