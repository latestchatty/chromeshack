import type { ShackRSSItem } from "../core/common";

export interface ReplyMatchArgs {
    mutation: HTMLElement;
    lastSibling: HTMLElement;
    lastRemoved: HTMLElement;
}

export interface PostEventArgs {
    post?: HTMLElement;
    root?: HTMLElement;
    postid?: number;
    rootid?: number;
    is_root?: boolean;
}

export interface RefreshMutation {
    postid?: number;
    rootid?: number;
    parentid?: number;
}

export interface HighlightGroup {
    name?: string;
    enabled?: boolean;
    built_in?: boolean;
    css?: string;
    users?: string[];
}

export type EnabledOptions =
    | "auto_open_embeds"
    | "chatty_news"
    | "custom_user_filters"
    | "enable_notifications"
    | "getpost"
    | "hide_tagging_buttons"
    | "hide_tag_counts"
    | "highlight_pending_new_posts"
    | "highlight_users"
    | "media_loader"
    | "new_comment_highlighter"
    | "nws_incognito"
    | "post_preview"
    | "switchers"
    | "shrink_user_icons"
    | "social_loader"
    | "thread_pane"
    | "twitchauto"
    | "reduced_color_user_icons";
export type EnabledSuboptions =
    | "cuf_hide_fullposts"
    | "imported"
    | "show_rls_notes"
    | "sl_show_tweet_threads"
    | "testing_mode";

export type SettingKey =
    | "enabled_scripts"
    | "enabled_suboptions"
    | "collapsed_threads"
    | "chatty_news_lastfetchdata"
    | "chatty_news_lastfetchtime"
    | "highlight_groups"
    | "image_uploader_toggled"
    | "last_collapse_time"
    | "last_eventid"
    | "last_highlight_time"
    | "new_comment_highlighter_last_id"
    | "notifications"
    | "post_preview_toggled"
    | "selected_upload_tab"
    | "user_filters"
    | "username"
    | "version";
export interface SettingsDict {
    enabled_scripts: EnabledOptions[];
    enabled_suboptions: EnabledSuboptions[];
    collapsed_threads: number[];
    chatty_news_lastfetchdata: ShackRSSItem[];
    chatty_news_lastfetchtime: number;
    highlight_groups: HighlightGroup[];
    image_uploader_toggled: boolean;
    last_collapse_time: number;
    last_eventid: number;
    last_highlight_time: number;
    new_comment_highlighter_last_id: number;
    notifications: string[];
    post_preview_toggled: boolean;
    selected_upload_tab: string;
    user_filters: string[];
    username: string;
    version: number;
}
export type MigratedSettings = Record<string, { old: string; new: string | null }[] | null>;
export type Settings = Partial<SettingsDict>;

export interface TransientOpts {
    append?: boolean;
    defaults?: boolean;
    exclude?: boolean;
    overwrite?: boolean;
}
