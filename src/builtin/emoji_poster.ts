/*eslint no-control-regex: 0*/
import jQuery from "jquery";
import { parseToElement } from "../core/common";
import { submitFormEvent, processPostBoxEvent } from "../core/events";
import type { PostboxEventArgs } from "../core/events.d";

const $ = jQuery;

/*
 * Encodes string Astrals (Emoji's) into prefixed HTML entities to
 * workaround Chatty's poor support for unicode surrogate pairs.
 */
export const EmojiPoster = {
    install() {
        processPostBoxEvent.addHandler(EmojiPoster.apply);
    },

    apply(args: PostboxEventArgs) {
        const { postbox } = args || {};
        // install only once per postbox
        const _postBtn = postbox?.querySelector("button#frm_submit") as HTMLButtonElement;
        if (!_postBtn?.hasAttribute("cloned")) {
            // remove all events on the 'Post' button so we can intercept submission
            const _clonedPostBtn = _postBtn.cloneNode(true) as HTMLElement;
            _clonedPostBtn?.removeAttribute("onclick");
            _clonedPostBtn?.setAttribute("cloned", "");
            _postBtn?.parentNode?.replaceChild(_clonedPostBtn, _postBtn);

            const handleSubmit = (e: MouseEvent | Event) => {
                const this_elem = e.target as HTMLElement;
                const isSubmit = this_elem?.matches("#frm_submit");
                const _postBox = document.getElementById("frm_body") as HTMLInputElement;
                if (isSubmit && _postBox && _postBox?.value.length > 0) {
                    // block any remaining attached listeners
                    e.preventDefault();
                    e.stopPropagation();
                    submitFormEvent.raise(e);
                    _postBox.value = EmojiPoster.handleEncoding(_postBox.value);
                    const result = EmojiPoster.handleSubmit(_postBox.value);
                    if (!result) document.removeEventListener("click", handleSubmit);
                }
            };
            document.removeEventListener("click", handleSubmit);
            document.addEventListener("click", handleSubmit);

            // educate the user on how to open the OS' Emoji Picker
            const _rulesParent = postbox?.querySelector("p.rules") as HTMLElement;
            // parse our nodes into a document fragment
            const _emojiTaglineFragment = parseToElement(/*html*/ `
                <div class="emoji-tagline">
                    <span class="tagline-sep">▪</span>Use <span>Win + ;</span> (Windows) or <span>Cmd + Ctrl + Space</span> (MacOS) to bring up the OS Emoji Picker.
                </div>
            `);
            _rulesParent?.append(_emojiTaglineFragment);
        }
    },

    handleSubmit(postText: string) {
        const $submitBtn = $("#frm_submit");
        if (EmojiPoster.countText(postText) > 5 || EmojiPoster.countAstrals(postText).astralsCount > 0) {
            // normal post (either a single astral or some text)
            $submitBtn.attr("disabled", "disabled").css("color", "#E9E9DE");
            $("#postform").submit();
            $("body").trigger("chatty-new-post-reply", [$submitBtn.closest("div.root > ul > li").first().attr("id")]);
            return false;
        }
        // the server doesn't know that an astral is a single character
        else return alert("Please post something at least 5 characters long.");
    },

    handleEncoding(text: string) {
        // see: https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        // credit: Mathias Bynens (https://github.com/mathiasbynens/he)
        const _matchAstrals = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
        const _matchBMPs = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
        const escapeCP = (codePoint: number) => `&#x${codePoint.toString(16).toUpperCase()};`;
        const escapeBmp = (symbol: string) => escapeCP(symbol.charCodeAt(0));
        const transform = text?.replace(_matchAstrals, ($0) => {
            const _high = $0.charCodeAt(0);
            const _low = $0.charCodeAt(1);
            const _cp = (_high - 0xd800) * 0x400 + _low - 0xdc00 + 0x10000;
            return escapeCP(_cp);
        });
        return transform?.replace(_matchBMPs, escapeBmp);
    },

    countText(text: string) {
        // sums to the real length of text containing astrals
        const _astralsCount = EmojiPoster.countAstrals(text)?.astralsLen;
        // should return true length of text minus encoded entities
        return _astralsCount ? text.length - _astralsCount : text.length;
    },

    countAstrals(text: string) {
        const _astrals = text.match(/(&#x[A-Fa-f0-9]+;)/gim);
        const _astralCount = _astrals?.length || 0;
        const _astralTextLen = _astrals?.reduce((t, v) => t + v.length, 0) || 0;
        // should return true text length of encoded entities with padding
        return { astralsLen: _astralTextLen, astralsCount: _astralCount };
    },
};
