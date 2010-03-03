var tags = [];
var lol_enabled;

function loadOptions()
{
    tags = getOption("lol_tags", [
            {name: "lol", color: "#f80"},
            {name: "inf", color: "#09c"},
            {name: "unf", color: "#f00"},
            {name: "tag", color: "#7b2"},
            {name: "wtf", color: "#c000c0"}
        ]);

    lol_enabled = getOption("lol_enabled", true); 

    showLolTags();
}

function getOption(name, default_value)
{
    var value = localStorage[name];
    if (value)
        return JSON.parse(value);
    return default_value;
}

function saveOption(name, value)
{
    localStorage[name] = JSON.stringify(value);
}

function showLolTags()
{
    // generate in a temporary div so we can pull out the innerHTML later
    var fake_div = document.createElement("div");
    for (var i = 0; i < tags.length; i++)
    {
        var tag_row = document.createElement("div");
        tag_row.innerHTML = "Tag: <input id='tag_name_" + i + "' value='" + tags[i].name + "'/> Color: <input id='tag_color_" + i + "' value='" + tags[i].color + "'/> <a href='#' onclick='removeTag(" + i + "); return false'>(remove)</a>";
        fake_div.appendChild(tag_row);
    }

    // update the div that is displayed
    var lol_div = document.getElementById("lol_tags");
    lol_div.innerHTML = fake_div.innerHTML;

    lol_check = document.getElementById("lol_enabled");
    lol_check.checked = lol_enabled;
}

function removeTag(index)
{
    // save current values before redisplaying
    writeTagValues();
    tags.splice(index, 1);
    showLolTags();
}

function addTag()
{
    // save current values before redisplaying
    writeTagValues();
    tags[tags.length] = {name: "", color: ""};
    showLolTags();
}

function writeTagValues()
{
    var new_tags = [];
    var lol_div = document.getElementById("lol_tags");
    for (var i = 0; i < lol_div.children.length; i++)
    {
        var tag_name = document.getElementById("tag_name_" + i).value;
        var tag_color = document.getElementById("tag_color_" + i).value;
        new_tags[i] = {name: tag_name, color: tag_color};
    }
    tags = new_tags;

    lol_check = document.getElementById("lol_enabled");
    lol_enabled = lol_check.checked;
}

function saveOptions()
{
    writeTagValues();
    saveOption("lol_tags", tags);
    saveOption("lol_enabled", lol_enabled);
    
    // Update status to let the user know options were saved
    var status = document.getElementById("status");
    status.innerHtml = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 750);
}
