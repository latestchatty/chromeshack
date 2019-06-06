/*!
* Adds recent news headlines to top right of chatty by reading the Shack RSS feed.
* Can add additional description line from RSS feed to Shacknews article posts.
* Can add a 'wallpaper' background to the chatty page which reflects the main image of the most recent article.
*/

settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("chatty_news"))
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
                    
                    var backcolor = "black";
                    var forecolor = "#ddd";//"white";
                    var styletext = `#SNCNbackimg {
                            position: fixed;
                            top: 0px;
                            left: 0px;
                            right: 0px;
                            bottom: 0px;
                            background-attachment: fixed;
                            background-size: cover;
                            background-position: center;
                        }
                        #SNCNmaskimg {
                            position: fixed;
                            top: 0px;
                            left: 0px;
                            right: 0px;
                            bottom: 0px;
                            background: ${backcolor};
                            opacity: 0.85;
                            transition: background 1s;
                        }
                        #SNCNheadlines {
                            width: 300px;
                            position: relative;
                            float: right;
                            right: 5px;
                            top: 5px;
                            background: ${backcolor};
                            z-index: 5;
                            border: 1px outset ${forecolor};
                        }
                        #SNCNheadlines h3 {
                            color: ${forecolor};
                            text-align: center;
                        }
                        #SNCNheadlines ul {
                            list-style-type:disc;
                            font-size: 110%;
                            font-weight: bold;
                        }
                        #SNCNheadlines ul li a {
                            color: ${forecolor} !important;
                            text-decoration: none;
                        }
                    `;
                    if(getSetting("chatty_news_show_image")){
                        styletext += `
                            div.article { 
                                background-color: ${backcolor}; position: relative;
                            }
                            div.threads { 
                                position: relative; 
                            }
                            div.threads ul ul li.last, div.commentsblock, body.page-chatty #content { 
                                background-color: transparent !important;
                            }
                            #chatty_comments_wrap { 
                                padding-bottom: 120%;
                            }
                            div div.treeview ul li:last-child { 
                                background: url(../images/commentsbulletlast.gif) 2px top no-repeat;
                            }
                            footer.primary {
                                position: relative; margin-top: 100px;
                            }
                            #main ,content-inner {
                                background-color: transparent;
                            }
                            #chatty_comments_wrap {
                                background-color: transparent !important;
                                position: relative;
                            }
                            #featured-thread {
                                position: relative;
                            }
                        `;
                    }

                    if(getSetting("chatty_news_highlight_article_posts")){
                        styletext+="div.fpauthor_14475 { background-color: #068 !important; border: 1px solid white !important; }\n";
                    }
                    
                    if(document.location.href.indexOf("https")>-1){
                        chattynews.sendAjax("https://www.shacknews.com/feed/rss",chattynews.parseRSS);
                    }else{
                        chattynews.sendAjax("http://www.shacknews.com/feed/rss",chattynews.parseRSS);
                    }
                    
                    var head = document.getElementsByTagName('head')[0];
                    var style = document.createElement('style');
                    style.type = 'text/css';
                    if (style.styleSheet){
                        style.styleSheet.cssText = styletext;
                    } else {
                        style.appendChild(document.createTextNode(styletext));
                    }
                    head.appendChild(style);
                }
            },
            sendAjax: function SendAjax(url, callbackDoc, callbackText) {
                if (window.XMLHttpRequest) {
                    var request = new XMLHttpRequest();
                } else {
                    var request = new ActiveXObject("Microsoft.XMLHTTP");
                }
             
                request.open("GET", url, true);
                request.onreadystatechange = function() {
                    if (request.readyState == 4 && request.status == 200) {
                        if (request.responseText) {
                            //console.log("AjaXResponse to "+url+" doc="+callbackDoc+" text="+callbackText+" resplength="+(request.responseText.length()));
                            if(callbackDoc!=null){
                                if (window.ActiveXObject) {
                                    var doc = new ActiveXObject("Microsoft.XMLDOM");
                                    doc.async = "false";
                                    doc.loadXML(request.responseText);
                                } else {
                                    var parser = new DOMParser();
                                    //replace handles badly (nonexistant) html encoded article titles
                                    var doc = parser.parseFromString(chattynews.html_entity_decode(request.responseText),"text/xml"); //.replace(/& /g,"&amp;")
                                }
                                callbackDoc(doc.documentElement);
                            }
                            if(callbackText!=null){
                                callbackText(request.responseText);
                            }
                        }
                    }
                    if (request.readyState == 4 && request.status != 200) {
                        console.log("Requested '"+url+"' bur received status "+request.status+"  text:"+request.responseText);
                        if(callbackDoc!=null){
                            callbackDoc(null);
                        }
                        if(callbackText!=null){
                            callbackText(null);
                        }
                    }
                }
             
                request.send(null);
            },
            parseRSS: function(data){
                var count = Number(getSetting("chatty_news_article_count"));
                if(count < 1){ 
                    count = 7;
                }
                var items = data.getElementsByTagName('item');
                
                var output = '<h3>NEWS HEADLINES</h3><ul>';
                for (var i = 0; i < ((items.length<count)?items.length:count); ++i) {
                    var title = chattynews.valueFromTagName(items[i], 'title');
                    var link = chattynews.valueFromTagName(items[i], 'link');
                    var desc = chattynews.valueFromTagName(items[i], 'description').replace(/<[^>]*>/g,'').replace(/"/g,'&quot;');
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
                    var elms = document.evaluate("//div[contains(@class,'fpauthor_14475')]/div[contains(@class,'postbody')]/a[contains(@href,'article/')]", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
                    for(var k=0;k<elms.snapshotLength;k++){
                        var elm = elms.snapshotItem(k);
                        
                        var postlink = elm.href;
                        //elm should be the link to the article, compare href to links in RSS
                        for(var i=0;i<items.length;i++){
                            var link = chattynews.valueFromTagName(items[i], 'link');
                            if(postlink.indexOf(link) > -1){

                                //found match, mark as converted and add description from RSS
                                elm.setAttribute('converted','1');
                                var parent = elm.parentNode;
                                var html = parent.innerHTML;
                                html+="<br><div class='newsarticle'>"+chattynews.valueFromTagName(items[i], 'description')+"</div>";
                                parent.innerHTML = html;
                                break;
                            }
                        }
                    }
                }
                
                if(getSetting("chatty_news_show_image")){
                    var lastNewsUrl = localStorage.getItem(chattynews.LOCALSTORAGE_LASTNEWS);
                    var lastNewsImage = localStorage.getItem(chattynews.LOCALSTORAGE_LASTIMAGE);
                    var topStoryLink = chattynews.valueFromTagName(items[0], 'link');
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
                        
                        chattynews.sendAjax(topStoryLink,null,chattynews.parseArticle);
                    }
                }
                
            },
            parseArticle: function(doc) {
                var imgurl;
                if(!doc) doc = "";
                var result = /<div class="article-image[^\(]*\('([^\)']*)/.exec(doc);
                if(result && result.length>1){
                    imgurl = result[1];
                    localStorage.setItem(chattynews.LOCALSTORAGE_LASTIMAGE,imgurl); //only save image url if we actually got one.
                }else{
                    imgurl = "http://shackwiki.com/images/a/a8/IconBig.png"; //backup image if an error occurred - Shack Chatty Crest.
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
                //maskimg.setAttribute('style', 'background-color: transparent !important;');
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
            },
            
            
            
            valueFromTagName: function (item, tagname) {
                var val = item.getElementsByTagName(tagname);
                if(val.length>0 && val[0]!=null && val[0].firstChild!=null)
                    return val[0].firstChild.nodeValue;
                return "";
            },
            
            html_entity_decode: function (string, quote_style) {
                // Convert all HTML entities to their applicable characters  
                // 
                // version: 1103.1210
                // discuss at: http://phpjs.org/functions/html_entity_decode
                // +   original by: john (http://www.jd-tech.net)
                // +      input by: ger
                // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // +   bugfixed by: Onno Marsman
                // +   improved by: marc andreu
                // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // +      input by: Ratheous
                // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
                // +      input by: Nick Kolosov (http://sammy.ru)
                // +   bugfixed by: Fox
                // -    depends on: get_html_translation_table
                // *     example 1: html_entity_decode('Kevin &amp; van Zonneveld');
                // *     returns 1: 'Kevin & van Zonneveld'
                // *     example 2: html_entity_decode('&amp;lt;');
                // *     returns 2: '&lt;'
                var hash_map = {},
                    symbol = '',
                    tmp_str = '',
                    entity = '';
                tmp_str = string.toString();
             
                if (false === (hash_map = chattynews.get_html_translation_table('HTML_ENTITIES', quote_style))) {
                    return false;
                }
             
                // fix &amp; problem
                // http://phpjs.org/functions/get_html_translation_table:416#comment_97660
                //modified by TroZ
                delete(hash_map['&']);
                delete(hash_map['<']);
                delete(hash_map['>']);
             
                for (symbol in hash_map) {
                    entity = hash_map[symbol];
                    tmp_str = tmp_str.split(entity).join(symbol);
                }
                tmp_str = tmp_str.split('&#039;').join("'");
             
                return tmp_str;
            },
            get_html_translation_table: function (table, quote_style) {
                // Returns the internal translation table used by htmlspecialchars and htmlentities  
                // 
                // version: 1103.1210
                // discuss at: http://phpjs.org/functions/get_html_translation_table
                // +   original by: Philip Peterson
                // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // +   bugfixed by: noname
                // +   bugfixed by: Alex
                // +   bugfixed by: Marco
                // +   bugfixed by: madipta
                // +   improved by: KELAN
                // +   improved by: Brett Zamir (http://brett-zamir.me)
                // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
                // +      input by: Frank Forte
                // +   bugfixed by: T.Wild
                // +      input by: Ratheous
                // %          note: It has been decided that we're not going to add global
                // %          note: dependencies to php.js, meaning the constants are not
                // %          note: real constants, but strings instead. Integers are also supported if someone
                // %          note: chooses to create the constants themselves.
                // *     example 1: get_html_translation_table('HTML_SPECIALCHARS');
                // *     returns 1: {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}
                var entities = {},
                    hash_map = {},
                    decimal = 0,
                    symbol = '';
                var constMappingTable = {},
                    constMappingQuoteStyle = {};
                var useTable = {},
                    useQuoteStyle = {};
             
                // Translate arguments
                constMappingTable[0] = 'HTML_SPECIALCHARS';
                constMappingTable[1] = 'HTML_ENTITIES';
                constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
                constMappingQuoteStyle[2] = 'ENT_COMPAT';
                constMappingQuoteStyle[3] = 'ENT_QUOTES';
             
                useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
                useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() : 'ENT_COMPAT';
             
                if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
                    throw new Error("Table: " + useTable + ' not supported');
                    // return false;
                }
             
                entities['38'] = '&amp;';
                if (useTable === 'HTML_ENTITIES') {
                    entities['160'] = '&nbsp;';
                    entities['161'] = '&iexcl;';
                    entities['162'] = '&cent;';
                    entities['163'] = '&pound;';
                    entities['164'] = '&curren;';
                    entities['165'] = '&yen;';
                    entities['166'] = '&brvbar;';
                    entities['167'] = '&sect;';
                    entities['168'] = '&uml;';
                    entities['169'] = '&copy;';
                    entities['170'] = '&ordf;';
                    entities['171'] = '&laquo;';
                    entities['172'] = '&not;';
                    entities['173'] = '&shy;';
                    entities['174'] = '&reg;';
                    entities['175'] = '&macr;';
                    entities['176'] = '&deg;';
                    entities['177'] = '&plusmn;';
                    entities['178'] = '&sup2;';
                    entities['179'] = '&sup3;';
                    entities['180'] = '&acute;';
                    entities['181'] = '&micro;';
                    entities['182'] = '&para;';
                    entities['183'] = '&middot;';
                    entities['184'] = '&cedil;';
                    entities['185'] = '&sup1;';
                    entities['186'] = '&ordm;';
                    entities['187'] = '&raquo;';
                    entities['188'] = '&frac14;';
                    entities['189'] = '&frac12;';
                    entities['190'] = '&frac34;';
                    entities['191'] = '&iquest;';
                    entities['192'] = '&Agrave;';
                    entities['193'] = '&Aacute;';
                    entities['194'] = '&Acirc;';
                    entities['195'] = '&Atilde;';
                    entities['196'] = '&Auml;';
                    entities['197'] = '&Aring;';
                    entities['198'] = '&AElig;';
                    entities['199'] = '&Ccedil;';
                    entities['200'] = '&Egrave;';
                    entities['201'] = '&Eacute;';
                    entities['202'] = '&Ecirc;';
                    entities['203'] = '&Euml;';
                    entities['204'] = '&Igrave;';
                    entities['205'] = '&Iacute;';
                    entities['206'] = '&Icirc;';
                    entities['207'] = '&Iuml;';
                    entities['208'] = '&ETH;';
                    entities['209'] = '&Ntilde;';
                    entities['210'] = '&Ograve;';
                    entities['211'] = '&Oacute;';
                    entities['212'] = '&Ocirc;';
                    entities['213'] = '&Otilde;';
                    entities['214'] = '&Ouml;';
                    entities['215'] = '&times;';
                    entities['216'] = '&Oslash;';
                    entities['217'] = '&Ugrave;';
                    entities['218'] = '&Uacute;';
                    entities['219'] = '&Ucirc;';
                    entities['220'] = '&Uuml;';
                    entities['221'] = '&Yacute;';
                    entities['222'] = '&THORN;';
                    entities['223'] = '&szlig;';
                    entities['224'] = '&agrave;';
                    entities['225'] = '&aacute;';
                    entities['226'] = '&acirc;';
                    entities['227'] = '&atilde;';
                    entities['228'] = '&auml;';
                    entities['229'] = '&aring;';
                    entities['230'] = '&aelig;';
                    entities['231'] = '&ccedil;';
                    entities['232'] = '&egrave;';
                    entities['233'] = '&eacute;';
                    entities['234'] = '&ecirc;';
                    entities['235'] = '&euml;';
                    entities['236'] = '&igrave;';
                    entities['237'] = '&iacute;';
                    entities['238'] = '&icirc;';
                    entities['239'] = '&iuml;';
                    entities['240'] = '&eth;';
                    entities['241'] = '&ntilde;';
                    entities['242'] = '&ograve;';
                    entities['243'] = '&oacute;';
                    entities['244'] = '&ocirc;';
                    entities['245'] = '&otilde;';
                    entities['246'] = '&ouml;';
                    entities['247'] = '&divide;';
                    entities['248'] = '&oslash;';
                    entities['249'] = '&ugrave;';
                    entities['250'] = '&uacute;';
                    entities['251'] = '&ucirc;';
                    entities['252'] = '&uuml;';
                    entities['253'] = '&yacute;';
                    entities['254'] = '&thorn;';
                    entities['255'] = '&yuml;';
                }
             
                if (useQuoteStyle !== 'ENT_NOQUOTES') {
                    entities['34'] = '&quot;';
                }
                if (useQuoteStyle === 'ENT_QUOTES') {
                    entities['39'] = '&#39;';
                }
                entities['60'] = '&lt;';
                entities['62'] = '&gt;';
             
                // ascii decimals to real symbols
                for (decimal in entities) {
                    symbol = String.fromCharCode(decimal);
                    hash_map[symbol] = entities[decimal];
                }
             
                return hash_map;
            }
            
        };

        chattynews.install();
    }
});