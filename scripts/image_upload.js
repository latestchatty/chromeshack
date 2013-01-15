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
                $(".newcommentform").removeClass("newcommentformfix");
                $(".newcommentform").addClass("newcommentformexpand");
                var legendtable = $('#shacktags_legend_table')
                var uploadDiv = $("<div />", { id : "uploadDiv"});
                var fileUploadInput = $("<input>", { type : "file", id : "fileUploadInput", accept : "image/*"});
                var urlUploadInput = $("<input>", { type : "text", id : "urlUploadInput"});
                var fileUploadButton = $("<button></button>", { id : 'fileUploadButton'});
                fileUploadButton.text("Upload File");
                fileUploadButton.click(function() {
                    ImageUpload.doFileUpload(this);
                    return false;
                });
                var urlUploadButton = $("<button></button>", { id : 'fileUploadButton'});
                urlUploadButton.text("Upload URL");
                urlUploadButton.click(function() {
                    ImageUpload.doUrlUpload(this);
                    return false;
                });
                uploadDiv.append($("<div class='uploadLabel'>File Upload:</div>"));
                uploadDiv.append(fileUploadInput);
                uploadDiv.append(fileUploadButton);
                uploadDiv.append($("<br/><br/><div class='uploadLabel'>URL Upload:</div>"));
                uploadDiv.append(urlUploadInput);
                uploadDiv.append(urlUploadButton);
                uploadDiv.insertAfter(legendtable);
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

            doFileUpload: function (obj) {
                var fileinput = $("#fileUploadInput")[0];
                if (fileinput.files.length == 0) {
                    ImageUpload.removeUploadMessage();
                    alert("You must select a image to upload!");
                    return;
                }
                var file = fileinput.files[0];
                var fd = new FormData();
                fd.append("type", "file");
                fd.append("image", file);
                ImageUpload.doImgurUpload(fd);
            },

            doImgurUpload: function (formdata) {
                ImageUpload.removeUploadMessage();
                formdata.append("key", ImageUpload.imgurApiKey);
                var apiurl = ImageUpload.imgurApiBaseUrl + ImageUpload.imgurApiImageEndpoint;
                ImageUpload.addUploadMessage("silver", "Uploading...");
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

            handleUploadSuccess: function(respdata) {
                var link = respdata.data.link;
                ImageUpload.insertTextAtCursor("frm_body", link);
                ImageUpload.hideImageUploadForm(this);
                ImageUpload.showImageUploadForm(this);
                ImageUpload.addUploadMessage("green", "Success!");
            },

            handleUploadFailure: function(respdata) {
                ImageUpload.removeUploadMessage();
                var responseText = $.parseJSON(respdata.responseText);
                var error = "";
                try {
                    error = responseText.data.error;
                } catch (e) {}
                if(error.length > 0) {
                    ImageUpload.addUploadMessage("red", "Failure :(", error);
                } else {
                    ImageUpload.addUploadMessage("red", "Failure :(");
                }
            },

            addUploadMessage: function(color, text, detailMsg) {
                var msg = $("<h2></h2>", { id : "uploadMsg", style: "color: "+color});
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
            },

            // Stolen from http://www.scottklarr.com/topic/425/how-to-insert-text-into-a-textarea-where-the-cursor-is/

            insertTextAtCursor: function (areaId,text) {
                var txtarea = document.getElementById(areaId);
                var scrollPos = txtarea.scrollTop;
                var strPos = 0;
                var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
                    "ff" : (document.selection ? "ie" : false ) );
                if (br == "ie") {
                    txtarea.focus();
                    var range = document.selection.createRange();
                    range.moveStart ('character', -txtarea.value.length);
                    strPos = range.text.length;
                }
                else if (br == "ff") strPos = txtarea.selectionStart;

                var front = (txtarea.value).substring(0,strPos);
                var back = (txtarea.value).substring(strPos,txtarea.value.length);
                txtarea.value=front+text+back;
                strPos = strPos + text.length;
                if (br == "ie") {
                    txtarea.focus();
                    var range = document.selection.createRange();
                    range.moveStart ('character', -txtarea.value.length);
                    range.moveStart ('character', strPos);
                    range.moveEnd ('character', 0);
                    range.select();
                }
                else if (br == "ff") {
                    txtarea.selectionStart = strPos;
                    txtarea.selectionEnd = strPos;
                    txtarea.focus();
                }
                txtarea.scrollTop = scrollPos;
            }

        }
        processPostBoxEvent.addHandler(ImageUpload.insertForm);
    }

});

function fixCommentFormSize() {
    $(".newcommentform").addClass("newcommentformfix");
}
