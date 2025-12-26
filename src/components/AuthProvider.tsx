'use client';

import dynamic from 'next/dynamic';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Create our own auth context since we're having issues with the Neynar SDK
interface User {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (fid: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: async () => { },
    logout: () => { },
    loading: false
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Check localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('fc_user');
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const login = async (fid: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/inspect?fid=${fid}`);
            const data = await response.json();
            if (data.searchedUser) {
                const userData: User = {
                    fid: data.searchedUser.fid,
                    username: data.searchedUser.username,
                    display_name: data.searchedUser.display_name,
                    pfp_url: data.searchedUser.pfp_url
                };
                setUser(userData);
                localStorage.setItem('fc_user', JSON.stringify(userData));
            }
        } catch (e) {
            console.error('Login error:', e);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fc_user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
