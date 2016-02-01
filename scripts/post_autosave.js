/*
 TODO:

 Fix recall of cached posts with post preview disabled or set to live
 Trigger removal of cached posts off successful posting instead of form submission
*/
settingsLoadedEvent.addHandler(function () {
    if (getSetting("enabled_scripts").contains("post_autosave")) {
        PostAutosave =
        {
            // Max number of posts cached
            cacheSize: 10,

            // The amount of time (ms) after typing before posts are cached 
            cacheTime: 500,

            timeoutId: -1,

            installClickEvent: function (postbox) {
                clearTimeout(PostAutosave.timeoutId);
                
                var frm_body = document.getElementById("frm_body");
                var postform = document.getElementById("postform");

                var id = document.getElementById('parent_id').value;

                frm_body.value = PostAutosave.getAutosave(id);
                frm_body.addEventListener('input', function () { PostAutosave.triggerAutosave(id); }, true);

                // Removes the cached post after it is submitted
                postform.addEventListener('submit', function () { PostAutosave.removeAutosave(id); });
            },

            triggerAutosave: function (id) {
                clearTimeout(PostAutosave.timeoutId);

                var frm_body = document.getElementById("frm_body");

                PostAutosave.timeoutId = setTimeout(PostAutosave.setAutosave, PostAutosave.cacheTime, id, frm_body.value);
            },

            setAutosave: function (id, text) {
                clearTimeout(PostAutosave.timeoutId);

                var posts = getSetting("autosaved_posts", []);
                var post;

                // Update the existing cached post or remove it if empty
                for (var i = 0; i < posts.length; i++) {
                    if (posts[i].id == id) {
                        if (text.length > 0) {
                            post = posts[i];

                            post.text = text;

                            posts.splice(i, 1);
                            posts.unshift(post);
                        }
                        else
                            posts.splice(i, 1);

                        setSetting("autosaved_posts", posts);
                        return;
                    }
                }

                // Add new cache entry if it doesn't exist
                if (text.length > 0) {
                    post = { id: id, text: text };

                    posts.unshift(post);
                }

                // Truncate the cache if necessary
                if (posts.length > PostAutosave.cacheSize)
                    posts.splice(PostAutosave.cacheSize);

                setSetting("autosaved_posts", posts);
            },

            getAutosave: function (id) {
                clearTimeout(PostAutosave.timeoutId);

                var posts = getSetting("autosaved_posts", []);

                for (var i = 0; i < posts.length; i++) {
                    if (posts[i].id == id) {
                        return posts[i].text;
                    }
                }

                return '';
            },

            removeAutosave: function (id) {
                clearTimeout(PostAutosave.timeoutId);

                var posts = getSetting("autosaved_posts", []);

                for (var i = 0; i < posts.length; i++) {
                    if (posts[i].id == id) {
                        posts.splice(i, 1);

                        setSetting("autosaved_posts", posts);
                        break;
                    }
                }
            }
        }

        processPostBoxEvent.addHandler(PostAutosave.installClickEvent);
    }
});
