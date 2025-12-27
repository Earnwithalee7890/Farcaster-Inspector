'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import sdk from '@farcaster/miniapp-sdk';

// User interface for authentication
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
    isInFrame: boolean;
    sdkReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: async () => { },
    logout: () => { },
    loading: false,
    isInFrame: false,
    sdkReady: false
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [isInFrame, setIsInFrame] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);

    // Fetch user data from API
    const fetchUserData = useCallback(async (fid: number | string): Promise<User | null> => {
        try {
            const response = await fetch(`/api/inspect?fid=${fid}`);
            const data = await response.json();
            if (data.searchedUser) {
                return {
                    fid: data.searchedUser.fid,
                    username: data.searchedUser.username,
                    display_name: data.searchedUser.display_name,
                    pfp_url: data.searchedUser.pfp_url
                };
            }
        } catch (e) {
            console.error('Failed to fetch user data:', e);
        }
        return null;
    }, []);

    // Initialize Farcaster SDK and auto-login
    useEffect(() => {
        const initializeSDK = async () => {
            try {
                // Initialize the Frame SDK
                const context = await sdk.context;

                if (context?.user) {
                    // We're inside a Farcaster frame (Warpcast)
                    setIsInFrame(true);
                    console.log('🎯 Farcaster context detected:', context.user);

                    // Auto-login with the frame user's FID
                    const userData = await fetchUserData(context.user.fid);
                    if (userData) {
                        setUser(userData);
                        localStorage.setItem('fc_user', JSON.stringify(userData));
                        console.log('✅ Auto-logged in as:', userData.username);
                    } else {
                        // Use basic info from context if API fails
                        const basicUser: User = {
                            fid: context.user.fid,
                            username: context.user.username || `fid:${context.user.fid}`,
                            display_name: context.user.displayName || context.user.username || `User ${context.user.fid}`,
                            pfp_url: context.user.pfpUrl || ''
                        };
                        setUser(basicUser);
                        localStorage.setItem('fc_user', JSON.stringify(basicUser));
                    }

                    // Signal that the app is ready to be shown
                    sdk.actions.ready();
                } else {
                    // Not in a frame, check localStorage
                    console.log('📱 Not in Farcaster frame, checking localStorage...');
                    const saved = localStorage.getItem('fc_user');
                    if (saved) {
                        try {
                            const parsedUser = JSON.parse(saved);
                            setUser(parsedUser);
                            console.log('✅ Restored session for:', parsedUser.username);
                        } catch (e) {
                            localStorage.removeItem('fc_user');
                        }
                    }
                }

                setSdkReady(true);
            } catch (error) {
                console.log('⚠️ Frame SDK not available (running in browser):', error);
                // Fallback: check localStorage for saved session
                const saved = localStorage.getItem('fc_user');
                if (saved) {
                    try {
                        setUser(JSON.parse(saved));
                    } catch (e) {
                        localStorage.removeItem('fc_user');
                    }
                }
                setSdkReady(true);
            } finally {
                setLoading(false);
            }
        };

        initializeSDK();
    }, [fetchUserData]);

    // Manual login function (for web browser fallback)
    const login = async (fid: string) => {
        setLoading(true);
        try {
            const userData = await fetchUserData(fid);
            if (userData) {
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
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            logout,
            loading,
            isInFrame,
            sdkReady
        }}>
            {children}
        </AuthContext.Provider>
    );
}
