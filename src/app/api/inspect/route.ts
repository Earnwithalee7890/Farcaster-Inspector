import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { calculateSpamScore } from '@/lib/scoring';
import { FarcasterUser } from '@/lib/types';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const TALENT_API_KEY = process.env.TALENT_PROTOCOL_API_KEY;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    console.log(`[Inspector] Checking FID: ${fid}`);

    if (!fid) {
        return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    try {
        // 1. Fetch user's following list (v2)
        console.log(`[Neynar] Fetching following for FID ${fid}...`);
        let rawUsers = [];
        let isMock = false;

        try {
            const neynarResponse = await axios.get(`https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=20`, {
                headers: { api_key: NEYNAR_API_KEY }
            });
            rawUsers = neynarResponse.data.users;
            console.log(`[Neynar] Success. Found ${rawUsers.length} users.`);
        } catch (neynarError: any) {
            console.error(`[Neynar] Error:`, neynarError.response?.data || neynarError.message);

            if (neynarError.response?.status === 402 || neynarError.response?.data?.code === 'PaymentRequired') {
                console.warn(`[Neynar] Payment Required error. Falling back to Mock data for demonstration.`);
                return NextResponse.json({
                    users: generateMockUsers(),
                    message: "Neynar API requires a paid plan for social graph access. Showing demonstration data.",
                    isMock: true
                });
            }
            throw neynarError;
        }

        // 2. Process and enrich with Talent Protocol
        const processedUsers = await Promise.all(rawUsers.map(async (item: any) => {
            // In Neynar V2 following, the structure is usually { user: { ... } }
            const user = item.user || item;

            let talentData = { score: 0, passport_id: '', verified: false };

            if (TALENT_API_KEY && user.fid) {
                try {
                    // We use the account search by FID
                    const tpResponse = await axios.get(`https://api.talentprotocol.com/api/v2/passports/${user.fid}`, {
                        headers: { 'X-API-KEY': TALENT_API_KEY },
                        timeout: 2000
                    });
                    if (tpResponse.data && tpResponse.data.passport) {
                        talentData = {
                            score: tpResponse.data.passport.score || 0,
                            passport_id: tpResponse.data.passport.passport_id,
                            verified: tpResponse.data.passport.verified
                        };
                    }
                } catch (e) {
                    // Silent fail for Talent Protocol enrichment
                }
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
        console.error('[Inspector] Global Error:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch data from Farcaster. Please check your API key plan.' }, { status: 500 });
    }
}

function generateMockUsers() {
    return [
        {
            fid: 3,
            username: "dwr",
            display_name: "Dan Romero",
            pfp_url: "https://i.imgur.com/8RK9k6O.png",
            profile: { bio: { text: "Co-founder of Farcaster." } },
            follower_count: 600000,
            following_count: 1400,
            verifications: ["0x6ce09ed5526de4afe4a981ad86d17b2f5c92fea5"],
            active_status: "active",
            status_label: "Healthy",
            talent_score: 95,
            spam_score: 0,
            spam_labels: []
        },
        {
            fid: 888888,
            username: "claim_rewards_99",
            display_name: "🎁 FREE REWARDS 🎁",
            pfp_url: "",
            profile: { bio: { text: "Click the link for free tokens!" } },
            follower_count: 12,
            following_count: 8500,
            verifications: [],
            active_status: "inactive",
            status_label: "Spam",
            is_spam: true,
            talent_score: 2,
            spam_score: 90,
            spam_labels: ["No/Default PFP", "Empty/Short Bio", "Suspicious Follower Ratio", "Low Reputation"]
        },
        {
            fid: 121,
            username: "ghost_dev",
            display_name: "Legacy Builder",
            pfp_url: "https://i.imgur.com/8RK9k6O.png",
            profile: { bio: { text: "Building on Base." } },
            follower_count: 1200,
            following_count: 400,
            verifications: ["0xabc"],
            active_status: "inactive",
            status_label: "Inactive",
            talent_score: 45,
            spam_score: 10,
            spam_labels: []
        }
    ];
}
