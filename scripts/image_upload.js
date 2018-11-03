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

            formFiles: null,

            formFileUrl: "",

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
                                    <input type="file" id="fileUploadInput" accept="image/*" multiple="multiple">

                                    <span class="uploadDropLabel">
                                        <a href="#" id="fileChooserLink">Choose some files</a>
                                        or drop them here...
                                    </span>

                                    <div class="urlBox">
                                        <input type="text" id="urlUploadInput"
                                            spellcheck="false"
                                            class="urlInputBox hidden"
                                            placeholder="Or use an image URL..."
                                        >
                                    </div>
                                    <div class="contextLine hidden">
                                        <div id="uploadButtons">
                                            <button id="urlUploadButton">Upload</button>
                                            <button id="cancelUploadButton" class="small">X</button>
                                        </div>
                                        <div id="uploadStatusLabel"></div>
                                    </div>
                                    <div class="errorLabels">
                                        <span id="errorStatusLabel" class="hidden"></span>
                                        <span id="errorStatusLabelDetail" class="hidden"></span>
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

                // toggle url entry field based on hoster
                $("#uploadChatty").click(function() {
                    $("#urlUploadInput").toggleClass('hidden', $("#uploadChatty").is(":checked"));
                    ImageUpload.clearFileData(true);
                });
                $("#uploadGfycat, #uploadImgur").click(function() {
                    $("#urlUploadInput").toggleClass('hidden', $("#uploadChatty").is(":checked"));
                    if (ImageUpload.formFileUrl.length > 7) {
                        // contextually unhide if we have content
                        $("#uploadDropArea").addClass("dragOver");
                        $(".contextLine").removeClass("hidden");
                    }
                });

                // attach events for dropping images
                $("#uploadDropArea").dropArea();
                $("#uploadDropArea").on('drop', function(e){
                    e.preventDefault();
                    e = e.originalEvent;
                    var files = e.dataTransfer.files;
                    if (ImageUpload.inputIsImage(files)) {
                        ImageUpload.loadFileData(files);
                    }
                });
                $("#fileUploadInput").change(function (e) {
                    var files = e.target.files;
                    if (ImageUpload.inputIsImage(files)) {
                        ImageUpload.loadFileData(files);
                    }
                });

                $("#cancelUploadButton").click(function(e) {
                    e.preventDefault();
                    // contextually reset our input form
                    ImageUpload.clearFileData();
                });

                // attach event for upload button
                $("#urlUploadButton").click(function(e) {
                    e.preventDefault();

                    if ($("#uploadChatty").is(":checked")) {
                        // forcefully ignore url input on chattypics
                        ImageUpload.doFileUpload(ImageUpload.formFiles);
                    } else {
                        // if both inputs are populated do url first
                        if (ImageUpload.formFileUrl.length > 7)
                            ImageUpload.doUrlUpload(ImageUpload.formFileUrl);
                        else if (ImageUpload.formFiles != null)
                            ImageUpload.doFileUpload(ImageUpload.formFiles);
                    }

                    scrollToElement($("#frm_body")[0]);
                    $("#frm_body").focus();
                    return false;
                });
            },

            inputIsImage: function(files) {
                if (files.length > 0) {
                    for (var i=0; i < files.length; i++) {
                        if (!/image/.test(files[i].type)) {
                            return false;
                        }
                    }
                }

                return true;
            },

            loadFileData: function(files) {
                ImageUpload.formFiles = new FormData();
                if (files.length > 0) {
                    for (var i=0; i < files.length; i++) {
                        ImageUpload.formFiles.append("image", files[i]);
                    }

                    ImageUpload.updateStatusLabel(files);
                    $(".contextLine").removeClass("hidden");
                    $("#uploadDropArea").toggleClass("dragOver", ImageUpload.formFiles != null);
                    // styling to indicate to the user that the files will be uploaded
                    $("#uploadStatusLabel").toggleClass("muted", !ImageUpload.formFileUrl.length > 7);
                    return true;
                }
                return false;
            },

            loadFileUrl: function(string) {
                // sanitized http?:// minimum for validation
                if (ImageUpload.isValidUrl(string)) {
                    ImageUpload.formFileUrl = string;
                    $(".contextLine").removeClass("hidden");
                    // styling to indicate to the user that the url takes priority over files
                    $("#uploadStatusLabel").toggleClass("muted", ImageUpload.formFiles != null);
                    return true;
                } else if (ImageUpload.formFiles == null) {
                    ImageUpload.clearFileData();
                    return true;
                }

                // remove file status styling because we have no url content
                $("#uploadStatusLabel").toggleClass("muted", ImageUpload.isValidUrl(string));
                return false;
            },

            clearFileData: function(soft) {
                var _isUrl = ImageUpload.formFileUrl.length > 0;
                var _isFiles = ImageUpload.formFiles != null;

                // override for checking chattypics filter
                if (soft) {
                    if (!_isFiles) {
                        $("#uploadDropArea").removeClass("dragOver");
                        $(".contextLine").addClass("hidden");
                    }
                    return true;
                }

                if (_isFiles && _isUrl) {
                    ImageUpload.formFiles = null;
                    ImageUpload.updateStatusLabel();
                } else if (_isUrl) {
                    ImageUpload.formFileUrl = "";
                    $("#urlUploadInput").val("");
                    $(".contextLine").addClass("hidden");
                } else if (_isFiles) {
                    ImageUpload.formFiles = null;
                    ImageUpload.updateStatusLabel();
                    $(".contextLine").addClass("hidden");
                }

                if (ImageUpload.formFileUrl.length == 0 &&
                    ImageUpload.formFiles == null) {
                        $("#uploadDropArea").removeClass("dragOver");
                        $("#uploadStatusLabel").toggleClass("muted", ImageUpload.formFiles != null);
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
                if (string.length > 7 && string.length < 2048) {
                    if(ip_pattern.test(string) || url_pattern.test(string)) { return true; }
                }
                return false;
            },

            doUrlUpload: function (obj) {
                var isImgur = $("#uploadImgur").is(":checked");
                var isGfycat = $("#uploadGfycat").is(":checked");
                var url = ImageUpload.formFileUrl;

                var fd = new FormData();
                fd.append("type", "url");
                fd.append("image", url);

                if (isImgur) {
                    ImageUpload.doImgurUpload(fd);
                } else if (isGfycat) {
                    ImageUpload.doGfycatUpload(fd);
                }
            },

            doFileUpload: function (filesList) {
                var isChattyPics  = $("#uploadChatty").is(":checked");
                var isImgur = $("#uploadImgur").is(":checked");
                var isGfycat = $("#uploadGfycat").is(":checked");

                if (isChattyPics) {
                    var fd = new FormData();
                    for (var file of filesList.entries()) {
                        // Chattypics prefers php array format
                        fd.append("userfile[]", file[1]);
                    }
                    ImageUpload.doChattyPicsUpload(fd);
                } else if (isImgur) {
                    ImageUpload.doImgurUpload(filesList);
                } else if (isGfycat) {
                    ImageUpload.doGfycatUpload(filesList);
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
                    enctype : 'multipart/form-data',
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
                //ImageUpload.insertTextAtCursor("frm_body", link);
                $("#frm_body").insertAtCaret(link + "\n");
                ImageUpload.addUploadMessage("green", "Success!");
            },

            handleChattyUploadSuccess : function(data) {
                var response = $(data);
                var link11 = response.find("#link11");
                var link = link11[0];
                var url = $(link).val();
                //ImageUpload.insertTextAtCursor("frm_body", url);
                $("#frm_body").insertAtCaret(url + "\n");
                ImageUpload.addUploadMessage("green", "Success!");
            },

            handleUploadFailure: function(respdata) {
                ImageUpload.removeUploadMessage();
                var error = "";
                try {
                    var responseText = $.parseJSON(respdata.responseText);
                    error = responseText.data.error;
                } catch (e) {}
                if(error.length > 0) {
                    ImageUpload.addUploadMessage("red", "Failure :(", error);
                } else {
                    ImageUpload.addUploadMessage("red", "Failure :(");
                }
            },

            addUploadMessage: function(message) {
                var statusLabel = $("#uploadStatusLabel");
                if (message != null && message.length > 0) {
                    uploadMsgDetail.text(detailMsg);
                    $(".uploadStatusLabel").append(uploadMsgDetail);
                }
            },

            removeUploadMessage: function() {
                $("#uploadMsg").remove();
                $("#uploadMsgDetail").remove();
            },

            setImgurHeader: function (xhr) {
                xhr.setRequestHeader(ImageUpload.imgurClientIdHeader, ImageUpload.imgurClientId);
            },

            // START WIP
            doGfycatKey: function (url) {
                var urlBody = url.length > 0 && { "fetchUrl": `${url}` };

                // return a gfycat key for use in uploading a file/url
                $.ajax({
                    type: "POST",
                    url : gfycatApiUrl,
                    cache: false,
                    processData: false,
                    contentType: "application/json",
                    data: !!urlBody ? urlBody : null
                }).done(function(data) {
                    ImageUpload.handleGfycatUploadStatus(data);
                }).fail(function(data) {
                    ImageUpload.handleGfycatUploadStatus(data);
                });

                return false;
            },

            doGfycatUpload: function (formdata) {
                ImageUpload.removeUploadMessage();
                // get gfycat key -> use key as upload filename
                var gfycatKey = doGfycatKey();
                formdata.append("filename", gfycatKey);
                ImageUpload.addUploadMessage("silver", "Uploading to Gfycat...");

                $.ajax({
                    type: "POST",
                    url : gfycatDropUrl,
                    cache: false,
                    processData: false,
                    contentType: "application/json",
                    enctype : "multipart/form-data",
                    data : formdata
                }).done(function(data) {
                    ImageUpload.handleGfycatUploadStatus(data);
                }).fail(function(data) {
                    ImageUpload.handleGfycatUploadStatus(data);
                });
            },

            handleGfycatUploadStatus: function (respdata) {
                try {
                    // check for gfycat key
                    if (respdata.data.task === "NotFoundo" ||
                        !respdata.data.gfyName) {
                        ImageUpload.addUploadMessage("red", "Failure :(");
                        console.log();
                    } else if (respdata.data.gfyName) {
                        var url = `https://gfycat.com/${respdata.data.gfyName}`;
                        console.log(url);

                        $("#frm_body").insertAtCaret(url + "\n");
                        ImageUpload.addUploadMessage("green", "Success!");
                    } else {
                        // probably an error
                        console.log(respdata.data);
                    }
                } catch (err) { console.log(err); }
            },

            checkGfycatStatus: function (gfycatKey) {
                // use our gfycatKey to get details on the upload
                var requestUrl = `${gfycatStatusUrl}/${gfycatKey}`;
                $.ajax({
                    type: "GET",
                    url: requestUrl
                }).done(function(data) {
                    // do our status handling elsewhere
                    ImageUpload.handleGfycatUploadStatus(data);
                }).fail(function(data) {
                    ImageUpload.handleGfycatUploadStatus(data);
                });
            }
            // END WIP
        };

        processPostBoxEvent.addHandler(ImageUpload.insertForm);
    }
});
