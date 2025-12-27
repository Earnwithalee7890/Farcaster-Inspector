import { NextRequest, NextResponse } from 'next/server';
import openRankAPI from '@/lib/openrank';
import axios from 'axios';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const fids = searchParams.get('fids');
    const action = searchParams.get('action') || 'score';
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        // Get global rankings
        if (action === 'rankings') {
            const rankings = await openRankAPI.getGlobalRankings(limit);

            // Enrich with Neynar user data
            if (rankings.length > 0 && NEYNAR_API_KEY) {
                const fidList = rankings.slice(0, 100).map(r => r.fid);
                const userResponse = await axios.get(
                    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidList.join(',')}`,
                    { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
                );

                const usersMap = new Map(
                    (userResponse.data.users || []).map((u: any) => [u.fid, u])
                );

                const enrichedRankings = rankings.map((r, index) => {
                    const user = usersMap.get(r.fid) as any;
                    const tier = openRankAPI.getTier(r.score);
                    return {
                        rank: index + 1,
                        fid: r.fid,
                        score: r.score,
                        display_score: (r.score * 1000).toFixed(2),
                        tier: tier.tier,
                        tier_emoji: tier.emoji,
                        tier_color: tier.color,
                        username: user?.username || `fid:${r.fid}`,
                        display_name: user?.display_name || 'Unknown',
                        pfp_url: user?.pfp_url || null,
                        follower_count: user?.follower_count || 0,
                        power_badge: user?.power_badge || false
                    };
                });

                return NextResponse.json({
                    success: true,
                    rankings: enrichedRankings,
                    total: rankings.length
                });
            }

            return NextResponse.json({
                success: true,
                rankings: rankings.map((r, i) => ({
                    rank: i + 1,
                    ...r,
                    display_score: (r.score * 1000).toFixed(2),
                    ...openRankAPI.getTier(r.score)
                }))
            });
        }

        // Get follower rankings for a user
        if (action === 'followers' && fid) {
            const rankings = await openRankAPI.getFollowerRankings(parseInt(fid), limit);
            return NextResponse.json({
                success: true,
                fid: parseInt(fid),
                followers: rankings.map((r, i) => ({
                    rank: i + 1,
                    ...r,
                    display_score: (r.score * 1000).toFixed(2),
                    ...openRankAPI.getTier(r.score)
                }))
            });
        }

        // Get following rankings for a user
        if (action === 'following' && fid) {
            const rankings = await openRankAPI.getFollowingRankings(parseInt(fid), limit);
            return NextResponse.json({
                success: true,
                fid: parseInt(fid),
                following: rankings.map((r, i) => ({
                    rank: i + 1,
                    ...r,
                    display_score: (r.score * 1000).toFixed(2),
                    ...openRankAPI.getTier(r.score)
                }))
            });
        }

        // Get score for single FID
        if (fid) {
            const score = await openRankAPI.getUserScore(parseInt(fid));

            if (!score) {
                return NextResponse.json({
                    success: false,
                    error: 'No OpenRank score found for this user'
                }, { status: 404 });
            }

            const tier = openRankAPI.getTier(score.score);
            const spamSignal = openRankAPI.getSpamSignal(score.score);

            // Get user details from Neynar
            let userData = null;
            if (NEYNAR_API_KEY) {
                try {
                    const userResponse = await axios.get(
                        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
                        { headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY } }
                    );
                    userData = userResponse.data.users?.[0] || null;
                } catch (e) { }
            }

            return NextResponse.json({
                success: true,
                user: {
                    fid: score.fid,
                    username: userData?.username || `fid:${score.fid}`,
                    display_name: userData?.display_name || 'Unknown',
                    pfp_url: userData?.pfp_url || null,
                    follower_count: userData?.follower_count || 0,
                    following_count: userData?.following_count || 0,
                    power_badge: userData?.power_badge || false
                },
                openrank: {
                    score: score.score,
                    display_score: (score.score * 1000).toFixed(2),
                    rank: score.rank || null,
                    tier: tier.tier,
                    tier_emoji: tier.emoji,
                    tier_color: tier.color,
                    tier_label: tier.label
                },
                spam_signal: spamSignal
            });
        }

        // Get scores for multiple FIDs
        if (fids) {
            const fidList = fids.split(',').map(f => parseInt(f.trim())).filter(f => !isNaN(f));
            const scores = await openRankAPI.getScores(fidList);

            return NextResponse.json({
                success: true,
                scores: scores.map(s => ({
                    ...s,
                    display_score: (s.score * 1000).toFixed(2),
                    ...openRankAPI.getTier(s.score),
                    spam_signal: openRankAPI.getSpamSignal(s.score)
                }))
            });
        }

        return NextResponse.json({
            error: 'Missing required parameter: fid, fids, or action=rankings',
            usage: {
                single: '/api/openrank?fid=123',
                multiple: '/api/openrank?fids=1,2,3',
                global_rankings: '/api/openrank?action=rankings&limit=50',
                follower_rankings: '/api/openrank?action=followers&fid=123',
                following_rankings: '/api/openrank?action=following&fid=123'
            }
        }, { status: 400 });

    } catch (error: any) {
        console.error('[OpenRank API] Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch OpenRank data'
        }, { status: 500 });
    }
}
