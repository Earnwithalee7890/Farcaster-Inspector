import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateSpamScore, calculateTrustLevel, calculateInactivityDays } from '@/lib/scoring';

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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);

    if (!fid) {
        return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'Neynar API Key not configured' }, { status: 500 });
    }

    try {
        console.log(`[Following] Fetching following list for FID: ${fid}`);

        // Fetch user's following list
        let url = `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=${limit}`;
        if (cursor) {
            url += `&cursor=${cursor}`;
        }

        const followingResponse = await axios.get(url, {
            headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
        });

        const followingData = followingResponse.data;
        const users = followingData.users || [];
        const nextCursor = followingData.next?.cursor || null;

        console.log(`[Following] Found ${users.length} following, cursor: ${nextCursor ? 'yes' : 'no'}`);

        // Process each user for spam/quality analysis
        const processedUsers = users.map((followItem: any) => {
            const user = followItem.user || followItem;
            const accountAge = estimateAccountAge(user.fid);

            // Quick spam indicators (without fetching casts for speed)
            const spamIndicators: string[] = [];
            let spamScore = 0;

            // Low followers with high following ratio (follow-back farmers)
            const followerRatio = user.following_count > 0 ? user.follower_count / user.following_count : 0;
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
        });

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
            pagination: {
                has_more: !!nextCursor,
                next_cursor: nextCursor
            },
            message: `Found ${reviewCount} accounts worth reviewing out of ${processedUsers.length} following`
        });

    } catch (error: any) {
        console.error('[Following] Error:', error.response?.data || error.message);
        return NextResponse.json({
            error: error.response?.data?.message || 'Failed to fetch following list'
        }, { status: 500 });
    }
}
