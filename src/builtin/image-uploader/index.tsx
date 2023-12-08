import React from "react";
import { createRoot } from "react-dom/client";
import { parseToElement } from "../../core/common/dom";
import { processPostBoxEvent } from "../../core/events";
import "../../styles/image_uploader.css";
import { ImageUploaderApp } from "./ImageUploaderApp";

export const ImageUploader = {
	cachedEl: null as HTMLElement,

	install() {
		processPostBoxEvent.addHandler(ImageUploader.apply);
		ImageUploader.cacheInjectable();
	},

	cacheInjectable() {
		const el = parseToElement(
			/* html */ `<div id="image__uploader__container" />`,
		);
		ImageUploader.cachedEl = el as HTMLElement;
	},

	async apply(args: PostboxEventArgs) {
		const { postbox } = args || {};
		const renderContainer = postbox?.querySelector("#post_sub_container");
		let appContainer = renderContainer?.querySelector(
			"#image__uploader__container",
		);
		if (!appContainer && renderContainer) {
			appContainer = ImageUploader.cachedEl;
			const root = createRoot(appContainer!);
			root.render(<ImageUploaderApp postboxEl={postbox} />);
			// insert our footer at the bottom of the postbox
			renderContainer.append(appContainer);
		}
	},
};
