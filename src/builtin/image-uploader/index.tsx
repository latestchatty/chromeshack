import React from "react";
import { render } from "react-dom";
import { processPostBoxEvent } from "../../core/events";
import { ImageUploaderApp } from "./ImageUploaderApp";
import { useUploaderStore } from "./uploaderStore";

export const ImageUploader = {
    install() {
        processPostBoxEvent.addHandler(ImageUploader.installForm);
    },

    installForm(item: HTMLElement) {
        const { Provider: UploaderProvider } = useUploaderStore;
        const postForm = item.querySelector("#postform");

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
                <ImageUploaderApp parentRef={item} />
            </UploaderProvider>,
            renderContainer,
        );
    },
};
