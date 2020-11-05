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
//import { Templates } from "./optional/templates";
import { TwitchAutoplay } from "./optional/twitch_autoplay";
import { singleThreadFix } from "./patches/singleThreadFix";
import "./styles/chromeshack.css";

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
        // optional async modules that rely on toggles
        await ChattyNews.install();
        await CustomUserFilters.install();
        await HighlightPendingPosts.install();
        await HU_Instance.install();
        await MediaEmbedder.install();
        await TwitchAutoplay.install();
        // other optional modules that rely on toggles
        Drafts.install();
        NewCommentHighlighter.install();
        NwsIncognito.install();
        PostPreview.install();
        PostStyling.install();
        Switchers.install();
        //Templates.install();
        ThreadPane.install();

        // non-optional modules
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
