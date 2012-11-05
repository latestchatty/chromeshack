function loadOptions()
{
    showLolTags(getOption("lol_tags"), getOption("lol_show_counts"), getOption("lol_ugh_threshold"));
    showPostPreviewLocation(getOption("post_preview_location"));
    showCategoryBanners(getOption("category_banners_visible"));
    showHighlightUsers(getOption("highlight_users"));
    showVideoLoaderHD(getOption("video_loader_hd"));
    showExpirationWatcherStyle(getOption("expiration_watcher_style"));
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

function showVideoLoaderHD(enabled)
{
    var hd = document.getElementById("video_loader_hd");
    hd.checked = enabled;
}

function getVideoLoaderHD()
{
    var hd = document.getElementById("video_loader_hd");
    return hd.checked;
}

function showHighlightUsers(groups)
{
    for (var i = 0; i < groups.length; i++)
    {
        var group = groups[i];
        addHighlightGroup(group);
    }
}

function addHighlightGroup(group)
{
    if (!group)
        group = {name: "", checked: true, css: "", users: [] };

    var settings = document.getElementById("highlight_groups");
    var div = document.createElement("div");
    div.className = "group";
    var check = document.createElement("input");
    check.type = "checkbox";
    check.className = "group_enabled";
    check.checked = group.enabled;
    div.appendChild(check);

    var name_box = document.createElement("input");
    name_box.type = "text";
    name_box.className = "group_name";
    name_box.value = group.name;
    div.appendChild(name_box);

    if (group.built_in)
    {
        name_box.className += " built_in";
        name_box.readOnly = true;
    }
    else
    {
        var users = document.createElement("input");
        users.className = "group_users";
        users.value = JSON.stringify(group.users);
        div.appendChild(users);

        var remove = document.createElement("a");
        remove.href = "#";
        remove.addEventListener('click', function () { settings.removeChild(div); });
        remove.appendChild(document.createTextNode("(remove)"));
        div.appendChild(remove);
    }

    div.appendChild(document.createElement("br"));

    css = document.createElement("textarea");
    css.className = "group_css";
    css.rows = "2";
    css.cols = "25";
    css.value = group.css;
    div.appendChild(css);

    settings.appendChild(div);
}

function getHighlightGroups()
{
    var groups = [];

    var settings = document.getElementById("highlight_groups");
    var group_divs = settings.getElementsByTagName("div");
    for (var i = 0; i < group_divs.length; i++)
    {
        var group = {};
        var input_name = getDescendentByTagAndClassName(group_divs[i], "input", "group_name");
        group.name = input_name.value;
        group.built_in = input_name.readOnly;
        group.enabled = getDescendentByTagAndClassName(group_divs[i], "input", "group_enabled").checked;
        group.css = getDescendentByTagAndClassName(group_divs[i], "textarea", "group_css").value;
        if (!group.built_in)
        {
            group.users = JSON.parse(getDescendentByTagAndClassName(group_divs[i], "input", "group_users").value);
        }
        groups.push(group);
    }

    return groups
}

function showCategoryBanners(banners)
{
    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "category_banner")
        {
            var found = false;
            for (var j = 0; j < banners.length; j++)
            {
                if (banners[j] == inputs[i].id)
                {
                    found = true;
                    break;
                }
            }
            inputs[i].checked = found;
        }
    }
}

function getCategoryBanners()
{
    var banners = [];

    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "category_banner")
        {
            if (inputs[i].checked)
            {
                banners.push(inputs[i].id); 
            }
        }
    }

    return banners;
}

function showPostPreviewLocation(position)
{
    var left = document.getElementById("post_preview_left");
    var right = document.getElementById("post_preview_right");
    left.checked = (position == "Left");
    right.checked = (position == "Right");
}

function getPostPreviewLocation()
{
    var left = document.getElementById("post_preview_left");
    if (left.checked)
        return "Left";
    return "Right";
}

function showExpirationWatcherStyle(style)
{
	document.getElementById('expiration_watcher_bar').checked = (style === 'Bar');
	document.getElementById('expiration_watcher_doom').checked = (style === 'Doom');
}

function getExpirationWatcherStyle()
{
	var bar = document.getElementById('expiration_watcher_bar'); 
	if (bar.checked)
	{
		return 'Bar';
	}
	else
	{
		return 'Doom';
	}
}

