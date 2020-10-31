// required to debug React components in development mode via standalone
if (process.env.NODE_ENV === "development") require("react-devtools");

import { Collapse } from "./builtin/collapse";
import { CommentTags } from "./builtin/comment_tags";
import { EmojiPoster } from "./builtin/emoji_poster";
import { ImageUploader } from "./builtin/image-uploader";
import { LocalTimeStamp } from "./builtin/local_timestamp";
import { ModBanners } from "./builtin/mod_banners";
import { PostLengthCounter } from "./builtin/post_length_counter";
import { UserPopup } from "./builtin/userpopup";
import { TabMessenger } from "./core/notifications";
import { ChromeShack } from "./core/observer";
import { processContentScriptLoaded } from "./core/observer_handlers";
import { mergeTransientSettings } from "./core/settings";
import { ChattyNews } from "./optional/chatty-news";
import { CustomUserFilters } from "./optional/custom_user_filters";
import { Drafts } from "./optional/drafts";
import { HighlightPendingPosts } from "./optional/highlightpending";
import { HighlightUsers } from "./optional/highlight_users";
import { MediaEmbedder } from "./optional/media-embedder";
import { NewCommentHighlighter } from "./optional/new_comment_highlighter";
import { NwsIncognito } from "./optional/nws_incognito";
import { PostPreview } from "./optional/postpreview";
import { PostStyling } from "./optional/post_style";
import { Switchers } from "./optional/switchers";
import { ThreadPane } from "./optional/threadpane";
import { TwitchAutoplay } from "./optional/twitch_autoplay";
import { singleThreadFix } from "./patches/singleThreadFix";
import "./styles/chatty-news.css";
import "./styles/chromeshack.css";
import "./styles/comic_scripts.css";
import "./styles/embed_socials.css";
import "./styles/highlight_pending.css";
import "./styles/image_uploader.css";
import "./styles/media.css";
import "./styles/post_preview.css";
import "./styles/threadpane.css";
import "./styles/userpopup.css";

declare global {
    interface Window {
        chrome: any;
    }
}

// save some important refs for later
export const CS_Instance = ChromeShack;
export const HU_Instance = HighlightUsers;

try {
    (async () => {
        // open a message channel for WinChatty events
        TabMessenger.connect();
        // try to fix incorrect positioning in single-thread mode
        singleThreadFix();

        // async events/supports
        await processContentScriptLoaded();
        await mergeTransientSettings();
        // optional modules that rely on toggles
        await ChattyNews.install();
        await CustomUserFilters.install();
        await Drafts.install();
        await HighlightPendingPosts.install();
        await HU_Instance.install();
        await MediaEmbedder.install();
        await NewCommentHighlighter.install();
        await NwsIncognito.install();
        await PostPreview.install();
        await PostStyling.install();
        await Switchers.install();
        await ThreadPane.install();
        await TwitchAutoplay.install();

        // sync events/supports
        Collapse.install();
        CommentTags.install();
        EmojiPoster.install();
        ImageUploader.install();
        LocalTimeStamp.install();
        ModBanners.install();
        PostLengthCounter.install();
        UserPopup.install();
        // always make sure the ChromeShack event observer is last
        CS_Instance.install();
    })();
} catch (e) {
    console.error(e);
}
