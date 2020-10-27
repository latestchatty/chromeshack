import React from "react";
import { render } from "react-dom";
import { processPostBoxEvent } from "../../core/events";
import type { PostboxEventArgs } from "../../core/events.d";
import { ImageUploaderApp } from "./ImageUploaderApp";
import { useUploaderStore } from "./uploaderStore";

export const ImageUploader = {
    install() {
        processPostBoxEvent.addHandler(ImageUploader.installForm);
    },

    installForm(args: PostboxEventArgs) {
        const { postbox } = args || {};
        const { Provider: UploaderProvider } = useUploaderStore;
        const postForm = postbox?.querySelector("#postform");

        const postFooter = document.createElement("div");
        postFooter.setAttribute("class", "post_sub_container");
        const IUContainer = document.createElement("div");
        IUContainer.setAttribute("id", "react-container");
        postFooter.appendChild(IUContainer);
        // insert our footer at the bottom of the postbox
        postForm.appendChild(postFooter);

        // move the shacktags legend into our footer for alignment
        const tagsLegend = postForm.querySelector("#shacktags_legend");
        postFooter.insertBefore(tagsLegend, postFooter.childNodes[0]);
        // render our component on the postbox's chosen container node
        const renderContainer = postForm.querySelector("#react-container");

        return render(
            <UploaderProvider>
                <ImageUploaderApp postboxEl={postbox} />
            </UploaderProvider>,
            renderContainer,
        );
    },
};
