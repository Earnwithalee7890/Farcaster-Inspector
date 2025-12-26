'use client';

import { useState } from 'react';
import { Search, Loader2, Trash2, AlertCircle, Award, Users, MessageCircle, Clock, Calendar, Shield, Zap } from 'lucide-react';
import UserCard from './UserCard';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [fid, setFid] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searchedUser, setSearchedUser] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'spam' | 'inactive' | 'trusted'>('all');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fid) return;

        setLoading(true);
        setError('');
        setMessage('');
        setSearchedUser(null);

        try {
            const response = await axios.get(`/api/inspect?fid=${fid}`);
            setResults(response.data.users || []);
            setSearchedUser(response.data.searchedUser || null);
            if (response.data.message) {
                setMessage(response.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch data. Please check the FID and try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(user => {
        if (filter === 'all') return true;
        if (filter === 'spam') return user.status_label === 'Spam' || user.spam_score > 50;
        if (filter === 'inactive') return user.status_label === 'Inactive' || user.inactivity_days > 30;
        if (filter === 'trusted') return user.trust_level === 'High' || user.power_badge;
        return true;
    });

    const spamCount = results.filter(u => u.spam_score > 50).length;
    const inactiveCount = results.filter(u => u.inactivity_days > 30).length;
    const trustedCount = results.filter(u => u.trust_level === 'High' || u.power_badge).length;

    const getTrustColor = (level: string) => {
        if (level === 'High') return 'var(--success)';
        if (level === 'Medium') return 'var(--warning)';
        if (level === 'Low') return 'var(--danger)';
        return 'var(--muted)';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));

        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="premium-gradient">
                    Farcaster Inspector
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Deep-dive into any Farcaster profile. Analyze activity, detect spam, and verify trust levels.
                </p>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' }}>
                    <input
                        type="text"
                        placeholder="Enter FID (e.g. 3 for dwr.eth)"
                        value={fid}
                        onChange={(e) => setFid(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0 1.5rem',
                            borderRadius: '12px',
                            background: 'var(--primary)',
                            color: 'white',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        Inspect
                    </button>
                </form>

                {error && (
                    <p style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} /> {error}
                    </p>
                )}
                {message && !error && (
                    <p style={{ marginTop: '1rem', color: 'var(--secondary)', fontSize: '0.85rem' }}>{message}</p>
                )}
            </section>

            {/* Main User Profile Card */}
            {searchedUser && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <img
                                src={searchedUser.pfp_url || 'https://wrpcd.net/cdn-cgi/image/fit=contain,f=auto,w=144/https%3A%2F%2Fwarpcast.com%2F-%2Fimages%2Fdefault-avatar.png'}
                                alt={searchedUser.username}
                                style={{ width: '100px', height: '100px', borderRadius: '20px', border: '3px solid var(--primary)' }}
                            />
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontSize: '1.75rem' }}>{searchedUser.display_name}</h2>
                                    {searchedUser.power_badge && (
                                        <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Zap size={12} /> POWER USER
                                        </span>
                                    )}
                                    <span style={{
                                        background: `${getTrustColor(searchedUser.trust_level)}20`,
                                        color: getTrustColor(searchedUser.trust_level),
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Shield size={12} /> {searchedUser.trust_level} Trust
                                    </span>
                                </div>
                                <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                    @{searchedUser.username} • FID: {searchedUser.fid}
                                    {searchedUser.account_age && <span> • {searchedUser.account_age.label}</span>}
                                </p>
                                <p style={{ fontSize: '0.95rem', color: '#ccc' }}>{searchedUser.profile?.bio?.text || 'No bio'}</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                <Users size={20} style={{ marginBottom: '4px', color: 'var(--primary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.follower_count?.toLocaleString()}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Followers</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                <Users size={20} style={{ marginBottom: '4px', color: 'var(--secondary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.following_count?.toLocaleString()}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Following</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                <MessageCircle size={20} style={{ marginBottom: '4px', color: 'var(--warning)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.cast_stats?.total || 0}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Recent Casts</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                <Award size={20} style={{ marginBottom: '4px', color: 'var(--primary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{((searchedUser.neynar_score || 0) * 100).toFixed(0)}%</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Neynar Score</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                <Zap size={20} style={{ marginBottom: '4px', color: 'var(--secondary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.talent_score || 0}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Talent Score</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                                <Clock size={20} style={{ marginBottom: '4px', color: searchedUser.inactivity_days > 30 ? 'var(--danger)' : 'var(--success)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.inactivity_days || 0}d</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Last Active</p>
                            </div>
                        </div>

                        {/* Recent Casts */}
                        {searchedUser.recent_casts && searchedUser.recent_casts.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageCircle size={16} /> Recent Activity
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {searchedUser.recent_casts.slice(0, 3).map((cast: any, i: number) => (
                                        <div key={i} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#ddd', marginBottom: '0.25rem' }}>
                                                {cast.text?.slice(0, 150)}{cast.text?.length > 150 ? '...' : ''}
                                            </p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                                                {formatTimeAgo(cast.timestamp)} • ❤️ {cast.reactions?.likes_count || 0} • 🔁 {cast.reactions?.recasts_count || 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Spam Analysis */}
                        {searchedUser.spam_labels && searchedUser.spam_labels.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 600 }}>⚠️ Risk Signals Detected:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {searchedUser.spam_labels.map((label: string, i: number) => (
                                        <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px' }}>
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Sample Users Grid */}
            {results.length > 1 && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--muted)' }}>Farcaster Power Users (Sample Analysis)</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div className="glass-card" onClick={() => setFilter('all')} style={{ padding: '1rem', textAlign: 'center', borderBottom: '3px solid var(--primary)', cursor: 'pointer' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{results.length}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Analyzed</p>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('trusted')} style={{ padding: '1rem', textAlign: 'center', borderBottom: '3px solid var(--success)', cursor: 'pointer' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{trustedCount}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>High Trust</p>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('inactive')} style={{ padding: '1rem', textAlign: 'center', borderBottom: '3px solid var(--warning)', cursor: 'pointer' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{inactiveCount}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Inactive</p>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('spam')} style={{ padding: '1rem', textAlign: 'center', borderBottom: '3px solid var(--danger)', cursor: 'pointer' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{spamCount}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Spam Risk</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {['all', 'trusted', 'inactive', 'spam'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: filter === f ? 'var(--card-border)' : 'transparent',
                                    border: '1px solid var(--card-border)',
                                    color: filter === f ? 'white' : 'var(--muted)',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {f === 'all' ? 'All Users' : f}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {filteredResults.slice(1).map((user, index) => (
                            <motion.div
                                key={user.fid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                            >
                                <UserCard user={user} />
                            </motion.div>
                        ))}
                    </div>

                    {filteredResults.length <= 1 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                            <Trash2 size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                            <p>No users match this filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
