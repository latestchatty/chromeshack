import React from "react";
import { createRoot } from "react-dom/client";
import { parseToElement } from "../../core/common/dom";
import { enabledContains, getEnabledSuboption } from "../../core/settings";
import "../../styles/threadpane.css";
import { ThreadPaneApp } from "./ThreadPaneApp";

const ThreadPane = {
	async install() {
		const enabled = await enabledContains(["thread_pane"]);
		if (!enabled) return;

		const chatty = document.getElementById("newcommentbutton");
		const testing = await getEnabledSuboption("testing_mode");
		const container = document.querySelector("div#cs_thread_pane");
		// only enable thread pane on the main Chatty
		if (testing || (chatty && !container)) {
			// apply css to make room for threadpane div
			document.querySelector("body")?.classList?.add("cs_thread_pane_enable");
			const rootEl = document.getElementById("page");
			const appContainer = parseToElement(`<div id="cs_thread_pane" />`);

			const root = createRoot(appContainer!);
			rootEl.append(appContainer);
			root.render(<ThreadPaneApp />);
		}
	},
};

export { ThreadPane };
