settingsLoadedEvent.addHandler(function()
{
    ExpirationWatcher =
    {
        // 1000ms * 60s * 60m * 18hr
        post_ttl: 1000 * 60 * 60 * 18,

        bar_colors: new Array('#00C300' ,'#00C800' ,'#00D800' ,'#00DF00' ,'#00ED00' ,'#00F500' ,'#00FE00' ,'#2AFF00' ,'#D4FF00' ,'#FEFF00' ,'#FFEE00' ,'#FFCF00' ,'#FF9900' ,'#FF9900' ,'#FF8000' ,'#FF4B00' ,'#FF1A00' ,'#FF0000'),

        install: function()
        {
            document.body.className += ' expiration-watcher-bar';
        },

        showExpiration: function(item, id, is_root_post)
        {
            var style = getSetting("expiration_watcher_style");

            if (!is_root_post) return;

            var postdate = getDescendentByTagAndClassName(item, "div", "postdate");
            var expiration_time = ExpirationWatcher.calculateExpirationTime(postdate);
            var now = Date.now();

            var time_left = expiration_time - now;

            var wrap = document.createElement("div");
            //Give it a different style if it's expired so that it's easier to tell that it's done for good.
            wrap.className = (time_left > 0) ? "countdown-wrap" : "expired-wrap";

            var value = wrap.appendChild(document.createElement("div"));
            value.className = (time_left > 0) ? "countdown-value" : "expired-value";

            ExpirationWatcher.updateExpirationTime(time_left, wrap, value);
            postdate.parentNode.insertBefore(wrap, postdate);
        },

        updateExpirationTime: function(time_left, wrap, value)
        {
            var percent = 100;
            var color = ExpirationWatcher.bar_colors[17];

            var desc = ExpirationWatcher.getExpirationTimeDescription(time_left);

            if (time_left > 0)
            {
                percent = 100 - Math.floor(100 * time_left / ExpirationWatcher.post_ttl);

                var total_hours = Math.floor(time_left / 3600000 );
                color = ExpirationWatcher.bar_colors[17 - total_hours];
            }

            wrap.title = desc;
            value.style.backgroundColor = color;
            value.style.width = percent + "%";
        },

        getExpirationTimeDescription: function(time_left)
        {
            if (time_left > 0)
            {
                var total_seconds = Math.round(time_left / 1000);
                var total_minutes = Math.floor(total_seconds / 60);
                var total_hours = Math.floor(total_minutes / 60);

                var minutes = total_minutes % 60;
                var seconds = total_seconds % 60;

                return "Expires in " + total_hours + " hours, " + minutes + " minutes, and " + seconds + " seconds.";
            }
            else
            {
                return "Expired";
            }
        },

        calculateExpirationTime: function(postdate_element)
        {
            // put space between time and AM/PM so it will parse correctly
            var raw_time_string = postdate_element.innerHTML.toUpperCase();
            var pos = raw_time_string.indexOf("AM") + raw_time_string.indexOf("PM")+1;
            raw_time_string = raw_time_string.substring(0,pos) + " " + raw_time_string.substr(pos);

                // timezone needs to be in parentheses
            var zone = raw_time_string.substring(pos+4).trim();
            raw_time_string = raw_time_string.substring(0,pos+4) + "(" + zone + ")";


            var post_time = Date.parse(raw_time_string);
            return post_time + ExpirationWatcher.post_ttl;
        }
    };

    ExpirationWatcher.install();
    processPostEvent.addHandler(ExpirationWatcher.showExpiration);
});
