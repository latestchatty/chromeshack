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
import { DinoGegtik } from "./optional/dinogegtik";
import { Drafts } from "./optional/drafts";
import { HighlightPendingPosts } from "./optional/highlightpending";
import { HighlightUsers } from "./optional/highlight_users";
import { MediaEmbedder } from "./optional/media-embedder";
import { NewCommentHighlighter } from "./optional/new_comment_highlighter";
import { NwsIncognito } from "./optional/nws_incognito";
import { PostPreview } from "./optional/postpreview";
import { PostStyling } from "./optional/post_style";
import { SparklyComic } from "./optional/sparkly_comic";
import { Switchers } from "./optional/switchers";
import { Templates } from "./optional/templates";
import { ThreadPane } from "./optional/threadpane";
import { TwitchAutoplay } from "./optional/twitch_autoplay";
import "./styles/chromeshack.css";
import "./styles/comic_scripts.css";

(async () => {
    try {
        await contentScriptLoaded();
        // ^ make sure this is first
        await ChattyNews.install();
        await Collapse.install();
        await CommentTags.install();
        await CustomUserFilters.install();
        await DinoGegtik.install();
        await HighlightPendingPosts.install();
        await HighlightUsers.install();
        await NewCommentHighlighter.install();
        await PostStyling.install();
        await SparklyComic.install();
        await Switchers.install();
        await TwitchAutoplay.install();
        await ThreadPane.install();
        Drafts.install();
        EmojiPoster.install();
        ImageUploader.install();
        LocalTimeStamp.install();
        MediaEmbedder.install();
        ModBanners.install();
        NwsIncognito.install();
        PostLengthCounter.install();
        PostPreview.install();
        Templates.install();
        UserPopup.install();
        // always make sure the ChromeShack observer is last
        ChromeShack.install();
    } catch (e) {
        console.error(e);
    }
})();
