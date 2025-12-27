'use client';

import { useState } from 'react';
import { Search, Loader2, Award, Star, Zap, Shield, Trophy, Users, Code, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';

interface TalentData {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    talent_score: number;
    talent_builder_score?: number;
    talent_creator_score?: number;
    talent_passport_id?: string;
    is_verified: boolean;
    skills?: string[];
}

export default function TalentPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<TalentData | null>(null);
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

    const getTalentTier = (score: number) => {
        if (score >= 80) return { tier: 'Elite Builder', color: '#FFD700', emoji: '🏆' };
        if (score >= 60) return { tier: 'Senior Builder', color: '#C0C0C0', emoji: '⭐' };
        if (score >= 40) return { tier: 'Active Builder', color: '#CD7F32', emoji: '🔨' };
        if (score >= 20) return { tier: 'Emerging Builder', color: '#10B981', emoji: '🌱' };
        return { tier: 'New Builder', color: '#6B7280', emoji: '👤' };
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
                    <Trophy size={40} color="#FFD700" />
                    <h1 style={{ fontSize: '2.5rem' }} className="premium-gradient">Talent Builder Score</h1>
                </div>
                <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
                    Discover your builder reputation on Talent Protocol. Builder scores measure your onchain contributions, coding activity, and Web3 credibility.
                </p>
            </div>

            {/* Search */}
            <form onSubmit={searchUser} style={{ maxWidth: '500px', margin: '0 auto 3rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Enter FID or username..."
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
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: 'black',
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
                            style={{ width: '80px', height: '80px', borderRadius: '16px', border: '3px solid #FFD700' }}
                        />
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{userData.display_name}</h2>
                            <p style={{ color: 'var(--muted)' }}>@{userData.username} • FID: {userData.fid}</p>
                            {userData.is_verified && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#10B981',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    marginTop: '0.5rem'
                                }}>
                                    <Shield size={12} /> Verified Builder
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Score Display */}
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', marginBottom: '1.5rem' }}>
                        {userData.talent_score > 0 ? (
                            <>
                                <p style={{ fontSize: '4rem', fontWeight: 800, color: getTalentTier(userData.talent_score).color }}>
                                    {userData.talent_score}
                                </p>
                                <p style={{ fontSize: '1.25rem', color: getTalentTier(userData.talent_score).color, marginTop: '0.5rem' }}>
                                    {getTalentTier(userData.talent_score).emoji} {getTalentTier(userData.talent_score).tier}
                                </p>
                            </>
                        ) : (
                            <div>
                                <p style={{ fontSize: '2rem', color: 'var(--muted)' }}>No Score Yet</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                                    Create a Talent Passport to get your builder score
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Score Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,215,0,0.1)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.2)' }}>
                            <Code size={24} color="#FFD700" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>BUILDER SCORE</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFD700' }}>{userData.talent_builder_score || 0}</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <Star size={24} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>CREATOR SCORE</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{userData.talent_creator_score || 0}</p>
                        </div>
                    </div>

                    <a
                        href="https://passport.talentprotocol.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: 'black',
                            fontWeight: 700,
                            textDecoration: 'none'
                        }}
                    >
                        View on Talent Protocol <ExternalLink size={16} />
                    </a>
                </motion.div>
            )}

            {/* Info Section */}
            <div style={{ marginTop: '4rem', maxWidth: '800px', margin: '4rem auto 0' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>What is Talent Builder Score?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {[
                        { icon: <Code size={24} />, title: 'Code Contributions', desc: 'GitHub commits, repos, and open source work' },
                        { icon: <Users size={24} />, title: 'Social Graph', desc: 'Farcaster connections and engagement' },
                        { icon: <Zap size={24} />, title: 'Onchain Activity', desc: 'Wallet transactions and DeFi usage' },
                        { icon: <Shield size={24} />, title: 'Verification', desc: 'Linked accounts and identity proof' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ color: '#FFD700', marginBottom: '0.75rem' }}>{item.icon}</div>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
