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

    try {
        // 1. Fetch user's following list (v2)
        const neynarResponse = await axios.get(`https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=50`, {
            headers: { api_key: NEYNAR_API_KEY }
        });

        const rawUsers = neynarResponse.data.users;

        // 2. Fetch Talent Passport data for these users
        // We'll use the search/passports?ids=fid1,fid2... endpoint if exists, 
        // or just fetch them in batches. For this demo, we'll fetch the top 20 to keep it fast.
        const processedUsers = await Promise.all(rawUsers.map(async (user: any) => {
            let talentData = { score: 0, passport_id: '', verified: false };

            try {
                if (TALENT_API_KEY) {
                    // Search by FID in Talent Protocol
                    const tpResponse = await axios.get(`https://api.talentprotocol.com/api/v2/passports/${user.fid}`, {
                        headers: { 'X-API-KEY': TALENT_API_KEY }
                    });
                    if (tpResponse.data && tpResponse.data.passport) {
                        talentData = {
                            score: tpResponse.data.passport.score || 0,
                            passport_id: tpResponse.data.passport.passport_id,
                            verified: tpResponse.data.passport.verified
                        };
                    }
                }
            } catch (e) {
                // If not found in Talent Protocol, that's fine
            }

            const u: FarcasterUser = {
                fid: user.fid,
                username: user.username,
                display_name: user.display_name,
                pfp_url: user.pfp_url,
                profile: user.profile,
                follower_count: user.follower_count,
                following_count: user.following_count,
                verifications: user.verifications,
                active_status: user.active_status,
                talent_score: talentData.score,
                talent_passport_id: talentData.passport_id,
                is_verified: talentData.verified
            };

            const spam = calculateSpamScore(u);

            return {
                ...u,
                is_spam: spam.score > 50,
                spam_score: spam.score,
                spam_labels: spam.labels,
                status_label: spam.score > 50 ? 'Spam' : (u.active_status === 'inactive' ? 'Inactive' : 'Healthy')
            };
        }));

        return NextResponse.json({ users: processedUsers });
    } catch (error: any) {
        console.error('API Error:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
