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
    tweetQuoted?: {
      quotedTimestamp: string;
      quotedUrl: string;
      quotedProfilePic: string;
      quotedDisplayName: string;
      quotedRealName: string;
      quotedText: string;
      quotedMediaItems: string[];
      quotedUserVerified: boolean;
    };
    unavailable?: boolean;
  }

  export interface TwitterV2UserExpansion {
    profile_image_url: string;
    id: string;
    verified: boolean;
    name: string;
    username: string;
  }
  export interface TwitterV2MediaExpansion {
    media_key: string;
    type: string;
    url: string;
  }
  export interface TwitterV2TweetExpansion {
    text: string;
    id: string;
    created_at: string;
  }
  export interface TwitterV2InReplyToExpansion {
    type: string;
    id: string;
  }

  interface TwitterV2Entity {
    start: number;
    end: number;
  }
  export interface TwitterV2UrlEntity extends TwitterV2Entity {
    url: string;
    expanded_url: string;
    display_url: string;
  }
  export interface TwitterV2TagEntity extends TwitterV2Entity {
    tag: string;
  }
  export interface TwitterV2MentionEntity extends TwitterV2Entity {
    username: string;
  }
  export interface TwitterV2Entities {
    urls?: TwitterV2UrlEntity[];
    cashtags?: TwitterV2TagEntity[];
    hashtags?: TwitterV2TagEntity[];
    mentions?: TwitterV2MentionEntity[];
  }
  export interface TwitterV2Attachments {
    // NOTE: full media urls are not yet available on V2
    media_keys?: string;
  }

  export interface TwitterV2Response {
    referenced_tweets?: TwitterV2InReplyToExpansion[];
    conversation_id: string;
    created_at: string;
    id: string;
    entities?: TwitterV2Entities;
    attachments?: TwitterV2Attachments;
    author_id: string;
    includes: {
      media?: TwitterV2MediaExpansion[];
      tweets?: TwitterV2TweetExpansion[];
      users: TwitterV2UserExpansion[];
    };
  }
}
