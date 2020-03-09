let ImageUpload = {
    chattyPicsUrl: "https://chattypics.com/upload.php",

    //imgurApiKey: "48a14aa108f519f249aacc12d08caac3",

    imgurApiImageBaseUrl: "https://api.imgur.com/3/image",

    imgurClientId: "Client-ID c045579f61fc802",

    gfycatApiUrl: "https://api.gfycat.com/v1/gfycats",

    gfycatStatusUrl: "https://api.gfycat.com/v1/gfycats/fetch/status",

    uploadShown: false,

    formFiles: [],

    formFileUrl: "",

    formUploadRepeater: null,

    formUploadElapsed: 0,

    formUploadTimer: null,

    installForm(item) {
        $(item).find("#imageUploadButton").toggle();
        $(item).find("#cancelUploadButton").toggle();

        let template = $(/* html */ `
            <div class="post_sub_container">
                <div class="uploadContainer">
                    <a class="showImageUploadLink">Hide Image Uploader</a>
                    <div id="uploadFields" class="">
                        <div class="uploadFilters">
                            <input type="radio" name="imgUploadSite" id="uploadImgur" checked="checked">
                            <input type="radio" name="imgUploadSite" id="uploadGfycat">
                            <input type="radio" name="imgUploadSite" id="uploadChatty">

                            <div class="uploadRadioLabels">
                                <label class="imgur" for="uploadImgur">Imgur</label>
                                <label class="gfycat" for="uploadGfycat">Gfycat</label>
                                <label class="chatty" for="uploadChatty">Chattypics</label>
                            </div>
                        </div>
                        <div id="uploadDropArea">
                            <input type="file" id="fileUploadInput" multiple accept="image/*">

                            <div class="uploadDropLabelArea">
                                <a href="#" id="fileChooserLink">Choose some files</a>
                                <span class="uploadDropLabel">or drop them here...</span>
                            </div>
                            <div class="urlBox">
                                <input type="text" id="urlUploadInput"
                                    spellcheck="false"
                                    class="hidden"
                                    placeholder="Or use an image URL..."
                                >
                                <div class="urlUploadSnippetCheckbox hidden">
                                    <input type="checkbox" id="urlUploadSnippetBox"
                                        value="urlUploadSnippetBox"
                                        title="Toggle Gfycat snippet controls"
                                    >
                                    <i class="style-helper"></i>
                                </div>
                            </div>
                            <div class="urlUploadSnippetControls hidden">
                                <span class="snippetControlsLabel">Define the snippet:</span>
                                <div>
                                    <input type="text" id="urlUploadSnippetStart"
                                        title="Position in video to start snippet (in seconds)"
                                        min="0" max="10800" placeholder="Start"
                                    >
                                    <input type="text" id="urlUploadSnippetDuration"
                                        title="Duration of snippet (in seconds)"
                                        min="1" max="10800" placeholder="Duration"
                                    >
                                </div>
                            </div>
                            <div class="contextLine hidden">
                                <div id="uploadButtons">
                                    <button id="urlUploadButton">Upload</button>
                                    <button id="cancelUploadButton" class="small">X</button>
                                </div>
                                <div id="uploadStatusLabel"></div>
                            </div>
                            <div id="errorLabels" class="hidden">
                                <span id="errorStatusLabel"></span>
                                <span id="errorStatusLabelDetail"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // move our shacktags legend into our template container for alignment
        $(item).find("#shacktags_legend").appendTo(template);

        // bind some actions to our template elements
        $(template).find(".showImageUploadLink").click(e => {
            ImageUpload.uploadShown = !$(item).find("#uploadFields").hasClass("hidden");
            $(item).find("#uploadFields").toggleClass("hidden", ImageUpload.uploadShown);
            let text = !ImageUpload.uploadShown ? "Hide Image Uploader" : "Show Image Uploader";
            $(item).find(".showImageUploadLink").html(text);
            return false;
        });

        $(template).find("#fileChooserLink").click(e => {
            $(item).find("#fileUploadInput").click();
            e.preventDefault();
        });

        // debounce on keyup (1.5s) for url text input
        const debouncedKeyup = debounce(val => {
            loadFileUrl(val);
        }, 1500);
        $(template).find("#urlUploadInput").keyup(function () {
            debouncedKeyup(this.value);
        });

        // toggle entry fields based on hoster tab clicked
        $(template).find("#uploadImgur").click(() => toggleHosterTab("imgur", item));
        $(template).find("#uploadGfycat").click(() => toggleHosterTab("gfycat", item));
        $(template).find("#uploadChatty").click(() => toggleHosterTab("chattypics", item));

        $(template).find("#urlUploadSnippetBox").click(function () {
            if ($(this).is(":checked")) toggleSnippetControls(1);
            else toggleSnippetControls(2);
        });
        $(template).find("#urlUploadSnippetStart, #urlUploadSnippetDuration").on("input", function (e) {
            // tries to sanitize inputs
            let _ret = isValidNumber($(this).val(), $(this).attr("min"), $(this).attr("max"));
            $(this).val(_ret);
            e.preventDefault();
        });

        // attach events for dropping images
        $(template).find("#uploadDropArea").dropArea();
        $(template).find("#uploadDropArea").on("drop", e => {
            e.preventDefault();
            e = e.originalEvent;
            let files = e.dataTransfer.files;
            if (inputIsImageList(files)) {
                loadFileData(files);
            }
        });
        $(template).find("#fileUploadInput").change(e => {
            let files = e.target.files;
            if (inputIsImageList(files)) {
                loadFileData(files);
            }
        });

        $(template).find("#cancelUploadButton").click(e => {
            e.preventDefault();
            // contextually reset our input form
            clearFileData();
            // cancel our repeater(s) if busy
            doFormTimer(true);
            if (ImageUpload.formUploadRepeater)
                clearInterval(ImageUpload.formUploadRepeater);
            delayedRemoveUploadMessage("silver", "Cancelling...", null, 3000);
        });

        // attach event for upload button
        $(template).find("#urlUploadButton").click(e => {
            e.preventDefault();

            if ($(item).find("#uploadChatty").is(":checked")) {
                // forcefully ignore url input on chattypics
                doFileUpload();
            } else {
                // if both inputs are populated do url first
                if (ImageUpload.formFileUrl.length > 7) doUrlUpload();
                else if (ImageUpload.formFiles != null) doFileUpload();
            }
            $(item).find("#frm_body").focus();
            return false;
        });
        // add the finished template to the postbox
        $(item).find("#postform").append(template);
        // set Imgur as the default host
        toggleHosterTab("imgur", item);

        /*
         * SUPPORT FUNCS
         */
        function toggleHosterTab(hoster, elem) {
            switch (hoster) {
                case "imgur":
                    // imgur allows images and mp4s
                    $(elem).find("#fileUploadInput").attr("accept", "image/*,video/mp4");
                    $(elem).find("#fileUploadInput").removeAttr("multiple");
                    $(elem).find("#fileChooserLink").text("Choose a file");
                    $(elem).find(".uploadDropLabel").text("or drop one here...");
                    toggleSnippetControls(0);
                    toggleUrlBox(1);
                    if (ImageUpload.formFileUrl.length > 7) {
                        // contextually unhide if we have content
                        toggleDragOver(1);
                        toggleContextLine(1);
                    }
                    break;
                case "gfycat":
                    $(elem).find("#fileUploadInput").removeAttr("multiple");
                    $(elem).find("#fileChooserLink").text("Choose a file");
                    $(elem).find(".uploadDropLabel").text("or drop one here...");
                    // gfycat allows images and videos
                    $(elem).find("#fileUploadInput").attr("accept", "image/*,video/*");
                    let typeObj = isValidUrl(ImageUpload.formFileUrl);
                    if ($(elem).find("#urlUploadSnippetBox").is(":checked") && typeObj && typeObj.type == 1)
                        toggleSnippetControls(1);
                    else if ($(elem).find("#urlUploadSnippetBox").is(":checked"))
                        toggleSnippetControls(2);
                    else
                        toggleSnippetControls(0);
                    toggleUrlBox(1);
                    break;
                case "chattypics":
                    toggleUrlBox(0);
                    toggleSnippetControls(0);
                    // chattypics can take multiple files at once
                    $(elem).find("#fileUploadInput").attr("multiple");
                    $(elem).find("#fileChooserLink").text("Choose some files");
                    $(elem).find(".uploadDropLabel").text("or drop some here...");

                    $(elem).find("#urlUploadInput").toggleClass("hidden", $(elem).find("#uploadChatty").is(":checked"));
                    $(elem).find("#fileUploadInput").attr("accept", "image/*");
                    clearFileData(true);
                    break;
                default:
                    break;
            }
            // force a revalidation of the url input box
            loadFileUrl($(elem).find("#urlUploadInput").val());
        }

        function inputIsImageList(files) {
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    // break and return false if any are not images
                    if (!/image/.test(files[i].type)) {
                        return false;
                    }
                }
            }

            return true;
        }

        // shortcuts for uploader element state toggling
        function toggleDragOver(state) {
            if (state == 0) $(item).find("#uploadDropArea").removeClass("dragOver");
            else if (state == 1)
                $(item).find("#uploadDropArea")
                    .removeClass("dragOver")
                    .addClass("dragOver");
        }
        function toggleUrlBox(state) {
            if (state == 0)
                $(item).find("#urlUploadInput")
                    .removeClass("hidden")
                    .addClass("hidden");
            else if (state == 1) $(item).find("#urlUploadInput").removeClass("hidden");
            else if (state == 3) $(item).find("#urlUploadInput").removeClass("valid");
            else if (state == 4)
                $(item).find("#urlUploadInput")
                    .removeClass("valid")
                    .addClass("valid");
        }
        function toggleSnippetControls(state, wipe) {
            if (wipe) {
                $(item).find("#urlUploadSnippetStart").val("");
                $(item).find("#urlUploadSnippetDuration").val("");
                $(item).find("#urlUploadSnippetBox").prop("checked", false);
            }

            if (state == 0) {
                $(item).find(".urlUploadSnippetCheckbox")
                    .removeClass("hidden")
                    .addClass("hidden");
                $(item).find(".urlUploadSnippetControls")
                    .removeClass("hidden")
                    .addClass("hidden");
            } else if (state == 1) {
                $(item).find(".urlUploadSnippetCheckbox").removeClass("hidden");
                $(item).find(".urlUploadSnippetControls").removeClass("hidden");
            } else if (state == 2) {
                $(item).find(".urlUploadSnippetCheckbox").removeClass("hidden");
                $(item).find(".urlUploadSnippetControls")
                    .removeClass("hidden")
                    .addClass("hidden");
            } else if (state == 3) {
                // shown but disabled
                $(item).find(".urlUploadSnippetCheckbox").removeClass("disabled");
                $(item).find(".urlUploadSnippetControls")
                    .removeClass("hidden")
                    .addClass("hidden");
            }
        }
        function toggleContextLine(state) {
            if (state == 0)
                $(item).find(".contextLine")
                    .removeClass("hidden")
                    .addClass("hidden");
            else if (state == 1) $(item).find(".contextLine").removeClass("hidden");
        }
        function toggleStatusLabel(state) {
            if (state == 0)
                $(item).find("#uploadStatusLabel")
                    .removeClass("muted")
                    .addClass("muted");
            else if (state == 1) $(item).find("#uploadStatusLabel").removeClass("muted");
        }
        // end shortcuts for uploader element toggling

        function loadFileData(files) {
            let formFiles = [];
            if (files.length > 0) {
                if ($(item).find("#uploadChatty").is(":checked")) {
                    // allow multiple files for chattypics
                    for (let file of files || []) formFiles.push(file);
                } else formFiles.push(files[0]);
                ImageUpload.formFiles = formFiles;

                updateStatusLabel(ImageUpload.formFiles);
                toggleContextLine(1);
                toggleDragOver(1);
                // styling to indicate to the user that the files will be uploaded
                if (!ImageUpload.formFileUrl.length > 7) toggleStatusLabel(1);
                return true;
            }
            return false;
        }

        function loadFileUrl(string) {
            let _isGfycat = $(item).find("#uploadGfycat").length && $(item).find("#uploadGfycat").is(":checked");
            let typeObj = isValidUrl(string);
            if (_isGfycat && typeObj && typeObj.type == 1) {
                // video hoster url
                ImageUpload.formFileUrl = string;
                toggleDragOver(1);
                toggleUrlBox(4);
                // enable snippets
                toggleSnippetControls(2);
                toggleContextLine(1);
                // styling to indicate to the user that the url takes priority over files
                toggleStatusLabel(1);
                return true;
            } else if (typeObj && typeObj.type == 0) {
                // normal image url
                ImageUpload.formFileUrl = string;
                toggleDragOver(1);
                toggleUrlBox(4);
                // disable snippets
                toggleSnippetControls(0);
                toggleContextLine(1);
                // styling to indicate to the user that the url takes priority over files
                toggleStatusLabel(1);
                return true;
            } else if (ImageUpload.formFiles.length == 0) {
                // not a valid string yet we don't have files so wipe our saved url state
                ImageUpload.formFileUrl = "";
                toggleDragOver(0);
                toggleUrlBox(3);
                toggleSnippetControls(0);
                toggleContextLine(0);
                toggleStatusLabel(0);
                return true;
            }

            toggleUrlBox(3);
            toggleStatusLabel(1);
            return false;
        }

        function clearFileData(soft) {
            // contextually reset our uploader form inputs
            let typeObj = isValidUrl(ImageUpload.formFileUrl);
            let _isUrl = typeObj && typeObj.type > -1;
            let _isFiles = ImageUpload.formFiles.length > 0;
            let _isUrlInput = ImageUpload.formFileUrl.length > 7;

            // override for checking chattypics filter
            if (soft) {
                if (!_isFiles) {
                    toggleDragOver(0);
                    toggleContextLine(0);
                }
                return true;
            }

            if (_isFiles && _isUrl) {
                // if we have a valid url, wipe our files instead
                ImageUpload.formFiles = [];
                updateStatusLabel();
                toggleStatusLabel(1);
            } else if (_isUrlInput) {
                // wipe any content in the input box
                ImageUpload.formFileUrl = "";
                $(item).find("#urlUploadInput").val("");
                toggleDragOver(0);
                toggleContextLine(0);
                toggleSnippetControls(0, true);
            } else if (_isFiles) {
                ImageUpload.formFileUrl = "";
                ImageUpload.formFiles = [];
                updateStatusLabel();
                toggleStatusLabel(1);
                toggleSnippetControls(0, true);
            }

            removeUploadMessage();
            if (ImageUpload.formFileUrl.length == 0 &&
                ImageUpload.formFiles.length == 0) {
                toggleStatusLabel(1);
                toggleDragOver(0);
                toggleContextLine(0);
                toggleSnippetControls(0, true);
            }
            return false;
        }

        function updateStatusLabel(files) {
            // update our status label
            let label = $(item).find("#uploadStatusLabel")[0];
            if (files != null && files.length > 0 && files.length < 2) {
                label.textContent = `${files[0].name}`;
                return true;
            } else if (files != null && files.length > 1) {
                label.textContent = `${files.length} items for upload`;
                return true;
            }

            label.textContent = "";
            return false;
        }

        function isValidUrl(string) {
            let ip_pattern = /^(?:http:\/\/|https:\/\/)(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/(?:.*?\/)?([\w\-_&#@]+)\.(gif|jpg|jpeg|png|webp)$/i.exec(
                string
            );
            let url_pattern = /^(?:http:\/\/|https:\/\/).*?(?:[\w-]+\.[\w]+)\/(?:.*?\/)?([\w\-_&#@]+)\.(gif|jpg|jpeg|png|webp)$/i.exec(
                string
            );
            // should work for most video hosting sites but still matches false positives due to being generic
            let vid_pattern1 = /^(?:http:\/\/|https:\/\/).*?(?:[\w-]+\.[\w]+)\/(?:.*?\/)?([\w\-_&#@]+)\.(mp4|webm|gifv)$/i.exec(
                string
            );
            let vid_pattern2 = /^(?:http:\/\/|https:\/\/)(?:.*)?(?:[\w-]+\.[\w]+)\/(?:.*\/)?((?!.*?\.[\w]+$)[\w\-&#@/?=.]+)$/i.exec(
                string
            );

            if (
                (string.length > 7 &&
                    string.length < 2048 &&
                    $(item).find("#uploadGfycat").is(":checked") &&
                    vid_pattern1 &&
                    vid_pattern1.length > 0) ||
                (vid_pattern2 && vid_pattern2.length > 0)
            ) {
                return {
                    type: 1,
                    filename: (vid_pattern1 && vid_pattern1[1]) || (vid_pattern2 && vid_pattern2[1])
                };
            } else if (
                (string.length > 7 && string.length < 2048 && url_pattern && url_pattern.length > 0) ||
                (ip_pattern && ip_pattern.length > 0)
            ) {
                return {
                    type: 0,
                    filename: (url_pattern && url_pattern[1]) || (ip_pattern && ip_pattern[1])
                };
            }
            return null;
        }

        function isValidNumber(number, min, max) {
            let _min = Number.parseInt(min);
            let _max = Number.parseInt(max);
            let _num = Number.isNaN(Number.parseInt(number)) ? _min : Number.parseInt(number);
            if (_num < _min) return _min;
            else if (_num > max) return _max;
            else return _num;
        }

        function doUrlUpload() {
            let isImgur = $(item).find("#uploadImgur").length && $(item).find("#uploadImgur").is(":checked");
            let isGfycat = $(item).find("#uploadGfycat").length && $(item).find("#uploadGfycat").is(":checked");
            let url = ImageUpload.formFileUrl;

            if (isImgur) {
                // only images
                let fd = new FormData();
                fd.append("type", "url");
                fd.append("image", url);

                doImgurUpload(fd);
            } else if (isGfycat) {
                let fileObj = null;
                let _isSnip = $(item).find("#urlUploadSnippetBox").length && $(item).find("#urlUploadSnippetBox").is(":checked");
                let snipStart = $(item).find("#urlUploadSnippetStart").val();
                let snipDuration = $(item).find("#urlUploadSnippetDuration").val();

                if (_isSnip && snipStart > -1 && snipDuration > 0)
                    fileObj = { cut: { start: snipStart, duration: snipDuration } };

                let typeObj = isValidUrl(url);
                let urlObj = { fetchUrl: url, title: typeObj && typeObj.filename };
                fileObj = fileObj ? Object.assign({}, fileObj, urlObj) : urlObj;

                // could be video or image
                doGfycatUpload(fileObj);
            }
        }

        function doFileUpload() {
            let isChattyPics = $(item).find("#uploadChatty").length && $(item).find("#uploadChatty").is(":checked");
            let isImgur = $(item).find("#uploadImgur").length && $(item).find("#uploadImgur").is(":checked");
            let isGfycat = $(item).find("#uploadGfycat").length && $(item).find("#uploadGfycat").is(":checked");
            let filesList = ImageUpload.formFiles;

            let fd = new FormData();
            if (isChattyPics) {
                // Chattypics prefers php array format
                for (let file of filesList) {
                    fd.append("userfile[]", file);
                }
                doChattyPicsUpload(fd);
            } else if (isImgur) {
                fd.append("type", "file");
                fd.append("image", filesList[0]);
                doImgurUpload(fd);
            } else if (isGfycat) {
                // pass Gfycat method the actual File object for renaming
                doGfycatUpload({ file: filesList[0] });
            }
        }

        function doImgurUpload(formdata) {
            removeUploadMessage();
            addUploadMessage("silver", "Uploading to Imgur...");
            fetchSafe({
                url: ImageUpload.imgurApiImageBaseUrl,
                fetchOpts: {
                    method: "POST",
                    headers: { Authorization: ImageUpload.imgurClientId },
                    body: formdata
                }
            }).then(res => {
                if (res && res.data && res.data.link) handleUploadSuccess([res.data.link]);
                else handleUploadFailure(res);
            });
        }

        async function doChattyPicsUpload(formdata) {
            removeUploadMessage();
            addUploadMessage("silver", "Uploading to ChattyPics...");
            for (let v of formdata.values()) {
                // if file is bigger than 3MB throw an error
                if (v.size > 3 * 1000 * 1000) {
                    handleUploadFailure(-1);
                    return;
                }
            }

            let fd = await FormDataToJSON(formdata);
            browser.runtime
                .sendMessage({
                    name: "corbPost",
                    url: ImageUpload.chattyPicsUrl,
                    data: fd,
                    parseType: { chattyPics: true }
                })
                .then(links => {
                    if (Array.isArray(links) && links.length > 0) return handleUploadSuccess(links);
                    else return handleUploadFailure(false);
                })
                .catch(err => handleUploadFailure(err));
        }

        function doGfycatUpload(fileObj) {
            removeUploadMessage();
            let dataBody = !isEmpty(fileObj) ? JSON.stringify(fileObj) : null;
            // keep track of how long we take
            doFormTimer();

            fetchSafe({
                url: ImageUpload.gfycatApiUrl,
                fetchOpts: {
                    method: "POST",
                    headers: !dataBody.fetchUrl && { "Content-Type": "application/json" },
                    body: dataBody
                }
            })
                .then(key_resp => {
                    if (!key_resp) {
                        handleGfycatUploadStatus(key_resp); // fail?!
                        return;
                    }

                    let key = key_resp.gfyname;
                    let dropUrl = key_resp.uploadType;
                    if (fileObj.fetchUrl) {
                        // if we used 'fetchUrl' the server will report back a key
                        addUploadMessage("silver", "Fetching to Gfycat...");
                        // use it to check our gfycat status
                        checkGfycatStatus(key);
                    } else if (fileObj.file) {
                        // if 'file' method is used then use the key given
                        addUploadMessage("silver", "Uploading to Gfycat...");
                        // rename our file to exactly the name of the key
                        dataBody = new File([fileObj.file], key, fileObj.type);

                        fetchSafe({
                            url: `https://${dropUrl}/${key}`,
                            fetchOpts: {
                                method: "PUT",
                                body: dataBody
                            }
                        })
                            .then(drop_resp => {
                                // check on our gfycat status after the drop (probably bool here)
                                if (drop_resp) checkGfycatStatus(key);
                                else handleGfycatUploadStatus(drop_resp);
                            })
                            .catch(err => console.log(err));
                    }
                })
                .catch(err => console.log(err));
        }

        function handleUploadSuccess(links) {
            for (let i in links) {
                $(item).find("#frm_body").insertAtCaret(links[i] + "\n");
            }
            delayedRemoveUploadMessage("green", "Success!", null, 3000);
        }

        function handleUploadFailure(resp) {
            removeUploadMessage();
            if (resp === -1) delayedRemoveUploadMessage("red", "Failure: file is too large!", null, 5000);
            else if (resp && resp.status != 200 && resp.statusText.length > 0)
                delayedRemoveUploadMessage("red", "Failure:", resp.statusText, 5000);
            else delayedRemoveUploadMessage("red", "Failure!", null, 5000);
        }

        function checkGfycatStatus(gfycatKey, override) {
            if (override instanceof Object && override.gfyname) {
                let _key = override.gfyname;
                let statUrl = `${ImageUpload.gfycatApiUrl}/${_key}`;
                // grab our formal url from the endpoint rather than constructing it
                fetchSafe({ url: statUrl }).then(stat_resp => {
                    let _url = stat_resp && stat_resp.gfyItem.webmUrl;
                    let elapsed = elapsedToString();
                    if (_url) {
                        handleUploadSuccess([stat_resp.gfyItem.webmUrl]);
                        delayedRemoveUploadMessage("green", `Success in ${elapsed}`, null, 3000, true);
                    }
                    doFormTimer(true);
                });
                if (ImageUpload.formUploadRepeater)
                    clearInterval(ImageUpload.formUploadRepeater);
                return;
            }

            let requestUrl = `${ImageUpload.gfycatStatusUrl}/${gfycatKey}`;
            // verify the upload/fetch - every 3s unless cancelled
            ImageUpload.formUploadRepeater = setInterval(() => {
                fetchSafe({ url: requestUrl }).then(req_resp => {
                    if (handleGfycatUploadStatus(req_resp)) {
                        clearInterval(ImageUpload.formUploadRepeater);
                        doFormTimer(true);
                        return;
                    }
                });
            }, 3000);
        }

        function handleGfycatUploadStatus(json) {
            if (json && json.task == "encoding") {
                let elapsed = elapsedToString();
                addUploadMessage("silver", `Encoding ${elapsed}`, null, true);
                // endpoint is busy so loop until we timeout or we're cancelled
                return false;
            } else if (json && json.task == "complete" && json.gfyname) {
                // call checkGfycatStatus with an override object to report the success
                checkGfycatStatus(null, { gfyname: json.gfyname });
                return false;
            } else {
                let err = JSON.stringify(json.errorMessage);
                if (json.code) {
                    delayedRemoveUploadMessage("red", "Failure:", `${err.code} = ${err.description}`, 5000);
                } else if (json.task == "NotFoundo") {
                    delayedRemoveUploadMessage("red", "Failure!", null, 3000);
                }
                console.log(`Gfycat endpoint error: ${json}`);
                return true;
            }
        }

        function addUploadMessage(color, message, detailMsg, spin) {
            let statusLabel = $(item).find("#errorStatusLabel");
            let statusLabelDetail = $(item).find("#errorStatusLabelDetail");

            removeUploadMessage();
            $(item).find("#errorLabels").removeClass("hidden");
            statusLabel.css("color", color);
            statusLabelDetail.css("color", color);
            if (spin) {
                statusLabel.removeClass("spinner").addClass("spinner");
            }

            statusLabel.text(message);
            if (detailMsg != undefined && detailMsg.length > 0) {
                statusLabelDetail.text(detailMsg);
            }
        }

        function removeUploadMessage(value) {
            $(item).find("#errorStatusLabel").text("");
            $(item).find("#errorStatusLabelDetail").text("");
            $(item).find("#errorLabels")
                .removeClass("hidden")
                .addClass("hidden");
            $(item).find("#errorStatusLabel").removeClass("spinner");
            updateStatusLabel();
            return value;
        }

        function delayedRemoveUploadMessage(color, mainMessage, detailMessage, delay, value) {
            // helper function that returns a promised value to the caller after the UploadMessage
            addUploadMessage(color, mainMessage, detailMessage);
            const ret = new Promise(resolve => {
                setTimeout(() => {
                    $(item).find("#uploadDropArea").removeClass("dragOver");
                    removeUploadMessage();
                    resolve(value);
                }, delay);
            });
            return ret;
        }

        function doFormTimer(override) {
            if (override && ImageUpload.formUploadTimer) {
                ImageUpload.formUploadElapsed = 0;
                clearInterval(ImageUpload.formUploadTimer);
                return;
            }
            // just a rough timer - not necessarily reliable
            ImageUpload.formUploadTimer = setInterval(() => {
                ImageUpload.formUploadElapsed++;
            }, 1000);
        }

        function elapsedToString() {
            return new Date(1000 * ImageUpload.formUploadElapsed).toISOString().substr(11, 8);
        }
    }
};

processPostBoxEvent.addHandler(ImageUpload.installForm);
