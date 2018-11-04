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
                    $("#urlUploadInput").toggleClass('hidden', $("#uploadChatty").is(":checked"));
                    $("#fileUploadInput").attr("accept", "image/*");
                    $("#fileUploadInput").attr("multiple");
                    ImageUpload.clearFileData(true);
                });
                $("#uploadGfycat, #uploadImgur").click(function() {
                    // gfycat allows video input
                    if ($(this).is("#uploadGfycat"))
                        $("#fileUploadInput").attr("accept", "image/*,video/*");
                    else if ($(this).is("#uploadImgur"))
                        $("#fileUploadInput").attr("accept", "image/*");

                    $("#urlUploadInput").toggleClass('hidden', $("#uploadChatty").is(":checked"));
                    $("#fileUploadInput").removeAttr("multiple");
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
                        if (!/image/.test(files[i].type)) {
                            return false;
                        }
                    }
                }

                return true;
            },

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
                    $(".contextLine").removeClass("hidden");
                    $("#uploadDropArea").toggleClass("dragOver", ImageUpload.formFiles.length > 0);
                    // styling to indicate to the user that the files will be uploaded
                    $("#uploadStatusLabel").toggleClass("muted", !ImageUpload.formFileUrl.length > 7);
                    return true;
                }
                return false;
            },

            loadFileUrl: function(string) {
                // sanitized "http?://" minimum for validation
                if (ImageUpload.isValidUrl(string)) {
                    ImageUpload.formFileUrl = string;
                    $(".contextLine").removeClass("hidden");
                    // styling to indicate to the user that the url takes priority over files
                    $("#uploadStatusLabel").removeClass("muted").addClass("muted");
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
                        $("#uploadStatusLabel").removeClass("muted").addClass("muted");
                        ImageUpload.removeUploadMessage();
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
                var youtube_pattern = /^(?:http:\/\/|https:\/\/)(?:.*\.|)youtube\.[A-Za-z]{2,}\/watch\?v=[\w\d\-]+$/i;
                if (string.length > 7 && string.length < 2048) {
                    if(ip_pattern.test(string) ||
                        url_pattern.test(string) ||
                        youtube_pattern.test(string)) {
                        return true;
                    }
                }
                return false;
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
                    // could be video or image
                    ImageUpload.doGfycatUpload({ fetchUrl: url });
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
                    fd.append("file", filesList[0]);
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
                $("#frm_body").insertAtCaret(link + "\n");
                ImageUpload.addUploadMessage("green", "Success!");
            },

            handleChattyUploadSuccess : function(data) {
                var response = $(data);
                var link11 = response.find("#link11");
                var link = link11[0];
                var url = $(link).val();
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
                    ImageUpload.addUploadMessage("red", "Failure:", error);
                } else {
                    ImageUpload.addUploadMessage("red", "Failure:");
                }
            },

            addUploadMessage: function(color, message, detailMsg) {
                var statusLabel = $("#errorStatusLabel");
                var statusLabelDetail = $("#errorStatusLabelDetail");

                $("#errorLabels").removeClass("hidden");
                statusLabel.css("color", color);
                statusLabelDetail.css("color", color);

                statusLabel.text(message);
                if(detailMsg != undefined && detailMsg.length > 0) {
                    statusLabelDetail.text(detailMsg);
                }
            },

            removeUploadMessage: function() {
                $("#errorStatusLabel").text("");
                $("#errorStatusLabelDetail").text("");
                $("#errorLabels").addClass("hidden");
            },

            setImgurHeader: function (xhr) {
                xhr.setRequestHeader(ImageUpload.imgurClientIdHeader, ImageUpload.imgurClientId);
            },

            // START WIP
            handleGfycatUploadStatus: function (respdata) {
                if (respdata.errorMessage ||
                    respdata.task === "NotFoundo" || !respdata.gfyname) {
                    console.log(`Fail: ${JSON.stringify(respdata)}`);
                    ImageUpload.addUploadMessage("red", null, "Failure :(");
                    return false;
                }
                else if (respdata.task === "encoding") {
                    ImageUpload.addUploadMessage("silver", null, "Encoding...");
                    console.log(`Endpoint reports encoding: ${JSON.stringify(respdata)}`);
                    // endpoint is busy so try again in a few seconds
                    return false;
                }
                else if (respdata.gfyname) {
                    var url = `https://gfycat.com/${respdata.gfyname}`;
                    $("#frm_body").insertAtCaret(url + "\n");
                    ImageUpload.addUploadMessage("green", null, "Success!");
                    console.log(`Endpoint reports success: ${JSON.stringify(respdata)}`);

                    ImageUpload.clearFileData();
                    ImageUpload.updateStatusLabel();
                    setTimeout(function() {
                        // clear our upload status message after a bit
                        ImageUpload.removeUploadMessage();
                    }, 3000);
                    return true;
                } else {
                    console.log(`Some uncaught endpoint error occurred: ${respdata}`);
                }
                return false;
            },

            doGfycatUpload: function(fileObj) {
                ImageUpload.removeUploadMessage();
                // if we use 'fetchUrl' the server will report back a key
                // if we use 'file' then grab a key and push it with our file

                $.ajax({
                    type: "POST",
                    url: ImageUpload.gfycatApiUrl,
                    cache: false,
                    processData: false,
                    contentType: "application/json",
                    data: fileObj.fetchUrl ? JSON.stringify(fileObj) : JSON.stringify({ title: fileObj.file.name })
                }).done(function(data) {
                    var key = data.gfyname;
                    if (fileObj.fetchUrl) {
                        console.log(`Posting URL fetch: ${JSON.stringify(data)}`);
                        ImageUpload.checkGfycatStatus(key);
                    }
                    else if (fileObj.file) {
                        console.log(`Posting new file: ${key} = ${fileObj.file.name}`);
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
                            console.log(fd);
                            ImageUpload.checkGfycatStatus(key);
                        })
                        .fail(function(err) {
                            ImageUpload.handleGfycatUploadStatus(err);
                        });
                    }
                });
            },

            checkGfycatStatus: function (gfycatKey, override) {
                var requestUrl = `${ImageUpload.gfycatStatusUrl}/${gfycatKey}`;
                
                var repeat = setInterval(function() {
                    // verify the upload/fetch - every 3s for 30s
                    $.ajax({ type: "GET", url: requestUrl }).done(function(data) {
                        // stop early if we're successful
                        if(ImageUpload.handleGfycatUploadStatus(data))
                            clearInterval(repeat);
                    });
                }, 3000);

                setTimeout(function() {
                    clearInterval(repeat);
                }, 30000);
            }
            // END WIP
        };

        processPostBoxEvent.addHandler(ImageUpload.insertForm);
    }
});
