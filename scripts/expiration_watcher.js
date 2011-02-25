ExpirationWatcher =
{
    // 1000ms * 60s * 60m * 24hr
    post_ttl: 1000 * 60 * 60 * 24,

    showExpiration: function(item, id, is_root_post)
    {
        if (is_root_post)
        {
            var postdate = getDescendentByTagAndClassName(item, "div", "postdate");
            var expiration_time = ExpirationWatcher.calculateExpirationTime(postdate);

            var now = Date.now();

            var time_left = expiration_time - now;
            if (time_left > 0)
            {
                var total_seconds = Math.round(time_left / 1000);
                var total_minutes = Math.floor(total_seconds / 60);
                var total_hours = Math.floor(total_minutes / 60);

                var minutes = total_minutes % 60;
                var seconds = total_seconds % 60;

                var desc = "Expires in " + total_hours + " hours, " + minutes + " minutes, and " + seconds + " seconds.";
                postdate.title = desc;
            }
            else
            {
                postdate.style.textDecoration = "line-through";
                postdate.title = "Expired";
            }
        }

    },

    calculateExpirationTime: function(postdate_element)
    {
        // put space between time and AM/PM so it will parse correctly
		var raw_time_string = postdate_element.innerHTML.toUpperCase();
		var pos = raw_time_string.indexOf("AM") + raw_time_string.indexOf("PM")+1;
        raw_time_string = raw_time_string.substring(0,pos) + " " + raw_time_string.substr(pos);

        var post_time = Date.parse(raw_time_string);
        return post_time + ExpirationWatcher.post_ttl;
    }
}

processPostEvent.addHandler(ExpirationWatcher.showExpiration);
