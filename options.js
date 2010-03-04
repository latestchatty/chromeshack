var tags = [];

function loadOptions()
{
    tags = getOption("lol_tags");
    showLolTags();
    showEnabledScripts();
}

function getOption(name)
{
    var value = localStorage[name];
    if (value)
        return JSON.parse(value);
    return DefaultSettings[name];
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
}

function showEnabledScripts()
{
    var enabled = getOption("enabled_scripts");

    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check")
        {
            var found = false;
            for (var j = 0; j < enabled.length; j++)
            {
                if (enabled[j] == inputs[i].id)
                {
                    found = true;
                    break;
                }
            }
            inputs[i].checked = found;
        }
    }
}

function getEnabledScripts()
{
    var enabled = [];
    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check")
        {
            if (inputs[i].checked)
            {
                enabled.push(inputs[i].id); 
            }
        }
    }

    return enabled;
}

function getDescendentByTagAndClassName(parent, tag, class) 
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++) 
    {
        if (descendents[i].className.indexOf(class) == 0) 
            return descendents[i];
    }
}

function saveOptions()
{
    writeTagValues();
    saveOption("lol_tags", tags);

    saveOption("enabled_scripts", getEnabledScripts());
    
    // Update status to let the user know options were saved
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 1000);
}
