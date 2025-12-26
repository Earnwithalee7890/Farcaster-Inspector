'use client';

import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";

export function NeynarProvider({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '';

    return (
        <NeynarContextProvider
            settings={{
                clientId: clientId,
                defaultTheme: Theme.Dark,
                eventsCallbacks: {
                    onAuthSuccess: () => {
                        console.log('[SIWF] Auth success!');
                    },
                    onSignout: () => {
                        console.log('[SIWF] Signed out');
                    }
                }
            }}
        >
            {children}
        </NeynarContextProvider>
    );
}
