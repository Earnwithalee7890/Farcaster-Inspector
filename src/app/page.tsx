import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Dashboard />
      </main>
      <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', borderTop: '1px solid var(--card-border)' }}>
        <p>&copy; 2024 Farcaster Inspector • Built with Neynar & Next.js</p>
      </footer>
    </div>
  );
}
