CommentTags =
{

    installCommentTags: function()
    {
        var postform = document.getElementById("postform");
        if (postform)
        {
            var comment_tags = document.createElement("div");
            comment_tags.setAttribute("shack_comment_tags");
            comment_tags.innerHTML = '<p>Comment Tags;</p>' +
                    '<table cellpadding="2" border="0" cellspacing="0">' +
                    '<tr><td><span class="jt_red">red</span></td><td>r{ ... }r</td>' +
                    '<td><i>italics</i></td><td>/[ ... ]/</td></tr>' +
                    '<tr><td><span class="jt_green">green</span></td><td>g{ ... }g</td>' +
                    '<td><b>bold</b></td><td>b[ ... ]b</td></tr>' +
                    '<tr><td><span class="jt_blue">blue</span></td><td>b{ ... }b</td>' +
                    '<td><span class="jt_quote">quote</span></td><td>q[ ... ]q</td></tr>' +
                    '<tr><td><span class="jt_yellow">yellow</span></td><td>y{ ... }y</td>' +
                    '<td><span class="jt_sample">sample</span></td><td>s[ ... ]s</td></tr>' +
                    '<tr><td><span class="jt_olive">olive</span></td><td>e[ ... ]e</td>' +
                    '<td><u>underline</u></td><td>_[ ... ]_</td></tr>' +
                    '<tr><td><span class="jt_lime">limegreen</span></td><td>l[ ... ]l</td>' +
                    '<td><span class="jt_strike">strike</span></td><td>-[ ... ]-</td></tr>' +
                    '<tr><td><span class="jt_orange">orange</span></td><td>n[ ... ]n</td>' +
                    '<td><span class="jt_spoiler" onclick="return doSpoiler( event );">spoiler</span></td><td>o[ ... ]o</td></tr>' +
                    '<tr><td><span class="jt_pink">multisync</span></td><td>p[ ... ]p</td>' +
                    '<td><pre class="jt_code">code</pre></td><td>/{{ ... }}/</td></tr>' +
                    '</table>';

            postform.parentNode.insertBefore(comment_tags, postform.nextSibling);
        }
    }

}

CommentTags.installCommentTags();
