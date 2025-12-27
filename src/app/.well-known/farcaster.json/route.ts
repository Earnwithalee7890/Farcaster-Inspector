import { NextResponse } from 'next/server';

export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-inspector.vercel.app';

    // These values should be generated using Warpcast Developer Tools:
    // https://warpcast.com/~/developers/frames
    // Sign the manifest with your Farcaster account (FID: 338060)
    const header = process.env.FARCASTER_MANIFEST_HEADER || '';
    const payload = process.env.FARCASTER_MANIFEST_PAYLOAD || '';
    const signature = process.env.FARCASTER_MANIFEST_SIGNATURE || '';

    const manifest: any = {
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

    // Only include accountAssociation if properly configured
    if (header && payload && signature) {
        manifest.accountAssociation = {
            header,
            payload,
            signature
        };
    }

    return NextResponse.json(manifest);
}

