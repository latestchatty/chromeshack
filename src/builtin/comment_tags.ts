import * as textFieldEdit from "text-field-edit";
import { domMeasure, domMutate, parseToElement } from "../core/common";
import { processPostBoxEvent } from "../core/events";

export const CommentTags = {
    install() {
        processPostBoxEvent.addHandler(CommentTags.installCommentTags);
    },

    installCommentTags() {
        const postform = document.getElementById("postform");
        if (postform) {
            const tags = [
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
                    ["olive", "e[", "]e", "jt_olive"],
                    ["underline", "_[", "]_", "jt_underline"],
                ],
                [
                    ["limegreen", "l[", "]l", "jt_lime"],
                    ["strike", "-[", "]-", "jt_strike"],
                ],
                [
                    ["orange", "n[", "]n", "jt_orange"],
                    ["spoiler", "o[", "]o", "jt_spoiler", "return doSpoiler(event);"],
                ],
                [
                    ["multisync", "p[", "]p", "jt_pink"],
                    ["code", "/{{", "}}/", "jt_code"],
                ],
            ];

            const table = parseToElement(
                /*html*/ `<table id='shacktags_legend_table' style='display: table;'><tbody></tbody></table>`,
            );
            const place = table.querySelector("tbody");
            for (const tr of tags) {
                const row = place.appendChild(document.createElement("tr"));
                for (const tag of tr) {
                    const [name, opening_tag, closing_tag, class_name, clickFuncAsString] = tag || [];
                    const name_td = row.appendChild(document.createElement("td"));
                    name_td.appendChild(parseToElement(/*html*/ `<span class='${class_name}'>${name}</span>`));
                    if (clickFuncAsString?.length > 0) name_td.setAttribute("onclick", clickFuncAsString);
                    const code_td = row.appendChild(document.createElement("td"));
                    const button = code_td.appendChild(document.createElement("a"));
                    const buttonText = `${opening_tag}...${closing_tag}`;
                    button.appendChild(document.createTextNode(buttonText));
                    button.href = "#";
                    button.addEventListener("click", async (e: MouseEvent) => {
                        e.preventDefault();
                        await CommentTags.insertCommentTag(name, opening_tag, closing_tag);
                    });
                }
            }

            const shacktag_legends = document.getElementById("shacktags_legend");
            const original_shacktags_legend_table = document.getElementById("shacktags_legend_table");
            domMutate(() => {
                shacktag_legends.removeChild(original_shacktags_legend_table);
                shacktag_legends.appendChild(table);
            });
        }
    },

    insertCommentTag(name: string, opening_tag: string, closing_tag: string) {
        return domMeasure(() => {
            const textarea = document.getElementById("frm_body") as HTMLInputElement;
            const scrollPosition = textarea.scrollTop;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            let input: string;
            if (end > start) input = textarea.value.substring(start, end);
            else input = prompt("Type in the text you want to be " + name + ".", "");

            if (!input || input?.length === 0) {
                textarea.focus();
                return;
            }

            // clean up the input
            let whiteSpaceBefore = false;
            const whiteSpaceAfter = false;
            if (name == "code") {
                whiteSpaceBefore = /^\s\s*/.test(input);
                whiteSpaceBefore = /\s\s*$/.test(input);
                // trim only excess ending whitespace
                input = input.replace(/\s\s*$/, "");
            }
            // break up curly braces that confuse the shack
            else input = input.replace(/^{/, "\n{").replace(/}$/, "}\n");

            const mutatedComment =
                textarea.value.substring(0, start) +
                (whiteSpaceBefore ? " " : "") +
                opening_tag +
                input +
                closing_tag +
                (whiteSpaceAfter ? " " : "") +
                textarea.value.substring(end, textarea.value.length);
            textFieldEdit.set(textarea, mutatedComment);

            let offset = whiteSpaceBefore ? 1 : 0;
            if (end > start) {
                offset += start + opening_tag.length;
                textarea.setSelectionRange(offset, offset + input.length);
            } else {
                offset += start + input.length + opening_tag.length + closing_tag.length;
                offset += whiteSpaceAfter ? 1 : 0;
                textarea.setSelectionRange(offset, offset);
            }

            textarea.focus();
            textarea.scrollTop = scrollPosition;
        });
    },
};
