import Link from 'next/link';
import { Search, Shield, Zap } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="glass-card" style={{ margin: '1rem', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '1rem', zIndex: 100 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
                <Shield size={24} color="var(--primary)" />
                <span className="premium-gradient">FC Inspector</span>
            </Link>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={16} color="var(--secondary)" />
                    <span>Powered by Neynar</span>
                </div>
            </div>
        </nav>
    );
}
