import { Collapse } from "./builtin/collapse";
import { CommentTags } from "./builtin/comment_tags";
import { EmojiPoster } from "./builtin/emoji_poster";
import { ImageUploader } from "./builtin/image-uploader";
import { LocalTimeStamp } from "./builtin/local_timestamp";
import { ModBanners } from "./builtin/mod_banners";
import { PostLengthCounter } from "./builtin/post_length_counter";
import { UserPopup } from "./builtin/userpopup";
import { ChromeShack } from "./core/observer";
import { contentScriptLoaded } from "./core/observer_handlers";
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
import { Templates } from "./optional/templates";
import { ThreadPane } from "./optional/threadpane";
import { TwitchAutoplay } from "./optional/twitch_autoplay";
import "./styles/chromeshack.css";

// save some important refs for later
export const CS_Instance = ChromeShack;
export const HU_Instance = HighlightUsers;

(async () => {
    await contentScriptLoaded();
    // optional modules that rely on toggles
    await ChattyNews.install();
    await CustomUserFilters.install();
    await HighlightPendingPosts.install();
    await HU_Instance.install();
    await NewCommentHighlighter.install();
    await PostStyling.install();
    await Switchers.install();
    await ThreadPane.install();
    await TwitchAutoplay.install();
    Drafts.install();
    MediaEmbedder.install();
    NwsIncognito.install();
    PostPreview.install();
    Templates.install();

    // non-optional modules
    await Collapse.install();
    CommentTags.install();
    EmojiPoster.install();
    ImageUploader.install();
    LocalTimeStamp.install();
    ModBanners.install();
    PostLengthCounter.install();
    UserPopup.install();
    // always make sure the ChromeShack event observer is last
    await CS_Instance.install();
})();