function showLolTags(tags, show_counts, ugh_threshold)
{
    // Set the selected item
    lol_show_counts = document.getElementById("lol_show_counts");
    for (var i = 0; i < lol_show_counts.options.length; i++)
    {
        if (lol_show_counts.options[i].value == show_counts)
        {
            lol_show_counts.options[i].selected = true;
            break;
        }
    }

    lol_ugh_threshold = document.getElementById('lol_ugh_threshold');
    for (var i = 0; i < lol_ugh_threshold.options.length; i++)
    {
        if (lol_ugh_threshold.options[i].value == ugh_threshold)
        {
            lol_ugh_threshold.options[i].selected = true;
            break;
        }
    }

    var lol_div = document.getElementById("lol_tags");
    lol_div.innerHTML = ""; // clear child nodes

    for (var i = 0; i < tags.length; i++)
    {
        var tag_row = document.createElement("div");
        tag_row.innerHTML = "Tag: <input class='name' value='" + tags[i].name + "'/> Color: <input class='color' value='" + tags[i].color + "'/>";

        var remove_link = document.createElement("a");
        remove_link.href = "#";
        remove_link.className = "remove";
        remove_link.appendChild(document.createTextNode(" (remove)"));
        remove_link.addEventListener('click', function() { lol_div.removeChild(this.parentNode)});
        tag_row.appendChild(remove_link);
        
        lol_div.appendChild(tag_row);
    }
}

function removeTag(node)
{
    var tag_row = node.parentNode;
    tag_row.parentNode.removeChild(tag_row);
}

function addTag()
{
    var tag_row = document.createElement("div");
    tag_row.innerHTML = "Tag: <input class='name' value=''/> Color: <input class='color' value=''/> <a href='#' onclick='removeTag(this); return false'>(remove)</a>";

    var lol_div = document.getElementById("lol_tags");
    lol_div.appendChild(tag_row);
}

function getLolTagValues()
{
    var tags = [];
    var lol_div = document.getElementById("lol_tags");
    for (var i = 0; i < lol_div.children.length; i++)
    {
        var tag_name = getDescendentByTagAndClassName(lol_div.children[i], "input", "name").value;
        var tag_color = getDescendentByTagAndClassName(lol_div.children[i], "input", "color").value;
        tags[i] = {name: tag_name, color: tag_color};
    }
    return tags;
}

function getLolShowCounts()
{
    return document.getElementById("lol_show_counts").value;
}

function getLolUghThreshhold()
{
    return document.getElementById('lol_ugh_threshold').value;
}

function showEnabledScripts()
{
    var enabled = getOption("enabled_scripts");

    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++)
    {
        if (inputs[i].type == "checkbox" && inputs[i].className == "script_check")
        {
            inputs[i].onclick = toggleSettingsVisible;
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
            var settings_div = document.getElementById(inputs[i].id + "_settings");
            if (settings_div)
            {
                settings_div.style.display = found ? "block" : "none";
            }
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

function toggleSettingsVisible()
{
    var settings_div = document.getElementById(this.id + "_settings");
    if (settings_div)
    {
        settings_div.style.display = this.checked ? "block" : "none";
    }
}


function getDescendentByTagAndClassName(parent, tag, class_name) 
{
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++) 
    {
        if (descendents[i].className.indexOf(class_name) == 0) 
            return descendents[i];
    }
}

function saveOptions()
{
    try
    {
        saveOption("lol_tags", getLolTagValues());
        saveOption("lol_show_counts", getLolShowCounts());
        saveOption("lol_ugh_threshold", getLolUghThreshhold());
        saveOption("post_preview_location", getPostPreviewLocation());
        saveOption("category_banners_visible", getCategoryBanners());
        saveOption("enabled_scripts", getEnabledScripts());
        saveOption("highlight_users", getHighlightGroups());
        saveOption("video_loader_hd", getVideoLoaderHD());
        saveOption("expiration_watcher_style", getExpirationWatcherStyle()); 
    }
    catch (err)
    {
        alert("There was an error while saving your settings:\n" + err); 
        return;
    }
    
    // Update status to let the user know options were saved
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    loadOptions();
    document.getElementById('add_tag').addEventListener('click', addTag);
    document.getElementById('save_options').addEventListener('click', saveOptions);
    document.getElementById('load_options').addEventListener('click', loadOptions);
    document.getElementById('add_highlight_group').addEventListener('click', addHighlightGroup);
});
