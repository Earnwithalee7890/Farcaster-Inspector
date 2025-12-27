'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Shield, Globe, Award, Zap } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { motion } from 'framer-motion';

export default function Navigation() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    const navItems = [
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
        { name: 'Neynar', path: '/neynar', icon: <Shield size={20} /> },
        { name: 'OpenRank', path: '/openrank', icon: <Globe size={20} /> },
        { name: 'Talent', path: '/talent', icon: <Award size={20} /> },
        { name: 'Quotient', path: '/quotient', icon: <Zap size={20} /> },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: '90%',
            maxWidth: '600px',
            background: 'rgba(15, 15, 20, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.75rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
            <ul style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: 0,
                padding: 0,
                listStyle: 'none'
            }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <li key={item.path} style={{ flex: 1, textAlign: 'center' }}>
                            <Link href={item.path} style={{ textDecoration: 'none' }}>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: isActive ? 'var(--primary)' : 'var(--muted)',
                                        transition: 'color 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        padding: '4px',
                                        borderRadius: '12px',
                                        background: isActive ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {item.icon}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{item.name}</span>
                                </motion.div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
