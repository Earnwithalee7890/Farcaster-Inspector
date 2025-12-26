# 🕵️ Farcaster Inspector

Farcaster Inspector is a powerful tool designed to help you clean your Farcaster feed by identifying spammy accounts and inactive users in your following list.

## 🚀 Features

- **Spam Detection**: Uses advanced heuristics (follower ratio, profile completion, verification status) to flag potential bots.
- **Inactivity Tracking**: Identifies users who haven't casted in 30, 90, or 180+ days.
- **Premium UI**: Sleek, modern interface built with Next.js, Framer Motion, and Glassmorphism.
- **Neynar Integration**: Powered by the Neynar V2 API for accurate, real-time Farcaster data.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **API**: [Neynar](https://neynar.com/)
- **Styling**: Vanilla CSS with Design Tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚦 Getting Started

1. **Clone the repository** (if applicable) or navigate to the project folder.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   Create a `.env` file based on `example.env` and add your Neynar API Key:
   ```env
   NEYNAR_API_KEY=your_key_here
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
5. **Open the app**: Navigate to `http://localhost:3000`.

## 🧠 Spam Scoring Heuristics

- **No Profile Picture**: +25 points
- **No Bio**: +20 points
- **No Verified Address**: +15 points
- **Suspicious Follower/Following Ratio**: +30-40 points
- **High FID (Recent Account)**: +10 points

*Total score > 50 triggers a "Spam" label.*

## ⚖️ Limitations

- **Action Layer**: Due to protocol security, this tool provides the *awareness* of who to unfollow. You must still perform the unfollow action on Warpcast (links provided for each user).

---
Built with ❤️ for the Farcaster ecosystem.
