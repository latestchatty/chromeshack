/* eslint react-hooks/exhaustive-deps: 0 */
import { memo, useEffect } from "react";
import { resetSettings } from "../core/settings";
import { FilterBox } from "./FilterBox";
import { HighlightGroups } from "./HighlightGroups";
import { ImportExport } from "./ImportExport";
import { Option, OptionButton, OptionGroup, Suboption } from "./Options";
import { Tabs } from "./Tabs";
import { getState, setSettingsState } from "./actions";
import { useStore } from "./popupStore";

const PopupApp = memo(() => {
  const state = useStore() as PopupState;
  const dispatch = state.dispatch;

  const handleResetBtn = () => {
    (async () => {
      const freshSettings = await resetSettings().then(getState);
      dispatch({ type: "INIT", payload: { ...freshSettings, loaded: true } });
    })();
  };
  const handleRlsNotesBtn = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("release_notes.html"),
    });
  };

  useEffect(() => {
    if (state == null || (state && Object.keys(state).length === 0)) return;
    // sync our local state store with our global state
    (async () => {
      try {
        await setSettingsState(state);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [state]);
  useEffect(() => {
    // populate our initial state from our local settings store
    (async () => {
      const _state = await getState();
      if (_state?.loaded) return;
      dispatch({ type: "INIT", payload: { ..._state, loaded: true } });
    })();
  }, [dispatch]);

  return (
    <Tabs isLoaded={state.loaded}>
      <div title="Media">
        <OptionGroup label="Multimedia Embedding" infolabel="Show multimedia links inline when clicked.">
          <Option
            id="media_loader"
            label="Embed media"
            descriptions={[
              "Replace media links with embedded media when clicked.",
              "Supported image links: Dropbox, Gfycat, Giphy, Imgflip, Imgur, Tenor, and more.",
              "Supported video links: Youtube, Twitch, Streamable, and XboxDVR.",
            ]}
          />
          <Option
            id="getpost"
            label="Embed Chatty posts"
            descriptions={["Replace Shacknews Chatty links with embedded posts when clicked."]}
          />
          <Option id="auto_open_embeds" label="Open embedded media links by default" />
          <Option
            id="twitchauto"
            label="Disable Chatty Twitch Auto-play"
            descriptions={["Disable auto-play on the Chatty's article Twitch embed."]}
          />
        </OptionGroup>
        <br />
      </div>

      <div title="Notify">
        <OptionGroup
          id="enable_notifications"
          classes="notifications__group"
          label="Push Notifications"
          infolabel="Enables push notifications (via WinChatty API) on new Chatty posts."
        >
          <FilterBox
            id="match_notifications"
            infolabel="Manage custom phrases to watch for (case insensitive):"
            type="SET_NOTIFICATIONS"
            options={state.notifications}
            allowTrailingSpace={true}
          />
        </OptionGroup>
      </div>

      <div title="Filters">
        <OptionGroup label="Highlighting" infolabel="Color highlighting within the tree of thread replies.">
          <Option
            id="highlight_pending_new_posts"
            label="Highlight refresh button when new posts are available"
            descriptions={[
              "Use the WinChatty push service to highlight threads that have received new replies that you need to refresh to see. A button at the top of the Chatty indications how many threads have new posts, and upon clicking the button, will take you to the next thread with new posts.",
            ]}
          />
          <Option
            id="new_comment_highlighter"
            label="Highlight new posts since last refresh"
            descriptions={[
              "After refreshing the Chatty, or an individual thread, show a blue bar next to posts which are new.",
            ]}
          />
          <Option
            id="highlight_users"
            label="Highlight users"
            descriptions={[
              "Highlight usernames in various colors to indicate their membership in user-specified groups.",
            ]}
          >
            <HighlightGroups />
          </Option>
        </OptionGroup>

        <OptionGroup
          id="custom_user_filters"
          label="Custom User Filters"
          infolabel="Removes posts/replies authored by matched users."
        >
          <Suboption
            id="custom_user_filters_settings"
            label="Hide matching threads in threaded mode"
            optionid="cuf_hide_fullposts"
            indented={false}
          />
          <FilterBox
            id="custom_user_filter"
            classes="custom_user_filters_container"
            type="SET_FILTERS"
            options={state.filters}
          />
        </OptionGroup>
        <br />
      </div>

      <div title="Flair">
        <OptionGroup label="[lol] Tags">
          <Option
            id="hide_tagging_buttons"
            label="Hide tagging buttons"
            descriptions={["Hides all interactive LOL buttons."]}
          />
          <Option
            id="hide_tag_counts"
            label="Hide tag counts"
            descriptions={["Hides interactive LOL buttons of oneline replies."]}
          />
          <Option
            id="hide_gamification_notices"
            label="Hide gamification notices"
            descriptions={["Hides notices that would be shown when interacting with posts/lol-tags."]}
          />
        </OptionGroup>

        <OptionGroup label="User Flair">
          <Option id="shrink_user_icons" label="Shrink user icons" />
          <Option id="reduced_color_user_icons" label="Reduced color user icons" />
        </OptionGroup>

        <OptionGroup label="User Comics">
          <Option id="dinogegtik" label="Dino-Gegtik" descriptions={["Replace gegtik posts with a dinosaur meme."]} />
          <Option
            id="sparkly_comic"
            label="Sparkly Comic"
            descriptions={["Replace sparkly posts with a storyboard."]}
          />
        </OptionGroup>
        <br />
      </div>

      <div title="Extras">
        <OptionGroup label="Bells and whistles">
          <Option
            id="switchers"
            label="Shame switchers"
            descriptions={["Show the original username of shackers who changed names."]}
          />

          <Option
            id="thread_pane"
            label="Two-Pane Layout"
            descriptions={[
              "Quickly jump to other threads using a separate pane to the left of the Chatty, similar to the tablet modes in the mobile clients.",
            ]}
          />
          <Option
            id="post_preview"
            label="Post Preview"
            descriptions={["Allow previewing a post, with full Shacktag formatting, before submitting the post."]}
          />
          <Option id="drafts" label="Drafts" descriptions={["Automatically saves/loads unposted replies."]} />
          <Option
            id="templates"
            label="Templates"
            descriptions={["Allows for saving/loading unposted replies as templates."]}
          />
          <Option
            id="chatty_news"
            label="Chatty News"
            descriptions={["Adds a recent Shacknews articles box to the top of the Chatty."]}
          />
        </OptionGroup>

        <OptionGroup label="Import/Export Settings" infolabel="Import/export Chrome Shack settings via clipboard.">
          <ImportExport />
        </OptionGroup>

        <OptionButton
          id="clear_settings"
          label="Reset to Default"
          infolabel="Reset your settings to Chrome Shack's defaults. All of your changes will be lost!"
          buttonlabel="Reset"
          onClick={handleResetBtn}
        />

        <OptionButton
          id="rls_notes"
          label="Release Notes"
          infolabel="Review the Chrome Shack release notes for this version."
          buttonlabel="Release Notes"
          onClick={handleRlsNotesBtn}
        />
        <br />
      </div>
    </Tabs>
  );
});

export { PopupApp };
