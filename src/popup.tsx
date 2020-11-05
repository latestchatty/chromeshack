import React from "react";
import { render } from "react-dom";
import { PopupApp } from "./PopupApp";
import { usePopupStore } from "./PopupApp/popupStore";
import "./styles/popup.css";

(() => {
    const { Provider } = usePopupStore;
    const rootNode = document.getElementById("content");
    render(
        <Provider>
            <PopupApp />
        </Provider>,
        rootNode,
    );
})();
