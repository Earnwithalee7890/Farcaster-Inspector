import { FarcasterUser } from '@/lib/types';
import { ExternalLink, AlertTriangle, UserX, CheckCircle } from 'lucide-react';

interface UserCardProps {
    user: any; // Using any for simplicity in the demo with expanded fields
}

export default function UserCard({ user }: UserCardProps) {
    const isSpam = user.status_label === 'Spam';
    const isInactive = user.status_label === 'Inactive';

    const getBorderColor = () => {
        if (isSpam) return 'var(--danger)';
        if (isInactive) return 'var(--warning)';
        return 'var(--glass-border)';
    };

    const getStatusIcon = () => {
        if (isSpam) return <UserX size={16} color="var(--danger)" />;
        if (isInactive) return <AlertTriangle size={16} color="var(--warning)" />;
        return <CheckCircle size={16} color="var(--success)" />;
    };

    return (
        <div className="glass-card glow-on-hover" style={{
            padding: '1.25rem',
            border: `1px solid ${getBorderColor()}`,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%'
        }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img
                    src={user.pfp_url || 'https://wrpcd.net/cdn-cgi/image/fit=contain,f=auto,w=144/https%3A%2F%2Fwarpcast.com%2F-%2Fimages%2Fdefault-avatar.png'}
                    alt={user.username}
                    style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--card-border)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.display_name}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>@{user.username}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '20px', background: 'rgba(0,0,0,0.2)' }}>
                    {getStatusIcon()}
                    <span style={{ color: isSpam ? 'var(--danger)' : (isInactive ? 'var(--warning)' : 'var(--success)') }}>
                        {user.status_label}
                    </span>
                </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
                {user.profile.bio.text || <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>No bio provided</span>}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                        <span><strong>{user.follower_count}</strong> flwrs</span>
                        <span><strong>{user.following_count}</strong> flwng</span>
                    </div>
                    {user.talent_score !== undefined && user.talent_score > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                            Talent Score: <strong>{user.talent_score}</strong>
                        </div>
                    )}
                </div>

                <a
                    href={`https://warpcast.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}
                >
                    Profile <ExternalLink size={12} />
                </a>
            </div>

            {user.spam_labels && user.spam_labels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                    {user.spam_labels.map((label: string, i: number) => (
                        <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px' }}>
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
