settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("dinogegtik"))
    {
        DinoGegtik =
        {
            panels: [
                {x: 5, y: 5, width: 234, height: 92},
                {x: 248, y: 5, width: 121, height: 92},
                {x: 517, y: 5, width: 214, height: 150},
                {x: 4, y: 246, width: 186, height: 67},
                {x: 198, y: 246, width: 291, height: 66},
                {x: 496, y: 246, width: 234, height: 56},
            ],

            installComic: function(item, id)
            {
                var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");

                // we have a fullpost, and its className contains gegtik's user id
                if (fullpost && fullpost.className.indexOf("fpauthor_174527") >= 0)
                {
                    var comic_id = "dinogegtik_" + id;

                    // comic is already here!
                    if (document.getElementById(comic_id))
                        return;

                    var postBody = getDescendentByTagAndClassName(fullpost, "div", "postbody");
                    var lines = SentenceParser.parseIntoLines(postBody.innerHTML);

                    var comic_div = document.createElement("div");
                    comic_div.id = comic_id;
                    comic_div.className = "dinogegtik";
                    comic_div.style.backgroundImage = `url("${browser.runtime.getURL("../images/dinogegtik.png")}")`;
                    comic_div.style.height = (lines.length <= 3) ? "244px" : "487px";

                    postBody.appendChild(comic_div);

                    var max = lines.length > DinoGegtik.panels.length ? DinoGegtik.panels.length : lines.length;
                    for (var i = 0; i < max; i++)
                    {
                        var panel = document.createElement("div");
                        panel.className = "panel";
                        panel.style.left = DinoGegtik.panels[i].x + "px";
                        panel.style.top = DinoGegtik.panels[i].y + "px";
                        panel.style.width = DinoGegtik.panels[i].width + "px";
                        panel.style.height = DinoGegtik.panels[i].height + "px";
                        safeInnerHTML(lines[i], panel);

                        comic_div.appendChild(panel);

                        DinoGegtik.resizePanelText(panel);
                    }
                }
            },

            resizePanelText: function(panel)
            {
                // the div isn't actually visible yet, so the scroll/client height properties will just be 0
                // just wait a bit to resize the text
                window.setTimeout(function()
                {
                    var size = 12;
                    while (panel.scrollHeight > panel.clientHeight && size > 7)
                    {
                        panel.style.fontSize = "" + size + "px";
                        size--;
                    }
                }, 200);
            },
        }

        processPostEvent.addHandler(DinoGegtik.installComic);
    }
});
