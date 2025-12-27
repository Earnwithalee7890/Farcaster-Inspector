import axios from 'axios';

const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_BASE_URL = 'https://api.dune.com/api/v1';
const DUNE_ECHO_URL = 'https://api.dune.com/api/echo/v1';

// Dune Farcaster-specific endpoints (no SQL required)
const DUNE_FARCASTER_ENDPOINTS = {
    trendingUsers: '/farcaster/trends/users',
    trendingChannels: '/farcaster/trends/channels',
    memecoins: '/farcaster/memecoins',
    userStats: '/farcaster/user', // + /{fid}
};

export interface DuneTrendingUser {
    fid: number;
    fname: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
    engagement_score: number;
    onchain_score: number;
    wallet_address?: string;
}

export interface DuneTrendingChannel {
    channel_id: string;
    name: string;
    description: string;
    follower_count: number;
    cast_count_24h: number;
    growth_rate: number;
    tier: string;
}

export interface DuneMemecoin {
    symbol: string;
    name: string;
    contract_address: string;
    chain: string;
    social_score: number;
    mention_count_24h: number;
    price_usd: number;
    market_cap: number;
    volume_24h: number;
    price_change_24h: number;
    holders: number;
}

export interface DuneUserPortfolio {
    wallet_address: string;
    total_value_usd: number;
    tokens: {
        symbol: string;
        name: string;
        balance: number;
        value_usd: number;
        chain: string;
    }[];
    nfts: {
        collection: string;
        name: string;
        token_id: string;
        image_url?: string;
    }[];
    labels: string[]; // e.g., "Whale", "DEX Trader", "Early Adopter"
}

export interface DuneUserOnchainData {
    fid: number;
    wallet_address: string;
    total_transactions: number;
    first_tx_date: string;
    dex_trades: number;
    nft_trades: number;
    defi_protocols: string[];
    labels: string[];
    net_worth_estimate: number;
}

class DuneAPI {
    private apiKey: string;

    constructor() {
        this.apiKey = DUNE_API_KEY || '';
    }

    private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
        if (!this.apiKey) {
            console.warn('[Dune] API key not configured');
            return null;
        }

