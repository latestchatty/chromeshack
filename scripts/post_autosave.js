/*
 TODO:

 Trigger removal of cached posts off successful posting instead of form submission (in case something goes wrong)
*/
settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("post_autosave")) {
        PostAutosave = {
            CACHE_SETTING_NAME: 'autosaved_posts',

            // Max number of posts cached
            CACHE_SIZE: 10,

            // The amount of time (ms) after typing before posts are cached 
            CACHE_TIME: 800,

            // Local copy of the cache to use within a single page view
            cache: [],

            timeoutId: -1,

            install: function () {
                PostAutosave.cache = getSetting(PostAutosave.CACHE_SETTING_NAME);

                var frm_submit = document.getElementById('frm_submit');
                var notificationArea = document.createElement('div');

                notificationArea.id = "autosaveNotification";

                frm_submit.parentNode.appendChild(notificationArea);
            },

            installClickEvent: function (postbox) {
                clearTimeout(PostAutosave.timeoutId);
                
                var frm_body = document.getElementById('frm_body');
                var postform = document.getElementById('postform');

                var id = document.getElementById('parent_id').value;

                frm_body.value = PostAutosave.getAutosave(id);
                frm_body.addEventListener('input', function () { PostAutosave.triggerAutosave(id); }, true);

                // Removes the cached post after it is submitted
                postform.addEventListener('submit', function () { PostAutosave.removeAutosave(id); });
            },

            triggerAutosave: function (id) {
                clearTimeout(PostAutosave.timeoutId);

                var frm_body = document.getElementById('frm_body');

                PostAutosave.timeoutId = setTimeout(PostAutosave.setAutosave, PostAutosave.CACHE_TIME, id, frm_body.value);
            },

            getAutosave: function (id) {
                clearTimeout(PostAutosave.timeoutId);

                var posts = PostAutosave.cache;

                for (var i = 0; i < posts.length; i++) {
                    if (posts[i].id == id) {
                        PostAutosave.displayNotification("Loaded autosaved post!");

                        return posts[i].text;
                    }
                }

                return '';
            },

            setAutosave: function (id, text) {
                clearTimeout(PostAutosave.timeoutId);

                if (!PostAutosave.updateAutosave(id, text))
                    PostAutosave.addAutosave(id, text);

                PostAutosave.displayNotification("Autosaved post!");
            },

            addAutosave: function (id, text) {
                if (text.length == 0)
                    return;

                var posts = PostAutosave.cache;
                var post = { id: id, text: text };

                posts.unshift(post);

                // Truncate the cache if necessary
                if (posts.length > PostAutosave.CACHE_SIZE)
                    posts.splice(PostAutosave.CACHE_SIZE);

                PostAutosave.saveCache(posts);
            },
            
            updateAutosave: function (id, text) {
                var posts = PostAutosave.cache;
                var post;

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

                        PostAutosave.saveCache(posts);
                        return true;
                    }
                }

                return false;
            },

            removeAutosave: function (id) {
                clearTimeout(PostAutosave.timeoutId);

                var posts = PostAutosave.cache;

                for (var i = 0; i < posts.length; i++) {
                    if (posts[i].id == id) {
                        posts.splice(i, 1);

                        PostAutosave.saveCache(posts);
                        break;
                    }
                }
            },

            saveCache: function (posts) {
                PostAutosave.cache = posts;
                setSetting(PostAutosave.CACHE_SETTING_NAME, posts);
            },

            displayNotification: function(text) {
                var notificationArea = document.getElementById('autosaveNotification');

                notificationArea.innerText = text;
                notificationArea.className = "visible";

                setTimeout(function () { notificationArea.className = ""; }, 2000);
            }
        }

        PostAutosave.install();
        processPostBoxEvent.addHandler(PostAutosave.installClickEvent);
    }
});
