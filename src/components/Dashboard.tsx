'use client';

import { useState } from 'react';
import { Search, Loader2, Trash2, AlertCircle, Award, Users, MessageCircle, Clock, Shield, Zap, List, User } from 'lucide-react';
import UserCard from './UserCard';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [fid, setFid] = useState('');
    const [batchFids, setBatchFids] = useState('');
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searchedUser, setSearchedUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'spam' | 'inactive' | 'trusted'>('all');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        const searchValue = mode === 'single' ? fid : batchFids;
        if (!searchValue.trim()) return;

        setLoading(true);
        setError('');
        setMessage('');
        setSearchedUser(null);
        setStats(null);

        try {
            const fidsToSearch = mode === 'batch'
                ? searchValue.split(/[\n,]/).map(f => f.trim()).filter(f => f).join(',')
                : searchValue.trim();

            const response = await axios.get(`/api/inspect?fid=${fidsToSearch}&batch=${mode === 'batch'}`);
            setResults(response.data.users || []);
            setSearchedUser(mode === 'single' ? response.data.searchedUser : null);
            setStats(response.data.stats || null);
            if (response.data.message) {
                setMessage(response.data.message);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch data.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(user => {
        if (filter === 'all') return true;
        if (filter === 'spam') return user.spam_score > 50;
        if (filter === 'inactive') return user.status_label === 'Inactive';
        if (filter === 'trusted') return user.trust_level === 'High' || user.power_badge;
        return true;
    });

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
                <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
                    Analyze Farcaster profiles for spam, activity, and trust.
                    Check single accounts or batch analyze up to 100 at once.
                </p>

                {/* Mode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setMode('single')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '10px',
                            background: mode === 'single' ? 'var(--primary)' : 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            color: mode === 'single' ? 'white' : 'var(--muted)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <User size={18} /> Single Profile
                    </button>
                    <button
                        onClick={() => setMode('batch')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '10px',
                            background: mode === 'batch' ? 'var(--primary)' : 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            color: mode === 'batch' ? 'white' : 'var(--muted)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <List size={18} /> Batch Analyze (up to 100)
                    </button>
                </div>

                <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {mode === 'single' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea
                                placeholder="Enter FIDs (one per line or comma-separated)&#10;&#10;Example:&#10;3&#10;2&#10;5650&#10;12345"
                                value={batchFids}
                                onChange={(e) => setBatchFids(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '150px',
                                    padding: '1rem 1.5rem',
                                    borderRadius: '12px',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'var(--font-mono)'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '12px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                {loading ? 'Analyzing...' : `Analyze ${batchFids.split(/[\n,]/).filter(f => f.trim()).length || 0} Accounts`}
                            </button>
                        </div>
                    )}
                </form>

                {error && (
                    <p style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} /> {error}
                    </p>
                )}
                {message && !error && (
                    <p style={{ marginTop: '1rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>{message}</p>
                )}
            </section>

            {/* Batch Stats Summary */}
            {stats && mode === 'batch' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <List size={20} /> Batch Analysis Summary
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderBottom: '3px solid var(--primary)' }}>
                                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.total}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Total Analyzed</p>
                            </div>
                            <div onClick={() => setFilter('spam')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderBottom: '3px solid var(--danger)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.spam}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>🚨 Spam Detected</p>
                            </div>
                            <div onClick={() => setFilter('inactive')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderBottom: '3px solid var(--warning)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.inactive}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>😴 Inactive</p>
                            </div>
                            <div onClick={() => setFilter('all')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderBottom: '3px solid var(--success)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{stats.healthy}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>✅ Healthy</p>
                            </div>
                            <div onClick={() => setFilter('trusted')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', borderBottom: '3px solid var(--secondary)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary)' }}>{stats.trusted}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>⚡ High Trust</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Single User Profile Card */}
            {searchedUser && mode === 'single' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
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
                                        <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600 }}>
                                            ⚡ POWER USER
                                        </span>
                                    )}
                                    <span style={{
                                        background: `${getTrustColor(searchedUser.trust_level)}20`,
                                        color: getTrustColor(searchedUser.trust_level),
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600
                                    }}>
                                        <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {searchedUser.trust_level} Trust
                                    </span>
                                </div>
                                <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                    @{searchedUser.username} • FID: {searchedUser.fid}
                                    {searchedUser.account_age && <span> • {searchedUser.account_age.label}</span>}
                                </p>
                                <p style={{ fontSize: '0.95rem', color: '#ccc' }}>{searchedUser.profile?.bio?.text || 'No bio'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{searchedUser.follower_count?.toLocaleString()}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Followers</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{searchedUser.following_count?.toLocaleString()}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Following</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{searchedUser.cast_stats?.total || 0}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Recent Casts</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{((searchedUser.neynar_score || 0) * 100).toFixed(0)}%</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Neynar Score</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{searchedUser.talent_score || 0}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Talent Score</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: searchedUser.inactivity_days > 30 ? 'var(--danger)' : 'var(--success)' }}>{searchedUser.inactivity_days || 0}d</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Since Active</p>
                            </div>
                        </div>

                        {searchedUser.spam_labels?.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 600 }}>⚠️ Risk Signals:</p>
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

            {/* Results Grid */}
            {results.length > 0 && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3 style={{ color: 'var(--muted)' }}>
                            {mode === 'batch' ? 'All Analyzed Accounts' : 'Analysis Results'}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {['all', 'trusted', 'inactive', 'spam'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '6px',
                                        background: filter === f ? 'var(--card-border)' : 'transparent',
                                        border: '1px solid var(--card-border)',
                                        color: filter === f ? 'white' : 'var(--muted)',
                                        fontSize: '0.8rem',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {f === 'all' ? `All (${results.length})` : f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {filteredResults.map((user, index) => (
                            <motion.div
                                key={user.fid}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: index * 0.02 }}
                            >
                                <UserCard user={user} />
                            </motion.div>
                        ))}
                    </div>

                    {filteredResults.length === 0 && (
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
