settingsLoadedEvent.addHandler(function()
{
    CommentTags =
    {
        installCommentTags: function()
        {
            var postform = document.getElementById("postform");
            if (postform)
            {
                var table = document.createElement("table");
                table.id = "shacktags_legend_table";
                table.style.display = "table";
                var tbody = table.appendChild(document.createElement("tbody"));

                var row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "red", "r{", "}r", "jt_red");
                CommentTags.addTag(row, "italics", "/[", "]/", "jt_italics");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "green", "g{", "}g", "jt_green");
                CommentTags.addTag(row, "bold", "b[", "]b", "jt_bold");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "blue", "b{", "}b", "jt_blue");
                CommentTags.addTag(row, "quote", "q[", "]q", "jt_quote");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "yellow", "y{", "}y", "jt_yellow");
                CommentTags.addTag(row, "sample", "s[", "]s", "jt_sample");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "olive", "e[", "]e", "jt_olive");
                CommentTags.addTag(row, "underline", "_[", "]_", "jt_underline");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "limegreen", "l[", "]l", "jt_lime");
                CommentTags.addTag(row, "strike", "-[", "]-", "jt_strike");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "orange", "n[", "]n", "jt_orange");
                CommentTags.addTag(row, "spoiler", "o[", "]o", "jt_spoiler", "return doSpoiler(event);");

                row = tbody.appendChild(document.createElement("tr"));
                CommentTags.addTag(row, "multisync", "p[", "]p", "jt_pink");
                CommentTags.addTag(row, "code", "/{{", "}}/", "jt_code");

                var shacktag_legends = document.getElementById("shacktags_legend");
                var original_shacktags_legend_table = document.getElementById("shacktags_legend_table");
                shacktag_legends.removeChild(original_shacktags_legend_table);
                shacktag_legends.appendChild(table);
            }
        },

        addTag: function(row, name, opening_tag, closing_tag, class_name, click)
        {
            var name_td = row.appendChild(document.createElement("td"));
            var span = name_td.appendChild(document.createElement("span"));
            span.className = class_name;
            span.appendChild(document.createTextNode(name));
            if (click && click.length > 0)
                name_td.setAttribute("onclick", click);

            var code_td = row.appendChild(document.createElement("td"));
            var button = code_td.appendChild(document.createElement("a"));
            button.appendChild(document.createTextNode(opening_tag + "..." + closing_tag));
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
});
