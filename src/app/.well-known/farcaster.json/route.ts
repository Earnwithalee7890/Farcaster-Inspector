import { NextResponse } from 'next/server';

export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-inspector.vercel.app';

    const manifest = {
        // Account association (required for authenticated actions)
        accountAssociation: {
            header: "eyJmaWQiOjMzNjA4MCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDlBNjQ2NjgyNDU0M0E4MDcwODMyNDFlMDQ1NjNDNENjMmY1MDc3NTgifQ",
            payload: "eyJkb21haW4iOiJmYXJjYXN0ZXItaW5zcGVjdG9yLnZlcmNlbC5hcHAifQ",
            signature: "MHhkNTk0NmY3ZjQwMjVhMThiMjY1NmFiN2Q5NzM1MGI4M2YzNDNmZmNjZjA5YTE1MWQ1NWI2NzI1YjdlYzg3YjM2MjY4YTI0YThjMjkwNjA1MjE0YWNhYTcwZDRjMDNiOWIxMzc4OTI1OTc0NjdmMDIwMDk4ZDk5ZTlhN2RiYzY4YjFj"
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
