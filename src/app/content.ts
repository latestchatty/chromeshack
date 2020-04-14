import ChromeShack from "./core/observers";

import CommentTags from "./builtin/comment_tags";
import Collapse from "./builtin/collapse";
import ModBanners from "./builtin/mod_banners";
import EmojiPoster from "./builtin/emoji_poster";
import LocalTimeStamp from "./builtin/local_timestamp";
import UserPopup from "./builtin/userpopup";
import ImageUploader from "./builtin/image-uploader";
import NuLOLFix from "./builtin/nulol_refresh_fix";
import CodeTagFix from "./builtin/codetagfix";

import ChattyNews from "./optional/chatty-news";
import HighlightUsers from "./optional/highlight_users";
import CustomUserFilters from "./optional/custom_user_filters";
import ThreadPane from "./optional/thread_pane";
import VideoLoader from "./optional/video_loader";
import ImageLoader from "./optional/image_loader";
import Switchers from "./optional/switchers";
import SparklyComic from "./optional/sparkly_comic";
import DinoGegtik from "./optional/dinogegtik";
import PostStyling from "./optional/post_style";
import GetPost from "./optional/getpost";
import HighlightPendingPosts from "./optional/highlight_pending_new_posts";
import NewCommentHighlighter from "./optional/new_comment_highlighter";
import PostLengthCounter from "./builtin/post_length_counter";
import PostPreview from "./optional/post_preview";
import EmbedSocials from "./optional/embed_socials";

require("../styles/chatty-news.css");
require("../styles/chromeshack.css");
require("../styles/comic_scripts.css");
require("../styles/embed_socials.css");
require("../styles/image_uploader.css");
require("../styles/media.css");
require("../styles/two_pane.css");

// save some important refs for later
export const CS_Instance = ChromeShack;
export const HU_Instance = HighlightUsers;
export const TP_Instance = ThreadPane;

Promise.all([
    // optional modules that rely on toggles
    HU_Instance.install(),
    CustomUserFilters.install(),
    ImageLoader.install(),
    VideoLoader.install(),
    Switchers.install(),
    ChattyNews.install(),
    SparklyComic.install(),
    DinoGegtik.install(),
    GetPost.install(),
    HighlightPendingPosts.install(),
    NewCommentHighlighter.install(),
    PostPreview.install(),
    EmbedSocials.install(),
    TP_Instance.install(),
]).then(() => {
    PostStyling.install();
    PostLengthCounter.install();
    ModBanners.install();
    LocalTimeStamp.install();
    CommentTags.install();
    Collapse.install();
    EmojiPoster.install();
    UserPopup.install();
    NuLOLFix.install();
    CodeTagFix.install();
    ImageUploader.install();

    // always make sure the ChromeShack event observer is last
    CS_Instance.install();
});
