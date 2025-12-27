import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateSpamScore, calculateTrustLevel, calculateInactivityDays } from '@/lib/scoring';
import { FarcasterUser } from '@/lib/types';
import duneAPI from '@/lib/dune';
import quotientAPI, { getQuotientTier, getQuotientTierColor, getQuotientTierEmoji } from '@/lib/quotient';
import openRankAPI from '@/lib/openrank';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const TALENT_API_KEY = process.env.TALENT_PROTOCOL_API_KEY;
const DUNE_API_KEY = process.env.DUNE_API_KEY;
const QUOTIENT_API_KEY = process.env.QUOTIENT_API_KEY;

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
    const fidParam = searchParams.get('fid');
    const batchMode = searchParams.get('batch') === 'true';

    if (!fidParam) {
        return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'Neynar API Key not configured' }, { status: 500 });
    }

    try {
        // Parse FIDs - support comma-separated or single
        const fids = fidParam.split(',').map(f => f.trim()).filter(f => f && !isNaN(Number(f))).slice(0, 100);

        if (fids.length === 0) {
            return NextResponse.json({ error: 'No valid FIDs provided' }, { status: 400 });
        }

        console.log(`[Inspector] Analyzing ${fids.length} FID(s): ${fids.slice(0, 5).join(', ')}${fids.length > 5 ? '...' : ''}`);

        // Batch fetch users (Neynar supports up to 100 FIDs in bulk)
        const userResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`, {
            headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
        });

        if (!userResponse.data.users || userResponse.data.users.length === 0) {
            return NextResponse.json({ error: 'No users found' }, { status: 404 });
        }

        const users = userResponse.data.users;
        console.log(`[Inspector] Found ${users.length} users`);

        // Batch fetch Quotient scores (more efficient)
        const userFids = users.map((u: any) => u.fid);
        const [quotientScoresMap, openRankScores] = await Promise.all([
            QUOTIENT_API_KEY ? quotientAPI.getUserReputationsMap(userFids) : Promise.resolve(new Map()),
            openRankAPI.getScores(userFids)
        ]);

        const openRankMap = new Map(openRankScores.map(s => [s.fid, s]));

        // Process all users
        const processedUsers = await Promise.all(users.map(async (user: any) => {
            const accountAge = estimateAccountAge(user.fid);

            // For batch mode, we skip cast fetching to stay fast
            let castStats = { total: 0, replies: 0, recasts: 0, lastCastDate: null as string | null };
            let inactivityDays = 999;

            // Only fetch casts for single user mode or first user in batch
            if (!batchMode || fids.length === 1) {
                try {
                    const castsResponse = await axios.get(`https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${user.fid}&limit=10`, {
                        headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
                    });
                    if (castsResponse.data.casts) {
                        castStats.total = castsResponse.data.casts.length;
                        castStats.replies = castsResponse.data.casts.filter((c: any) => c.parent_hash).length;
                        castStats.lastCastDate = castsResponse.data.casts.length > 0 ? castsResponse.data.casts[0].timestamp : null;
                        inactivityDays = calculateInactivityDays(castStats.lastCastDate);
                    }
                } catch (e) { }
            }

            // Talent Protocol lookup (skip in batch mode for speed)
            let talentData = { score: 0, passport_id: '', verified: false };
            if (!batchMode && TALENT_API_KEY && user.verified_addresses?.eth_addresses?.length > 0) {
                try {
                    const wallet = user.verified_addresses.eth_addresses[0];
                    const tpResponse = await axios.get(`https://api.talentprotocol.com/api/v2/passports/${wallet}`, {
                        headers: { 'X-API-KEY': TALENT_API_KEY },
                        timeout: 2000
                    });
                    if (tpResponse.data?.passport) {
                        talentData = {
                            score: tpResponse.data.passport.score || 0,
                            passport_id: tpResponse.data.passport.passport_id || '',
                            verified: tpResponse.data.passport.verified || false
                        };
                    }
                } catch (e) { }
            }

            // Dune onchain labels lookup (skip in batch mode for speed)
            let duneLabels: string[] = [];
            if (!batchMode && DUNE_API_KEY && user.verified_addresses?.eth_addresses?.length > 0) {
                try {
                    const wallet = user.verified_addresses.eth_addresses[0];
                    duneLabels = await duneAPI.getWalletLabels(wallet);
                } catch (e) { }
            }

            const userData: FarcasterUser = {
                fid: user.fid,
                username: user.username,
                display_name: user.display_name,
                pfp_url: user.pfp_url,
                profile: user.profile || { bio: { text: '' } },
                follower_count: user.follower_count,
                following_count: user.following_count,
                verifications: user.verifications || [],
                active_status: user.active_status || 'active',
                talent_score: talentData.score,
                talent_passport_id: talentData.passport_id,
                is_verified: talentData.verified,
                cast_stats: castStats,
                inactivity_days: inactivityDays
            };

            const spamResult = calculateSpamScore(userData);
            const trustLevel = calculateTrustLevel(user.score || 0, talentData.score, user.power_badge);

            // Get Quotient score from pre-fetched map
            const quotientData = quotientScoresMap.get(user.fid);

            // Get OpenRank score from pre-fetched map
            const openRankData = openRankMap.get(user.fid);
            const openRankTier = openRankAPI.getTier(openRankData?.score || 0);

            return {
                ...userData,
                neynar_score: user.score || user.experimental?.neynar_user_score || 0,
                power_badge: user.power_badge || false,
                account_age: accountAge,
                is_spam: spamResult.score > 50,
                spam_score: spamResult.score,
                spam_labels: spamResult.labels,
                trust_level: trustLevel,
                status_label: spamResult.score > 50 ? 'Spam' : (inactivityDays > 30 ? 'Inactive' : 'Healthy'),
                dune_labels: duneLabels,
                quotient_score: quotientData?.quotient_score || null,
                quotient_rank: quotientData?.rank || null,
                quotient_tier: quotientData?.tier || null,
                quotient_tier_color: quotientData ? getQuotientTierColor(quotientData.tier) : null,
                quotient_tier_emoji: quotientData ? getQuotientTierEmoji(quotientData.tier) : null,
                // OpenRank data
                openrank_score: openRankData?.score || null,
                openrank_display_score: openRankData ? (openRankData.score * 1000).toFixed(2) : null,
                openrank_rank: openRankData?.rank || null,
                openrank_tier: openRankTier.tier,
                openrank_tier_emoji: openRankTier.emoji,
                openrank_tier_color: openRankTier.color
            };
        }));

        // Calculate summary stats
        const spamCount = processedUsers.filter(u => u.spam_score > 50).length;
        const inactiveCount = processedUsers.filter(u => u.status_label === 'Inactive').length;
        const healthyCount = processedUsers.filter(u => u.status_label === 'Healthy' && !u.is_spam).length;
        const trustedCount = processedUsers.filter(u => u.trust_level === 'High' || u.power_badge).length;

        return NextResponse.json({
            users: processedUsers,
            searchedUser: processedUsers[0],
            stats: {
                total: processedUsers.length,
                spam: spamCount,
                inactive: inactiveCount,
                healthy: healthyCount,
                trusted: trustedCount
            },
            message: batchMode
                ? `Batch analyzed ${processedUsers.length} accounts: ${spamCount} spam, ${inactiveCount} inactive, ${healthyCount} healthy`
                : `Analyzed @${processedUsers[0]?.username}`
        });

    } catch (error: any) {
        console.error('[Inspector] Error:', error.response?.data || error.message);
        return NextResponse.json({
            error: error.response?.data?.message || 'Failed to fetch data'
        }, { status: 500 });
    }
}
