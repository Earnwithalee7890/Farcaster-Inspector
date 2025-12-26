'use client';

import { useState } from 'react';
import { Search, Loader2, Trash2, AlertCircle, Award, Users, MessageCircle, Heart, Repeat } from 'lucide-react';
import UserCard from './UserCard';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [fid, setFid] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searchedUser, setSearchedUser] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'spam' | 'inactive'>('all');
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
        if (filter === 'spam') return user.status_label === 'Spam';
        if (filter === 'inactive') return user.status_label === 'Inactive';
        return true;
    });

    const spamCount = results.filter(u => u.status_label === 'Spam').length;
    const inactiveCount = results.filter(u => u.status_label === 'Inactive').length;
    const highTrustCount = results.filter(u => (u.neynar_score || 0) > 0.8 || u.power_badge).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="premium-gradient">
                    Farcaster Inspector
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Analyze Farcaster profiles to detect spam, check reputation scores, and discover trusted builders.
                </p>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
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
                        Analyze
                    </button>
                </form>

                {error && (
                    <p style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                {message && !error && (
                    <p style={{ marginTop: '1rem', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                        {message}
                    </p>
                )}
            </section>

            {/* Searched User Profile Card */}
            {searchedUser && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '1rem' }}
                >
                    <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <img
                            src={searchedUser.pfp_url || 'https://wrpcd.net/cdn-cgi/image/fit=contain,f=auto,w=144/https%3A%2F%2Fwarpcast.com%2F-%2Fimages%2Fdefault-avatar.png'}
                            alt={searchedUser.username}
                            style={{ width: '100px', height: '100px', borderRadius: '20px', border: '3px solid var(--primary)' }}
                        />
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.75rem' }}>{searchedUser.display_name}</h2>
                                {searchedUser.power_badge && (
                                    <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                        ⚡ POWER USER
                                    </span>
                                )}
                            </div>
                            <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>@{searchedUser.username} • FID: {searchedUser.fid}</p>
                            <p style={{ fontSize: '0.95rem', color: '#ccc' }}>{searchedUser.profile?.bio?.text || 'No bio'}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', minWidth: '200px' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <Users size={20} style={{ marginBottom: '4px', color: 'var(--primary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.follower_count?.toLocaleString()}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Followers</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <Users size={20} style={{ marginBottom: '4px', color: 'var(--secondary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.following_count?.toLocaleString()}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Following</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <Award size={20} style={{ marginBottom: '4px', color: 'var(--warning)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{((searchedUser.neynar_score || 0) * 100).toFixed(0)}%</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Neynar Score</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <Award size={20} style={{ marginBottom: '4px', color: 'var(--secondary)' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{searchedUser.talent_score || 0}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Talent Score</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {results.length > 0 && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--muted)' }}>Active Farcaster Users (Sample Analysis)</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--primary)' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Analyzed</p>
                            <h2 style={{ fontSize: '1.75rem' }}>{results.length}</h2>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('spam')} style={{ padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--danger)', cursor: 'pointer' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Spam Risk</p>
                            <h2 style={{ fontSize: '1.75rem', color: 'var(--danger)' }}>{spamCount}</h2>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('inactive')} style={{ padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--warning)', cursor: 'pointer' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Inactive</p>
                            <h2 style={{ fontSize: '1.75rem', color: 'var(--warning)' }}>{inactiveCount}</h2>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--secondary)' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Power Users</p>
                            <h2 style={{ fontSize: '1.75rem', color: 'var(--secondary)' }}>{highTrustCount}</h2>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setFilter('all')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: filter === 'all' ? 'var(--card-border)' : 'transparent', border: '1px solid var(--card-border)', color: filter === 'all' ? 'white' : 'var(--muted)' }}
                            >
                                All Users
                            </button>
                            <button
                                onClick={() => setFilter('spam')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: filter === 'spam' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', border: '1px solid var(--card-border)', color: filter === 'spam' ? 'var(--danger)' : 'var(--muted)' }}
                            >
                                Spam Risk
                            </button>
                            <button
                                onClick={() => setFilter('inactive')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: filter === 'inactive' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', border: '1px solid var(--card-border)', color: filter === 'inactive' ? 'var(--warning)' : 'var(--muted)' }}
                            >
                                Inactive
                            </button>
                        </div>

                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                            Showing {filteredResults.length} users
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {filteredResults.map((user, index) => (
                            <motion.div
                                key={user.fid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <UserCard user={user} />
                            </motion.div>
                        ))}
                    </div>

                    {filteredResults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
                            <Trash2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No results match your filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
