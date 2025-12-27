import axios from 'axios';

// OpenRank API - Graph-based reputation for Farcaster
// Documentation: https://docs.openrank.com/

const OPENRANK_BASE_URL = 'https://graph.cast.k3l.io';

export interface OpenRankScore {
    fid: number;
    fname: string;
    username: string;
    score: number;
    rank: number;
    percentile: number;
}

export interface OpenRankUser {
    fid: number;
    score: number;
    rank?: number;
}

export interface OpenRankResponse {
    result: OpenRankUser[];
}

class OpenRankAPI {
    /**
     * Get global OpenRank scores for multiple FIDs
     * Returns graph-based reputation scores
     */
    async getScores(fids: number[]): Promise<OpenRankUser[]> {
        try {
            const response = await axios.post<OpenRankResponse>(
                `${OPENRANK_BASE_URL}/scores`,
                fids,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            );
            return response.data.result || [];
        } catch (error: any) {
            console.error('[OpenRank] Error fetching scores:', error.message);
            return [];
        }
    }

    /**
     * Get single user's OpenRank score
     */
    async getUserScore(fid: number): Promise<OpenRankUser | null> {
        const scores = await this.getScores([fid]);
        return scores.find(s => s.fid === fid) || null;
    }

    /**
     * Get global rankings (top users by OpenRank)
     * @param limit Number of top users to fetch
     */
    async getGlobalRankings(limit: number = 100): Promise<OpenRankUser[]> {
        try {
            const response = await axios.get<OpenRankResponse>(
                `${OPENRANK_BASE_URL}/rankings/global?limit=${limit}`,
                { timeout: 15000 }
            );
            return response.data.result || [];
        } catch (error: any) {
            console.error('[OpenRank] Error fetching rankings:', error.message);
            return [];
        }
    }

    /**
     * Get user's rank among their followers
     * Useful for: "Who matters most among my followers?"
     */
    async getFollowerRankings(fid: number, limit: number = 50): Promise<OpenRankUser[]> {
        try {
            const response = await axios.get<OpenRankResponse>(
                `${OPENRANK_BASE_URL}/rankings/followers/${fid}?limit=${limit}`,
                { timeout: 15000 }
            );
            return response.data.result || [];
        } catch (error: any) {
            console.error('[OpenRank] Error fetching follower rankings:', error.message);
            return [];
        }
    }

    /**
     * Get user's rank among accounts they follow
     */
    async getFollowingRankings(fid: number, limit: number = 50): Promise<OpenRankUser[]> {
        try {
            const response = await axios.get<OpenRankResponse>(
                `${OPENRANK_BASE_URL}/rankings/following/${fid}?limit=${limit}`,
                { timeout: 15000 }
            );
            return response.data.result || [];
        } catch (error: any) {
            console.error('[OpenRank] Error fetching following rankings:', error.message);
            return [];
        }
    }

    /**
     * Get tier and label based on OpenRank score
     */
    getTier(score: number): { tier: string; emoji: string; color: string; label: string } {
        // OpenRank scores typically range from 0 to ~0.01 for most users
        // Top users can have scores up to ~0.5 or higher
        const normalizedScore = score * 1000; // Convert to more readable scale

        if (normalizedScore >= 100) return { tier: 'Legendary', emoji: '👑', color: '#FFD700', label: 'Top 0.01% - Platform legends' };
        if (normalizedScore >= 50) return { tier: 'Elite', emoji: '💎', color: '#3B82F6', label: 'Top 0.1% - High influence' };
        if (normalizedScore >= 20) return { tier: 'Influential', emoji: '🔥', color: '#8B5CF6', label: 'Top 1% - Strong network' };
        if (normalizedScore >= 10) return { tier: 'Established', emoji: '⭐', color: '#10B981', label: 'Top 5% - Solid reputation' };
        if (normalizedScore >= 5) return { tier: 'Growing', emoji: '🌱', color: '#F59E0B', label: 'Top 20% - Building trust' };
        if (normalizedScore >= 1) return { tier: 'Active', emoji: '✅', color: '#6B7280', label: 'Active participant' };
        return { tier: 'New', emoji: '👤', color: '#9CA3AF', label: 'New or minimal activity' };
    }

    /**
     * Check if user is likely spam based on OpenRank
     * Low OpenRank usually correlates with bot clusters and farms
     */
    isLikelySpam(score: number): boolean {
        return score * 1000 < 0.5;
    }

    /**
     * Get spam resistance signal
     */
    getSpamSignal(score: number): { isSpam: boolean; confidence: string; reason: string } {
        const normalizedScore = score * 1000;

        if (normalizedScore >= 5) {
            return { isSpam: false, confidence: 'high', reason: 'Strong network trust' };
        }
        if (normalizedScore >= 1) {
            return { isSpam: false, confidence: 'medium', reason: 'Active with some trust' };
        }
        if (normalizedScore >= 0.5) {
            return { isSpam: false, confidence: 'low', reason: 'Limited network presence' };
        }
        return { isSpam: true, confidence: 'high', reason: 'Minimal graph influence - likely spam or inactive' };
    }
}

export const openRankAPI = new OpenRankAPI();
export default openRankAPI;
