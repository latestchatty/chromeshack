LOL =
{
    installButtons: function(item, id)
    {
        var lol_div_id = 'lol_' + id;
        
        // buttons already installed here
        if (document.getElementById(lol_div_id) != null)
            return;

        var author = getDescendentByTagAndClassName(item, "span", "author");
        if (!author)
        {
            console.error("getDescendentByTagAndClassName could not locate span.author");
            return;
        }

        var lol_div = document.createElement("div");
        lol_div.id = lol_div_id;
        lol_div.className = "lol";
        
        // generate all the buttons from settings
        var tags = getSetting("lol_tags");
        for (var i = 0; i < tags.length; i++)
        {
            lol_div.appendChild(LOL.createButton(tags[i].name, id, tags[i].color));
        }

        // add them in
        author.appendChild(lol_div);
    },

    createButton: function(tag, id, color)
    {
        var button = document.createElement("a");
        button.href = "#";
        button.className = "lol_button";
        button.style.color = color;
        button.appendChild(document.createTextNode(tag));

        button.addEventListener("click", function(e)
        {
            LOL.lolThread(tag, id);
            e.preventDefault();
        });

        var span = document.createElement("span");
        span.appendChild(document.createTextNode("["));
        span.appendChild(button);
        span.appendChild(document.createTextNode("]"));

        return span;
    },

    lolThread: function(tag, id)
    {
        // this is where the loling happings!
        console.log(tag + "'ing post " + id);
    }

}

if (getSetting('lol_enabled'))
{
    processPostEvent.addHandler(LOL.installButtons);
}
