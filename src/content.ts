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

(async () => {
    await contentScriptLoaded();
    // early modules
    await Collapse.install();
    await TwitchAutoplay.install();
    LocalTimeStamp.install();
    UserPopup.install();
    ModBanners.install();
    await PostStyling.install();
    await HighlightUsers.install();
    await CustomUserFilters.install();
    await Switchers.install();

    // heavy modules
    MediaEmbedder.install();
    NwsIncognito.install();
    await HighlightPendingPosts.install();
    await NewCommentHighlighter.install();
    await ThreadPane.install();
    await ChattyNews.install();

    // everything else
    await CommentTags.install();
    ImageUploader.install();

    Drafts.install();
    PostPreview.install();
    Templates.install();
    EmojiPoster.install();
    PostLengthCounter.install();

    // always make sure the ChromeShack event observer is last
    await ChromeShack.install();
})();
