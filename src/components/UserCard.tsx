import { ExternalLink, AlertTriangle, UserX, CheckCircle, Award, Zap, Shield, Clock, Calendar } from 'lucide-react';

interface UserCardProps {
    user: any;
}

export default function UserCard({ user }: UserCardProps) {
    const isSpam = user.spam_score > 50;
    const isInactive = user.inactivity_days > 30;
    const isPowerUser = user.power_badge;
    const isHighTrust = user.trust_level === 'High';

    const getBorderColor = () => {
        if (isSpam) return 'var(--danger)';
        if (isInactive) return 'var(--warning)';
        if (isHighTrust || isPowerUser) return 'var(--success)';
        return 'var(--glass-border)';
    };

    const getTrustColor = (level: string) => {
        if (level === 'High') return 'var(--success)';
        if (level === 'Medium') return 'var(--warning)';
        if (level === 'Low') return 'var(--danger)';
        return 'var(--muted)';
    };

    const getStatusIcon = () => {
        if (isSpam) return <UserX size={14} color="var(--danger)" />;
        if (isInactive) return <AlertTriangle size={14} color="var(--warning)" />;
        if (isHighTrust) return <Shield size={14} color="var(--success)" />;
        if (isPowerUser) return <Zap size={14} color="var(--secondary)" />;
        return <CheckCircle size={14} color="var(--success)" />;
    };

    const getStatusLabel = () => {
        if (isSpam) return 'Spam Risk';
        if (isInactive) return 'Inactive';
        if (isPowerUser) return 'Power User';
        if (isHighTrust) return 'Trusted';
        return 'Healthy';
    };

    return (
        <div className="glass-card glow-on-hover" style={{
            padding: '1.25rem',
            border: `1px solid ${getBorderColor()}`,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            height: '100%'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <img
                    src={user.pfp_url || 'https://wrpcd.net/cdn-cgi/image/fit=contain,f=auto,w=144/https%3A%2F%2Fwarpcast.com%2F-%2Fimages%2Fdefault-avatar.png'}
                    alt={user.username}
                    style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--card-border)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{user.display_name}</h4>
                        {isPowerUser && <Zap size={12} color="var(--primary)" />}
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>@{user.username}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)' }}>
                    {getStatusIcon()}
                    <span style={{ color: isSpam ? 'var(--danger)' : (isInactive ? 'var(--warning)' : 'var(--success)') }}>
                        {getStatusLabel()}
                    </span>
                </div>
            </div>

            {/* Bio */}
            <p style={{ fontSize: '0.8rem', color: '#bbb', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2rem' }}>
                {user.profile?.bio?.text || <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>No bio</span>}
            </p>

            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }}>
                <span><strong style={{ color: 'white' }}>{user.follower_count?.toLocaleString()}</strong> followers</span>
                <span><strong style={{ color: 'white' }}>{user.following_count?.toLocaleString()}</strong> following</span>
            </div>

            {/* Trust & Scores */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {user.trust_level && (
                    <div style={{
                        fontSize: '0.65rem',
                        color: getTrustColor(user.trust_level),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: `${getTrustColor(user.trust_level)}15`,
                        padding: '3px 6px',
                        borderRadius: '4px'
                    }}>
                        <Shield size={10} /> {user.trust_level} Trust
                    </div>
                )}
                {user.neynar_score > 0 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(124, 58, 237, 0.15)', padding: '3px 6px', borderRadius: '4px' }}>
                        <Award size={10} /> {(user.neynar_score * 100).toFixed(0)}%
                    </div>
                )}
                {user.talent_score > 0 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(45, 212, 191, 0.15)', padding: '3px 6px', borderRadius: '4px' }}>
                        <Zap size={10} /> {user.talent_score}
                    </div>
                )}
                {user.account_age && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.05)', padding: '3px 6px', borderRadius: '4px' }}>
                        <Calendar size={10} /> {user.account_age.label}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>FID: {user.fid}</span>
                <a
                    href={`https://warpcast.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}
                >
                    View <ExternalLink size={11} />
                </a>
            </div>

            {/* Spam Labels */}
            {user.spam_labels && user.spam_labels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {user.spam_labels.map((label: string, i: number) => (
                        <span key={i} style={{ fontSize: '0.6rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', padding: '2px 5px', borderRadius: '3px' }}>
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
