/*!
* Adds recent news headlines to top right of chatty by reading the Shack RSS feed.
* Can add additional description line from RSS feed to Shacknews article posts.
* Can add a 'wallpaper' background to the chatty page which reflects the main image of the most recent article.
*/

settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").indexOf("chatty_news") > -1)
    {
        chattynews = {
            LOCALSTORAGE_LASTIMAGE: "chatty_news_last_image",
            LOCALSTORAGE_LASTNEWS: "chatty_news_last_news_url",
            scriptStartTime: 0,
            tintback: true,
            
            install: function(){
                if(document.getElementById("SNCNheadlines")!=null)
                    return; //if this div exists, we've already been installed
                if((document.location).toString().indexOf('/chatty')>-1){
                    
                    chattynews.scriptStartTime = (new Date()).getTime();
                    
                    var body = document.body;
                    body.classList.add('chattynews'); //activate injected CSS
                    
                    if(getSetting("chatty_news_show_image")){
                        body.classList.add('chattynews_image');//activate injected CSS
                    }

                    if(getSetting("chatty_news_highlight_article_posts")){
                        body.classList.add('chattynews_article');//activate injected CSS
                    }
                    
                    if(getSetting("chatty_news_wallpaper_dim")){
                        body.classList.add('chattynews_dim'+getSetting("chatty_news_wallpaper_dim"));//activate injected CSS
                    }
                    
                    var rssurl = "https://www.shacknews.com/feed/rss";
                    if(document.location.href.indexOf("https")==-1){
                        rssurl = "http://www.shacknews.com/feed/rss";
                    }
                    fetchSafe(rssurl, {}, { rssBool: true }).then(chattynews.parseRSS);
                }
            },
            
            parseRSS: function(data){
                var count = Number(getSetting("chatty_news_article_count"));
                if(count < 1){ 
                    count = 7;
                }
                var items = data.items;
                
                var output = '<h3>NEWS HEADLINES</h3><ul>';
                for (var i = 0; i < ((items.length<count)?items.length:count); ++i) {
                    var title = DOMPurify.sanitize(items[i].title);
                    var link = DOMPurify.sanitize(items[i].link);
                    var desc = DOMPurify.sanitize(items[i].content);
                    output += '<li><a href ="' + link + '" title="'+desc+'" target="_blank">' + title + '</li>\n';
                }
                output += '</ul>';
                var introwrap = document.getElementById('main');//'chatty_intro_wrap'
                if(introwrap!=null){
                    var RSSOutput = document.createElement("div");
                    RSSOutput.setAttribute('id','SNCNheadlines');
                    RSSOutput.innerHTML = output;
                    
                    var content = introwrap.getElementsByClassName("content")[0];
                    introwrap.insertBefore(RSSOutput,content);
                }
                
                if(getSetting("chatty_news_article_news")){
                    var elms = document.body.querySelectorAll('div.fpauthor_14475 div.postbody a[href*="article/"]');
                    for(var k=0;k<elms.length;k++){
                        var elm = elms[k];
                        
                        var postlink = elm.href;
                        //elm should be the link to the article, compare href to links in RSS
                        for(var i=0;i<items.length;i++){
                            var link = items[i].link;
                            if(postlink.indexOf(link) > -1){
                                //found match, mark as converted and add description from RSS
                                elm.setAttribute('converted','1');
                                var parent = elm.parentNode;
                                var html = parent.innerHTML;
                                html+="<br><div class='newsarticle'>"+DOMPurify.sanitize(items[i].content)+"</div>";
                                parent.innerHTML = html;
                                break;
                            }
                        }
                    }
                }
                
                if(getSetting("chatty_news_show_image")){
                    var lastNewsUrl = localStorage.getItem(chattynews.LOCALSTORAGE_LASTNEWS);
                    var lastNewsImage = localStorage.getItem(chattynews.LOCALSTORAGE_LASTIMAGE);
                    var topStoryLink = items[0].link;
                    //convert protocol, RSS seems to have HTTP, but page is now HTTPS
                    var pos = topStoryLink.indexOf(":");
                    topStoryLink = document.location.href.substring(0,document.location.href.indexOf(":"))+topStoryLink.substring(pos);
                    
                    if(topStoryLink == lastNewsUrl && lastNewsImage.length>2){ 
                        //same top article as last refresh, so just show saved image url
                        chattynews.showImage(lastNewsImage);
                    }else{
                        //new top article since last refresh - need to get new image url from article
                        localStorage.setItem(chattynews.LOCALSTORAGE_LASTNEWS,topStoryLink);
                        localStorage.setItem(chattynews.LOCALSTORAGE_LASTIMAGE,"");
                        
                        fetchSafe(topStoryLink).then(data => {
                            chattynews.parseArticle(data);
                        });
                    }
                }
                
            },
            
            parseArticle: function(fragment) {
                var imgurl;
                if(!fragment){
                    imgurl = "https://shackwiki.com/images/a/a8/IconBig.png"; //backup image if an error occurred - Shack Chatty Crest.
                } else {
                    var result = fragment.querySelector(".article-image");
                    if(result){
                        imgurl = result.style.backgroundImage;
                        imgurl = imgurl.match(/"([^"]+)"/)[1];
                        localStorage.setItem(chattynews.LOCALSTORAGE_LASTIMAGE,imgurl); //only save image url if we actually got one.
                    }else{
                        imgurl = "https://shackwiki.com/images/a/a8/IconBig.png"; //backup image if an error occurred - Shack Chatty Crest.
                    }
                }
                
                chattynews.showImage(imgurl);
            },
            
            showImage: function(imgurl){
                //put the image in the background of the chatty
                var imgdiv = document.createElement("div");
                var maskimg = document.createElement("div");
                imgdiv.setAttribute('id', "SNCNbackimg");
                imgdiv.setAttribute('style','background-image: url("' + imgurl + '")');
                maskimg.setAttribute('id', "SNCNmaskimg");
                imgdiv.appendChild(maskimg);
                document.body.insertBefore(imgdiv,document.body.firstChild);
                
                
                console.log("ShacknewsChattyNews - image done "+((new Date()).getTime() - chattynews.scriptStartTime) + "ms");
                
                
                if(getSetting("chatty_news_brighten_image")){
                    var scroll = function(arg){
                        var body = document.body,
                            html = document.documentElement;

                        var height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
                        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
                        var ele = document.getElementById('SNCNmaskimg');
                        if( (window.pageYOffset<250) || (window.pageYOffset > (height - (h*2) ))){
                            if(chattynews.tintback){
                                chattynews.tintback = false;
                                ele.setAttribute('style','background-color: transparent !important;');
                            }
                        }else if(!chattynews.tintback){
                            chattynews.tintback = true;
                            ele.setAttribute('style','');
                        }
                    }
                    
                    document.addEventListener("scroll", scroll,false);
                    scroll();
                }
            }
            
        };

        chattynews.install();
    }
});