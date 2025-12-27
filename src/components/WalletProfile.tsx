'use client';

import { useState } from 'react';
import { Wallet, Award, Coins, Image, RefreshCw, Shield, TrendingUp, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface WalletLabel {
    name: string;
    color: string;
    icon: string;
}

interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    value_usd: number;
    chain: string;
}

interface NFTItem {
    collection: string;
    name: string;
    token_id: string;
    image_url?: string;
}

interface OnchainData {
    wallet_address: string;
    total_value_usd: number;
    labels: string[];
    tokens: TokenBalance[];
    nfts: NFTItem[];
    total_transactions: number;
    first_tx_date: string;
    dex_trades: number;
    defi_protocols: string[];
}

const LABEL_STYLES: Record<string, WalletLabel> = {
    'Whale': { name: 'Whale', color: '#3B82F6', icon: '🐋' },
    'DEX Trader': { name: 'DEX Trader', color: '#10B981', icon: '📊' },
    'Early Adopter': { name: 'Early Adopter', color: '#F59E0B', icon: '🌟' },
    'NFT Collector': { name: 'NFT Collector', color: '#8B5CF6', icon: '🖼️' },
    'DeFi Power User': { name: 'DeFi Power User', color: '#EC4899', icon: '💎' },
    'DAO Voter': { name: 'DAO Voter', color: '#06B6D4', icon: '🗳️' },
    'Builder': { name: 'Builder', color: '#EF4444', icon: '🔧' },
    'Airdrop Farmer': { name: 'Airdrop Farmer', color: '#84CC16', icon: '🌾' },
};

interface WalletProfileProps {
    walletAddress?: string;
    fid?: number;
}

export default function WalletProfile({ walletAddress, fid }: WalletProfileProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<OnchainData | null>(null);
    const [inputWallet, setInputWallet] = useState(walletAddress || '');

    const fetchWalletData = async (wallet: string) => {
        if (!wallet || wallet.length < 10) {
            setError('Please enter a valid wallet address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Fetch both portfolio and reputation data
            const [portfolioRes, reputationRes, labelsRes] = await Promise.all([
                fetch(`/api/dune?action=portfolio&wallet=${wallet}`),
                fetch(`/api/dune?action=onchain-reputation&wallet=${wallet}`),
                fetch(`/api/dune?action=wallet-labels&wallet=${wallet}`)
            ]);

            const portfolioData = await portfolioRes.json();
            const reputationData = await reputationRes.json();
            const labelsData = await labelsRes.json();

            // Combine data
            setData({
                wallet_address: wallet,
                total_value_usd: portfolioData.data?.total_value_usd || 0,
                tokens: portfolioData.data?.tokens || [],
                nfts: portfolioData.data?.nfts || [],
                labels: labelsData.data?.labels || reputationData.data?.labels || [],
                total_transactions: reputationData.data?.total_transactions || 0,
                first_tx_date: reputationData.data?.first_tx_date || '',
                dex_trades: reputationData.data?.dex_trades || 0,
                defi_protocols: reputationData.data?.defi_protocols || []
            });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch wallet data');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K';
        return '$' + num.toFixed(2);
    };

    const shortenAddress = (addr: string) => {
        return addr.slice(0, 6) + '...' + addr.slice(-4);
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    padding: '0.5rem',
                    borderRadius: '10px'
                }}>
                    <Wallet size={20} color="white" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>Onchain Profile</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Portfolio & reputation analysis</p>
                </div>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Enter wallet address (0x...)"
                    value={inputWallet}
                    onChange={(e) => setInputWallet(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchWalletData(inputWallet)}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={() => fetchWalletData(inputWallet)}
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        background: 'var(--primary)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                    Analyze
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {/* Results */}
            {data && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Wallet Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '10px',
                        marginBottom: '1rem'
                    }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Wallet</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                    {shortenAddress(data.wallet_address)}
                                </p>
                                <a
                                    href={`https://basescan.org/address/${data.wallet_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--primary)' }}
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Net Worth</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                                {formatNumber(data.total_value_usd)}
                            </p>
                        </div>
                    </div>

                    {/* Labels/Tags */}
                    {data.labels.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                <Award size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                Reputation Labels
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {data.labels.map((label, i) => {
                                    const style = LABEL_STYLES[label] || { color: 'var(--muted)', icon: '🏷️' };
                                    return (
                                        <span
                                            key={i}
                                            style={{
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: '20px',
                                                background: `${style.color}20`,
                                                color: style.color,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            {style.icon} {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.total_transactions.toLocaleString()}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Transactions</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.dex_trades}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>DEX Trades</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.defi_protocols.length}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>DeFi Protocols</p>
                        </div>
                    </div>

                    {/* Tokens */}
                    {data.tokens.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                <Coins size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                Top Holdings
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {data.tokens.slice(0, 5).map((token, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.5rem 0.75rem',
                                            background: 'rgba(0,0,0,0.15)',
                                            borderRadius: '6px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{token.symbol}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--muted)', background: 'var(--card-border)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {token.chain}
                                            </span>
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                                            {formatNumber(token.value_usd)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NFTs Preview */}
                    {data.nfts.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                <Image size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                NFT Collection ({data.nfts.length})
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {data.nfts.slice(0, 6).map((nft, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '8px',
                                            background: nft.image_url ? `url(${nft.image_url})` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            flexShrink: 0
                                        }}
                                        title={`${nft.collection} - ${nft.name}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Empty State */}
            {!data && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    <Wallet size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem' }}>Enter a wallet address to view onchain profile</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Get portfolio, reputation labels, and activity insights
                    </p>
                </div>
            )}
        </div>
    );
}
