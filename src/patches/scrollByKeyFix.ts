import { browser } from "webextension-polyfill-ts";

const scrollByKeyFix = async () => {
    try {
        const status = await browser.tabs.executeScript(null, {
            code: /*javascript*/ `
/// monkeypatch nuChatty's broken scroll-post-by-A/Z functionality
if (!document.getElementById("scrollbykeyfix-wjs")) {
    function chat_onkeypress(b) {
        if (!b) {
            b = window.event;
        }
        let a = String.fromCharCode(b.keyCode);
        if (sLastClickedItem != -1 && sLastClickedRoot != -1 && check_event_target(b)) {
            if (a == "Z") {
                id = get_item_number_from_item_string(get_next_item_for_root(sLastClickedRoot, sLastClickedItem));
                if (id != false) {
                    clickItem(sLastClickedRoot, id);
                    let elem = document.querySelector(\`li#item_\${id} span.oneline_body\`);
                    elem.click();
                }
            }
            if (a == "A") {
                id = get_item_number_from_item_string(get_prior_item_for_root(sLastClickedRoot, sLastClickedItem));
                if (id != false) {
                    clickItem(sLastClickedRoot, id);
                    let elem = document.querySelector(\`li#item_\${id} span.oneline_body\`);
                    elem.click();
                }
            }
        }
        return true;
    }

    let scrollByKeyFix = document.createElement("script");
    scrollByKeyFix.id = "scrollbykeyfix-wjs";
    scrollByKeyFix.textContent = chat_onkeypress.toString();
    let bodyRef = document.getElementsByTagName("body")[0];
    bodyRef.appendChild(scrollByKeyFix);
    undefined;
}`,
        });
    } catch (e) {
        /* eat empty object exceptions */
    }
};
export default scrollByKeyFix;
