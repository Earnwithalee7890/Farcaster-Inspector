'use client';

import { useState } from 'react';
import { Search, Loader2, Shield, Star, Award, Zap, ArrowLeft, ExternalLink, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';

interface NeynarData {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    neynar_score: number;
    power_badge: boolean;
    follower_count: number;
    following_count: number;
    trust_level: string;
    spam_score: number;
    spam_labels: string[];
    is_spam: boolean;
    account_age?: { days: number; label: string };
}

export default function NeynarPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<NeynarData | null>(null);
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

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return '#10B981';
        if (score >= 0.6) return '#3B82F6';
        if (score >= 0.4) return '#F59E0B';
        if (score >= 0.2) return '#EF4444';
        return '#6B7280';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 0.8) return 'Excellent';
        if (score >= 0.6) return 'Good';
        if (score >= 0.4) return 'Average';
        if (score >= 0.2) return 'Low';
        return 'Very Low';
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
                    <Shield size={40} color="#7C3AED" />
                    <h1 style={{ fontSize: '2.5rem' }} className="premium-gradient">Neynar Score</h1>
                </div>
                <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
                    Neynar's user quality score measures authenticity, engagement, and trust level on Farcaster. Detect spam accounts and verify quality users.
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
                            background: 'linear-gradient(135deg, #7C3AED, #2DD4BF)',
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
                    style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}
                >
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                        <img
                            src={userData.pfp_url || 'https://via.placeholder.com/80'}
                            alt=""
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '16px',
                                border: `3px solid ${userData.is_spam ? '#EF4444' : '#7C3AED'}`
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '1.5rem' }}>{userData.display_name}</h2>
                                {userData.power_badge && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                                        color: 'white',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700
                                    }}>
                                        ⚡ POWER USER
                                    </span>
                                )}
                            </div>
                            <p style={{ color: 'var(--muted)' }}>@{userData.username} • FID: {userData.fid}</p>
                            {userData.account_age && (
                                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{userData.account_age.label}</p>
                            )}
                        </div>
                    </div>

                    {/* Score Display */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        {/* Neynar Score */}
                        <div style={{
                            textAlign: 'center',
                            padding: '1.5rem',
                            background: `linear-gradient(135deg, ${getScoreColor(userData.neynar_score)}15, transparent)`,
                            borderRadius: '16px',
                            border: `1px solid ${getScoreColor(userData.neynar_score)}30`
                        }}>
                            <p style={{ fontSize: '3rem', fontWeight: 800, color: getScoreColor(userData.neynar_score) }}>
                                {(userData.neynar_score * 100).toFixed(0)}%
                            </p>
                            <p style={{ fontSize: '1rem', color: getScoreColor(userData.neynar_score) }}>
                                {getScoreLabel(userData.neynar_score)}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Neynar Score</p>
                        </div>

                        {/* Trust Level */}
                        <div style={{
                            textAlign: 'center',
                            padding: '1.5rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '16px'
                        }}>
                            <div style={{
                                fontSize: '2.5rem',
                                marginBottom: '0.5rem',
                                color: userData.trust_level === 'High' ? '#10B981' :
                                    userData.trust_level === 'Medium' ? '#F59E0B' : '#EF4444'
                            }}>
                                {userData.trust_level === 'High' && <CheckCircle size={48} />}
                                {userData.trust_level === 'Medium' && <AlertTriangle size={48} />}
                                {userData.trust_level === 'Low' && <XCircle size={48} />}
                            </div>
                            <p style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: userData.trust_level === 'High' ? '#10B981' :
                                    userData.trust_level === 'Medium' ? '#F59E0B' : '#EF4444'
                            }}>
                                {userData.trust_level} Trust
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Trust Level</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{userData.follower_count?.toLocaleString()}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Followers</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{userData.following_count?.toLocaleString()}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Following</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: userData.spam_score > 50 ? '#EF4444' : '#10B981' }}>
                                {userData.spam_score}%
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Spam Score</p>
                        </div>
                    </div>

                    {/* Spam Labels */}
                    {userData.spam_labels && userData.spam_labels.length > 0 && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '10px',
                            marginBottom: '1rem'
                        }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '0.5rem' }}>
                                ⚠️ Risk Signals Detected:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {userData.spam_labels.map((label, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            color: '#EF4444'
                                        }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        borderRadius: '10px',
                        background: userData.is_spam ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        border: `1px solid ${userData.is_spam ? '#EF4444' : '#10B981'}`
                    }}>
                        <p style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: userData.is_spam ? '#EF4444' : '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                            {userData.is_spam ? (
                                <><XCircle size={20} /> Flagged as Spam</>
                            ) : (
                                <><CheckCircle size={20} /> Appears Legitimate</>
                            )}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Info Section */}
            <div style={{ marginTop: '4rem', maxWidth: '800px', margin: '4rem auto 0' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>What Neynar Score Measures</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {[
                        { icon: <Shield size={24} />, title: 'Trust Level', desc: 'Based on account age, engagement patterns, and behavior' },
                        { icon: <Users size={24} />, title: 'Social Graph', desc: 'Quality of followers and following relationships' },
                        { icon: <Award size={24} />, title: 'Power Badge', desc: 'Earned through consistent high-quality contributions' },
                        { icon: <AlertTriangle size={24} />, title: 'Spam Detection', desc: 'Identifies bot-like behavior and fake accounts' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ color: '#7C3AED', marginBottom: '0.75rem' }}>{item.icon}</div>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
