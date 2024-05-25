export type {};

declare global {
  export type EventType = "lolCountsUpdate" | "newPost";
  export type PostCategory = "ontopic" | "nws" | "stupid" | "political" | "tangent" | "informative";
  export type LOLTags = "lol" | "inf" | "unf" | "tag" | "wtf" | "wow" | "aww";
  export interface LOLTagData {
    count: number;
    postId?: number;
    tag: LOLTags;
  }
  export interface LOLTagEventData {
    updates: LOLTagData[];
  }
  export interface NewPostData {
    parentAuthor?: string;
    post?: {
      author?: string;
      body?: string;
      category?: PostCategory;
      date?: string;
      id?: number;
      lols?: LOLTagData[];
      parentId?: number;
      threadId?: number;
      isCortex?: boolean;
    };
    postId?: number;
  }
  export interface NotifyEvent {
    eventData: NewPostData | LOLTagEventData;
    eventDate: string;
    eventId: string;
    eventType: EventType;
  }
  export interface NotifyResponse {
    events: NotifyEvent[];
    lastEventId: number;
    tooManyEvents: boolean;
    error?: boolean;
    code?: string;
    message?: string;
  }

  export interface NotifyMsg {
    name: string;
    data: NotifyResponse;
  }
  export interface NewestEventResponse {
    eventId: number;
  }
}
