'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Coins, Users, Tv, RefreshCw, ExternalLink, Wallet, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrendingUser {
    fid: number;
    fname: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
    engagement_score: number;
    onchain_score: number;
}

interface TrendingChannel {
    channel_id: string;
    name: string;
    description: string;
    follower_count: number;
    cast_count_24h: number;
    growth_rate: number;
}

interface Memecoin {
    symbol: string;
    name: string;
    price_usd: number;
    price_change_24h: number;
    social_score: number;
    mention_count_24h: number;
    market_cap: number;
}

type TabType = 'trending' | 'channels' | 'memecoins';

export default function DuneInsights() {
    const [activeTab, setActiveTab] = useState<TabType>('trending');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [trendingUsers, setTrendingUsers] = useState<TrendingUser[]>([]);
    const [channels, setChannels] = useState<TrendingChannel[]>([]);
    const [memecoins, setMemecoins] = useState<Memecoin[]>([]);

    const fetchData = async (tab: TabType) => {
        setLoading(true);
        setError('');

        try {
            let action = '';
            switch (tab) {
                case 'trending': action = 'trending-users'; break;
                case 'channels': action = 'trending-channels'; break;
                case 'memecoins': action = 'memecoins'; break;
            }

            const response = await fetch(`/api/dune?action=${action}&limit=20`);
            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Failed to fetch data');
                return;
            }

            switch (tab) {
                case 'trending': setTrendingUsers(data.data || []); break;
                case 'channels': setChannels(data.data || []); break;
                case 'memecoins': setMemecoins(data.data || []); break;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch Dune data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    const formatPrice = (num: number) => {
        if (num < 0.001) return num.toExponential(2);
        if (num < 1) return num.toFixed(4);
        return num.toFixed(2);
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #FF6B35, #F7931A)',
                        padding: '0.5rem',
                        borderRadius: '10px'
                    }}>
                        <TrendingUp size={20} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>Dune Insights</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Real-time Farcaster analytics</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchData(activeTab)}
                    disabled={loading}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        background: 'var(--card-border)',
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                    { id: 'trending', label: 'Trending Users', icon: Users },
                    { id: 'channels', label: 'Channels', icon: Tv },
                    { id: 'memecoins', label: 'Memecoins', icon: Coins },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        style={{
                            flex: 1,
                            padding: '0.65rem 0.75rem',
                            borderRadius: '8px',
                            background: activeTab === tab.id ? 'var(--primary)' : 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            color: activeTab === tab.id ? 'white' : 'var(--muted)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <tab.icon size={14} />
                        <span className="hide-mobile">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Error State */}
            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--muted)'
                }}>
                    <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Loading Dune data...</p>
                </div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
                {!loading && !error && (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Trending Users */}
                        {activeTab === 'trending' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {trendingUsers.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                                        No trending users data available
                                    </p>
                                ) : (
                                    trendingUsers.map((user, index) => (
                                        <div
                                            key={user.fid}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '10px'
                                            }}
                                        >
                                            <span style={{
                                                width: '24px',
                                                textAlign: 'center',
                                                fontSize: '0.85rem',
                                                color: index < 3 ? 'var(--warning)' : 'var(--muted)',
                                                fontWeight: index < 3 ? 700 : 400
                                            }}>
                                                #{index + 1}
                                            </span>
                                            <img
                                                src={user.pfp_url || '/default-avatar.png'}
                                                alt=""
                                                style={{ width: '36px', height: '36px', borderRadius: '8px' }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {user.display_name || user.fname}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                    @{user.fname} • {formatNumber(user.follower_count)} followers
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                                                    {user.engagement_score?.toFixed(1) || '—'}
                                                </p>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>score</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Channels */}
                        {activeTab === 'channels' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {channels.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                                        No channel data available
                                    </p>
                                ) : (
                                    channels.map((channel, index) => (
                                        <div
                                            key={channel.channel_id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '10px'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.9rem',
                                                fontWeight: 700
                                            }}>
                                                {channel.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>/{channel.channel_id}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                    {formatNumber(channel.follower_count)} members • {formatNumber(channel.cast_count_24h)} casts/24h
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{
                                                    fontSize: '0.85rem',
                                                    color: channel.growth_rate > 0 ? 'var(--success)' : 'var(--danger)',
                                                    fontWeight: 600
                                                }}>
                                                    {channel.growth_rate > 0 ? '+' : ''}{channel.growth_rate?.toFixed(1) || 0}%
                                                </p>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>growth</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Memecoins */}
                        {activeTab === 'memecoins' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {memecoins.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                                        No memecoin data available
                                    </p>
                                ) : (
                                    memecoins.map((coin, index) => (
                                        <div
                                            key={coin.symbol}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '10px'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #F7931A, #FFD93D)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'black'
                                            }}>
                                                {coin.symbol?.slice(0, 3) || '?'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>${coin.symbol}</p>
                                                    {coin.social_score > 80 && (
                                                        <span style={{
                                                            background: 'rgba(168, 85, 247, 0.2)',
                                                            color: '#A855F7',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.6rem',
                                                            fontWeight: 600
                                                        }}>
                                                            🔥 HOT
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                    {formatNumber(coin.mention_count_24h)} mentions • MC: ${formatNumber(coin.market_cap)}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                    ${formatPrice(coin.price_usd)}
                                                </p>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    color: coin.price_change_24h >= 0 ? 'var(--success)' : 'var(--danger)',
                                                    fontWeight: 600
                                                }}>
                                                    {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h?.toFixed(1) || 0}%
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    Powered by Dune Analytics
                </p>
                <a
                    href="https://dune.com/browse/dashboards?q=farcaster"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        fontSize: '0.7rem',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}
                >
                    Explore more <ExternalLink size={10} />
                </a>
            </div>
        </div>
    );
}
