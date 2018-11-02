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
                            <div id="uploadFields">
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

                                    <div class="uploadInputs">
                                        <div class="urlBox">
                                            <input type="text" id="urlUploadInput" class="urlBox hidden" placeholder="Or use an image URL...">
                                        </div>
                                        <div class="uploadButton">
                                            <button id="urlUploadButton" class="disabled">Upload</button>
                                            <button id="cancelUploadButton">X</button>
                                        </div>
                                        <div id="uploadStatus">
                                            <span id="uploadStatusLabel"></span>
                                        </div>
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
                    $("#uploadFields").toggleClass("visible", ImageUpload.uploadShown);
                    var text = ImageUpload.uploadShown ? "Hide Image Upload" : "Show Image Upload";
                    $(".showImageUploadLink").html(text);

                    // scroll to our elements contextually
                    if ($("#uploadFields").hasClass("visible"))
                        scrollToElement($(this)[0]);
                    else
                        scrollToElement($("#frm_body")[0]);

                    return false;
                });

                $("#fileChooserLink").click(function() {
                    $("#fileUploadInput").click();
                    scrollToElement($("#uploadDropArea")[0]);
                });

                // debounce on keyup (2s) for url text input
                var debouncedKeyup = debounce(function(val) {
                    ImageUpload.loadFileUrl(val);
                }, 2000);
                $("#urlUploadInput").keyup(function() {
                    debouncedKeyup(this.value);
                });

                // toggle url entry field based on hoster
                $("#uploadChatty").click(function() {
                    $("#urlUploadInput").addClass('hidden');
                    // urls are not supported on Chattypics
                    ImageUpload.clearFileData();
                });
                $("#uploadGfycat, #uploadImgur").click(function() {
                    $("#urlUploadInput").removeClass('hidden');
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
                    // hard reset our input form elements
                    ImageUpload.clearFileData(true);
                });

                // attach event for upload button
                $("#urlUploadButton").click(function(e) {
                    e.preventDefault();
                    if (ImageUpload.formFileUrl.length > 5)
                        ImageUpload.doUrlUpload(ImageUpload.formFileUrl);
                    else if (ImageUpload.formFiles != null) {
                        ImageUpload.doFileUpload(ImageUpload.formFiles);
                    }
                    // focus our url target
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
                // move our file data into an abstracted variable
                ImageUpload.formFiles = new FormData();
                if (files.length > 0) {
                    for (var i=0; i < files.length; i++) {
                        console.log(`Loading file data: ${files[i].name}: ${files[i]}`);
                        ImageUpload.formFiles.append("image", files[i]);
                    }

                    ImageUpload.updateStatusLabel(files);
                    $("#urlUploadButton").removeClass("disabled");
                    $("#cancelUploadButton").css("visibility", "visible");
                    return true;
                }
                return false;
            },

            loadFileUrl: function(string) {
                if (string.length > 5 && string.length < 2048 && ImageUpload.isValidUrl(string)) {
                    ImageUpload.formFileUrl = string;
                    $("#urlUploadButton").removeClass("disabled");
                    $("#cancelUploadButton").css("visibility", "visible");
                    return true;
                } else if (string.length < 5 && ImageUpload.formFiles == null) {
                    ImageUpload.clearFileData();
                    return true;
                }
                return false;
            },

            clearFileData: function(hard) {
                if (hard) {
                    ImageUpload.formFiles = null;
                    ImageUpload.updateStatusLabel();
                    $("#uploadDropArea").removeClass("dragOver");
                }

                if (ImageUpload.formFiles == null) {
                    $("#urlUploadButton").addClass("disabled");
                    $("#cancelUploadButton").css("visibility", "hidden");
                }

                ImageUpload.formFileUrl = "";
                $("#urlUploadInput").val("");
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
                var url_pattern = /^(?:http:\/\/|https:\/\/)*?([\d\w\-\.]+){1,}\/[\w\d\-\_\&\#\$\^\?\.\=\,\/\\]+\.(gif|jpg|jpeg|png)$/i;

                if(ip_pattern.test(string) || url_pattern.test(string)) { return true; }
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
                        // Chattypics prefers a particular format
                        fd.append("userfile[]", file[1]);
                    }
                    ImageUpload.doChattyPicsUpload(fd);
                } else if (isImgur) {
                    ImageUpload.doImgurUpload(filesList);
                } else if (isGfycat) {
                    ImageUpload.doGfycatUpload(filesList);
                }

                // var fd = new FormData();
                // fd.append("type", "file");

                // if(isChattyPics) {
                //     fd.append("userfile[]", file);
                //     ImageUpload.doChattyPicsUpload(fd);
                // } else if (isImgur) {
                //     fd.append("image", file);
                //     ImageUpload.doImgurUpload(fd);
                // } else if (isGfycat) {
                //     fd.append("image", file);
                //     ImageUpload.doGfycatUpload(fd);
                // }
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

            addUploadMessage: function(color, text, detailMsg) {
                var msg = $("<h3></h3>", { id : "uploadMsg", style: "color: "+color});
                msg.text(text);
                $(".uploadStatusLabel").append(msg);
                if(detailMsg != undefined && detailMsg.length > 0) {
                    var uploadMsgDetail = $("<span>", { id : "uploadMsgDetail"});
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
