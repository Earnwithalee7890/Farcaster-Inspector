import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

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
        </AuthProvider>
      </body>
    </html>
  );
}
