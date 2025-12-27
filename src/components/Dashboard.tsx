'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Search, Loader2, Trash2, AlertCircle, Users, Shield, Zap, List, User, LogOut, UserCheck, Ghost, ExternalLink, TrendingUp, Scan, AlertTriangle } from 'lucide-react';
import UserCard from './UserCard';
import DuneInsights from './DuneInsights';
import WalletProfile from './WalletProfile';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { user, isAuthenticated, login, logout, loading: authLoading, isInFrame, sdkReady } = useAuth();
    const [loginFid, setLoginFid] = useState('');
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
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [scanningFollowing, setScanningFollowing] = useState(false);
    const [followingResults, setFollowingResults] = useState<any[]>([]);
    const [followingStats, setFollowingStats] = useState<any>(null);
    const [showFollowingScan, setShowFollowingScan] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user?.fid) {
            setFid(user.fid.toString());
        }
    }, [isAuthenticated, user]);

    const handleLogin = async () => {
        if (!loginFid.trim()) return;
        await login(loginFid);
        setShowLoginModal(false);
    };

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

    // Scan user's following list for spam
    const [requiresManualMode, setRequiresManualMode] = useState(false);

    const scanMyFollowing = async () => {
        if (!user?.fid) return;

        setScanningFollowing(true);
        setFollowingResults([]);
        setFollowingStats(null);
        setError('');
        setRequiresManualMode(false);
        setShowFollowingScan(true);

        try {
            const response = await axios.get(`/api/following?fid=${user.fid}`);

            if (response.data.success) {
                setFollowingResults(response.data.users || []);
                setFollowingStats(response.data.stats);
                setMessage(response.data.message);
            } else if (response.data.requiresManualMode) {
                setRequiresManualMode(true);
                setError(response.data.hint || 'Feature requires Neynar paid plan');
            } else {
                setError(response.data.error || 'Failed to scan following');
            }
        } catch (err: any) {
            if (err.response?.data?.requiresManualMode) {
                setRequiresManualMode(true);
                setError(err.response.data.hint || 'Use Batch Analyze mode instead');
            } else {
                setError(err.response?.data?.error || 'Failed to scan your following list');
            }
        } finally {
            setScanningFollowing(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="premium-gradient">
                    Farcaster Inspector
                </h1>

                {!isAuthenticated ? (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                            Sign in with your Farcaster FID to analyze your profile and check accounts for spam.
                        </p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '12px',
                                background: 'var(--primary)',
                                color: 'white',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '1rem'
                            }}
                        >
                            <User size={20} /> Sign in with Farcaster
                        </button>
                    </div>
                ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="glass-card" style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                            <img src={user?.pfp_url || ''} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600 }}>{user?.display_name}</p>
                                <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>@{user?.username} • FID: {user?.fid}</p>
                            </div>
                            <button onClick={logout} style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--card-border)', color: 'var(--muted)' }}>
                                <LogOut size={16} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
                            Analyze your profile, check individual accounts, or batch analyze multiple FIDs.
                        </p>
                    </div>
                )}

                {/* Login Modal */}
                {showLoginModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                        onClick={() => setShowLoginModal(false)}
                    >
                        <div className="glass-card" style={{ maxWidth: '400px', padding: '2rem', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={24} color="var(--primary)" /> Sign In
                            </h3>
                            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                Enter your Farcaster FID to sign in. You can find it on your Warpcast profile.
                            </p>
                            <input
                                type="text"
                                placeholder="Enter your FID (e.g. 336080)"
                                value={loginFid}
                                onChange={(e) => setLoginFid(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    color: 'white',
                                    marginBottom: '1rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleLogin}
                                disabled={authLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {authLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                {authLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Quick Actions */}
                {isAuthenticated && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        {/* MAIN FEATURE: Scan My Following */}
                        <button
                            onClick={scanMyFollowing}
                            disabled={scanningFollowing}
                            className="glass-card glow-on-hover"
                            style={{
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: scanningFollowing ? 'wait' : 'pointer',
                                border: '2px solid var(--danger)',
                                background: 'rgba(239, 68, 68, 0.1)'
                            }}
                        >
                            {scanningFollowing ? <Loader2 size={20} className="animate-spin" color="var(--danger)" /> : <Scan size={20} color="var(--danger)" />}
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600, color: 'var(--danger)' }}>🔍 Scan My Following</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Find spam accounts to unfollow</p>
                            </div>
                        </button>

                        <button onClick={() => { setMode('single'); setFid(user?.fid?.toString() || ''); setShowFollowingScan(false); }} className="glass-card glow-on-hover" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid var(--primary)' }}>
                            <UserCheck size={20} color="var(--primary)" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: 600 }}>Check My Profile</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Analyze your account</p>
                            </div>
                        </button>

                        <button onClick={() => { setMode('batch'); setShowFollowingScan(false); }} className="glass-card glow-on-hover" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid var(--secondary)' }}>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowFollowingGuide(false)}>
                        <div className="glass-card" style={{ maxWidth: '500px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Ghost size={24} color="var(--warning)" /> Find Inactive Accounts
                            </h3>
                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>To check for inactive/spam accounts in your following:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>1</span>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Go to Warpcast</p>
                                            <a href={`https://warpcast.com/${user?.username}/following`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Open your following <ExternalLink size={12} /></a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>2</span>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Copy FIDs from profile URLs</p>
                                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>warpcast.com/~/profiles/<strong>FID</strong></p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>3</span>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>Paste FIDs in Batch Mode</p>
                                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Analyze up to 100 at once</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => { setShowFollowingGuide(false); setMode('batch'); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 600 }}>Go to Batch Mode</button>
                                <button onClick={() => setShowFollowingGuide(false)} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--card-border)', color: 'white' }}>Close</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Mode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => setMode('single')} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: mode === 'single' ? 'var(--primary)' : 'var(--card-bg)', border: '1px solid var(--card-border)', color: mode === 'single' ? 'white' : 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={18} /> Single
                    </button>
                    <button onClick={() => setMode('batch')} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: mode === 'batch' ? 'var(--primary)' : 'var(--card-bg)', border: '1px solid var(--card-border)', color: mode === 'batch' ? 'white' : 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <List size={18} /> Batch
                    </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {mode === 'single' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" placeholder="Enter FID (e.g. 3)" value={fid} onChange={(e) => setFid(e.target.value)} style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', fontSize: '1rem', outline: 'none' }} />
                            <button type="submit" disabled={loading} style={{ padding: '0 1.5rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />} Inspect
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea placeholder="Enter FIDs (one per line or comma-separated)" value={batchFids} onChange={(e) => setBatchFids(e.target.value)} style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-mono)' }} />
                            <button type="submit" disabled={loading} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                {loading ? 'Analyzing...' : `Analyze ${batchFids.split(/[\n,]/).filter(f => f.trim()).length || 0} Accounts`}
                            </button>
                        </div>
                    )}
                </form>

                {error && <p style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><AlertCircle size={14} /> {error}</p>}
                {message && !error && <p style={{ marginTop: '1rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>{message}</p>}
            </section>

            {/* Following Scan Results */}
            {showFollowingScan && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '2px solid var(--danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Scan size={24} color="var(--danger)" />
                                🔍 Your Following Analysis
                            </h3>
                            <button onClick={() => setShowFollowingScan(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--card-border)', color: 'var(--muted)', fontSize: '0.85rem' }}>
                                Close
                            </button>
                        </div>

                        {scanningFollowing && (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 1rem', color: 'var(--danger)' }} />
                                <p style={{ color: 'var(--muted)' }}>Scanning your following list for spam accounts...</p>
                            </div>
                        )}

                        {/* Manual Mode Fallback - when paid plan is required */}
                        {requiresManualMode && !scanningFollowing && (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <AlertTriangle size={40} style={{ margin: '0 auto 1rem', color: 'var(--warning)' }} />
                                <h4 style={{ marginBottom: '0.75rem', color: 'var(--warning)' }}>
                                    Automatic scanning requires API upgrade
                                </h4>
                                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                    But don't worry! You can still analyze accounts using <strong>Batch Analyze</strong> mode for FREE.
                                </p>

                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    textAlign: 'left',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h5 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>📋 How to check your following manually:</h5>
                                    <ol style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <li>Go to <a href={`https://warpcast.com/${user?.username}/following`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>your Warpcast following page</a></li>
                                        <li>Look for accounts with low followers or no profile picture</li>
                                        <li>Copy suspicious account FIDs and paste them in Batch Analyze</li>
                                        <li>We'll analyze them for spam indicators!</li>
                                    </ol>
                                </div>

                                <button
                                    onClick={() => { setShowFollowingScan(false); setMode('batch'); }}
                                    style={{
                                        padding: '1rem 2rem',
                                        borderRadius: '10px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <List size={20} />
                                    Go to Batch Analyze
                                </button>
                            </div>
                        )}

                        {followingStats && !scanningFollowing && (
                            <>
                                {/* Stats Summary */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--primary)' }}>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{followingStats.total}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Scanned</p>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '10px', borderBottom: '3px solid var(--danger)' }}>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{followingStats.spam}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>🚨 Spam</p>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', borderBottom: '3px solid var(--warning)' }}>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>{followingStats.suspicious}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>⚠️ Suspicious</p>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', borderBottom: '3px solid var(--success)' }}>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{followingStats.healthy}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>✅ Healthy</p>
                                    </div>
                                </div>

                                {/* Accounts to Review */}
                                {followingResults.filter(u => u.should_review).length > 0 && (
                                    <div>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <AlertTriangle size={18} />
                                            Accounts Worth Reviewing ({followingResults.filter(u => u.should_review).length})
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                                            {followingResults.filter(u => u.should_review).map((account: any) => (
                                                <div
                                                    key={account.fid}
                                                    className="glass-card"
                                                    style={{
                                                        padding: '1rem',
                                                        border: `1px solid ${account.status === 'spam' ? 'var(--danger)' : 'var(--warning)'}`,
                                                        background: account.status === 'spam' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                        <img
                                                            src={account.pfp_url || 'https://wrpcd.net/cdn-cgi/image/fit=contain,f=auto,w=144/https%3A%2F%2Fwarpcast.com%2F-%2Fimages%2Fdefault-avatar.png'}
                                                            alt=""
                                                            style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--card-border)' }}
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {account.display_name || account.username}
                                                            </p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                                @{account.username} • {account.follower_count} followers
                                                            </p>
                                                        </div>
                                                        <div style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            background: account.status === 'spam' ? 'var(--danger)' : 'var(--warning)',
                                                            color: 'white',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600
                                                        }}>
                                                            {account.status === 'spam' ? '🚨 SPAM' : '⚠️ CHECK'}
                                                        </div>
                                                    </div>

                                                    {/* Spam Indicators */}
                                                    {account.spam_indicators.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.75rem' }}>
                                                            {account.spam_indicators.map((indicator: string, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    style={{
                                                                        fontSize: '0.6rem',
                                                                        padding: '3px 6px',
                                                                        borderRadius: '4px',
                                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                                        color: 'var(--danger)'
                                                                    }}
                                                                >
                                                                    {indicator}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <a
                                                            href={`https://warpcast.com/${account.username}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.5rem',
                                                                borderRadius: '6px',
                                                                background: 'var(--card-border)',
                                                                color: 'white',
                                                                fontSize: '0.75rem',
                                                                textAlign: 'center',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            View Profile <ExternalLink size={12} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* All Clear */}
                                {followingResults.filter(u => u.should_review).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--success)' }}>
                                        <Shield size={40} style={{ margin: '0 auto 0.75rem' }} />
                                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your following list looks clean! 🎉</p>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No spam or suspicious accounts detected.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.section>
            )}

            {/* Batch Stats */}
            {stats && mode === 'batch' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>📊 Analysis Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--primary)' }}><p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.total}</p><p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Total</p></div>
                            <div onClick={() => setFilter('spam')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--danger)', cursor: 'pointer' }}><p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.spam}</p><p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>🚨 Spam</p></div>
                            <div onClick={() => setFilter('inactive')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--warning)', cursor: 'pointer' }}><p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.inactive}</p><p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>😴 Inactive</p></div>
                            <div onClick={() => setFilter('all')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--success)', cursor: 'pointer' }}><p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{stats.healthy}</p><p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>✅ Healthy</p></div>
                            <div onClick={() => setFilter('trusted')} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderBottom: '3px solid var(--secondary)', cursor: 'pointer' }}><p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--secondary)' }}>{stats.trusted}</p><p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>⚡ Trusted</p></div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Single User Profile */}
            {searchedUser && mode === 'single' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <img src={searchedUser.pfp_url || ''} alt="" style={{ width: '90px', height: '90px', borderRadius: '18px', border: '3px solid var(--primary)' }} />
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontSize: '1.5rem' }}>{searchedUser.display_name}</h2>
                                    {searchedUser.power_badge && <span style={{ background: 'var(--primary)', color: 'white', padding: '3px 8px', borderRadius: '15px', fontSize: '0.65rem' }}>⚡ POWER</span>}
                                    <span style={{ background: `${getTrustColor(searchedUser.trust_level)}20`, color: getTrustColor(searchedUser.trust_level), padding: '3px 8px', borderRadius: '15px', fontSize: '0.65rem' }}>{searchedUser.trust_level} Trust</span>
                                </div>
                                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>@{searchedUser.username} • FID: {searchedUser.fid} • {searchedUser.account_age?.label}</p>
                                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{searchedUser.profile?.bio?.text || 'No bio'}</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.6rem' }}>
                            {[{ label: 'Followers', value: searchedUser.follower_count?.toLocaleString() }, { label: 'Following', value: searchedUser.following_count?.toLocaleString() }, { label: 'Casts', value: searchedUser.cast_stats?.total || 0 }, { label: 'Neynar', value: `${((searchedUser.neynar_score || 0) * 100).toFixed(0)}%` }, { label: 'Talent', value: searchedUser.talent_score || 0 }, { label: 'Last Active', value: `${searchedUser.inactivity_days || 0}d`, color: searchedUser.inactivity_days > 30 ? 'var(--danger)' : 'var(--success)' }].map((stat, i) => (
                                <div key={i} style={{ textAlign: 'center', padding: '0.6rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}><p style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color || 'white' }}>{stat.value}</p><p style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{stat.label}</p></div>
                            ))}
                        </div>
                        {searchedUser.spam_labels?.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>⚠️ Risk Signals:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                                    {searchedUser.spam_labels.map((label: string, i: number) => <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '3px 6px', borderRadius: '4px' }}>{label}</span>)}
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
                                <button key={f} onClick={() => setFilter(f as any)} style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', background: filter === f ? 'var(--card-border)' : 'transparent', border: '1px solid var(--card-border)', color: filter === f ? 'white' : 'var(--muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{f}</button>
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
                    {filteredResults.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}><Trash2 size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} /><p>No users match this filter.</p></div>}
                </div>
            )}

            {/* Dune Analytics Section */}
            {isAuthenticated && (
                <section style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <TrendingUp size={24} color="var(--warning)" />
                        <h2 style={{ fontSize: '1.5rem' }}>Farcaster Analytics</h2>
                        <span style={{
                            background: 'linear-gradient(135deg, #FF6B35, #F7931A)',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}>DUNE</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        <DuneInsights />
                        <WalletProfile walletAddress={user?.pfp_url ? undefined : undefined} />
                    </div>
                </section>
            )}
        </div>
    );
}
