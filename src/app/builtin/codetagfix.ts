import { processPostEvent } from "../core/events";

const CodeTagFix = {
    install() {
        processPostEvent.addHandler(CodeTagFix.apply);
    },

    apply(item: HTMLElement) {
        if (item) {
            const codetags = [...item.querySelectorAll("pre.jt_code")];
            for (const codetag of codetags) {
                (<HTMLElement>codetag).classList.remove("jt_code");
                codetag.classList.add("codeblock");
            }
        }
    },
};

export default CodeTagFix;
