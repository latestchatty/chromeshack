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
        
        // generate all the buttons
        lol_div.appendChild(LOL.createButton("lol", id));
        lol_div.appendChild(LOL.createButton("inf", id));
        lol_div.appendChild(LOL.createButton("unf", id));
        lol_div.appendChild(LOL.createButton("tag", id));
        lol_div.appendChild(LOL.createButton("wtf", id));
        lol_div.appendChild(LOL.createButton("tth", id));

        // add them in
        author.appendChild(lol_div);
    },

    createButton: function(tag, id)
    {
        var button = document.createElement("a");
        button.href = "#";
        button.id = tag + id;
        button.className = tag + "_button";
        button.appendChild(document.createTextNode(tag));

        button.addEventListener("click", function()
        {
            LOL.lolThread(tag, id);
            return false;
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

parsePostEvent.addHandler(LOL.installButtons);
