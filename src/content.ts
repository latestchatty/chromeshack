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
import { ChattyNews } from "./optional/chatty-news";
import { CustomUserFilters } from "./optional/custom_user_filters";
import { DinoGegtik } from "./optional/dinogegtik";
import { HighlightPendingPosts } from "./optional/highlightpending";
import { HighlightUsers } from "./optional/highlight_users";
import { MediaEmbedder } from "./optional/media-embedder";
import { NewCommentHighlighter } from "./optional/new_comment_highlighter";
import { NwsIncognito } from "./optional/nws_incognito";
import { PostPreview } from "./optional/post_preview";
import { PostStyling } from "./optional/post_style";
import { SparklyComic } from "./optional/sparkly_comic";
import { Switchers } from "./optional/switchers";
import { ThreadPane } from "./optional/threadpane";
import { TwitchAutoplay } from "./optional/twitch_autoplay";
import "./styles/chatty-news.css";
import "./styles/chromeshack.css";
import "./styles/comic_scripts.css";
import "./styles/embed_socials.css";
import "./styles/highlight_pending.css";
import "./styles/image_uploader.css";
import "./styles/media.css";
import "./styles/threadpane.css";
import "./styles/userpopup.css";

// save some important refs for later
export const CS_Instance = ChromeShack;
export const HU_Instance = HighlightUsers;

// open a message channel for WinChatty events
TabMessenger.connect();

try {
    Promise.all([
        // optional modules that rely on toggles
        ChattyNews.install(),
        TwitchAutoplay.install(),
        CustomUserFilters.install(),
        HighlightPendingPosts.install(),
        HU_Instance.install(),
        NewCommentHighlighter.install(),
        NwsIncognito.install(),
        PostPreview.install(),
        PostStyling.install(),
        DinoGegtik.install(),
        SparklyComic.install(),
        Switchers.install(),
        ThreadPane.install(),
        MediaEmbedder.install(),
    ]).then(() => {
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
    });
} catch (e) {
    console.error(e);
}
