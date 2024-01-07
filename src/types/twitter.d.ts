export {};

declare global {
  /// schema for the rendered tweet object
  export interface TweetParsed {
    tweetParentId?: string;
    tweetParents?: TweetParsed[];
    tweetUrl?: string;
    profilePic?: string;
    profilePicUrl?: string;
    displayName?: string;
    realName?: string;
    tweetText?: string;
    tweetMediaItems?: string[];
    timestamp?: string;
    userVerified?: boolean;
    tweetQuoted?: TweetParsed;
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
  // target: https://twitter.com/hashtag/${hash}?src=hash
  export interface TwitterResponseHashtag {
    indices: [number, number];
    text: string;
  }
  // target: https://twitter.com/search?q=%24${sym}&src=cashtag_click
  export interface TwitterResponseSymbol {
    indices: [number, number];
    text: string;
  }
  export interface TwitterResponseUrl {
    display_url: string;
    expanded?: string;
    expanded_url: string;
    indices: [number, number];
    url: string;
  }
  // target: https://twitter.com/${tag}
  export interface TwitterResponseMention {
    id: number;
    indices: [number, number];
    name: string;
    screen_name: string;
  }
  export interface TwitterResponseEntities {
    hashtags: TwitterResponseHashtag[];
    symbols: TwitterResponseSymbol[];
    urls: TwitterResponseUrl[];
    user_mentions: TwitterResponseMention[];
  }
  export interface TwitterResponse {
    created_at: string;
    entities: TwitterResponseEntities;
    errors?: any;
    in_reply_to_status_id_str?: string;
    id_str: string;
    favorite_count: number;
    full_text: string;
    extended_entities?: TwitterResponseMedia;
    quoted_status_id_str?: string;
    quoted_status_permalink?: TwitterResponseUrl;
    quoted_status: TwitterResponse;
    retweet_count: number;
    user: TwitterUserResponse;
  }
}
