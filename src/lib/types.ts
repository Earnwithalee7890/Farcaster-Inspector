export interface FarcasterUser {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    profile: {
        bio: {
            text: string;
        };
    };
    follower_count: number;
    following_count: number;
    verifications: string[];
    active_status: 'active' | 'inactive';
    last_cast_timestamp?: string;
    // Computed fields
    is_spam?: boolean;
    spam_score?: number;
    inactivity_days?: number;
    status_label?: 'Healthy' | 'Inactive' | 'Spam';
    // Talent Protocol fields
    talent_score?: number;
    talent_passport_id?: string;
    is_verified?: boolean;
    // Extended fields
    neynar_score?: number;
    power_badge?: boolean;
    account_age?: { days: number; label: string };
    cast_stats?: { total: number; replies: number; recasts: number; lastCastDate: string | null };
    recent_casts?: any[];
    trust_level?: 'High' | 'Medium' | 'Low' | 'Unknown';
    spam_labels?: string[];
    // OpenRank fields
    openrank_score?: number;
    openrank_display_score?: string;
    openrank_rank?: number;
    openrank_tier?: string;
    openrank_tier_emoji?: string;
    openrank_tier_color?: string;
}

export interface NeynarFollowingResponse {
    users: FarcasterUser[];
    next: {
        cursor: string | null;
    };
}
