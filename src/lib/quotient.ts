import axios from 'axios';

const QUOTIENT_API_KEY = process.env.QUOTIENT_API_KEY;
const QUOTIENT_BASE_URL = 'https://api.quotient.social';

export interface QuotientUserReputation {
    fid: number;
    quotient_score: number;
    rank: number;
    tier: string;
    percentile: number;
}

export interface QuotientResponse {
    users: QuotientUserReputation[];
}

/**
 * Get the tier label based on Quotient Score
 * Score Tiers:
 * - < 0.5: Inactive/Bot
 * - 0.5-0.6: Casual
 * - 0.6-0.7: Active
 * - 0.7-0.8: Influential
 * - 0.8-0.9: Elite
 * - 0.9+: Exceptional (Platform superstars)
 */
export function getQuotientTier(score: number): string {
    if (score >= 0.9) return 'Exceptional';
    if (score >= 0.8) return 'Elite';
    if (score >= 0.7) return 'Influential';
    if (score >= 0.6) return 'Active';
    if (score >= 0.5) return 'Casual';
    return 'Inactive';
}

/**
 * Get tier color for UI display
 */
export function getQuotientTierColor(tier: string): string {
    switch (tier) {
        case 'Exceptional': return '#F59E0B'; // Gold
        case 'Elite': return '#8B5CF6'; // Purple
        case 'Influential': return '#3B82F6'; // Blue
        case 'Active': return '#10B981'; // Green
        case 'Casual': return '#6B7280'; // Gray
        case 'Inactive': return '#EF4444'; // Red
        default: return '#6B7280';
    }
}

/**
 * Get tier emoji for UI display
 */
export function getQuotientTierEmoji(tier: string): string {
    switch (tier) {
        case 'Exceptional': return '⭐';
        case 'Elite': return '💎';
        case 'Influential': return '🔥';
        case 'Active': return '✅';
        case 'Casual': return '👤';
        case 'Inactive': return '💤';
        default: return '❓';
    }
}

class QuotientAPI {
    private apiKey: string;

    constructor() {
        this.apiKey = QUOTIENT_API_KEY || '';
    }

    /**
     * Check if the API is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }

    /**
     * Get Quotient scores for a list of FIDs (up to 1000)
     */
    async getUserReputations(fids: number[]): Promise<QuotientUserReputation[] | null> {
        if (!this.apiKey) {
            console.warn('[Quotient] API key not configured');
            return null;
        }

        if (fids.length === 0) {
            return [];
        }

        // Limit to 1000 FIDs per request
        const limitedFids = fids.slice(0, 1000);

        try {
            const response = await axios.post(
                `${QUOTIENT_BASE_URL}/v1/user-reputation`,
                {
                    fids: limitedFids,
                    api_key: this.apiKey
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            if (response.data?.users) {
                // Enrich with tier information
                return response.data.users.map((user: any) => ({
                    fid: user.fid,
                    quotient_score: user.quotient_score || user.score || 0,
                    rank: user.rank || 0,
                    tier: user.tier || getQuotientTier(user.quotient_score || user.score || 0),
                    percentile: user.percentile || 0
                }));
            }

            return response.data || [];
        } catch (error: any) {
            console.error('[Quotient] API Error:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get Quotient score for a single FID
     */
    async getUserReputation(fid: number): Promise<QuotientUserReputation | null> {
        const results = await this.getUserReputations([fid]);
        return results?.[0] || null;
    }

    /**
     * Get Quotient scores mapped by FID for easy lookup
     */
    async getUserReputationsMap(fids: number[]): Promise<Map<number, QuotientUserReputation>> {
        const results = await this.getUserReputations(fids);
        const map = new Map<number, QuotientUserReputation>();

        if (results) {
            results.forEach(user => {
                map.set(user.fid, user);
            });
        }

        return map;
    }
}

// Export singleton instance
export const quotientAPI = new QuotientAPI();
export default quotientAPI;
