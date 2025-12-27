'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, Crown, Users, Shield, Zap, ArrowLeft, ExternalLink, Award, Activity, Target, AlertTriangle, CheckCircle, XCircle, BarChart3, Globe } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';

interface OpenRankData {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
    power_badge: boolean;
}

interface OpenRankResult {
    user: OpenRankData;
    openrank: {
        score: number;
        display_score: string;
        rank: number | null;
        tier: string;
        tier_emoji: string;
        tier_color: string;
        tier_label: string;
    };
    spam_signal: {
        isSpam: boolean;
        confidence: string;
        reason: string;
    };
    top_followers?: any[];
}

interface RankingItem {
    rank: number;
    fid: number;
    score: number;
    display_score: string;
    tier: string;
    tier_emoji: string;
    tier_color: string;
    username: string;
    display_name: string;
    pfp_url: string | null;
    follower_count: number;
    power_badge: boolean;
}

const TIER_INFO = [
    { tier: 'Legendary', range: 'Top 0.01%', color: '#FFD700', emoji: '👑', desc: 'Platform legends with massive influence' },
    { tier: 'Elite', range: 'Top 0.1%', color: '#3B82F6', emoji: '💎', desc: 'Highly influential network nodes' },
    { tier: 'Influential', range: 'Top 1%', color: '#8B5CF6', emoji: '🔥', desc: 'Strong network with quality connections' },
    { tier: 'Established', range: 'Top 5%', color: '#10B981', emoji: '⭐', desc: 'Solid reputation and consistent engagement' },
    { tier: 'Growing', range: 'Top 20%', color: '#F59E0B', emoji: '🌱', desc: 'Building trust through interactions' },
    { tier: 'Active', range: 'Active', color: '#6B7280', emoji: '✅', desc: 'Participating in the network' }
];

