import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateSpamScore, calculateTrustLevel, calculateInactivityDays } from '@/lib/scoring';
import { FarcasterUser } from '@/lib/types';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const TALENT_API_KEY = process.env.TALENT_PROTOCOL_API_KEY;

// Estimate account age based on FID
// FID 1 was created around Oct 2021, current FIDs are ~900k+
function estimateAccountAge(fid: number): { days: number; label: string } {
    // Rough estimation: 900k FIDs over ~1100 days = ~818 FIDs per day
    const fidsPerDay = 818;
    const daysSinceStart = Math.floor(fid / fidsPerDay);
    const accountAgeDays = 1100 - daysSinceStart; // Days since account creation

    if (accountAgeDays > 730) return { days: accountAgeDays, label: 'OG (2+ years)' };
    if (accountAgeDays > 365) return { days: accountAgeDays, label: 'Veteran (1+ year)' };
    if (accountAgeDays > 180) return { days: accountAgeDays, label: 'Established (6+ months)' };
    if (accountAgeDays > 30) return { days: accountAgeDays, label: 'New (1-6 months)' };
    return { days: accountAgeDays, label: 'Very New (<1 month)' };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
        return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
        return NextResponse.json({ error: 'Neynar API Key not configured on server' }, { status: 500 });
    }

    try {
        console.log(`[Inspector] Analyzing FID: ${fid}`);

        // 1. Fetch user profile
        const userResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
            headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
        });

        if (!userResponse.data.users || userResponse.data.users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const mainUser = userResponse.data.users[0];
        console.log(`[Inspector] Found: @${mainUser.username}`);

        // 2. Fetch user's recent casts for activity analysis
        let casts: any[] = [];
        let castStats = { total: 0, replies: 0, recasts: 0, lastCastDate: null as string | null };

        try {
            const castsResponse = await axios.get(`https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=25`, {
                headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
            });

            if (castsResponse.data.casts) {
                casts = castsResponse.data.casts;
                castStats.total = casts.length;
                castStats.replies = casts.filter((c: any) => c.parent_hash).length;
                castStats.lastCastDate = casts.length > 0 ? casts[0].timestamp : null;
            }
        } catch (e) {
            console.log('[Inspector] Could not fetch casts');
        }

        // 3. Get power badge users for comparison/sample
        let sampleUsers: any[] = [];
        try {
            const powerResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/power?limit=15`, {
                headers: { 'accept': 'application/json', 'api_key': NEYNAR_API_KEY }
            });
            if (powerResponse.data.users) {
                sampleUsers = powerResponse.data.users;
            }
        } catch (e) {
            console.log('[Inspector] Power users endpoint not available');
        }

        // 4. Process main user with all metrics
        const accountAge = estimateAccountAge(mainUser.fid);
        const inactivityDays = calculateInactivityDays(castStats.lastCastDate);

        let talentData = { score: 0, passport_id: '', verified: false };
        if (TALENT_API_KEY && mainUser.verified_addresses?.eth_addresses?.length > 0) {
            try {
                const wallet = mainUser.verified_addresses.eth_addresses[0];
                const tpResponse = await axios.get(`https://api.talentprotocol.com/api/v2/passports/${wallet}`, {
                    headers: { 'X-API-KEY': TALENT_API_KEY },
                    timeout: 3000
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

        const searchedUserData: FarcasterUser = {
            fid: mainUser.fid,
            username: mainUser.username,
            display_name: mainUser.display_name,
            pfp_url: mainUser.pfp_url,
            profile: mainUser.profile || { bio: { text: '' } },
            follower_count: mainUser.follower_count,
            following_count: mainUser.following_count,
            verifications: mainUser.verifications || [],
            active_status: mainUser.active_status || 'active',
            talent_score: talentData.score,
            talent_passport_id: talentData.passport_id,
            is_verified: talentData.verified
        };

        const spamResult = calculateSpamScore(searchedUserData);
        const trustLevel = calculateTrustLevel(mainUser.score || 0, talentData.score, mainUser.power_badge);

        const enrichedMainUser = {
            ...searchedUserData,
            neynar_score: mainUser.score || mainUser.experimental?.neynar_user_score || 0,
            power_badge: mainUser.power_badge || false,
            account_age: accountAge,
            cast_stats: castStats,
            inactivity_days: inactivityDays,
            recent_casts: casts.slice(0, 5), // Last 5 casts for display
            is_spam: spamResult.score > 50,
            spam_score: spamResult.score,
            spam_labels: spamResult.labels,
            trust_level: trustLevel,
            status_label: spamResult.score > 50 ? 'Spam' : (inactivityDays > 30 ? 'Inactive' : 'Healthy')
        };

        // 5. Process sample users
        const processedSampleUsers = sampleUsers.map((user: any) => {
            const age = estimateAccountAge(user.fid);
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
                talent_score: 0,
                talent_passport_id: '',
                is_verified: false
            };

            const spam = calculateSpamScore(userData);
            const trust = calculateTrustLevel(user.score || 0, 0, user.power_badge);

            return {
                ...userData,
                neynar_score: user.score || 0,
                power_badge: user.power_badge || false,
                account_age: age,
                is_spam: spam.score > 50,
                spam_score: spam.score,
                spam_labels: spam.labels,
                trust_level: trust,
                status_label: spam.score > 50 ? 'Spam' : (user.active_status === 'inactive' ? 'Inactive' : 'Healthy')
            };
        });

        return NextResponse.json({
            searchedUser: enrichedMainUser,
            users: [enrichedMainUser, ...processedSampleUsers],
            message: `Analyzed @${mainUser.username} with ${castStats.total} recent casts`
        });

    } catch (error: any) {
        console.error('[Inspector] Error:', error.response?.data || error.message);
        return NextResponse.json({
            error: error.response?.data?.message || 'Failed to fetch data'
        }, { status: 500 });
    }
}
