settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("comment_tags"))
    {
        CommentTags =
        {

            installCommentTags: function()
            {
                var postform = document.getElementById("postform");
                if (postform)
                {
                    var comment_tags = document.createElement("div");
                    comment_tags.id = "shack_comment_tags";
                    comment_tags.appendChild(document.createElement("p")).innerHTML = "Comment Tags:";
                    var table = comment_tags.appendChild(document.createElement("table"));
                    table.cellPadding = 2;
                    table.border = 0;
                    table.cellSpacing = 0;

                    var row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "red", "r{", "}r", "jt_red");
                    CommentTags.addTag(row, "italics", "/[", "]/", "jt_italics");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "green", "g{", "}g", "jt_green");
                    CommentTags.addTag(row, "bold", "b[", "]b", "jt_bold");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "blue", "b{", "}b", "jt_blue");
                    CommentTags.addTag(row, "quote", "q[", "]q", "jt_quote");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "yellow", "y{", "}y", "jt_yellow");
                    CommentTags.addTag(row, "sample", "s[", "]s", "jt_sample");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "olive", "e[", "]e", "jt_olive");
                    CommentTags.addTag(row, "underline", "_[", "]_", "jt_underline");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "limegreen", "l[", "]l", "jt_lime");
                    CommentTags.addTag(row, "strike", "-[", "]-", "jt_strike");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "orange", "n[", "]n", "jt_orange");
                    CommentTags.addTag(row, "spoiler", "o[", "]o", "jt_spoiler", "return doSpoiler(event);");

                    row = table.appendChild(document.createElement("tr"));
                    CommentTags.addTag(row, "multisync", "p[", "]p", "jt_pink");
                    CommentTags.addTag(row, "code", "/{{", "}}/", "jt_code");

                    postform.parentNode.insertBefore(comment_tags, postform.nextSibling);
                }
            },

            addTag: function(row, name, opening_tag, closing_tag, class, click)
            {
                var name_td = row.appendChild(document.createElement("td"));
                name_td.className = class;
                name_td.appendChild(document.createTextNode(name));
                if (click && click.length > 0)
                    name_td.setAttribute("onclick", click);

                var code_td = row.appendChild(document.createElement("td"));
                var button = code_td.appendChild(document.createElement("a"));
                button.appendChild(document.createTextNode(opening_tag + " ... " + closing_tag));
                button.href = "#";
                button.addEventListener("click", function(e)
                {
                    CommentTags.insertCommentTag(name, opening_tag, closing_tag);
                    e.preventDefault();
                });
            },

            insertCommentTag: function(name, opening_tag, closing_tag)
            {
                var textarea = document.getElementById("frm_body");
                var scrollPosition = textarea.scrollTop;

                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;

                var input;
                if (end > start)
                    input = textarea.value.substring(start, end);
                else
                    input = prompt("Type in the text you want to be " + name + ".", "");

                if (!input || input.length == 0)
                {
                    textarea.focus();
                    return;
                }

                // clean up the input
                var whiteSpaceBefore = false;
                var whiteSpaceAfter = false;
                if (name == "code")
                {
                    whiteSpaceBefore = /^\s\s*/.test(input);
                    whiteSpaceBefore = /\s\s*$/.test(input);
                    input = input.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                }
                else
                {
                    // break up curly braces that confuse the shack
                    input = input.replace(/^{/, '\n{').replace(/}$/, '}\n');
                }

                textarea.value = textarea.value.substring(0, start)
                    + (whiteSpaceBefore ? ' ' : '')
                    + opening_tag
                    + input
                    + closing_tag
                    + (whiteSpaceAfter ? ' ' : '')
                    + textarea.value.substring(end, textarea.value.length);

                var offset = whiteSpaceBefore ? 1 : 0;
                if (end > start)
                {
                    offset += start + opening_tag.length;
                    textarea.setSelectionRange(offset, offset + input.length);
                }
                else
                {
                    offset += start + input.length + opening_tag.length + closing_tag.length;
                    offset += (whiteSpaceAfter ? 1 : 0);
                    textarea.setSelectionRange(offset, offset);
                }

                textarea.focus();
                textarea.scrollTop = scrollPosition;
            }
        }

        processPostBoxEvent.addHandler(CommentTags.installCommentTags);
    }
});
