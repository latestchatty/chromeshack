import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "@/components/popup";
import "@/components/styles/popup.css";

const rootNode = document.getElementById("content");
const root = createRoot(rootNode!);
root.render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
