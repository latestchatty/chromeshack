settingsLoadedEvent.addHandler(function()
{
    ImageUpload =
    {
        chattyPicsUrl : "https://chattypics.com/upload.php",

        imgurApiKey :  "48a14aa108f519f249aacc12d08caac3",

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

        insertForm: function() {
            ImageUpload.showImageUploadForm(this);
        },

        showImageUploadForm: function(obj) {
            $("#imageUploadButton").toggle();
            $("#cancelUploadButton").toggle();

            var template = $(/* html */`
                <div class="post_sub_container">
                    <div class="uploadContainer">
                        <a class="showImageUploadLink">Show Image Upload</a>
                        <div id="uploadFields" class="">
                            <div class="uploadFilters">
                                <input type="radio" name="imgUploadSite" id="uploadChatty" checked="checked">
                                <input type="radio" name="imgUploadSite" id="uploadImgur">
                                <input type="radio" name="imgUploadSite" id="uploadGfycat">

                                <div class="uploadRadioLabels">
                                    <label class="chatty" for="uploadChatty">Chattypics</label>
                                    <label class="imgur" for="uploadImgur">Imgur</label>
                                    <label class="gfycat" for="uploadGfycat">Gfycat</label>
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

            $("#postform").append(template);
            // move our shacktags legend into our template container for alignment
            $("#shacktags_legend").appendTo(".post_sub_container");

            // bind some actions to our template elements
            $(".showImageUploadLink").click(function() {
                ImageUpload.uploadShown = !ImageUpload.uploadShown;
                $("#uploadFields").toggleClass("hidden", !ImageUpload.uploadShown);
                var text = ImageUpload.uploadShown ? "Hide Image Upload" : "Show Image Upload";
                $(".showImageUploadLink").html(text);

                // scroll to our elements contextually
                if (!$("#uploadFields").hasClass("hidden"))
                    scrollToElement($(this)[0]);
                else
                    scrollToElement($("#frm_body")[0]);
                return false;
            });

            $("#fileChooserLink").click(function() {
                $("#fileUploadInput").click();
                scrollToElement($("#uploadDropArea")[0]);
            });

            // debounce on keyup (1.5s) for url text input
            var debouncedKeyup = debounce(function(val) {
                ImageUpload.loadFileUrl(val);
            }, 1500);
            $("#urlUploadInput").keyup(function() {
                debouncedKeyup(this.value);
            });

            // toggle entry fields based on hoster
            $("#uploadChatty").click(function() {
                ImageUpload.toggleSnippetControls(0);
                // chattypics can take multiple files at once
                $("#fileUploadInput").attr("multiple");
                $("#fileChooserLink").text("Choose some files");
                $(".uploadDropLabel").text("or drop some here...");

                $("#urlUploadInput").toggleClass('hidden', $("#uploadChatty").is(":checked"));
                $("#fileUploadInput").attr("accept", "image/*");
                ImageUpload.clearFileData(true);
            });
            $("#uploadGfycat, #uploadImgur").click(function() {
                // gfycat and imgur only allow one file at a time
                $("#fileUploadInput").removeAttr("multiple");
                $("#fileChooserLink").text("Choose a file");
                $(".uploadDropLabel").text("or drop one here...");
                // gfycat allows video input
                if ($(this).is("#uploadGfycat")) {
                    $("#fileUploadInput").attr("accept", "image/*,video/*");
                    var typeObj = ImageUpload.isValidUrl(ImageUpload.formFileUrl);
                    if ($("#urlUploadSnippetBox").is(":checked") &&
                        typeObj && typeObj.type == 1) {
                        ImageUpload.toggleSnippetControls(1);
                    } else if ($("#urlUploadSnippetBox").is(":checked")) {
                        ImageUpload.toggleSnippetControls(2);
                    } else {
                        ImageUpload.toggleSnippetControls(0);
                    }
                    ImageUpload.toggleUrlBox(1);
                }
                else if ($(this).is("#uploadImgur")) {
                    $("#fileUploadInput").attr("accept", "image/*");
                    ImageUpload.toggleSnippetControls(0);
                    ImageUpload.toggleUrlBox(0);
                }
                ImageUpload.toggleUrlBox(1);
                if (ImageUpload.formFileUrl.length > 7) {
                    // contextually unhide if we have content
                    ImageUpload.toggleDragOver(1);
                    ImageUpload.toggleContextLine(1);
                }
                // force a revalidation of the url input box
                ImageUpload.loadFileUrl($("#urlUploadInput").val());
            });

            $("#urlUploadSnippetBox").click(function() {
                if ($(this).is(":checked"))
                    ImageUpload.toggleSnippetControls(1);
                else
                    ImageUpload.toggleSnippetControls(2);
            })
            $("#urlUploadSnippetStart, #urlUploadSnippetDuration").on("input", function(e) {
                // tries to sanitize inputs
                var _ret = ImageUpload.isValidNumber($(this).val(), $(this).attr("min"), $(this).attr("max"));
                $(this).val(_ret);
                e.preventDefault();
            })

            // attach events for dropping images
            $("#uploadDropArea").dropArea();
            $("#uploadDropArea").on('drop', function(e){
                e.preventDefault();
                e = e.originalEvent;
                var files = e.dataTransfer.files;
                if (ImageUpload.inputIsImageList(files)) {
                    ImageUpload.loadFileData(files);
                }
            });
            $("#fileUploadInput").change(function (e) {
                var files = e.target.files;
                if (ImageUpload.inputIsImageList(files)) {
                    ImageUpload.loadFileData(files);
                }
            });

            $("#cancelUploadButton").click(function(e) {
                e.preventDefault();
                // contextually reset our input form
                ImageUpload.clearFileData();
                // cancel our repeater(s) if busy
                ImageUpload.doFormTimer(true);
                if (ImageUpload.formUploadRepeater != null)
                    clearInterval(ImageUpload.formUploadRepeater);
                ImageUpload.delayedRemoveUploadMessage("silver", "Cancelling...", null, 3000);
            });

            // attach event for upload button
            $("#urlUploadButton").click(function(e) {
                e.preventDefault();

                if ($("#uploadChatty").is(":checked")) {
                    // forcefully ignore url input on chattypics
                    ImageUpload.doFileUpload();
                } else {
                    // if both inputs are populated do url first
                    if (ImageUpload.formFileUrl.length > 7)
                        ImageUpload.doUrlUpload();
                    else if (ImageUpload.formFiles != null)
                        ImageUpload.doFileUpload();
                }

                scrollToElement($("#frm_body")[0]);
                $("#frm_body").focus();
                return false;
            });
        },

        inputIsImageList: function(files) {
            if (files.length > 0) {
                for (var i=0; i < files.length; i++) {
                    // break and return false if any are not images
                    if (!/image/.test(files[i].type)) {
                        return false;
                    }
                }
            }

            return true;
        },

        // shortcuts for uploader element state toggling
        toggleDragOver: function(state) {
            if (state == 0)
                $("#uploadDropArea").removeClass("dragOver");
            else if (state == 1)
                $("#uploadDropArea").removeClass("dragOver").addClass("dragOver");
        },
        toggleUrlBox: function(state) {
            if (state == 0)
                $("#urlUploadInput").removeClass("hidden").addClass("hidden");
            else if (state == 1)
                $("#urlUploadInput").removeClass("hidden");
            else if (state == 3)
                $("#urlUploadInput").removeClass("valid");
            else if (state == 4)
                $("#urlUploadInput").removeClass("valid").addClass("valid");
        },
        toggleSnippetControls: function(state, wipe) {
            if (wipe) {
                $("#urlUploadSnippetStart").val("");
                $("#urlUploadSnippetDuration").val("");
                $("#urlUploadSnippetBox").prop("checked", false);
            }

            if (state == 0) {
                $(".urlUploadSnippetCheckbox").removeClass("hidden").addClass("hidden");
                $(".urlUploadSnippetControls").removeClass("hidden").addClass("hidden");
            } else if (state == 1) {
                $(".urlUploadSnippetCheckbox").removeClass("hidden");
                $(".urlUploadSnippetControls").removeClass("hidden");
            } else if (state == 2) {
                $(".urlUploadSnippetCheckbox").removeClass("hidden");
                $(".urlUploadSnippetControls").removeClass("hidden").addClass("hidden");
            } else if (state == 3) {
                // shown but disabled
                $(".urlUploadSnippetCheckbox").removeClass("disabled");
                $(".urlUploadSnippetControls").removeClass("hidden").addClass("hidden");
            }
        },
        toggleContextLine: function(state) {
            if (state == 0)
                $(".contextLine").removeClass("hidden").addClass("hidden");
            else if (state == 1)
                $(".contextLine").removeClass("hidden");
        },
        toggleStatusLabel: function(state) {
            if (state == 0)
                $("#uploadStatusLabel").removeClass("muted").addClass("muted");
            else if (state == 1)
                $("#uploadStatusLabel").removeClass("muted");
        },
        // end shortcuts for uploader element toggling

        loadFileData: function(files) {
            ImageUpload.formFiles = [];
            if (files.length > 0) {
                if ($("#uploadChatty").is(":checked")) {
                    // allow multiple files for chattypics
                    for (var i=0; i < files.length; i++) {
                        ImageUpload.formFiles.push(files[i]);
                    }
                } else {
                    // only use the first file
                    ImageUpload.formFiles.push(files[0]);
                }

                ImageUpload.updateStatusLabel(ImageUpload.formFiles);
                ImageUpload.toggleContextLine(1);
                ImageUpload.toggleDragOver(1);
                // styling to indicate to the user that the files will be uploaded
                if (!ImageUpload.formFileUrl.length > 7)
                    ImageUpload.toggleStatusLabel(1);

                return true;
            }
            return false;
        },

        loadFileUrl: function(string) {
            var _isGfycat = $("#uploadGfycat").length && $("#uploadGfycat").is(":checked");
            var typeObj = ImageUpload.isValidUrl(string);
            if (_isGfycat && typeObj && typeObj.type == 1) {
                // video hoster url
                ImageUpload.formFileUrl = string;
                ImageUpload.toggleDragOver(1);
                ImageUpload.toggleUrlBox(4);
                // enable snippets
                ImageUpload.toggleSnippetControls(2);
                ImageUpload.toggleContextLine(1);
                // styling to indicate to the user that the url takes priority over files
                ImageUpload.toggleStatusLabel(1);
                return true;
            } else if (typeObj && typeObj.type == 0) {
                // normal image url
                ImageUpload.formFileUrl = string;
                ImageUpload.toggleDragOver(1);
                ImageUpload.toggleUrlBox(4);
                // disable snippets
                ImageUpload.toggleSnippetControls(0);
                ImageUpload.toggleContextLine(1);
                // styling to indicate to the user that the url takes priority over files
                ImageUpload.toggleStatusLabel(1);
                return true;
            } else if (ImageUpload.formFiles.length == 0) {
                // not a valid string yet we don't have files so wipe our saved url state
                ImageUpload.formFileUrl = "";
                ImageUpload.toggleDragOver(0);
                ImageUpload.toggleUrlBox(3);
                ImageUpload.toggleSnippetControls(0);
                ImageUpload.toggleContextLine(0);
                ImageUpload.toggleStatusLabel(0);
                return true;
            }

            ImageUpload.toggleUrlBox(3);
            ImageUpload.toggleStatusLabel(1);
            return false;
        },

        clearFileData: function(soft) {
            // contextually reset our uploader form inputs
            var typeObj = ImageUpload.isValidUrl(ImageUpload.formFileUrl);
            var _isUrl = typeObj && typeObj.type > -1;
            var _isFiles = ImageUpload.formFiles.length > 0;
            var _isUrlInput = ImageUpload.formFileUrl.length > 7;

            // override for checking chattypics filter
            if (soft) {
                if (!_isFiles) {
                    ImageUpload.toggleDragOver(0);
                    ImageUpload.toggleContextLine(0);
                }
                return true;
            }

            if (_isFiles && _isUrl) {
                // if we have a valid url, wipe our files instead
                ImageUpload.formFiles = [];
                ImageUpload.updateStatusLabel();
                ImageUpload.toggleStatusLabel(1);
            } else if (_isUrlInput) {
                // wipe any content in the input box
                ImageUpload.formFileUrl = "";
                $("#urlUploadInput").val("");
                ImageUpload.toggleDragOver(0);
                ImageUpload.toggleContextLine(0);
                ImageUpload.toggleSnippetControls(0, true);
            } else if (_isFiles) {
                ImageUpload.formFileUrl = "";
                ImageUpload.formFiles = [];
                ImageUpload.updateStatusLabel();
                ImageUpload.toggleStatusLabel(1);
                ImageUpload.toggleSnippetControls(0, true);
            }

            ImageUpload.removeUploadMessage();
            if (ImageUpload.formFileUrl.length == 0 &&
                ImageUpload.formFiles.length == 0) {
                ImageUpload.toggleStatusLabel(1);
                ImageUpload.toggleDragOver(0);
                ImageUpload.toggleContextLine(0);
                ImageUpload.toggleSnippetControls(0, true);
            }

            return false;
        },

        updateStatusLabel: function(files) {
            // update our status label
            var label = $("#uploadStatusLabel")[0];
            if (files != null && files.length > 0 && files.length < 2) {
                label.textContent = `${files[0].name}`;
                return true;
            } else if (files != null && files.length > 1) {
                label.textContent = `${files.length} items for upload`;
                return true;
            }

            label.textContent = "";
            return false;
        },

        isValidUrl: function(string) {
            var ip_pattern = /^(?:http:\/\/|https:\/\/)(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/(?:.*?\/)?([\w\-\_\&\#\@]+)\.(gif|jpg|jpeg|png|webp)$/i.exec(string);
            var url_pattern = /^(?:http:\/\/|https:\/\/).*?(?:[\w\-]+\.[\w]+)\/(?:.*?\/)?([\w\-\_\&\#\@]+)\.(gif|jpg|jpeg|png|webp)$/i.exec(string);
            // should work for most video hosting sites but still matches false positives due to being generic
            var vid_pattern1 = /^(?:http:\/\/|https:\/\/).*?(?:[\w\-]+\.[\w]+)\/(?:.*?\/)?([\w\-\_\&\#\@]+)\.(mp4|webm|gifv)$/i.exec(string);
            var vid_pattern2 = /^(?:http:\/\/|https:\/\/)(?:.*)?(?:[\w\-]+\.[\w]+)\/(?:.*\/)?((?!.*?\.[\w]+$)[\w\-\&\#\@\/\?\=\.]+)$/i.exec(string);

            if (string.length > 7 && string.length < 2048 &&
                $("#uploadGfycat").is(":checked") &&
                vid_pattern1 && vid_pattern1.length > 0 ||
                vid_pattern2 && vid_pattern2.length > 0) {
                return {
                    type: 1,
                    filename: vid_pattern1 && vid_pattern1[1] ||
                        vid_pattern2 && vid_pattern2[1]
                    };
            } else if (string.length > 7 && string.length < 2048 &&
                url_pattern && url_pattern.length > 0 ||
                ip_pattern && ip_pattern.length > 0) {
                return {
                    type: 0,
                    filename: url_pattern && url_pattern[1] ||
                        ip_pattern && ip_pattern[1]
                    };
            }
            return null;
        },

        isValidNumber: function(number, min, max) {
            var _min = Number.parseInt(min);
            var _max = Number.parseInt(max);
            var _num = Number.isNaN(Number.parseInt(number)) ? _min : Number.parseInt(number);
            if (_num < _min)
                return _min;
            else if (_num > max)
                return _max;
            else
                return _num;
        },

        doUrlUpload: function () {
            var isImgur = $("#uploadImgur").length && $("#uploadImgur").is(":checked");
            var isGfycat = $("#uploadGfycat").length && $("#uploadGfycat").is(":checked");
            var url = ImageUpload.formFileUrl;

            if (isImgur) {
                // only images
                var fd = new FormData();
                fd.append("type", "url");
                fd.append("image", url);

                ImageUpload.doImgurUpload(fd);
            } else if (isGfycat) {
                var fileObj = null;
                var _isSnip = $("#urlUploadSnippetBox").length &&
                    $("#urlUploadSnippetBox").is(":checked");
                var snipStart = $("#urlUploadSnippetStart").val();
                var snipDuration = $("#urlUploadSnippetDuration").val();

                if (_isSnip && snipStart > -1 && snipDuration > 0)
                    fileObj = { "cut": { "start": snipStart, "duration": snipDuration } };

                var typeObj = ImageUpload.isValidUrl(url);
                var urlObj = { "fetchUrl": url, "title": typeObj && typeObj.filename };
                fileObj = fileObj ? Object.assign({}, fileObj, urlObj) : urlObj;

                // could be video or image
                ImageUpload.doGfycatUpload(fileObj);
            }
        },

        doFileUpload: function () {
            var isChattyPics  = $("#uploadChatty").length && $("#uploadChatty").is(":checked");
            var isImgur = $("#uploadImgur").length && $("#uploadImgur").is(":checked");
            var isGfycat = $("#uploadGfycat").length && $("#uploadGfycat").is(":checked");
            var filesList = ImageUpload.formFiles;

            var fd = new FormData();
            if (isChattyPics) {
                // Chattypics prefers php array format
                for (var file of filesList) {
                    fd.append("userfile[]", file);
                }
                ImageUpload.doChattyPicsUpload(fd);
            } else if (isImgur) {
                fd.append("type", "file");
                fd.append("image", filesList[0]);
                ImageUpload.doImgurUpload(fd);
            } else if (isGfycat) {
                // pass Gfycat method the actual File object for renaming
                ImageUpload.doGfycatUpload({ "file": filesList[0] });
            }
        },

        doImgurUpload: function (formdata) {
            ImageUpload.removeUploadMessage();
            ImageUpload.addUploadMessage("silver", "Uploading to Imgur...");
            postXHR({
                url: ImageUpload.imgurApiImageBaseUrl,
                header: { "Authorization": ImageUpload.imgurClientId },
                data: formdata
            }).then(res => {
                if (res && res.data && res.data.link)
                    ImageUpload.handleUploadSuccess(res.data.link);
                else
                    ImageUpload.handleUploadFailure(res);
            });
        },

        doChattyPicsUpload: async function (formdata) {
            ImageUpload.removeUploadMessage();
            ImageUpload.addUploadMessage("silver", "Uploading to ChattyPics...");
            let _fdJSON = await FormDataToJSON(formdata);

            browser.runtime.sendMessage({ name: "corbPost",
                optionsObj: {
                    url: ImageUpload.chattyPicsUrl,
                    override: { chattypics: true }
                },
                data: _fdJSON
            })
            .then(link => ImageUpload.handleUploadSuccess(link))
            .catch(err => ImageUpload.handleUploadFailure(err));
        },

        handleUploadSuccess: function(link) {
            $("#frm_body").insertAtCaret(link + "\n");
            ImageUpload.delayedRemoveUploadMessage("green", "Success!", null, 3000);
        },

        handleUploadFailure: function(resp) {
            ImageUpload.removeUploadMessage();
            if(resp && resp.status != 200 && resp.statusText.length > 0) {
                ImageUpload.delayedRemoveUploadMessage("red", "Failure:", resp.statusText, 5000);
            } else {
                ImageUpload.delayedRemoveUploadMessage("red", "Failure!", null, 5000);
            }
        },

        addUploadMessage: function(color, message, detailMsg, spin) {
            var statusLabel = $("#errorStatusLabel");
            var statusLabelDetail = $("#errorStatusLabelDetail");

            ImageUpload.removeUploadMessage();
            $("#errorLabels").removeClass("hidden");
            statusLabel.css("color", color);
            statusLabelDetail.css("color", color);
            if (spin) { statusLabel.removeClass("spinner").addClass("spinner"); }

            statusLabel.text(message);
            if(detailMsg != undefined && detailMsg.length > 0) {
                statusLabelDetail.text(detailMsg);
            }
        },

        removeUploadMessage: function(value) {
            $("#errorStatusLabel").text("");
            $("#errorStatusLabelDetail").text("");
            $("#errorLabels").removeClass("hidden").addClass("hidden");
            $("#errorStatusLabel").removeClass("spinner");
            ImageUpload.updateStatusLabel();
            return value;
        },

        delayedRemoveUploadMessage: function(color, mainMessage, detailMessage, delay, value) {
            // helper function that returns a promised value to the caller after the UploadMessage
            ImageUpload.addUploadMessage(color, mainMessage, detailMessage);
            var ret = new Promise(function(resolve) {
                setTimeout(function() {
                    ImageUpload.removeUploadMessage();
                    resolve(value);
                }, delay);
            });
            return ret;
        },

        doFormTimer: function(override) {
            if (override && ImageUpload.formUploadTimer != null) {
                ImageUpload.formUploadElapsed = 0;
                clearInterval(ImageUpload.formUploadTimer);
                return;
            }
            // just a rough timer - not necessarily reliable
            ImageUpload.formUploadTimer = setInterval(function() {
                ImageUpload.formUploadElapsed++;
            }, 1000);
        },

        elapsedToString: function() {
            return new Date(1000 * ImageUpload.formUploadElapsed).toISOString().substr(11, 8);
        },

        handleGfycatUploadStatus: function (json) {
            if (json && json.task == "encoding") {
                var elapsed = ImageUpload.elapsedToString();
                ImageUpload.addUploadMessage("silver", `Encoding ${elapsed}`, null, true);
                // endpoint is busy so loop until we timeout or we're cancelled
                return false;
            }
            else if (json && json.task == "complete" && json.gfyname) {
                // call checkGfycatStatus with an override object to report the success
                ImageUpload.checkGfycatStatus(null, { "gfyname": json.gfyname });
                return false;
            } else {
                var err = JSON.stringify(json.errorMessage);
                if (json.code) {
                    ImageUpload.delayedRemoveUploadMessage(
                        "red", "Failure:", `${err.code} = ${err.description}`, 5000
                    );
                } else if (json.task == 'NotFoundo') {
                    ImageUpload.delayedRemoveUploadMessage("red", "Failure!", null, 3000);
                }
                console.log(`Gfycat endpoint error: ${json}`);
                return true;
            }
        },

        doGfycatUpload: function(fileObj) {
            ImageUpload.removeUploadMessage();
            var dataBody = !isEmpty(fileObj) ? JSON.stringify(fileObj) : null;
            // keep track of how long we take
            ImageUpload.doFormTimer();

            postXHR({
                url: ImageUpload.gfycatApiUrl,
                header: !dataBody.fetchUrl && { "Content-Type": "application/json" },
                data: dataBody
            }).then(key_resp => {
                if (!key_resp) {
                    ImageUpload.handleGfycatUploadStatus(key_resp); // fail?!
                    return;
                }

                var key = key_resp.gfyname;
                var dropUrl = key_resp.uploadType;
                if (fileObj.fetchUrl) {
                    // if we used 'fetchUrl' the server will report back a key
                    ImageUpload.addUploadMessage("silver", "Fetching to Gfycat...");
                    // use it to check our gfycat status
                    ImageUpload.checkGfycatStatus(key);
                }
                else if (fileObj.file) {
                    // if 'file' method is used then use the key given
                    ImageUpload.addUploadMessage("silver", "Uploading to Gfycat...");
                    // rename our file to exactly the name of the key
                    dataBody = new File([fileObj.file], key, fileObj.type);

                    postXHR({
                        method: "PUT",
                        url: `https://${dropUrl}/${key}`,
                        data: dataBody
                    }).then(drop_resp => {
                        // check on our gfycat status after the drop (probably bool here)
                        if (drop_resp)
                            ImageUpload.checkGfycatStatus(key);
                        else
                            ImageUpload.handleGfycatUploadStatus(drop_resp);
                    }).catch(err => console.log(err));
                }
            }).catch(err => console.log(err));
        },

        checkGfycatStatus: function (gfycatKey, override) {
            if (override instanceof Object && override.gfyname) {
                var _key = override.gfyname;
                var statUrl = `${ImageUpload.gfycatApiUrl}/${_key}`;
                // grab our formal url from the endpoint rather than constructing it
                fetchSafe(statUrl).then(stat_resp => {
                    var _url = stat_resp && stat_resp.gfyItem.webmUrl;
                    var elapsed = ImageUpload.elapsedToString();
                    if (_url) {
                        $("#frm_body").insertAtCaret(stat_resp.gfyItem.webmUrl + "\n");
                        ImageUpload.delayedRemoveUploadMessage("green", `Success in ${elapsed}`, null, 3000, true);
                    }
                    ImageUpload.doFormTimer(true);
                });
                clearInterval(ImageUpload.formUploadRepeater);
                return;
            }

            var requestUrl = `${ImageUpload.gfycatStatusUrl}/${gfycatKey}`;
            // verify the upload/fetch - every 3s unless cancelled
            ImageUpload.formUploadRepeater = setInterval(function() {
                fetchSafe(requestUrl).then(req_resp => {
                    if (ImageUpload.handleGfycatUploadStatus(req_resp)) {
                        clearInterval(ImageUpload.formUploadRepeater);
                        ImageUpload.doFormTimer(true);
                        return;
                    }
                });
            }, 3000);
        }
    };

    processPostBoxEvent.addHandler(ImageUpload.insertForm);
});
