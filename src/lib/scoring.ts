import { FarcasterUser } from "./types";

export function calculateSpamScore(user: FarcasterUser): { score: number; labels: string[] } {
    let score = 0;
    const labels: string[] = [];

    // 1. Profile Completion
    if (!user.pfp_url || user.pfp_url.includes('default')) {
        score += 25;
        labels.push("No/Default PFP");
    }

    if (!user.profile.bio.text || user.profile.bio.text.length < 5) {
        score += 20;
        labels.push("Empty/Short Bio");
    }

    // 2. Trust Signals
    if (!user.verifications || user.verifications.length === 0) {
        score += 15;
        labels.push("No Verified Address");
    }

    // 3. Graph Signals
    if (user.following_count > 1000 && user.follower_count < 20) {
        score += 40;
        labels.push("Suspicious Follower Ratio");
    } else if (user.following_count > 500 && user.follower_count < 5) {
        score += 30;
        labels.push("High Following / Low Followers");
    }

    // 4. FID (Newer accounts have higher FIDs)
    // Current FIDs are around 900,000+. 
    // High FID + No Profile = Very likely spam.
    if (user.fid > 850000) {
        score += 10;
        // We don't label just for being new
    }

    // 5. Talent Protocol Reputation (Negative weight = reduces spam score)
    if (user.talent_score !== undefined) {
        if (user.talent_score > 60) {
            score -= 30; // Highly trusted
        } else if (user.talent_score > 20) {
            score -= 10; // Somewhat trusted
        } else if (user.talent_score < 5 && user.talent_score >= 0) {
            score += 15; // Low reputation increases risk
        }
    }

    return { score: Math.max(0, score), labels };
}

export function analyzeInactivity(lastCastTimestamp?: string): { days: number; status: 'active' | 'inactive' | 'stale' } {
    if (!lastCastTimestamp) return { days: 999, status: 'inactive' };

    const lastCastDate = new Date(lastCastTimestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastCastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: 'active' | 'inactive' | 'stale' = 'active';
    if (diffDays > 90) status = 'inactive';
    else if (diffDays > 30) status = 'stale';

    return { days: diffDays, status };
}
