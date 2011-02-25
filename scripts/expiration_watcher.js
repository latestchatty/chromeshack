ExpirationWatcher =
{
    // 1000ms * 60s * 60m * 24hr
    post_ttl: 1000 * 60 * 60 * 24,

    bar_colors: new Array('#00FF00','#00FF00','#11FF00','#33FF00','#55FF00','#77FF00','#99FF00','#BBFF00','#DDFF00','#FFFF00','#FFEE00','#FFDD00','#FFCC00','#FFBB00','#FFAA00','#FF9900','#FF9900','#FF7700','#FF6600','#FF5500','#FF3300','#FF2200','#FF1100','#FF0000'),

    showExpiration: function(item, id, is_root_post)
    {
        if (is_root_post)
        {
            var postdate = getDescendentByTagAndClassName(item, "div", "postdate");
            var expiration_time = ExpirationWatcher.calculateExpirationTime(postdate);

            var now = Date.now();

            var time_left = expiration_time - now;
            var percent = 100;
            var color = ExpirationWatcher.bar_colors[23];
            if (time_left > 0)
            {
                var total_seconds = Math.round(time_left / 1000);
                var total_minutes = Math.floor(total_seconds / 60);
                var total_hours = Math.floor(total_minutes / 60);

                var minutes = total_minutes % 60;
                var seconds = total_seconds % 60;

                var desc = "Expires in " + total_hours + " hours, " + minutes + " minutes, and " + seconds + " seconds.";
                var percent = 100 - Math.floor(100 * time_left / ExpirationWatcher.post_ttl);
                color = ExpirationWatcher.bar_colors[23 - total_hours];
            }
            else
            {
                var desc = "Expired.";
            }

            var wrap = document.createElement("div");
            wrap.className = "countdown-wrap";
            wrap.title = desc;

            var value = wrap.appendChild(document.createElement("div"));
            value.className = "countdown-value";
            value.style.backgroundColor = color;
            value.style.width = percent + "%";

            postdate.parentNode.insertBefore(wrap, postdate);
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
