settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("image_upload"))
    {
        ImageUpload =
        {
            imgurApiKey :  "48a14aa108f519f249aacc12d08caac3",

            imgurApiBaseUrl: "https://api.imgur.com/3/",

            imgurApiImageEndpoint: "upload.json",

            imgurClientIdHeader: "Authorization",

            imgurClientId: "Client-ID c045579f61fc802",

            chattyPicsUrl : "https://chattypics.com/upload.php",

            gfycatApiUrl: "https://api.gfycat.com/v1/gfycats",

            gfycatDropUrl: "https://filedrop.gfycat.com",

            gfycatStatusUrl: "https://api.gfycat.com/v1/gfycats/fetch/status",

            uploadShown: false,

            formFiles: [],

            formFileUrl: "",

            formUploadRepeater: null,

            formUploadTimer: 0,

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
                            <div id="uploadFields" class="hidden">
                                <div class="uploadFilters">
                                    <input type="radio" name="imgUploadSite" id="uploadChatty" checked="checked">
                                    <input type="radio" name="imgUploadSite" id="uploadGfycat">
                                    <input type="radio" name="imgUploadSite" id="uploadImgur">

                                    <div class="uploadRadioLabels">
                                        <label class="chatty" for="uploadChatty">Chattypics</label>
                                        <label class="gfycat" for="uploadGfycat">Gfycat</label>
                                        <label class="imgur" for="uploadImgur">Imgur</label>
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
                                            <input type="number" id="urlUploadSnippetStart"
                                                title="Position in video to start snippet (in seconds)"
                                                min="0" max="10800" placeholder="Start"
                                            >
                                            <input type="number" id="urlUploadSnippetDuration"
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
                        if ($("#urlUploadSnippetBox").is(":checked") &&
                            ImageUpload.isValidUrl(ImageUpload.formFileUrl) == 1) {
                            ImageUpload.toggleSnippetControls(1);
                        } else if ($("#urlUploadSnippetBox").is(":checked")) {
                            ImageUpload.toggleSnippetControls(2);
                        } else {
                            ImageUpload.toggleSnippetControls(0);
                        }
                    }
                    else if ($(this).is("#uploadImgur")) {
                        $("#fileUploadInput").attr("accept", "image/*");
                        ImageUpload.toggleSnippetControls(0);
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
                    // cancel our repeater if busy
                    if (ImageUpload.formUploadRepeater != null)
                        clearInterval(ImageUpload.formUploadRepeater);
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
                var _isGfycat = $("#uploadGfycat").is(":checked");
                if (_isGfycat && ImageUpload.isValidUrl(string) == 1) {
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
                } else if (ImageUpload.isValidUrl(string) == 0) {
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
                var _isUrl = ImageUpload.isValidUrl(ImageUpload.formFileUrl) > -1;
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
                if (files != null && files.length > 0 && files.length < 2) {
                    $("#uploadStatusLabel")[0].replaceHTML(`${files[0].name}`);
                    return true;
                } else if (files != null && files.length > 1) {
                    $("#uploadStatusLabel")[0].replaceHTML(`${files.length} items for upload`);
                    return true;
                }

                $("#uploadStatusLabel")[0].replaceHTML("");
                return false;
            },

            isValidUrl: function(string) {
                var ip_pattern = /^(?:http:\/\/|https:\/\/)*?(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/[\w\d\-\_\&\#\$\^\?\.\=\,\/\\]+\.(gif|jpg|jpeg|png)$/i;
                var url_pattern = /^(?:http:\/\/|https:\/\/)*?([\d\w\-\.]+){1,}\/[\w\d\-\&\#\$\^\?\.\=\,\/\\]+\.(gif|jpg|jpeg|png)$/i;
                // should work for most video hosting sites but still matches false positives due to being generic
                var vidsite_pattern = /^(?:http:\/\/|https:\/\/)(?:[\d\w\-]+\.){1,}[\d\w\-]+\/[\w\d\-\/\?\&\$\%\#\=\.]+$/i;

                if ($("#uploadGfycat").is(":checked") && string.length > 7 && string.length < 2048 &&
                    vidsite_pattern.test(string)) {
                    return 1;
                } else if (string.length > 7 && string.length < 2048 &&
                    ip_pattern.test(string) || url_pattern.test(string)) {
                    return 0;
                }
                return -1;
            },

            isValidNumber: function(number, min, max) {
                var _min = Number.parseInt(min);
                var _max = Number.parseInt(max);
                var _num = Number.isNaN(Number.parseInt(number)) ? Number(_min) : Number.parseInt(number);
                if (_num < _min)
                    return _min;
                else if (_num > max)
                    return _max;
                else
                    return _num;
            },

            doUrlUpload: function () {
                var isImgur = $("#uploadImgur").is(":checked");
                var isGfycat = $("#uploadGfycat").is(":checked");
                var url = ImageUpload.formFileUrl;

                if (isImgur) {
                    // only images
                    var fd = new FormData();
                    fd.append("type", "url");
                    fd.append("image", url);

                    ImageUpload.doImgurUpload(fd);
                } else if (isGfycat) {
                    var fileObj = null;
                    var _isSnip = $("#urlUploadSnippetBox").is(":checked");
                    var snipStart = $("#urlUploadSnippetStart").val();
                    var snipDuration = $("#urlUploadSnippetDuration").val();

                    if (_isSnip && snipStart > -1 && snipDuration > 0)
                        fileObj = { "cut": { "start": snipStart, "duration": snipDuration } };

                    fileObj = fileObj && Object.assign({}, fileObj, { "fetchUrl": url });

                    // could be video or image
                    ImageUpload.doGfycatUpload(fileObj);
                }
            },

            doFileUpload: function () {
                var isChattyPics  = $("#uploadChatty").is(":checked");
                var isImgur = $("#uploadImgur").is(":checked");
                var isGfycat = $("#uploadGfycat").is(":checked");
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
                    ImageUpload.doGfycatUpload({ "file": filesList[0] });
                }
            },

            doImgurUpload: function (formdata) {
                ImageUpload.removeUploadMessage();
                formdata.append("key", ImageUpload.imgurApiKey);
                var apiurl = ImageUpload.imgurApiBaseUrl + ImageUpload.imgurApiImageEndpoint;
                ImageUpload.addUploadMessage("silver", "Uploading to Imgur...");
                $.ajax({
                    type: "POST",
                    url : apiurl,
                    cache: false,
                    contentType: false,
                    processData: false,
                    enctype: 'multipart/form-data',
                    dataType: 'json',
                    beforeSend : ImageUpload.setImgurHeader,
                    data : formdata
                }).done(function(data) {
                    ImageUpload.handleUploadSuccess(data);
                })
                .fail(function(data) {
                    ImageUpload.handleUploadFailure(data);
                });
            },

            doChattyPicsUpload: function (formdata) {
                ImageUpload.removeUploadMessage();
                ImageUpload.addUploadMessage("silver", "Uploading to ChattyPics...");
                $.ajax({
                    type: "POST",
                    url : ImageUpload.chattyPicsUrl,
                    cache: false,
                    processData: false,
                    contentType: false,
                    enctype : 'multipart/form-data',
                    data : formdata
                }).done(function(data) {
                    ImageUpload.handleChattyUploadSuccess(data);
                })
                .fail(function(data) {
                    ImageUpload.handleUploadFailure(data);
                });
            },

            handleUploadSuccess: function(respdata) {
                var link = respdata.data.link;
                $("#frm_body").insertAtCaret(link + "\n");
                ImageUpload.delayedRemoveUploadMessage("green", "Success!", "", 3000);
            },

            handleChattyUploadSuccess : function(data) {
                var response = $(data);
                var link11 = response.find("#link11");
                var link = link11[0];
                var url = $(link).val();
                $("#frm_body").insertAtCaret(url + "\n");
                ImageUpload.delayedRemoveUploadMessage("green", "Success!", "", 3000);
            },

            handleUploadFailure: function(respdata) {
                ImageUpload.removeUploadMessage();
                var error = "";
                try {
                    var responseText = $.parseJSON(respdata.responseText);
                    error = responseText.data.error;
                } catch (e) {}
                if(error.length > 0) {
                    ImageUpload.delayedRemoveUploadMessage("red", "Failure:", error, 5000);
                } else {
                    ImageUpload.delayedRemoveUploadMessage("red", "Failure!", "", 5000);
                }
            },

            addUploadMessage: function(color, message, detailMsg, spin) {
                var statusLabel = $("#errorStatusLabel");
                var statusLabelDetail = $("#errorStatusLabelDetail");

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
                $("#errorLabels").addClass("hidden");
                $("#errorStatusLabel").removeClass("spinner");
                ImageUpload.updateStatusLabel();
                return value;
            },

            setImgurHeader: function (xhr) {
                xhr.setRequestHeader(ImageUpload.imgurClientIdHeader, ImageUpload.imgurClientId);
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

            handleGfycatUploadStatus: function (respdata) {
                if (respdata.task == "encoding") {
                    ImageUpload.addUploadMessage("silver", "Encoding", null, true);
                    // endpoint is busy so loop until we timeout or we're cancelled
                    return false;
                }
                else if (respdata.task == "complete" && respdata.gfyname) {
                    // call checkGfycatStatus with an override object to report the success
                    ImageUpload.checkGfycatStatus(null, { "gfyname": respdata.gfyname });
                    return false;
                } else {
                    var err = JSON.stringify(respdata.errorMessage);
                    if (err.code) {
                        ImageUpload.delayedRemoveUploadMessage(
                            "red", "Failure:", `${err.code} = ${err.description}`, 5000
                        );
                    }
                    console.log(`Gfycat endpoint error: ${errDetail}`);
                    return true;
                }
            },

            doGfycatUpload: function(fileObj) {
                ImageUpload.removeUploadMessage();
                // if we use 'fetchUrl' the server will report back a key
                // if we use 'file' then grab a key and push it with our file
                var dataBody = fileObj.fetchUrl ? JSON.stringify(fileObj) : JSON.stringify({ title: fileObj.file.name });

                $.ajax({
                    type: "POST",
                    url: ImageUpload.gfycatApiUrl,
                    cache: false,
                    processData: false,
                    contentType: "application/json",
                    data: dataBody
                }).done(function(data) {
                    var key = data.gfyname;
                    if (fileObj.fetchUrl) {
                        ImageUpload.addUploadMessage("silver", "Fetching to Gifycat...");
                        ImageUpload.checkGfycatStatus(key);
                    }
                    else if (fileObj.file) {
                        ImageUpload.addUploadMessage("silver", "Uploading to Gifycat...");
                        var fd = new FormData();
                        fd.append("key", key);
                        fd.append("file", fileObj.file);

                        $.ajax({
                            type: "POST",
                            url: ImageUpload.gfycatDropUrl,
                            cache: false,
                            processData: false,
                            contentType: false,
                            data: fd
                        })
                        .done(function() {
                            ImageUpload.checkGfycatStatus(key);
                        })
                        .fail(function(err) {
                            ImageUpload.handleGfycatUploadStatus(err);
                        });
                    }
                });
            },

            checkGfycatStatus: function (gfycatKey, override) {
                if (override === Object(override) && override.gfyname) {
                    var _key = override.gfyname;
                    var statUrl = `${ImageUpload.gfycatApiUrl}/${_key}`;
                    // grab our formal url from the endpoint rather than constructing it
                    $.ajax({ type: "GET", url: statUrl })
                        .done(function(resp) {
                            var _url = resp.gfyItem.webmUrl;
                            console.log(_url, JSON.stringify(resp));
                            if (_url) {
                                $("#frm_body").insertAtCaret(resp.gfyItem.webmUrl + "\n");
                                ImageUpload.delayedRemoveUploadMessage("green", "Success!", "", 3000, true);
                            }
                    });
                    clearInterval(ImageUpload.formUploadRepeater);
                    return;
                }

                var requestUrl = `${ImageUpload.gfycatStatusUrl}/${gfycatKey}`;
                // verify the upload/fetch - every 3s unless cancelled
                ImageUpload.formUploadRepeater = setInterval(function() {
                    $.ajax({ type: "GET", url: requestUrl }).done(function(data) {
                        // stop early if we're successful or hit a fatal error
                        if (ImageUpload.handleGfycatUploadStatus(data)) {
                            clearInterval(ImageUpload.formUploadRepeater);
                            return;
                        }
                    });
                }, 3000);
            }
        };

        processPostBoxEvent.addHandler(ImageUpload.insertForm);
    }
});
