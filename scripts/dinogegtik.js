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
            var lines = DinoGegtik.parsePostIntoLines(postBody.innerHTML);

            var comic_div = document.createElement("div");
            comic_div.id = comic_id;
            comic_div.className = "dinogegtik";
            comic_div.style.backgroundImage = "url(" + chrome.extension.getURL("../images/dinogegtik.png") + ")";
            comic_div.style.height = (lines.length <= 3) ? "244px" : "487px";

            postBody.appendChild(comic_div);

            var max = lines.length > DinoGegtik.panels.lengh ? DinoGegtik.panels.length : lines.length;
            for (var i = 0; i < max; i++)
            {
                var panel = document.createElement("div");
                panel.className = "panel";
                panel.style.left = DinoGegtik.panels[i].x + "px";
                panel.style.top = DinoGegtik.panels[i].y + "px";
                panel.style.width = DinoGegtik.panels[i].width + "px";
                panel.style.height = DinoGegtik.panels[i].height + "px";
                panel.innerHTML = lines[i];

                comic_div.appendChild(panel);

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
            }
        }
    },

    parsePostIntoLines: function(html)
    {
		var res = new Array(); 

        var LINK_PLACEHOLDER = "%%link%%";
	
		// Extract all the links, store them in links[] and replace the link with a %%link%% placeholder in the post 
		var links = new Array(); 
		var link_regex = new RegExp(/<a.*? href=(\"|')(.*?)([\n|\r]*?)(\"|').*?>(.*?)([\n|\r]*?)<\/a>/i);
        var m = link_regex.exec(html);
        while (m)
        {
            // save the link, and put a placeholder in
            links.push(m[0]);
            html = html.replace(link_regex, LINK_PLACEHOLDER);
            m = link_regex.exec(html);
        }
	
		// remove the rest of the html from the post
		post = stripHtml(html);

        var link_replace_regex = new RegExp(LINK_PLACEHOLDER, "i");

		// Split paragraphs
		var lines = html.split('\n');
		
		// Get sentences from paragraphs
		for (var i = 0; i < lines.length; i++)
		{
			lines[i] = lines[i].replace('...', '&ellipsis;'); 
	
			var sentences = lines[i].split('.');
			
			for (var j = 0; j < sentences.length; j++)
			{
				if (sentences[j].length)
				{
					var tmp = sentences[j];
					tmp = tmp.replace('&ellipsis;', '...'); 
	
					// replace placeholders with actual links
                    while (tmp.indexOf(LINK_PLACEHOLDER) >= 0)
                    {
                        tmp = tmp.replace(link_replace_regex, links.shift());
                    }
	
					res.push(tmp);
				}
			}
		}

		return res; 
    },

}

if (getSetting("enabled_scripts").contains("dinogegtik"))
{
    processPostEvent.addHandler(DinoGegtik.installComic);
}

