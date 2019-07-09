settingsLoadedEvent.addHandler(function() {
    /*
     * Encodes string Astrals (Emoji's) into prefixed HTML entities to
     * workaround Chatty's poor support for unicode surrogate pairs.
     */
    EmojiPoster = {
        install: function(postBox) {
            // install only once per postbox
            let _postBtn = postBox.querySelector("button#frm_submit");
            if (!_postBtn.hasAttribute("cloned")) {
                // remove all events on the 'Post' button so we can intercept submission
                let _clonedPostBtn = _postBtn.cloneNode(true);
                _clonedPostBtn.removeAttribute("onclick");
                _clonedPostBtn.setAttribute("cloned", "");
                _postBtn.parentNode.replaceChild(_clonedPostBtn, _postBtn);

                // monkeypatch the submit and click events
                [ "click", "submit" ].forEach(evt => {
                    document.addEventListener(evt, (e) => {
                        if (e.target.matches("#frm_submit")) {
                            // block any remaining attached listeners
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            //console.log("EmojiPoster redirected submit event");
                            let _postBox = document.getElementById("frm_body");
                            if (_postBox && _postBox.value.length > 0) {
                                _postBox.value = EmojiPoster.handleEncoding(_postBox.value);
                                EmojiPoster.handleSubmit(_postBox.value);
                            }
                        }
                    }, true);
                });

                // educate the user on how to open the OS' Emoji Picker
                let _postFormParent = postBox.querySelector("#postform fieldset");
                let _emojiTaglineElem = document.createElement("p");
                _emojiTaglineElem.setAttribute("class", "emoji-tagline");
                _emojiTaglineElem.innerHTML = "Use <span>Win + ;</span> (Windows) or <span>Cmd + Ctrl + Space</span> (MacOS) to bring up the OS Emoji Picker.";
                _postFormParent.appendChild(_emojiTaglineElem);
            }
        },

        handleSubmit: function(postText) {
            if (EmojiPoster.countText(postText) > 5 || EmojiPoster.countAstrals(postText).astralsCount > 0) {
                // normal post (either a single astral or some text)
                $('#frm_submit').attr('disabled', 'disabled').css('color', '#E9E9DE');
                $('#postform').submit();
                $('body').trigger(
                    'chatty-new-post-reply',
                    [ ($('#frm_submit').closest('div.root > ul > li').first().attr('id')) ]
                );
                return false;
            } else {
                // the server doesn't know that an astral is a single character
                alert("Please post something at least 5 characters long.");
            }
        },

        handleEncoding: function(text) {
            // see: https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            // credit: Mathias Bynens (https://github.com/mathiasbynens/he)
            let _matchAstrals = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
            let _matchBMPs = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
            let escapeCP = codePoint => `&#x${codePoint.toString(16).toUpperCase()};`;
            let escapeBmp = symbol => escapeCP(symbol.charCodeAt(0));
            return text.replace(_matchAstrals, $0 => {
                let _high = $0.charCodeAt(0);
                let _low = $0.charCodeAt(1);
                let _cp = (_high - 0xd800) * 0x400 + _low - 0xdc00 + 0x10000;
                return escapeCP(_cp);
            }).replace(_matchBMPs, escapeBmp);
        },

        countText: function(text) {
            // sums to the real length of text containing astrals
            let _astralsCount = EmojiPoster.countAstrals(text).astralsLen;
            let _count = _astralsCount ? (text.length - _astralsCount) : text.length;
            // should return true length of text minus encoded entities
            return _count;
        },

        countAstrals: function(text) {
            let _astrals = text.match(/(&#x[A-Fa-f0-9]+;)/igm);
            let _astralCount = _astrals ? _astrals.length : 0;
            let _astralTextLen = _astrals ? _astrals.reduce((t, v) => t + v.length, 0) : 0;
            // should return true text length of encoded entities with padding
            return { astralsLen: _astralTextLen, astralsCount: _astralCount };
        }
    };

    processPostBoxEvent.addHandler(EmojiPoster.install);
});
