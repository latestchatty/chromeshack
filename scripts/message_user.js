settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("message_user"))
    {
        MessageUser =
        {
            installCss: function()
            {
                var css = "a.message_user { display: inline-block; margin-left: 10px; width: 13px; height: 9px; text-indent: -9999px; ";
                css += "background: transparent url(" + chrome.extension.getURL("images/message.png") + "); }";

                insertStyle(css);
            },

            installLink: function(item, id)
            {
                var message_id = "message_user_" + id;

                if (document.getElementById(message_id) != null)
                    return;
                
                var author = getDescendentByTagAndClassName(item, "span", "author");
                if (!author)
                {
                    console.error("getDescendentByTagAndClassName could not locate span.author");
                    return;
                }

                var username = String(author.getElementsByTagName('a')[0].innerHTML).trim();

                var link = document.createElement("a");
                link.id = message_id;
                link.className = "message_user";
                link.href = "http://www.shacknews.com/msgcenter/new_message.x?to=" + escape(username) + "#interiorbody_container";
                link.title = "Shackmessage " + username;
                link.appendChild(document.createTextNode("SM"));
                link.addEventListener("click", MessageUser.showPopup, false);
                
                // add link
                author.appendChild(link);
            },

            showPopup: function(event)
            {
                // only left click
                if (event.button == 0)
                {
                    event.preventDefault();

                    var url = event.target.href;

                    var width = 900;
                    var height = 650;
                    var left = window.screenX + Math.floor((window.outerWidth - width) / 2);
                    var top = window.screenY + Math.floor((window.outerHeight - height) / 2);

                    chrome.extension.sendRequest({name: "launchPopup", "url": url, "left": left, "top": top, "width": width, "height": height });
                }
            }

        }

        MessageUser.installCss();
        processPostEvent.addHandler(MessageUser.installLink);
    }
});
