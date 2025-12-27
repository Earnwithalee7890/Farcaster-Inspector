'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, Shield, Zap, Award, Globe, LogOut, User as UserIcon, Calendar, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchMyData = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`/api/inspect?fid=${user.fid}`);
            if (response.data.searchedUser) {
                setUserData(response.data.searchedUser);
            }
        } catch (err: any) {
            setError('Failed to load profile data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchMyData();
        }
    }, [isAuthenticated, user]);

    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={40} color="var(--primary)" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <UserIcon size={64} color="var(--muted)" style={{ marginBottom: '1.5rem' }} />
                <h1 style={{ marginBottom: '1rem' }}>Profile Section</h1>
                <p style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: '400px' }}>
                    Please sign in with Farcaster on the home page to view your reputation profile.
                </p>
                <Link href="/" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', borderRadius: '12px', textDecoration: 'none', color: 'white', fontWeight: 600 }}>
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: '2rem 2rem 8rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem' }} className="premium-gradient">My Reputation Profile</h1>
                <button
                    onClick={logout}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>

            {loading && !userData ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0' }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                    <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Calculating your reputation gravity...</p>
                </div>
            ) : userData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Header Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <img
                                src={userData.pfp_url}
                                alt=""
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '24px',
                                    border: '4px solid var(--primary)',
                                    boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)'
                                }}
                            />
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontSize: '2.25rem' }}>{userData.display_name}</h2>
                                    {userData.power_badge && <Zap size={24} color="var(--primary)" />}
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10B981',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>
                                        {userData.trust_level} Trust
                                    </span>
                                </div>
                                <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                    @{userData.username} • FID: {userData.fid}
                                </p>
                                <p style={{ fontSize: '1rem', color: '#ccc', lineHeight: '1.6' }}>
                                    {userData.profile?.bio?.text || 'No bio set'}
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                        <Calendar size={16} /> Joined: {userData.account_age?.label}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                        <CheckCircle size={16} color="#10B981" /> Last active: {userData.inactivity_days === 0 ? 'Today' : `${userData.inactivity_days}d ago`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Scores Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

                        {/* Neynar Trust */}
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #7C3AED' }}>
                            <Shield size={24} color="#7C3AED" style={{ margin: '0 auto 0.75rem' }} />
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>NEYNER TRUST</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{((userData.neynar_score || 0) * 100).toFixed(0)}%</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px' }}>Neynar reputation score</p>
                        </div>

                        {/* OpenRank Reputation */}
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: `4px solid ${userData.openrank_tier_color || '#10B981'}` }}>
                            <Globe size={24} color={userData.openrank_tier_color || '#10B981'} style={{ margin: '0 auto 0.75rem' }} />
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>OPENRANK</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: userData.openrank_tier_color || '#10B981' }}>
                                {userData.openrank_display_score || '0'}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px' }}>{userData.openrank_tier_emoji} {userData.openrank_tier} Tier</p>
                        </div>

                        {/* Talent Builder */}
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #FFD700' }}>
                            <Award size={24} color="#FFD700" style={{ margin: '0 auto 0.75rem' }} />
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>TALENT SCORE</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFD700' }}>{userData.talent_score || '0'}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px' }}>Onchain builder reputation</p>
                        </div>

                        {/* Quotient Score */}
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: `4px solid ${userData.quotient_tier_color || '#8B5CF6'}` }}>
                            <Zap size={24} color={userData.quotient_tier_color || '#8B5CF6'} style={{ margin: '0 auto 0.75rem' }} />
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>QUOTIENT</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: userData.quotient_tier_color || '#8B5CF6' }}>
                                {((userData.quotient_score || 0) * 100).toFixed(0)}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px' }}>{userData.quotient_tier_emoji} {userData.quotient_tier} Rank</p>
                        </div>

                    </div>

                    {/* Quick Links */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link href="/neynar" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--card-border)', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Shield size={16} /> Neynar Details
                        </Link>
                        <Link href="/openrank" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--card-border)', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Globe size={16} /> OpenRank Graph
                        </Link>
                        <Link href="/talent" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--card-border)', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Award size={16} /> Talent Builder
                        </Link>
                        <Link href="/quotient" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--card-border)', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Zap size={16} /> Quotient Analysis
                        </Link>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchMyData}
                        disabled={loading}
                        style={{
                            alignSelf: 'center',
                            padding: '0.75rem 2rem',
                            background: 'transparent',
                            border: '1px solid var(--card-border)',
                            borderRadius: '12px',
                            color: 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Update Reputation Stats
                    </button>

                </div>
            ) : null}

            {error && (
                <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '2rem' }}>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}
