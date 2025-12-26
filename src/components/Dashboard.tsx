'use client';

import { useState, useEffect } from 'react';
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { Search, Loader2, Trash2, AlertCircle, Users, Shield, Zap, List, User, LogOut, UserCheck, Ghost, AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import UserCard from './UserCard';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { user, isAuthenticated } = useNeynarContext();
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
    const [showFollowingGuide, setShowFollowingGuide] = useState(false);

    // Auto-set FID when user logs in
    useEffect(() => {
        if (isAuthenticated && user?.fid) {
            setFid(user.fid.toString());
        }
    }, [isAuthenticated, user]);

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
            if (response.data.message) setMessage(response.data.message);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header with Auth */}
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="premium-gradient">
                    Farcaster Inspector
                </h1>

                {!isAuthenticated ? (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                            Sign in with Farcaster to analyze your profile and check accounts for spam.
                        </p>
                        <NeynarAuthButton />
                    </div>
                ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="glass-card" style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                            <img
                                src={user?.pfp_url || ''}
                                alt={user?.username || ''}
                                style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                            />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600 }}>{user?.display_name}</p>
                                <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>@{user?.username} • FID: {user?.fid}</p>
                            </div>
                            <NeynarAuthButton />
                        </div>

                        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
                            Analyze your profile, check individual accounts, or batch analyze multiple FIDs.
                        </p>
                    </div>
                )}

                {/* Quick Actions for Logged-in Users */}
                {isAuthenticated && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <button
                            onClick={() => { setMode('single'); setFid(user?.fid?.toString() || ''); }}
                            className="glass-card glow-on-hover"
                            style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid var(--primary)' }}
                        >
                            <UserCheck size={20} color="var(--primary)" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600 }}>Check My Profile</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Analyze your own account</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowFollowingGuide(true)}
                            className="glass-card glow-on-hover"
                            style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid var(--warning)' }}
                        >
                            <Ghost size={20} color="var(--warning)" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600 }}>Find Inactive Following</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Check who you follow</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('batch')}
                            className="glass-card glow-on-hover"
                            style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid var(--secondary)' }}
                        >
                            <List size={20} color="var(--secondary)" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600 }}>Batch Analyze</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Check up to 100 accounts</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Following Guide Modal */}
                {showFollowingGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={() => setShowFollowingGuide(false)}
                    >
                        <div
                            className="glass-card"
                            style={{ maxWidth: '500px', padding: '2rem' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Ghost size={24} color="var(--warning)" /> Find Inactive Accounts You Follow
                            </h3>

                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                                    To check for inactive/spam accounts in your following list:
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>1</span>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Go to Warpcast</p>
                                            <a href={`https://warpcast.com/${user?.username}/following`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                Open your following list <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>2</span>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Find FIDs of accounts to check</p>
                                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Click on profiles, the FID is in their profile URL</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>3</span>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Paste FIDs here</p>
                                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Use Batch Mode to analyze up to 100 at once</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => { setShowFollowingGuide(false); setMode('batch'); }}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 600 }}
                                >
                                    Go to Batch Mode
                                </button>
                                <button
                                    onClick={() => setShowFollowingGuide(false)}
                                    style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--card-border)', color: 'white' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

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
                        <List size={18} /> Batch Analyze
                    </button>
                </div>

                {/* Search Form */}
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
                                placeholder="Enter FIDs (one per line or comma-separated)&#10;&#10;Example:&#10;3&#10;2&#10;5650"
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--primary)' }}>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.total}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Total</p>
                            </div>
                            <div onClick={() => setFilter('spam')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--danger)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.spam}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>🚨 Spam</p>
                            </div>
                            <div onClick={() => setFilter('inactive')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--warning)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.inactive}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>😴 Inactive</p>
                            </div>
                            <div onClick={() => setFilter('all')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--success)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{stats.healthy}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>✅ Healthy</p>
                            </div>
                            <div onClick={() => setFilter('trusted')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--secondary)', cursor: 'pointer' }}>
                                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--secondary)' }}>{stats.trusted}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>⚡ Trusted</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Single User Profile */}
            {searchedUser && mode === 'single' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <img
                                src={searchedUser.pfp_url || 'https://wrpcd.net/cdn-cgi/image/fit=contain,f=auto,w=144/https%3A%2F%2Fwarpcast.com%2F-%2Fimages%2Fdefault-avatar.png'}
                                alt={searchedUser.username}
                                style={{ width: '90px', height: '90px', borderRadius: '18px', border: '3px solid var(--primary)' }}
                            />
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontSize: '1.5rem' }}>{searchedUser.display_name}</h2>
                                    {searchedUser.power_badge && (
                                        <span style={{ background: 'var(--primary)', color: 'white', padding: '3px 8px', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 600 }}>⚡ POWER</span>
                                    )}
                                    <span style={{ background: `${getTrustColor(searchedUser.trust_level)}20`, color: getTrustColor(searchedUser.trust_level), padding: '3px 8px', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 600 }}>
                                        {searchedUser.trust_level} Trust
                                    </span>
                                </div>
                                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                    @{searchedUser.username} • FID: {searchedUser.fid} • {searchedUser.account_age?.label}
                                </p>
                                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{searchedUser.profile?.bio?.text || 'No bio'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.6rem' }}>
                            {[
                                { label: 'Followers', value: searchedUser.follower_count?.toLocaleString() },
                                { label: 'Following', value: searchedUser.following_count?.toLocaleString() },
                                { label: 'Casts', value: searchedUser.cast_stats?.total || 0 },
                                { label: 'Neynar', value: `${((searchedUser.neynar_score || 0) * 100).toFixed(0)}%` },
                                { label: 'Talent', value: searchedUser.talent_score || 0 },
                                { label: 'Last Active', value: `${searchedUser.inactivity_days || 0}d`, color: searchedUser.inactivity_days > 30 ? 'var(--danger)' : 'var(--success)' },
                            ].map((stat, i) => (
                                <div key={i} style={{ textAlign: 'center', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color || 'white' }}>{stat.value}</p>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {searchedUser.spam_labels?.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>⚠️ Risk Signals:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                                    {searchedUser.spam_labels.map((label: string, i: number) => (
                                        <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '3px 6px', borderRadius: '4px' }}>{label}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Results Grid */}
            {results.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Results</h3>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {['all', 'trusted', 'inactive', 'spam'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', background: filter === f ? 'var(--card-border)' : 'transparent', border: '1px solid var(--card-border)', color: filter === f ? 'white' : 'var(--muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {filteredResults.map((user, index) => (
                            <motion.div key={user.fid} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.02 }}>
                                <UserCard user={user} />
                            </motion.div>
                        ))}
                    </div>

                    {filteredResults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                            <Trash2 size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>No users match this filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
