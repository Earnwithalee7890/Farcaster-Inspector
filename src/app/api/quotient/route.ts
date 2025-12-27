import { NextRequest, NextResponse } from 'next/server';
import quotientAPI, { getQuotientTier, getQuotientTierColor, getQuotientTierEmoji } from '@/lib/quotient';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get('fid');
    const fidsParam = searchParams.get('fids');

    if (!process.env.QUOTIENT_API_KEY) {
        return NextResponse.json({
            error: 'Quotient API key not configured',
            hint: 'Add QUOTIENT_API_KEY to your environment variables'
        }, { status: 500 });
    }

    try {
        // Handle single FID
        if (fidParam) {
            const fid = parseInt(fidParam);
            if (isNaN(fid)) {
                return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
            }

            const reputation = await quotientAPI.getUserReputation(fid);

            if (!reputation) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    ...reputation,
                    tier_color: getQuotientTierColor(reputation.tier),
                    tier_emoji: getQuotientTierEmoji(reputation.tier)
                }
            });
        }

        // Handle multiple FIDs
        if (fidsParam) {
            const fids = fidsParam.split(',')
                .map(f => parseInt(f.trim()))
                .filter(f => !isNaN(f))
                .slice(0, 1000);

            if (fids.length === 0) {
                return NextResponse.json({ error: 'No valid FIDs provided' }, { status: 400 });
            }

            const reputations = await quotientAPI.getUserReputations(fids);

            if (!reputations) {
                return NextResponse.json({ error: 'Failed to fetch reputations' }, { status: 500 });
            }

            // Enrich with colors and emojis
            const enrichedReputations = reputations.map(rep => ({
                ...rep,
                tier_color: getQuotientTierColor(rep.tier),
                tier_emoji: getQuotientTierEmoji(rep.tier)
            }));

            return NextResponse.json({
                success: true,
                data: enrichedReputations,
                count: enrichedReputations.length,
                tiers: {
                    exceptional: enrichedReputations.filter(r => r.tier === 'Exceptional').length,
                    elite: enrichedReputations.filter(r => r.tier === 'Elite').length,
                    influential: enrichedReputations.filter(r => r.tier === 'Influential').length,
                    active: enrichedReputations.filter(r => r.tier === 'Active').length,
                    casual: enrichedReputations.filter(r => r.tier === 'Casual').length,
                    inactive: enrichedReputations.filter(r => r.tier === 'Inactive').length
                }
            });
        }

        // No FID provided - return API info
        return NextResponse.json({
            success: true,
            message: 'Quotient Score API',
            description: 'Get Quotient reputation scores for Farcaster users',
            tiers: [
                { tier: 'Exceptional', range: '0.9+', description: 'Platform superstars', emoji: '⭐' },
                { tier: 'Elite', range: '0.8-0.9', description: 'Top performers', emoji: '💎' },
                { tier: 'Influential', range: '0.7-0.8', description: 'High engagement', emoji: '🔥' },
                { tier: 'Active', range: '0.6-0.7', description: 'Regular participants', emoji: '✅' },
                { tier: 'Casual', range: '0.5-0.6', description: 'Occasional users', emoji: '👤' },
                { tier: 'Inactive', range: '<0.5', description: 'Bots or dormant', emoji: '💤' }
            ],
            endpoints: [
                { path: '/api/quotient?fid=3', description: 'Get score for single FID' },
                { path: '/api/quotient?fids=3,194,5650', description: 'Get scores for multiple FIDs (up to 1000)' }
            ]
        });

    } catch (error: any) {
        console.error('[Quotient API] Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch Quotient data'
        }, { status: 500 });
    }
}
