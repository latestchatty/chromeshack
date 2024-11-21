import { Collapse } from "@/components/builtin/collapse";
import { ColorGauge } from "@/components/builtin/color_gauge";
import { CommentTags } from "@/components/builtin/comment_tags";
import { EmojiPoster } from "@/components/builtin/emoji_poster";
import { ImageUploader } from "@/components/builtin/image-uploader";
import { LocalTimeStamp } from "@/components/builtin/local_timestamp";
import { ModBanners } from "@/components/builtin/mod_banners";
import { PostLengthCounter } from "@/components/builtin/post_length_counter";
import { UserPopup } from "@/components/builtin/userpopup";
import { ChromeShack } from "@/components/core/observer";
import { contentScriptLoaded } from "@/components/core/observer_handlers";
import { ChattyNews } from "@/components/optional/chatty-news";
import { CustomUserFilters } from "@/components/optional/custom_user_filters";
import { DinoGegtik } from "@/components/optional/dinogegtik";
import { Drafts } from "@/components/optional/drafts";
import { HighlightUsers } from "@/components/optional/highlight_users";
import { HighlightPendingPosts } from "@/components/optional/highlightpending";
import { MediaEmbedder } from "@/components/optional/media-embedder";
import { NewCommentHighlighter } from "@/components/optional/new_comment_highlighter";
import { PostStyling } from "@/components/optional/post_style";
import { PostPreview } from "@/components/optional/postpreview";
import { SparklyComic } from "@/components/optional/sparkly_comic";
import { Switchers } from "@/components/optional/switchers";
import { Templates } from "@/components/optional/templates";
import { ThreadPane } from "@/components/optional/threadpane";
import { TwitchAutoplay } from "@/components/optional/twitch_autoplay";
import type { ContentScriptContext } from "wxt/client";

import "@/components/styles/chromeshack.css";
import "@/components/styles/comic_scripts.css";
import "@/components/styles/image_uploader.css";
import "@/components/styles/color_gauge.css";
import "@/components/styles/comment_tags.css";
import "@/components/styles/embla.css";
import "@/components/styles/media.css";
import "@/components/styles/templates.css";
import "@/components/styles/post_preview.css";
import "@/components/styles/highlight_pending.css";
import "@/components/styles/chattypost.css";
import "@/components/styles/threadpane.css";
import "@/components/styles/drafts.css";
import "@/components/styles/chatty-news.css";
import "@/components/styles/embla.css";
import "@/components/styles/userpopup.css";

export default defineContentScript({
  matches: ["https://www.shacknews.com/chatty*"],

  main(_: ContentScriptContext) {
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
        PostLengthCounter.install();
        PostPreview.install();
        Templates.install();
        UserPopup.install();
        ColorGauge.install();
        // always make sure the ChromeShack observer is last
        ChromeShack.install();
      } catch (e) {
        console.error(e);
      }
    })();
  },
});
