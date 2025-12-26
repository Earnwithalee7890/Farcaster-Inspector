import { FarcasterUser } from "./types";

export function calculateSpamScore(user: FarcasterUser): { score: number; labels: string[] } {
    let score = 0;
    const labels: string[] = [];

    // 1. Profile Completion
    if (!user.pfp_url || user.pfp_url.includes('default')) {
        score += 25;
        labels.push("No/Default PFP");
    }

    if (!user.profile?.bio?.text || user.profile.bio.text.length < 5) {
        score += 20;
        labels.push("Empty/Short Bio");
    }

    // 2. Trust Signals
    if (!user.verifications || user.verifications.length === 0) {
        score += 15;
        labels.push("No Verified Address");
    }

    // 3. Graph Signals - Suspicious follow ratios
    if (user.following_count > 1000 && user.follower_count < 20) {
        score += 40;
        labels.push("Suspicious Follower Ratio");
    } else if (user.following_count > 500 && user.follower_count < 5) {
        score += 30;
        labels.push("High Following / Low Followers");
    }

    // 4. Account Age (FID-based)
    if (user.fid > 850000) {
        score += 10;
        labels.push("Very New Account");
    }

    // 5. Talent Protocol Reputation
    if (user.talent_score !== undefined) {
        if (user.talent_score > 60) {
            score -= 30; // Highly trusted
        } else if (user.talent_score > 20) {
            score -= 10; // Somewhat trusted
        } else if (user.talent_score < 5 && user.talent_score >= 0) {
            score += 15;
            labels.push("Low Reputation Score");
        }
    }

    // 6. Activity signals (if cast_stats available)
    if (user.cast_stats) {
        if (user.cast_stats.total === 0) {
            score += 20;
            labels.push("No Recent Casts");
        }
    }

    // 7. Inactivity
    if (user.inactivity_days !== undefined && user.inactivity_days > 90) {
        score += 15;
        labels.push("Inactive 90+ Days");
    }

    return { score: Math.max(0, Math.min(100, score)), labels };
}

export function calculateInactivityDays(lastCastDate: string | null): number {
    if (!lastCastDate) return 999; // Never posted

    const lastDate = new Date(lastCastDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

export function calculateTrustLevel(
    neynarScore: number,
    talentScore: number,
    isPowerBadge: boolean
): 'High' | 'Medium' | 'Low' | 'Unknown' {
    // Power badge = automatic high trust
    if (isPowerBadge) return 'High';

    // Calculate combined score
    const combinedScore = (neynarScore * 100 * 0.6) + (talentScore * 0.4);

    if (combinedScore > 70 || neynarScore > 0.9) return 'High';
    if (combinedScore > 40 || neynarScore > 0.6) return 'Medium';
    if (combinedScore > 0) return 'Low';

    return 'Unknown';
}

export function getInactivityLabel(days: number): { label: string; color: string } {
    if (days <= 7) return { label: 'Active (this week)', color: 'var(--success)' };
    if (days <= 30) return { label: 'Active (this month)', color: 'var(--secondary)' };
    if (days <= 90) return { label: 'Stale (1-3 months)', color: 'var(--warning)' };
    if (days <= 180) return { label: 'Inactive (3-6 months)', color: 'var(--danger)' };
    return { label: 'Ghost (6+ months)', color: 'var(--danger)' };
}

export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}
