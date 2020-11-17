import * as textFieldEdit from "text-field-edit";
import { parseToElement } from "../core/common";
import { processPostBoxEvent } from "../core/events";
import { getSetting, setSetting } from "../core/settings";
import "../styles/comment_tags.css";

export const CommentTags = {
    cachedEl: null as HTMLElement,

    tags: [
        [
            ["red", "r{", "}r", "jt_red"],
            ["italics", "/[", "]/", "jt_italics"],
        ],
        [
            ["green", "g{", "}g", "jt_green"],
            ["bold", "b[", "]b", "jt_bold"],
        ],
        [
            ["blue", "b{", "}b", "jt_blue"],
            ["quote", "q[", "]q", "jt_quote"],
        ],
        [
            ["yellow", "y{", "}y", "jt_yellow"],
            ["sample", "s[", "]s", "jt_sample"],
        ],
        [
            ["limegreen", "l[", "]l", "jt_lime"],
            ["underline", "_[", "]_", "jt_underline"],
        ],
        [
            ["orange", "n[", "]n", "jt_orange"],
            ["strike", "-[", "]-", "jt_strike"],
        ],
        [
            ["multisync", "p[", "]p", "jt_pink"],
            ["spoiler", "o[", "]o", "jt_spoiler", "return doSpoiler(event);"],
        ],
        [
            ["olive", "e[", "]e", "jt_olive"],
            ["code", "/{{", "}}/", "jt_code"],
        ],
    ],

    async install() {
        processPostBoxEvent.addHandler(CommentTags.installCommentTags);
        await CommentTags.cacheInjectables();
    },

    async cacheInjectables() {
        const setToggled = (await getSetting("tags_legend_toggled", false)) as boolean;
        const table = parseToElement(/*html*/ `
            <div id="post_sub_container">
                <div id="shacktags_legend">
                    <a href="#" id="shacktags_legend_toggle">Shack Tags Legend</a>
                    <table id="shacktags_legend_table" class="${!setToggled ? "hidden" : ""}">
                        <tbody id="shacktags_legend_table-body"></tbody>
                    </table>
                </div>
            </div>
        `) as HTMLElement;
        const tbody = table.querySelector("#shacktags_legend_table-body");
        for (const tr of CommentTags.tags) {
            const row = tbody.appendChild(document.createElement("tr"));
            for (const tag of tr) {
                const [name, opening_tag, closing_tag, class_name, clickFuncAsString] = tag || [];
                const name_td = row.appendChild(document.createElement("td"));
                const span = parseToElement(/*html*/ `<span class="${class_name}">${name}</span>`);
                name_td.appendChild(span);
                if (clickFuncAsString?.length > 0) name_td.setAttribute("onclick", clickFuncAsString);
                const code_td = row.appendChild(document.createElement("td"));
                const button = code_td.appendChild(document.createElement("a"));
                button.textContent = `${opening_tag}...${closing_tag}`;
                button.href = "#";
                button.addEventListener("click", async (e: MouseEvent) => {
                    e.preventDefault();
                    CommentTags.insertCommentTag(name, opening_tag, closing_tag);
                });
            }
        }
        table.addEventListener("click", CommentTags.toggleLegend, true);
        CommentTags.cachedEl = table;
    },

    async installCommentTags(args: PostboxEventArgs) {
        if (!args) return;
        const { postbox } = args || {};
        const postForm = postbox.querySelector("#postform");
        // remove the pre-existing legend box
        const ogLegend = postForm?.querySelector("fieldset > #shacktags_legend");
        ogLegend.parentElement.removeChild(ogLegend);
        const legend = postForm?.querySelector("#post_sub_container");
        const cachedLegend = CommentTags.cachedEl;
        if (!legend) postForm.append(cachedLegend);
    },

    async toggleLegend(e: MouseEvent) {
        e.preventDefault();
        const _this = e.target as HTMLElement;
        const isToggle = _this?.id?.indexOf("shacktags_legend_toggle") > -1;
        const table = _this?.parentElement.querySelector("#shacktags_legend_table");
        const enabled = !table?.classList?.contains("hidden");
        if (isToggle && table) {
            await setSetting("tags_legend_toggled", !enabled);
            table.classList.toggle("hidden");
        }
    },

    insertCommentTag(name: string, opening_tag: string, closing_tag: string) {
        const textarea = document.getElementById("frm_body") as HTMLInputElement;
        const scrollPos = textarea.scrollTop;
        let value = textarea?.value;
        const selectStart = textarea.selectionStart;
        const selectEnd = textarea.selectionEnd;
        // remove line-ending whitespace
        if (name === "code") value = value.replace(/\s\s*$/, "");
        // break up curly braces that confuse the shack
        else value = value.replace(/^{/, "\n{").replace(/}$/, "}\n");
        if (selectStart >= 0 && selectEnd > 0) {
            const beforeSelection = value.substring(0, selectStart);
            const afterSelection = value.substring(selectEnd, value.length);
            const selection = value.substring(selectStart, selectEnd);
            const mutatedText = `${beforeSelection}${opening_tag}${selection}${closing_tag}${afterSelection}`;
            const selectStartOffset = selectStart + opening_tag.length;
            const selectEndOffset = selectEnd + closing_tag.length;
            textFieldEdit.set(textarea, mutatedText);
            textarea.focus();
            textarea.setSelectionRange(selectStartOffset, selectEndOffset);
            textarea.scrollTop = scrollPos;
        } else alert("Select some text to apply this tag");
    },
};
