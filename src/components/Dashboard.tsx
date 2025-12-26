'use client';

import { useState } from 'react';
import { Search, Loader2, Trash2, Filter, AlertCircle } from 'lucide-react';
import UserCard from './UserCard';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const [fid, setFid] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'spam' | 'inactive'>('all');
    const [error, setError] = useState('');
    const [isMock, setIsMock] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fid) return;

        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`/api/inspect?fid=${fid}`);
            setResults(response.data.users);
            setIsMock(!!response.data.isMock);
        } catch (err: any) {
            setError('Failed to fetch data. Please check the FID and try again.');
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
    const highTrustCount = results.filter(u => (u.talent_score || 0) > 60).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="premium-gradient">
                    Farcaster Inspector
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Analyze your following list to find inactive accounts and potential bots.
                    Keep your feed high-signal.
                </p>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Enter FID (e.g. 3)"
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
                {isMock && (
                    <p style={{ marginTop: '1rem', color: 'var(--warning)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} />
                        Showing mock data (Neynar API Key not found)
                    </p>
                )}
                {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
            </section>

            {results.length > 0 && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '3px solid var(--primary)' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Analyzed</p>
                            <h2 style={{ fontSize: '2rem' }}>{results.length}</h2>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('spam')} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '3px solid var(--danger)', cursor: 'pointer' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Spam Detected</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--danger)' }}>{spamCount}</h2>
                        </div>
                        <div className="glass-card" onClick={() => setFilter('inactive')} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '3px solid var(--warning)', cursor: 'pointer' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Inactive</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--warning)' }}>{inactiveCount}</h2>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '3px solid var(--secondary)' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>High Reputation</p>
                            <h2 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>{highTrustCount}</h2>
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
                                Spam
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
