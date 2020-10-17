/* eslint react-hooks/exhaustive-deps: 0 */
import React, { useEffect } from "react";
import { browser } from "webextension-polyfill-ts";
import { classNames } from "../core/common";
import { resetSettings } from "../core/settings";
import { getState, setSettingsState } from "./actions";
import { FilterBox } from "./FilterBox";
import { HighlightGroups } from "./HighlightGroups";
import { ImportExport } from "./ImportExport";
import type { PopupState } from "./index.d";
import { Option, OptionButton, OptionGroup, Suboption } from "./Options";
import { usePopupStore } from "./popupStore";

declare global {
    interface Window {
        browser: any;
    }
}
const isChromeBrowser = !window.browser ? true : false;

const PopupApp = () => {
    const { useStoreState, useStoreDispatch } = usePopupStore;
    const state = useStoreState() as PopupState;
    const dispatch = useStoreDispatch();

    const handleResetBtn = () => {
        (async () => {
            const freshSettings = await resetSettings().then(getState);
            dispatch({ type: "INIT", payload: freshSettings });
        })();
    };
    const handleRlsNotesBtn = () => {
        browser.tabs.create({
            url: browser.runtime.getURL("release_notes.html"),
        });
    };

    useEffect(() => {
        // debounce our state updates
        const handler = setTimeout(() => {
            (async () => {
                try {
                    await setSettingsState(state);
                    console.log("PopupApp state update:", JSON.stringify(state).length);
                } catch (e) {
                    console.error(e);
                }
            })();
        }, 250);
        return () => clearTimeout(handler);
    }, [state]);
    useEffect(() => {
        // populate our initial state from our local settings store
        (async () => dispatch({ type: "INIT", payload: await getState() }))();
    }, []);

    return (
        <div
            className={classNames({
                firefox__padding: !isChromeBrowser,
                chrome__padding: isChromeBrowser,
            })}
        >
            <div id="stylesTab">
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
                </OptionGroup>

                <OptionGroup label="User Flair">
                    <Option id="shrink_user_icons" label="Shrink user icons" />
                    <Option id="reduced_color_user_icons" label="Reduced color user icons" />
                </OptionGroup>
            </div>
            <div id="embedTab">
                <OptionGroup label="Multimedia Embedding" infolabel="Show multimedia links inline when clicked.">
                    <Option
                        id="media_loader"
                        label="Embed media"
                        descriptions={[
                            "Replace media links with embedded media when clicked.",
                            "Supported image links: Dropbox, Gfycat, Giphy, Imgur, Tenor, and more.",
                            "Supported video links: Youtube, Twitch, Streamable, and XboxDVR.",
                        ]}
                    />
                    <Option
                        id="social_loader"
                        label="Embed social media"
                        descriptions={["Supported links: Twitter and Instagram."]}
                    >
                        <Suboption
                            id="social_loader_settings"
                            optionid="sl_show_tweet_threads"
                            label="Show Twitter threads when opening Twitter links"
                        />
                    </Option>
                    <Option
                        id="getpost"
                        label="Embed Chatty posts"
                        descriptions={["Replace Shacknews Chatty links with embedded posts when clicked."]}
                    ></Option>
                    <Option id="auto_open_embeds" label="Open embedded media links by default" />
                    <Option
                        id="twitchauto"
                        label="Disable Chatty Twitch Auto-play"
                        descriptions={["Disable auto-play on the Chatty's article Twitch embed."]}
                    ></Option>
                </OptionGroup>
            </div>

            <div id="postsTab">
                <OptionGroup
                    label="Post Enhancements"
                    infolabel="Various enhancements to the display of expanded posts."
                >
                    <Option
                        id="nws_incognito"
                        label="Open NWS links in incognito mode"
                        descriptions={[
                            "When clicking links in posts moderated as Not Work Safe, open in an incognito window rather than a normal window. Firefox users must enable 'Run in Private Windows' in the addon settings.",
                        ]}
                    />
                    <Option
                        id="switchers"
                        label="Shame switchers"
                        descriptions={["Show the original username of shackers who changed names."]}
                    />
                </OptionGroup>
            </div>

            <div id="notifyTab">
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

            <div id="highlightTab">
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
            </div>

            <div id="userFiltersTab">
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
                    ></Suboption>
                    <FilterBox
                        id="custom_user_filter"
                        classes="custom_user_filters_container"
                        type="SET_FILTERS"
                        options={state.filters}
                    />
                </OptionGroup>
            </div>

            <div id="extrasTab">
                <OptionGroup label="Bells and whistles">
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
                        descriptions={[
                            "Allow previewing a post, with full Shacktag formatting, before submitting the post.",
                        ]}
                    />
                    <Option
                        id="chatty_news"
                        label="Chatty News"
                        descriptions={["Adds a recent Shacknews articles box to the top of the Chatty."]}
                    />
                </OptionGroup>

                <OptionGroup
                    label="Import/Export Settings"
                    infolabel="Import/export Chrome Shack settings via clipboard."
                >
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
            </div>
        </div>
    );
};

export { PopupApp };
