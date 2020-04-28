import ChromeShack from "./core/observers";

import ChattyNews from "./optional/chatty-news";
import CustomUserFilters from "./optional/custom_user_filters";
import DinoGegtik from "./optional/dinogegtik";
import EmbedSocials from "./optional/embed_socials";
import GetPost from "./optional/getpost";
import HighlightPendingPosts from "./optional/highlight_pending_new_posts";
import HighlightUsers from "./optional/highlight_users";
import ImageLoader from "./optional/image_loader";
import NewCommentHighlighter from "./optional/new_comment_highlighter";
import NwsIncognito from "./optional/nws_incognito";
import PostPreview from "./optional/post_preview";
import PostStyling from "./optional/post_style";
import SparklyComic from "./optional/sparkly_comic";
import Switchers from "./optional/switchers";
import ThreadPane from "./optional/thread_pane";
import VideoLoader from "./optional/video_loader";

import CodeTagFix from "./builtin/codetagfix";
import Collapse from "./builtin/collapse";
import CommentTags from "./builtin/comment_tags";
import EmojiPoster from "./builtin/emoji_poster";
import ImageUploader from "./builtin/image-uploader";
import LocalTimeStamp from "./builtin/local_timestamp";
import ModBanners from "./builtin/mod_banners";
import NuLOLFix from "./builtin/nulol_refresh_fix";
import PostLengthCounter from "./builtin/post_length_counter";
import UserPopup from "./builtin/userpopup";

//import MediaEmbedder from "./optional/media-embedder";

import "../styles/chatty-news.css";
import "../styles/chromeshack.css";
import "../styles/comic_scripts.css";
import "../styles/embed_socials.css";
import "../styles/image_uploader.css";
import "../styles/media.css";
import "../styles/two_pane.css";

// save some important refs for later
export const CS_Instance = ChromeShack;
export const HU_Instance = HighlightUsers;
export const TP_Instance = ThreadPane;

Promise.all([
    // optional modules that rely on toggles
    ChattyNews.install(),
    CustomUserFilters.install(),
    DinoGegtik.install(),
    EmbedSocials.install(),
    GetPost.install(),
    HighlightPendingPosts.install(),
    HU_Instance.install(),
    ImageLoader.install(),
    NewCommentHighlighter.install(),
    NwsIncognito.install(),
    PostPreview.install(),
    PostStyling.install(),
    SparklyComic.install(),
    Switchers.install(),
    TP_Instance.install(),
    VideoLoader.install(),
    //MediaEmbedder.install(),
]).then(() => {
    CodeTagFix.install();
    Collapse.install();
    CommentTags.install();
    EmojiPoster.install();
    ImageUploader.install();
    LocalTimeStamp.install();
    ModBanners.install();
    NuLOLFix.install();
    PostLengthCounter.install();
    UserPopup.install();

    // always make sure the ChromeShack event observer is last
    CS_Instance.install();
});
