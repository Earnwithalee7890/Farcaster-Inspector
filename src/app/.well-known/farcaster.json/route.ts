import { NextResponse } from 'next/server';

export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-inspector.vercel.app';

    const manifest = {
        accountAssociation: {
            header: "eyJmaWQiOjMzODA2MCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweEJDNzRlQTExNWY0ZjMwQ2U3MzdGMzk0YTkzNzAxQWJkMTY0MmQ3RDEifQ",
            payload: "eyJkb21haW4iOiJmYXJjYXN0ZXItaW5zcGVjdG9yLnZlcmNlbC5hcHAifQ",
            signature: "lFPFfPg92VfAp7VqTP+wBjPkHZIsSj6Wk+EONjWfen4oqtspbTzh4PZTtcIBgiOZLx3D6HWlksapsAezmdq1pxs="
        },
        frame: {
            version: "1",
            name: "Farcaster Inspector",
            iconUrl: `${appUrl}/icon.png`,
            homeUrl: appUrl,
            imageUrl: `${appUrl}/og-image.png`,
            buttonTitle: "Open Inspector",
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: "#0a0a0f",
            webhookUrl: `${appUrl}/api/webhook`
        }
    };

    return NextResponse.json(manifest);
}
