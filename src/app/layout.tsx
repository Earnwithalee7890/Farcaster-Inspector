import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Farcaster Inspector | Clean Your Feed",
  description: "Detect spammy and inactive accounts on your Farcaster following list. Keep your feed healthy and high-signal.",
  keywords: ["Farcaster", "Neynar", "Spam Detection", "Social Cleanup", "Web3"],
  openGraph: {
    title: "Farcaster Inspector",
    description: "Detect spammy and inactive accounts on your Farcaster following list.",
    type: "website",
    siteName: "Farcaster Inspector",
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://farcaster-inspector.vercel.app/og-image.png",
    "fc:frame:button:1": "Open Inspector",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": "https://farcaster-inspector.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="bg-blur"></div>
          {children}
          <Navigation />
        </AuthProvider>
      </body>
    </html>
  );
}