export default function OpenRankPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTerm2, setSearchTerm2] = useState(''); // For comparison
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<OpenRankResult | null>(null);
    const [compareData, setCompareData] = useState<OpenRankResult | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'search' | 'leaderboard' | 'compare'>('search');
    const [rankings, setRankings] = useState<RankingItem[]>([]);
    const [loadingRankings, setLoadingRankings] = useState(false);
    const [followerRankings, setFollowerRankings] = useState<any[]>([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);

    // Load global rankings
    useEffect(() => {
        if (activeTab === 'leaderboard' && rankings.length === 0) {
            loadRankings();
        }
    }, [activeTab]);

    const loadRankings = async () => {
        setLoadingRankings(true);
        try {
            const response = await axios.get('/api/openrank?action=rankings&limit=50');
            if (response.data.success) {
                setRankings(response.data.rankings || []);
            }
        } catch (err) {
            console.error('Failed to load rankings:', err);
        } finally {
            setLoadingRankings(false);
        }
    };

    const searchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setUserData(null);
        setFollowerRankings([]);

        try {
            const response = await axios.get(`/api/openrank?fid=${searchTerm}`);
            if (response.data.success) {
                setUserData(response.data);
                // After getting user, fetch their top followers
                fetchTopFollowers(response.data.user.fid);
            } else {
                setError(response.data.error || 'User not found');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch OpenRank data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopFollowers = async (fid: number) => {
        setLoadingFollowers(true);
        try {
            const response = await axios.get(`/api/openrank?action=followers&fid=${fid}&limit=5`);
            if (response.data.success) {
                // For each follower FID, we'd ideally want usernames, but the API currently returns raw rankings
                setFollowerRankings(response.data.followers || []);
            }
        } catch (err) {
            console.error('Failed to fetch follower rankings:', err);
        } finally {
            setLoadingFollowers(false);
        }
    };

    const runComparison = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim() || !searchTerm2.trim()) return;

        setLoading(true);
        setError('');
        setUserData(null);
        setCompareData(null);

        try {
            const [res1, res2] = await Promise.all([
                axios.get(`/api/openrank?fid=${searchTerm}`),
                axios.get(`/api/openrank?fid=${searchTerm2}`)
            ]);

            if (res1.data.success && res2.data.success) {
                setUserData(res1.data);
                setCompareData(res2.data);
            } else {
                setError('One or both users not found');
            }
        } catch (err: any) {
            setError('Failed to compare users');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={20} /> Back
                </Link>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Globe size={40} color="#10B981" />
                    <h1 style={{ fontSize: '2.5rem' }} className="premium-gradient">OpenRank</h1>
                </div>
                <p style={{ color: 'var(--muted)', maxWidth: '700px', margin: '0 auto' }}>
                    <strong>Graph-based reputation</strong> for Farcaster. Measure
                    <span style={{ color: '#10B981' }}> trust that flows through genuine interactions</span>.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => { setActiveTab('search'); setUserData(null); setError(''); }}
                    style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        background: activeTab === 'search' ? 'var(--primary)' : 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        color: activeTab === 'search' ? 'white' : 'var(--muted)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <Search size={18} /> Search User
                </button>
                <button
                    onClick={() => { setActiveTab('compare'); setUserData(null); setCompareData(null); setError(''); }}
                    style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        background: activeTab === 'compare' ? 'var(--primary)' : 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        color: activeTab === 'compare' ? 'white' : 'var(--muted)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <Zap size={18} /> Compare Influence
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        background: activeTab === 'leaderboard' ? 'var(--primary)' : 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        color: activeTab === 'leaderboard' ? 'white' : 'var(--muted)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <Crown size={18} /> Leaderboard
                </button>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
                <>
                    <form onSubmit={searchUser} style={{ maxWidth: '500px', margin: '0 auto 3rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Enter FID (e.g. 1)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '1rem 1.5rem',
                                    borderRadius: '12px',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '0 2rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                                    color: 'white',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                Inspect
                            </button>
                        </div>
                    </form>

                    {error && (
                        <p style={{ textAlign: 'center', color: 'var(--danger)', marginBottom: '2rem' }}>{error}</p>
                    )}

                    {/* Result Card */}
                    {userData && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card"
                                style={{ padding: '2rem' }}
                            >
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                                    <img
                                        src={userData.user.pfp_url || 'https://via.placeholder.com/80'}
                                        alt=""
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '16px',
                                            border: `3px solid ${userData.openrank.tier_color}`
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                            <h2 style={{ fontSize: '1.5rem' }}>{userData.user.display_name}</h2>
                                            {userData.user.power_badge && (
                                                <Zap size={18} color="#7C3AED" />
                                            )}
                                        </div>
                                        <p style={{ color: 'var(--muted)' }}>@{userData.user.username} • FID: {userData.user.fid}</p>
                                    </div>
                                </div>

                                {/* Score Display */}
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    background: `linear-gradient(135deg, ${userData.openrank.tier_color}20, transparent)`,
                                    borderRadius: '16px',
                                    marginBottom: '1.5rem',
                                    border: `1px solid ${userData.openrank.tier_color}40`
                                }}>
                                    <p style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>OpenRank Score</p>
                                    <p style={{ fontSize: '4rem', fontWeight: 800, color: userData.openrank.tier_color }}>
                                        {userData.openrank.display_score}
                                    </p>
                                    <p style={{ fontSize: '1.5rem', color: userData.openrank.tier_color, marginTop: '0.5rem' }}>
                                        {userData.openrank.tier_emoji} {userData.openrank.tier}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                                        {userData.openrank.tier_label}
                                    </p>
                                </div>

                                {/* Spam Signal */}
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: userData.spam_signal.isSpam ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    border: `1px solid ${userData.spam_signal.isSpam ? '#EF4444' : '#10B981'}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}>
                                    {userData.spam_signal.isSpam ? (
                                        <XCircle size={24} color="#EF4444" />
                                    ) : (
                                        <CheckCircle size={24} color="#10B981" />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, color: userData.spam_signal.isSpam ? '#EF4444' : '#10B981' }}>
                                            {userData.spam_signal.isSpam ? '⚠️ Risk Detected' : '✅ Graph Verified'}
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{userData.spam_signal.reason}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Most Influential Followers */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-card"
                                style={{ padding: '1.5rem' }}
                            >
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                    <Users size={20} color="var(--primary)" />
                                    Top Follower Influence
                                </h3>

                                {loadingFollowers ? (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                                        <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto', color: 'var(--primary)' }} />
                                    </div>
                                ) : followerRankings.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {followerRankings.map((follower, i) => (
                                            <div key={follower.fid} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--card-border)'
                                            }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>FID {follower.fid}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Rank #{follower.rank}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{follower.display_score}</p>
                                                    <p style={{ fontSize: '0.7rem' }}>{follower.tier_emoji} {follower.tier}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                                            These 5 followers provide the most "reputation gravity" to @{userData.user.username}.
                                        </p>
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                                        No follower influence data available for this user.
                                    </p>
                                )}
                            </motion.div>
                        </div>
                    )}
                </>
            )}

            {/* Comparison Tab */}
            {activeTab === 'compare' && (
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <form onSubmit={runComparison} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                        <input
                            type="text"
                            placeholder="FID A"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '1rem', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', textAlign: 'center' }}
                        />
                        <div style={{ fontWeight: 800, color: 'var(--muted)' }}>VS</div>
                        <input
                            type="text"
                            placeholder="FID B"
                            value={searchTerm2}
                            onChange={(e) => setSearchTerm2(e.target.value)}
                            style={{ padding: '1rem', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', textAlign: 'center' }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                gridColumn: 'span 3',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #10B981, #7C3AED)',
                                color: 'white',
                                fontWeight: 700,
                                marginTop: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Compare Reputation Gravity'}
                        </button>
                    </form>

                    {userData && compareData && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* User A */}
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-card" style={{ padding: '1.5rem', border: userData.openrank.score > compareData.openrank.score ? '2px solid var(--primary)' : '1px solid var(--card-border)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <img src={userData.user.pfp_url || ''} style={{ width: '60px', height: '60px', borderRadius: '12px', marginBottom: '0.5rem' }} />
                                    <h3 style={{ fontSize: '1rem' }}>{userData.user.display_name}</h3>
                                    <p style={{ color: userData.openrank.tier_color, fontWeight: 700 }}>{userData.openrank.display_score}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>Rank</span>
                                        <span>#{userData.openrank.rank?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>Tier</span>
                                        <span>{userData.openrank.tier_emoji} {userData.openrank.tier}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>Followers</span>
                                        <span>{userData.user.follower_count?.toLocaleString()}</span>
                                    </div>
                                    {userData.openrank.score >= compareData.openrank.score && (
                                        <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Reputation Leader 👑
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* User B */}
                            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-card" style={{ padding: '1.5rem', border: compareData.openrank.score > userData.openrank.score ? '2px solid var(--primary)' : '1px solid var(--card-border)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <img src={compareData.user.pfp_url || ''} style={{ width: '60px', height: '60px', borderRadius: '12px', marginBottom: '0.5rem' }} />
                                    <h3 style={{ fontSize: '1rem' }}>{compareData.user.display_name}</h3>
                                    <p style={{ color: compareData.openrank.tier_color, fontWeight: 700 }}>{compareData.openrank.display_score}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>Rank</span>
                                        <span>#{compareData.openrank.rank?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>Tier</span>
                                        <span>{compareData.openrank.tier_emoji} {compareData.openrank.tier}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>Followers</span>
                                        <span>{compareData.user.follower_count?.toLocaleString()}</span>
                                    </div>
                                    {compareData.openrank.score > userData.openrank.score && (
                                        <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Reputation Leader 👑
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h3>🏆 Top 50 by OpenRank</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Most influential users on Farcaster by graph reputation</p>
                    </div>

                    {loadingRankings ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto', color: 'var(--primary)' }} />
                            <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Loading global rankings...</p>
                        </div>
                    ) : rankings.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {rankings.map((user, index) => (
                                <motion.div
                                    key={user.fid}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="glass-card"
                                    style={{
                                        padding: '1rem 1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        borderLeft: `4px solid ${user.tier_color}`
                                    }}
                                >
                                    {/* Rank */}
                                    <div style={{
                                        width: '40px',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        fontSize: user.rank <= 3 ? '1.5rem' : '1.1rem',
                                        color: user.rank === 1 ? '#FFD700' : user.rank === 2 ? '#C0C0C0' : user.rank === 3 ? '#CD7F32' : 'var(--muted)'
                                    }}>
                                        {user.rank === 1 && '🥇'}
                                        {user.rank === 2 && '🥈'}
                                        {user.rank === 3 && '🥉'}
                                        {user.rank > 3 && `#${user.rank}`}
                                    </div>

                                    {/* Avatar */}
                                    <img
                                        src={user.pfp_url || 'https://via.placeholder.com/40'}
                                        alt=""
                                        style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                                    />

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <p style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {user.display_name}
                                            </p>
                                            {user.power_badge && <Zap size={14} color="#7C3AED" />}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                            @{user.username} • {user.follower_count?.toLocaleString()} followers
                                        </p>
                                    </div>

                                    {/* Score */}
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 700, color: user.tier_color, fontSize: '1.1rem' }}>
                                            {user.display_score}
                                        </p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                                            {user.tier_emoji} {user.tier}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                            <p>No rankings data available</p>
                        </div>
                    )}
                </div>
            )}

            {/* What OpenRank Measures */}
            <div style={{ marginTop: '4rem', maxWidth: '900px', margin: '4rem auto 0' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>🧠 What Makes OpenRank Special?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {[
                        { icon: <Globe size={24} />, title: 'Graph-Based Reputation', desc: 'Trust flows through your network. Quality connections from respected accounts matter more than quantity.', color: '#10B981' },
                        { icon: <Shield size={24} />, title: 'Sybil Resistant', desc: 'Bot clusters and engagement farms have minimal graph influence. Real humans rise, bots stay low.', color: '#3B82F6' },
                        { icon: <TrendingUp size={24} />, title: 'Influence Propagation', desc: 'Interactions from high-OpenRank users boost your score. Build relationships that matter.', color: '#8B5CF6' },
                        { icon: <Users size={24} />, title: 'No Follower Bias', desc: 'Unlike Web2 metrics, OpenRank ignores vanity numbers. It measures real network trust.', color: '#F59E0B' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ color: item.color, marginBottom: '0.75rem' }}>{item.icon}</div>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tier Guide */}
            <div style={{ marginTop: '3rem', maxWidth: '900px', margin: '3rem auto 0' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>📊 OpenRank Tiers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {TIER_INFO.map((tier, i) => (
                        <div
                            key={i}
                            className="glass-card"
                            style={{
                                padding: '1.25rem',
                                borderLeft: `4px solid ${tier.color}`,
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tier.emoji}</div>
                            <p style={{ fontWeight: 700, color: tier.color, marginBottom: '0.25rem' }}>{tier.tier}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{tier.range}</p>
                            <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{tier.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Use Cases */}
            <div className="glass-card" style={{ padding: '2rem', marginTop: '3rem', maxWidth: '900px', margin: '3rem auto 0' }}>
                <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={20} color="#10B981" /> What You Can Build with OpenRank
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                        '🔍 Spam/inactive scanner',
                        '🏆 Influence leaderboards',
                        '🎯 Quality-based check-ins',
                        '🛡️ Anti-farming rewards',
                        '🧹 Follower cleanup tool',
                        '⭐ Premium access gating'
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                        }}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
