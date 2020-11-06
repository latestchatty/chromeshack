import React from "react";
import { render } from "react-dom";
import { enabledContains, getEnabledSuboption } from "../../core/settings";
import { ThreadPaneApp } from "./ThreadPaneApp";
import { parsePosts } from "./helpers";
import "../../styles/threadpane.css";
import fastdom from "fastdom";
import { observerInstalledEvent } from "../../core/events";

const ThreadPane = {
    install() {
        observerInstalledEvent.addHandler(ThreadPane.apply);
    },

    async apply() {
        const enabled = await enabledContains(["thread_pane"]);
        const container = document.querySelector("div.cs_thread_pane");
        const chatty = document.getElementById("newcommentbutton");
        const testing = await getEnabledSuboption("testing_mode");
        // only enable thread pane on the main Chatty
        if ((testing || chatty) && enabled && !container) {
            // apply css to make room for threadpane div
            document.querySelector("body")?.classList?.add("cs_thread_pane_enable");
            const root = document.getElementById("page");
            const threads = document.querySelector("div.threads") as HTMLElement;
            const parsed = await parsePosts(threads);
            const appContainer = document.createElement("div");
            appContainer.setAttribute("id", "cs_thread_pane");
            fastdom.mutate(() => {
                render(<ThreadPaneApp parsedPosts={parsed} />, appContainer);
                root.appendChild(appContainer);
            });
        }
    },
};

export { ThreadPane };
