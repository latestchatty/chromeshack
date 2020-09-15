export interface InstagramEdgeMedia {
    video_url?: string;
    display_resources?: {
        0: {
            src: string;
        };
    };
    node?: {
        text: string;
    };
}
export interface InstagramShortcodeMedia {
    __typename: "GraphSidecar" | "GraphVideo" | "GraphImage";
    taken_at_timestamp: string;
    shortcode: string;
    owner: {
        profile_pic_url: string;
        username: string;
        full_name: string;
        is_private?: boolean;
    };
    edge_media_preview_comment?: { count: number };
    edge_media_preview_like?: { count: number };
    edge_media_to_caption?: {
        edges?: InstagramEdgeMedia[];
    };
    edge_sidecar_to_children: {
        edges: InstagramEdgeMedia[];
    };
    video_url?: string;
    display_resources?: {
        0: {
            src: string;
        };
    };
}
export interface InstagramResponse {
    gqlData?: {
        shortcode_media: InstagramShortcodeMedia;
    };
    metaViews?: string;
}

export interface InstagramParsed {
    metaLikes?: string;
    metaComments?: string;
    authorPic?: string;
    authorName?: string;
    authorFullName?: string;
    postTimestamp?: string;
    postUrl?: string;
    postCaption?: string;
    postMedia?: string[];
    error?: {
        msg: string;
        url: string;
    };
}
