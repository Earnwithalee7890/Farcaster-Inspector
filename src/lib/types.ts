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
}

export interface TalentPassportResponse {
    passport: {
        score: number;
        passport_id: string;
        verified: boolean;
    };
}

export interface NeynarFollowingResponse {
    users: FarcasterUser[];
    next: {
        cursor: string | null;
    };
}
