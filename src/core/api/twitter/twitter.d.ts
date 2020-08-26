/// schema for the rendered tweet object
export interface TweetMediaItem {
    type: "photo" | "animated_gif" | "video";
    url: string;
}
export interface TweetParsed {
    tweetParentId?: string;
    tweetParents?: TweetParsed[];
    tweetUrl?: string;
    profilePic?: string;
    profilePicUrl?: string;
    displayName?: string;
    realName?: string;
    tweetText?: string;
    tweetMediaItems?: TweetMediaItem[];
    timestamp?: string;
    userVerified?: boolean;
    tweetQuoted?: {
        quotedTimestamp: string;
        quotedUrl: string;
        quotedProfilePic: string;
        quotedDisplayName: string;
        quotedRealName: string;
        quotedText: string;
        quotedMediaItems: TweetMediaItem[];
        quotedUserVerified: boolean;
    };
    unavailable?: boolean;
}

/// schema for the raw endpoint response
export interface TwitterMediaItemVariant {
    bitrate: number; // can report 0 if it's a converted GIF
    content_type: "video/mp4" | "application/x-mpegURL";
    url: string;
}
export interface TwitterResponseMediaItem {
    id_str: string;
    media_url_https: string;
    expanded_url: string;
    type: "photo" | "animated_gif" | "video";
    video_info?: {
        variants: TwitterMediaItemVariant[];
    };
}
export interface TwitterResponseMedia {
    media: TwitterResponseMediaItem[];
}
export interface TwitterUserResponse {
    screen_name: string;
    profile_image_url_https: string;
    name: string;
    verified: boolean;
}
export interface TwitterResponseUrl {
    url: string;
    expanded_url: string;
    expanded?: string;
}
export interface TwitterResponse {
    id_str: string;
    in_reply_to_status_id_str?: string;
    created_at: string;
    full_text: string;
    user: TwitterUserResponse;
    urls?: TwitterResponseUrl[];
    extended_entities?: TwitterResponseMedia;
    quoted_status_id_str?: string;
    quoted_status_permalink?: TwitterResponseUrl;
    quoted_status: TwitterResponse;
    errors: any;
}
