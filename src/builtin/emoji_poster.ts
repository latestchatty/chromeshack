/*eslint no-control-regex: 0*/
import $ from "jquery";
import { processPostBoxEvent } from "../core/events";
import { safeInnerHTML } from "../core/common";

/*
 * Encodes string Astrals (Emoji's) into prefixed HTML entities to
 * workaround Chatty's poor support for unicode surrogate pairs.
 */
const EmojiPoster = {
    install() {
        processPostBoxEvent.addHandler(EmojiPoster.apply);
    },

    apply(postBox: HTMLElement) {
        // install only once per postbox
        const _postBtn = postBox.querySelector("button#frm_submit") as HTMLButtonElement;
        if (!_postBtn?.hasAttribute("cloned")) {
            // remove all events on the 'Post' button so we can intercept submission
            const _clonedPostBtn = _postBtn.cloneNode(true) as HTMLElement;
            _clonedPostBtn?.removeAttribute("onclick");
            _clonedPostBtn?.setAttribute("cloned", "");
            _postBtn?.parentNode?.replaceChild(_clonedPostBtn, _postBtn);

            // monkeypatch the submit and click events
            ["click", "submit"].forEach((evt) => {
                document.addEventListener(
                    evt,
                    (e: MouseEvent | Event) => {
                        const this_elem = e.target as HTMLElement;
                        if (this_elem.matches("#frm_submit")) {
                            // block any remaining attached listeners
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            //console.log("EmojiPoster redirected submit event");
                            const _postBox = document.getElementById("frm_body") as HTMLInputElement;
                            if (_postBox?.value.length > 0) {
                                _postBox.value = EmojiPoster.handleEncoding(_postBox?.value);
                                EmojiPoster.handleSubmit(_postBox?.value);
                            }
                        }
                    },
                    true,
                );
            });

            // educate the user on how to open the OS' Emoji Picker
            const _postFormParent = postBox?.querySelector("#postform fieldset") as HTMLElement;
            const _emojiTaglineElem = document.createElement("p");
            _emojiTaglineElem.setAttribute("class", "emoji-tagline");
            safeInnerHTML(
                "Use <span>Win + ;</span> (Windows) or <span>Cmd + Ctrl + Space</span> (MacOS) to bring up the OS Emoji Picker.",
                _emojiTaglineElem,
            );
            _postFormParent?.appendChild(_emojiTaglineElem);
        }
    },

    handleSubmit(postText: string) {
        if (EmojiPoster.countText(postText) > 5 || EmojiPoster.countAstrals(postText).astralsCount > 0) {
            // normal post (either a single astral or some text)
            $("#frm_submit").attr("disabled", "disabled").css("color", "#E9E9DE");
            $("#postform").submit();
            $("body").trigger("chatty-new-post-reply", [
                $("#frm_submit").closest("div.root > ul > li").first().attr("id"),
            ]);
            return false;
        } else {
            // the server doesn't know that an astral is a single character
            return alert("Please post something at least 5 characters long.");
        }
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
        const _count = _astralsCount ? text.length - _astralsCount : text.length;
        // should return true length of text minus encoded entities
        return _count;
    },

    countAstrals(text: string) {
        const _astrals = text.match(/(&#x[A-Fa-f0-9]+;)/gim);
        const _astralCount = _astrals?.length || 0;
        const _astralTextLen = _astrals?.reduce((t, v) => t + v.length, 0) || 0;
        // should return true text length of encoded entities with padding
        return { astralsLen: _astralTextLen, astralsCount: _astralCount };
    },
};

export default EmojiPoster;
