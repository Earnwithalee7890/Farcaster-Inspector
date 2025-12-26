import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateSpamScore } from '@/lib/scoring';
import { FarcasterUser } from '@/lib/types';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const TALENT_API_KEY = process.env.TALENT_PROTOCOL_API_KEY;

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
        // 1. Fetch the user's profile using the FREE bulk endpoint
        console.log(`[Inspector] Fetching profile for FID: ${fid}`);

        const userResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
            headers: {
                'accept': 'application/json',
                'api_key': NEYNAR_API_KEY
            }
        });

        if (!userResponse.data.users || userResponse.data.users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const mainUser = userResponse.data.users[0];
        console.log(`[Inspector] Found user: @${mainUser.username}`);

        // 2. Fetch users that this user follows (if available) or use power badge holders as sample
        let usersToAnalyze = [];

        try {
            // Try to get power badge users as a sample of active Farcaster users
            const powerBadgeResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/power?limit=20`, {
                headers: {
                    'accept': 'application/json',
                    'api_key': NEYNAR_API_KEY
                }
            });

            if (powerBadgeResponse.data.users) {
                usersToAnalyze = powerBadgeResponse.data.users;
            }
        } catch (e) {
            console.log('[Inspector] Power badge endpoint not available, using single user analysis');
        }

        // If we couldn't get other users, just analyze the searched user
        if (usersToAnalyze.length === 0) {
            usersToAnalyze = [mainUser];
        }

        // 3. Process and enrich each user
        const processedUsers = await Promise.all(usersToAnalyze.map(async (user: any) => {
            let talentData = { score: 0, passport_id: '', verified: false };

            // Try to get Talent Protocol data
            if (TALENT_API_KEY && user.verified_addresses?.eth_addresses?.length > 0) {
                try {
                    const walletAddress = user.verified_addresses.eth_addresses[0];
                    const tpResponse = await axios.get(`https://api.talentprotocol.com/api/v2/passports/${walletAddress}`, {
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
                } catch (e) {
                    // Talent Protocol lookup failed, continue without it
                }
            }

            const u: FarcasterUser = {
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
                is_verified: talentData.verified
            };

            const spam = calculateSpamScore(u);

            return {
                ...u,
                neynar_score: user.score || user.experimental?.neynar_user_score || 0,
                power_badge: user.power_badge || false,
                is_spam: spam.score > 50,
                spam_score: spam.score,
                spam_labels: spam.labels,
                status_label: spam.score > 50 ? 'Spam' : (u.active_status === 'inactive' ? 'Inactive' : 'Healthy')
            };
        }));

        // Put the searched user first
        const searchedUserIndex = processedUsers.findIndex(u => u.fid === parseInt(fid));
        if (searchedUserIndex > 0) {
            const searchedUser = processedUsers.splice(searchedUserIndex, 1)[0];
            processedUsers.unshift(searchedUser);
        }

        return NextResponse.json({
            users: processedUsers,
            searchedUser: processedUsers[0],
            message: `Showing profile for @${mainUser.username} and ${processedUsers.length - 1} active Farcaster users`
        });

    } catch (error: any) {
        console.error('[Inspector] Error:', error.response?.data || error.message);

        if (error.response?.status === 402) {
            return NextResponse.json({
                error: 'This Neynar API endpoint requires a paid plan. Please upgrade at neynar.com'
            }, { status: 402 });
        }

        return NextResponse.json({
            error: error.response?.data?.message || 'Failed to fetch data. Please try again.'
        }, { status: 500 });
    }
}