        try {
            const url = new URL(`${DUNE_ECHO_URL}/farcaster${endpoint}`);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });

            const response = await axios.get(url.toString(), {
                headers: {
                    'X-Dune-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return response.data as T;
        } catch (error: any) {
            console.error('[Dune] API Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Execute a saved query by ID with parameters
    async executeQuery<T>(queryId: number, params: Record<string, string | number> = {}): Promise<T | null> {
        if (!this.apiKey) {
            console.warn('[Dune] API key not configured');
            return null;
        }

        try {
            // Execute query
            const executeResponse = await axios.post(
                `${DUNE_BASE_URL}/query/${queryId}/execute`,
                { query_parameters: params },
                {
                    headers: {
                        'X-Dune-Api-Key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const executionId = executeResponse.data.execution_id;

            // Poll for results (with timeout)
            let attempts = 0;
            const maxAttempts = 30;

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                const statusResponse = await axios.get(
                    `${DUNE_BASE_URL}/execution/${executionId}/status`,
                    {
                        headers: { 'X-Dune-Api-Key': this.apiKey }
                    }
                );

                if (statusResponse.data.state === 'QUERY_STATE_COMPLETED') {
                    const resultsResponse = await axios.get(
                        `${DUNE_BASE_URL}/execution/${executionId}/results`,
                        {
                            headers: { 'X-Dune-Api-Key': this.apiKey }
                        }
                    );
                    return resultsResponse.data.result?.rows as T;
                }

                if (statusResponse.data.state === 'QUERY_STATE_FAILED') {
                    console.error('[Dune] Query failed:', statusResponse.data);
                    return null;
                }

                attempts++;
            }

            console.error('[Dune] Query timeout');
            return null;
        } catch (error: any) {
            console.error('[Dune] Query Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get latest results from a query (faster, uses cached results)
    async getLatestResults<T>(queryId: number, params: Record<string, string | number> = {}): Promise<T | null> {
        if (!this.apiKey) {
            console.warn('[Dune] API key not configured');
            return null;
        }

        try {
            const url = new URL(`${DUNE_BASE_URL}/query/${queryId}/results`);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });

            const response = await axios.get(url.toString(), {
                headers: {
                    'X-Dune-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            return response.data.result?.rows as T;
        } catch (error: any) {
            console.error('[Dune] Results Error:', error.response?.data || error.message);
            return null;
        }
    }

    // ==================== Farcaster-Specific Endpoints ====================

    /**
     * Get trending Farcaster users based on engagement and onchain activity
     */
    async getTrendingUsers(limit: number = 20): Promise<DuneTrendingUser[] | null> {
        return this.request<DuneTrendingUser[]>('/trends/users', { limit });
    }

    /**
     * Get trending Farcaster channels
     */
    async getTrendingChannels(limit: number = 20): Promise<DuneTrendingChannel[] | null> {
        return this.request<DuneTrendingChannel[]>('/trends/channels', { limit });
    }

    /**
     * Get Farcaster memecoins with social and financial data
     */
    async getMemecoins(limit: number = 50): Promise<DuneMemecoin[] | null> {
        return this.request<DuneMemecoin[]>('/memecoins', { limit });
    }

    /**
     * Get user stats by FID
     */
    async getUserStats(fid: number): Promise<any | null> {
        return this.request<any>(`/user/${fid}`);
    }

    // ==================== Custom Query Examples ====================

    // Popular Dune Query IDs for Farcaster data
    static QUERY_IDS = {
        // You can find/create these on Dune and add your own
        POWER_USERS: 3306579, // Top power users
        CHANNEL_LEADERBOARD: 3306580, // Channel engagement
        WALLET_ANALYSIS: 3306581, // Wallet deep dive
        SOCIAL_GRAPH: 3306582, // Follower recommendations
    };

    /**
     * Get power user rankings
     */
    async getPowerUsers(limit: number = 100): Promise<any[] | null> {
        return this.getLatestResults(DuneAPI.QUERY_IDS.POWER_USERS, { limit });
    }

    /**
     * Get user's onchain reputation based on wallet history
     */
    async getOnchainReputation(walletAddress: string): Promise<DuneUserOnchainData | null> {
        const results = await this.getLatestResults<DuneUserOnchainData[]>(
            DuneAPI.QUERY_IDS.WALLET_ANALYSIS,
            { wallet: walletAddress }
        );
        return results?.[0] || null;
    }

    /**
     * Get user portfolio (tokens + NFTs)
     */
    async getUserPortfolio(walletAddress: string): Promise<DuneUserPortfolio | null> {
        // This would typically use a custom Dune query
        // For now, we'll use a placeholder that can be replaced with actual query ID
        try {
            const response = await axios.get(
                `${DUNE_ECHO_URL}/beta/balance/${walletAddress}`,
                {
                    headers: {
                        'X-Dune-Api-Key': this.apiKey,
                    },
                    timeout: 10000
                }
            );
            return response.data as DuneUserPortfolio;
        } catch (error) {
            console.error('[Dune] Portfolio Error:', error);
            return null;
        }
    }

    /**
     * Get labels/tags for a wallet (Whale, DEX Trader, etc.)
     */
    async getWalletLabels(walletAddress: string): Promise<string[]> {
        const reputation = await this.getOnchainReputation(walletAddress);
        return reputation?.labels || [];
    }

    /**
     * Check if user has interacted with a specific protocol
     */
    async hasProtocolInteraction(walletAddress: string, protocolName: string): Promise<boolean> {
        const reputation = await this.getOnchainReputation(walletAddress);
        return reputation?.defi_protocols?.includes(protocolName) || false;
    }
}

// Export singleton instance
export const duneAPI = new DuneAPI();
export default duneAPI;
