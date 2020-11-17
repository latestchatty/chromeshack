import React from "react";
import { render } from "react-dom";
import { parseToElement } from "../../core/common";
import { processPostBoxEvent } from "../../core/events";
import "../../styles/image_uploader.css";
import { ImageUploaderApp } from "./ImageUploaderApp";
import { useUploaderStore } from "./uploaderStore";

export const ImageUploader = {
    cachedEl: null as HTMLElement,

    install() {
        processPostBoxEvent.addHandler(ImageUploader.apply);
        ImageUploader.cacheInjectable();
    },

    cacheInjectable() {
        const el = parseToElement(/* html */ `<div id="image__uploader__container" />`);
        ImageUploader.cachedEl = el as HTMLElement;
    },

    async apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const { Provider: UploaderProvider } = useUploaderStore;
        const renderContainer = postbox?.querySelector("#post_sub_container");
        let appContainer = renderContainer?.querySelector("#image__uploader__container");
        if (!appContainer && renderContainer) {
            appContainer = ImageUploader.cachedEl;
            render(
                <UploaderProvider>
                    <ImageUploaderApp postboxEl={postbox} />
                </UploaderProvider>,
                appContainer,
            );
            // insert our footer at the bottom of the postbox
            renderContainer.append(appContainer);
        }
    },
};
