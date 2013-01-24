settingsLoadedEvent.addHandler(function()
{
    processPostBoxEvent.addHandler(fixCommentFormSize);
    if (getSetting("enabled_scripts").contains("image_upload"))
    {

        ImageUpload =
        {
            imgurApiKey :  "48a14aa108f519f249aacc12d08caac3",

            imgurApiBaseUrl: "https://api.imgur.com/3/",

            imgurApiImageEndpoint: "upload.json",

            imgurClientIdHeader: "Authorization",

            imgurClientId: "Client-ID c045579f61fc802",

            chattyPicsUrl : "http://chattypics.com/upload.php",

            insertForm: function() {
                // var imgurl = chrome.extension.getURL( "../images/image_upload.png");
                // var image = $("<img/>", { src : imgurl });
                /**
                var table = $('#shacktags_legend_table').find('tbody:last');

                var row = $("<tr/>");
                var cell = $("<td/>", { colspan : "4"});
                var udiv = $('<div/>', { id : "imageUploader", align : "center"});
                var sdiv = $('<div/>', { id : "sidebar-list", align : "center"});
                var uploadBtn = $("<button />", { id : "imageUploadButton"});
                uploadBtn.text("Upload / Add Image");
                uploadBtn.click( function() {
                    ImageUpload.showImageUploadForm(this);
                    return false;
                });
                var cancelBtn = $("<button />", { id : "cancelUploadButton"});
                cancelBtn.css("display", "none");
                cancelBtn.text("Cancel");
                cancelBtn.click( function() {
                    ImageUpload.hideImageUploadForm(this);
                    return false;
                });
                udiv.append(cancelBtn);
                udiv.append(uploadBtn);
                cell.append(udiv);
                row.append(cell);
                table.append(row);
                 **/
                ImageUpload.showImageUploadForm(this);
            },

            showImageUploadForm: function(obj) {
                $("#imageUploadButton").toggle();
                $("#cancelUploadButton").toggle();
                //$(".newcommentform").removeClass("newcommentformfix");
                $(".newcommentform").addClass("newcommentformexpand");
                $(".inlinereply").addClass("newcommentformexpand");
                //$(".newcommentform").css("height", "390px");
                //$(".inlinereply").css("height", "390px");
                //var legendtable = $('#shacktags_legend_table')
                var uploadtable = $("<table border='1' cellpadding='5px'><tr><td id='uploadCell1' nowrap='nowrap'/><td id='uploadCell2'/><td id='uploadCell3'/><td id='uploadCell4'/></tr></table>");
                var uploadDiv = $("<div />", { id : "uploadDiv"});
                $("#postform").append(uploadDiv);
                uploadDiv.append(uploadtable);
                var chattyUploadLabel = $("<label>", { class : 'imageUploadLabel'});
                var chattyUpload= $("<input>", {type: 'radio', name: 'imgUploadSite', id : 'uploadChatty'});
                chattyUpload.click(function() {
                    $("#uploadCell4").css('visibility', 'hidden');
                })
                chattyUploadLabel.append(chattyUpload);
                chattyUploadLabel.append($("<span>ChattyPics</span>"));
                var imgurUploadLabel = $("<label>", { class : 'imageUploadLabel'});
                var imgurUpload= $("<input>", {type: 'radio', name: 'imgUploadSite', id : 'uploadImgur', checked : 'true'});
                imgurUpload.click(function() {
                    $("#uploadCell4").css('visibility', 'visible');
                });
                imgurUploadLabel.append(imgurUpload);
                imgurUploadLabel.append($("<span>Imgur</span>"));
                var urlUploadInput = $("<input>", { type : "text", id : "urlUploadInput", defaultValue : 'Image URL'});
                var urlUploadButton = $("<button></button>", { id : 'urlUploadButton'});
                urlUploadButton.text("Upload URL");
                urlUploadButton.click(function() {
                    ImageUpload.doUrlUpload(this);
                    return false;
                });
                var uploadCell1 = $("#uploadCell1");
                var uploadCell2 = $("#uploadCell2");
                var uploadCell3 = $("#uploadCell3");
                var uploadCell4 = $("#uploadCell4");
                uploadCell1.append(imgurUploadLabel);
                uploadCell1.append(chattyUploadLabel);
                var filedroparea = $("<div id='filedroparea'>Drag An Image</div>")
                uploadCell2.append(filedroparea);
                filedroparea.dropArea();

                filedroparea.on('drop', function(e){
                    e.preventDefault();
                    e = e.originalEvent;
                    var files = e.dataTransfer.files;
                    for(var i=0; i<files.length; i++) {
                        if (/image/.test(files[i].type)) {
                            ImageUpload.doFileUpload(files[i]);
                        }
                    }
                });

                var fileinput = $("<input>", { type : 'file', id : 'fileUploadInput', accept: 'image/*', multiple : 'multiple' });
                fileinput.change(function (e) {
                    var files = e.target.files;
                    for (var i=0; i < files.length; i++) {
                        ImageUpload.doFileUpload(files[i]);
                    }
                })
                uploadCell3.append(" or ");
                uploadCell3.append(fileinput);
                uploadCell4.append(" or ");
                uploadCell4.append(urlUploadInput);
                uploadCell4.append(urlUploadButton);

            },

            hideImageUploadForm: function (obj) {
                $("#imageUploadButton").toggle();
                $("#cancelUploadButton").toggle();
                $("#uploadDiv").remove();
                $(".newcommentform").removeClass("newcommentformexpand");
                $(".newcommentform").addClass("newcommentformfix");

            },

            doUrlUpload: function (obj) {
                var url = $("#urlUploadInput").val();
                if(url.length == 0) {
                    ImageUpload.removeUploadMessage();
                    alert("You must input a url to upload!");
                    return;
                }

                var fd = new FormData();
                fd.append("type", "url");
                fd.append("image", url);
                ImageUpload.doImgurUpload(fd);
            },

            doFileUpload: function (file) {
                var isChattyPics  = $("#uploadChatty").is(':checked');

                var fd = new FormData();
                fd.append("type", "file");

                if(isChattyPics) {
                    fd.append("userfile[]", file);
                    ImageUpload.doChattyPicsUpload(fd);
                } else {
                    fd.append("image", file);
                    ImageUpload.doImgurUpload(fd);
                }
            },

            doImgurUpload: function (formdata) {
                ImageUpload.removeUploadMessage();
                formdata.append("key", ImageUpload.imgurApiKey);
                var apiurl = ImageUpload.imgurApiBaseUrl + ImageUpload.imgurApiImageEndpoint;
                ImageUpload.addUploadMessage("silver", "Uploading to Imgur...");
                $.ajax( {
                    type: "POST",
                    url : apiurl,
                    cache: false,
                    contentType: false,
                    processData: false,
                    enctype : 'multipart/form-data',
                    dataType: 'json',
                    beforeSend : ImageUpload.setImgurHeader,
                    data : formdata
                })
                    .success(function(data) {
                        ImageUpload.handleUploadSuccess(data);
                    })
                    .error(function(data) {
                        ImageUpload.handleUploadFailure(data);
                    })
                    .complete(function(data) {
                        return false;
                    });
            },

            doChattyPicsUpload: function (formdata) {
                ImageUpload.removeUploadMessage();
                ImageUpload.addUploadMessage("silver", "Uploading to ChattyPics...");
                $.ajax( {
                    type: "POST",
                    url : ImageUpload.chattyPicsUrl,
                    cache: false,
                    processData: false,
                    contentType: false,
                    enctype : 'multipart/form-data',
                    data : formdata
                })
                    .success(function(data) {
                        ImageUpload.handleChattyUploadSuccess(data);
                    })
                    .error(function(data) {
                        ImageUpload.handleUploadFailure(data);
                    })
                    .complete(function(data) {
                        return false;
                    });
            },

            handleUploadSuccess: function(respdata) {
                var link = respdata.data.link;
                //ImageUpload.insertTextAtCursor("frm_body", link);
                $("#frm_body").insertAtCaret(link + "\n");
                ImageUpload.hideImageUploadForm(this);
                ImageUpload.showImageUploadForm(this);
                ImageUpload.addUploadMessage("green", "Success!");
            },

            handleChattyUploadSuccess : function(data) {
                var response = $(data);
                var link11 = response.find("#link11");
                var link = link11[0];
                var url = $(link).val();
                //ImageUpload.insertTextAtCursor("frm_body", url);
                $("#frm_body").insertAtCaret(url + "\n");
                ImageUpload.hideImageUploadForm(this);
                ImageUpload.showImageUploadForm(this);
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
                $("#uploadDiv").append(msg);
                if(detailMsg != undefined && detailMsg.length > 0) {
                    var uploadMsgDetail = $("<span>", { id : "uploadMsgDetail"});
                    uploadMsgDetail.text(detailMsg);
                    $("#uploadDiv").append(uploadMsgDetail);
                }
            },

            removeUploadMessage: function() {
                $("#uploadMsg").remove();
                $("#uploadMsgDetail").remove();
            },

            setImgurHeader: function (xhr) {
                xhr.setRequestHeader(ImageUpload.imgurClientIdHeader, ImageUpload.imgurClientId);
            }

        }
        processPostBoxEvent.addHandler(ImageUpload.insertForm);
    }

});

function fixCommentFormSize() {
    $(".newcommentform").addClass("newcommentformfix");
}
