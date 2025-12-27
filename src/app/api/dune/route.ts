import { NextRequest, NextResponse } from 'next/server';
import duneAPI from '@/lib/dune';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fid = searchParams.get('fid');
    const wallet = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!process.env.DUNE_API_KEY) {
        return NextResponse.json({
            error: 'Dune API key not configured',
            hint: 'Add DUNE_API_KEY to your environment variables'
        }, { status: 500 });
    }

    try {
        switch (action) {
            // ==================== Trending Data ====================
            case 'trending-users': {
                const users = await duneAPI.getTrendingUsers(limit);
                return NextResponse.json({
                    success: true,
                    data: users,
                    count: users?.length || 0
                });
            }

            case 'trending-channels': {
                const channels = await duneAPI.getTrendingChannels(limit);
                return NextResponse.json({
                    success: true,
                    data: channels,
                    count: channels?.length || 0
                });
            }

            case 'memecoins': {
                const memecoins = await duneAPI.getMemecoins(limit);
                return NextResponse.json({
                    success: true,
                    data: memecoins,
                    count: memecoins?.length || 0
                });
            }

            // ==================== User-Specific Data ====================
            case 'user-stats': {
                if (!fid) {
                    return NextResponse.json({ error: 'FID is required' }, { status: 400 });
                }
                const stats = await duneAPI.getUserStats(parseInt(fid));
                return NextResponse.json({
                    success: true,
                    data: stats
                });
            }

            case 'portfolio': {
                if (!wallet) {
                    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
                }
                const portfolio = await duneAPI.getUserPortfolio(wallet);
                return NextResponse.json({
                    success: true,
                    data: portfolio
                });
            }

            case 'onchain-reputation': {
                if (!wallet) {
                    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
                }
                const reputation = await duneAPI.getOnchainReputation(wallet);
                return NextResponse.json({
                    success: true,
                    data: reputation
                });
            }

            case 'wallet-labels': {
                if (!wallet) {
                    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
                }
                const labels = await duneAPI.getWalletLabels(wallet);
                return NextResponse.json({
                    success: true,
                    data: { wallet, labels }
                });
            }

            // ==================== Power Users ====================
            case 'power-users': {
                const powerUsers = await duneAPI.getPowerUsers(limit);
                return NextResponse.json({
                    success: true,
                    data: powerUsers,
                    count: powerUsers?.length || 0
                });
            }

            // ==================== Default: Return available actions ====================
            default: {
                return NextResponse.json({
                    success: true,
                    message: 'Dune API endpoint',
                    availableActions: [
                        { action: 'trending-users', params: ['limit'], description: 'Get trending Farcaster users' },
                        { action: 'trending-channels', params: ['limit'], description: 'Get trending Farcaster channels' },
                        { action: 'memecoins', params: ['limit'], description: 'Get Farcaster memecoins data' },
                        { action: 'user-stats', params: ['fid'], description: 'Get Dune stats for a Farcaster user' },
                        { action: 'portfolio', params: ['wallet'], description: 'Get wallet portfolio (tokens + NFTs)' },
                        { action: 'onchain-reputation', params: ['wallet'], description: 'Get onchain reputation labels' },
                        { action: 'wallet-labels', params: ['wallet'], description: 'Get simplified wallet labels' },
                        { action: 'power-users', params: ['limit'], description: 'Get Farcaster power user rankings' }
                    ],
                    exampleCalls: [
                        '/api/dune?action=trending-users&limit=10',
                        '/api/dune?action=memecoins&limit=20',
                        '/api/dune?action=portfolio&wallet=0x...',
                        '/api/dune?action=user-stats&fid=336080'
                    ]
                });
            }
        }
    } catch (error: any) {
        console.error('[Dune API] Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch Dune data'
        }, { status: 500 });
    }
}
