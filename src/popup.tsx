import React from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "./PopupApp";
import { usePopupStore } from "./PopupApp/popupStore";
import "./styles/popup.css";

const { Provider } = usePopupStore;
const rootNode = document.getElementById("content");
const root = createRoot(rootNode);
root.render(
  <Provider>
    <PopupApp />
  </Provider>
);
