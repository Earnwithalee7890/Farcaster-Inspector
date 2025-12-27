'use client';

import { useState } from 'react';
import { Search, Loader2, TrendingUp, Award, Star, Zap, ArrowLeft, ExternalLink, Users, Activity, Target } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';

interface QuotientData {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    quotient_score: number | null;
    quotient_rank: number | null;
    quotient_tier: string | null;
    quotient_tier_color: string | null;
    quotient_tier_emoji: string | null;
}

const TIER_INFO = [
    { tier: 'Exceptional', range: '90-100%', color: '#10B981', emoji: '⭐', desc: 'Top 1% - Platform superstars' },
    { tier: 'Elite', range: '80-90%', color: '#3B82F6', emoji: '💎', desc: 'Top 5% - Highly influential' },
    { tier: 'Influential', range: '70-80%', color: '#8B5CF6', emoji: '🔥', desc: 'Top 15% - Strong engagement' },
    { tier: 'Active', range: '60-70%', color: '#F59E0B', emoji: '✅', desc: 'Top 30% - Regular contributors' },
    { tier: 'Casual', range: '50-60%', color: '#6B7280', emoji: '👤', desc: 'Occasional participants' },
    { tier: 'Inactive', range: '<50%', color: '#EF4444', emoji: '💤', desc: 'Low activity or dormant' }
];

export default function QuotientPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<QuotientData | null>(null);
    const [error, setError] = useState('');

    const searchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setUserData(null);

        try {
            const response = await axios.get(`/api/inspect?fid=${searchTerm}`);
            if (response.data.searchedUser) {
                setUserData(response.data.searchedUser);
            } else {
                setError('User not found');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch user data');
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
                    <TrendingUp size={40} color="#8B5CF6" />
                    <h1 style={{ fontSize: '2.5rem' }} className="premium-gradient">Quotient Score</h1>
                </div>
                <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
                    Measure your momentum and relevance on Farcaster. Quotient analyzes engagement quality, recency, and genuine interaction patterns.
                </p>
            </div>

            {/* Search */}
            <form onSubmit={searchUser} style={{ maxWidth: '500px', margin: '0 auto 3rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Enter FID..."
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
                            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                            color: 'white',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        Search
                    </button>
                </div>
            </form>

            {error && (
                <p style={{ textAlign: 'center', color: 'var(--danger)', marginBottom: '2rem' }}>{error}</p>
            )}

            {/* Result Card */}
            {userData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}
                >
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                        <img
                            src={userData.pfp_url || 'https://via.placeholder.com/80'}
                            alt=""
                            style={{ width: '80px', height: '80px', borderRadius: '16px', border: `3px solid ${userData.quotient_tier_color || '#8B5CF6'}` }}
                        />
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{userData.display_name}</h2>
                            <p style={{ color: 'var(--muted)' }}>@{userData.username} • FID: {userData.fid}</p>
                        </div>
                    </div>

                    {/* Score Display */}
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: `linear-gradient(135deg, ${userData.quotient_tier_color || '#8B5CF6'}15, ${userData.quotient_tier_color || '#8B5CF6'}05)`,
                        borderRadius: '16px',
                        marginBottom: '1.5rem',
                        border: `1px solid ${userData.quotient_tier_color || '#8B5CF6'}30`
                    }}>
                        {userData.quotient_score ? (
                            <>
                                <p style={{ fontSize: '4rem', fontWeight: 800, color: userData.quotient_tier_color || '#8B5CF6' }}>
                                    {(userData.quotient_score * 100).toFixed(0)}%
                                </p>
                                <p style={{ fontSize: '1.25rem', color: userData.quotient_tier_color || '#8B5CF6', marginTop: '0.5rem' }}>
                                    {userData.quotient_tier_emoji} {userData.quotient_tier}
                                </p>
                                {userData.quotient_rank && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                                        Rank #{userData.quotient_rank.toLocaleString()}
                                    </p>
                                )}
                            </>
                        ) : (
                            <div>
                                <p style={{ fontSize: '2rem', color: 'var(--muted)' }}>No Score Available</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                                    Quotient score not yet calculated for this user
                                </p>
                            </div>
                        )}
                    </div>

                    {/* What Quotient Measures */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(139,92,246,0.1)', borderRadius: '10px' }}>
                            <Activity size={20} color="#8B5CF6" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Engagement</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(236,72,153,0.1)', borderRadius: '10px' }}>
                            <Target size={20} color="#EC4899" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Recency</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '10px' }}>
                            <Users size={20} color="#3B82F6" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Authenticity</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tier Guide */}
            <div style={{ marginTop: '4rem', maxWidth: '800px', margin: '4rem auto 0' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Quotient Score Tiers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {TIER_INFO.map((tier, i) => (
                        <div
                            key={i}
                            className="glass-card"
                            style={{
                                padding: '1.25rem',
                                borderLeft: `4px solid ${tier.color}`
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>{tier.emoji}</span>
                                <p style={{ fontWeight: 700, color: tier.color }}>{tier.tier}</p>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{tier.range}</p>
                            <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{tier.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="glass-card" style={{ padding: '2rem', marginTop: '3rem', maxWidth: '800px', margin: '3rem auto 0' }}>
                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} color="#8B5CF6" /> How Quotient Score Works
                </h4>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    <p style={{ marginBottom: '1rem' }}>
                        Unlike follower counts, Quotient measures your <strong>real engagement momentum</strong>:
                    </p>
                    <ul style={{ paddingLeft: '1.25rem' }}>
                        <li>Quality over quantity - meaningful interactions matter more</li>
                        <li>Recency weighted - recent activity is prioritized</li>
                        <li>Spam resistant - ignores fake engagement patterns</li>
                        <li>Dynamic - updates as your activity changes</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
