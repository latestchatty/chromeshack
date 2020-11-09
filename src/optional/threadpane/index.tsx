import React from "react";
import { render } from "react-dom";
import { domMutate, parseToElement } from "../../core/common";
import { enabledContains, getEnabledSuboption } from "../../core/settings";
import "../../styles/threadpane.css";
import { parsePosts } from "./helpers";
import { ThreadPaneApp } from "./ThreadPaneApp";

const ThreadPane = {
    async install() {
        const enabled = await enabledContains(["thread_pane"]);
        let container = document.querySelector("div.cs_thread_pane");
        const chatty = document.getElementById("newcommentbutton");
        const testing = await getEnabledSuboption("testing_mode");
        // only enable thread pane on the main Chatty
        if ((testing || chatty) && enabled && !container) {
            // apply css to make room for threadpane div
            document.querySelector("body")?.classList?.add("cs_thread_pane_enable");
            const root = document.getElementById("page");
            const threads = document.querySelector("div.threads") as HTMLElement;
            container = parseToElement(`<div id="cs_thread_pane" />`);
            const parsed = parsePosts(threads);
            render(<ThreadPaneApp parsedPosts={parsed} />, container);
            domMutate(() => root.appendChild(container));
        }
    },
};

export { ThreadPane };
