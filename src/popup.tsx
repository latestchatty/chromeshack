import React from "react";
import { render } from "react-dom";
import { PopupApp } from "./PopupApp";
import { usePopupStore } from "./PopupApp/popupStore";

require("./styles/popup.css");

const { Provider } = usePopupStore;

document.addEventListener("DOMContentLoaded", () => {
    const rootNode = document.getElementById("content");
    render(
        <Provider>
            <PopupApp />
        </Provider>,
        rootNode,
    );
});
