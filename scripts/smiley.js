/*!
* Smiley.js (c) 2013, 2019 Brian Risinger
*/
/*
If I don't do the things that aren't worth doing, who will?
*/

settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("post_emoji"))
    {

		Smiley = {
			
			//Shack specific functions
			install: function() {
                // script is already injected
                if (document.getElementById("emojiButton") != null)
                    return;
				
				Smiley.loadedLocalization();
				Smiley.init();

                var postButton = document.getElementById("frm_submit");
                if (postButton ){
                    // don't add click handlers here, because these elements get cloned into the page later
					if(getSetting("post_emoji_button")){
						var emojiButton = document.createElement("button");
						emojiButton.id = "emojiButton";
						emojiButton.setAttribute("type", "button");
						emojiButton.innerHTML = "Emoji &#x1f600;";
						if (getSetting("post_emoji_location") == "Left")
							postButton.parentNode.insertBefore(emojiButton, postButton.parentNode.firstChild);
						else
							postButton.parentNode.appendChild(emojiButton);
					}
					postButton.removeAttribute("onclick");
					
					var postform = document.getElementById("postform");
					if(postform){
						var rulesline = postform.querySelectorAll("p.rules");
						if(rulesline != null && rulesline.length > 0){
							var spacer = document.createElement("span");
							spacer.className = "postbox_rules_divider";
							spacer.innerHTML = " &#x2022; ";
							rulesline[0].append(spacer);
							
							var emoji  = document.createElement("span");
							if(navigator.appVersion.indexOf("Mac")!=-1){
								emoji.innerText = "CTRL + &#x2318; + Space for Emoji";
							} else if(navigator.appVersion.indexOf("Win")!=-1){
								emoji.innerText = "Win + . for Emoji";
							}
							rulesline[0].append(emoji);
						}
					}
                }
				
				//update preview to not remove emoji
				removeUtf16SurrogatePairs = function(str){ return str; }
				
				processPostBoxEvent.addHandler(Smiley.installClickEvent);
            },
			
			installClickEvent: function(postbox) {
                var emojiButton = document.getElementById("emojiButton");
                emojiButton.addEventListener("click", Smiley.showWindow, true);
				//hide emoji window when a post is made.
				var postButton = document.getElementById("frm_submit");
				postButton.addEventListener("click",Smiley.doPost, true);
				
            },
			
			showWindow: function(event) {
				Smiley.showPicker(Smiley.shackCallback,event);
			},
			
			shackCallback: function(val){
				var form_body = document.getElementById("frm_body");
				Smiley.insertAtCursor(form_body,val);
			},
			insertAtCursor: function(myField, myValue) {
				//cut down from https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
				
				//MOZILLA and others
				if (myField.selectionStart || myField.selectionStart == '0') {
					var startPos = myField.selectionStart;
					var endPos = myField.selectionEnd;
					myField.value = myField.value.substring(0, startPos)
						+ myValue
						+ myField.value.substring(endPos, myField.value.length);
					this.selectionStart = startPos + myValue.length;
					this.selectionEnd = startPos + myValue.length;
				} else {
					myField.value += myValue;
				}

				var e = document.createEvent('HTMLEvents');
				e.initEvent('input', false, true);
				myField.dispatchEvent(e);
				myField.focus();
			},
			doPost: function(){
				Smiley.hidePicker();
				
				var textArea = document.getElementById("frm_body");
				if(textArea){
					textArea.value = Smiley.convertToHtmlEntities(textArea.value);
				}
				
				//normal post action
				$('#frm_submit').attr('disabled', 'disabled').css('color', '#E9E9DE'); 
				$('#postform').submit(); 
				return false;
			},
			convertToHtmlEntities: function(text){
				//encodes characters outside the basic multilingual plane to html entities. Doesn't convert normal problematic characters such as <, >, or quotes.
				var ret = "";
				for(var i=0;i<text.length;i++){
					var val = text.codePointAt(i);
					if(val > 0xFFFF){
						//convert to html entity as Shacknews DB only supports the Basic Multilingual Plane
						ret += "&#"+val+";";
						i++;//code points above this value are two (UTF-16) characters long, so need to move one additional character;
					} else {
						ret += text.charAt(i);
					}
				}
				return ret;
			},
			
			//properties
			css: `
		#smileycontainer{
			z-index: 2100;
		}
		#smileywindow{
			display: absolute;
			top: 100px;
			left: 100px;
			min-width: 625px;
			height: 300px;
			border: 2px outset gray;
			background: white;
			cursor: default;
			font-family: arial,helvetica,clean,sans-serif;
		}
		#simleywindowtitle{
			width: 100%;
			height: 24px;
			background: teal;
			border-bottom: 1px outset gray;
			font-size: 16px;
		}
		#smileywindowclose{
			height: 20px;
			min-width: 16px;
			float: right;
			background: maroon;
			border: 1px solid black;
			-webkit-border-radius: 3px;
			-moz-border-radius: 3px;
			border-radius: 3px;
			color: white;
			font-weight: bold;
			cursor: pointer;
			text-align: center;
		}
		#smileytypeselect{
			float: right;
			font-size: 80%;
		}
		#smileytabholder{
			overflow: hidden;
			padding-top: 4px;
			background: lightgray;
			line-height: 24px;
		}
		#smileycontentholder{
			position: relative;
			width: 100%;
			top: -3px;
		}
		#smileycontent{
			background: white;
			overflow-y: scroll;
			height: 250px;
			padding: 3px;
			/*
			position: absolute;
			width: 100%;
			*/
		}
		#smileycontent table{
			border-collapse: collapse;
			border-spacing: 0;
		}
		#smileycontent table td{
			padding: 0px;
			margin: 0px;
			text-align: center;
			min-width: 40px;
		}
		#smileycontent table td.smileyleft{
			text-align: left;
		}
		#smileycontent table td.smileycenter{
			text-align: center;
		}
		#smileycontent button{
			padding: 3px;
			margin: 0px;
			font-size: 28px;
			font-family: "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", Times, Symbola, "Segoe UI Symbol", Aegyptus, symbola, aegean, Code2000, Code2001, Code2002, Musica, serif, LastResort;
			color: black !important;
		}
		#smileytabholder span.smileytab{
			border: 1px solid black;
			background: lightgray;
			padding: 1px;
			cursor: pointer;
			-webkit-border-top-left-radius: 4px;
			-webkit-border-top-right-radius: 4px;
			-moz-border-radius-topleft: 4px;
			-moz-border-radius-topright: 4px;
			border-top-left-radius: 4px;
			border-top-right-radius: 4px;
			font-size: 15px;
			
			height: 25px;
			margin-top 2px;
			display: inline-block;
		}
		#smileytabholder span.smileytabspacer{
			width: 12px;
			display: inline-block;
		}
		#smileytabholder span.smileytabselected{
			background: white; /* same as #smileycontent */
			border-bottom: none;
			padding: 0 3px 3px 3px;
			font-size: 18px;
			height: 28px;
			margin-top: 0px;
		}
		.smiley, #smileywindowclose{
			font-family: symbola,aegean,Segoe UI Symbol;
		}
		.smileyheiro{
			font-family: heiroglyph;
		}
		#smileycontent .smileyheiro button{
			font-family: heiroglyph;
			padding: 1px;
		}
		.emoji{
			font-size: 130%;
		}
		#smileycontent button.buttonemoji{
			line-height: 2em;
			padding: 1px;
		}
		`,	
			CHARSPERLINE: 12,
			EMOJICHARSPERLINE: 8,
			MAXPROCESS: 100,
			LOWESTCHAR: 0x2000,
			
			LOCALSTORAGETABSTYLE:"SmileyTabStyle",
			
			MAN: "MAN",
			WOMAN: "WOMAN",
			GIRL: "GIRL",
			BOY: "BOY",
			RESET: "RESET",
			PERSON: "PERSON",
			
			inited: false,
			nationalized: false,
			callbackHtml: false, //if the callback should be sent just a unicode string of the selected character, or an html span
			callbackEntities: false, //if the callbcak should be sent a string of encoded html entities (this is overridden by callbackHtml)
			callbackOrig: function(text){
				alert("Callback not set when attempting to insert '"+text+"'");
			},
			callback: function(text){
				alert("Callback not set when attempting to insert '"+text+"'");
			},
			alltabs: {},
			tabGroups: new Array(),
			tabs: new Array( new Array( new Array( 0x3f, "Error"), new Array( 0, "Initialization Error!"))),
			windowTitle: "Smiley Window",
			dragTop: 0,
			dragLeft: 0,
			dragX: 0,
			dragY: 0,

			
			/* methods intended to be exposed */
			loadedLocalization: function(){
				this.nationalized = true;
				this.tabs = this.tabGroups[0].tabs;
			},
			init: function(){
				if(this.inited) return;
				this.inited = true;
				
				var head = document.getElementsByTagName('head')[0];
				var style = document.createElement('style');
				style.type = 'text/css';
				if (style.styleSheet){
					style.styleSheet.cssText = this.css;
				} else {
					style.appendChild(document.createTextNode(this.css));
				}
				head.appendChild(style);
			},
			ready: function(){ return this.nationalized; },
			showPicker: function(callBack,event){
				if(event==null)
					event = window.event;
				if (typeof(callBack) == "function")
					this.callback = callBack;
				this.hidePicker();
				this.displayPicker(event,null);
			},
			showPickerElm: function(callBack,element){
				if (typeof(callBack) == "function")
					this.callback = callBack;
				this.hidePicker();
				this.displayPicker(null,element);
			},
			hidePicker: function(){
				var ele = document.getElementById('smileycontainer');
				if(ele!=null){
					ele.parentNode.removeChild(ele);
				}
			},
			setCallbackHtml: function(bool){
				this.callbackHtml = bool;
			},
			
			setCallbackEntities: function(bool){
				this.callbackEntities = bool;
			},

			/*methods not intended to be exposed */
			displayPicker: function (event,element){
			
				//create window frame
				var html = "<div id='smileywindow'><div id='smileywindowclose'>"+String.fromCodePoint(0x274C)+//274C 2716
					"</div><div id='smileytypeselect'><select id='smileytypeselectselect'></select>&nbsp;</div><div id='simleywindowtitle'>"+this.windowTitle+
					" &nbsp; &nbsp; &nbsp; </div><div id='smileytabholder'></div><div id='smileycontentholder'><div id='smileycontent'></div></div><div>";
				//<input id='simleyemojistyle' type='checkbox'>Emoji Style
				//var count = 0;
						
				//add window frame to page
				var ele = document.createElement('div');
				ele.id='smileycontainer';
				ele.innerHTML = html;
				if(element!=null ){
					element.appendChild(ele);
				}else{
					document.body.appendChild(ele);
				}
				if(event!=null){ //this block is from some StackExchange page.
					ele.style.position="absolute";
					if(event.pageX){
						ele.style.left=""+event.pageX+"px";
						ele.style.top=""+event.pageY+"px";
					}else if(event.clientX){
						if(document.body.scrollLeft!=null){
							ele.style.left=""+(evt.clientX + document.body.scrollLeft)+"px";
							ele.style.top=""+(evt.clientY + document.body.scrollTop)+"px";
						}else if(document.compatMode=='CSS1Compat' && 
								document.documentElement && 
								document.documentElement.scrollLeft!=null){
							ele.style.left=""+(evt.clientX + document.documentElement.scrollLeft)+"px";
							ele.style.top=""+(evt.clientY + document.documentElement.scrollTop)+"px";
						}
					}
				}

				//add character count to title
				ele = document.getElementById('simleywindowtitle');
				if(ele!=null){
					//ele.innerHTML += " ("+count+")";
					ele.onmousedown = this.titleClick;
					ele.ondragstart = this.titleDrag;
				}
				
				var tabStyle = localStorage.getItem(this.LOCALSTORAGETABSTYLE);
				var tabStyleIndex = 0;
				var selectOptions = "";
				for(var i=0;i<this.tabGroups.length;i++){
					selectOptions += "<option value="+i+" ";
					if(this.tabGroups[i].name == tabStyle){
						tabStyleIndex = i;
						selectOptions += "selected";
					}
					selectOptions += ">" + this.tabGroups[i].name + "</option>";
				}
				ele = document.getElementById('smileytypeselectselect');
				if(ele!=null){
					ele.innerHTML = selectOptions;
					//add event listener
					ele.addEventListener("change",function(){ Smiley.changeStyle()}, true);
				}
				ele  = document.getElementById('smileywindowclose');
				if(ele!=null){
					ele.addEventListener("click",Smiley.hidePicker, true);
				}
							
				this.changeStyle(tabStyleIndex);
			},
			changeStyle: function(style){
				if(style == null || style == undefined){
					var ele1 = document.getElementById("smileytypeselectselect");
					style = ele1.selectedIndex
				}
				
				this.tabs = this.tabGroups[style].tabs;
				localStorage.setItem(this.LOCALSTORAGETABSTYLE,this.tabGroups[style].name);
				
				var tabstr = "";
				for(i=0;i<this.tabs.length;i++){
					var tab = this.tabs[i];
					if(tab!=undefined && tab.length > 0){
						tabstr += "<span id='smileytab"+i+"'";
						if(tab[0].length>2){
							tabstr += " class='smileytab "+tab[0][2]+"'";
						}else{
							tabstr += " class='smiley smileytab'";
						}			
						tabstr += " title='"+tab[0][1]+"' '>";
						if(Object.prototype.toString.call(tab[0][0]) === '[object Array]'){
							for(var k=0;k<tab[0][0].length;k++){
								tabstr += String.fromCodePoint(tab[0][0][k]);
							}
						}else{
							tabstr +=String.fromCodePoint(tab[0][0]);
						}
						tabstr +="</span>";
						//count += this.tabs[i].length - 1;
					}else{
						//spacer
						tabstr += "<span class='smileytabspacer'>&nbsp;</span>";
					}
				}
				
				//add tabs to window frame
				var ele = document.getElementById('smileytabholder');
				if(ele!=null){
					ele.innerHTML = tabstr;
					//add event listeners
					for(i=0;i<this.tabs.length;i++){
						var tab = document.getElementById("smileytab"+i);
						if(tab!=null){
							tab.addEventListener("click",function(j){ return function(){ Smiley.showTab(j)}}(i), true);
						}
					}
				}
				
				//display initial tab
				this.showTab(0);
			},
			showTab: function(num){
				//step 1, unselect all tabs but select specified tab
				for(var i=0;i<this.tabs.length;i++){
					var ele = document.getElementById('smileytab'+i);
					if(ele!=null){
						if(i==num){
							ele.className += " smileytabselected";
						}else{
							ele.className = ele.className.replace( /(?:^|\s)smileytabselected(?!\S)/g , '' );

						}
					}
				}
				
				//step 2, fill out content
				var tab = this.tabs[num];
				var content = tab[0][1]+"<table"
				if(tab[0].length>2){
					content += " class='"+tab[0][2]+"' ";
				}
				content += ">\n";
				
				
				var charsPerLine = this.CHARSPERLINE;
				if(tab[0].length>4 && tab[0][4] != null){
					charsPerLine = tab[0][4];
				}
				
				if(tab[0].length>3 && tab[0][3] != null && Object.prototype.toString.call(tab[0][3]) === '[object Function]'){
					content += tab[0][3](tab);
				}else{
					var cnt = 0;
					var ctrlnum = 0;
					for(var i=1;i<tab.length;i++){
					
						var c = tab[i];
						if(c[0]==0){
							//insert break
							content += "</tr>\n";
							if(c.length>2 && c[2]==true){
								content += "\n</table><table";
								if(tab[0].length>2){
									content += " class='"+tab[0][2]+"' ";
								}
								content += ">\n";
							}
							if(c.length>1 && c[1]!=""){
								content += "<tr><td class='smileyleft' colspan='"+charsPerLine+"'>"+c[1]+"</td></tr>";
							}
							cnt=0;
							continue;
						}else if(c[0]<0){
							//insert break
							content += "</tr>\n";
							if(c.length>2 && c[2]==true){
								content += "\n</table><table";
								if(tab[0].length>2){
									content += " class='"+tab[0][2]+"' ";
								}
								content += ">\n";
							}
							content += "<tr><td class='smileyleft' colspan='"+charsPerLine+"'>"+c[1];
							
							
							if(c[0] == -1){
								//skintone
								content += "<input type='radio' id='skinnone' name='skintone"+ctrlnum+"' value='' checked class='SmileySetSkin'><label for='skinnone'>&#x1f642;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='skinonetwo' name='skintone"+ctrlnum+"' value='&#x1F3FB;' class='SmileySetSkin'><label for='skinonetwo'>&#x1F3FB;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='skinthree' name='skintone"+ctrlnum+"' value='&#x1F3FC;' class='SmileySetSkin'><label for='skinthree'>&#x1F3FC;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='skinfour' name='skintone"+ctrlnum+"' value='&#x1F3FD;' class='SmileySetSkin'><label for='skinfour'>&#x1F3FD;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='skinfive' name='skintone"+ctrlnum+"' value='&#x1F3FE;' class='SmileySetSkin'><label for='skinfive'>&#x1F3FE;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='skinsix' name='skintone"+ctrlnum+"' value='&#x1F3FF;' class='SmileySetSkin'><label for='skinsix'>&#x1F3FF;</label> &nbsp; &nbsp; &nbsp;";
								
							}else if(c[0] == -2){
								//haircolor
								content += "<input type='radio' id='hairnone' name='haircolor"+ctrlnum+"' value='' checked class='SmileySetHair'><label for='hairnone'>&#x1f9D1;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='hairred' name='haircolor"+ctrlnum+"' value='&#x1F9B0;' class='SmileySetHair'><label for='hairred'><!--&#x1f9D1;-->&#x1F9B0;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='haircurl' name='haircolor"+ctrlnum+"' value='&#x1F9B1;' class='SmileySetHair'><label for='haircurl'><!--&#x1f9D1;-->&#x1F9B1;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='hairwhite' name='haircolor"+ctrlnum+"' value='&#x1F9B3;' class='SmileySetHair'><label for='hairwhite'><!--&#x1f9D1;-->&#x1F9B3;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='hairbald' name='haircolor"+ctrlnum+"' value='&#x1F9B2;' class='SmileySetHair'><label for='hairbald'><!--&#x1f9D1;-->&#x1F9B2;</label> &nbsp; &nbsp; &nbsp;";
								
								
							}else if(c[0] == -3){
								//gender
								content += "<input type='radio' id='gendernone' name='gender"+ctrlnum+"' value='0' checked class='SmileySetGender'><label for='hairnone'>&#x1F6AB;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='gendermale' name='gender"+ctrlnum+"' value='1' class='SmileySetGender'><label for='hairred'>&#x1F468;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='genderfemale' name='gender"+ctrlnum+"' value='2' class='SmileySetGender'><label for='haircurl'>&#x1F469;</label> &nbsp; &nbsp; &nbsp;";
							}else if(c[0] == -10){
								//build a family
								content += "<tr><td class='smileyleft' rowspan='1'>"+this.MAN+"</td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FB;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FC;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FD;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FE;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FF;</button></td>";
								
								content += "<td class='smileycenter' rowspan='20'>&nbsp;</td><td class='smileycenter' rowspan='20'><button id='buildafamily'>&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;</button>";
								content += "<br><button onclick='document.getElementById(\"buildafamily\").innerHTML=\"\"'>"+this.RESET+"</button></td></tr>";
								/*
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B0;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B1;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B3;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B2;</button></td>";
								content += "</tr>";
								*/
								
								content += "<tr><td class='smileyleft' rowspan='1'>"+this.WOMAN+"</td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FB;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FC;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FD;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FE;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FF;</button></td>";
								content += "</tr>";
								/*
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B0;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B1;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B3;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B2;</button></td>";
								content += "</tr>";
								*/
								
								content += "<tr><td class='smileyleft' rowspan='1'>"+this.GIRL+"</td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FB;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FC;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FD;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FE;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FF;</button></td>";
								content += "</tr>";
								/*
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FB;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FC;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FD;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FE;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FF;&#x200D;&#x1F9B0;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FB;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FC;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FD;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FE;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FF;&#x200D;&#x1F9B1;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FB;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FC;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FD;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FE;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FF;&#x200D;&#x1F9B3;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FB;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FC;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FD;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FE;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F467;&#x1F3FF;&#x200D;&#x1F9B2;</button></td>";
								content += "</tr>";
								*/
								
								content += "<tr><td class='smileyleft' rowspan='1'>"+this.BOY+"</td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FB;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FC;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FD;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FE;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FF;</button></td>";
								content += "</tr>";
								/*
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FB;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FC;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FD;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FE;&#x200D;&#x1F9B0;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FF;&#x200D;&#x1F9B0;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FB;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FC;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FD;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FE;&#x200D;&#x1F9B1;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FF;&#x200D;&#x1F9B1;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FB;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FC;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FD;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FE;&#x200D;&#x1F9B3;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FF;&#x200D;&#x1F9B3;</button></td>";
								content += "</tr>";
					
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FB;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FC;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FD;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FE;&#x200D;&#x1F9B2;</button></td>";
								content += "<td class='smileyleft'><button class='SmileyBuildFamily'>&#x1F466;&#x1F3FF;&#x200D;&#x1F9B2;</button></td>";
								content += "</tr>";
								*/
							}else if(c[0] == -11){
								//build a romance
								for(var j=1;j<3;j++){
									content += "<tr><td class='smileyleft' rowspan='2'>"+this.PERSON+" "+j+"</td>";//need to edit this rowspan when re-enabling hair color/type sections
									
									
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m0' name='lovekiss"+j+"' value='&#x1F468;' "
									if(j==1){
										content += " checked ";
									}
									content += "class='SmileySetLoveKiss'><label for='lovekiss"+j+"m0'>&#x1F468;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m1' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FB;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m1'>&#x1F468;&#x1F3FB;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m2' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FC;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m2'>&#x1F468;&#x1F3FC;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m3' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FD;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m3'>&#x1F468;&#x1F3FD;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m4' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FE;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m4'>&#x1F468;&#x1F3FE;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m5' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FF;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m5'>&#x1F468;&#x1F3FF;</label></td>";
									
									if(	j == 1) {
										content += "<td class='smileycenter' rowspan='20'>&nbsp;</td><td class='smileycenter' rowspan='20'><button id='buildlovekiss'>&#x1F468;&#x200D;&#x2764;&#xFE0F;&#x200D;&#x1F469;</button>";
										content += "</td>";
									}
									content += "</tr>";
									
									/*
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m01' name='lovekiss"+j+"' value='&#x1F468;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m01'>&#x1F468;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m11' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FB;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m11'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m21' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FC;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m21'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m31' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FD;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m31'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m41' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FE;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m41'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m51' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FF;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m51'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B0;</button></td>";
									content += "</tr>";
						
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m02' name='lovekiss"+j+"' value='&#x1F468;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m02'>&#x1F468;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m12' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FB;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m12'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m22' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FC;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m22'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m32' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FD;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m32'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m42' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FE;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m42'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m52' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FF;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m52'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B1;</button></td>";
									content += "</tr>";
						
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m03' name='lovekiss"+j+"' value='&#x1F468;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m03'>&#x1F468;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m13' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FB;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m13'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m23' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FC;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m23'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m33' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FD;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m33'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m43' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FE;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m43'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m53' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FF;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m53'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B3;</button></td>";
									content += "</tr>";
						
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m04' name='lovekiss"+j+"' value='&#x1F468;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m04'>&#x1F468;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m14' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FB;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m14'>&#x1F468;&#x1F3FB;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m24' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FC;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m24'>&#x1F468;&#x1F3FC;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m34' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FD;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m34'>&#x1F468;&#x1F3FD;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m44' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FE;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m44'>&#x1F468;&#x1F3FE;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"m54' name='lovekiss"+j+"' value='&#x1F468;&#x1F3FF;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"m54'>&#x1F468;&#x1F3FF;&#x200D;&#x1F9B2;</button></td>";
									content += "</tr>";
									*/
									
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f0' name='lovekiss"+j+"' value='&#x1F469;' ";
									if(j==2){
										content += " checked ";
									}
									content += "class='SmileySetLoveKiss'><label for='lovekiss"+j+"f0'>&#x1F469;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f1' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FB;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f1'>&#x1F469;&#x1F3FB;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f2' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FC;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f2'>&#x1F469;&#x1F3FC;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f3' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FD;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f3'>&#x1F469;&#x1F3FD;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f4' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FE;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f4'>&#x1F469;&#x1F3FE;</label></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f5' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FF;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f5'>&#x1F469;&#x1F3FF;</label></td>";
									content += "</tr>";
									
									/*
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f01' name='lovekiss"+j+"' value='&#x1F469;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f01'>&#x1F469;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f11' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FB;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f11'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f21' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FC;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f21'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f31' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FD;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f31'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f41' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FE;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f41'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B0;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f51' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FF;&#x200D;&#x1F9B0;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f51'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B0;</button></td>";
									content += "</tr>";
						
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f02' name='lovekiss"+j+"' value='&#x1F469;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f02'>&#x1F469;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f12' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FB;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f12'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f22' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FC;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f22'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f32' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FD;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f32'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f42' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FE;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f42'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B1;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f52' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FF;&#x200D;&#x1F9B1;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f52'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B1;</button></td>";
									content += "</tr>";
						
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f03' name='lovekiss"+j+"' value='&#x1F469;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f03'>&#x1F469;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f13' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FB;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f13'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f23' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FC;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f23'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f33' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FD;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f33'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f43' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FE;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f43'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B3;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f53' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FF;&#x200D;&#x1F9B3;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f53'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B3;</button></td>";
									content += "</tr>";
						
									content += "<tr>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f04' name='lovekiss"+j+"' value='&#x1F469;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f04'>&#x1F469;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f14' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FB;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f14'>&#x1F469;&#x1F3FB;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f24' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FC;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f24'>&#x1F469;&#x1F3FC;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f34' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FD;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f34'>&#x1F469;&#x1F3FD;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f44' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FE;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f44'>&#x1F469;&#x1F3FE;&#x200D;&#x1F9B2;</button></td>";
									content += "<td class='smileyleft'><input type='radio' id='lovekiss"+j+"f54' name='lovekiss"+j+"' value='&#x1F469;&#x1F3FF;&#x200D;&#x1F9B2;' class='SmileySetLoveKiss'><label for='lovekiss"+j+"f54'>&#x1F469;&#x1F3FF;&#x200D;&#x1F9B2;</button></td>";
									content += "</tr>";
									*/
								}
								
								content += "<tr><td class='smileyleft' colspan='6'>";
								content += "<input type='radio' id='lovekisstypelove' name='lovekiss3' value='&#x2764;&#xFE0F;' checked class='SmileySetLoveKiss'><label for='lovekisstypelove'>&#x2764;&#xFE0F;</label> &nbsp; &nbsp; &nbsp;";
								content += "<input type='radio' id='lovekisstypekiss' name='lovekiss3' value='&#x2764;&#xFE0F;&#x200D;&#x1F48B;' class='SmileySetLoveKiss'><label for='lovekisstypekiss'>&#x1F48B;</label> &nbsp; &nbsp; &nbsp;";
								content += "</tr>";
							}
							content += "</td></tr>";
							ctrlnum++;
							
							continue;
						}
					
						if(cnt%charsPerLine==0)
							content += "<tr>";
					
						content += "<td><button title='"+c[1]+"'"
						if(c.length>2){
							content += ' style="'+c[2]+'"';
						}
						content += ">";
						if(Object.prototype.toString.call(c[0]) === '[object Array]'){
							for(var k=0;k<c[0].length;k++){
								content += String.fromCodePoint(c[0][k]);
							}
						}else{
							content +=String.fromCodePoint(c[0]);
						}
						content +="</button></td>";
						
						if(cnt%charsPerLine==(charsPerLine-1))
							content += "</tr>\n";
						
						cnt++;
					}
				}
				content += "\n</table>";
				
				var ele = document.getElementById('smileycontent');
				if(ele!=null){
					ele.innerHTML = content;
					ele.scrollTop = 0;
					
					//add event listeners
					var eles = ele.getElementsByTagName('button');
					for(let but of eles){
						if( but.classList.contains('SmileyBuildFamily') ){
							but.addEventListener("click", Smiley.buildFamily, true);
						} else if( but.classList.contains('buttonemoji') ){
							but.addEventListener("click", Smiley.insertEmoji, true);
						} else if( !but.hasAttribute('onclick') ) {
							but.addEventListener("click", function(event){Smiley.insert(num,event)}, true);
						}
					}
					var eles = ele.getElementsByTagName('input');
					for(let inp of eles){
						if( inp.classList.contains('SmileySetSkin') ){
							inp.addEventListener("click", Smiley.setSkin, true);
						} else if( inp.classList.contains('SmileySetHair') ){
							inp.addEventListener("click", Smiley.setHair, true);
						} else if( inp.classList.contains('SmileySetGender') ){
							inp.addEventListener("click", Smiley.setGender, true);
						}else if( inp.classList.contains('SmileySetLoveKiss') ){
							inp.addEventListener("click", Smiley.buildLoveKiss, true);
						}
					}
				}

			},
			insert: function(num,event){
				var str;
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					if (event.target){ 
						str = event.target.innerHTML;
					}else if (event.srcElement){
						str = event.srcElement.innerHTML;
					}
				}
				
				if(this.callback!=null){
				
					if(this.callbackHtml){
						var ele = document.createElement("span");
						ele.innerHTML = str;
						var tabtitle = this.tabs[num][0]
						if(tabtitle.length >2){
							ele.className = tabtitle[2];
						}else{
							ele.className = "smiley";
						}
						this.callback(ele);
					}else if(this.callbackEntities){
						var strtemp = "";
						for(var i=0;i<str.length;i++){
							var val = str.codePointAt(i);
							if(val>0){
								strtemp+="&#x"+val.toString(16)+";";
								if(val>0xffff){
									i++;
								}
							}
						}
						this.callback(strtemp);
					}else{
						this.callback(str);
					}
				}
			},
			setSkin: function(event){
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					var ele = event.target;
					var src = ele;
					while(ele != null && ele.tagName.toLowerCase() != 'table'){
						ele = ele.parentNode;
					}
					if(ele!=null){
						var eles = ele.getElementsByTagName('button');
						for(let btn of eles){
							var text = btn.innerText;
							var height = btn.clientHeight;
							var width = btn.clientWidth;
							
							//first, remove old skin tone
							for(var i=0;i<text.length;i++){
								var val = text.codePointAt(i);
								if(val >= 0x1F3FB && val <= 0x1F3FF){
									text = text.substring(0,i)+text.substring(i+2);//fitzpatrick is 2 chars long
								}
								if(val > 0xFFFF)
									i++;//code points about this value are two characters long, so need to move one additional character;
							}
							var cleanText = text;
							//now add new
							if(text.length <= 2) {
								text += src.value;
							}else if(text.indexOf("\ud83d\udc66") > -1 ||
								text.indexOf("\ud83d\udc67") > -1 ||
								text.indexOf("\ud83d\udc68") > -1 ||
								text.indexOf("\ud83d\udc69") > -1 ){//man/woman/boy/girl + something
								text = text.replace(/\ud83d\udc66/g,"\ud83d\udc66"+src.value);
								text = text.replace(/\ud83d\udc67/g,"\ud83d\udc67"+src.value);
								text = text.replace(/\ud83d\udc68/g,"\ud83d\udc68"+src.value);
								text = text.replace(/\ud83d\udc69/g,"\ud83d\udc69"+src.value);
							}else if(src.value.length>0){
								text = text.substring(0,2) + src.value + text.substring(2);
							}
							btn.innerText = text;
							//check for size change and if so, undo
							if(btn.clientHeight > height*1.3 || btn.clientWidth > width*1.3){
								btn.innerText = cleanText;
							}
						}
					}
				}
			},
			setHair: function(event){
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					var ele = event.target;
					var src = ele;
					while(ele != null && ele.tagName.toLowerCase() != 'table'){
						ele = ele.parentNode;
					}
					if(ele!=null){
						var eles = ele.getElementsByTagName('button');
						for(let btn of eles){
							var text = btn.innerText;
							var height = btn.clientHeight;
							var width = btn.clientWidth;
							//first, remove old hair
							for(var i=0;i<text.length;i++){
								var val = text.codePointAt(i);
								if(val >= 0x1F9B0 && val <= 0x1F9B3){
									text = text.substring(0,i)+text.substring(i+2);//hair is 2 chars long
									if(text.charAt(i-1) == '\u200d'){
										text = text.substring(0,i-1)+text.substring(i);
									}
								}
								if(val > 0xFFFF)
									i++;//code points about this value are two characters long, so need to move one additional character;
							}
							var cleanText = text;
							//now add new
							if(text.length <= 2 || src.value.length>0){
								text += "&#x200d;" +src.value;
							}else if(text.indexOf("\ud83d\udc68") > -1 ){//man + something
								text = text.replace("\ud83d\udc68","\ud83d\udc68"+src.value);
							}else if(text.indexOf("\ud83d\udc69") > -1 ){//woman + something
								text = text.replace("\ud83d\udc69","\ud83d\udc69"+src.value);
							}else if(src.value.length>0){
								text = text.substring(0,2) + "&#x200d;" + src.value + text.substring(2);
							}
							btn.innerHTML = text;
							//check for size change and if so, undo
							if(btn.clientHeight > height*1.3 || btn.clientWidth > width*1.3){
								btn.innerText = cleanText;
							}
						}
					}
				}
			},
			setGender: function(event){
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					var ele = event.target;
					var src = ele;
					while(ele != null && ele.tagName.toLowerCase() != 'table'){
						ele = ele.parentNode;
					}
					if(ele!=null){
						var eles = ele.getElementsByTagName('button');
						for(let btn of eles){
							var text = btn.innerText;
							var height = btn.clientHeight;
							var width = btn.clientWidth;
							
							//first, remove old gender
							for(var i=0;i<text.length;i++){
								var val = text.codePointAt(i);
								if(val >= 0x2640 && val <= 0x2642){
									text = text.substring(0,i)+text.substring(i+1);
									if(text.charAt(i-1) == '\u200d'){
										text = text.substring(0,i-1)+text.substring(i);
									}
								}
								if(val >= 0x1F468 && val <= 0x1F469){
									text = text.substring(0,i)+text.substring(i+2);//man/woman is 2 chars long
									if(text.length>i && text.charAt(i) == '\u200d'){
										text = text.substring(0,i)+text.substring(i+1);
									}
								}
								if(val > 0xFFFF)
									i++;//code points about this value are two characters long, so need to move one additional character;
							}
							var cleanText = text;
							//now add new
							//this is a bit more complex than skin or hair, ans there are two different ways depending on the character
							if(src.value == 1){
								text += "&#x200D;&#x2642;";
							}else if(src.value == 2){
								text += "&#x200D;&#x2640;";
							}
							//if new is blank ('0'), need to remove fitzpatrick if it is first character
							if( text.indexOf("\ud83c\udffb") == 0 ||
									text.indexOf("\ud83c\udffc") == 0 ||
									text.indexOf("\ud83c\udffd") == 0 ||
									text.indexOf("\ud83c\udffe") == 0 ||
									text.indexOf("\ud83c\udfff") == 0 ){
								text = text.substring(2);
							}	
							btn.innerHTML = text;
							//check for size change and if so, undo
							if(btn.clientHeight > height*1.3 || btn.clientWidth > width*1.3){
								text = cleanText
								
								//try man or woman characters
								if(src.value == 1){
									text = "&#x1F468;&#x200D;"+text;
								}else if(src.value == 2){
									text = "&#x1F469;&#x200D;"+text;
								}
								btn.innerHTML = text;
								//check for size change and if so, undo
								if(btn.clientHeight > height*1.3 || btn.clientWidth > width*1.3){
									btn.innerText = cleanText;
								}
							}
						}
					}
				}
			},
			buildFamily: function(event){
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					var ele = event.target;
					var btn = document.getElementById('buildafamily');
					
					if(btn.innerHTML.length == 0){
						btn.innerHTML = ele.innerHTML;
					}else{
						btn.innerHTML = btn.innerHTML + "&#x200D;" + ele.innerHTML;
					}
				}
			},
			buildLoveKiss: function(event){
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					var ele = event.target;
					var btn = document.getElementById('buildlovekiss');
					var str = "";
					
					var radios = document.getElementsByName('lovekiss1');
					for (var i = 0, length = radios.length; i < length; i++){
						if (radios[i].checked){
							str += radios[i].value;
							break;
						}
					}
					str+="&#x200D;";
					radios = document.getElementsByName('lovekiss3');
					for (var i = 0, length = radios.length; i < length; i++){
						if (radios[i].checked){
							str += radios[i].value;
						}
					}
					str+="&#x200D;";
					radios = document.getElementsByName('lovekiss2');
					for (var i = 0, length = radios.length; i < length; i++){
						if (radios[i].checked){
							str += radios[i].value;
						}
					}
					
					btn.innerHTML = str;
				}
			},
			insertEmoji: function(event){
				var str;
				var ele = null;
				if(event==null){
					event = window.event;
				}
				if(event!=null){
					if (event.target){ 
						str = event.target.title;
						if(event.target.tagName=='BUTTON'){
							ele = event.target.getElementsByTagName('span')[0];
						}else{
							ele = event.target;
						}
					}else if (event.srcElement){
						str = event.srcElement.title;
						if(event.srcElement.tagName=='BUTTON'){
							ele = event.srcElement.getElementsByTagName('span')[0];
						}else{
							ele = event.srcElement;
						}
					}
					if(ele!=null){
						ele = ele.cloneNode(true);
					}
				}
				
				if(Smiley.callback!=null){
				
					if(Smiley.callbackHtml){
						Smiley.callback(ele);
					}else if(Smiley.callbackEntities){
						str = ele.innerHTML;
						var strtemp = "";
						for(var i=0;i<str.length;i++){
							var val = str.codePointAt(i);
							if(val>0){
								strtemp+="&#x"+val.toString(16)+";";
								if(val>0xffff){
									i++;
								}
							}
						}
						Smiley.callback(strtemp);
					}else{
						Smiley.callback(":"+str+":");
					}
				}
			},
			getEmojiHtml: function(emoji){
				var newclass = "smiley";
				var style = "";
				var value = "";
				
				if(emoji==null){
					 style = newclass;   
				}
				
				if(emoji.length>3){
					style = emoji[3];
				}
				if(emoji.length>4){
					newclass = emoji[4];
				}
				if(emoji.length>5){
					value = emoji[5];
				}
				var ch = "";
				if(emoji[2].constructor === Array){
					var chars = emoji[2];
					for(var k=0;k<chars.length;k++){
						ch+=String.fromCodePoint(chars[k]);
					}
				}else{
					ch = String.fromCodePoint(emoji[2]);
				}
				var rep = "<span class='emoji "+newclass+"' title='"+emoji[1]+"'"+
					((style.length>0)?" style='"+style+"'":"") +
					((value.length>0)?" value='"+value+"' character='"+ch+"'":"") +
					">"+ch+"</span>";
				return rep;
			},
			escapeRegex: function(str) {
				return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
			},
			//dragable div code
			titleClick: function(e){
				if(e==null){
					e = window.event;
				}
				Smiley.dragX = e.clientX;
				Smiley.dragY = e.clientY;
				var ele = document.getElementById("smileycontainer");
				if(ele!=null){
					Smiley.dragTop = parseInt(ele.style.top, 10);
					Smiley.dragLeft = parseInt(ele.style.left, 10);
					document.onmousemove = function(e) {
						if(e==null){
							e = window.event;
						}
						ele.style.left = Smiley.dragLeft + (e.clientX - Smiley.dragX)+'px'
						ele.style.top = Smiley.dragTop + (e.clientY - Smiley.dragY)+'px'
					}
					ele.onmouseup = function() {
						document.onmousemove = null
					}
				}
			},
			titleDrag: function() { return false }

			/*
			Combining Diacriticals
			0x0300 - 0x036f
			0x1DC0 - 0x1DE6  0x1DFC - 0x1DFF
			0x20D0 - 0x20F0
			0xFE20 - 0xFE26
			*/
		};
		
		
		//unicode 6.0
		/*
		Explaination of below:
		Each array represents one tab in the picker. 
		The first line is the character and name of the tab. This can have a third
		entry which specifies the class to use for the characters on that tab (needed
		if a special font needs to be used for them).
		All the other entries are characters on the tab. The unicode value followed by
		the name.  Instead of a unicode value, an array of unicode values can be 
		specified if more than one codepoint is needed to represent the character.
		There are a few special cases if the value is < 1:
		0: This ends the current row, and if the string isn't empty, optionally adds 
		a title before the next row. Additionally, these title rows can have a third 
		parameter that if true will start a new table. This is usefull for sections 
		with wide characters that would throw off the spaceing of the rest of the 
		buttons (see Long Arrows). For these, a fourth parameter can specify the new
		number of characters per line.
		-1: This adds a selecter for emoji fitzpatrick selection. The modifier for 
		skin tone will be attempted to be added to all buttons in the current table, 
		but will be removed if this results in the button getting bigger (ie. not 
		supported for that character).
		-2: This adds a selecter for emoji hair type modifier. It is attempted to be
		added to all buttons in the current table, but removed if it makes the button
		bigger. In Windows, this appears only to effect two emoji.
		-3: This adds a selector that allows gender to be specified for certain emoji.
		The modifier for gender will be attempted to be added to all buttons in the 
		current table, but will be removed if this results in the button getting bigger 
		(ie. not supported for that character).
		-10: This adds a control that allows a 'family' emoji to be build with a 
		combination of man, woman, girl and boy emoji with different skin tones applied
		to each. Clicking the buttons of this control will add family members to the 
		'main' button on the right, while clicking the main button will output the 
		codepoints for that family. Pressing reset will clear the current family to build
		a new one.  Typically, 1-2 parents are specified followed by 1-2 children; other
		orders / amounts of people may not be supported by the OS, but should render 
		somewhat sensabily.  This does contain commented out code for hair style support,
		but this does not currently work correctly on windows as it doesn't support
		hair style for the characters that make up a family.
		-20: This add a control to build a custom love / kiss emoji, allowing specifying
		the skin tones for any combination of men or women with a heart between them, 
		with either normal faces or kissing faces. There is commented out code for
		specifying hair colors, but this is currently not support by window's renderer.

		To add a new tab, the loadedLocalization() method needs to be modified. This 
		is called at the bottom of this file, after all the strings are set, and it
		actually builds the final array that is used to make the smiley window.

		*/

		Smiley.alltabs.Smileys = new Array(
			[ 0x1F60A , "Smileys"],
			
			[ 0x1F600 , "GRINNING FACE"],
			[ 0x1F601 , "GRINNING FACE WITH SMILING EYES"],
			[ 0x1F602 , "FACE WITH TEARS OF JOY"],
			[ 0x1F603 , "SMILING FACE WITH OPEN MOUTH"],
			[ 0x263A ,  "SMILING FACE"],
			[ 0x1F604 , "SMILING FACE WITH OPEN MOUTH AND SMILING EYES"],
			[ 0x1F605 , "SMILING FACE WITH OPEN MOUTH AND COLD SWEAT"],
			[ 0x1F606 , "SMILING FACE WITH OPEN MOUTH AND TIGHTLY-CLOSED EYES"],
			[ 0x1F607 , "SMILING FACE WITH HALO"],
			[ 0x1F608 , "SMILING FACE WITH HORNS"],
			[ 0x1F609 , "WINKING FACE"],
			[ 0x1F60A , "SMILING FACE WITH SMILING EYES"],
			[ 0x1F60B , "FACE SAVOURING DELICIOUS FOOD"],
			[ 0x1F60C , "RELIEVED FACE"],
			[ 0x1F60D , "SMILING FACE WITH HEART-SHAPED EYES"],
			[ 0x1F60E , "SMILING FACE WITH SUNGLASSES"],
			[ 0x1F60F , "SMIRKING FACE"],
			[ 0x1F610 , "NEUTRAL FACE"],
			[ 0x1F611 , "EXPRESSIONLESS FACE"],
			[ 0x1F612 , "UNAMUSED FACE"],
			[ 0x1F613 , "FACE WITH COLD SWEAT"],
			[ 0x1F614 , "PENSIVE FACE"],
			[ 0x1F615 , "CONFUSED FACE"],
			[ 0x1F616 , "CONFOUNDED FACE"],
			[ 0x1F617 , "KISSING FACE"],
			[ 0x1F618 , "FACE THROWING A KISS"],
			[ 0x1F619 , "KISSING FACE WITH SMILING EYES"],
			[ 0x1F61A , "KISSING FACE WITH CLOSED EYES"],
			[ 0x1F61B , "FACE WITH STUCK-OUT TONGUE"],
			[ 0x1F61C , "FACE WITH STUCK-OUT TONGUE AND WINKING EYE"],
			[ 0x1F61D , "FACE WITH STUCK-OUT TONGUE AND TIGHTLY-CLOSED EYES"],
			[ 0x1F61E , "DISAPPOINTED FACE"],
			[ 0x2639 ,  "FROWNING FACE"],
			[ 0x1F61F , "WORRIED FACE"],
			[ 0x1F620 , "ANGRY FACE"],
			[ 0x1F621 , "POUTING FACE"],
			[ 0x1F622 , "CRYING FACE"],
			[ 0x1F623 , "PERSEVERING FACE"],
			[ 0x1F624 , "FACE WITH LOOK OF TRIUMPH"],
			[ 0x1F625 , "DISAPPOINTED BUT RELIEVED FACE"],
			[ 0x1F626 , "FROWNING FACE WITH OPEN MOUTH"],
			[ 0x1F627 , "ANGUISHED FACE"],
			[ 0x1F628 , "FEARFUL FACE"],
			[ 0x1F629 , "WEARY FACE"],
			[ 0x1F62A , "SLEEPY FACE"],
			[ 0x1F62B , "TIRED FACE"],
			[ 0x1F62C , "GRIMACING FACE"],
			[ 0x1F62D , "LOUDLY CRYING FACE"],
			[ 0x1F62E , "FACE WITH OPEN MOUTH"],
			[ 0x1F62F , "HUSHED FACE"],
			[ 0x1F630 , "FACE WITH OPEN MOUTH AND COLD SWEAT"],
			[ 0x1F631 , "FACE SCREAMING IN FEAR"],
			[ 0x1F632 , "ASTONISHED FACE"],
			[ 0x1F633 , "FLUSHED FACE"],
			[ 0x1F634 , "SLEEPING FACE"],
			[ 0x1F635 , "DIZZY FACE"],
			[ 0x1F636 , "FACE WITHOUT MOUTH"],
			[ 0x1F637 , "FACE WITH MEDICAL MASK"],
			[ 0 , "Cat faces" ],
			[ 0x1F638 , "GRINNING CAT FACE WITH SMILING EYES"],
			[ 0x1F639 , "CAT FACE WITH TEARS OF JOY"],
			[ 0x1F63A , "SMILING CAT FACE WITH OPEN MOUTH"],
			[ 0x1F63B , "SMILING CAT FACE WITH HEART-SHAPED EYES"],
			[ 0x1F63C , "CAT FACE WITH WRY SMILE"],
			[ 0x1F63D , "KISSING CAT FACE WITH CLOSED EYES"],
			[ 0x1F63E , "POUTING CAT FACE"],
			[ 0x1F63F , "CRYING CAT FACE"],
			[ 0x1F640 , "WEARY CAT FACE"],
			[ 0 , "Gestures" ],
			[ 0x1F645 , "FACE WITH NO GOOD GESTURE"],
			[ 0x1F646 , "FACE WITH OK GESTURE"],
			[ 0x1F647 , "PERSON BOWING DEEPLY"],
			[ 0x1F648 , "SEE-NO-EVIL MONKEY"],
			[ 0x1F649 , "HEAR-NO-EVIL MONKEY"],
			[ 0x1F64A , "SPEAK-NO-EVIL MONKEY"],
			[ 0x1F64B , "HAPPY PERSON RAISING ONE HAND"],
			[ 0x1F64C , "PERSON RAISING BOTH HANDS IN CELEBRATION"],
			[ 0x1F64D , "PERSON FROWNING"],
			[ 0x1F64E , "PERSON WITH POUTING FACE"],
			[ 0x1F64F , "PERSON WITH FOLDED HANDS"],
			[ 0 , "" ],
			[ 0x2322 , "FROWN"],
			[ 0x2323 , "SMILE"],
		);

		Smiley.alltabs.Transport = new Array(
			[ 0x1F697 , "Transport"],
			
			[ 0x1F680 , "ROCKET"],
			[ 0x1F681 , "HELICOPTER"],
			[ 0x2708 ,  "AIRPLANE"],
			[ 0x1F682 , "STEAM LOCOMOTIVE"],
			[ 0x1F683 , "RAILWAY CAR"],
			[ 0x1F684 , "HIGH-SPEED TRAIN"],
			[ 0x1F685 , "HIGH-SPEED TRAIN WITH BULLET NOSE"],
			[ 0x1F686 , "TRAIN"],
			[ 0x1F687 , "METRO"],
			[ 0x1F688 , "LIGHT RAIL"],
			[ 0x1F689 , "STATION"],
			[ 0x1F68A , "TRAM"],
			[ 0x1F68B , "TRAM CAR"],
			[ 0x1F68C , "BUS"],
			[ 0x1F68D , "ONCOMING BUS"],
			[ 0x1F68E , "TROLLEYBUS"],
			[ 0x1F68F , "BUS STOP"],
			[ 0x1F690 , "MINIBUS"],
			[ 0x1F6B2 , "BICYCLE"],
			[ 0x1F691 , "AMBULANCE"],
			[ 0x1F692 , "FIRE ENGINE"],
			[ 0x1F693 , "POLICE CAR"],
			[ 0x1F694 , "ONCOMING POLICE CAR"],
			[ 0x1F695 , "TAXI"],
			[ 0x1F696 , "ONCOMING TAXI"],
			[ 0x1F697 , "AUTOMOBILE"],
			[ 0x1F698 , "ONCOMING AUTOMOBILE"],
			[ 0x1F699 , "RECREATIONAL VEHICLE"],
			[ 0x1F69A , "DELIVERY TRUCK"],
			[ 0x26DF , "TRUCK"],
			[ 0x1F69B , "ARTICULATED LORRY"],
			[ 0x1F69C , "TRACTOR"],
			[ 0x1F69D , "MONORAIL"],
			[ 0x1F69E , "MOUNTAIN RAILWAY"],
			[ 0x1F69F , "SUSPENSION RAILWAY"],
			[ 0x1F6A0 , "MOUNTAIN CABLEWAY"],
			[ 0x1F6A1 , "AERIAL TRAMWAY"],
			[ 0x1F6A2 , "SHIP"],
			[ 0x26F4 ,  "FERRY"],
			[ 0x1F6A3 , "ROWBOAT"],
			[ 0x26F5 ,  "SAILBOAT"],
			[ 0x1F6A4 , "SPEEDBOAT"],
		);

		Smiley.alltabs.Signs = new Array(
			[ 0x1F6A9 , "Signs and Symbols"],
			[ 0x1F6A5 , "HORIZONTAL TRAFFIC LIGHT"],
			[ 0x1F6A6 , "VERTICAL TRAFFIC LIGHT"],
			[ 0x1F6A7 , "CONSTRUCTION SIGN"],
			[ 0x1F6A8 , "POLICE CARS REVOLVING LIGHT"],
			[ 0x1F6A9 , "TRIANGULAR FLAG ON POST"],
			[ 0x26F3 ,  "FLAG IN HOLE"],
			[ 0x1F6AA , "DOOR"],
			[ 0x1F6AB , "NO ENTRY SIGN"],
			[ 0x26D4 ,  "NO ENTRY"],
			[ 0x1F6AC , "SMOKING SYMBOL"],
			[ 0x1F6AD , "NO SMOKING SYMBOL"],
			[ 0x1F6AE , "PUT LITTER IN ITS PLACE SYMBOL"],
			[ 0x1F6AF , "DO NOT LITTER SYMBOL"],
			[ 0x1F6B0 , "POTABLE WATER SYMBOL"],
			[ 0x1F6B1 , "NON-POTABLE WATER SYMBOL"],
			[ 0x1F6B2 , "BICYCLE"],
			[ 0x1F6B3 , "NO BICYCLES"],
			[ 0x1F6B4 , "BICYCLIST"],
			[ 0x1F6B5 , "MOUNTAIN BICYCLIST"],
			[ 0x1F6B6 , "PEDESTRIAN"],
			[ 0x1F6B7 , "NO PEDESTRIANS"],
			[ 0x1F6B8 , "CHILDREN CROSSING"],
			[ 0x1F6B9 , "MENS SYMBOL"],
			[ 0x1F6BA , "WOMENS SYMBOL"],
			[ 0x1F6BB , "RESTROOM"],
			[ 0x1F6BC , "BABY SYMBOL"],
			[ 0x1F6BD , "TOILET"],
			[ 0x1F6BE , "WATER CLOSET"],
			[ 0x1F6BF , "SHOWER"],
			[ 0x1F6C0 , "BATH"],
			[ 0x1F6C1 , "BATHTUB"],
			[ 0x1F6C2 , "PASSPORT CONTROL"],
			[ 0x1F6C3 , "CUSTOMS"],
			[ 0x1F6C4 , "BAGGAGE CLAIM"],
			[ 0x1F6C5 , "LEFT LUGGAGE"],
			[ 0x2706 , "TELEPHONE LOCATION SIGN"],
			[ 0x267F , "WHEELCHAIR SYMBOL"],
			
			[ 0 , "Cultural Symbols" ], 
			[ 0x1F5FB , "MOUNT FUJI"],
			[ 0x1F5FC , "TOYKO TOWER"],
			[ 0x1F5FD , "STATUE OF LIBERTY"],
			[ 0x1F5FE , "SILHOUETTE OF JAPAN"],
			[ 0x1F5FF , "MOYAI"],

		);


		Smiley.alltabs.Weather = new Array(
			[ 0x1F305 , "Weather, Landscape and Sky"],

			[ 0x1F300 , "CYCLONE"],
			[ 0x26C6 , "RAIN"],
			[ 0x1F301 , "FOGGY"],
			[ 0x2602 ,  "UMBRELLA"],
			[ 0x2614 ,  "UMBRELLA WITH RAIN DROPS"],
			[ 0x1F302 , "CLOSED UMBRELLA"],
			[ 0x2601 ,  "CLOUD"],
			[ 0x26C5 ,  "SUN BEHIND CLOUD"],
			[ 0x2603 ,  "SNOWMAN"],
			[ 0x26C4 ,  "SNOWMAN WITHOUT SNOW"],
			[ 0x26C7 ,  "BLACK SNOWMAN"],
			[ 0x2607 ,  "LIGHTNING"],
			[ 0x2608 ,  "THUNDERSTORM"],
			[ 0x26C8 ,  "THUNDER CLOUD AND RAIN"],
			[ 0x1F303 , "NIGHT WITH STARS"],
			[ 0x1F304 , "SUNRISE OVER MOUNTAINS"],
			[ 0x1F305 , "SUNRISE"],
			[ 0x1F306 , "CITYSCAPE AT DUSK"],
			[ 0x1F307 , "SUNSET OVER BUILDINGS"],
			[ 0x1F308 , "RAINBOW"],
			[ 0x1F309 , "BRIDGE AT NIGHT"],
			[ 0x1F30A , "WATER WAVE"],
			[ 0x1F30B , "VOLCANO"],
			[ 0x1F30C , "MILKY WAY"],
			[ 0 , "Globes" ],  
			[ 0x1F30D , "EARTH GLOBE EUROPE-AFRICA"],
			[ 0x1F30E , "EARTH GLOBE AMERICAS"],
			[ 0x1F30F , "EARTH GLOBE ASIA-AUSTRALIA"],
			[ 0x1F310 , "GLOBE WITH MERIDIANS"],
			[ 0 , "Astronomy" ],  
			[ 0x1F311 , "NEW MOON SYMBOL"],
			[ 0x1F312 , "WAXING CRESCENT MOON SYMBOL"],
			[ 0x1F313 , "FIRST QUARTER MOON SYMBOL"],
			[ 0x1F314 , "WAXING GIBBOUS MOON SYMBOL"],
			[ 0x1F315 , "FULL MOON SYMBOL"],
			[ 0x1F316 , "WANING GIBBOUS MOON SYMBOL"],
			[ 0x1F317 , "LAST QUARTER MOON SYMBOL"],
			[ 0x1F318 , "WANING CRESCENT MOON SYMBOL"],
			[ 0x1F319 , "CRESCENT MOON"],
			[ 0x263D ,  "FIRST QUARTER MOON"],
			[ 0x263E ,  "LAST QUARTER MOON"],
			[ 0x1F31A , "NEW MOON WITH FACE"],
			[ 0x1F31B , "FIRST QUARTER MOON WITH FACE"],
			[ 0x1F31C , "LAST QUARTER MOON WITH FACE"],
			[ 0x1F31D , "FULL MOON WITH FACE"],
			[ 0x1F31E , "SUN WITH FACE"],
			[ 0x1F31F , "GLOWING STAR"],
			[ 0x1F320 , "SHOOTING STAR"],
			[ 0x2604 ,  "COMET"],
			[ 0x2605 ,  "BLACK STAR"],
			[ 0x2606 ,  "WHITE STAR"],
			[ 0x2600 ,  "BLACK SUN WITH RAYS"],
			[ 0x263C ,  "WHITE SUN WITH RAYS"],
			[ 0 , "" ],
			[ 0x2609 ,  "SUN"],
			[ 0x260A ,  "ASCENDING NODE"],
			[ 0x260B ,  "DESCENDING NODE"],
			[ 0x260C ,  "CONJUNCTION"],
			[ 0x260D ,  "OPPOSITION"],

		);	  
			 

		Smiley.alltabs.Plants = new Array(
			[ 0x1F33F , "Plants"],	 

			[ 0x1F330 , "CHESTNUT"],
			[ 0x1F331 , "SEEDLING"],
			[ 0x1F332 , "EVERGREEN TREE"],
			[ 0x1F333 , "DECIDUOUS TREE"],
			[ 0x1F334 , "PALM TREE"],
			[ 0x1F335 , "CACTUS"],
			/*  <td title="reserved" bgcolor="#CCCCCC"></td>*/
			[ 0x1F337 , "TULIP"],
			[ 0x2698 ,  "FLOWER"],
			[ 0x1F338 , "CHERRY BLOSSOM"],
			[ 0x1F339 , "ROSE"],
			[ 0x1F33A , "HIBISCUS"],
			[ 0x1F33B , "SUNFLOWER"],
			[ 0x1F33C , "BLOSSOM"],
			[ 0x1F33D , "EAR OF MAIZE"],
			[ 0x1F33E , "EAR OF RICE"],
			[ 0x1F33F , "HERB"],
			[ 0x1F340 , "FOUR LEAF CLOVER"],
			[ 0x2618 ,  "SHAMROCK"],
			[ 0x1F341 , "MAPLE LEAF"],
			[ 0x1F342 , "FALLEN LEAF"],
			[ 0x1F343 , "LEAF FLUTTERING IN WIND"],
			[ 0x1F344 , "MUSHROOM"],
			[ 0x2767 ,  "ROTATED FLORAL HEART BULLET"],
			[ 0x2619 ,  "REVERSE ROTATED FLORAL HEART BULLET"],
			[ 0 , "Fruits and Vegetables" ],  
			[ 0x1F345 , "TOMATO"],
			[ 0x1F346 , "AUBERGINE"],
			[ 0x1F347 , "GRAPES"],
			[ 0x1F348 , "MELON"],
			[ 0x1F349 , "WATERMELON"],
			[ 0x1F34A , "TANGERINE"],
			[ 0x1F34B , "LEMON"],
			[ 0x1F34C , "BANANA"],
			[ 0x1F34D , "PINEAPPLE"],
			[ 0x1F34E , "RED APPLE"],
			[ 0x1F34F , "GREEN APPLE"],
			[ 0x1F350 , "PEAR"],
			[ 0x1F351 , "PEACH"],
			[ 0x1F352 , "CHERRIES"],
			[ 0x1F353 , "STRAWBERRY"],
			  
			
		);	  
			 

		Smiley.alltabs.Food = new Array(
			[ 0x1F354 , "Food and Drink"],	 	
			  
			[ 0x1F354 , "HAMBURGER"],
			[ 0x1F355 , "SLICE OF PIZZA"],
			[ 0x1F356 , "MEAT ON BONE"],
			[ 0x1F357 , "POULTRY LEG"],
			[ 0x1F358 , "RICE CRACKER"],
			[ 0x1F359 , "RICE BALL"],
			[ 0x1F35A , "COOKED RICE"],
			[ 0x1F35B , "CURRY AND RICE"],
			[ 0x1F35C , "STEAMING BOWL"],
			[ 0x1F35D , "SPAGHETTI"],
			[ 0x1F35E , "BREAD"],
			[ 0x1F35F , "FRENCH FRIES"],
			[ 0x1F360 , "ROASTED SWEET POTATO"],
			[ 0x1F361 , "DANGO"],
			[ 0x1F362 , "ODEN"],
			[ 0x1F363 , "SUSHI"],
			[ 0x1F364 , "FRIED SHRIMP"],
			[ 0x1F365 , "FISH CAKE WITH SWIRL DESIGN"],
			[ 0x1F366 , "SOFT ICE CREAM"],
			[ 0x1F367 , "SHAVED ICE"],
			[ 0x1F368 , "ICE CREAM"],
			[ 0x1F369 , "DOUGHNUT"],
			[ 0x1F36A , "COOKIE"],
			[ 0x1F36B , "CHOCOLATE BAR"],
			[ 0x1F36C , "CANDY"],
			[ 0x1F36D , "LOLLIPOP"],
			[ 0x1F36E , "CUSTARD"],
			[ 0x1F36F , "HONEY POT"],
			[ 0x1F370 , "SHORTCAKE"],
			[ 0x1F371 , "BENTO BOX"],
			[ 0x1F372 , "POT OF FOOD"],
			[ 0x1F373 , "COOKING"],
			[ 0x1F374 , "FORK AND KNIFE"],
			[ 0 , "Beverages" ],  
			[ 0x1F375 , "TEACUP WITHOUT HANDLE"],
			[ 0x2615 ,  "HOT BEVERAGE"],
			[ 0x26FE ,  "CUP ON BLOACK SQUARE"],
			[ 0x1F376 , "SAKE BOTTLE AND CUP"],
			[ 0x1F377 , "WINE GLASS"],
			[ 0x1F378 , "COCKTAIL GLASS"],
			[ 0x1F379 , "TROPICAL DRINK"],
			[ 0x1F37A , "BEER MUG"],
			[ 0x1F37B , "CLINKING BEER MUGS"],
			[ 0x1F37C , "BABY BOTTLE"],

		);	  
			 

		Smiley.alltabs.Entertain = new Array(
			[ 0x1F381 , "Entertainment and Celebration"],	 	  
			  
			[ 0x1F380 , "RIBBON"],
			[ 0x1F381 , "WRAPPED PRESENT"],
			[ 0x1F4E6 , "PACKAGE"],
			[ 0x1F382 , "BIRTHDAY CAKE"],
			[ 0x1F383 , "JACK-O-LANTERN"],
			[ 0x1F384 , "CHRISTMAS TREE"],
			[ 0x1F385 , "FATHER CHRISTMAS"],
			[ 0x1F386 , "FIREWORKS"],
			[ 0x1F387 , "FIREWORK SPARKLER"],
			[ 0x1F388 , "BALLOON"],
			[ 0x1F389 , "PARTY POPPER"],
			[ 0x1F38A , "CONFETTI BALL"],
			[ 0x1F38B , "TANABATA TREE"],
			[ 0x1F38C , "CROSSED FLAGS"],
			[ 0x1F38D , "PINE DECORATION"],
			[ 0x1F38E , "JAPANESE DOLLS"],
			[ 0x1F38F , "CARP STREAMER"],
			[ 0x1F390 , "WIND CHIME"],
			[ 0x1F391 , "MOON VIEWING CEREMONY"],
			[ 0x1F392 , "SCHOOL SATCHEL"],
			[ 0x1F393 , "GRADUATION CAP"],
			[ 0 , "" ],
			[ 0x1F3A0 , "CAROUSEL HORSE"],
			[ 0x1F3A1 , "FERRIS WHEEL"],
			[ 0x1F3A2 , "ROLLER COASTER"],
			[ 0x1F3A3 , "FISHING POLE AND FISH"],
			[ 0x1F3A4 , "MICROPHONE"],
			[ 0x1F3A5 , "MOVIE CAMERA"],
			[ 0x1F3A6 , "CINEMA"],
			[ 0x1F3A7 , "HEADPHONE"],
			[ 0x1F3A8 , "ARTIST PALETTE"],
			[ 0x1F3A9 , "TOP HAT"],
			[ 0x1F3AA , "CIRCUS TENT"],
			[ 0x1F3AB , "TICKET"],
			[ 0x1F3AC , "CLAPPER BOARD"],
			[ 0x1F3AD , "PERFORMING ARTS"],	
			[ 0 , "Music" ],
			[ 0x1F3B5 , "MUSICAL NOTE"],
			[ 0x2669 ,  "QUARTER NOTE"],
			[ 0x266A ,  "EIGHTH NOTE"],
			[ 0x266B ,  "BEAMED EIGHTH NOTES"],
			[ 0x266C ,  "BEAMED SIXTEENTH NOTES"],
			[ 0x1F3B6 , "MULTIPLE MUSICAL NOTES"],
			[ 0x266D ,  "MUSIC FLAT SIGN"],
			[ 0x266E ,  "MUSIC NATURAL SIGN"],
			[ 0x266F ,  "MUSIC SHARP SIGN"],
			[ 0x1F3B7 , "SAXOPHONE"],
			[ 0x1F3B8 , "GUITAR"],
			[ 0x1F3B9 , "MUSICAL KEYBOARD"],
			[ 0x1F3BA , "TRUMPET"],
			[ 0x1F3BB , "VIOLIN"],
			[ 0x1F3BC , "MUSICAL SCORE"],
			//[ 0x1D11E , "MUSICAL SYMBOL G CLEF"],
			  
			  
		);	  

		Smiley.alltabs.Games = new Array(
			[ 0x265F , "Game Symbols"],
			
			[ 0x1F3AE , "VIDEO GAME"],
			[ 0x1F3AF , "DIRECT HIT"],
			[ 0x1F3B0 , "SLOT MACHINE"],
			[ 0x1F3B1 , "BILLIARDS"],
			[ 0x1F3B2 , "GAME DIE"],
			[ 0x1F3B3 , "BOWLING"],
			[ 0x1F3B4 , "FLOWER PLAYING CARDS"],
			[ 0x270A , "ROCK"],
			[ 0x270B , "PAPER"],
			[ 0x270C , "SCISSORS"],
			[ 0 , "Board Games" ],
			[ 0x2616 , "WHITE SHOGI PIECE" ],
			[ 0x2617 , "BLACK SHOGI PIECE" ],
			[ 0x26C9 , "TURNED WHITE SHOGI PIECE" ],
			[ 0x26CA , "TURNED BLACK SHOGI PIECE" ],
			[ 0x26CB , "WHITE DIAMOND IN SQUARE" ],
			[ 0x2680 , "DIE FACE-1" ],
			[ 0x2681 , "DIE FACE-2" ],
			[ 0x2682 , "DIE FACE-3" ],
			[ 0x2683 , "DIE FACE-4" ],
			[ 0x2684 , "DIE FACE-5" ],
			[ 0x2685 , "DIE FACE-6" ],
			[ 0x2686 , "WHITE CIRCLE WITH DOT RIGHT" ],
			[ 0x2687 , "WHITE CIRCLE WITH TWO DOTS" ],
			[ 0x2688 , "BLACK CIRCLE WITH WHITE DOT RIGHT" ],
			[ 0x2689 , "BLACK CIRCLE WITH TWO WHITE DOTS" ],
			[ 0x26C0 , "WHITE DRAUGHTS MAN" ],
			[ 0x26C1 , "WHITE DRAUGHTS KING" ],
			[ 0x26C2 , "BLACK DRAUGHTS MAN" ],
			[ 0x26C3 , "BLACK DRAUGHTS KING" ],
			[ 0x2654 , "WHITE CHESS KING" ],
			[ 0x2655 , "WHITE CHESS QUEEN" ],
			[ 0x2656 , "WHITE CHESS ROOK" ],
			[ 0x2657 , "WHITE CHESS BISHOP" ],
			[ 0x2658 , "WHITE CHESS KNIGHT" ],
			[ 0x2659 , "WHITE CHESS PAWN" ],
			[ 0x265A , "BLACK CHESS KING" ],
			[ 0x265B , "BLACK CHESS QUEEN" ],
			[ 0x265C , "BLACK CHESS ROOK" ],
			[ 0x265D , "BLACK CHESS BISHOP" ],
			[ 0x265E , "BLACK CHESS KNIGHT" ],
			[ 0x265F , "BLACK CHESS PAWN" ],
			
			[ 0 , "Playing Cards" ],
			[ 0x2660 , "BLACK SPADE SUIT" ],
			[ 0x2663 , "BLACK CLUB SUIT" ],
			[ 0x2665 , "BLACK HEART SUIT" ],
			[ 0x2666 , "BLACK DIAMOND SUIT" ],
			[ 0x2664 , "WHITE SPADE SUIT" ],
			[ 0x2667 , "WHITE CLUB SUIT" ],
			[ 0x2661 , "WHITE HEART SUIT" ],
			[ 0x2662 , "WHITE DIAMOND SUIT" ],
			
			[ 0x1F0A0 , "PLAYING CARD BACK" ],
			
			[ 0x1F0A1 , "PLAYING CARD ACE OF SPADES" ],
			[ 0x1F0A2 , "PLAYING CARD TWO OF SPADES" ],
			[ 0x1F0A3 , "PLAYING CARD THREE OF SPADES" ],
			[ 0x1F0A4 , "PLAYING CARD FOUR OF SPADES" ],
			[ 0x1F0A5 , "PLAYING CARD FIVE OF SPADES" ],
			[ 0x1F0A6 , "PLAYING CARD SIX OF SPADES" ],
			[ 0x1F0A7 , "PLAYING CARD SEVEN OF SPADES" ],
			[ 0x1F0A8 , "PLAYING CARD EIGHT OF SPADES" ],
			[ 0x1F0A9 , "PLAYING CARD NINE OF SPADES" ],
			[ 0x1F0AA , "PLAYING CARD TEN OF SPADES" ],
			[ 0x1F0AB , "PLAYING CARD JACK OF SPADES" ],
			[ 0x1F0AC , "PLAYING CARD KNIGHT OF SPADES" ],
			[ 0x1F0AD , "PLAYING CARD QUEEN OF SPADES" ],
			[ 0x1F0AE , "PLAYING CARD KING OF SPADES" ],
			
			[ 0x1F0b1 , "PLAYING CARD ACE OF HEARTS" ],
			[ 0x1F0b2 , "PLAYING CARD TWO OF HEARTS" ],
			[ 0x1F0b3 , "PLAYING CARD THREE OF HEARTS" ],
			[ 0x1F0b4 , "PLAYING CARD FOUR OF HEARTS" ],
			[ 0x1F0b5 , "PLAYING CARD FIVE OF HEARTS" ],
			[ 0x1F0b6 , "PLAYING CARD SIX OF HEARTS" ],
			[ 0x1F0b7 , "PLAYING CARD SEVEN OF HEARTS" ],
			[ 0x1F0b8 , "PLAYING CARD EIGHT OF HEARTS" ],
			[ 0x1F0b9 , "PLAYING CARD NINE OF HEARTS" ],
			[ 0x1F0bA , "PLAYING CARD TEN OF HEARTS" ],
			[ 0x1F0bB , "PLAYING CARD JACK OF HEARTS" ],
			[ 0x1F0bC , "PLAYING CARD KNIGHT OF HEARTS" ],
			[ 0x1F0bD , "PLAYING CARD QUEEN OF HEARTS" ],
			[ 0x1F0bE , "PLAYING CARD KING OF HEARTS" ],
			
			[ 0x1F0c1 , "PLAYING CARD ACE OF DIAMONDS" ],
			[ 0x1F0c2 , "PLAYING CARD TWO OF DIAMONDS" ],
			[ 0x1F0c3 , "PLAYING CARD THREE OF DIAMONDS" ],
			[ 0x1F0c4 , "PLAYING CARD FOUR OF DIAMONDS" ],
			[ 0x1F0c5 , "PLAYING CARD FIVE OF DIAMONDS" ],
			[ 0x1F0c6 , "PLAYING CARD SIX OF DIAMONDS" ],
			[ 0x1F0c7 , "PLAYING CARD SEVEN OF DIAMONDS" ],
			[ 0x1F0c8 , "PLAYING CARD EIGHT OF DIAMONDS" ],
			[ 0x1F0c9 , "PLAYING CARD NINE OF DIAMONDS" ],
			[ 0x1F0cA , "PLAYING CARD TEN OF DIAMONDS" ],
			[ 0x1F0cB , "PLAYING CARD JACK OF DIAMONDS" ],
			[ 0x1F0cC , "PLAYING CARD KNIGHT OF DIAMONDS" ],
			[ 0x1F0cD , "PLAYING CARD QUEEN OF DIAMONDS" ],
			[ 0x1F0cE , "PLAYING CARD KING OF DIAMONDS" ],
			
			[ 0x1F0d1 , "PLAYING CARD ACE OF CLUBS" ],
			[ 0x1F0d2 , "PLAYING CARD TWO OF CLUBS" ],
			[ 0x1F0d3 , "PLAYING CARD THREE OF CLUBS" ],
			[ 0x1F0d4 , "PLAYING CARD FOUR OF CLUBS" ],
			[ 0x1F0d5 , "PLAYING CARD FIVE OF CLUBS" ],
			[ 0x1F0d6 , "PLAYING CARD SIX OF CLUBS" ],
			[ 0x1F0d7 , "PLAYING CARD SEVEN OF CLUBS" ],
			[ 0x1F0d8 , "PLAYING CARD EIGHT OF CLUBS" ],
			[ 0x1F0d9 , "PLAYING CARD NINE OF CLUBS" ],
			[ 0x1F0dA , "PLAYING CARD TEN OF CLUBS" ],
			[ 0x1F0dB , "PLAYING CARD JACK OF CLUBS" ],
			[ 0x1F0dC , "PLAYING CARD KNIGHT OF CLUBS" ],
			[ 0x1F0dD , "PLAYING CARD QUEEN OF CLUBS" ],
			[ 0x1F0dE , "PLAYING CARD KING OF CLUBS" ],
			
			[ 0x1F0CF , "PLAYING CARD BLACK JOKER" ],
			[ 0x1F0DF , "PLAYING CARD WHITE JOKER" ],
			
			[ 0 , "Mahjong" ],
			[ 0x1F000 , "MAHJONG TILE EAST WIND" ],
			[ 0x1F001 , "MAHJONG TILE SOUTH WIND" ],
			[ 0x1F002 , "MAHJONG TILE WEST WIND" ],
			[ 0x1F003 , "MAHJONG TILE NORTH WIND" ],
			[ 0x1F004 , "MAHJONG TILE RED DRAGON" ],
			[ 0x1F005 , "MAHJONG TILE GREEN DRAGON" ],
			[ 0x1F006 , "MAHJONG TILE WHITE DRAGON" ],
			[ 0x1F007 , "MAHJONG TILE ONE OF CHARACTERS" ],
			[ 0x1F008 , "MAHJONG TILE TWO OF CHARACTERS" ],
			[ 0x1F009 , "MAHJONG TILE THREE OF CHARACTERS" ],
			[ 0x1F00A , "MAHJONG TILE FOUR OF CHARACTERS" ],
			[ 0x1F00B , "MAHJONG TILE FIVE OF CHARACTERS" ],
			[ 0x1F00C , "MAHJONG TILE SIX OF CHARACTERS" ],
			[ 0x1F00D , "MAHJONG TILE SEVEN OF CHARACTERS" ],
			[ 0x1F00E , "MAHJONG TILE EIGHT OF CHARACTERS" ],
			[ 0x1F00F , "MAHJONG TILE NINE OF CHARACTERS" ],
			
			[ 0x1F010 , "MAHJONG TILE ONE OF BAMBOOS" ],
			[ 0x1F011 , "MAHJONG TILE TWO OF BAMBOOS" ],
			[ 0x1F012 , "MAHJONG TILE THREE OF BAMBOOS" ],
			[ 0x1F013 , "MAHJONG TILE FOUR OF BAMBOOS" ],
			[ 0x1F014 , "MAHJONG TILE FIVE OF BAMBOOS" ],
			[ 0x1F015 , "MAHJONG TILE SIX OF BAMBOOS" ],
			[ 0x1F016 , "MAHJONG TILE SEVEN OF BAMBOOS" ],
			[ 0x1F017 , "MAHJONG TILE EIGHT OF BAMBOOS" ],
			[ 0x1F018 , "MAHJONG TILE NINE OF BAMBOOS" ],
			
			[ 0x1F019 , "MAHJONG TILE ONE OF CIRCLES" ],
			[ 0x1F01A , "MAHJONG TILE TWO OF CIRCLES" ],
			[ 0x1F01B , "MAHJONG TILE THREE OF CIRCLES" ],
			[ 0x1F01C , "MAHJONG TILE FOUR OF CIRCLES" ],
			[ 0x1F01D , "MAHJONG TILE FIVE OF CIRCLES" ],
			[ 0x1F01E , "MAHJONG TILE SIX OF CIRCLES" ],
			[ 0x1F01F , "MAHJONG TILE SEVEN OF CIRCLES" ],
			[ 0x1F020 , "MAHJONG TILE EIGHT OF CIRCLES" ],
			[ 0x1F021 , "MAHJONG TILE NINE OF CIRCLES" ],
			
			[ 0x1F022 , "MAHJONG TILE PLUM" ],
			[ 0x1F023 , "MAHJONG TILE ORCHID" ],
			[ 0x1F024 , "MAHJONG TILE BAMBOO" ],
			[ 0x1F025 , "MAHJONG TILE CHRYSANTHEMUM" ],
			[ 0x1F026 , "MAHJONG TILE SPRING" ],
			[ 0x1F027 , "MAHJONG TILE SUMMER" ],
			[ 0x1F028 , "MAHJONG TILE AUTUMN" ],
			[ 0x1F029 , "MAHJONG TILE WINTER" ],
			[ 0x1F02A , "MAHJONG TILE JOKER" ],
			[ 0x1F02B , "MAHJONG TILE BACK" ],
			
			[ 0 , "Dominos" ],
			[ 0x1F030 , "DOMINO TILE HORIZONTAL BACK" ],
			[ 0x1F031 , "DOMINO TILE HORIZONTAL-00-00" ],
			[ 0x1F032 , "DOMINO TILE HORIZONTAL-00-01" ],
			[ 0x1F033 , "DOMINO TILE HORIZONTAL-00-02" ],
			[ 0x1F034 , "DOMINO TILE HORIZONTAL-00-03" ],
			[ 0x1F035 , "DOMINO TILE HORIZONTAL-00-04" ],
			[ 0x1F036 , "DOMINO TILE HORIZONTAL-00-05" ],
			[ 0x1F037 , "DOMINO TILE HORIZONTAL-00-06" ],
			[ 0x1F038 , "DOMINO TILE HORIZONTAL-01-00" ],
			[ 0x1F039 , "DOMINO TILE HORIZONTAL-01-01" ],
			[ 0x1F03A , "DOMINO TILE HORIZONTAL-01-02" ],
			[ 0x1F03B , "DOMINO TILE HORIZONTAL-01-03" ],
			[ 0x1F03C , "DOMINO TILE HORIZONTAL-01-04" ],
			[ 0x1F03D , "DOMINO TILE HORIZONTAL-01-05" ],
			[ 0x1F03E , "DOMINO TILE HORIZONTAL-01-06" ],
			[ 0x1F03F , "DOMINO TILE HORIZONTAL-02-00" ],
			[ 0x1F040 , "DOMINO TILE HORIZONTAL-02-01" ],
			[ 0x1F041 , "DOMINO TILE HORIZONTAL-02-02" ],
			[ 0x1F042 , "DOMINO TILE HORIZONTAL-02-03" ],
			[ 0x1F043 , "DOMINO TILE HORIZONTAL-02-04" ],
			[ 0x1F044 , "DOMINO TILE HORIZONTAL-02-05" ],
			[ 0x1F045 , "DOMINO TILE HORIZONTAL-02-06" ],
			[ 0x1F046 , "DOMINO TILE HORIZONTAL-03-00" ],
			[ 0x1F047 , "DOMINO TILE HORIZONTAL-03-01" ],
			[ 0x1F048 , "DOMINO TILE HORIZONTAL-03-02" ],
			[ 0x1F049 , "DOMINO TILE HORIZONTAL-03-03" ],
			[ 0x1F04A , "DOMINO TILE HORIZONTAL-03-04" ],
			[ 0x1F04B , "DOMINO TILE HORIZONTAL-03-05" ],
			[ 0x1F04C , "DOMINO TILE HORIZONTAL-03-06" ],
			[ 0x1F04D , "DOMINO TILE HORIZONTAL-04-00" ],
			[ 0x1F04E , "DOMINO TILE HORIZONTAL-04-01" ],
			[ 0x1F04F , "DOMINO TILE HORIZONTAL-04-02" ],
			[ 0x1F050 , "DOMINO TILE HORIZONTAL-04-03" ],
			[ 0x1F051 , "DOMINO TILE HORIZONTAL-04-04" ],
			[ 0x1F052 , "DOMINO TILE HORIZONTAL-04-05" ],
			[ 0x1F053 , "DOMINO TILE HORIZONTAL-04-06" ],
			[ 0x1F054 , "DOMINO TILE HORIZONTAL-05-00" ],
			[ 0x1F055 , "DOMINO TILE HORIZONTAL-05-01" ],
			[ 0x1F056 , "DOMINO TILE HORIZONTAL-05-02" ],
			[ 0x1F057 , "DOMINO TILE HORIZONTAL-05-03" ],
			[ 0x1F058 , "DOMINO TILE HORIZONTAL-05-04" ],
			[ 0x1F059 , "DOMINO TILE HORIZONTAL-05-05" ],
			[ 0x1F05A , "DOMINO TILE HORIZONTAL-05-06" ],
			[ 0x1F05B , "DOMINO TILE HORIZONTAL-06-00" ],
			[ 0x1F05C , "DOMINO TILE HORIZONTAL-06-01" ],
			[ 0x1F05D , "DOMINO TILE HORIZONTAL-06-02" ],
			[ 0x1F05E , "DOMINO TILE HORIZONTAL-06-03" ],
			[ 0x1F05F , "DOMINO TILE HORIZONTAL-06-04" ],
			[ 0x1F060 , "DOMINO TILE HORIZONTAL-06-05" ],
			[ 0x1F061 , "DOMINO TILE HORIZONTAL-06-06" ],
			
			[ 0x1F062 , "DOMINO TILE VERTICAL BACK" ],
			[ 0x1F063 , "DOMINO TILE VERTICAL-00-00" ],
			[ 0x1F064 , "DOMINO TILE VERTICAL-00-01" ],
			[ 0x1F065 , "DOMINO TILE VERTICAL-00-02" ],
			[ 0x1F066 , "DOMINO TILE VERTICAL-00-03" ],
			[ 0x1F067 , "DOMINO TILE VERTICAL-00-04" ],
			[ 0x1F068 , "DOMINO TILE VERTICAL-00-05" ],
			[ 0x1F069 , "DOMINO TILE VERTICAL-00-06" ],
			[ 0x1F06A , "DOMINO TILE VERTICAL-01-00" ],
			[ 0x1F06B , "DOMINO TILE VERTICAL-01-01" ],
			[ 0x1F06C , "DOMINO TILE VERTICAL-01-02" ],
			[ 0x1F06D , "DOMINO TILE VERTICAL-01-03" ],
			[ 0x1F06E , "DOMINO TILE VERTICAL-01-04" ],
			[ 0x1F06F , "DOMINO TILE VERTICAL-01-05" ],
			[ 0x1F070 , "DOMINO TILE VERTICAL-01-06" ],
			[ 0x1F071 , "DOMINO TILE VERTICAL-02-00" ],
			[ 0x1F072 , "DOMINO TILE VERTICAL-02-01" ],
			[ 0x1F073 , "DOMINO TILE VERTICAL-02-02" ],
			[ 0x1F074 , "DOMINO TILE VERTICAL-02-03" ],
			[ 0x1F075 , "DOMINO TILE VERTICAL-02-04" ],
			[ 0x1F076 , "DOMINO TILE VERTICAL-02-05" ],
			[ 0x1F077 , "DOMINO TILE VERTICAL-02-06" ],
			[ 0x1F078 , "DOMINO TILE VERTICAL-03-00" ],
			[ 0x1F079 , "DOMINO TILE VERTICAL-03-01" ],
			[ 0x1F07A , "DOMINO TILE VERTICAL-03-02" ],
			[ 0x1F07B , "DOMINO TILE VERTICAL-03-03" ],
			[ 0x1F07C , "DOMINO TILE VERTICAL-03-04" ],
			[ 0x1F07D , "DOMINO TILE VERTICAL-03-05" ],
			[ 0x1F07E , "DOMINO TILE VERTICAL-03-06" ],
			[ 0x1F07F , "DOMINO TILE VERTICAL-04-00" ],
			[ 0x1F080 , "DOMINO TILE VERTICAL-04-01" ],
			[ 0x1F081 , "DOMINO TILE VERTICAL-04-02" ],
			[ 0x1F082 , "DOMINO TILE VERTICAL-04-03" ],
			[ 0x1F083 , "DOMINO TILE VERTICAL-04-04" ],
			[ 0x1F084 , "DOMINO TILE VERTICAL-04-05" ],
			[ 0x1F085 , "DOMINO TILE VERTICAL-04-06" ],
			[ 0x1F086 , "DOMINO TILE VERTICAL-05-00" ],
			[ 0x1F087 , "DOMINO TILE VERTICAL-05-01" ],
			[ 0x1F088 , "DOMINO TILE VERTICAL-05-02" ],
			[ 0x1F089 , "DOMINO TILE VERTICAL-05-03" ],
			[ 0x1F08A , "DOMINO TILE VERTICAL-05-04" ],
			[ 0x1F08B , "DOMINO TILE VERTICAL-05-05" ],
			[ 0x1F08C , "DOMINO TILE VERTICAL-05-06" ],
			[ 0x1F08D , "DOMINO TILE VERTICAL-06-00" ],
			[ 0x1F08E , "DOMINO TILE VERTICAL-06-01" ],
			[ 0x1F08F , "DOMINO TILE VERTICAL-06-02" ],
			[ 0x1F090 , "DOMINO TILE VERTICAL-06-03" ],
			[ 0x1F091 , "DOMINO TILE VERTICAL-06-04" ],
			[ 0x1F092 , "DOMINO TILE VERTICAL-06-05" ],
			[ 0x1F093 , "DOMINO TILE VERTICAL-06-06" ],
			
		);


		Smiley.alltabs.Sports = new Array(
			[ 0x26BD , "Sports"],	
			
			[ 0x26BD , "SOCCER BALL"],
			[ 0x26BE , "BASEBALL"],
			[ 0x26F3 , "GOLF"],
			[ 0x1F3B3 , "BOWLING"],
			[ 0x1F3BD , "RUNNING SHIRT WITH SASH"],
			[ 0x1F3BE , "TENNIS RACQUET AND BALL"],
			[ 0x1F3C0 , "BASKETBALL AND HOOP"],
			[ 0x26F9 , "PERSON WITH BALL"],
			[ 0x1F3C1 , "CHEQUERED FLAG"],
			[ 0x1F3BF , "SKI AND SKI BOOT"],
			[ 0x26F7 , "SKIER"],
			[ 0x1F3C2 , "SNOWBOARDER"],
			[ 0x26F8 , "ICE SKATE"],
			[ 0x1F3C3 , "RUNNER"],
			[ 0x1F3C4 , "SURFER"],
			/*  <td title="reserved" bgcolor="#CCCCCC"></td>*/
			[ 0x1F3C6 , "TROPHY"],
			[ 0x1F3C7 , "HORSE RACING"],
			[ 0x1F3C8 , "AMERICAN FOOTBALL"],
			[ 0x1F3C9 , "RUGBY FOOTBALL"],
			[ 0x1F3CA , "SWIMMER"],
			[ 0x1F6B4 , "BICYCLIST"],
			[ 0x1F6B5 , "MOUNTAIN BICYCLIST"],

		 
		);	  
			 

		Smiley.alltabs.Buildings = new Array(
			[ 0x1F3E0 , "Buildings"],	 

			[ 0x1F3E0 , "HOUSE BUILDING"],
			[ 0x1F3E1 , "HOUSE WITH GARDEN"],
			[ 0x1F3E2 , "OFFICE BUILDING"],
			[ 0x1F3E3 , "JAPANESE POST OFFICE"],
			[ 0x1F3E4 , "EUROPEAN POST OFFICE"],
			[ 0x1F3E5 , "HOSPITAL"],
			[ 0x1F3E6 , "BANK"],
			[ 0x1F3E7 , "AUTOMATED TELLER MACHINE"],
			[ 0x1F3E8 , "HOTEL"],
			[ 0x1F3E9 , "LOVE HOTEL"],
			[ 0x1F3EA , "CONVENIENCE STORE"],
			[ 0x1F3EB , "SCHOOL"],
			[ 0x1F3EC , "DEPARTMENT STORE"],
			[ 0x1F3ED , "FACTORY"],
			[ 0x1F3EE , "IZAKAYA LANTERN"],
			[ 0x1F3EF , "JAPANESE CASTLE"],
			[ 0x1F3F0 , "EUROPEAN CASTLE"],

		);	  


		Smiley.alltabs.Animals = new Array(
			[ 0x1F430 , "Animals"],	// 0x1F436 if you are a dog person, 0x1F431 if a cat person
			
			[ 0x1F400 , "RAT"],
			[ 0x1F401 , "MOUSE"],
			[ 0x1F402 , "OX"],
			[ 0x1F403 , "WATER BUFFALO"],
			[ 0x1F404 , "COW"],
			[ 0x1F405 , "TIGER"],
			[ 0x1F406 , "LEOPARD"],
			[ 0x1F407 , "RABBIT"],
			[ 0x1F408 , "CAT"],
			[ 0x1F409 , "DRAGON"],
			[ 0x1F40A , "CROCODILE"],
			[ 0x1F40B , "WHALE"],
			[ 0x1F40C , "SNAIL"],
			[ 0x1F40D , "SNAKE"],
			[ 0x1F40E , "HORSE"],
			[ 0x1F40F , "RAM"],
			[ 0x1F410 , "GOAT"],
			[ 0x1F411 , "SHEEP"],
			[ 0x1F412 , "MONKEY"],
			[ 0x1F413 , "ROOSTER"],
			[ 0x1F414 , "CHICKEN"],
			[ 0x1F415 , "DOG"],
			[ 0x1F416 , "PIG"],
			[ 0x1F417 , "BOAR"],
			[ 0x1F418 , "ELEPHANT"],
			[ 0x1F419 , "OCTOPUS"],
			[ 0x1F41A , "SPIRAL SHELL"],
			[ 0x1F41B , "BUG"],
			[ 0x1F41C , "ANT"],
			[ 0x1F41D , "HONEYBEE"],
			[ 0x1F41E , "LADY BEETLE"],
			[ 0x1F41F , "FISH"],
			[ 0x1F420 , "TROPICAL FISH"],
			[ 0x1F421 , "BLOWFISH"],
			[ 0x1F422 , "TURTLE"],
			[ 0x1F423 , "HATCHING CHICK"],
			[ 0x1F424 , "BABY CHICK"],
			[ 0x1F425 , "FRONT-FACING BABY CHICK"],
			[ 0x1F426 , "BIRD"],
			[ 0x1F427 , "PENGUIN"],
			[ 0x1F428 , "KOALA"],
			[ 0x1F429 , "POODLE"],
			[ 0x1F42A , "DROMEDARY CAMEL"],
			[ 0x1F42B , "BACTRIAN CAMEL"],
			[ 0x1F42C , "DOLPHIN"],
			[ 0 , "Animal Faces" ],
			[ 0x1F42D , "MOUSE FACE"],
			[ 0x1F42E , "COW FACE"],
			[ 0x1F42F , "TIGER FACE"],
			[ 0x1F430 , "RABBIT FACE"],
			[ 0x1F431 , "CAT FACE"],
			[ 0x1F432 , "DRAGON FACE"],
			[ 0x1F433 , "SPOUTING WHALE"],
			[ 0x1F434 , "HORSE FACE"],
			[ 0x1F435 , "MONKEY FACE"],
			[ 0x1F436 , "DOG FACE"],
			[ 0x1F437 , "PIG FACE"],
			[ 0x1F438 , "FROG FACE"],
			[ 0x1F439 , "HAMSTER FACE"],
			[ 0x1F43A , "WOLF FACE"],
			[ 0x1F43B , "BEAR FACE"],
			[ 0x1F43C , "PANDA FACE"],
			[ 0 , "" ],
			[ 0x1F43D , "PIG NOSE"],
			[ 0x1F43E , "PAW PRINTS"],


		);	  


		Smiley.alltabs.People = new Array(
			[ 0x1F464 , "People and Roles"],	 
			
			[ 0x1F464 , "BUST IN SILHOUETTE"],
			[ 0x1F465 , "BUSTS IN SILHOUETTE"],
			[ 0x1F466 , "BOY"],
			[ 0x1F467 , "GIRL"],
			[ 0x1F468 , "MAN"],
			[ 0x1F469 , "WOMAN"],
			[ 0x1F46A , "FAMILY"],
			[ 0x1F46B , "MAN AND WOMAN HOLDING HANDS"],
			[ 0x1F46C , "TWO MEN HOLDING HANDS"],
			[ 0x1F46D , "TWO WOMEN HOLDING HANDS"],
			[ 0 , "Roles" ],
			[ 0x1F46E , "POLICE OFFICER"],
			[ 0x1F46F , "WOMAN WITH BUNNY EARS"],
			[ 0x1F470 , "BRIDE WITH VEIL"],
			[ 0x1F471 , "PERSON WITH BLOND HAIR"],
			[ 0x1F472 , "MAN WITH GUA PI MAO"],
			[ 0x1F473 , "MAN WITH TURBAN"],
			[ 0x1F474 , "OLDER MAN"],
			[ 0x1F475 , "OLDER WOMAN"],
			[ 0x1F476 , "BABY"],
			[ 0x1F477 , "CONSTRUCTION WORKER"],
			[ 0x1F481 , "INFORMATION DESK PERSON"],
			[ 0x1F482 , "GUARDSMAN"],
			[ 0x1F483 , "DANCER"],
			[ 0 , "Fairy Tale" ],
			[ 0x1F478 , "PRINCESS"],
			[ 0x1F479 , "JAPANESE OGRE"],
			[ 0x1F47A , "JAPANESE GOBLIN"],
			[ 0x1F47B , "GHOST"],
			[ 0x1F47C , "BABY ANGEL"],
			[ 0x1F47D , "EXTRATERRESTRIAL ALIEN"],
			[ 0x1F47E , "ALIEN MONSTER"],
			[ 0x1F47F , "IMP"],
			[ 0x1F480 , "SKULL"],
			[ 0 , "Parts of the Face" ],
			[ 0x1F440 , "EYES"],
			/*  <td title="reserved" bgcolor="#CCCCCC"></td>*/
			[ 0x1F442 , "EAR"],
			[ 0x1F443 , "NOSE"],
			[ 0x1F444 , "MOUTH"],
			[ 0x1F445 , "TONGUE"],
			[ 0 , "Hands" ],
			[ 0x261A , "BLACK LEFT POINTING INDEX"],
			[ 0x261B , "BLACK RIGHT POINTING INDEX"],
			[ 0x261C , "WHITE LEFT POINTING INDEX"],
			[ 0x261D , "WHITE UP POINTING INDEX"],
			[ 0x261E , "WHITE RIGHT POINTING INDEX"],
			[ 0x261F , "WHITE DOWN POINTING INDEX"],
			[ 0x1F446 , "WHITE UP POINTING BACKHAND INDEX"],
			[ 0x1F447 , "WHITE DOWN POINTING BACKHAND INDEX"],
			[ 0x1F448 , "WHITE LEFT POINTING BACKHAND INDEX"],
			[ 0x1F449 , "WHITE RIGHT POINTING BACKHAND INDEX"],
			[ 0x1F44A , "FISTED HAND SIGN"],
			[ 0x1F44B , "WAVING HAND SIGN"],
			[ 0x1F44C , "OK HAND SIGN"],
			[ 0x1F44D , "THUMBS UP SIGN"],
			[ 0x1F44E , "THUMBS DOWN SIGN"],
			[ 0x1F44F , "CLAPPING HANDS SIGN"],
			[ 0x1F450 , "OPEN HANDS SIGN"],
			[ 0 , "Clothing and Accessories" ],
			[ 0x1F451 , "CROWN"],
			[ 0x1F452 , "WOMANS HAT"],
			[ 0x1F3A9 , "TOP HAT"],
			[ 0x1F453 , "EYEGLASSES"],
			[ 0x1F454 , "NECKTIE"],
			[ 0x1F455 , "T-SHIRT"],
			[ 0x1F3BD , "RUNNING SHIRT WITH SASH"],
			[ 0x1F456 , "JEANS"],
			[ 0x1F457 , "DRESS"],
			[ 0x1F458 , "KIMONO"],
			[ 0x1F459 , "BIKINI"],
			[ 0x1F45A , "WOMANS CLOTHES"],
			[ 0x1F45B , "PURSE"],
			[ 0x1F45C , "HANDBAG"],
			[ 0x1F45D , "POUCH"],
			[ 0x1F45E , "MANS SHOE"],
			[ 0x1F45F , "ATHLETIC SHOE"],
			[ 0x1F460 , "HIGH-HEELED SHOE"],
			[ 0x1F461 , "WOMANS SANDAL"],
			[ 0x1F462 , "WOMANS BOOTS"],
			[ 0x1F463 , "FOOTPRINTS"],
			[ 0 , "Personal Care" ],
			[ 0x1F484 , "LIPSTICK"],
			[ 0x1F485 , "NAIL POLISH"],
			[ 0x1F486 , "FACE MASSAGE"],
			[ 0x1F487 , "HAIRCUT"],
			[ 0x1F488 , "BARBER POLE"],
			 
		);	  


		Smiley.alltabs.Romance = new Array(
			[ 0x1F495 , "Romance"],	 
			
			[ 0x1F48B , "KISS MARK"],
			[ 0x1F48C , "LOVE LETTER"],
			[ 0x1F48D , "RING"],
			[ 0x1F48E , "GEM STONE"],
			[ 0x1F48F , "KISS"],
			[ 0x1F490 , "BOUQUET"],
			[ 0x1F491 , "COUPLE WITH HEART"],
			[ 0x1F492 , "WEDDING"],
			[ 0x1F470 , "BRIDE WITH VEIL"],
			[ 0 , "Hearts" ],
			[ 0x1F493 , "BEATING HEART"],
			[ 0x1F494 , "BROKEN HEART"],
			[ 0x1F495 , "TWO HEARTS"],
			[ 0x1F496 , "SPARKLING HEART"],
			[ 0x1F497 , "GROWING HEART"],
			[ 0x1F498 , "HEART WITH ARROW"],
			[ 0x1F499 , "BLUE HEART"],
			[ 0x1F49A , "GREEN HEART"],
			[ 0x1F49B , "YELLOW HEART"],
			[ 0x1F49C , "PURPLE HEART"],
			[ 0x1F49D , "HEART WITH RIBBON"],
			[ 0x1F49E , "REVOLVING HEARTS"],
			[ 0x1F49F , "HEART DECORATION"],
			[ 0x2763 , "HEAVY HEART EXCLAMATION MARK ORNAMENT"],
			[ 0x2764 , "HEAVY BLACK HEART"],
			[ 0x2765 , "ROTATED HEAVY BLACK HEART BULLET"],
			[ 0x2766 , "FLORAL HEART"],
			[ 0x2767 , "ROTATED FLORAL HEART BULLET"],
			[ 0x2619 , "REVERSE ROTATED FLORAL HEART BULLET"],

		);	  


		Smiley.alltabs.Comic = new Array(
			[ 0x1F4AC , "Comic Symbols"],	 

			[ 0x1F4A0 , "DIAMOND SHAPE WITH A DOT INSIDE"],
			[ 0x1F4A1 , "ELECTRIC LIGHT BULB"],
			[ 0x1F4A2 , "ANGER SYMBOL"],
			[ 0x1F4A3 , "BOMB"],
			[ 0x1F4A4 , "SLEEPING SYMBOL"],
			[ 0x1F4A5 , "COLLISION SYMBOL"],
			[ 0x1F4A6 , "SPLASHING SWEAT SYMBOL"],
			[ 0x1F4A7 , "DROPLET"],
			[ 0x1F4A8 , "DASH SYMBOL"],
			[ 0x1F4A9 , "PILE OF POO"],
			[ 0x1F4AA , "FLEXED BICEPS"],
			[ 0x1F4AB , "DIZZY SYMBOL"],
			[ 0x1F4AC , "SPEECH BALLOON"],
			[ 0x1F4AD , "THOUGHT BALLOON"],
			[ 0x1F4AE , "WHITE FLOWER"],
			[ 0x1F4AF , "HUNDRED POINTS SYMBOL"],

		);	  


		Smiley.alltabs.Money = new Array(
			[ 0x1F4B0 , "Money"],	 
			
			[ 0x1F4B0 , "MONEY BAG"],
			[ 0x1F4B1 , "CURRENCY EXCHANGE"],
			[ 0x1F4B2 , "HEAVY DOLLAR SIGN"],
			[ 0x1F4B3 , "CREDIT CARD"],
			[ 0x1F4B4 , "BANKNOTE WITH YEN SIGN"],
			[ 0x1F4B5 , "BANKNOTE WITH DOLLAR SIGN"],
			[ 0x1F4B6 , "BANKNOTE WITH EURO SIGN"],
			[ 0x1F4B7 , "BANKNOTE WITH POUND SIGN"],
			[ 0x1F4B8 , "MONEY WITH WINGS"],
			[ 0x1F4B9 , "CHART WITH UPWARDS TREND AND YEN SIGN"],
			[ 0x1F3E7 , "AUTOMATED TELLER MACHINE"],
			
			[ 0 , "Currency Symbols" ],
			[ 0x0024 , "DOLLAR SIGN"],
			[ 0x00A2 , "CENT SIGN"],
			[ 0x00A3 , "POUND SIGN"],
			[ 0x00A4 , "CURRENCY SIGN"],
			[ 0x00A5 , "YEN SIGN"],
			[ 0x0192 , "LATIN SMALL LETTER F WITH HOOK"],
			[ 0x060B , "AFGHANI SIGN"],
			[ 0x09F2 , "BENGALI RUPEE MARK"],
			[ 0x09F3 , "BENGALI RUPEE SIGN"],
			[ 0x0AF1 , "GUJARATI RUPEE SIGN"],
			[ 0x0BF9 , "TAMIL RUPEE SIGN"],
			[ 0x0E3F , "THAI CURRENCY SYMBOL BAHT"],
			[ 0x17DB , "KHMER CURRENCY SYMBOL RIEL"],
			[ 0x2133 , "SCRIPT CAPITAL M"],
			[ 0x5143 , "CJK UNIFIED IDEOGRAPH-5143"],
			[ 0x5186 , "CJK UNIFIED IDEOGRAPH-5186"],
			[ 0x5706 , "CJK UNIFIED IDEOGRAPH-5706"],
			[ 0x5713 , "CJK UNIFIED IDEOGRAPH-5713"],
			[ 0xFDFC , "RIAL SIGN"],
			
			[ 0x20A0 , "EURO_CURRENCY SIGN"],
			[ 0x20A1 , "COLON SIGN"],
			[ 0x20A2 , "CRUZEIRO SIGN"],
			[ 0x20A3 , "FRENCH FRANC SIGN"],
			[ 0x20A4 , "LIRA SIGN"],
			[ 0x20A5 , "MILL SIGN"],
			[ 0x20A6 , "NAIRA SIGN"],
			[ 0x20A7 , "PESETA SIGN"],
			[ 0x20A8 , "RUPEE SIGN"],
			[ 0x20A9 , "WON SIGN"],
			[ 0x20AA , "NEW SHEQEL SIGN"],
			[ 0x20AB , "DONG SIGN"],
			[ 0x20AC , "EURO SIGN"],
			[ 0x20AD , "KIP SIGN"],
			[ 0x20AE , "TUGRIK SIGN"],
			[ 0x20AF , "DRACHMA SIGN"],
			[ 0x20B0 , "GERMAN PENNY SIGN"],
			[ 0x20B1 , "PESO SIGN"],
			[ 0x20B2 , "GUARANI SIGN"],
			[ 0x20B3 , "AUSTRAL SIGN"],
			[ 0x20B4 , "HRYVNIA SIGN"],
			[ 0x20B5 , "CEDI SIGN"],
			[ 0x20B6 , "LIVRE TOURNOIS SIGN"],
			[ 0x20B7 , "SPESMILO SIGN"],
			[ 0x20B8 , "TENGE SIGN"],
			[ 0x20B9 , "INDIAN RUPEE SIGN"],
			[ 0x20BA , "TURKISH LIRA SIGN"],
			
			[ 0 , "Check OCR Characters" ],
			[ 0x2446 , "OCR BRANCH BANK IDENTIFICATION"],
			[ 0x2447 , "OCR AMOUNT OF CHECK"],
			[ 0x2448 , "OCR DASH"],
			[ 0x2449 , "OCR CUSTOMER ACCOUNT NUMBER"],
			
		);	  


		Smiley.alltabs.Office = new Array(
			[ 0x1F4DE , "Office and Communication"],	 
			
			[ 0 , "Office Items" ],
			[ 0x1F4BA , "SEAT"],
			[ 0x1F4BB , "PERSONAL COMPUTER"],
			[ 0x1F4BC , "BRIEFCASE"],
			[ 0x1F4BD , "MINIDISC"],
			[ 0x1F4BE , "FLOPPY DISK"],
			[ 0x1F4BF , "OPTICAL DISC"],
			[ 0x1F4C0 , "DVD"],
			[ 0x1F4C1 , "FILE FOLDER"],
			[ 0x1F4C2 , "OPEN FILE FOLDER"],
			[ 0x1F4C3 , "PAGE WITH CURL"],
			[ 0x1F4C4 , "PAGE FACING UP"],
			[ 0x1F4C5 , "CALENDAR"],
			[ 0x1F4C6 , "TEAR-OFF CALENDAR"],
			[ 0x1F4C7 , "CARD INDEX"],
			[ 0x1F4C8 , "CHART WITH UPWARDS TREND"],
			[ 0x1F4C9 , "CHART WITH DOWNWARDS TREND"],
			[ 0x1F4CA , "BAR CHART"],
			[ 0x1F4CB , "CLIPBOARD"],
			[ 0x1F4CC , "PUSHPIN"],
			[ 0x1F4CD , "ROUND PUSHPIN"],
			[ 0x1F4CE , "PAPERCLIP"],
			[ 0x1F4CF , "STRAIGHT RULER"],
			[ 0x1F4D0 , "TRIANGULAR RULER"],
			[ 0x1F4D1 , "BOOKMARK TABS"],
			[ 0x1F4D2 , "LEDGER"],
			[ 0x1F4D3 , "NOTEBOOK"],
			[ 0x1F4D4 , "NOTEBOOK WITH DECORATIVE COVER"],
			[ 0x1F4D5 , "CLOSED BOOK"],
			[ 0x1F4D6 , "OPEN BOOK"],
			[ 0x1F4D7 , "GREEN BOOK"],
			[ 0x1F4D8 , "BLUE BOOK"],
			[ 0x1F4D9 , "ORANGE BOOK"],
			[ 0x1F4DA , "BOOKS"],
			[ 0x1F4DB , "NAME BADGE"],
			[ 0x1F4DC , "SCROLL"],
			[ 0 , "Communication" ],
			[ 0x1F4DD , "MEMO"],
			[ 0x1F4DE , "TELEPHONE RECEIVER"],
			[ 0x260E , "BLACK TELEPHONE"],
			[ 0x260F , "WHITE TELEPHONE"],
			[ 0x1F4DF , "PAGER"],
			[ 0x1F4E0 , "FAX MACHINE"],
			[ 0x1F4E1 , "SATELLITE ANTENNA"],
			[ 0x1F4E2 , "PUBLIC ADDRESS LOUDSPEAKER"],
			[ 0x1F4E3 , "CHEERING MEGAPHONE"],
			[ 0x1F4E4 , "OUTBOX TRAY"],
			[ 0x1F4E5 , "INBOX TRAY"],
			[ 0x1F4E6 , "PACKAGE"],
			[ 0x1F4E7 , "E-MAIL SYMBOL"],
			[ 0x1F4E8 , "INCOMING ENVELOPE"],
			[ 0x2709 , "ENVELOPE"],
			[ 0x1F4E9 , "ENVELOPE WITH DOWNWARDS ARROW ABOVE"],
			[ 0x1F4EA , "CLOSED MAILBOX WITH LOWERED FLAG"],
			[ 0x1F4EB , "CLOSED MAILBOX WITH RAISED FLAG"],
			[ 0x1F4EC , "OPEN MAILBOX WITH RAISED FLAG"],
			[ 0x1F4ED , "OPEN MAILBOX WITH LOWERED FLAG"],
			[ 0x1F4EE , "POSTBOX"],
			[ 0x1F4EF , "POSTAL HORN"],
			[ 0x1F4F0 , "NEWSPAPER"],
			[ 0x1F4F1 , "MOBILE PHONE"],
			[ 0x1F4F2 , "MOBILE PHONE WITH RIGHTWARDS ARROW AT LEFT"],
			[ 0x1F4F3 , "VIBRATION MODE"],
			[ 0x1F4F4 , "MOBILE PHONE OFF"],
			[ 0x1F4F5 , "NO MOBILE PHONES"],
			[ 0x1F4F6 , "ANTENNA WITH BARS"],
			[ 0 , "Television" ],
			[ 0x1F4F7 , "CAMERA"],
			/*  <td title="reserved" bgcolor="#CCCCCC"></td>*/
			[ 0x1F4F9 , "VIDEO CAMERA"],
			[ 0x1F4FA , "TELEVISION"],
			[ 0x1F4FB , "RADIO"],
			[ 0x1F4FC , "VIDEOCASSETTE"],
			[ 0x269E , "THREE LINES CONVERGING RIGHT"],
			[ 0x269F , "THREE LINES CONVERGING LEFT"],

		);	  


		Smiley.alltabs.UIsymbols = new Array(
			[ 0x1F50C , "User Interface"],	 

			[ 0 , "User Interface Icons" ],
			[ 0x1F500 , "TWISTED RIGHTWARDS ARROWS"],
			[ 0x1F501 , "CLOCKWISE RIGHTWARDS AND LEFTWARDS OPEN CIRCLE ARROWS"],
			[ 0x1F502 , "CLOCKWISE RIGHTWARDS AND LEFTWARDS OPEN CIRCLE ARROWS WITH CIRCLED ONE OVERLAY"],
			[ 0x1F503 , "CLOCKWISE DOWNWARDS AND UPWARDS OPEN CIRCLE ARROWS"],
			[ 0x1F504 , "ANTICLOCKWISE DOWNWARDS AND UPWARDS OPEN CIRCLE ARROWS"],
			[ 0x1F505 , "LOW BRIGHTNESS SYMBOL"],
			[ 0x1F506 , "HIGH BRIGHTNESS SYMBOL"],
			[ 0x1F507 , "SPEAKER WITH CANCELLATION STROKE"],
			[ 0x1F508 , "SPEAKER"],
			[ 0x1F509 , "SPEAKER WITH ONE SOUND WAVE"],
			[ 0x1F50A , "SPEAKER WITH THREE SOUND WAVES"],
			[ 0x1F50B , "BATTERY"],
			[ 0x1F50C , "ELECTRIC PLUG"],
			[ 0x1F50D , "LEFT-POINTING MAGNIFYING GLASS"],
			[ 0x1F50E , "RIGHT-POINTING MAGNIFYING GLASS"],
			[ 0x1F50F , "LOCK WITH INK PEN"],
			[ 0x1F510 , "CLOSED LOCK WITH KEY"],
			[ 0x1F511 , "KEY"],
			[ 0x26BF , "SQUARE KEY"],
			[ 0x1F512 , "LOCK"],
			[ 0x1F513 , "OPEN LOCK"],
			[ 0x1F514 , "BELL"],
			[ 0x1F515 , "BELL WITH CANCELLATION STROKE"],
			[ 0x1F516 , "BOOKMARK"],
			[ 0x1F517 , "LINK SYMBOL"],
			[ 0x1F518 , "RADIO BUTTON"],
			[ 0x231A , "WATCH"],
			[ 0x231B , "HOURGLASS"],
			[ 0 , "Keyboard Key Symbols" ],
			[ [0x1F519,0x0FE0E] , "BACK WITH LEFTWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51A,0x0FE0E] , "END WITH LEFTWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51B,0x0FE0E] , "ON WITH EXCLAMATION MARK WITH LEFT RIGHT ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51C,0x0FE0E] , "SOON WITH RIGHTWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51D,0x0FE0E] , "TOP WITH UPWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51E,0x0FE0E] , "NO ONE UNDER EIGHTEEN SYMBOL","font-family: inherit;"],
			[ [0x1F51F,0x0FE0E] , "KEYCAP TEN","font-family: inherit;"],
			[ 0x2318 , "COMMAND KEY"],
			[ 0x2324 , "UP ARROWHEAD BETWEEN TWO HORIZONTAL BARS"],
			[ 0x2325 , "OPTION KEY"],
			[ 0x2326 , "ERASE TO THE RIGHT"],
			[ 0x232B , "ERASE TO THE LEFT"],
			[ 0x2327 , "X IN A RECTANGLE BOX"],
			[ [0x2328,0x0FE0E] , "KEYBOARD","font-family: inherit;"],
			[ 0x2380 , "INSERTION SYMBOL"],
			[ 0x2381 , "CONTINOUOS UNDERLINE SYMBOL"],
			[ 0x2382 , "DISCONTINOUOS UNDERLINE SYMBOL"],
			[ 0x2383 , "EMPHASIS SYMBOL"],
			[ 0x2384 , "COMPOSITION SYMBOL"],
			[ 0x2385 , "WHITE SQUARE WITH CENTER VERTICAL LINE"],
			[ 0x2386 , "ENTER SYMBOL"],
			[ 0x2387 , "ALTERNATIVE KEY SYMBOL"],
			[ 0x2388 , "HELM SYMBOL"],
			[ 0x2389 , "CIRCLED HORIZONTAL BAR WITH NOTCH"],
			[ 0x238A , "CIRCLED TRIANGLE DOWN"],
			[ 0x238B , "BROKEN CIRCLE WITH NORTHWEST ARROW"],
			[ 0x238C , "UNDO SYMBOL"],
			[ 0x2396 , "DECIMAL SEPARATOR KEY SYMBOL"],
			[ 0x2397 , "PREVIOUS PAGE"],
			[ 0x2398 , "NEXT PAGE"],
			[ 0x2399 , "PRINT SCREEN SYMBOL"],
			[ 0x239A , "CLEAR SCREEN SYMBOL"],
			[ 0x23CE , "RETURN SYMBOL"],
			[ [0x23CF,0x0FE0E] , "EJECT SYMBOL","font-family: inherit;"],
			[ [0x23E9,0x0FE0E] , "BLACK RIGHT-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23EA,0x0FE0E] , "BLACK LEFT-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23EB,0x0FE0E] , "BLACK UP-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23EC,0x0FE0E] , "BLACK DOWN-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23ED,0x0FE0E] , "BLACK RIGHT-POINTING DOUBLE TRIANGLE WITH VERTICAL BAR","font-family: inherit;"],
			[ [0x23EE,0x0FE0E] , "BLACK LEFT-POINTING DOUBLE TRIANGLE WITH VERTICAL BAR","font-family: inherit;"],
			[ [0x23EF,0x0FE0E] , "BLACK RIGHT-POINTING TRIANGLE WITH DOUBLE VERTICAL BAR","font-family: inherit;"],
			
			[ 0 , "Input Type Symbols" ],
			[ [0x1F520,0x0FE0E] , "INPUT SYMBOL FOR LATIN CAPITAL LETTERS","font-family: inherit;"],
			[ [0x1F521,0x0FE0E] , "INPUT SYMBOL FOR LATIN SMALL LETTERS","font-family: inherit;"],
			[ [0x1F522,0x0FE0E] , "INPUT SYMBOL FOR NUMBERS","font-family: inherit;"],
			[ [0x1F523,0x0FE0E] , "INPUT SYMBOL FOR SYMBOLS","font-family: inherit;"],
			[ [0x1F524,0x0FE0E] , "INPUT SYMBOL FOR LATIN LETTERS","font-family: inherit;"],
			  
		);	  


		Smiley.alltabs.Tech = new Array(
			[ 0x2316 , "Technical Symbols"],
			
			[ 0x2300 , "DIAMETER SIGN"],
			[ 0x2301 , "ELECTRIC ARROW"],
			[ 0x2302 , "HOUSE"],
			[ 0x2303 , "UP ARROWHEAD"],
			[ 0x2304 , "DOWN ARROWHEAD"],
			[ 0x2305 , "PROJECTIVE"],
			[ 0x2306 , "PERSPECTIVE"],
			[ 0x2307 , "WAVY LINE"],
			[ 0x3030 , "WAVY DASH"],
			
			[ 0x230C , "BOTTOM RIGHT CROP"],
			[ 0x230D , "BOTTOM LEFT CROP"],
			[ 0x230E , "TOP RIGHT CROP"],
			[ 0x230F , "TOP LEFT CROP"],
			
			[ 0x2310 , "REVERSED NOT SIGN"],
			[ 0x2311 , "SQUARE LOZENGE"],
			[ 0x2312 , "ARC"],
			[ 0x2313 , "SEGMENT"],
			[ 0x2314 , "SECTOR"],
			[ 0x2315 , "TELEPHONE RECORDER"],
			[ 0x2316 , "POSITION INDICATOR"],
			[ 0x2317 , "VIEWDATA SQUARE"],
			[ 0x2318 , "PLACE OF INTEREST SIGN"],
			[ 0x2319 , "TURNED NOT SIGN"],

			[ 0x231C , "TOP LEFT CORNER"],
			[ 0x231D , "TOP RIGHT CORNER"],
			[ 0x231E , "BOTTOM LEFT CORNER"],
			[ 0x231F , "BOTTOM RIGHT CORNER"],
			
			[ 0x232C , "BENZENE RING"],
			[ 0x23E3 , "BENZENE RING WITH CIRCLE"],
			[ 0x232D , "CYLINDRICITY"],
			[ 0x232E , "ALL AROUND-PROFILE"],
			[ 0x232F , "SYMMETRY"],
			
			[ 0x2330 , "TOTAL RUNOUT"],
			[ 0x2331 , "DIMENSION ORIGIN"],
			[ 0x2332 , "CONICAL TAPER"],
			[ 0x2333 , "SLOPE"],
			[ 0x2334 , "COUNTERBORE"],
			[ 0x2335 , "COUNTERSINK"],
			
			[ 0x237B , "NOT CHECK MARK"],
			[ 0x237C , "RIGHT ANGLE WITH DOWNWARDS ZIGZAG ARROW"],
			[ 0x237D , "SHOULDERED OPEN BOX"],
			[ 0x237E , "BELL SYMBOL"],
			[ 0x237F , "VERTICAL LINE WITH MIDDLE DOT"],
			
			[ 0x23CD , "SQUARE FOOT"],
			
			[ 0 , "Electrical Symbols"],
			[ 0x238D , "MONOSTABLE SYMBOL"],
			[ 0x238E , "HYSTERESIS SYMBOL"],
			[ 0x238F , "OPEN-CIRCUIT-OUTPUT H-TYPE SYMBOL"],
			
			[ 0x2390 , "OPEN-CIRCUIT-OUTPUT L-TYPE SYMBOL"],
			[ 0x2391 , "PASSIVE-PULL-DOWN-OUTPUT SYMBOL"],
			[ 0x2392 , "PASSIVE-PULL-UP-OUTPUT SYMBOL"],
			[ 0x2393 , "DIRECT CURRENT SYMBOL FORM TWO"],
			[ 0x2394 , "SOFTWARE-FUNCTION SYMBOL"],

			[ 0x23DA , "EARTH GROUND"],
			[ 0x23DB , "FUSE"],
			
			[ 0x23E2 , "WHITE TRAPEZIUM"],
			[ 0x23E4 , "STRAIGHTNESS"],
			[ 0x23E5 , "FLATNESS"],
			[ 0x23E6 , "AC CURRENT"],
			[ 0x23E7 , "ELECTRICAL INTERSECTION"],
			[ 0x23E8 , "DECIMAL EXPONENT SYMBOL"],
			
			[ 0 , "Dentistry Symbols"],
			[ 0x23BE , "DENTISTRY SYMBOL LIGHT VERTICAL AND TOP RIGHT"],
			[ 0x23BF , "DENTISTRY SYMBOL LIGHT VERTICAL AND BOTTOM RIGHT"],
			[ 0x23C0 , "DENTISTRY SYMBOL LIGHT VERTICAL WITH CIRCLE"],
			[ 0x23C1 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL WITH CIRCLE"],
			[ 0x23C2 , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL WITH CIRCLE"],
			[ 0x23C3 , "DENTISTRY SYMBOL LIGHT VERTICAL WITH TRIANGLE"],
			[ 0x23C4 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL WITH TRIANGLE"],
			[ 0x23C5 , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL WITH TRIANGLE"],
			[ 0x23C6 , "DENTISTRY SYMBOL LIGHT VERTICAL WITH WAVE"],
			[ 0x23C7 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL WITH WAVE"],
			[ 0x23C8 , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL WITH WAVE"],
			[ 0x23C9 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL"],
			[ 0x23CA , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL"],
			[ 0x23CB , "DENTISTRY SYMBOL LIGHT VERTICAL AND TOP LEFT"],
			[ 0x23CC , "DENTISTRY SYMBOL LIGHT VERTICAL AND BOTTOM LEFT"],
			
			[ 0 , "Mertrical Symbols"],
			[ 0x23D1 , "METRICAL BREVE"],
			[ 0x23D2 , "METRICAL LONG OVER SHORT"],
			[ 0x23D3 , "METRICAL SHORT OVER LONG"],
			[ 0x23D4 , "METRICAL LONG OVER TWO SHORT"],
			[ 0x23D5 , "METRICAL TWO SHORT OVER LONG"],
			[ 0x23D6 , "METRICAL TWO SHORTS JOINED"],
			[ 0x23D7 , "METRICAL TRISEME"],
			[ 0x23D8 , "METRICAL TETRASEME"],
			[ 0x23D9 , "METRICAL PENTASEME"],
			
			[ 0 , "APL Symbols"],
			[ 0x2336 , "APL FUNCTIONAL SYMBOL I-BEAM"],
			[ 0x2395 , "APL FUNCTIONAL SYMBOL QUAD"],
			[ 0x2337 , "APL FUNCTIONAL SYMBOL SQUISH QUAD"],
			[ 0x2338 , "APL FUNCTIONAL SYMBOL QUAD EQUAL"],
			[ 0x2339 , "APL FUNCTIONAL SYMBOL QUAD DIVIDE"],
			[ 0x233A , "APL FUNCTIONAL SYMBOL QUAD DIAMOND"],
			[ 0x233B , "APL FUNCTIONAL SYMBOL QUAD JOT"],
			[ 0x233C , "APL FUNCTIONAL SYMBOL QUAD CIRCLE"],
			[ 0x233D , "APL FUNCTIONAL SYMBOL CIRCLE STILE"],
			[ 0x233E , "APL FUNCTIONAL SYMBOL CIRCLE JOT"],
			[ 0x233F , "APL FUNCTIONAL SYMBOL SLASH BAR"],
			
			[ 0x2340 , "APL FUNCTIONAL SYMBOL BACKSLASH BAR"],
			[ 0x2341 , "APL FUNCTIONAL SYMBOL QUAD SLASH"],
			[ 0x2342 , "APL FUNCTIONAL SYMBOL QUAD BACKSLASH"],
			[ 0x2343 , "APL FUNCTIONAL SYMBOL QUAD LESS_THAN"],
			[ 0x2344 , "APL FUNCTIONAL SYMBOL QUAD GREATER_THAN"],
			[ 0x2345 , "APL FUNCTIONAL SYMBOL LEFTWARDS VANE"],
			[ 0x2346 , "APL FUNCTIONAL SYMBOL RIGHTWARDS VANE"],
			[ 0x2347 , "APL FUNCTIONAL SYMBOL QUAD LEFTWARDS ARROW"],
			[ 0x2348 , "APL FUNCTIONAL SYMBOL QUAD RIGHTWARDS ARROW"],
			[ 0x2349 , "APL FUNCTIONAL SYMBOL CIRCLE BACKSLASH"],
			[ 0x234A , "APL FUNCTIONAL SYMBOL DOWN TACK UNDERBAR"],
			[ 0x234B , "APL FUNCTIONAL SYMBOL DELTA STILE"],
			[ 0x234C , "APL FUNCTIONAL SYMBOL QUAD DOWN CARET"],
			[ 0x234D , "APL FUNCTIONAL SYMBOL QUAD DELTA"],
			[ 0x234E , "APL FUNCTIONAL SYMBOL DOWN TACK JOT"],
			[ 0x234F , "APL FUNCTIONAL SYMBOL UPWARDS VANE"],
			
			[ 0x2350 , "APL FUNCTIONAL SYMBOL QUAD UPWARDS ARROW"],
			[ 0x2351 , "APL FUNCTIONAL SYMBOL UP TACK OVERBAR"],
			[ 0x2352 , "APL FUNCTIONAL SYMBOL DEL STILE"],
			[ 0x2353 , "APL FUNCTIONAL SYMBOL QUAD UP CARET"],
			[ 0x2354 , "APL FUNCTIONAL SYMBOL QUAD DEL"],
			[ 0x2355 , "APL FUNCTIONAL SYMBOL UP TACK JOT"],
			[ 0x2356 , "APL FUNCTIONAL SYMBOL DOWNWARDS VANE"],
			[ 0x2357 , "APL FUNCTIONAL SYMBOL QUAD DOWNWARDS ARROW"],
			[ 0x2358 , "APL FUNCTIONAL SYMBOL QUOTE UNDERBAR"],
			[ 0x2359 , "APL FUNCTIONAL SYMBOL DELTA UNDERBAR"],
			[ 0x235A , "APL FUNCTIONAL SYMBOL DIAMOND UNDERBAR"],
			[ 0x235B , "APL FUNCTIONAL SYMBOL JOT UNDERBAR"],
			[ 0x235C , "APL FUNCTIONAL SYMBOL CIRCLE UNDERBAR"],
			[ 0x235D , "APL FUNCTIONAL SYMBOL SHOE JOT"],
			[ 0x235E , "APL FUNCTIONAL SYMBOL QUOTE QUAD"],
			[ 0x235F , "APL FUNCTIONAL SYMBOL CIRCLE STAR"],
			
			[ 0x2360 , "APL FUNCTIONAL SYMBOL QUAD COLON"],
			[ 0x2361 , "APL FUNCTIONAL SYMBOL UP TACK DIAERESIS"],
			[ 0x2362 , "APL FUNCTIONAL SYMBOL DEL DIAERESIS"],
			[ 0x2363 , "APL FUNCTIONAL SYMBOL STAR DIAERESIS"],
			[ 0x2364 , "APL FUNCTIONAL SYMBOL JOT DIAERESIS"],
			[ 0x2365 , "APL FUNCTIONAL SYMBOL CIRCLE DIAERESIS"],
			[ 0x2366 , "APL FUNCTIONAL SYMBOL DOWN SHOE STILE"],
			[ 0x2367 , "APL FUNCTIONAL SYMBOL LEFT SHE STILE"],
			[ 0x2368 , "APL FUNCTIONAL SYMBOL TILDE DIAERESIS"],
			[ 0x2369 , "APL FUNCTIONAL SYMBOL GREATER_THAN DIAERESIS"],
			[ 0x236A , "APL FUNCTIONAL SYMBOL COMMA BAR"],
			[ 0x236B , "APL FUNCTIONAL SYMBOL DEL TILDE"],
			[ 0x236C , "APL FUNCTIONAL SYMBOL ZILDE"],
			[ 0x236D , "APL FUNCTIONAL SYMBOL STILE TILDE"],
			[ 0x236E , "APL FUNCTIONAL SYMBOL SEMICOLON UNDERBAR"],
			[ 0x236F , "APL FUNCTIONAL SYMBOL QUAD NOT EQUAL"],
			
			[ 0x2370 , "APL FUNCTIONAL SYMBOL QUAD QUESTION"],
			[ 0x2371 , "APL FUNCTIONAL SYMBOL DOWN CARET TILDE"],
			[ 0x2372 , "APL FUNCTIONAL SYMBOL UP CARET TILDE"],
			[ 0x2373 , "APL FUNCTIONAL SYMBOL IOTA"],
			[ 0x2374 , "APL FUNCTIONAL SYMBOL RHO"],
			[ 0x2375 , "APL FUNCTIONAL SYMBOL OMEGA"],
			[ 0x2376 , "APL FUNCTIONAL SYMBOL ALPHA UNDERBAR"],
			[ 0x2377 , "APL FUNCTIONAL SYMBOL EPISON UNDERBAR"],
			[ 0x2378 , "APL FUNCTIONAL SYMBOL IOTA UNDERBAR"],
			[ 0x2379 , "APL FUNCTIONAL SYMBOL OMEGA UNDERBAR"],
			[ 0x237A , "APL FUNCTIONAL SYMBOL ALPHA"],
			
		);


		Smiley.alltabs.Tools = new Array(
			[ 0x1F527 , "Tools"],	 
			  
			[ 0x1F525 , "FIRE"],
			[ 0x1F526 , "ELECTRIC TORCH"],
			[ 0x1F527 , "WRENCH"],
			[ 0x1F528 , "HAMMER"],
			[ 0x1F529 , "NUT AND BOLT"],
			[ 0x1F52A , "HOCHO"],
			[ 0x1F52B , "PISTOL"],
			[ 0x1F52C , "MICROSCOPE"],
			[ 0x1F52D , "TELESCOPE"],
			[ 0x1F52E , "CRYSTAL BALL"],
			[ 0x1F52F , "SIX POINTED STAR WITH MIDDLE DOT"],
			[ 0x1F530 , "JAPANESE SYMBOL FOR BEGINNER"],
			[ 0x1F531 , "TRIDENT EMBLEM"],
			  
		);	  

		Smiley.alltabs.Shapes = new Array(
			[ 0x1F532 , "Shapes"],	 
			
			[ 0x25A0 , "BLACK SQUARE"],
			[ 0x25A1 , "WHITE SQUARE"],
			[ 0x25A2 , "WHITE SQUARE WITH ROUNDED CORNERS"],
			[ 0x25A3 , "WHITE SQUARE CONTAINTING BLACK SMALL SQUARE"],
			[ 0x25A4 , "SQUARE WITH HORIZONTAL FILL"],
			[ 0x25A5 , "SQUARE WITH VERTICAL FILL"],
			[ 0x25A6 , "SQUARE WITH ORTHOGONAL CROSSHATCH FILL"],
			[ 0x25A7 , "SQUARE WITH UPPER LEFT TO LOWER RIGHT FILL"],
			[ 0x25A8 , "SQUARE WITH UPPER RIGHT TO LOWER LEFT FILL"],
			[ 0x25A9 , "SQUARE WITH DIAGONAL CROSSHATCH FILL"],
			[ 0x25AA , "BLACK SMALL SQUARE"],
			[ 0x25AB , "WHITE SMALL SQUARE"],
			[ 0x2B1D , "BLACK VERY SMALL SQUARE"],
			[ 0x2B1E , "WHITE VERY SMALL SQUARE"],
			[ 0x25AC , "BLACK RECTANGLE"],
			[ 0x25AD , "WHITE RACTANGLE"],
			[ 0x25AE , "BLACK VERTICAL SQUARE"],
			[ 0x25AF , "WHITE VERTICAL RACTANGLE"],
			
			[ 0x25B0 , "BLACK PARALLELOGRAM"],
			[ 0x25B1 , "WHITE PARALLELOGRAM"],
			[ 0x25B2 , "BLACK POINTING-UP TRIANGLE"],
			[ 0x25B3 , "WHITE POINTING-UP TRIANGLE"],
			[ 0x25B4 , "BLACK POINTING-UP SMALL TRIANGLE"],
			[ 0x25B5 , "WHITE POINTING-UP SMALL TRIANGLE"],
			[ 0x25B6 , "BLACK POINTING-RIGHT TRIANGLE"],
			[ 0x25B7 , "WHITE POINTING-RIGHT TRIANGLE"],
			[ 0x25B8 , "BLACK POINTING-RIGHT SMALL TRIANGLE"],
			[ 0x25B9 , "WHITE POINTING-RIGHT SMALL TRIANGLE"],
			[ 0x2023 , "TRIANGULAR BULLET"],
			[ 0x25BA , "BLACK POINTING-RIGHT POINTER"],
			[ 0x25BB , "WHITE POINTING-RIGHT POINTER"],
			[ 0x25BC , "BLACK POINTING-DOWN TRIANGLE"],
			[ 0x25BD , "WHITE POINTING-DOWN TRIANGLE"],
			[ 0x26DB , "HEAVY WHITE POINTING-DOWN TRIANGLE"],
			[ 0x25BE , "BLACK POINTING-DOWN SMALL TRIANGLE"],
			[ 0x25BF , "WHITE POINTING-DOWN SMALL TRIANGLE"],
			
			[ 0x25C0 , "BLACK POINTING-LEFT TRIANGLE"],
			[ 0x25C1 , "WHITE POINTING-LEFT TRIANGLE"],
			[ 0x25C2 , "BLACK POINTING-LEFT SMALL TRIANGLE"],
			[ 0x25C3 , "WHITE POINTING-LEFT SMALL TRIANGLE"],
			[ 0x25C4 , "BLACK POINTING-LEFT POINTER"],
			[ 0x25C5 , "WHITE POINTING-LEFT POINTER"],
			[ 0x25C6 , "BLACK DIAMOND"],
			[ 0x25C7 , "WHITE DIAMOND"],
			[ 0x2B25 , "BLACK MEDIUM DIAMOND"],
			[ 0x2B26 , "WHITE MEDIUM DIAMOND"],
			[ 0x25C8 , "WHITE DIAMOND CONTAINING BLACK SMALL DIAMOND"],
			[ 0x25C9 , "FISHEYE"],
			[ 0x25CA , "LOZENGE"],
			[ 0x29EB , "BLACK LOZENGE"],
			[ 0x25CB , "WHITE CIRCLE"],
			[ 0x2B58 , "HEAVY CIRCLE"],
			[ 0x25CC , "DOTTED DIRCLE"],
			[ 0x25CD , "CIRCLE WITH VERTICAL FILL"],
			[ 0x25CE , "BULLSEYE"],
			[ 0x2B57 , "HEAVY CIRCLE WITH CIRCLE INSIDE"],
			[ 0x25CF , "BLACK CIRCLE"],
			[ 0x2B24 , "BLACK LARGE CIRCLE"],
			
			[ 0x25D0 , "CIRCLE WITH LEFT HALF BLACK"],
			[ 0x25D1 , "CIRCLE WITH RIGHT HALF BLACK"],
			[ 0x25D2 , "CIRCLE WITH LOWER HALF BLACK"],
			[ 0x25D3 , "CIRCLE WITH UPPER HALF BLACK"],
			[ 0x25D4 , "CIRCLE WITH UPPER RIGHT QUADRANT BLACK"],
			[ 0x25D5 , "CIRCLE WITH ALL BUT UPPER LEFT QUADRENT BLACK"],
			[ 0x25D6 , "LEFT HALF BLACK CIRCLE"],
			[ 0x25D7 , "RIGHT HALF BLACK CIRCLE"],
			[ 0x2022 , "BULLET"],
			[ 0x25D8 , "INVERSE BULLET"],
			[ 0x25D9 , "INVERSE WHITE CIRCLE"],
			[ 0x25DA , "LOWER HALF INVERSE WHITE CIRCLE"],
			[ 0x25DB , "UPPER HALF INVERSE WHITE CIRCLE"],
			[ 0x25DC , "UPPER LEFT QUADRENT CIRCULAR ARC"],
			[ 0x25DD , "UPPER RIGHT QUADRENT CIRCULAR ARC"],
			[ 0x25DE , "LOWER RIGHT QUADRENT CIRCULAR ARC"],
			[ 0x25DF , "LOWER LEFT QUADRENT CIRCULAR ARC"],
			
			[ 0x25E0 , "UPPER HALF CIRCLE"],
			[ 0x25E1 , "LOWER HALF CIRCLE"],
			[ 0x25E2 , "BLACK LOWER RIGHT TRIANGLE"],
			[ 0x25E3 , "BLACK LOWER LEFT TRIANGLE"],
			[ 0x25E4 , "BLACK UPPER LEFT TRIANGLE"],
			[ 0x25E5 , "BLACK UPPER RIGHT TRIANGLE"],
			[ 0x25E6 , "WHITE BULLET"],
			[ 0x25E7 , "SQUARE WITH LEFT HALF BLACK"],
			[ 0x25E8 , "SQUARE WITH RIGHT HALF BLACK"],
			[ 0x2B12 , "SQUARE WITH TOP HALF BLACK"],
			[ 0x2B13 , "SQUARE WITH BOTTOM HALF BLACK"],
			[ 0x25E9 , "SQUARE WITH UPPER LEFT DIAGONAL HALF BLACK"],
			[ 0x25EA , "SQUARE WITH LOWER RIGHT DIAGONAL HALF BLACK"],
			[ 0x2B14 , "SQUARE WITH UPPER RIGHT DIAGONAL HALF BLACK"],
			[ 0x2B15 , "SQUARE WITH LOWER LEFT DIAGONAL HALF BLACK"],
			[ 0x25EB , "WHITE SQUARE WITH VERTICAL BISECTING LINE"],
			[ 0x25EC , "WHITE UP-POINTING TRIANGLE WITH DOT"],
			[ 0x25ED , "UP-POINTING TRIANGLE WIHT LEFT HALF BLACK"],
			[ 0x25EE , "UP-POINTING TRIANGLE WIHT RIGHT HALF BLACK"],
			
			[ 0x29E8 , "DOWN-POINTING TRIANGLE WIHT LEFT HALF BLACK"],
			[ 0x29E9 , "DOWN-POINTING TRIANGLE WIHT RIGHT HALF BLACK"],
			[ 0x29EA , "BLACK DIAMOND WITH DOWN ARROW"],
			[ 0x29EC , "WHITE CIRCLE WITH DOWN ARROW"],
			[ 0x29ED , "BLACK CIRCLE WITH DOWN ARROW"],
			
			
			[ 0x25EF , "LARGE CIRCLE"],
			
			[ 0x25F0 , "WHITE SQUARE WITH UPPER LEFT QUADRANT"],
			[ 0x25F1 , "WHITE SQUARE WITH LOWER LEFT QUADRANT"],
			[ 0x25F2 , "WHITE SQUARE WITH LOWER RIGHT QUADRANT"],
			[ 0x25F3 , "WHITE SQUARE WITH UPPER RIGHT QUADRANT"],
			[ 0x25F4 , "WHITE CIRCLE WITH UPPER LEFT QUADRANT"],
			[ 0x25F5 , "WHITE CIRCLE WITH LOWER LEFT QUADRANT"],
			[ 0x25F6 , "WHITE CIRCLE WITH LOWER RIGHT QUADRANT"],
			[ 0x25F7 , "WHITE CIRCLE WITH UPPER RIGHT QUADRANT"],
			[ 0x25F8 , "UPPER LEFT TRIANGLE"],
			[ 0x25F9 , "UPPER RIGHT TRIANGLE"],
			[ 0x25FA , "LOWER LEFT TRIANGLE"],
			[ 0x25FF , "LOWER RIGHT TRIANGLE"],
			[ 0x22BF , "RIGHT TRIANGLE"],
			[ 0x25FB , "WHITE MEDIUM SQUARE"],
			[ 0x25FC , "BLACK MEDIUM SQUARE"],
			[ 0x25FD , "WHITE MEDIUM SMALL SQUARE"],
			[ 0x25FE , "BLACK MEDIUM SMALL SQUARE"],
			
			[ 0x2B16 , "DIAMOND WIHT LEFT HALF BLACK"],
			[ 0x2B17 , "DIAMOND WIHT RIGHT HALF BLACK"],
			[ 0x2B18 , "DIAMOND WIHT TOP HALF BLACK"],
			[ 0x2B19 , "DIAMOND WIHT BOTTOM HALF BLACK"],
			[ 0x2B1A , "DOTTED SQUARE"],
			[ 0x2B1B , "BLACK LARGE SQUARE"],
			[ 0x2B1C , "WHITE LARGE SQUARE"],
			[ 0x2B1D , "BLACK VERY SMALL SQUARE"],
			[ 0x2B1E , "WHITE VERY SMALL SQUARE"],
			
			[ 0x2B1F , "BLACK PENTAGON"],
			[ 0x2B20 , "WHITE PENTAGON"],
			[ 0x2B21 , "WHITE HEXAGON"],
			[ 0x2B22 , "BLACK HEXAGON"],
			[ 0x2B23 , "HORIZONTAL BLACK HEXAGON"],
			
			[ 0x2B25 , "BLACK MEDIUM DIAMOND"],
			[ 0x2B26 , "WHITE MEDIUM DIAMOND"],
			[ 0x2B27 , "BLACK MEDIUM LOZENGE"],
			[ 0x2B28 , "WHITE MEDIUM LOZENGE"],
			[ 0x2B29 , "BLACK SMALL DIAMOND"],
			[ 0x22C4 , "WHITE SMALL DIAMOND"],
			[ 0x2B2A , "BLACK SMALL LOZENGE"],
			[ 0x2B2B , "WHITE SMALL LOZENGE"],
			[ 0x2B2C , "BLACK HORIZONTAL ELLIPSE"],
			[ 0x2B2D , "WHITE HORIZONTAL ELLIPSE"],
			[ 0x2B2E , "BLACK VERTICAL ELLIPSE"],
			[ 0x2B2F , "WHITE VERTICAL ELLIPSE"],
			
			[ 0x2B50 , "WHITE MEDIUM STAR"],
			[ 0x22C6 , "BLACK MEDIUM STAR"],
			[ 0x2B51 , "BLACK SMALL STAR"],
			[ 0x2B52 , "WHITE SMALL STAR"],
			[ 0x2B53 , "BLACK RIGHT-POINTING HEXAGON"],
			[ 0x2B54 , "WHITE RIGHT-POINTING HEXAGON"],
			[ 0x2B55 , "HEAVY LARGE CIRCLE"],
			[ 0x274C , "CROSS MARK"],
			[ 0x2B56 , "HEAVY LARGE OVAL WITH OVAL INSIDE"],
			[ 0x2B57 , "HEAVY LARGE CIRCLE WITH CIRCLE INSIDE"],
			[ 0x2B58 , "HEAVY CIRCLE"],
			[ 0x2B59 , "HEAVY CIRCLED SALTIRE"],
			
			[ 0 , "Emoji Shapes" ],
			[ 0x1F532 , "BLACK SQUARE BUTTON"],
			[ 0x1F533 , "WHITE SQUARE BUTTON"],
			[ 0x1F534 , "LARGE RED CIRCLE"],
			[ 0x1F535 , "LARGE BLUE CIRCLE"],
			[ 0x1F536 , "LARGE ORANGE DIAMOND"],
			[ 0x1F537 , "LARGE BLUE DIAMOND"],
			[ 0x1F538 , "SMALL ORANGE DIAMOND"],
			[ 0x1F539 , "SMALL BLUE DIAMOND"],
			[ 0x1F53A , "UP-POINTING RED TRIANGLE"],
			[ 0x1F53B , "DOWN-POINTING RED TRIANGLE"],
			[ 0x1F53C , "UP-POINTING SMALL RED TRIANGLE"],
			[ 0x1F53D , "DOWN-POINTING SMALL RED TRIANGLE"],
			/*  <td title="reserved" bgcolor="#CCCCCC"></td>
			  <td title="reserved" bgcolor="#CCCCCC"></td>*/
			[ 0x274D , "SHADOWED WHITE CIRCLE"],
			[ 0x274F , "LOWER RIGHT DROP-SHADOWED WHITE SQUARE"],
			[ 0x2750 , "UPPER RIGHT DROP-SHADOWED WHITE SQUARE"],
			[ 0x2751 , "LOWER RIGHT SHADOWED WHITE SQUARE"],
			[ 0x2752 , "UPPER RIGHT SHADOWED WHITE SQUARE"],
			  
			[ 0 , "Box Drawing" ],
			[ 0x2500 , "BOX DRAWINGS LIGHT HORIZONTAL "],
			[ 0x2501 , "BOX DRAWINGS HEAVY HORIZONTAL"],
			[ 0x2502 , "BOX DRAWINGS LIGHT VERTICAL"],
			[ 0x2503 , "BOX DRAWINGS HEAVY VERTICAL"],
			[ 0x2504 , "BOX DRAWINGS LIGHT TRIPLE DASH HORIZONTAL"],
			[ 0x2505 , "BOX DRAWINGS HEAVY TRIPLE DASH HORIZONTAL"],
			[ 0x2506 , "BOX DRAWINGS LIGHT TRIPLE DASH VERTICAL"],
			[ 0x2507 , "BOX DRAWINGS HEAVY TRIPLE DASH VERTICAL"],
			[ 0x2508 , "BOX DRAWINGS LIGHT QUADRUPLE DASH HORIZONTAL"],
			[ 0x2509 , "BOX DRAWINGS HEAVY QUADRUPLE DASH HORIZONTAL"],
			[ 0x250A , "BOX DRAWINGS LIGHT QUADRUPLE DASH VERTICAL"],
			[ 0x250B , "BOX DRAWINGS HEAVY QUADRUPLE DASH VERTICAL"],
			[ 0x250C , "BOX DRAWINGS LIGHT DOWN AND RIGHT"],
			[ 0x250D , "BOX DRAWINGS DOWN LIGHT AND RIGHT HEAVY"],
			[ 0x250E , "BOX DRAWINGS DOWN HEAVY AND RIGHT LIGHT"],
			[ 0x250F , "BOX DRAWINGS HEAVY DOWN AND RIGHT"],
			
			[ 0x2510 , "BOX DRAWINGS LIGHT DOWN AND LEFT"],
			[ 0x2511 , "BOX DRAWINGS DOWN LIGHT AND LEFT HEAVY"],
			[ 0x2512 , "BOX DRAWINGS DOWN HEAVY AND LEFT LIGHT"],
			[ 0x2513 , "BOX DRAWINGS HEAVY DOWN AND LEFT"],
			[ 0x2514 , "BOX DRAWINGS LIGHT UP AND RIGHT"],
			[ 0x2515 , "BOX DRAWINGS UP LIGHT AND RIGHT HEAVY"],
			[ 0x2516 , "BOX DRAWINGS UP HEAVY AND RIGHT LIGHT"],
			[ 0x2517 , "BOX DRAWINGS HEAVY UP AND RIGHT"],
			[ 0x2518 , "BOX DRAWINGS LIGHT UP AND LEFT"],
			[ 0x2519 , "BOX DRAWINGS UP LIGHT AND LEFT HEAVY"],
			[ 0x251A , "BOX DRAWINGS UP HEAVY AND LEFT LIGHT"],
			[ 0x251B , "BOX DRAWINGS HEAVY UP AND LEFT"],
			[ 0x251C , "BOX DRAWINGS LIGHT VERTICAL AND RIGHT"],
			[ 0x251D , "BOX DRAWINGS VERTICAL LIGHT AND RIGHT HEAVY"],
			[ 0x251E , "BOX DRAWINGS UP HEAVY AND RIGHT DOWN LIGHT"],
			[ 0x251F , "BOX DRAWINGS DOWN HEAVY AND RIGHT UP LIGHT"],
			
			[ 0x2520 , "BOX DRAWINGS VERTICAL HEAVY AND RIGHT LIGHT"],
			[ 0x2521 , "BOX DRAWINGS DOWN LIGHT AND RIGHT UP HEAVY"],
			[ 0x2522 , "BOX DRAWINGS UP LIGHT AND RIGHT DOWN HEAVY"],
			[ 0x2523 , "BOX DRAWINGS HEAVY VERTICAL AND RIGHT"],
			[ 0x2524 , "BOX DRAWINGS LIGHT VERTICAL AND LEFT"],
			[ 0x2525 , "BOX DRAWINGS VERTICAL LIGHT AND LEFT HEAVY"],
			[ 0x2526 , "BOX DRAWINGS UP HEAVY AND LEFT DOWN LIGHT"],
			[ 0x2527 , "BOX DRAWINGS DOWN HEAVY AND LEFT UP LIGHT"],
			[ 0x2528 , "BOX DRAWINGS VERTICAL HEAVY AND LEFT LIGHT"],
			[ 0x2529 , "BOX DRAWINGS DOWN LIGHT AND LEFT UP HEAVY"],
			[ 0x252A , "BOX DRAWINGS UP LIGHT AND LEFT DOWN HEAVY"],
			[ 0x252B , "BOX DRAWINGS HEAVY VERTICAL AND LEFT"],
			[ 0x252C , "BOX DRAWINGS LIGHT DOWN AND HORIZONTAL"],
			[ 0x252D , "BOX DRAWINGS LEFT HEAVY AND RIGHT DOWN LIGHT"],
			[ 0x252E , "BOX DRAWINGS RIGHT HEAVY AND LEFT DOWN LIGHT"],
			[ 0x252F , "BOX DRAWINGS DOWN LIGHT AND HORIZONTAL HEAVY"],
			
			[ 0x2530 , "BOX DRAWINGS DOWN HEAVY AND HORIZONTAL LIGHT"],
			[ 0x2531 , "BOX DRAWINGS RIGHT LIGHT AND LEFT DOWN HEAVY"],
			[ 0x2532 , "BOX DRAWINGS LEFT LIGHT AND RIGHT DOWN HEAVY"],
			[ 0x2533 , "BOX DRAWINGS HEAVY DOWN AND HORIZONTAL"],
			[ 0x2534 , "BOX DRAWINGS LIGHT UP AND HORIZONTAL"],
			[ 0x2535 , "BOX DRAWINGS LEFT HEAVY AND RIGHT UP LIGHT"],
			[ 0x2536 , "BOX DRAWINGS RIGHT HEAVY AND LEFT UP LIGHT"],
			[ 0x2537 , "BOX DRAWINGS UP LIGHT AND HORIZONTAL HEAVY"],
			[ 0x2538 , "BOX DRAWINGS UP HEAVY AND HORIZONTAL LIGHT"],
			[ 0x2539 , "BOX DRAWINGS RIGHT LIGHT AND LEFT UP HEAVY"],
			[ 0x253A , "BOX DRAWINGS LEFT LIGHT AND RIGHT UP HEAVY"],
			[ 0x253B , "BOX DRAWINGS HEAVY UP AND HORIZONTAL"],
			[ 0x253C , "BOX DRAWINGS LIGHT VERTICAL AND HORIZONTAL"],
			[ 0x253D , "BOX DRAWINGS LEFT HEAVY AND RIGHT VERTICAL LIGHT"],
			[ 0x253E , "BOX DRAWINGS RIGHT HEAVY AND LEFT VERTICAL LIGHT"],
			[ 0x253F , "BOX DRAWINGS VERTICAL LIGHT AND HORIZONTAL HEAVY"],
			
			[ 0x2540 , "BOX DRAWINGS UP HEAVY AND DOWN HORIZONTAL LIGHT"],
			[ 0x2541 , "BOX DRAWINGS DOWN HEAVY AND UP HORIZONTAL LIGHT"],
			[ 0x2542 , "BOX DRAWINGS VERTICAL HEAVY AND HORIZONTAL LIGHT"],
			[ 0x2543 , "BOX DRAWINGS LEFT UP HEAVY AND RIGHT DOWN LIGHT"],
			[ 0x2544 , "BOX DRAWINGS RIGHT UP HEAVY AND LEFT DOWN LIGHT"],
			[ 0x2545 , "BOX DRAWINGS LEFT DOWN HEAVY AND RIGHT UP LIGHT"],
			[ 0x2546 , "BOX DRAWINGS RIGHT DOWN HEAVY AND LEFT UP LIGHT"],
			[ 0x2547 , "BOX DRAWINGS DOWN LIGHT AND UP HORIZONTAL HEAVY"],
			[ 0x2548 , "BOX DRAWINGS UP LIGHT AND DOWN HORIZONTAL HEAVY"],
			[ 0x2549 , "BOX DRAWINGS RIGHT LIGHT AND LEFT VERTICAL HEAVY"],
			[ 0x254A , "BOX DRAWINGS LEFT LIGHT AND RIGHT VERTICAL HEAVY"],
			[ 0x254B , "BOX DRAWINGS HEAVY VERTICAL AND HORIZONTAL"],
			[ 0x254C , "BOX DRAWINGS LIGHT DOUBLE DASH HORIZONTAL"],
			[ 0x254D , "BOX DRAWINGS HEAVY DOUBLE DASH HORIZONTAL"],
			[ 0x254E , "BOX DRAWINGS LIGHT DOUBLE DASH VERTICAL"],
			[ 0x254F , "BOX DRAWINGS HEAVY DOUBLE DASH VERTICAL"],
			
			[ 0x2550 , "BOX DRAWINGS DOUBLE HORIZONTAL"],
			[ 0x2551 , "BOX DRAWINGS DOUBLE VERTICAL"],
			[ 0x2552 , "BOX DRAWINGS DOWN SINGLE AND RIGHT DOUBLE"],
			[ 0x2553 , "BOX DRAWINGS DOWN DOUBLE AND RIGHT SINGLE"],
			[ 0x2554 , "BOX DRAWINGS DOUBLE DOWN AND RIGHT"],
			[ 0x2555 , "BOX DRAWINGS DOWN SINGLE AND LEFT DOUBLE"],
			[ 0x2556 , "BOX DRAWINGS DOWN DOUBLE AND LEFT SINGLE"],
			[ 0x2557 , "BOX DRAWINGS DOUBLE DOWN AND LEFT"],
			[ 0x2558 , "BOX DRAWINGS UP SINGLE AND RIGHT DOUBLE"],
			[ 0x2559 , "BOX DRAWINGS UP DOUBLE AND RIGHT SINGLE"],
			[ 0x255A , "BOX DRAWINGS DOUBLE UP AND RIGHT"],
			[ 0x255B , "BOX DRAWINGS UP SINGLE AND LEFT DOUBLE"],
			[ 0x255C , "BOX DRAWINGS UP DOUBLE AND LEFT SINGLE"],
			[ 0x255D , "BOX DRAWINGS DOUBLE UP AND LEFT"],
			[ 0x255E , "BOX DRAWINGS VERTICAL SINGLE AND RIGHT DOUBLE"],
			[ 0x255F , "BOX DRAWINGS VERTICAL DOUBLE AND RIGHT SINGLE"],
			
			[ 0x2560 , "BOX DRAWINGS DOUBLE VERTICAL AND RIGHT"],
			[ 0x2561 , "BOX DRAWINGS VERTICAL SINGLE AND LEFT DOUBLE"],
			[ 0x2562 , "BOX DRAWINGS VERTICAL DOUBLE AND LEFT SINGLE"],
			[ 0x2563 , "BOX DRAWINGS DOUBLE VERTICAL AND LEFT"],
			[ 0x2564 , "BOX DRAWINGS DOWN SINGLE AND HORIZONTAL DOUBLE"],
			[ 0x2565 , "BOX DRAWINGS DOWN DOUBLE AND HORIZONTAL SINGLE"],
			[ 0x2566 , "BOX DRAWINGS DOUBLE DOWN AND HORIZONTAL"],
			[ 0x2567 , "BOX DRAWINGS UP SINGLE AND HORIZONTAL DOUBLE"],
			[ 0x2568 , "BOX DRAWINGS UP DOUBLE AND HORIZONTAL SINGLE"],
			[ 0x2569 , "BOX DRAWINGS DOUBLE UP AND HORIZONTAL"],
			[ 0x256A , "BOX DRAWINGS VERTICAL SINGLE AND HORIZONTAL DOUBLE"],
			[ 0x256B , "BOX DRAWINGS VERTICAL DOUBLE AND HORIZONTAL SINGLE"],
			[ 0x256C , "BOX DRAWINGS DOUBLE VERTICAL AND HORIZONTAL"],
			[ 0x256D , "BOX DRAWINGS LIGHT ARC DOWN AND RIGHT"],
			[ 0x256E , "BOX DRAWINGS LIGHT ARC DOWN AND LEFT"],
			[ 0x256F , "BOX DRAWINGS LIGHT ARC UP AND LEFT"],
			
			[ 0x2570 , "BOX DRAWINGS LIGHT ARC UP AND RIGHT"],
			[ 0x2571 , "BOX DRAWINGS LIGHT DIAGONAL UPPER RIGHT TO LOWER LEFT"],
			[ 0x2572 , "BOX DRAWINGS LIGHT DIAGONAL UPPER LEFT TO LOWER RIGHT"],
			[ 0x2573 , "BOX DRAWINGS LIGHT DIAGONAL CROSS"],
			[ 0x2574 , "BOX DRAWINGS LIGHT LEFT"],
			[ 0x2575 , "BOX DRAWINGS LIGHT UP"],
			[ 0x2576 , "BOX DRAWINGS LIGHT RIGHT"],
			[ 0x2577 , "BOX DRAWINGS LIGHT DOWN"],
			[ 0x2578 , "BOX DRAWINGS HEAVY LEFT"],
			[ 0x2579 , "BOX DRAWINGS HEAVY UP"],
			[ 0x257A , "BOX DRAWINGS HEAVY RIGHT"],
			[ 0x257B , "BOX DRAWINGS HEAVY DOWN"],
			[ 0x257C , "BOX DRAWINGS LIGHT LEFT AND HEAVY RIGHT"],
			[ 0x257D , "BOX DRAWINGS LIGHT UP AND HEAVY DOWN"],
			[ 0x257E , "BOX DRAWINGS HEAVY LEFT AND LIGHT RIGHT"],
			[ 0x257F , "BOX DRAWINGS HEAVY UP AND LIGHT DOWN"],
			
			[ 0 , "" ],
			[ 0x23BA , "HORIZONTAL SCAN LINE-1"],
			[ 0x23BB , "HORIZONTAL SCAN LINE-3"],
			[ 0x23BC , "HORIZONTAL SCAN LINE-7"],
			[ 0x23BD , "HORIZONTAL SCAN LINE-9"],
			[ 0x23B8 , "LEFT VERTICAL BOX LINE"],
			[ 0x23B9 , "RIGHT VERTICAL BOX LINE"],
			
			[ 0 , "Block Elements" ],
			[ 0x2580 , "UPPER HALF BLOCK"],
			[ 0x2581 , "LOWER ONE EIGHT BLOCK"],
			[ 0x2582 , "LOWER ONE QUARTER BLOCK"],
			[ 0x2583 , "LOWER THREE EIGHTS BLOCK"],
			[ 0x2584 , "LOWER HALF BLOCK"],
			[ 0x2585 , "LOWER FIVE EIGHTS BLOCK"],
			[ 0x2586 , "LOWER THREE QUARTERS BLOCK"],
			[ 0x2587 , "LOWER SEVEN EIGHTS BLOCK"],
			[ 0x2588 , "FULL BLOCK"],
			[ 0x2589 , "LEFT SEVEN EIGHTS BLOCK"],
			[ 0x258A , "LEFT THREE QUARTERS BLOCK"],
			[ 0x258B , "LEFT FIVE EIGHTS BLOCK"],
			[ 0x258C , "LEFT HALF BLOCK"],
			[ 0x258D , "LEFT THREE EIGHTS BLOCK"],
			[ 0x258E , "LEFT ONE QUARTER BLOCK"],
			[ 0x258F , "LEFT ONE EIGHT BLOCK"],
			
			[ 0x2590 , "RIGHT HALF BLOCK"],
			[ 0x2591 , "LIGHT SHADE"],
			[ 0x2592 , "MEDIUM SHADE"],
			[ 0x2593 , "DARK SHADE"],
			[ 0x2594 , "UPPER ONE EIGHT BLOCK"],
			[ 0x2595 , "RIGHT ONE EIGHT BLOCK"],
			[ 0x2596 , "QUADRANT LOWER LEFT"],
			[ 0x2597 , "QUADRANT LOWER RIGHT"],
			[ 0x2598 , "QUADRANT UPPER LEFT"],
			[ 0x259D , "QUADRANT UPPER RIGHT"],
			[ 0x2599 , "QUADRANT UPPER LEFT AND LOWER LEF T AND LOWER RIGHT"],
			[ 0x259A , "QUADRANT UPPER LEFT AND LOWER RIGHT"],
			[ 0x259B , "QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER LEFT"],
			[ 0x259C , "QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER RIGHT"],
			[ 0x259E , "QUADRANT UPPER RIGHT AND LOWER LEFT"],
			[ 0x259F , "QUADRANT UPPER RIGHT AND LOWER LEFT AND LOWER RIGHT"],
			
			[ 0x2758 , "LIGHT VERTICAL BAR"],
			[ 0x2759 , "MEDIUM VERTICAL BAR"],
			[ 0x275A , "HEAVY VERTICAL BAR"],
			
			[0, "Spaces"],
			[32 , "Normal Space" ],
			[0x2002 , "en_space" ],
			[0x2003 , "em_space" ],
			[0x2005 , "for-per-em_space" ],
			
		);

		Smiley.alltabs.Dingbats = new Array(
			[ 0x2756 , "Dingbats"],	 
			
			[ 0x2701 , "UPPER BLADE SCISSORS"],
			[ 0x2702 , "BLACK SCISSORS"],
			[ 0x2703 , "LOWER BLADE SCISSORS"],
			[ 0x2704 , "WHITE SCISSORS"],
			[ 0x2705 , "WHITE HEAVY CHECK MARK"],
			[ 0x2714 , "BLACK HEAVY CHECK MARK"],
			[ 0x2713 , "CHECK MARK"],
			[ 0x2706 , "TELEPHONE LOCATION SIGN"],
			[ 0x2707 , "TAPE DRIVE"],
			[ 0x2708 , "AIRPLANE"],
			[ 0x2709 , "ENVELOPE"],
			[ 0x270A , "RAISED FIST"],
			[ 0x270B , "RAISED HAND"],
			[ 0x270C , "VICTORY HAND"],
			[ 0x270D , "WRITTING HAND"],
			[ 0x270E , "LOWER RIGHT PENCIL"],
			[ 0x270F , "PENCIL"],
			
			[ 0x2710 , "UPPER RIGHT PENCIL"],
			[ 0x2711 , "WHITE NIB"],
			[ 0x2712 , "BLACK NIB"],
			[ 0x2715 , "MULTIPLICATION x"],
			[ 0x2716 , "HEAVY MULTIPLICATION x"],
			[ 0x2795 , "HEAVY PLUS SIGN"],
			[ 0x2796 , "HEAVY MINUS SIGN"],
			[ 0x2797 , "HEAVY DIVISION SIGN"],
			[ 0x2717 , "BALLOT X"],
			[ 0x2718 , "HEAVY BALLOT X"],
			
			[ 0x274C , "CROSS MARK"],
			[ 0x274D , "SHADOWED WHITE CIRCLE"],
			[ 0x274E , "NEGATIVE SQUARED CROSS MARK"],
			[ 0x274F , "LOWER RIGHT DROP-SHADOWED WHITE SQUARE"],
			
			[ 0x2750 , "UPPER RIGHT DROP-SHADOWED WHITE SQUARE"],
			[ 0x2751 , "LOWER RIGHT SHADOWED WHITE SQUARE"],
			[ 0x2752 , "UPPER RIGHT SHADOWED WHITE SQUARE"],
			[ 0x2753 , "BLACK QUESTION MARK ORNAMENT"],
			[ 0x2754 , "WHITE QUESTION MARK ORNAMENT"],
			[ 0x2755 , "WHITE EXCLAMATION MARK ORNAMENT"],
			[ 0x2756 , "BLACK DIAMOND MINUE WHITE X"],
			[ 0x2757 , "HEAVY EXCLAMATION MARK SYMBOL"],
			[ 0x2758 , "LIGHT VERTICAL BAR"],
			[ 0x2759 , "MEDIUM VERTICAL BAR"],
			[ 0x275A , "HEAVY VERTICAL BAR"],
			
			[ 0x27B0 , "CURLY LOOP"],
			[ 0x27BF , "DOUBLE CURLEY LOOP"],
			
			[ 0 , "Stars, Asterisks and Snowflakes"],
			[ 0x2722 , "FOUR TEARDTOP-SPOKED ASTERISK"],
			[ 0x2723 , "FOUR BALOON-SPOKED ASTERISK"],
			[ 0x2724 , "HEAVY FOUR BALOON-SPOKED ASTERISK"],
			[ 0x2725 , "FOUR CLUB-SPOKED ASTERISK"],
			[ 0x2726 , "BLACK FOUR POINTED STAR"],
			[ 0x2727 , "WHITE FOUR POINTED STAR"],
			[ 0x2728 , "SPARKLES"],
			[ 0x2606 , "WHITE STAR"],
			[ 0x2729 , "STRESS OUTLINED WHITE STAR"],
			[ 0x272A , "CIRCLED WHITE STAR"],
			[ 0x272B , "OPEN CENTRE BLACK STAR"],
			[ 0x272C , "BLACK CENTRE WHITE STAR"],
			[ 0x272D , "OUTLINED BLACK STAR"],
			[ 0x272E , "HEAVY OUTLINED BLACK STAR"],
			[ 0x272F , "PINWHEEL STAR"],
			
			[ 0x2730 , "SHADOWED WHITE STAR"],
			[ 0x2731 , "HEAVY ASTERISK"],
			[ 0x2732 , "OPEN CENTRE ASTERISK"],
			[ 0x2733 , "EIGHT SPOKED ASTERISK"],
			[ 0x2734 , "EIGHT POINTED BLACK STAR"],
			[ 0x2735 , "EIGHT POINTED PINWHEEL STAR"],
			[ 0x2736 , "SIX POINTED BLACK STAR"],
			[ 0x2737 , "EIGHT POINTED RECTILINEAR BLACK STAR"],
			[ 0x2738 , "HEAVY EIGHT POINTED RECTILINEAR BLACK STAR"],
			[ 0x2739 , "TWELVE POINTED BLACK STAR"],
			[ 0x273A , "SIXTEEN POINTED BLACK STAR"],
			[ 0x273B , "TEARDROP-SPOKED ASTERISK"],
			[ 0x273C , "OPEN CENTRE TEARDROP-SPOKED ASTERISK"],
			[ 0x273D , "HEAVY TEARDROP-SPOKED ASTERISK"],
			[ 0x273E , "SIX PETALLED BLACK AND WHITE FLORETTE"],
			[ 0x273F , "BLACK FLORETTE"],
			
			[ 0x2740 , "WHITE FLORETTE"],
			[ 0x2741 , "EIGHT PETALED OUTLINED BLACK FLORETTE"],
			[ 0x2742 , "CIRCLED OPEN CENTER EIGHT POINTED STAR"],
			[ 0x2743 , "HEAVY TEARDROP-SPOKED PINWHEELED ASTERISK"],
			[ 0x2744 , "SNOWFLAKE"],
			[ 0x2745 , "TIGHT TRIFOLIATE SNOWFLAKE"],
			[ 0x2746 , "HEAVY CHEVRON SNOWFLAKE"],
			[ 0x2747 , "SPARKLE"],
			[ 0x2748 , "HEAVY SPARKLE"],
			[ 0x2749 , "BALOON-SPOKED ASTERISK"],
			[ 0x274A , "EIGHT TEARDROP-SPOKED PROPELLER ASTERISK"],
			[ 0x274B , "HEAVY EIGHT TEARDROP-SPOKED PROPELLER ASTERISK"],
			
			[ 0 , "Punctuation Ornaments"],
			[ 0x275B , "HEAVY SINGLE TURNED COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275C , "HEAVY SINGLE COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275D , "HEAVY DOUBLE TURNED COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275E , "HEAVY DOUBLE COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275F , "HEAVY LOW SINGLE COMMA QUOTATION MARK ORNAMENT"],
			
			[ 0x2760 , "HEAVY LOW DOUBLE COMMA QUOTATION MARK ORNAMENT"],
			[ 0x2761 , "CURVED STEM PARAGRAPH SIGN ORNAMENT"],
			[ 0x2762 , "HEAVY EXCLAIMATION MARK ORNAMENT"],
			[ 0x2763 , "HEAVY HEART EXCLAMATION MARK ORNAMENT"],
			[ 0x2764 , "HEAVY BLACK HEART"],
			[ 0x2765 , "ROTATED HEAVY BLACK HEART BULLET"],
			[ 0x2766 , "FLORAL HEART"],
			[ 0x2767 , "ROTATED FLORAL HEART BULLET"],
			[ 0x2619 , "REVERSE ROTATED FLORAL HEART BULLET"],
			[ 0x2768 , "MEDIUM LEFT PARENTHESIS ORNAMENT"],
			[ 0x2769 , "MEDIUM RIGHT PARENTHESIS ORNAMENT"],
			[ 0x276A , "MEDIUM FLATTENED LEFT PARENTHESIS ORNAMENT"],
			[ 0x276B , "MEDIUM FLATTENED RIGHT PARENTHESIS ORNAMENT"],
			[ 0x276C , "MEDIUM LEFT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x276D , "MEDIUM RIGHT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x276E , "HEAVY LEFT-POINTING ANGEL QUOTATION MARK ORNAMENT"],
			[ 0x276F , "HEAVY RIGHT-POINTING ANGEL QUOTATION MARK ORNAMENT"],
			
			[ 0x2770 , "HEAVY LEFT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x2771 , "HEAVY RIGHT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x2772 , "LIGHT LEFT-POINTING TORTOISE SHELL BRACKED ORNAMENT"],
			[ 0x2773 , "LIGHT RIGHT-POINTING TORTOISE SHELL BRACKED ORNAMENT"],
			[ 0x2774 , "MEDIUM LEFT CURLY BRACKET ORNAMENT"],
			[ 0x2775 , "MEDIUM RIGHT CURLY BRACKET ORNAMENT"],
			
			[ 0 , "Dingbat Circled Digits"],
			[ 0x2776 , "DINGBAT NEGATIVE CIRCLED DIGIT ONE"],
			[ 0x2777 , "DINGBAT NEGATIVE CIRCLED DIGIT TWO"],
			[ 0x2778 , "DINGBAT NEGATIVE CIRCLED DIGIT THREE"],
			[ 0x2779 , "DINGBAT NEGATIVE CIRCLED DIGIT FOUR"],
			[ 0x277A , "DINGBAT NEGATIVE CIRCLED DIGIT FIVE"],
			[ 0x277B , "DINGBAT NEGATIVE CIRCLED DIGIT SIX"],
			[ 0x277C , "DINGBAT NEGATIVE CIRCLED DIGIT SEVEN"],
			[ 0x277D , "DINGBAT NEGATIVE CIRCLED DIGIT EIGHT"],
			[ 0x277E , "DINGBAT NEGATIVE CIRCLED DIGIT NINE"],
			[ 0x277F , "DINGBAT NEGATIVE CIRCLED NUMBER TEN"],
			
			[ 0x2780 , "DINGBAT CIRCLED SANS-SERIF DIGIT ONE"],
			[ 0x2781 , "DINGBAT CIRCLED SANS-SERIF DIGIT TWO"],
			[ 0x2782 , "DINGBAT CIRCLED SANS-SERIF DIGIT THREE"],
			[ 0x2783 , "DINGBAT CIRCLED SANS-SERIF DIGIT FOUR"],
			[ 0x2784 , "DINGBAT CIRCLED SANS-SERIF DIGIT FIVE"],
			[ 0x2785 , "DINGBAT CIRCLED SANS-SERIF DIGIT SIX"],
			[ 0x2786 , "DINGBAT CIRCLED SANS-SERIF DIGIT SEVER"],
			[ 0x2787 , "DINGBAT CIRCLED SANS-SERIF DIGIT EIGHT"],
			[ 0x2788 , "DINGBAT CIRCLED SANS-SERIF DIGIT NINE"],
			[ 0x2789 , "DINGBAT CIRCLED SANS-SERIF NUMBER TEN"],
			[ 0x278A , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT ONE"],
			[ 0x278B , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT TWO"],
			[ 0x278C , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT THREE"],
			[ 0x278D , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT FOUR"],
			[ 0x278E , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT FIVE"],
			[ 0x278F , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT SIX"],
			
			[ 0x2790 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT SEVEN"],
			[ 0x2791 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT EIGHT"],
			[ 0x2792 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT NINE"],
			[ 0x2793 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF NUMBER TEN"],
			
			[ 0 , "Dingbat Arrows"],
			[ 0x2794 , "HEAVY WIDE-HEADED RIGHTWARDS ARROW"],
			[ 0x2798 , "HEAVY SOUTH EAST ARROW"],
			[ 0x2799 , "HEAVY RIGHTWARDS ARROW"],
			[ 0x279A , "HEAVY NORTH EAST ARROW"],
			[ 0x279B , "DRAFTING POINT RIGHTWARDS ARROW"],
			[ 0x279C , "HEAVY ROUND-TIPPED RIGHTWARDS ARROW"],
			[ 0x279D , "TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279E , "HEAVY TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279F , "DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			
			[ 0x27A0 , "HEAVY DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x27A1 , "BLACK RIGHTWARDS ARROW"],
			[ 0x2B05 , "BLACK LEFTWARDS ARROW"],
			[ 0x27A2 , "THREE-D TOP-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A3 , "THREE-D BOTTOM-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A4 , "BLACK RIGHTWARDS ARROWHEAD"],
			[ 0x27A5 , "HEAVY BLACK CURVED DOWNAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A6 , "HEAVY BLACK CURVED UPAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A7 , "SQUAT BLACK RIGHTWARDS ARROW"],
			[ 0x27A8 , "HEAVY CONCAVE-POIINTED BLACK RIGHTWARDS ARROW"],
			[ 0x27A9 , "RIGHT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AA , "LEFT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AB , "BLACK-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AC , "FRONT-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AD , "HEAVY LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AE , "HEAVY UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AF , "NOTCHED LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			
			[ 0x27B1 , "NOTCHED UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27B2 , "CIRCLED HEAVY WHITE RIGHTWARDS ARROW"],
			[ 0x27B3 , "WHITE-FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B4 , "BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B5 , "BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B6 , "BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27B7 , "HEAVY BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B8 , "HEAVY BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B9 , "HEAVY BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27BA , "TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BB , "HEAVY TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BC , "WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BD , "HEAVY WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BE , "OPEN-OUTLINED RIGHTWARDS ARROW"],
			
		);


		Smiley.alltabs.Clocks = new Array(
			[ 0x1F552 , "Clocks"],	 
			
			[ 0x1F550 , "CLOCK FACE ONE OCLOCK"],
			[ 0x1F551 , "CLOCK FACE TWO OCLOCK"],
			[ 0x1F552 , "CLOCK FACE THREE OCLOCK"],
			[ 0x1F553 , "CLOCK FACE FOUR OCLOCK"],
			[ 0x1F554 , "CLOCK FACE FIVE OCLOCK"],
			[ 0x1F555 , "CLOCK FACE SIX OCLOCK"],
			[ 0x1F556 , "CLOCK FACE SEVEN OCLOCK"],
			[ 0x1F557 , "CLOCK FACE EIGHT OCLOCK"],
			[ 0x1F558 , "CLOCK FACE NINE OCLOCK"],
			[ 0x1F559 , "CLOCK FACE TEN OCLOCK"],
			[ 0x1F55A , "CLOCK FACE ELEVEN OCLOCK"],
			[ 0x1F55B , "CLOCK FACE TWELVE OCLOCK"],
			[ 0 , "" ],
			[ 0x1F55C , "CLOCK FACE ONE-THIRTY"],
			[ 0x1F55D , "CLOCK FACE TWO-THIRTY"],
			[ 0x1F55E , "CLOCK FACE THREE-THIRTY"],
			[ 0x1F55F , "CLOCK FACE FOUR-THIRTY"],
			[ 0x1F560 , "CLOCK FACE FIVE-THIRTY"],
			[ 0x1F561 , "CLOCK FACE SIX-THIRTY"],
			[ 0x1F562 , "CLOCK FACE SEVEN-THIRTY"],
			[ 0x1F563 , "CLOCK FACE EIGHT-THIRTY"],
			[ 0x1F564 , "CLOCK FACE NINE-THIRTY"],
			[ 0x1F565 , "CLOCK FACE TEN-THIRTY"],
			[ 0x1F566 , "CLOCK FACE ELEVEN-THIRTY"],
			[ 0x1F567 , "CLOCK FACE TWELVE-THIRTY"],
			[ 0 , "Clock Types" ],
			[ 0x231A , "WATCH" ],
			[ 0x231B , "HOURGLASS" ],
			[ 0x23F3 , "HOURGLASS WITH FLOWING SAND" ],
			[ 0x23F1 , "STOPWATCH" ],
			[ 0x23F2 , "TIMER CLOCK" ],
			[ 0x23F0 , "ALARM CLOCK" ],

		);


		Smiley.alltabs.Medical = new Array(
			[ 0x2620 , "Medical and Warning Symbols"],	 

			[ 0x1F489 , "SYRINGE"],
			[ 0x1F48A , "PILL"],
			[ 0x2624 , "CADUCEUS"],
			[ 0x2695 , "STAFF OF AESCULAPIUS"],
			[ 0x2625 , "ANKH"],
			[ 0 , "" ],
			[ 0x2620 , "SKULL AND CROSSBONES"],
			[ 0x2621 , "CAUTION SING"],
			[ 0x2622 , "RADIOACTIVE SIGN"],
			[ 0x2623 , "BIOHAZARD SIGN"],
			[ 0x26A0 , "WARNING SIGN"],
			[ 0x26A1 , "HIGH VOLTAGE SIGN"],

		);


		Smiley.alltabs.Religious = new Array(
			[ 0x262E , "Religious and Political Symbols"],	 

			[ 0x2719 , "OUTLINED GREEK CROSS"],
			[ 0x271A , "HEAVY GREEK CROSS"],
			[ 0x271B , "OPEN CENTRE CROSS"],
			[ 0x271C , "HEAVY OPEN CENTRE CROSS"],
			[ 0x271D , "LATIN CROSS"],
			[ 0x271E , "SHADOWED WHITE LATIN CROSS"],
			[ 0x271F , "OUTLINED LATIN CROSS"],
			[ 0x2720 , "MALTESE CROSS"],
			[ 0x2721 , "STAR OF DAVID"],
			
			[ 0x2626 , "ORTHODOX CROSS"],
			[ 0x2627 , "CHI RHO"],
			[ 0x2628 , "CROSS OF LORRAINE"],
			[ 0x2629 , "CROSS OF JERUSALEM"],
			[ 0x2613 , "SALTIRE"],
			[ 0x1F540, "CIRCLED CROSS POMMEE"],
			[ 0x1F541, "CROSS POMMEE WITH HALF-CIRCLE BELOW"],
			[ 0x1F542, "CROSS POMMEE"],
			[ 0x1F543, "NOTCHED LEFT SEMICIRCLE WITH THREE DOTS"],
			[ 0x2638 , "WHEEL OF DHARMA"],
			[ 0x2670 , "WEST SYRIAC CROSS"],
			[ 0x2671 , "EAST SYRIAC CROSS"],
			[ 0 , "" ],
			[ 0x268A , "MONOGRAM FOR YANG"],
			[ 0x268B , "MONOGRAM FOR YIN"],
			[ 0x268C , "DIGRAM FOR GREATER YANG"],
			[ 0x268D , "DIGRAM FOR LESSER YIN"],
			[ 0x268E , "DIGRAM FOR LESSER YANG"],
			[ 0x268F , "DIGRAM FOR MOUNTAIN"],
			[ 0x2630 , "TRIGRAM FOR GREATER YIN"],
			[ 0x2631 , "TRIGRAM FOR LAKE"],
			[ 0x2632 , "TRIGRAM FOR FIRE"],
			[ 0x2633 , "TRIGRAM FOR THUNDER"],
			[ 0x2634 , "TRIGRAM FOR WIND"],
			[ 0x2635 , "TRIGRAM FOR WATER"],
			[ 0x2636 , "TRIGRAM FOR MOUNTAIN"],
			[ 0x2637 , "TRIGRAM FOR EARTH"],
			[ 0 , "" ],
			[ 0x262A , "STAR AND CRESENT"],
			[ 0x262B , "FARSI SYMBOL"],
			[ 0x262C , "ADI SHAKTI"],
			[ 0x262D , "HAMMER AND SICKLE"],
			[ 0x262E , "PEACE SYMBOL"],
			[ 0x262F , "YIN YANG"],
			[ 0x269C , "FLEUR-DE-LIS"],
			[ 0x269D , "OUTLINED WHITE STAR"],
			[ 0 , "" ],
			[ 0x2610 , "BALLOT BOX"],
			[ 0x2611 , "BALLOT BOX WITH CHECK"],
			[ 0x2612 , "BALLOT BOX WITH X"],
			[ 0x2717 , "BALLOT X"],
			[ 0 , "" ],
			[ 0x26E4 , "PENTAGRAM"],
			[ 0x26E5 , "RIGHT-HANDED INTERLACED PENTAGRAM"],
			[ 0x26E6 , "LEFT-HANDED INTERLACED PENTAGRAM"],
			[ 0x26E7 , "INVERTED PENTAGRAM"],
			  
		);


		Smiley.alltabs.Astro = new Array(
			[ 0x263D , "Astrological and Zodiac Symbols"],	 

			[ 0x263D , "FIRST QUARTER MOON"],
			[ 0x263E , "LAST QUARTER MOON"],
			[ 0x263F , "MERCURY"],
			[ 0x2640 , "VENUS"],
			[ 0x2641 , "EARTH"],
			[ 0x2642 , "MARS"],
			[ 0x2643 , "JUPITER"],
			[ 0x2644 , "SATURN"],
			[ 0x2645 , "URANUS"],
			[ 0x26E2 , "ASTRONOMICAL SYMBOL FOR URANUS"],
			[ 0x2646 , "NEPTUNE"],
			[ 0x2647 , "PLUTO"],
			[ 0 , "" ],
			[ 0x2648 , "ARIES"],
			[ 0x2649 , "TAURUS"],
			[ 0x264A , "GEMINI"],
			[ 0x264B , "CANCER"],
			[ 0x264C , "LEO"],
			[ 0x264D , "VIRGO"],
			[ 0x264E , "LIBRA"],
			[ 0x264F , "SCORPUS"],
			[ 0x2650 , "SAGITTARIUS"],
			[ 0x2651 , "CAPRICORN"],
			[ 0x2652 , "AQUARIUS"],
			[ 0x2653 , "PICES"],
			[ 0 , "" ],
			[ 0x26B3 , "CERES"],
			[ 0x26B4 , "PALLAS"],
			[ 0x26B5 , "JUNO"],
			[ 0x26B6 , "VESTA"],
			[ 0x26B7 , "CHIRON"],
			[ 0x26B8 , "BLACK MOON LILITH"],
			[ 0x26B9 , "SEXTILE"],
			[ 0x26BA , "SEMISEXTILE"],
			[ 0x26BB , "QUINCUNX"],
			[ 0x26BC , "SESQUIQUADRATE"],
			[ 0x26CE , "OPHICHUS"],
			
		);


		Smiley.alltabs.Map = new Array(
			[ 0x26FD , "Map and Taffic Symbols"],	 

			[ 0x2690 , "WHITE FLAG"],
			[ 0x2691 , "BLACK FLAG"],
			[ 0x2692 , "HAMMER AND PICK"],
			[ 0x2693 , "ANCHOR"],
			[ 0x2694 , "CROSSED SWORDS"],
			[ 0x2695 , "STAFF OF AESCULAPIUS"],
			[ 0x2696 , "SCALES"],
			[ 0x2697 , "ALEMBIC"],
			[ 0x2698 , "FLOWER"],
			[ 0x2699 , "GEAR"],
			[ 0x269A , "STAFF OF HERMES"],
			[ 0x269B , "ATOM SYMBOL"],
			[ 0x26E3 , "HEAVY SIRCLE WITH STROKE AND TWO DOTS ABOVE"],
			[ 0x26E8 , "BLACK CROSS ON SHIELD"],
			[ 0x26E9 , "SHINTO SHRINE"],
			[ 0x26EA , "CHURCH"],
			[ 0x26EB , "CASTLE"],
			[ 0x26EC , "HISTORIC SITE"],
			[ 0x26ED , "GEAR WITHOUT HUB"],
			[ 0x26EE , "GEAR WITH HANDLES"],
			[ 0x26EF , "MAP SYMBOL FOR LIGHTHOUSE"],
			[ 0x26F0 , "MOUNTAIN"],
			[ 0x26F1 , "UMBRELLA ON GROUND"],
			[ 0x26F2 , "FOUNTAIN"],
			[ 0x26F3 , "FLAG IN HOLE"],
			[ 0x26F4 , "FERRY"],
			[ 0x26F5 , "SAILBOAT"],
			[ 0x26F6 , "SQUARE FOUR CORNERS"],
			[ 0x26F7 , "SKIER"],
			[ 0x26F8 , "ICE SKATE"],
			[ 0x26F9 , "PERSON WITH BALL"],
			[ 0x26FA , "TENT"],
			[ 0x26FB , "JAPANESE BANK SYMBOL"],
			[ 0x26FC , "HEADSTONE GRAVEYARD SYMBOL"],
			[ 0x26FD , "FUEL PUMP"],
			[ 0x26FE , "CUP ON BLACK SQUARE"],
			[ 0x26FF , "WHITE FLAG WITH HORIZONTAL MIDDLE BLACK STRIPE"],
			[ 0x2668 , "HOT SPRINGS"],
			
			[ 0 , ""],
			[ 0x26CC , "CROSSING LANES"],
			[ 0x26CD , "DISABLED CAR"],
			[ 0x26CF , "PICK"],
			[ 0x26D0 , "CAR SLIDING"],
			[ 0x26D1 , "HELMET WITH WHITE CROSS"],
			[ 0x26D2 , "CIRCLED CROSSING LANES"],
			[ 0x26D3 , "CHAINS"],
			[ 0x26D4 , "NO ENTRY"],
			[ 0x26D5 , "ALTERNATE ONE-WAY LEFT TRAFFIC"],
			[ 0x26D6 , "BLACK TWO-WAY LEFT WAY TRAFFIC"],
			[ 0x26D7 , "WHITE TWO-WAY LEFT WAY TRAFFIC"],
			[ 0x26D8 , "BLACK LEFT LANE MERGE"],
			[ 0x26D9 , "WHITE LEFT LANE MERGE"],
			[ 0x26DA , "DRIVE SLOW SIGN"],
			[ 0x26DB , "HEAVY WHITE DOWN-POINTING TRIANGLE"],
			[ 0x26DC , "LEFT CLOSED ENTRY"],
			[ 0x26DD , "SQUARED SALTIRE"],
			[ 0x26DE , "FALLING DIAGONAL IN WHITE CIRCLE IN BLACK SQUARE"],
			[ 0x26DF , "BLACK TRUCK"],
			[ 0x26E0 , "RESTRICTED LEFT ENTRY-1"],
			[ 0x26E1 , "RESTRICTED LEFT ENTRY-2"],
			
		);


		Smiley.alltabs.Recycle = new Array(
			[ 0x2672 , "Recycling Symbols"],	 

			[ 0x2672 , "UNIVERSAL RECYCLING SYMBOL"],
			[ 0x2673 , "RECYCLING SYMBOL FOR TYPE-1 PLASTICS"],
			[ 0x2674 , "RECYCLING SYMBOL FOR TYPE-2 PLASTICS"],
			[ 0x2675 , "RECYCLING SYMBOL FOR TYPE-3 PLASTICS"],
			[ 0x2676 , "RECYCLING SYMBOL FOR TYPE-4 PLASTICS"],
			[ 0x2677 , "RECYCLING SYMBOL FOR TYPE-5 PLASTICS"],
			[ 0x2678 , "RECYCLING SYMBOL FOR TYPE-6 PLASTICS"],
			[ 0x2679 , "RECYCLING SYMBOL FOR TYPE-7 PLASTICS"],
			[ 0x267A , "RECYCLING SYMBOL FOR GENERIC MATERIALS"],
			[ 0x267B , "BLACK UNIVERSAL RECYCLING SYMBOL"],
			[ 0x267C , "RECYCLED PAPER SYMBOL"],
			[ 0x267D , "PARTIALLY-RECYCLED PAPER SYMBOL"],
			[ 0x267E , "PERMANENT PAPER SIGN"],
			
		);


		Smiley.alltabs.Gender = new Array(
			[ 0x26AD , "Genealogical and Gender Symbols"],	 

			[ 0x26AD , "MARRIAGE SYMBOL"],
			[ 0x26AE , "DIVORSE SYMBOL"],
			[ 0x26AF , "UNMARRIED PARTNERSHIP SYMBOL"],
			[ 0x26B0 , "COFFIN"],
			[ 0x26B1 , "FUNERAL URN"],
			[ 0 , ""],
			[ 0x2640 , "FEMALE SIGN"],
			[ 0x2642 , "MALE SIGN"],
			[ 0x26A2 , "DOUBLED FEMALE SIGN"],
			[ 0x26A3 , "DOUBLED MALE SIGN"],
			[ 0x26A4 , "INTERLOCKED FEMALE AND MALE SIGN"],
			[ 0x26A5 , "MALE AND FEMALE SIGN"],
			[ 0x26A6 , "MALE WITH STROKE SIGN"],
			[ 0x26A7 , "MALE WITH STROKE AND MALE AND FEMALE SIGN"],
			[ 0x26A8 , "VERTICAL MALE WITH STROKE SIGN"],
			[ 0x26A9 , "HORIZONTAL MALE WITH STROKE SIGN"],
			[0x26B2 , "NEUTER"],
			
		);


		Smiley.alltabs.Math = new Array(
			[ 0x2211 , "Math"],
			
			[ 0 , "Operators"],
			
			[ 0x2B , "PLUS SIGN"],
			[ 0x2D , "MINUS SIGN"],
			[ 0xD7 , "MULTIPLICATION SIGN"],
			[ 0xF7 , "DIVISION SIGN"],
			[ 0x27CC , "LONG DIVISION"],
			[ 0x21 , "FACTORIAL"],
			[ 0x3D , "EQUALS"],
			[ 0x3C , "LESS-THAN SIGN"],
			[ 0x3E , "GREATER-THAN SIGN"],
			
			[ 0x2212 , "MINUS SIGN"],
			[ 0x2213 , "MINUS-OR-PLUS SIGN"],
			[ 0x2214 , "DOT PLUS"],
			[ 0x2215 , "DIVISION SLASH"],
			[ 0x2216 , "SET MINUS"],
			[ 0x2217 , "ASTERISK OPERATOR"],
			[ 0x2218 , "RING OPERATOR"],
			[ 0x2219 , "BULLET OPERATOR"],
			[ 0x221A , "SQUARE ROOT"],
			[ 0x221B , "CUBE ROOT"],
			[ 0x221C , "FOURTH ROOT"],
			[ 0x221D , "PROPORTIONAL TO"],
			
			[ 0x2227 , "LOGICAL AND"],
			[ 0x2228 , "LOGICAL OR"],
			[ 0x2229 , "INTERSECTION"],
			[ 0x222A , "UNION"],
			[ 0x222B , "INTEGRAL"],
			[ 0x222C , "DOUBLE INTEGRAL"],
			[ 0x222D , "TRIPPLE INTEGRAL"],
			[ 0x222E , "CONTOUR INTEGRAL"],
			[ 0x222F , "SURFACE INTEGRAL"],
			[ 0x2230 , "VOLUME INTEGRAL"],
			[ 0x2231 , "CLOCKWISE INTEGRAL"],
			[ 0x2232 , "CLOCKWISE CONTOUR INTEGRAL"],
			[ 0x2233 , "ANTICLOCKWISE CONTOUR INTEGRAL"],
			
			[ 0x2A0C , "QUADRUPLE INTEGRAL OPERATOR"],
			[ 0x2A0D , "FINITE PART INTEGRAL"],
			[ 0x2A0E , "INTEGRAL WITH DOUBLE STROKE"],
			[ 0x2A0F , "INTERGRAL AVERAGE WITH SLASH"],
			
			[ 0x2A10 , "CIRCULATION FUNCTION"],
			[ 0x2A11 , "ANTICLOCKWISE INTEGRATION"],
			[ 0x2A12 , "LINE INTEGRATION WITH RECTANGULAR PATH AROUND POLE"],
			[ 0x2A13 , "LINE INTEGRATION WITH SEMICIRCULAR PATH AROUND POLE"],
			[ 0x2A14 , "LINE INTEGRATION NOT INCLUDING THE POLE"],
			[ 0x2A15 , "INTEGRAL AROUND A POINT OPERATOR"],
			[ 0x2A16 , "QUATERNION INTEGRAL OPERATOR"],
			[ 0x2A17 , "INTEGRAL WITH LEFTWARDS ARROW WITH HOOK"],
			[ 0x2A18 , "INTEGRAL WITH TIMES SIGN"],
			[ 0x2A19 , "INTEGRAL WITH INTERSECTION"],
			[ 0x2A1A , "INTEGRAL WITH UNION"],
			[ 0x2A1B , "INTEGRAL WITH OVERBAR"],
			[ 0x2A1C , "INTEGRAL WITH UNDERBAR"],
			[ 0x2A1B , "SUMATION WITH INTEGRAL"],
			[ 0x2A1A , "MODULO TWO SUM"],
			
			[ 0x2238 , "DOT MINUS"],
			[ 0x223A , "GEOMETRIC PROPORTION"],
			[ 0x2240 , "WREATH PRODUCT"],
			
			[ 0x228C , "MULTISET"],
			[ 0x228D , "MULTISET MULTIPLICATION"],
			[ 0x228E , "MULTISET UNION"],
			
			[ 0x2293 , "SQUARE CAP"],
			[ 0x2294 , "SQUARE CUP"],
			[ 0x2295 , "CIRCLED PLUS"],
			[ 0x2296 , "CIRCLED MINUS"],
			[ 0x2297 , "CIRCLED TIMES"],
			[ 0x2298 , "CIRCLED DIVISION SLASH"],
			[ 0x2299 , "CIRCLED DOT OPERATOR"],
			[ 0x229A , "CIRCLED RING OPERATOR"],
			[ 0x229B , "CIRCLED ASTERISK OPERATOR"],
			[ 0x229C , "CIRCLED EQUALS"],
			[ 0x229D , "CIRCLED DASH"],
			[ 0x229E , "SQUARED PLUS"],
			[ 0x229F , "SQUARED MINUS"],
			
			[ 0x22A0 , "SQUARED TIMES"],
			[ 0x22A1 , "SQUARED DOT OPERATOR"],
			[ 0x22A2 , "RIGHT TACK"],
			[ 0x22A3 , "LEFT TACK"],
			[ 0x22A4 , "DOWN TACK"],
			[ 0x22A5 , "UP TACK"],
			
			[ 0x22BA , "INTERCALCATE"],
			[ 0x22BB , "XOR"],
			[ 0x22BC , "NAND"],
			[ 0x22BD , "NOR"],
			
			[ 0x22C4 , "DIAMOND OPERATOR"],
			[ 0x22C5 , "DOT OPERATOR"],
			[ 0x22C6 , "STAR OPERATOR"],
			[ 0x22C7 , "DIVISION TIMES"],
			
			[ 0x22C8 , "BOWTIE"],
			
			[ 0x22C9 , "LEFT NORMAL FACTOR SEMIDIRECT PRODUCT"],
			[ 0x22CA , "RIGHT NORMAL FACTOR SEMIDIRECT PRODUCT"],
			[ 0x22CB , "LEFT SEMIDIRECT PRODUCT"],
			[ 0x22CC , "RIGHT SEMIDIRECT PRODUCT"],
			
			[ 0x22CE , "CURLY LOGICAL OR"],
			[ 0x22CF , "CURLY LOGICAL AND"],
			
			[ 0x22D0 , "DOUBLE SUBSET"],
			[ 0x22D1 , "DOUBLE SUPERSET"],
			[ 0x22D2 , "DOUBLE INTERSECTION"],
			[ 0x22D3 , "DOUBLE UNION"],
			
			[ 0x2A22 , "PLUS SIGN WITH SMALL CIRCLE ABOVE"],
			[ 0x2A23 , "PLUS SIGN WITH CIRCUMFLEX ACCENT ABOVE"],
			[ 0x2A24 , "PLUS SIGN WITH TILDE ABOVE"],
			[ 0x2A25 , "PLUS SIGN WITH DOT BELOW"],
			[ 0x2A26 , "PLUS SIGN WITH TILDE BELOW"],
			[ 0x2A27 , "PLUS SIGN WITH SUBSCRIPT TWO"],
			[ 0x2A28 , "PLUS SIGN WITH BLACK TRIANGLE"],
			[ 0x2A2D , "PLUS SIGN IN LEFT HALF CIRCLE"],
			[ 0x2A2E , "PLUS SIGN IN RIGHT HALF CIRCLE"],
			[ 0x2A29 , "MINUS SIGN WITH COMMA ABOVE"],
			[ 0x2A2A , "MINUS SIGN WITH DOT BELOW"],
			[ 0x2A2B , "MINUS SIGN WITH FALING DOTS"],
			[ 0x2A2C , "MINUS SIGN WITH RISING DOTS"],
			
			[ 0x29FA , "DOUBLE PLUS"],
			[ 0x29FB , "TRIPPLE PLUS"],
			
			
			[ 0x2A2F , "VECTOR OR CROSS PRODUCT"],
			
			[ 0x2A30 , "MULTIPLICATION SIGN WITH A DOT ABOVE"],
			[ 0x2A31 , "MULTIPLICATION SIGN WITH UNDERBAR"],
			[ 0x2A32 , "SEMIDIRECT PRODUCT WITH BOTTOM CLOSED"],
			[ 0x2A33 , "SMASH PRODUCT"],
			[ 0x2A34 , "MULTIPLICATION SIGN IN LEFT HALF CIRCLE"],
			[ 0x2A35 , "MULTIPLICATION SIGN IN RIGHT HALF CIRCLE"],
			[ 0x2A36 , "CIRCLED MULTIPLICATION SIGN WITH CIRCUMFLEX ACCENT"],
			[ 0x2A37 , "MULTIPLICATION SIGN IN DOUBLE CIRCLE"],
			[ 0x2A38 , "CIRCLED DIVISION SIGN"],
			[ 0x2A39 , "PLUS SIGN IN TRIANGLE"],
			[ 0x2A3A , "MINUS SIGN IN TRIANGLE"],
			[ 0x2A3B , "MULTIPLICATION SIGN IN TRIANGLE"],
			[ 0x2A3C , "INTERION PRODUCT"],
			[ 0x2A3D , "RIGHTHAND INTERION PRODUCT"],
			[ 0x2A3E , "Z NOTATION RELATIONAL COMPOSITION"],
			[ 0x2A3F , "AMALGAMATION OR COPRODUCT"],
			
			[ 0x2A40 , "INTERSECTION WITH DOT"],
			[ 0x2A41 , "UNION WITH MINUS SIGN"],
			[ 0x2A42 , "UNION WITH OVERBAR"],
			[ 0x2A43 , "INTERSECTION WITH OVERBAR"],
			[ 0x2A44 , "INTERSECTION WITH LOGICAL AND"],
			[ 0x2A45 , "UNION WITH LOGICAL OR"],
			[ 0x2A46 , "UNION ABOVE INTERSECTION"],
			[ 0x2A47 , "INTERSECTION ABOVE UNION"],
			[ 0x2A48 , "UNION ABOVE BAR ABOVE INTERSECTION"],
			[ 0x2A49 , "INTERSECTION ABOVE BAR ABOVE UNION"],
			[ 0x2A4A , "UNION BESIDE AND JOINED WITH UNION"],
			[ 0x2A4B , "INTERSECTION BESIDE AND JOINED WITH INTERSECTION"],
			[ 0x2A4C , "CLOSED UNION WITH SERIFS"],
			[ 0x2A4D , "CLOSED INTERSECTION WITH SERIFS"],
			[ 0x2A4E , "DOUBLE SQUARE INTERSECTION"],
			[ 0x2A4F , "DOUBLE SQUARE UNION"],
			
			[ 0x2A50 , "CLOSED UNION WITH SERIFS AND SMASH PRODUCT"],
			[ 0x2A51 , "LOGICAL AND WITH DOT ABOVE"],
			[ 0x2A52 , "LOGICAL OR WITH DOT ABOVE"],
			[ 0x2A53 , "DOUBLE LOGICAL AND"],
			[ 0x2A54 , "DOUBLE LOGICAL OR"],
			[ 0x2A55 , "TWO INSERSECTING LOGICAL AND"],
			[ 0x2A56 , "TWO INSERSECTING LOGICAL OR"],
			[ 0x2A57 , "SLOPING LARGE OR"],
			[ 0x2A58 , "SLOPING LARGE AND"],
			[ 0x2A59 , "LOGICAL OR OVERLAPPING LOGICAL AND"],
			[ 0x2A5A , "LOGICAL AND WITH MIDDLE STEM"],
			[ 0x2A5B , "LOGICAL OR WITH MIDDLE STEM"],
			[ 0x2A5C , "LOGICAL AND WITH HORIZONTAL DASH"],
			[ 0x2A5D , "LOGICAL OR WITH HORIZONTAL DASH"],
			[ 0x2A5E , "LOGICAL AND WITH DOUBLE OVERBAR"],
			[ 0x2A5F , "LOGICAL AND WITH UNDERBAR"],
			
			[ 0x2A60 , "LOGICAL AND WITH DOUBLE UNDERBAR"],
			[ 0x2A61 , "SMALL VEE WITH UNDERBAR"],
			[ 0x2A62 , "LOGICAL OR WITH DOUBLE OVERBAR"],
			[ 0x2A63 , "LOGICAL OR WITH DOUBLE UNDERBAR"],
			[ 0x27CE , "SQUARED LOGICAL AND"],
			[ 0x27CF , "SQUARED LOGICAL OR"],
			[ 0x27C7 , "OR WITH DOT INSIDE"],
			[ 0x27D1 , "AND WITH DOT INSIDE"],
			[ 0x2A64 , "Z NOTATION DOMAIN ANTIRESTRICTION"],
			[ 0x2A65 , "Z NOTATION RANGE ANTIRESTRICTION"],
			
			[ 0x2ADE , "SHORT LEFT TACK"],
			[ 0x2ADF , "SHORT DOWN TACK"],
			
			[ 0x2AE0 , "SHORT UP TACK"],
			[ 0x2AE1 , "PERPENDICULAR WITH S"],
			[ 0x2AE2 , "VERTICAL BAR TRIPPLE RIGHT TURNSTILE"],
			[ 0x2AE3 , "DOUBLE VERTICAL BAR LEFT TURNSTILE"],
			[ 0x2AE4 , "VERTICAL BAR DOUBLE LEFT TURNSTILE"],
			[ 0x2AE5 , "DOUBLE VERTICAL BAR DOUBLE LEFT TURNSTILE"],
			[ 0x2AE6 , "LONG DASH FROM LEFT MEMBER OF DOUBLE VERTICAL"],
			[ 0x2AE7 , "SHORT DOWN TACK WITH OVERBAR"],
			[ 0x2AE8 , "SHORT UP TACK WITH OVERBAR"],
			[ 0x2AE9 , "SHORT UP TACK ABOVE SHORT DOWN TACK"],
			[ 0x2AEA , "DOUBLE DOWN TACK"],
			[ 0x2AEB , "DOUBLE UP TACK"],
			[ 0x2AEC , "DOUBLE STROKE NOT SIGN"],
			[ 0x2AED , "REVERSED DOUBLE STROKE NOT SIGN"],
			[ 0x2AEE , "DOES NOT DIVIDE WITH REVERSED NEGATION SLASH"],
			[ 0x2AEF , "VERTICAL LINE WITH CIRCLE ABOVE"],
			
			[ 0x2AF0 , "VERTICAL LINE WITH CIRCLE BELOW"],
			[ 0x2AF1 , "DOWN TACK WITH CICLE BELOW"],
			[ 0x2AF2 , "PARALLEL WITH CIRCLE BELOW"],
			[ 0x2AF3 , "PARALLEL WITH TILDE OPERATOR"],
			[ 0x27CA , "VERTICAL BAR WITH HORIZONTAL STROKE"],
			[ 0x2AF4 , "TRIPLE VERTICAL BAR BINARY RELATION"],
			[ 0x2AF5 , "TRIPLE VERTICAL BAR WITH HORIZONTAL STROKE"],
			[ 0x2AF6 , "TRIPPLE COLON OPERATOR"],
		   
			[ 0x2AFC , "LARGE TRIPPLE VERTICAL BAR OPERATOR"],
			[ 0x2AFD , "DOUBLE SOLIDUS OPERATOR"],
			[ 0x2AFE , "WHITE VERTICAL BAR"],
			
			[ 0x27D2 , "ELEMENT OF OPENING UPWARDS"],
			[ 0x27D3 , "LOWER RIGHT CORNER WITH DOT"],
			[ 0x27D4 , "UPPER LEFT CORNER WITH DOT"],
			[ 0x27D5 , "LEFT OUTER JOIN"],
			[ 0x27D6 , "RIGHT OUTER JOIN"],
			[ 0x27D7 , "FULL OUTER JOIN"],
			[ 0x27D8 , "LARGE UP TACK"],
			[ 0x27D9 , "LARGE DOWN TACK"],
			[ 0x27DA , "LEFT AND RIGHT DOUBLE TURNSTYLE"],
			[ 0x27DB , "LEFT AND RIGHT TACK"],
			[ 0x27DC , "LEFT MULTIMAP"],
			[ 0x27DD , "LONG RIGHT TACK"],
			[ 0x27DE , "LONG LEFT TACK"],
			[ 0x27DF , "UP TACK WITH CIRCLE ABOVE"],
			
			[ 0x27E0 , "LOZENGE DIVIDED BY HORIZONTAL RULE"],
			[ 0x27E1 , "WHITE CONCAVE-SIDED DIAMOND"],
			[ 0x27E2 , "WHITE CONCAVE-SIDED DIAMOND WITH LEFTWARDS TICK"],
			[ 0x27E3 , "WHITE CONCAVE-SIDED DIAMOND WITH RIGHTWARDS TICK"],
			[ 0x27E4 , "WHITE SQUARE WITH LEFTWARDS TICK"],
			[ 0x27E5 , "WHITE SQUARE WITH RIGHTWARDS TICK"],
				
			
			//LARGE
			[ 0x2A1D , "JOIN"],
			[ 0x2A1E , "LARGE LEFT TRIANGLE OPERATOR"],
			[ 0x2A1F , "Z NOTATION SCHEMA COMPOSITION"],
			[ 0x2A20 , "Z NOTATION SCHEMA PIPING"],
			[ 0x2A21 , "Z NOTATION SCHEMA PROJECTION"],
			
			[ 0x29F8 , "BIG SOLIDUS"],
			[ 0x29F9 , "BIG REVERSE SOLIDUS"],
			
			
			
			[ 0 , "N-ary Operators"],
			[ 0x220F , "N-ARY PRODUCT"],
			[ 0x2210 , "N-ARY COPRODUCT"],
			[ 0x2211 , "N-ARY SUMMATION"],
			
			[ 0x22C0 , "N-ARY LOGICAL AND"],
			[ 0x22C1 , "N-ARY LOGICAL OR"],
			[ 0x22C2 , "N-ARY INTERSECTION"],
			[ 0x22C3 , "N-ARY UNION"],
			
			[ 0x2A00 , "N-ARY CIRCLED DOT OPERATOR"],
			[ 0x2A01 , "N-ARY CIRCLED PLUS OPERATOR"],
			[ 0x2A02 , "N-ARY CIRCLED TIMES OPERATOR"],
			[ 0x2A03 , "N-ARY UNION OPERATOR WITH DOT"],
			[ 0x2A04 , "N-ARY UNION OPERATOR WITH PLUS"],
			[ 0x2A05 , "N-ARY SQUARE INTERSECTION OPERATOR"],
			[ 0x2A06 , "N-ARY SQUARE UNION OPERATOR"],
			[ 0x2A07 , "TWO LOCIGAL AND OPERATOR"],
			[ 0x2A08 , "TWO LOCIGAL OR OPERATOR"],
			[ 0x2A09 , "N-ARY TIMES OPERATOR"],
			
			[ 0x2AFF , "N-ARY WHITE VERTICAL BAR"],
			
			
			[ 0 , "Mathematical Symbols"],
			[ 0x2200 , "FOR ALL"],
			[ 0x2201 , "COMPLEMENT"],
			[ 0x2202 , "PARTIAL DIFFERENTIAL"],
			[ 0x2203 , "THERE EXISTS"],
			[ 0x2204 , "THERE DOES NOT EXIST"],
			[ 0x2205 , "EMPTY SET"],
			
			[ 0x29B0 , "REVERSED EMPTY SET"],
			[ 0x29B1 , "EMPTY SET WITH OVERBAR"],
			[ 0x29B2 , "EMPTY SET WITH SMALL CIRCLE ABOVE"],
			[ 0x29B3 , "EMPTY SET WITH RIGHT ARROW ABOVE"],
			[ 0x29B4 , "EMPTY SET WITH LEFT ARROW ABOVE"],
			
			[ 0x2206 , "INCREMENT"],
			[ 0x2207 , "NABLA"],
			[ 0x2208 , "ELEMENT OF"],
			[ 0x2209 , "NOT AN ELEMENT OF"],
			[ 0x220A , "SMALL ELEMENT OF"],
			[ 0x220B , "CONTAINS AS MEMBER"],
			[ 0x220C , "DOES NOT CONTAIN AS MEMBER"],
			[ 0x220D , "SMALL CONTAINS AS MEMBER"],
			[ 0x220E , "END OF PROOF"],
		   
			[ 0x221E , "INFINITY"],
			[ 0x221F , "RIGHT ANGLE"],
			
			[ 0x2220 , "ANGLE"],
			[ 0x2221 , "MEASURED ANGLE"],
			[ 0x2222 , "SPHERICAL ANGLE"],
			[ 0x22BE , "RIGHT ANGLE WITH ARC"],
			[ 0x22BF , "RIGHT TRIANGLE"],
			[ 0x27C0 , "THREE DIMENSIONAL ANGLE"],
			
			[ 0x299B , "MEASURED ANGLE OPENING LEFT"],
			[ 0x299C , "RIGHT ANGLE VARIANT WITH SQUARE"],
			[ 0x299D , "MEASURED RIGHT ANGLE WITH DOT"],
			[ 0x299E , "ANGLE WITH S INSIDE"],
			[ 0x299F , "ACUTE ANGLE"],
			
			[ 0x29A0 , "SHPERICAL ANGLE OPENING LEFT"],
			[ 0x29A1 , "SHPERICAL ANGLE OPENING UP"],
			[ 0x29A2 , "TURNED ANGLE"],
			[ 0x29A3 , "REVERSED ANGLE"],
			[ 0x29A4 , "ANGLE WITH UNDERBAR"],
			[ 0x29A5 , "REVERSED ANGLE WITH UNDERBAR"],
			[ 0x29A6 , "OBLIQUE ANGLE OPENING UP"],
			[ 0x29A7 , "OBLIQUE ANGLE OPENING DOWN"],
			[ 0x29A8 , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING UP AND RIGHT"],
			[ 0x29A9 , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING UP AND LEFT"],
			[ 0x29AA , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING DOWN AND RIGHT"],
			[ 0x29AB , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING DOWN AND LEFT"],
			[ 0x29AC , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING RIGHT AND UP"],
			[ 0x29AD , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING LEFT AND UP"],
			[ 0x29AE , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING RIGHT AND DOWN"],
			[ 0x29AF , "MEASURED ANGLE WITH OPEN ARM ENDING IN ARROW POINTING LEFT AND DOWN"],
			
			[ 0x2234 , "THEREFORE"],
			[ 0x2235 , "BECAUSE"],
			[ 0x223F , "SINE WAVE"],
			
			[ 0x27C1 , "WHITE TRIANGLE CONTAINING SMALL WHITE TRIANGLE"],
			[ 0x27C2 , "PERPENDICULAR"],
			[ 0x27C3 , "OPEN SUBSET"],
			[ 0x27C4 , "OPEN SUPERSET"],
			[ 0x27C5 , "LEFT S-SHAPED BAG DELIMITER"],
			[ 0x27C6 , "RIGHT S-SHAPED BAG DELIMITER"],
			[ 0x27C8 , "REVERSE SOLIDUS PRECEDING SUBSET"],
			[ 0x27C9 , "SUPERSET PRECEDING SOLIDUS"],
			[ 0x27CB , "MATHEMATICAL RISING DIAGONAL"],
			[ 0x27CD , "MATHEMATICAL FALLING DIAGONAL"],
			
			[ 0x27D0 , "WHITE DIAMOND WITH CENTERED DOT"],
			
			[ 0x2980 , "TRIPLE VERTICAL BAR DELIMITER"],
			[ 0x2981 , "Z NOTATION SPOT"],
			[ 0x2982 , "Z NOTATION TYPE COLON"],
			
			[ 0x29B5 , "CIRCLE WITH HORIZONTAL BAR"],
			[ 0x29B6 , "CIRCLE WITH VERTICAL BAR"],
			[ 0x29B7 , "CIRCLED PARALLEL"],
			[ 0x29B8 , "CIRCLED REVERSE SOLIDUS"],
			[ 0x29B9 , "CIRCLED PERPENDICULAR"],
			[ 0x29BA , "CIRCLE DIVIDED BY HORIZONTAL BAR AND TOP HALF DIVIDED BY VERTICAL BAR"],
			[ 0x29BB , "CIRCLE WITH SUPERIMPOSED X"],
			[ 0x29BC , "CIRCLED ANTICLOCKWISE-ROTATED DIVISION SIGN"],
			[ 0x29BD , "UP ARROW THROUGH CIRCLE"],
			[ 0x29BE , "CIRCLED WHITE BULLET"],
			[ 0x29BF , "CIRCLED BULLET"],
			
			[ 0x29C0 , "CIRCLED LESS-THAN"],
			[ 0x29C1 , "CIRCLED GREATER-THAN"],
			[ 0x29C2 , "CIRCLE WITH SMALL CIRCLE TO THE RIGHT"],
			[ 0x29C3 , "CIRCLE WITH TWO HORIZONTAL STROKES TO THE RIGHT"],
			[ 0x29C4 , "SQUARED RISING DIAGONAL SLASH"],
			[ 0x29C5 , "SQUARED FALLING DIAGONAL SLASH"],
			[ 0x29C6 , "SQUARED ASTERISK"],
			[ 0x29C7 , "SQUARED SMALL CIRCLE"],
			[ 0x29C8 , "SQUARED SQUARE"],
			[ 0x29C9 , "TWO JOINED SQUARES"],
			[ 0x29CA , "TRIANGLE WITH DOT ABOVE"],
			[ 0x29CB , "TRIANGLE WITH UNDERBAR"],
			[ 0x29CC , "S IN TRIANGLE"],
			[ 0x29CD , "TRIANGLE WIHT SERIFS AT BOTTOM"],
			[ 0x29CE , "RIGHT TRIANGLE ABOVE LEFT TRIANGLE"],
			[ 0x29CF , "LEFT TRIANGLE BESIDES VERTICAL BAR"],
			
			[ 0x29D0 , "VERTICAL BAR BESIDES LEFT TRIANGLE"],
			[ 0x29D1 , "BOWTIE WITH LEFT HALF BLACK"],
			[ 0x29D2 , "BOWTIE WITH RIGHT HALF BLACK"],
			[ 0x29D3 , "BLACK BOWTIE"],
			[ 0x29D4 , "TIMES WITH LEFT HALF BLACK"],
			[ 0x29D5 , "TIMES WITH RIGHT HALF BLACK"],
			[ 0x29D6 , "WHITE HOURGLASS"],
			[ 0x29D7 , "BLACK HOURGLASS"],
			
			[ 0x2999 , "DOTTED FENCE"],
			[ 0x299A , "VERTICAL ZIGZAG LINE"],
			
			[ 0x29D8 , "LEFT WIGGLY FENCE"],
			[ 0x29D9 , "RIGHT WIGGLY FENSE"],
			[ 0x29DA , "DOUBLE LEFT WIGGLY FENCE"],
			[ 0x29DB , "DOUBLE RIGHT WIGGLY FENSE"],
			[ 0x29DC , "INCOMPLETE INFINITY"],
			[ 0x29DD , "TIE OVER INFINITY"],
			[ 0x29DE , "INFINITY NEGATED WITH VERTICAL BAR"],
			[ 0x29DF , "DOUBLE ENDED MULTIMAP"],
			
			[ 0x29E0 , "SQUARE WITH CONTOURED OUTLINE"],
			[ 0x29E1 , "INCREASES AS"],
			[ 0x29E2 , "SHUFFLE PRODUCT"],
			
			[ 0x29E7 , "THERMODYNAMIC"],
			
			[ 0x29EE , "ERROR-BARRED WHIE SQUARE"],
			[ 0x29EF , "ERROR-BARRED BLACK SQUARE"],
			
			[ 0x29F0 , "ERROR-BARRED WHIE DIAMOND"],
			[ 0x29F1 , "ERROR-BARRED BLACK DIAMOND"],
			[ 0x29F2 , "ERROR-BARRED WHIE CIRCLE"],
			[ 0x29F3 , "ERROR-BARRED BLACK CIRCLE"],
			[ 0x29F4 , "RULE-DELAYED"],
			[ 0x29F5 , "REVERSE SOLIDUS OPERATOR"],
			[ 0x29F6 , "SOLIDUS WITH OVERBAR"],
			[ 0x29F7 , "REVERSE SOLIDUS WITH HORIZONTAL STROKE"],
			
			[ 0x29FE , "TINY"],
			[ 0x29FF , "MINY"],
			[ 0x23B7 , "RADICAL SYMBOL BOTTOM"],
			
			
			[ 0 , "Relations"],
			[ 0x2223 , "DIVIDES"],
			[ 0x2224 , "DOES NOT DIVIDE"],
			[ 0x2225 , "PARALLEL TO"],
			[ 0x2226 , "NOT PARALLEL TO"],
			[ 0x2236 , "RATIO"],
			[ 0x2237 , "PROPORTION"],
			[ 0x2239 , "EXCESS"],
			[ 0x223B , "HOMOTHETIC"],
			[ 0x223C , "TILDE OPERATOR"],
			[ 0x223D , "REVERSED TILDE"],
			[ 0x223E , "INVERTED LAZY S"],
			[ 0x2241 , "NOT TILDE"],
			[ 0x2242 , "MINUS TILDE"],
			[ 0x2243 , "ASYMPTOTICALLY EQUAL TO"],
			[ 0x2244 , "NOT ASYMPTOTICALLY EQUAL TO"],
			[ 0x2245 , "APPROXIMATELY EQUAL TO"],
			[ 0x2246 , "APPROXIMATELY BUT NOT ACTUALLY EQUAL TO"],
			[ 0x2247 , "NEITHER APPROXIMATELY NOR ACTUALLY EQUAL TO"],
			[ 0x2248 , "ALMOST EQUAL TO"],
			[ 0x2249 , "NOT ALMOST EQUAL TO"],
			[ 0x224A , "ALMOST EQUAL OR EQUAL TO"],
			[ 0x224B , "TRIPPLE TILDE"],
			[ 0x224C , "ALL EQUAL TO"],
			[ 0x224D , "EQUIVALENT TO"],
			[ 0x224E , "GEOMETRICALLY EQUIVALENT TO"],
			[ 0x224F , "DIFFERENCE BETWEEN"],
			
			[ 0x2250 , "APPROACHES THE LIMIT"],
			[ 0x2251 , "GEOMETRICALLY EQUAL TO"],
			[ 0x2252 , "APPROXIMATELY EQUAL TO OR THE IMAGE OF"],
			[ 0x2253 , "IMAGE OF OR APPROXIMATELY EQUAL TO"],
			[ 0x2254 , "COLON EQUALS"],
			[ 0x2255 , "EQUALS COLON"],
			[ 0x2256 , "RING IN EQUAL TO"],
			[ 0x2257 , "RING EQUAL TO"],
			[ 0x2258 , "CORRESPONDS TO"],
			[ 0x2259 , "ESTIMATES"],
			[ 0x225A , "EQUIANGULAR TO"],
			[ 0x225B , "STAR EQUALS"],
			[ 0x225C , "DELTA EQUAL TO"],
			[ 0x225D , "EQUAL TO BY DEFINITION"],
			[ 0x225E , "MEASURED BY"],
			[ 0x225F , "QUESTIONED EQUAL TO"],
			
			[ 0x2260 , "NOT EQUAL TO"],
			[ 0x2261 , "IDENTICAL TO"],
			[ 0x2262 , "NOT IDENTICAL TO"],
			[ 0x2263 , "STRICTLY EQUIVALENT TO"],
			[ 0x2264 , "LESS-THAN OR EQUAL TO"],
			[ 0x2265 , "GREATER-THAN OR EQUAL TO"],
			[ 0x2266 , "LESS-THAN OVER EQUAL TO"],
			[ 0x2267 , "GREATER-THAN OVER EQUAL TO"],
			[ 0x2268 , "LESS-THAN BUT NOT EQUAL TO"],
			[ 0x2269 , "GREATER-THAN BUT NOT EQUAL TO"],
			[ 0x226A , "MUCH LESS-THAN"],
			[ 0x226B , "MUCH GREATER-THAN"],
			[ 0x226C , "BETWEEN"],
			[ 0x226D , "NOT EQUIVALENT TO"],
			[ 0x226E , "NOT LESS-THAN"],
			[ 0x226F , "NOT GREATER-THAN"],

			[ 0x2270 , "NEITHER LESS-THAN NOR EQUAL TO"],
			[ 0x2271 , "NEITHER GREATER-THAN NOR EQUAL TO"],
			[ 0x2272 , "LESS-THAN OR EQUIVALENT TO"],
			[ 0x2273 , "GREATER-THAN OR EQUIVALENT TO"],
			[ 0x2274 , "NEITHER LESS-THAN NOR EQUIVALENT TO"],
			[ 0x2275 , "NEITHER GREATER-THAN NOR EQUIVALENT TO"],
			[ 0x2276 , "LESS-THAN OR GREATER-THAN"],
			[ 0x2277 , "GREATER-THAN OR LESS-THAN"],
			[ 0x2278 , "NEITHER LESS-THAN NOR GREATER-THAN"],
			[ 0x2279 , "NEITHER GREATER-THAN NOR LESS-THAN"],
			[ 0x227A , "PRECEDES"],
			[ 0x227B , "SUCCEEDS"],
			[ 0x227C , "PRECEDES OR EQUAL TO"],
			[ 0x227D , "SUCCEEDS OR EQUAL TO"],
			[ 0x227E , "PRECEDES OR EQUIVALENT TO"],
			[ 0x227F , "SUCCEEDS OR EQUIVALENT TO"],
			
			[ 0x2280 , "DOES NOT PRECEDE"],
			[ 0x2281 , "DOES NOT SUCCEEDS"],
			[ 0x2282 , "SUBSET OF"],
			[ 0x2283 , "SUPERSET OF"],
			[ 0x2284 , "NOT A SUBSET OF"],
			[ 0x2285 , "NOT A SUPERSET OF"],
			[ 0x2286 , "SUBSET OF OR EQUAL TO"],
			[ 0x2287 , "SUPERSET OF OR EQUAL TO"],
			[ 0x2288 , "NEITHER A SUBSET OF NOR EQUAL TO"],
			[ 0x2289 , "NEITHER A SUPERSET OF NOR EQUAL TO"],
			[ 0x228A , "SUBSET OF WITH NOT EQUAL TO"],
			[ 0x228B , "SUPERSET OF WITH NOT EQUAL TO"],
			
			[ 0x228F , "SQUARE IMAGE OF"],
			
			[ 0x2290 , "SQUARE ORIGINAL OF"],
			[ 0x2291 , "SQUARE IMAGE OF OR EQUAL TO"],
			[ 0x2292 , "SQUARE ORIGINAL OF OR EQUAL TO"],
			
			[ 0x22A6 , "ASSERTION"],
			[ 0x22A7 , "MODELS"],
			[ 0x22A8 , "TRUE"],
			[ 0x22A9 , "FORCES"],
			[ 0x22AA , "TRIPLE VERTICAL BAR RIGHT TURNSTILE"],
			[ 0x22AB , "DOUBLE VERTICAL BAR DOUBLE RIGHT TURNSTILE"],
			[ 0x22AC , "DOES NOT PROVE"],
			[ 0x22AD , "NOT TRUE"],
			[ 0x22AE , "DOES NOT FORCE"],
			[ 0x22AF , "NEGATED DOUBLE VERTICAL BAR DOUBLE RIGHT TURNSTILE"],
			
			[ 0x22B0 , "PRECEDES UNDER RELATION"],
			[ 0x22B1 , "SUCCEEDS UNDER RELATION"],
			[ 0x22B2 , "NORMAL SUBGROUP OF"],
			[ 0x22B3 , "CONTAINS AS NORMAL SUBGROUP"],
			[ 0x22B4 , "NORMAL SUBGROUP OF OR EQUAL TO"],
			[ 0x22B5 , "CONTAINS AS NORMAL SUBGROUP OR EQUAL TO"],
			[ 0x22B6 , "ORIGINAL OF"],
			[ 0x22B7 , "IMAGE OF"],
			[ 0x22B8 , "MULTIMAP"],
			[ 0x22B9 , "HERMITIAN CONJUGATE MATRIX"],

			[ 0x22CD , "REVERSED TILDE EQUALS"],
				
			[ 0x22D4 , "PITCHFORK"],
			[ 0x22D5 , "EQUAL AND PARALLEL TO"],
			[ 0x22D6 , "LESS-THAN WITH DOT"],
			[ 0x22D7 , "GREATER-THAN WITH DOT"],
			[ 0x22D8 , "VERY MUCH LESS-THAN"],
			[ 0x22D9 , "VERY MUCH GREATER-THAN"],
			[ 0x22DA , "LESS-THAN EQUAL TO GREATER-THAN"],
			[ 0x22DB , "GREATER-THAN EQUAL TO LESS-THAN"],
			[ 0x22DC , "EQUAL TO OR LESS-THAN"],
			[ 0x22DD , "EQUAL TO OR GREATER-THAN"],
			[ 0x22DE , "EQUAL TO OR PRECEDES"],
			[ 0x22DF , "EQUAL TO OR SUCCEEDS"],
			
			[ 0x22E0 , "DOES NOT PRECEDE OR EQUAL"],
			[ 0x22E1 , "DOES NOT SUCCEEDS OR EQUAL"],
			[ 0x22E2 , "NOT SQUARE IMAGE OF OR EQUAL TO"],
			[ 0x22E3 , "NOT SQUARE ORIGINAL OF OR EQUAL TO"],
			[ 0x22E4 , "SQUARE IMAGE OF OR EQUAL TO"],
			[ 0x22E5 , "SQUARE ORIGINAL OF OR EQUAL TO"],
			[ 0x22E6 , "LESS-THAN BUT NOT EQUIVALENT TO"],
			[ 0x22E7 , "GREATER-THAN BUT NOT EQUIVALENT TO"],
			[ 0x22E8 , "PRESEDES BUT NOT EQUIVALENT TO"],
			[ 0x22E9 , "SUCCEEDS BUT NOT EQUIVALENT TO"],
			[ 0x22EA , "NOT NORMAL SUBGROUP OF"],
			[ 0x22EB , "DOES NOT CONTAIN AS NORMAL SUBGROUP"],
			[ 0x22EC , "NOT NORMAL SUBGROUP OF OR EQUAL TO"],
			[ 0x22ED , "DOES NOT CONTAIN AS NORMAL SUBGROUP OR EQUAL"],
			[ 0x22EE , "VERTICAL ELLIPSIS"],
			[ 0x22EF , "MIDLINE HORIZONTAL ELLIPSIS"],
			
			[ 0x22F0 , "UP RIGHT DIAGONAL ELLIPSIS"],
			[ 0x22F1 , "DOWN RIGHT DIAGONAL ELLIPSIS"],
			[ 0x22F2 , "ELEMENT OF WITH LONG HORIZONTAL STROKE"],
			[ 0x22F3 , "ELEMENT OF WITH VERTICAL BAR AT END OF HORIZONTAL STROKE"],
			[ 0x22F4 , "SMALL ELEMENT OF WITH VERTICAL BAR AT END OF HORIZONTAL STROKE"],
			[ 0x22F5 , "ELEMENT OF WITH DOT ABOVE"],
			[ 0x22F6 , "ELEMENT OF WITH OVERBAR"],
			[ 0x22F7 , "SMALL ELEMENT OF WITH OVERBAR"],
			[ 0x22F8 , "ELEMENT OF WITH UNDERBAR"],
			[ 0x22F9 , "ELEMENT OF WITH TWO HORIZONTAL STROKES"],
			[ 0x22FA , "CONTAINS WITH LONG HORIZONTAL STROKE"],
			[ 0x22FB , "CONTAINS WITH VERTICAL BAR AT END OF HORIZONTAL STROKE"],
			[ 0x22FC , "SMALL CONTAINS WITH VERTICAL BAR AT END OF HORIZONTAL STROKE"],
			[ 0x22FD , "CONTAINS WITH OVERBAR"],
			[ 0x22FE , "SMALL CONTAINS WITH OVERBAR"],
			[ 0x22FF , "Z NOTATION BAG MEMBERSHIP"],
			
			[ 0x2A66 , "EQUALS SIGN WITH DOT BELOW"],
			[ 0x2A67 , "IDENTICAL WITH DOT BELOW"],
			[ 0x2A68 , "TRIPLE HORIZONTAL BAR WITH DOUBLE VERTICAL STROKE"],
			[ 0x2A69 , "TRIPLE HORIZONTAL BAR WITH TRIPLE VERTICAL STROKE"],
			[ 0x2A6A , "TILDE OPERATOR WITH DOT ABOVE"],
			[ 0x2A6B , "TILDE OPERATOR WITH RISING DOTS"],
			[ 0x2A6C , "SIMILAR MINUS SIMILAR"],
			[ 0x2A6D , "CONGRUENT WITH DOT ABOVE"],
			[ 0x2A6E , "EQUALS WITH ASTERISK"],
			[ 0x2A6F , "ALMOST EQUAL TO WITH CIRCUMFLEX"],
			
			[ 0x2A70 , "APROXIMATELY EQUAL TO EQUAL TO"],
			[ 0x2A71 , "EQUALS SIGN ABOVE PLUS SIGN"],
			[ 0x2A72 , "PLUS SIGN ABOVE EQUALS SIGN"],
			[ 0x2A73 , "EQUALS SIGN ABOVE TILDE OPERATOR"],
			[ 0x2A74 , "DOUBLE COLON EQUAL"],
			[ 0x2A75 , "TWO CONSECUTIVE EQUALS SIGN"],
			[ 0x2A76 , "THREE CONSECUTIVE EQUALS SIGN"],
			[ 0x2A77 , "EQUALS SIGN WITH TWO DOTS ABOVE AND TWO DOTS BELOW"],
			[ 0x2A78 , "EQUIVALENT WITH FOUR DOTS ABOVE"],
			[ 0x2A79 , "LESS-THAN WITH CIRCLE INSIDE"],
			[ 0x2A7A , "GREATER-THAN WITH CIRCLE INSIDE"],
			[ 0x2A7B , "LESS-THAN WITH QUESTION MARK ABOVE"],
			[ 0x2A7C , "GREATER-THAN WITH QUESTION MARK ABOVE"],
			[ 0x2A7D , "LESS-THAN OR SLANTED EQUAL TO"],
			[ 0x2A7E , "GREATER-THAN OR SLANTED EQUAL TO"],
			[ 0x2A7F , "LESS-THAN OR SLANTED EQUAL TO WITH DOT INSIDE"],
			
			[ 0x2A80 , "GREATER-THAN OR SLANTED EQUAL TO WITH DOT INSIDE"],
			[ 0x2A81 , "LESS-THAN OR SLANTED EQUAL TO WITH DOT ABOVE"],
			[ 0x2A82 , "GREATER-THAN OR SLANTED EQUAL TO WITH DOT ABOVE"],
			[ 0x2A83 , "LESS-THAN OR SLANTED EQUAL TO WITH DOT ABOVE RIGHT"],
			[ 0x2A84 , "GREATER-THAN OR SLANTED EQUAL TO WITH DOT ABOVE LEFT"],
			[ 0x2A85 , "LESS-THAN OR APPROXIMATE"],
			[ 0x2A86 , "GREATER-THAN OR APPROXIMATE"],
			[ 0x2A87 , "LESS-THAN AND SINGLE-LINE NOT EQUAL TO"],
			[ 0x2A88 , "GREATER-THAN AND SINGLE-LINE NOT EQUAL TO"],
			[ 0x2A89 , "LESS-THAN AND NOT APPROXIMATE"],
			[ 0x2A8A , "GREATER-THAN AND NOT APPROXIMATE"],
			[ 0x2A8B , "LESS-THAN ABOVE DOUBLE-LINE EQUAL ABOVE GREATER-THAN"],
			[ 0x2A8C , "GREATER-THAN ABOVE DOUBLE-LINE EQUAL ABOVE LESS-THAN"],
			[ 0x2A8D , "LESS-THAN ABOVE SIMILAR OR EQUAL"],
			[ 0x2A8E , "GREATER-THAN ABOVE SIMILAR OR EQUAL"],
			[ 0x2A8F , "LESS-THAN ABOVE SIMILAR ABOVE GREATER-THAN"],
			
			[ 0x2A90 , "GREATER-THAN ABOVE SIMILAR ABOVE LESS-THAN"],
			[ 0x2A91 , "LESS-THAN ABOVE GREATER-THAN ABOVE DOUBLE-LINE EQUAL"],
			[ 0x2A92 , "GREATER-THAN ABOVE LESS-THAN ABOVE DOUBLE-LINE EQUAL"],
			[ 0x2A93 , "LESS-THAN ABOVE SLANTED EQUALS ABOVE GREATER-THAN"],
			[ 0x2A94 , "GREATER-THAN ABOVE SLANTED EQUALS ABOVE LESS-THAN"],
			[ 0x2A95 , "SLANTED EQUAL TO OR LESS-THAN"],
			[ 0x2A96 , "SLANTED EQUAL TO OR GREATER-THAN"],
			[ 0x2A97 , "SLANTED EQUAL TO OR LESS-THAN WITH DOT INSIDE"],
			[ 0x2A98 , "SLANTED EQUAL TO OR GREATER-THAN WITH DOT INSIDE"],
			[ 0x2A99 , "DOUBLE-LINE EQUAL TO OR LESS-THAN"],
			[ 0x2A9A , "DOUBLE-LINE EQUAL TO OR GREATER-THAN"],
			[ 0x2A9B , "DOUBLE-LINE SLANTED EQUAL TO OR LESS-THAN"],
			[ 0x2A9C , "DOUBLE-LINE SLANTED EQUAL TO OR GREATER-THAN"],
			[ 0x2A9D , "SIMILAR OR LESS-THAN"],
			[ 0x2A9E , "SIMILAR OR GREATER-THAN"],
			[ 0x2A9F , "SIMILAR OR ABOVE LESS-THAN ABOVE EQUALS SIGN"],
			
			[ 0x2AA0 , "SIMILAR OR ABOVE GREATER-THAN ABOVE EQUALS SIGN"],
			[ 0x2AA1 , "DOUBLE NESTED LESS-THAN"],
			[ 0x2AA2 , "DOUBLE NESTED GREATER-THAN"],
			[ 0x2AA3 , "DOUBLE NESTED LESS-THAN WITH UNDERBAR"],
			[ 0x2AA4 , "GREATER-THAN OVERLAPPING LESS-THAN"],
			[ 0x2AA5 , "GREATER-THAN BESIDES LESS-THAN"],
			[ 0x2AA6 , "LESS-THAN CLOSED BY A CURVE"],
			[ 0x2AA7 , "GREATER-THAN CLOSED BY A CURVE"],
			[ 0x2AA8 , "LESS-THAN CLOSED BY A CURVE ABOVE SLANTED EQUAL"],
			[ 0x2AA9 , "GREATER-THAN CLOSED BY A CURVE ABOVE SLANTED EQUAL"],
			[ 0x2AAA , "SMALLER THAN"],
			[ 0x2AAB , "LARGER THAN"],
			[ 0x2AAC , "SMALLER THAN OR EQUAL TO"],
			[ 0x2AAD , "LARGER THAN OR EQUAL TO"],
			[ 0x2AAE , "EQUAL SIGN WITH BUMPY ABOVE"],
			[ 0x2AAF , "PRECEDES ABOVE SINGLE-LINE EQUALS SIGN"],
			
			[ 0x2AB0 , "SUCCEEDS ABOVE SINGLE-LINE EQUALS SIGN"],
			[ 0x2AB1 , "PRECEDES ABOVE SINGLE-LINE NOT EQUAL TO"],
			[ 0x2AB2 , "SUCCEEDS ABOVE SINGLE-LINE NOT EQUAL TO"],
			[ 0x2AB3 , "PRECEDES ABOVE EQUALS SIGN"],
			[ 0x2AB4 , "SUCCEEDS ABOVE EQUALS SIGN"],
			[ 0x2AB5 , "PRECEDES ABOVE NOT EQUAL TO"],
			[ 0x2AB6 , "SUCCEEDS ABOVE NOT EQUAL TO"],
			[ 0x2AB7 , "PRECEDES ABOVE ALMOST EQUAL TO"],
			[ 0x2AB8 , "SUCCEEDS ABOVE ALMOST EQUAL TO"],
			[ 0x2AB9 , "PRECEDES ABOVE NOT ALMOST EQUAL TO"],
			[ 0x2ABA , "SUCCEEDS ABOVE NOT ALMOST EQUAL TO"],
			[ 0x2ABB , "DOUBLE PRECEDES"],
			[ 0x2ABC , "DOUBLE SUCCEEDS"],
			[ 0x2ABD , "SUBSET WITH DOT"],
			[ 0x2ABE , "SUPERSET WITH DOT"],
			[ 0x2ABF , "SUBSET WITH PLUS SIGN BELOW"],
			
			[ 0x2AC0 , "SUPERSET WITH PLUS SIGN BELOW"],
			[ 0x2AC1 , "SUBSET WITH MULTIPLICATION SIGN BELOW"],
			[ 0x2AC2 , "SUPERSET WITH MULTIPLICATION SIGN BELOW"],
			[ 0x2AC3 , "SUBSET OF OR EQUAL TO WITH DOT ABOVE"],
			[ 0x2AC4 , "SUPERSET OF OR EQUAL TO WITH DOT ABOVE"],
			[ 0x2AC5 , "SUBSET OF ABOVE EQUAL SIGN"],
			[ 0x2AC6 , "SUPERSET OF ABOVE EQUAL SIGN"],
			[ 0x2AC7 , "SUBSET OF ABOVE TILDE OPERATOR"],
			[ 0x2AC8 , "SUPERSET OF ABOVE TILDE OPERATOR"],
			[ 0x2AC9 , "SUBSET OF ABOVE ALMOST EQUAL TO"],
			[ 0x2ACA , "SUPERSET OF ABOVE ALMOST EQUAL TO"],
			[ 0x2ACB , "SUBSET OF ABOVE ALMOST NOT EQUAL TO"],
			[ 0x2ACC , "SUPERSET OF ABOVE ALMOST NOT EQUAL TO"],
			[ 0x2ACD , "SQUARE LEFT OPEN BOX OPERATOR"],
			[ 0x2ACE , "SQUARE RIGHT OPEN BOX OPERATOR"],
			[ 0x2ACF , "CLOSED SUBSET"],
			
			[ 0x2AD0 , "CLOSED SUPERSET"],
			[ 0x2AD1 , "CLOSED SUBSET OR EQUAL TO"],
			[ 0x2AD2 , "CLOSED SUPERSET OR EQUAL TO"],
			[ 0x2AD3 , "SUBSET ABOVE SUPERSET"],
			[ 0x2AD4 , "SUPERSET ABOVE SUBSET"],
			[ 0x2AD5 , "SUBSET ABOVE SUBSET"],
			[ 0x2AD6 , "SUPERSET ABOVE SUPERSET"],
			[ 0x2AD7 , "SUPERSET BESIDES SUBSET"],
			[ 0x2AD8 , "SUPERSET BESIDES AND HOINED BY DASH WITH SUBSET"],
			[ 0x2AD9 , "ELEMENT OF OPENING DOWNWARDS"],
			[ 0x2ADA , "PITCHFORK WITH TEE TOP"],
			[ 0x2ADB , "TRANSVERAL INTERSECTION"],
			[ 0x2ADC , "FORKING"],
			[ 0x2ADD , "NONFORKING"],
			
			[ 0x2AF7 , "TRIPPLE NESTED LESS-THAN"],
			[ 0x2AF8 , "TRIPPLE NESTED GREATER-THAN"],
			[ 0x2AF9 , "DOUBLE-LINE SLANTED LESS-THAN OR EQUAL TO"],
			[ 0x2AFA , "DOUBLE-LINE SLANTED GREATER-THAN OR EQUAL TO"],
			[ 0x2AFB , "TRIPPLE SOLIDUS BINARY RELATION"],
			
			[ 0x29E3 , "EQUALS SIGN AND SLANTED PARALLEL"],
			[ 0x29E4 , "EQUALS SIGN AND SLANTED PARALLEL WITH TILDE ABOVE"],
			[ 0x29E5 , "IDENTICAL TO AND SLANDED PARALLEL"],
			[ 0x29E6 , "GLEICH STARK"],
			
			
			[ 0 , "Brackets"],
			[ 0x27E6 , "MATHEMATICAL LEFT WHITE SQUARE BRACKET"],
			[ 0x27E7 , "MATHEMATICAL RIGHT WHITE SQUARE BRACKET"],
			[ 0x27E8 , "MATHEMATICAL LEFT ANGLE BRACKET"],
			[ 0x27E9 , "MATHEMATICAL RIGHT ANGLE BRACKET"],
			[ 0x27EA , "MATHEMATICAL DOUBLE LEFT ANGLE BRACKET"],
			[ 0x27EB , "MATHEMATICAL DOUBLE RIGHT ANGLE BRACKET"],
			[ 0x27EC , "MATHEMATICAL LEFT WHITE TORTOISE SHELL BRACKET"],
			[ 0x27ED , "MATHEMATICAL RIGHT WHITE TORTOISE SHELL BRACKET"],
			[ 0x27EE , "MATHEMATICAL LEFT FLATTENED PARENTHESIS"],
			[ 0x27EF , "MATHEMATICAL RIGHT FLATTENED PARENTHESIS"],
			
			[ 0x2983 , "LEFT WHITE CURLY BRACKET"],
			[ 0x2984 , "RIGHT WHITE CURLY BRACKET"],
			[ 0x2985 , "LEFT WHITE PARENTHESIS"],
			[ 0x2986 , "RIGHT WHITE PARENTHESIS"],
			[ 0x2987 , "Z NOTATION LEFT IMAGE BRACKET"],
			[ 0x2988 , "Z NOTATION RIGHT IMAGE BRACKET"],
			[ 0x2989 , "Z NOTATION LEFT BINDING BRACKET"],
			[ 0x298A , "Z NOTATION RIGHT BINDING BRACKET"],
			[ 0x298B , "LEFT SQUARE BRACKET WITH UNDERBAR"],
			[ 0x298C , "RIGHT SQUARE BRACKET WITH UNDERBAR"],
			[ 0x298D , "LEFT SQUARE BRACKET WITH TICK IN TOP CORNER"],
			[ 0x298E , "RIGHT SQUARE BRACKET WITH TICK IN BOTTOM CORNER"],
			[ 0x298F , "LEFT SQUARE BRACKET WITH TICK IN BOTTOM CORNER"],

			[ 0x2990 , "RIGHT SQUARE BRACKET WITH TICK IN TOP CORNER"],
			[ 0x2991 , "LEFT ANGLE BRACKET WITH DOT"],
			[ 0x2992 , "RIGHT ANGLE BRACKET WITH DOT"],
			[ 0x2993 , "LEFT ARC LESS-THAN BRACKET"],
			[ 0x2994 , "RIGHT ARC GREATER-THAN BRACKET"],
			[ 0x2995 , "DOUBLE LEFT ARC GREATER-THAN BRACKET"],
			[ 0x2996 , "DOUBLE RIGHT ARC LESS-THAN BRACKET"],
			[ 0x2997 , "LEFT BLACK TORTOISE SHELL BRACKET"],
			[ 0x2998 , "RIGHT BLACK TORTOISE SHELL BRACKET"],
			
			[ 0x29FC , "LEFT-POINTING CURVED ANGLE BRACKET"],
			[ 0x29FD , "RIGHT-POINTING CURVED ANGLE BRACKET"],
			
			[ 0x2E1C , "LEFT LOW PARAPHRASE BRACKET"],
			[ 0x2E1D , "RIGHT LOW PARAPHRASE BRACKET"],
			
			[ 0x2E20 , "LEFT VERTICAL BAR WITH QUILL"],
			[ 0x2E21 , "RIGHT VERTICAL BAR WITH QUILL"],
			[ 0x2E22 , "TOP LEFT HALF BRACKET"],
			[ 0x2E23 , "TOP RIGHT HALF BRACKET"],
			[ 0x2E24 , "BOTTOM LEFT HALF BRACKET"],
			[ 0x2E25 , "BOTTOM RIGHT HALF BRACKET"],
			[ 0x2E26 , "LEFT SIDWAYS U BRACKET"],
			[ 0x2E27 , "RIGHT SIDWAYS U BRACKET"],
			[ 0x2E28 , "LEFT DOUBLE PARENTHESES"],
			[ 0x2E29 , "RIGHT DOUBLE PARENTHESES"],
			
			
			[ 0 , "Multi-line Grouping Characters"],
			[ 0x2308 , "LEFT CEILING"],
			[ 0x2309 , "RIGHT CEILING"],
			[ 0x230A , "LEFT FLOOR"],
			[ 0x230B , "RIGHT FLOOR"],
			[ 0x239B , "LEFT PARENTHESIS UPPER HOOK"],
			[ 0x239C , "LEFT PARENTHESIS EXTENSION"],
			[ 0x239D , "LEFT PARENTHESIS LOWER HOOK"],
			[ 0x239E , "RIGHT PARENTHESIS UPPER HOOK"],
			[ 0x239F , "RIGHT PARENTHESIS EXTENSION"],
			[ 0x23A0 , "RIGHT PARENTHESIS LOWER HOOK"],
			[ 0x23A1 , "LEFT SQUARE BRACKET UPPER HOOK"],
			[ 0x23A2 , "LEFT SQUARE BRACKET EXTENSION"],
			[ 0x23A3 , "LEFT SQUARE BRACKET LOWER HOOK"],
			[ 0x23A4 , "RIGHT SQUARE BRACKET UPPER HOOK"],
			[ 0x23A5 , "RIGHT SQUARE BRACKET EXTENSION"],
			[ 0x23A6 , "RIGHT SQUARE BRACKET LOWER HOOK"],
			[ 0x23A7 , "LEFT CURLY BRACKET UPPER HOOK"],
			[ 0x23A8 , "LEFT CURLY BRACKET MIDDLE PIECE"],
			[ 0x23A9 , "LEFT CURLY BRACKET LOWER HOOK"],
			[ 0x23AA , "CURLY BRACKET EXTENSION"],
			[ 0x23AB , "RIGHT CURLY BRACKET UPPER HOOK"],
			[ 0x23AC , "RIGHT CURLY BRACKET MIDDLE PIECE"],
			[ 0x23AD , "RIGHT CURLY BRACKET LOWER HOOK"],
			[ 0x23B0 , "UPPER LEFT OR LOWER RIGHT CURLY BRACKET SECTION"],
			[ 0x23B1 , "UPPER RIGHT OR LOWER LEFT CURLY BRACKET SECTION"],
			[ 0x2320 , "TOP HALF INTEGRAL"],
			[ 0x23AE , "INTEGRAL EXTENSION"],
			[ 0x2321 , "BOTTOM HALF INTEGRAL"],	
			[ 0x23B2 , "SUMATION TOP"],
			[ 0x23B3 , "SUMATION BOTTOM"],
			
			[ 0 , "Vertical Grouping Characters"],
			[ 0x23B4 , "TOP SQUARE BRACKET"],
			[ 0x23B5 , "BOTTOM SQUARE BRACKET"],
			[ 0x23B6 , "BOTTOM SQUARE BRACKET OVER TOP SQUARE BRACKET"],
			[ 0x23DC , "TOP PARENTHESIS"],
			[ 0x23DD , "BOTTOM PARENTHESIS"],
			[ 0x23DE , "TOP CURLY BRACKET"],
			[ 0x23DF , "BOTTOM CURLY BRACKET"],
			[ 0x23E0 , "TOP TORTOISE SHELL BRACKET"],
			[ 0x23E1 , "BOTTOM TORTOISE SHELL BRACKET"],
			
			

		);

		Smiley.alltabs.Arrows = new Array(
			[ 0x21F3 , "Arrows"],
			
			[ 0 , "Simple Arrows"],
			[ 0x2190 , "LEFTWARDS ARROW"],
			[ 0x2191 , "UPWARDS ARROW"],
			[ 0x2192 , "RIGHTWARDS ARROW"],
			[ 0x2193 , "DOWNWARDS ARROW"],
			[ 0x2194 , "LEFT RIGHT ARROW"],
			[ 0x2195 , "UP DOWN ARROW"],
			[ 0x2196 , "NORTH WEST ARROW"],
			[ 0x2197 , "NORTH EAST ARROW"],
			[ 0x2198 , "SOUTH EAST ARROW"],
			[ 0x2199 , "SOUTH WEST ARROW"],
			
			[ 0x23AF , "HORIZONTAL LINE EXTENSION"],
			[ 0x23D0 , "VERTICAL LINE EXTENSION"],
			
			[ 0 , "Arrows with modifications"],
			[ 0x219A , "LEFTWARDS ARROW WITH STROKE"],
			[ 0x219B , "RIGHTWARDS ARROW WITH STROKE"],
			[ 0x219C , "LEFTWARDS WAVE ARROW"],
			[ 0x219D , "RIGHTWARDS WAVE ARROW"],
			[ 0x219E , "LEFTWARDS TWO HEADED ARROW"],
			[ 0x219F , "UPWARDS TWO HEADED ARROW"],
			
			[ 0x21A0 , "RIGHTWARDS TWO HEADED ARROW"],
			[ 0x21A1 , "DOWNWARDS TWO HEADED ARROW"],
			[ 0x21A2 , "LEFTWARDS ARROW WITH TAIL"],
			[ 0x21A3 , "RIGHTWARDS ARROW WITH TAIL"],
			[ 0x21A4 , "LEFTWARDS ARROW FROM BAR"],
			[ 0x21A5 , "UPWARDS ARROW FROM BAR"],
			[ 0x21A6 , "RIGHTWARDS ARROW FROM BAR"],
			[ 0x21A7 , "DOWNWARDS ARROW FROM BAR"],
			[ 0x21A8 , "UP DOWN ARROW WITH BASE"],
			[ 0x21A9 , "LEFTWARDS ARROW WITH HOOK"],
			[ 0x21AA , "RIGHTWARDS ARROW WITH HOOK"],
			[ 0x21AB , "LEFTWARDS ARROW WITH LOOP"],
			[ 0x21AC , "RIGHTWARDS ARROW WITH LOOP"],
			[ 0x21AD , "LEFT RIGHT WAVE ARROW"],
			[ 0x21AE , "LEFT RIGHT ARROW WITH STROKE"],
			[ 0x21AF , "DOWNWARDS ZIGZAG ARROW"],
			
			[ 0x21B0 , "UPWARDS ARROW WITH TIP LEFTWARDS"],
			[ 0x21B1 , "UPWARDS ARROW WITH TIP RIGHTWARDS"],
			[ 0x21B2 , "DOWNWARDS ARROW WITH TIP LEFTWARDS"],
			[ 0x21B3 , "DOWNWARDS ARROW WITH TIP RIGHTWARDS"],
			
			[ 0x2B0E , "RIGHTWARDS ARROW WITH TIP DOWNWARDS"],
			[ 0x2B0F , "RIGHTWARDS ARROW WITH TIP UPWARDS"],
			[ 0x2B10 , "LEFTWARDS ARROW WITH TIP DOWNWARDS"],
			[ 0x2B11 , "LEFTWARDS ARROW WITH TIP UPWARDS"],
			
			[ 0 , "Keyboard Symbols and Circle Arrows"],
			[ 0x21B4 , "RIGHTWARDS ARROW WITH CORNER DOWNWARDS"],
			[ 0x21B5 , "DOWNWARDS ARROW WITH CORNER LEFTWARDS"],
			[ 0x21B6 , "ANTICLOCKWISE TOP SEMICIRCLE ARROW"],
			[ 0x21B7 , "CLOCKWISE TOP SEMICIRCLE ARROW"],
			[ 0x21B8 , "NORTHWEST ARROW TO LONG BAR"],
			[ 0x21B9 , "LEFTWARDS ARROW TO BAR OVER RIGHTWARDS ARROW TO BAR"],
			[ 0x21BA , "ANTICLOCKWISE OPEN CIRCLE ARROW"],
			[ 0x21BB , "CLOCKWISE OPEN CIRCLE ARROW"],
			[ 0 , "Harpoons"],
			[ 0x21BC , "LEFTWARDS HARPOON WITH BARB UPWARDS"],
			[ 0x21BD , "LEFTWARDS HARPOON WITH BARB DOWNWARDS"],
			[ 0x21BE , "UPWARDS HARPOON WITH BARB RIGHTWARDS"],
			[ 0x21BF , "UPWARDS HARPOON WITH BARB LEFTWARDS"],
			
			[ 0x21C0 , "RIGHTWARDS HARPOON WITH BARB UPWARDS"],
			[ 0x21C1 , "RIGHTWARDS HARPOON WITH BARB DOWNWARDS"],
			[ 0x21C2 , "DOWNWARDS HARPOON WITH BARB RIGHTWARDS"],
			[ 0x21C3 , "DOWNWARDS HARPOON WITH BARB LEFTWARDS"],
			[ 0 , "Paired Arrows and Harpoons"],
			[ 0x21C4 , "RIGHTWARDS ARROW OVER LEFTWARDS ARROW"],
			[ 0x21C5 , "UPWARDS ARROW LEFTWARDS OF DOWNWARDS ARROW"],
			[ 0x21C6 , "LEFTWARDS ARROW OVER RIGHTWARDS ARROW"],
			[ 0x21C7 , "LEFTWARDS PAIRED ARROWS"],
			[ 0x21C8 , "UPWARDS PAIRED ARROWS"],
			[ 0x21C9 , "RIGHTWARDS PAIRD ARROWS"],
			[ 0x21CA , "DOWNWARDS PAIRED ARROWS"],
			[ 0x21CB , "LEFTWARDS HARPOON OVER RIGHTWARDS HARPOON"],
			[ 0x21CC , "RIGHTWARDS HARPOON OVER LEFTWARDS HARPOON"],
			[ 0 , "Double Arrows"],
			[ 0x21CD , "LEFTWARDS DOUBLE ARROW WITH STROKE"],
			[ 0x21CE , "LEFT RIGHT DOUBLE ARROW WITH STROKE"],
			[ 0x21CF , "RIGHTWARDS DOUBLE ARROW WITH STROKE"],
			
			[ 0x21D0 , "LEFTWARDS DOUBLE ARROW"],
			[ 0x21D1 , "UPWARDS DOUBLE ARROW"],
			[ 0x21D2 , "RIGHTWARDS DOUBLE ARROW"],
			[ 0x21D3 , "DOWNWARDS DOUBLE ARROW"],
			[ 0x21D4 , "LEFT RIGHT DOUBLE ARROW"],
			[ 0x21D5 , "UP DOWN DOUBLE ARROW"],
			[ 0x21D6 , "NORTH WEST DOUBLE ARROW"],
			[ 0x21D7 , "NORTH EAST DOUBLE ARROW"],
			[ 0x21D8 , "SOUTH EAST DOUBLE ARROW"],
			[ 0x21D9 , "SOUTH WEST DOUBLE ARROW"],
			[ 0 , "Miscellaneous Arrows and Keyboard Sybmols"],
			[ 0x21DA , "LEFTWARDS TRIPLE ARROW"],
			[ 0x21DB , "RIGHTWARDS TRIPLE ARROW"],
			[ 0x21DC , "LEFTWARDS SQUIGGLE ARROW"],
			[ 0x21DD , "RIGHTWARDS SQUIGGLE ARROW"],
			[ 0x21DE , "UPWARDS ARROW WITH DOUBLE STROKE"],
			[ 0x21DF , "DOWNWARDS ARROW WITH DOUBLE STROKE"],
			
			[ 0x21E0 , "LEFTWARDS DASHED ARROW"],
			[ 0x21E1 , "UPWARDS DASHED ARROW"],
			[ 0x21E2 , "RIGHTWARDS DASHED ARROW"],
			[ 0x21E3 , "DOWNWARDS DASHED ARROW"],
			[ 0x21E4 , "LEFTWARDS ARROW TO BAR"],
			[ 0x21E5 , "RIGHTWARDS ARROW TO BAR"],
			[ 0 , "White Arrows and Keyboard Sybmols"],
			[ 0x21E6 , "LEFTWARDS WHITE ARROW"],
			[ 0x21E7 , "UPWARDS WHITE ARROW"],
			[ 0x21E8 , "RIGHTWARDS WHITE ARROW"],
			[ 0x21E9 , "DOWNWARDS WHITE ARROW"],
			[ 0x21EA , "UPWARDS WHITE ARROW FROM BAR"],
			[ 0x21EB , "UPWARDS WHITE ARROW ON A PEDESTAL"],
			[ 0x21EC , "UPWARDS WHITE ARROW ON A PEDESTAL WITH HORIZONTAL BAR"],
			[ 0x21ED , "UPWARDS WHITE ARROW ON A PEDESTAL WITH VERTICAL BAR"],
			[ 0x21EE , "UPWARDS WHITE DOUBLE ARROW"],
			[ 0x21EF , "UPWARDS WHITE DOUBLE ARROW ON A PEDESTAL"],
			
			[ 0x21F0 , "RIGHTWARDS WHITE ARROW FROM WALL"],
			[ 0x21F1 , "NORTH WEST ARROW TO CORNER"],
			[ 0x21F2 , "SOUTH EAST ARROW TO CORNER"],
			[ 0x21F3 , "UP DOWN WHITE ARROW"],
			
			[ 0x2B00 , "NORTH EAST WHITE ARROW"],
			[ 0x2B01 , "NORTH WEST WHITE ARROW"],
			[ 0x2B02 , "SOUTH EAST WHITE ARROW"],
			[ 0x2B03 , "SOUTH WEST WHITE ARROW"],
			
			[ 0 , "Black Arrows"],
			[ 0x27A1 , "RIGHTWARDS BLACK ARROW"],
			[ 0x279E , "HEAVY RIGHTWARDS BLACK ARROW"],
			[ 0x2B05 , "LEFTWARDS BLACK ARROW"],
			[ 0x2B06 , "UPWARDS BLACK ARROW"],
			[ 0x2B07 , "DOWNWARDS BLACK ARROW"],
			[ 0x2B08 , "NORTH EAST WHITE ARROW"],
			[ 0x2B09 , "NORTH WEST WHITE ARROW"],
			[ 0x2B0A , "SOUTH EAST WHITE ARROW"],
			[ 0x2B0B , "SOUTH WEST WHITE ARROW"],
			[ 0x2B0C , "LEFT RIGHT BLACK ARROW"],
			[ 0x2B0D , "UP DOWN BLACK ARROW"],
			
			
			[ 0 , "Miscellaneous Arrows"],
			[ 0x21F4 , "RIGHT ARROW WITH SMALL CIRCLE"],
			[ 0x21F5 , "DOWNWARDS ARROW LEFTWARDS OF UPWARDS ARROW"],
			[ 0x21F6 , "THREE RIGHTWARDS ARRWOS"],
			[ 0x21F7 , "LEFTWARDS ARROW WITH VERTICAL STROKE"],
			[ 0x21F8 , "RIGHTWARDS ARROW WITH VERTICAL STROKE"],
			[ 0x21F9 , "LEFT RIGHT ARROW WITH VERTICAL STROKE"],
			[ 0x21FA , "LEFTWARDS ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x21FB , "RIGHTWARDS ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x21FC , "LEFT RIGHT ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x21FD , "LEFTWARDS OPEN-HEADED ARROW"],
			[ 0x21FE , "RIGHTWARDS OPEN-HEADED ARROW"],
			[ 0x21FF , "LEFT RIGHT OPEN-HEADED ARROW"],
			[ 0x27F4 , "RIGHT ARROW WITH CIRCLED PLUS"],
			
			[ 0x2B30 , "LEFT ARROW WITH SMALL CIRCLE"],
			[ 0x2B31 , "THREE LEFTWARDS ARROW"],
			[ 0x2B32 , "LEFT ARROW WITH CIRCLED PLUS"],
			[ 0x2B34 , "LEFTWARDS TWO-HEADED ARROW WITH VERTICAL STROKE"],
			[ 0x2B35 , "LEFTWARDS TWO-HEADED ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x2B36 , "LEFTWARDS TWO-HEADED ARROW FROM BAR"],
			[ 0x2B37 , "LEFTWARDS TWO-HEADED TRIPPLE DASH ARROW"],
			[ 0x2B38 , "LEFTWARDS ARROW WITH DOTTED STEM"],
			[ 0x2B39 , "LEFTWARDS ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2B3A , "LEFTWARDS ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			[ 0x2B3B , "LEFTWARDS TWO-HEADED ARROW WITH TAIL"],
			[ 0x2B3C , "LEFTWARDS TWO-HEADED ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2B3D , "LEFTWARDS TWO-HEADED ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			
			[ 0x2B45 , "LEFTWARDS QUADRUPLE ARROW"],
			[ 0x2B46 , "RIGHTWARDS QUADRUPLE ARROW"],
			
			[ 0x27F0 , "UPWARDS QUADRUPLE ARROW"],
			[ 0x27F1 , "DOWNWARDS QUADRUPLE ARROW"],
			[ 0x27F2 , "ANTICLOCKWISE GAPPED CIRCLE ARROW"],
			[ 0x27F3 , "CLOCKWISE GAPPED CIRCLE ARROW"],
			
			[ 0x2900 , "RIGHTWARDS TWO-HEADED ARROW WITH VERTICAL STROKE"],
			[ 0x2901 , "RIGHTWARDS TWO-HEADED ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x2902 , "LEFTWARDS DOUBLE ARROW WITH VERTICAL STROKE"],
			[ 0x2903 , "RIGHTWARDS DOUBLE ARROW WITH VERTICAL STROKE"],
			[ 0x2904 , "LEFT RIGHT DOUBLE ARROW EITH VERTICAL STROKE"],
			[ 0x2905 , "RIGHTWARDS TWO-HEADED ARROW FROM BAR"],
			[ 0x2906 , "LEFTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x2907 , "RIGHTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x2908 , "DOWNWARDS ARROW WITH HORIZONTAL STROKE"],
			[ 0x2909 , "UPWARDS ARROW WITH HORIZONTAL STROKE"],
			[ 0x290A , "UPWARDS TRIPPLE ARROW"],
			[ 0x290B , "DOWNWARDS TRIPPLE ARROW"],
			[ 0x290C , "LEFTWARDS DOUBLE DASH ARROW"],
			[ 0x290D , "RIGHTWARDS DOUBLE DASH ARROW"],
			[ 0x290E , "LEFTWARDS TRIPPLE DASH ARROW"],
			[ 0x290F , "RIGHTWARDS TRIPPLE DASH ARROW"],
			
			[ 0x2910 , "RIGHTWARDS TWO-HEADED TRIPPLE DASH ARROWE"],
			[ 0x2911 , "RIGHTWARDS ARROW WITH DOTTED STEM"],
			[ 0x2912 , "UPWARDS ARROW TO BAR"],
			[ 0x2913 , "DOWNWARDS ARROW TO BAR"],
			[ 0x2914 , "RIGHTWARDS ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2915 , "RIGHTWARDS ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			[ 0x2916 , "RIGHTWARDS TWO-HEADED ARROW WITH TAIL"],
			[ 0x2917 , "RIGHTWARDS TWO-HEADED ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2918 , "RIGHTWARDS TWO-HEADED ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			
			[ 0x291D , "LEFTWARDS ARROW TO BLACK DIAMOND"],
			[ 0x291E , "RIGHTWARDS ARROW TO BLACK DIAMOND"],
			[ 0x291F , "LEFTWARDS ARROW FROM BAR TO BLACK DIAMOND"],
			
			[ 0x2920 , "RIGHTWARDS ARROW FROM BAR TO BLACK DIAMOND"],
			[ 0x2921 , "NORTH WEST AND SOUTH EAST ARROW"],
			[ 0x2922 , "NORTH EAST AND SOUTH WEST ARROW"],
			[ 0x2923 , "NORTH WEST ARROW WITH HOOK"],
			[ 0x2924 , "NORTH EAST ARROW WITH HOOK"],
			[ 0x2925 , "SOUTH EAST ARROW WITH HOOK"],
			[ 0x2926 , "SOUTH WEST ARROW WITH HOOK"],
			
			[ 0x2970 , "RIGHTWARDS DOUBLE ARROW WITH ROUNDED HEAD"],
			
			[ 0 , "Crossing Arrows for Knot Theory"],
			[ 0x2927 , "NORTH WEST ARROW AND NORTH EAST ARROW"],
			[ 0x2928 , "NORTH EAST ARROW AND SOUTH EAST ARROW"],
			[ 0x2929 , "SOUTH EAST ARROW AND SOUTH WEST ARROW"],
			[ 0x292A , "SOUTH WEST ARROW AND NORTH WEST ARROW"],
			[ 0x292B , "RISING DIAGNAL CROSSING FALLING DIAGONAL"],
			[ 0x292C , "FALLING DIAGONAL CROSSING RISING DIAGNAL"],
			[ 0x292D , "SOUTH EAST ARROW CROSSING NORTH EAST ARROW"],
			[ 0x292E , "NORTH EAST ARROW CROSSING SOUTH EAST ARROW"],
			[ 0x292F , "FALLING DIAGONAL CROSSING NORTH EAST ARROW"],
			
			[ 0x2930 , "RISING DIAGNAL CROSSING SOUTH EAST ARROW"],
			[ 0x2931 , "NORTH EAST ARROW CROSSING NORTH WEST ARROW"],
			[ 0x2932 , "NORTH WEST ARROW CROSSING NORTH EAST ARROW"],
			
			[ 0 , "Miscellaneous Curved Arrows"],
			[ 0x2B3F , "WAVE ARROW POINTING DIRECTLY LEFT"],
			[ 0x2933 , "WAVE ARROW POINTING DIRECTLY RIGHT"],
			[ 0x2934 , "ARROW POINTING RIGHTWARDS THEN CURVING UPWARDS"],
			[ 0x2935 , "ARROW POINTING RIGHTWARDS THEN CURVING DOWNWARDS"],
			[ 0x2936 , "ARROW POINTING DOWNWARDS THEN CURVING LEFTWARDS"],
			[ 0x2937 , "ARROW POINTING DOWNWARDS THEN CURVING RIGHTWARDS"],
			[ 0x2938 , "RIGHT SIDE ARC CLOCKWISE ARROW"],
			[ 0x2939 , "LEFT SIDE ARC ANTICLOCKWISE ARROW"],
			[ 0x293A , "TOP ARC ANTICLOCKWISE ARROW"],
			[ 0x293B , "BOTTOM ARC ANTICLOCKWISE ARROW"],
			[ 0x293C , "TOP ARC CLOCKWISE ARROW WITH MINUS"],
			[ 0x293D , "TOP ARC ANTICLOCKWISE ARROW WITH PLUS"],
			[ 0x293E , "LOWER RIGHT SEMICURCULAR CLOCKWISE ARROW"],
			[ 0x293F , "LOWER LEFT SEMICURCULAR ANTICLOCKWISE ARROW"],
			
			[ 0x2940 , "ANTICLOCKWISE CLOSED CIRCLE ARROW"],
			[ 0x2941 , "CLOCKWISE CLOSED CIRCLE ARROW"],
			
			[ 0 , "Arrows with Combined Operators"],
			[ 0x2942 , "RIGHTWARDS ARROW ABOVE SHORT LEFTWARDS ARROW"],
			[ 0x2943 , "LEFTWARDS ARROW ABOVE SHORT RIGHTWARDS ARROW"],
			[ 0x2944 , "SHORT RIGHTWARDS ARROW ABOVE LEFTWARDS ARROW"],
			[ 0x2945 , "RIGHTWARDS ARROW WITH PLUS BELOW"],
			[ 0x2946 , "LEFTWARDS ARROW WITH PLUS BELOW"],
			[ 0x2947 , "RIGHTWARDS ARROW THROUGH X"],
			[ 0x2B3E , "LEFTWARDS ARROW THROUGH X"],
			[ 0x2948 , "LEFT RIGHT ARROW THROUGH SMALL CIRCLE"],
			[ 0x2949 , "UPWARDS TWO-HEADED ARROW FROM SMALL CIRCLE"],
			
			[ 0x2971 , "EQUALS SIGN ABOVE RIGHTWARDS ARROW"],
			[ 0x2B40 , "EQUALS SIGN ABOVE LEFTWARDS ARROW"],
			[ 0x2B41 , "REVERSE TILDE OPERATOR ABOVE LEFTWARDS ARROW"],
			[ 0x2B42 , "LEFTWARDS ARROW ABOVE REVERSE ALMOST EQUAL TO"],
			[ 0x2B47 , "REVERSE TILDE OPERATOR ABOVE RIGHTWARDS ARROW"],
			[ 0x2B48 , "RIGHTWARDS ARROW ABOVE REVERSE ALMOST EQUAL TO"],
			[ 0x2B49 , "TILDE OPERATOR ABOVE LEFTWARDS ARROW"],
			[ 0x2B4A , "LEFTWARDS ARROW ABOVE ALMOST EQUAL TO"],
			[ 0x2B4B , "LEFTWARDS ARROW ABOVE REVERSE TILDE OPERATOR"],
			[ 0x2B4C , "RIGHTWARDS ARROW ABOVE REVERSE TILDE OPERATOR"],
			[ 0x2972 , "TILDE OPERATOR ABOVE RIGHTWARDS ARROW"],
			[ 0x2973 , "LEFTWARDS ARROW ABOVE TILDE OPERATOR"],
			[ 0x2974 , "RIGHTWARDS ARROW ABOVE TILDE OPERATOR"],
			[ 0x2975 , "RIGHTWARDS ARROW ABOVE ALMOST EQUAL TO"],
			[ 0x2976 , "LESS-THAN ABOVE LEFTWARDS ARROW"],
			[ 0x2977 , "LEFTWARDS ARROW THROUGH LESS-THAN"],
			[ 0x2B43 , "RIGHTWARDS ARROW THROUGH GREATER-THAN"],
			[ 0x2B44 , "RIGHTWARDS ARROW THROUGH SUPEERSET"],
			[ 0x2978 , "GREATER-THAN ABOVE RIGHTWARDS ARROW"],
			[ 0x2979 , "SUBSET ABOVE RIGHTWARDS ARROW"],
			[ 0x297A , "LEFTWARDS ARROW THROUGH SUBSET"],
			[ 0x297B , "SUPERSET ABOVE LEFTWARDS ARROW"],
			
			[ 0 , "Modified Harpoons"],
			[ 0x294A , "LEFT BARB UP RIGHT BARB DOWN HARPOON"],
			[ 0x294B , "LEFT BARB DOWN RIGHT BARB UP HARPOON"],
			[ 0x294C , "UP BARB RIGHT DOWN BARB LEFT HARPOON"],
			[ 0x294D , "UP BARB LEFT DOWN BARB RIGHT HARPOON"],
			[ 0x294E , "LEFT BARB UP RIGHT BARB UP HARPOON"],
			[ 0x294F , "UP BARB RIGHT DOWN BARB RIGHT HARPOON"],
			
			[ 0x2950 , "LEFT BARB DOWN RIGHT BARB DOWN HARPOON"],
			[ 0x2951 , "UP BARB LEFT DOWN BARB LEFT HARPOON"],
			[ 0x2952 , "LEFTWARDS HARPOON WITH BARB UP TO BAR"],
			[ 0x2953 , "RIGHTWARDS HARPOON WITH BARB UP TO BAR"],
			[ 0x2954 , "UPWARDS HARPOON WITH BARB RIGHT TO BAR"],
			[ 0x2955 , "DOWNWARDS HARPOON WITH BARB RIGHT TO BAR"],
			[ 0x2956 , "LEFTWARDS HARPOON WITH BARB DOWN TO BAR"],
			[ 0x2957 , "RIGHTWARDS HARPOON WITH BARB DOWN TO BAR"],
			[ 0x2958 , "UPWARDS HARPOON WITH BARB LEFT TO BAR"],
			[ 0x2959 , "DOWNWARDS HARPOON WITH BARB LEFT TO BAR"],
			[ 0x295A , "LEFTWARDS HARPOON WITH BARB UP FROM BAR"],
			[ 0x295B , "RIGHTWARDS HARPOON WITH BARB UP FROM BAR"],
			[ 0x295C , "UPWARDS HARPOON WITH BARB RIGHT FROM BAR"],
			[ 0x295D , "DOWNWARDS HARPOON WITH BARB RIGHT FROM BAR"],
			[ 0x295E , "LEFTWARDS HARPOON WITH BARB DOWN FROM BAR"],
			[ 0x295F , "RIGHTWARDS HARPOON WITH BARB DOWN FROM BAR"],
			
			[ 0x2960 , "UPWARDS HARPOON WITH BARB LEFT FROM BAR"],
			[ 0x2961 , "DOWNWARDS HARPOON WITH BARB LEFT FROM BAR"],
			
			[ 0x2962 , "LEFTWARDS HARPOON WITH BARB UP ABOVE LEFTWARDS HARPOON WITH BARB DOWN"],
			[ 0x2963 , "UPWARDS HARPOON WITH BARB LEFT BESIDE UPWARDS HARPOON WITH BARB RIGHT"],
			[ 0x2964 , "RIGHTWARDS HARPOON WITH BARB UP ABOVE RIGHTWARDS HARPOON WITH BARB DOWN"],
			[ 0x2965 , "DOWNWARDS HARPOON WITH BARB LEFT BESIDE DOWNWARDS HARPOON WITH BARB RIGHT"],
			[ 0x2966 , "LEFTWARDS HARPOON WITH BARB UP ABOVE RIGHTWARDS HARPOON WITH BARB UP"],
			[ 0x2967 , "LEFTWARDS HARPOON WITH BARB DOWN ABOVE RIGHTWARDS HARPOON WITH BARB DOWN"],
			[ 0x2968 , "RIGHTWARDS HARPOON WITH BARB UP ABOVE LEFTWARDS HARPOON WITH BARB UP"],
			[ 0x2969 , "RIGHTWARDS HARPOON WITH BARB DOWN ABOVE LEFTWARDS HARPOON WITH BARB DOWN"],
			[ 0x296A , "LEFTWARDS HARPOON WITH BARB UP ABOVE LONG DASH"],
			[ 0x296B , "LEFTWARDS HARPOON WITH BARB DOWN BELOW LONG DASH"],
			[ 0x296C , "RIGHTWARDS HARPOON WITH BARB UP ABOVE LONG DASH"],
			[ 0x296D , "RIGHTWARDS HARPOON WITH BARB DOWN BELOW LONG DASH"],
			[ 0x296E , "UPWARDS HARPOON WITH BARB LEFT DOWNWARDS UPWARDS HARPOON WITH BARB RIGHT"],
			[ 0x296F , "DOWNWARDS HARPOON WITH BARB LEFT BESIDE UPWARDS HARPOON WITH BARB RIGHT"],
			
			[ 0 , "Arrow Tails"],
			[ 0x2919 , "LEFTWARDS ARROW-TAIL"],
			[ 0x291A , "RIGHTWARDS ARROW-TAIL"],
			[ 0x291B , "LEFTWARDS DOUBLE ARROW-TAIL"],
			[ 0x291C , "RIGHTWARDS DOUBLE ARROW-TAIL"],
			
			[ 0x297C , "LEFT FISH TAIL"],
			[ 0x297D , "RIGHT FISH TAIL"],
			[ 0x297E , "UP FISH TAIL"],
			[ 0x297F , "DOWN FISH TAIL"],
			
			
			[ 0 , "Dingbat Arrows"],
			[ 0x2794 , "HEAVY WIDE-HEADED RIGHTWARDS ARROW"],
			[ 0x2798 , "HEAVY SOUTH EAST ARROW"],
			[ 0x2799 , "HEAVY RIGHTWARDS ARROW"],
			[ 0x279A , "HEAVY NORTH EAST ARROW"],
			[ 0x279B , "DRAFTING POINT RIGHTWARDS ARROW"],
			[ 0x279C , "HEAVY ROUND-TIPPED RIGHTWARDS ARROW"],
			[ 0x279D , "TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279E , "HEAVY TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279F , "DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			
			[ 0x27A0 , "HEAVY DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x27A2 , "THREE-D TOP-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A3 , "THREE-D BOTTOM-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A4 , "BLACK RIGHTWARDS ARROWHEAD"],
			[ 0x27A5 , "HEAVY BLACK CURVED DOWNAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A6 , "HEAVY BLACK CURVED UPAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A7 , "SQUAT BLACK RIGHTWARDS ARROW"],
			[ 0x27A8 , "HEAVY CONCAVE-POIINTED BLACK RIGHTWARDS ARROW"],
			[ 0x27A9 , "RIGHT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AA , "LEFT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AB , "BLACK-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AC , "FRONT-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AD , "HEAVY LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AE , "HEAVY UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AF , "NOTCHED LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			
			[ 0x27B1 , "NOTCHED UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27B2 , "CIRCLED HEAVY WHITE RIGHTWARDS ARROW"],
			[ 0x27B3 , "WHITE-FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B4 , "BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B5 , "BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B6 , "BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27B7 , "HEAVY BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B8 , "HEAVY BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B9 , "HEAVY BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27BA , "TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BB , "HEAVY TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BC , "WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BD , "HEAVY WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BE , "OPEN-OUTLINED RIGHTWARDS ARROW"],
			
			[ 0 , "Long Arrows", true],
			[ 0x27F5 , "LONG LEFTWARDS ARROW"],
			[ 0x27F6 , "LONG RIGHTWARDS ARROW"],
			[ 0x27F7 , "LONG LEFT RIGHT ARROW"],
			[ 0x27F8 , "LONG LEFTWARDS DOUBLE ARROW"],
			[ 0x27F9 , "LONG RIGHTWARDS DOUBLE ARROW"],
			[ 0x27FA , "LONG LEFT RIGHT DOUBLE ARROW"],
			[ 0 , ""],
			[ 0x27FB , "LONG LEFTWARDS ARROW FROM BAR"],
			[ 0x27FC , "LONG RIGHTWARDS ARROW FROM BAR"],
			[ 0x27FD , "LONG LEFTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x27FE , "LONG RIGHTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x2B33 , "LONG LEFTWARDS SQUIGGLE ARROW"],
			[ 0x27FF , "LONG RIGHTWARDS SQUIGGLE ARROW"],

		);


		Smiley.alltabs.Alchemy = new Array(
			[ 0x1f709 , "Alchemical Symbols"],
			
			[ 0 , "Aristotelian Elements"],
			[ 0x1f700 , "ALCHEMICAL SYMBOL FOR QUINTESSENCE"],
			[ 0x1f701 , "ALCHEMICAL SYMBOL FOR AIR"],
			[ 0x1f702 , "ALCHEMICAL SYMBOL FOR FIRE"],
			[ 0x1f703 , "ALCHEMICAL SYMBOL FOR EARTH"],
			[ 0x1f704 , "ALCHEMICAL SYMBOL FOR WATER"],
			[ 0x1f70D , "ALCHEMICAL SYMBOL FOR SULFUR"],
			
			[ 0 , "Solvents"],
			[ 0x1f705 , "ALCHEMICAL SYMBOL FOR AQUAFORTIS"],
			[ 0x1f706 , "ALCHEMICAL SYMBOL FOR AQUA REGIA"],
			[ 0x1f707 , "ALCHEMICAL SYMBOL FOR AQUA REGIA-2"],
			[ 0x1f708 , "ALCHEMICAL SYMBOL FOR AQUA VITE"],
			[ 0x1f709 , "ALCHEMICAL SYMBOL FOR AQUA VITE-2"],
			[ 0x1f70A , "ALCHEMICAL SYMBOL FOR VINEGAR"],
			[ 0x1f70B , "ALCHEMICAL SYMBOL FOR VINEGAR-2"],
			[ 0x1f70C , "ALCHEMICAL SYMBOL FOR VINEGAR-3"],
			
			[ 0 , "Substances"],
			[ 0x1f70E , "ALCHEMICAL SYMBOL FOR PHILOSPHERS"],
			[ 0x1f70F , "ALCHEMICAL SYMBOL FOR BLACK SULFUR"],
			
			[ 0x1f710 , "ALCHEMICAL SYMBOL FOR MERCURY SUBLIMATE"],
			[ 0x1f711 , "ALCHEMICAL SYMBOL FOR MERCURY SUBLIMATE-2"],
			[ 0x1f712 , "ALCHEMICAL SYMBOL FOR MERCURY SUBLIMATE-3"],
			[ 0x1f713 , "ALCHEMICAL SYMBOL FOR CINNABAR"],
			[ 0x1f714 , "ALCHEMICAL SYMBOL FOR SALT"],
			[ 0x1f715 , "ALCHEMICAL SYMBOL FOR NITRATE"],
			[ 0x1f716 , "ALCHEMICAL SYMBOL FOR VITRIOL"],
			[ 0x1f717 , "ALCHEMICAL SYMBOL FOR VITRIOL-2"],
			[ 0x1f718 , "ALCHEMICAL SYMBOL FOR ROCK SALT"],
			[ 0x1f719 , "ALCHEMICAL SYMBOL FOR ROCK SALT-2"],
			[ 0x1f71A , "ALCHEMICAL SYMBOL FOR GOLD"],
			[ 0x1f71B , "ALCHEMICAL SYMBOL FOR SILVER"],
			[ 0x1f71C , "ALCHEMICAL SYMBOL FOR IRON ORE"],
			[ 0x1f71D , "ALCHEMICAL SYMBOL FOR IRON ORE-2"],
			[ 0x1f71E , "ALCHEMICAL SYMBOL FOR CROCUS OF IRON"],
			[ 0x1f71F , "ALCHEMICAL SYMBOL FOR REGULUS OF IRON"],
			
			[ 0x1f720 , "ALCHEMICAL SYMBOL FOR COPPER ORE"],
			[ 0x1f721 , "ALCHEMICAL SYMBOL FOR IRON-COPPER ORE"],
			[ 0x1f722 , "ALCHEMICAL SYMBOL FOR SUBLIMATE OF COPPER"],
			[ 0x1f723 , "ALCHEMICAL SYMBOL FOR CROCUS OF COPPER"],
			[ 0x1f724 , "ALCHEMICAL SYMBOL FOR CROCUS OF COPPER-2"],
			[ 0x1f725 , "ALCHEMICAL SYMBOL FOR COPPER ANTIMONIATE"],
			[ 0x1f726 , "ALCHEMICAL SYMBOL FOR SALT OF COPPER ANTIMONIATE"],
			[ 0x1f727 , "ALCHEMICAL SYMBOL FOR SUBLIMATE OF SALT OF COPPER"],
			[ 0x1f728 , "ALCHEMICAL SYMBOL FOR VERDIGRIS"],
			[ 0x1f729 , "ALCHEMICAL SYMBOL FOR TIN ORE"],
			[ 0x1f72A , "ALCHEMICAL SYMBOL FOR LEaD ORE"],
			[ 0x1f72B , "ALCHEMICAL SYMBOL FOR ANTIMONY ORE"],
			[ 0x1f72C , "ALCHEMICAL SYMBOL FOR SUBLIMATE OF ANTIMONY"],
			[ 0x1f72D , "ALCHEMICAL SYMBOL FOR SALT OF ANTIMONY"],
			[ 0x1f72E , "ALCHEMICAL SYMBOL FOR SUBLIMATE OF SALT OF ANTIMONY"],
			[ 0x1f72F , "ALCHEMICAL SYMBOL FOR VINEGAR OF ANTIMONY"],
			
			[ 0x1f730 , "ALCHEMICAL SYMBOL FOR REGULUS OF ANTIMONY"],
			[ 0x1f731 , "ALCHEMICAL SYMBOL FOR REGULUS OF ANTIMONY-2"],
			[ 0x1f732 , "ALCHEMICAL SYMBOL FOR REGULUS"],
			[ 0x1f733 , "ALCHEMICAL SYMBOL FOR REGULUS-2"],
			[ 0x1f734 , "ALCHEMICAL SYMBOL FOR REGULUS-3"],
			[ 0x1f735 , "ALCHEMICAL SYMBOL FOR REGULUS-4"],
			[ 0x1f736 , "ALCHEMICAL SYMBOL FOR ALKALI"],
			[ 0x1f737 , "ALCHEMICAL SYMBOL FOR ALKALI-2"],
			[ 0x1f738 , "ALCHEMICAL SYMBOL FOR MARCASITE"],
			[ 0x1f739 , "ALCHEMICAL SYMBOL FOR SAL-AMMONIAC"],
			[ 0x1f73A , "ALCHEMICAL SYMBOL FOR ARSENIC"],
			[ 0x1f73B , "ALCHEMICAL SYMBOL FOR REALGAR"],
			[ 0x1f73C , "ALCHEMICAL SYMBOL FOR REALGAR-2"],
			[ 0x1f73D , "ALCHEMICAL SYMBOL FOR AURIPIGMENT"],
			[ 0x1f73E , "ALCHEMICAL SYMBOL FOR BISMUTH ORE"],
			[ 0x1f73F , "ALCHEMICAL SYMBOL FOR TARTAR"],
			
			[ 0x1f740 , "ALCHEMICAL SYMBOL FOR TARTAR-2"],
			[ 0x1f741 , "ALCHEMICAL SYMBOL FOR QUICK LIME"],
			[ 0x1f742 , "ALCHEMICAL SYMBOL FOR BORAX"],
			[ 0x1f743 , "ALCHEMICAL SYMBOL FOR BORAX-2"],
			[ 0x1f744 , "ALCHEMICAL SYMBOL FOR BORAX-3"],
			[ 0x1f745 , "ALCHEMICAL SYMBOL FOR ALUM"],
			[ 0x1f746 , "ALCHEMICAL SYMBOL FOR OIL"],
			[ 0x1f747 , "ALCHEMICAL SYMBOL FOR SPIRIT"],
			[ 0x1f748 , "ALCHEMICAL SYMBOL FOR TINCTURE"],
			[ 0x1f749 , "ALCHEMICAL SYMBOL FOR GUM"],
			[ 0x1f74A , "ALCHEMICAL SYMBOL FOR WAX"],
			[ 0x1f74B , "ALCHEMICAL SYMBOL FOR POWDER"],
			[ 0x1f74C , "ALCHEMICAL SYMBOL FOR CALX"],
			[ 0x1f74D , "ALCHEMICAL SYMBOL FOR TUTTY"],
			[ 0x1f74E , "ALCHEMICAL SYMBOL FOR CAOUT MORTUUM"],
			[ 0x1f74F , "ALCHEMICAL SYMBOL FOR SCEPTER OF JOVE"],
			
			[ 0x1f750 , "ALCHEMICAL SYMBOL FOR CADUCEUS"],
			[ 0x1f751 , "ALCHEMICAL SYMBOL FOR TRIDENT"],
			[ 0x1f752 , "ALCHEMICAL SYMBOL FOR STARRED TRIDENT"],
			[ 0x1f753 , "ALCHEMICAL SYMBOL FOR LODESTONE"],
			[ 0x1f754 , "ALCHEMICAL SYMBOL FOR SOAP"],
			[ 0x1f755 , "ALCHEMICAL SYMBOL FOR URINE"],
			[ 0x1f756 , "ALCHEMICAL SYMBOL FOR HOSRE DUNG"],
			[ 0x1f757 , "ALCHEMICAL SYMBOL FOR ASHES"],
			[ 0x1f758 , "ALCHEMICAL SYMBOL FOR POT ASHES"],
			[ 0x1f759 , "ALCHEMICAL SYMBOL FOR BRICK"],
			[ 0x1f75A , "ALCHEMICAL SYMBOL FOR POWDERED BRICK"],
			[ 0x1f75B , "ALCHEMICAL SYMBOL FOR AMALGAM"],
			[ 0x1f75C , "ALCHEMICAL SYMBOL FOR STRATUM SUPER STRATUM"],
			[ 0x1f75D , "ALCHEMICAL SYMBOL FOR STRATUM SUPER STRATUM-2"],
			
			[ 0 , "Processes"],
			[ 0x1f75E , "ALCHEMICAL SYMBOL FOR SUBLIMATION"],
			[ 0x1f75F , "ALCHEMICAL SYMBOL FOR PRECIPITATE"],
			
			[ 0x1f760 , "ALCHEMICAL SYMBOL FOR DISTILL"],
			[ 0x1f761 , "ALCHEMICAL SYMBOL FOR DISOLVE"],
			[ 0x1f762 , "ALCHEMICAL SYMBOL FOR DISOLVE-2"],
			[ 0x1f763 , "ALCHEMICAL SYMBOL FOR PURIVY"],
			[ 0x1f764 , "ALCHEMICAL SYMBOL FOR PURIFACTION"],
			
			[ 0 , "Apparatus"],
			[ 0x1f765 , "ALCHEMICAL SYMBOL FOR CRUCIBLE"],
			[ 0x1f766 , "ALCHEMICAL SYMBOL FOR CRUCIBLE-2"],
			[ 0x1f767 , "ALCHEMICAL SYMBOL FOR CRUCIBLE-3"],
			[ 0x1f768 , "ALCHEMICAL SYMBOL FOR CRUCIBLE-4"],
			[ 0x1f769 , "ALCHEMICAL SYMBOL FOR CRUCIBLE-5"],
			[ 0x1f76A , "ALCHEMICAL SYMBOL FOR ALEMBIC"],
			[ 0x1f76B , "ALCHEMICAL SYMBOL FOR BATH OF MARY"],
			[ 0x1f76C , "ALCHEMICAL SYMBOL FOR BATH OF VAPOURS"],
			[ 0x1f76D , "ALCHEMICAL SYMBOL FOR RETORT"],
			
			[ 0 , "Time"],
			[ 0x1f76E , "ALCHEMICAL SYMBOL FOR HOUR"],
			[ 0x1f76F , "ALCHEMICAL SYMBOL FOR NIGHT"],
			
			[ 0x1f770 , "ALCHEMICAL SYMBOL FOR DAY-NIGHT"],
			[ 0x1f771 , "ALCHEMICAL SYMBOL FOR MONTH"],
			
			[ 0 , "Measures"],
			[ 0x1f772 , "ALCHEMICAL SYMBOL FOR HALF DRAM"],
			[ 0x1f773 , "ALCHEMICAL SYMBOL FOR HALF OUNCE"],
			
		);


		Smiley.alltabs.Braille = new Array();
		Smiley.alltabs.Braille[0] = new Array( 0x28ff , "Braille");
		Smiley.alltabs.Braille[1] = new Array( 0x2800 , "BRAILLE PATTERN BLANK");
		for(i=1;i<256;i++){

			var str = "BRAILLE PATTERN DOTS-";
			var nums="";
			var val = i;
			for(j=1;j<9&val>0;j++){
				if((val&1)>0){
					nums+=""+j;
				}
				val=val>>1;
			}
			str+=nums;

			Smiley.alltabs.Braille[i+1] = new Array( 0x2800+i , str);
		};


		Smiley.alltabs.Egyptian = new Array();
		Smiley.alltabs.Egyptian[0] = new Array( 0x1313f , "Egyptian Hieroglyphics", "smileyheiro"); //1307b - eye  1313f - bird
		for(i=0;i<0x42f;i++){
			// NOTE: not the correct names - not that the Unicode names are really much better
			//Would be very nice to have the name be a somewhat correct translation.
			var str = "EGYPTIAN HIEROGLYPH "+(i+1);
			Smiley.alltabs.Egyptian[i+1] = new Array( 0x13000+i , str);
		}
				
		//Android
		Smiley.alltabs.AND_Smileys = new Array(
			[ 0x1F600 , "Smileys and Emotions"],
				
			[ 0x1F600 , "GRINNING FACE"],
			[ 0x1F603 , "SMILING FACE WITH OPEN MOUTH"],
			[ 0x1F604 , "SMILING FACE WITH OPEN MOUTH AND SMILING EYES"],
			[ 0x1F601 , "GRINNING FACE WITH SMILING EYES"],
			[ 0x1F606 , "SMILING FACE WITH OPEN MOUTH AND TIGHTLY-CLOSED EYES"],
			[ 0x1F605 , "SMILING FACE WITH OPEN MOUTH AND COLD SWEAT"],
			[ 0x1F602 , "FACE WITH TEARS OF JOY"],
			[ 0x1F923 , "ROLLING ON THE FLOOR LAUGHING"],
			[ 0x1F62D , "LOUDLY CRYING FACE"],
			
			[ 0x1F929 , "GRINNING FACE WITH STAR EYES"],
			[ 0x1F970 , "SMILING FACE WITH SMILING EYES AND THREE HEARTS"],
			[ 0x1F60D , "SMILING FACE WITH HEART-SHAPED EYES"],
			[ 0x1F618 , "FACE THROWING A KISS"],
			[ 0x1F617 , "KISSING FACE"],
			[ 0x1F61A , "KISSING FACE WITH CLOSED EYES"],
			[ 0x1F619 , "KISSING FACE WITH SMILING EYES"],
			[ [0x263A,0xFE0F] ,  "SMILING FACE" ],
			[ 0x1F60A , "SMILING FACE WITH SMILING EYES"],
			
			[ 0x1F917 , "HUGGING FACE"],
			[ 0x1F642 , "SLIGHTLY SMILING FACE"],
			[ 0x1F643 , "UPSIDE-DOWN FACE"],
			[ 0x1F609 , "WINKING FACE"],
			[ 0x1F60B , "FACE SAVOURING DELICIOUS FOOD"],
			[ 0x1F61B , "FACE WITH STUCK-OUT TONGUE"],
			[ 0x1F61D , "FACE WITH STUCK-OUT TONGUE AND TIGHTLY-CLOSED EYES"],
			[ 0x1F61C , "FACE WITH STUCK-OUT TONGUE AND WINKING EYE"],
			[ 0x1F92A , "GRINNING FACE WITH ONE LARGE AND ONE SMALL EYE"],
			
			[ 0x1F914 , "THINKING FACE"],
			[ 0x1F928 , "FACE WITH ONE EYEBROW RAISED"],
			[ 0x1F9D0 , "FACE WITH MONOCLE"],
			[ 0x1F644 , "FACE WITH ROLLING EYES"],
			[ 0x1F60F , "SMIRKING FACE"],
			[ 0x1F612 , "UNAMUSED FACE"],
			[ 0x1F623 , "PERSEVERING FACE"],
			[ 0x1F614 , "PENSIVE FACE"],
			[ 0x1F60C , "RELIEVED FACE"],
			

			[ 0x2639 ,  "FROWNING FACE"],
			[ 0x1F641 , "SLIGHTLY FROWNING FACE"],
			[ 0x1F615 , "CONFUSED FACE"],
			[ 0x1F61F , "WORRIED FACE"],
			[ 0x1F97A , "PLEADING FACE"],
			[ 0x1F62C , "GRIMACING FACE"],
			[ 0x1F910 , "ZIPPER-MOUTH FACE"],
			[ 0x1F92B , "FACE WITH FINGER COVERING CLOSED LIPS"],
			[ 0x1F92D , "SMILING FACE WITH SMILING EYES AND HAND COVERING MOUTH"],
			
			
			[ 0x1F630 , "FACE WITH OPEN MOUTH AND COLD SWEAT"],
			[ 0x1F628 , "FEARFUL FACE"],
			[ 0x1F632 , "ASTONISHED FACE"],
			[ 0x1F627 , "ANGUISHED FACE"],
			[ 0x1F626 , "FROWNING FACE WITH OPEN MOUTH"],
			[ 0x1F62F , "HUSHED FACE"],
			[ 0x1F62E , "FACE WITH OPEN MOUTH"],
			[ 0x1F633 , "FLUSHED FACE"],
			[ 0x1F92F , "SHOCKED FACE WITH EXPLODING HEAD"],
			
			[ 0x1F622 , "CRYING FACE"],
			[ 0x1F625 , "DISAPPOINTED BUT RELIEVED FACE"],
			[ 0x1F613 , "FACE WITH COLD SWEAT"],
			[ 0x1F61E , "DISAPPOINTED FACE"],
			[ 0x1F616 , "CONFOUNDED FACE"],
			[ 0x1F629 , "WEARY FACE"],
			[ 0x1F62B , "TIRED FACE"],
			[ 0x1F635 , "DIZZY FACE"],
			[ 0x1F631 , "FACE SCREAMING IN FEAR"],
			
			
			[ 0x1F922 , "NAUSEATED FACE"],
			[ 0x1F92E , "FACE WITH OPEN MOUTH VOMITING"],
			[ 0x1F927 , "SNEEZING FACE"],
			[ 0x1F637 , "FACE WITH MEDICAL MASK"],
			[ 0x1F974 , "FACE WITH UNEVEN EYES AND WAVY MOUTH"],
			[ 0x1F912 , "FACE WITH THERMOMETER"],
			[ 0x1F915 , "FACE WITH HEAD-BANDAGE"],
			[ 0x1F975 , "OVERHEATED FACE"],
			[ 0x1F976 , "FREEZING FACE"],
			
			
			[ 0x1F636 , "FACE WITHOUT MOUTH"],
			[ 0x1F610 , "NEUTRAL FACE"],
			[ 0x1F611 , "EXPRESSIONLESS FACE"],
			[ 0x1F624 , "FACE WITH LOOK OF TRIUMPH"],
			[ 0x1F620 , "ANGRY FACE"],
			[ 0x1F621 , "POUTING FACE"],
			[ 0x1F92C , "SERIOUS FACE WITH SYMBOLS COVERING MOUTH"],
			[ 0x1F608 , "SMILING FACE WITH HORNS"],
			[ 0x1F47F , "IMP"],
			
			
			[ 0x1F924 , "DROOLING FACE"],
			[ 0x1F62A , "SLEEPY FACE"],
			[ 0x1F634 , "SLEEPING FACE"],
			[ 0x1F31E , "SUN WITH FACE"],
			[ 0x1F31B , "FIRST QUARTER MOON WITH FACE"],
			[ 0x1F31C , "LAST QUARTER MOON WITH FACE"],
			[ 0x1F31D , "FULL MOON WITH FACE"],
			[ 0x1F31A , "NEW MOON WITH FACE"],
			[ 0x1F47D , "EXTRATERRESTRIAL ALIEN"],
			
			
			[ 0x1F4A9 , "PILE OF POO"],
			[ 0x1F607 , "SMILING FACE WITH HALO"],
			[ 0x1F920 , "FACE WITH COWBOY HAT"],
			[ 0x1F921 , "CLOWN FACE"],
			[ 0x1F911 , "MONEY-MOUTH FACE"],
			[ 0x1F973 , "FACE WITH PARTY HORN AND PARTY HAT"],
			[ 0x1F60E , "SMILING FACE WITH SUNGLASSES"],
			[ 0x1F913 , "NERD FACE"],
			[ 0x1F925 , "LYING FACE"],
			
			
			[ 0 , "Cat faces" ],
			[ 0x1F431 , "Cat Face"],
			[ 0x1F63A , "SMILING CAT FACE WITH OPEN MOUTH"],
			[ 0x1F638 , "GRINNING CAT FACE WITH SMILING EYES"],
			[ 0x1F639 , "CAT FACE WITH TEARS OF JOY"],
			[ 0x1F63B , "SMILING CAT FACE WITH HEART-SHAPED EYES"],
			[ 0x1F63C , "CAT FACE WITH WRY SMILE"],
			[ 0x1F63D , "KISSING CAT FACE WITH CLOSED EYES"],
			[ 0x1F640 , "WEARY CAT FACE"],
			[ 0x1F63F , "CRYING CAT FACE"],
			[ 0x1F63E , "POUTING CAT FACE"],
			
			
			[ 0 , "Other Faces" ],
			[ 0x1F648 , "SEE-NO-EVIL MONKEY"],
			[ 0x1F649 , "HEAR-NO-EVIL MONKEY"],
			[ 0x1F64A , "SPEAK-NO-EVIL MONKEY"],
			[ 0x1F916 , "ROBOT FACE"],
			[ 0x1F47B , "GHOST"],
			[ 0x1F480 , "SKULL"],
			[ [0x2620,0xFE0F] , "SKULL AND CROSSBONES"],
			[ 0x1F479 , "JAPANESE OGRE"],
			[ 0x1F47A , "JAPANESE GOBLIN"],
			
			
			
			
			
			
			[ 0 , "Romance" ],
			[ 0x1F48B , "KISS MARK"],
			[ 0x1F498 , "HEART WITH ARROW"],
			[ 0x1F49D , "HEART WITH RIBBON"],
			[ 0x1F496 , "SPARKLING HEART"],
			[ 0x1F497 , "GROWING HEART"],
			[ 0x1F493 , "BEATING HEART"],
			[ 0x1F49E , "REVOLVING HEARTS"],
			[ 0x1F495 , "TWO HEARTS"],
			[ 0x1F48C , "LOVE LETTER"],
			[ 0x1F49F , "HEART DECORATION"],
			[ [0x2763,0xFE0F] , "HEAVY HEART EXCLAMATION MARK ORNAMENT"],
			[ 0x1F494 , "BROKEN HEART"],
			[ [0x2764,0xFE0F] , "RED HEART"],
			[ 0x1F9E1 , "ORANGE HEART"],
			[ 0x1F49B , "YELLOW HEART"],
			[ 0x1F49A , "GREEN HEART"],
			[ 0x1F49C , "PURPLE HEART"],
			[ 0x1F5A4 , "BLACK HEART"],
//			[ 0x1F90D , "WHITE HEART"],
//			[ 0x1F90E , "BROWN HEART"],
			[ [0x2767,0xFE0F] , "ROTATED FLORAL HEART BULLET"],
			
			
			[ 0 , "Comic Symbols"],	

			[ 0x1F4AF , "HUNDRED POINTS SYMBOL"],	
			[ 0x1F4A2 , "ANGER SYMBOL"],
			[ 0x1F4A3 , "BOMB"],
			[ 0x1F4A5 , "COLLISION SYMBOL"],
			[ 0x1F4A6 , "SPLASHING SWEAT SYMBOL"],
			[ 0x1F4A8 , "DASH SYMBOL"],
			[ 0x1F4AB , "DIZZY SYMBOL"],
			[ [0x2728,0xFE0F] , "SPARKLES"],
			[ 0x1F573 , "HOLE"],
			[ 0x1F4AD , "THOUGHT BALLOON"],
			[ 0x1F5EF , "RIGHT ANGER BUBBLE"],
			[ 0x1F4AC , "SPEECH BALLOON"],
			[ 0x1F5E8 , "LEFT SPEECH BUBBLE"],
			[ 0x1F4A4 , "SLEEPING SYMBOL"],
			
			
			[ 0 , "Body Parts"],
			
			[ -1 , "Skin Tone:"],
			
			[ 0x1F9E0 , "BRAIN"],
			[ 0x1F440 , "EYES"],
			[ 0x1F441 , "EYE"],
			[ 0x1F445 , "TONGUE"],
			[ 0x1F444 , "MOUTH"],
			[ 0x1F9B7 , "TOOTH"],
			[ 0x1F9B4 , "BONE"],
			
			[ 0x1F9B5 , "LEG"],
			[ 0x1F9B6 , "FOOT"],
			[ 0x1F442 , "EAR"],
			[ 0x1F443 , "NOSE"],
			[ 0x1F590 , "RAISED HAND WITH FINGERS SPLAYED"],
			[ [0x270B,0xFE0F] , "RAISED HAND"],
			[ 0x1F91A , "BACK OF HAND"],
			[ 0x1F44B , "WAVING HAND SIGN"],
			[ 0x1F64C , "PERSON RAISING BOTH HANDS IN CELEBRATION"],
			[ 0x1F450 , "OPEN HANDS SIGN"],
			[ 0x1F932 , "PALMS TOGETHER FACING UP"],
			[ 0x1F44F , "CLAPPING HANDS SIGN"],
			[ 0x1F44D , "THUMBS UP SIGN"],
			[ 0x1F44E , "THUMBS DOWN SIGN"],
			
			[ 0x1F44C , "OK HAND SIGN"],
			[ [0x270C,0xFE0F] , "VICTORY HAND"],
			[ 0x1F918 , "SIGN OF THE HORNS"],
			[ 0x1F91F , "I LOVE YOU HAND SIGN"],
			[ 0x1F919 , "CALL ME HAND SIGN"],
			[ 0x1F91E , "HAND WITH INDEX AND MIDDLE FINGERS CROSSED"],
			[ 0x1F595 , "REVERSED HAND WITH MIDDLE FINGER EXTENDED"],
			[ 0x1F596 , "RAISED HAND WITH PART BETWEEN MIDDLE AND RING FINGERS"],
			[ [0x261D,0xFE0F] , "WHITE UP POINTING INDEX"],
			[ 0x1F446 , "WHITE UP POINTING BACKHAND INDEX"],
			[ 0x1F447 , "WHITE DOWN POINTING BACKHAND INDEX"],
			[ 0x1F449 , "WHITE RIGHT POINTING BACKHAND INDEX"],
			[ 0x1F448 , "WHITE LEFT POINTING BACKHAND INDEX"],
			[ [0x270A,0xFE0F] , "RAISED FIST"],
			[ 0x1F44A , "FISTED HAND SIGN"],
			[ 0x1F91C , "RIGHT-FACING FIST"],
			[ 0x1F91B , "LEFT-FACING FIST"],
			[ 0x1F91D , "HANDSHAKE"],
			
			[ 0x1F4AA , "FLEXED BICEP"],
			[ [0x270D,0xFE0F] , "WRITING HAND"],
			[ 0x1F933 , "SELFIE"],
			[ 0x1F64F , "PERSON WITH FOLDED HANDS"],
			[ 0x1F485 , "NAIL POLISH"],
			
			
			
			[ 0 , "Face-like Characters" ],
			[ 0x2322 , "FROWN"],
			[ 0x2323 , "SMILE"],
			[ 0x2361 , "APL FUNCTIONAL SYMBOL UP TACK DIAERESIS"],
			[ 0x2362 , "APL FUNCTIONAL SYMBOL DEL DIAERESIS"],
			[ 0x2363 , "APL FUNCTIONAL SYMBOL STAR DIAERESIS"],
			[ 0x2364 , "APL FUNCTIONAL SYMBOL JOT DIAERESIS"],
			[ 0x2365 , "APL FUNCTIONAL SYMBOL CIRCLE DIAERESIS"],
			[ 0x2368 , "APL FUNCTIONAL SYMBOL TILDE DIAERESIS"],
			[ 0x2369 , "APL FUNCTIONAL SYMBOL GREATER_THAN DIAERESIS"],
			
			
			[ 0 , "Ninja Cat (Windows Only)" ],
			[ [0x1F431,0x200D,0x1F464] , "Ninja Cat"],
			[ [0x1F431,0x200D,0x1F3CD] , "Superhero Ninja Cat"], // not working on Chrome? 
			[ [0x1F431,0x200D,0x1F4BB] , "Ninja Cat Laptop"],
			[ [0x1F431,0x200D,0x1F409] , "Ninja Cat T-Rex"],
			[ [0x1F431,0x200D,0x1F453] , "Hipster Ninja Cat"],
			[ [0x1F431,0x200D,0x1F680] , "Space Ninja Cat"],
			
		);



		Smiley.alltabs.AND_People = new Array(
			[ 0x1F6B6 , "People"],

			[ -1 , "Skin Tone:"],
			//[ -2 , "Hair Type:"],
			[ -3 , "Gender:"],
				
			[ 0x1F647 , "PERSON BOWING DEEPLY"],
			[ 0x1F64B , "HAPPY PERSON RAISING ONE HAND"],
			[ 0x1F481 , "INFORMATION DESK PERSON"],
			[ 0x1F646 , "FACE WITH OK GESTURE"],
			[ 0x1F645 , "FACE WITH NO GOOD GESTURE"],
			[ 0x1F937 , "SHRUG"],
			[ 0x1F926 , "FACE PALM"],
			[ 0x1F64D , "PERSON FROWNING"],
			[ 0x1F64E , "PERSON WITH POUTING FACE"],
			[ 0x1F486 , "FACE MASSAGE"],
			[ 0x1F487 , "HAIRCUT"],
			[ 0x1F9D6 , "Person in Steamy Room"],
			
			
			
			[ 0x1F6C0 , "Person Taking Bath"],
			[ 0x1F6CC , "Person in Bed"],
			[ 0x1F9D8 , "Person in Lotus Position"],
			[ 0x1F6B6 , "Person Walking"],
			[ 0x1F3C3 , "Person Running"],
			[ 0x1F938 , "Person Cartwheeling"],
			[ [0x26F9,0xFE0F] , "Person Bouncing Ball"],
			[ 0x1F93E , "Person Playing Handball"],
			[ 0x1F6B4 , "Person Biking"],
			[ 0x1F6B5 , "Person Mountain Biking"],
			[ 0x1F9D7 , "Person Climbing"],
			[ 0x1F3CB , "Person Lifting Weights"],
			[ 0x1F93C , "People Wrestling"],
			[ 0x1F3CC , "Person Golfing"],
			[ 0x1F3C7 , "Horse Racing"],
			[ 0x1F93A , "Person Fencing"],
			
			[ [0x26F7,0xFE0F] , "Skier"],
			[ 0x1F3C2 , "Snowboarder"],
			[ 0x1F3C4 , "Person Surfing"],
			[ 0x1F6A3 , "Person Rowing Boat"],
			[ 0x1F3CA , "Person Swimming"],
			[ 0x1F93D , "Person Playing Water Polo"],
			[ 0x1F9DC , "Merperson"],
			[ 0x1F9DA , "Fairy"],
			[ 0x1F47C , "Baby Angel"],
			[ 0x1F385 , "Santa Claus"],
			[ 0x1F936 , "Mrs. Claus"],
			[ 0x1F9D9 , "Mage"],
			[ 0x1F9DD , "Elf"],
			[ 0x1F9DE , "Genie"],
			[ 0x1F9DF , "Zombie"],
			[ 0x1F9DB , "Vampire"],
			[ 0x1F9B8 , "Superhero"],
			[ 0x1F9B9 , "Supervillain"],
			[ 0x1F483 , "Woman Dancing"],
			[ 0x1F57A , "Man Dancing"],
			[ 0x1F574 , "Man in Suit Levitating"],
			
				
			
			
			[ 0x1F482 , "Guard"],
			[ 0x1F934 , "Prince"],
			[ 0x1F478 , "Princess"],
			[ 0x1F935 , "Man in Tuxedo"],
			[ 0x1F470 , "Bride With Veil"],
			
			[ 0x1F939 , "Juggler"],
			[ 0x1F46F , "People With Bunny Ears"],
			
			
			[ 0 , "Occupations (choose a gender above for correct appearance)"],
			
			[ 0x1F3A4 , "Singer"],
			[ 0x1F3A8 , "Artist"],
			[ 0x1F373 , "Cook"],
			[ 0x1F33E , "Farmer"],
			[ 0x1F4BB , "Technologist"],
			[ 0x1F3EB , "Teacher"],
			[ 0x1F52C , "Scientists"],
			[ [0x2695,0xFE0F] , "Health Worker"],
			[ 0x1F4BC , "Office Worker"],
			[ [0x2696,0xFE0F] , "Judge"],
			[ [0x2708,0xFE0F] , "Pilot"],
			[ 0x1F680 , "Astronaut"],
			[ 0x1F692 , "Firefighter"],
			[ 0x1F46E , "Police Officer"],  	// ***  2642
			[ 0x1F575 , "Detective"],			// ***
			[ 0x1F527 , "Mechanic"],			// ***
			[ 0x1F3ED , "Factory Worker"],		// ***
			[ 0x1F477 , "Construction Worker"],// ***
			[ 0x1F393 , "Student"],
			
			[ 0 , "Family", true],
			[ -1 , "Skin Tone:"],
			[ -2 , "Hair Type:"],
			
			[ 0x1F476 , "Baby"],
			[ 0x1F9D2 , "Child"],
			[ 0x1F466 , "Boy"],
			[ 0x1F467 , "Girl"],
			[ 0x1F9D1 , "Person"],
			[ 0x1F468 , "Man"],
			[ 0x1F469 , "Woman"],
			[ 0x1F9D3 , "Older Person"],
			[ 0x1F474 , "Old Man"],
			[ 0x1F475 , "Old Woman"],
			
			/*[ 0x1F474 , "Man: White Hair"],
			[ 0x1F475 , "Old Woman"],
			[ 0x1F474 , "Old Man"],
			[ 0x1F475 , "Old Woman"],
			[ 0x1F474 , "Old Man"],
			[ 0x1F475 , "Old Woman"],
			[ 0x1F474 , "Old Man"],
			[ 0x1F475 , "Old Woman"],
			[ 0x1F474 , "Old Man"],
			[ 0x1F475 , "Old Woman"],*/
			
			[ 0x1F9D4 , "Bearded Person"],
			[ 0x1F473 , "Man With Turban"],
			[ 0x1F9D5 , "Person With Headscarf"],
			[ 0x1F472 , "Man With Gua Pi Mao"],
			
			[ 0x1F46B , "Man and Woman Holding Hands"],
			[ 0x1F46C , "Two Men Holding Hands"],
			[ 0x1F46D , "Two Women Holding Hands"],
			[ 0x1F491 , "Man and Woman With Heart"],
			[ [0x1F469,0x200D,0x2764,0xFE0F,0x200D,0x1F468] , "Couple With Heart: Woman, Man"],
			[ [0x1F468,0x200D,0x2764,0xFE0F,0x200D,0x1F469] , "Couple With Heart: Man, Woman"],
			[ [0x1F468,0x200D,0x2764,0xFE0F,0x200D,0x1F468] , "Couple With Heart: Man, Man"],
			[ [0x1F469,0x200D,0x2764,0xFE0F,0x200D,0x1F469] , "Couple With Heart: Woman, Woman"],
			
			[ 0x1F48F , "Man and Woman Kissing"],
			[ [0x1F469,0x200D,0x2764,0xFE0F,0x200D,0x1F48B,0x200D,0x1F468] , "Kiss: Woman, Man"],
			[ [0x1F468,0x200D,0x2764,0xFE0F,0x200D,0x1F48B,0x200D,0x1F469] , "Kiss: Man, Woman"],
			[ [0x1F468,0x200D,0x2764,0xFE0F,0x200D,0x1F48B,0x200D,0x1F468] , "Kiss: Man, Man"],
			[ [0x1F469,0x200D,0x2764,0xFE0F,0x200D,0x1F48B,0x200D,0x1F469] , "Kiss: Woman, Woman"],
			
			[ 0x1F46A , "Family"],
			[ [0x1F468,0x200D,0x1F469,0x200D,0x1F466] , "Family: Man, Woman, Boy"],
			[ [0x1F468,0x200D,0x1F469,0x200D,0x1F467] , "Family: Man, Woman, Girl"],
			[ [0x1F468,0x200D,0x1F469,0x200D,0x1F467,0x200D,0x1F466] , "Family: Man, Woman, Girl, Boy"],
			[ [0x1F468,0x200D,0x1F469,0x200D,0x1F466,0x200D,0x1F466] , "Family: Man, Woman, Boy, Boy"],
			[ [0x1F468,0x200D,0x1F469,0x200D,0x1F467,0x200D,0x1F467] , "Family: Man, Woman, Girl, Girl"],
			
			[ [0x1F468,0x200D,0x1F468,0x200D,0x1F466] , "Family: Man, Man, Boy"],
			[ [0x1F468,0x200D,0x1F468,0x200D,0x1F467] , "Family: Man, Man, Girl"],
			[ [0x1F468,0x200D,0x1F468,0x200D,0x1F467,0x200D,0x1F466] , "Family: Man, Man, Girl, Boy"],
			[ [0x1F468,0x200D,0x1F468,0x200D,0x1F466,0x200D,0x1F466] , "Family: Man, Man, Boy, Boy"],
			[ [0x1F468,0x200D,0x1F468,0x200D,0x1F467,0x200D,0x1F467] , "Family: Man, Man, Girl, Girl"],
			
			[ [0x1F469,0x200D,0x1F469,0x200D,0x1F466] , "Family: Woman, Woman, Boy"],
			[ [0x1F469,0x200D,0x1F469,0x200D,0x1F467] , "Family: Woman, Woman, Girl"],
			[ [0x1F469,0x200D,0x1F469,0x200D,0x1F467,0x200D,0x1F466] , "Family: Woman, Woman, Girl, Boy"],
			[ [0x1F469,0x200D,0x1F469,0x200D,0x1F466,0x200D,0x1F466] , "Family: Woman, Woman, Boy, Boy"],
			[ [0x1F469,0x200D,0x1F469,0x200D,0x1F467,0x200D,0x1F467] , "Family: Woman, Woman, Girl, Girl"],
			
			[ [0x1F468,0x200D,0x1F466] , "Family: Man, Boy"],
			[ [0x1F468,0x200D,0x1F467] , "Family: Man, Girl"],
			[ [0x1F468,0x200D,0x1F467,0x200D,0x1F466] , "Family: Man, Girl, Boy"],
			[ [0x1F468,0x200D,0x1F466,0x200D,0x1F466] , "Family: Man, Boy, Boy"],
			[ [0x1F468,0x200D,0x1F467,0x200D,0x1F467] , "Family: Man, Girl, Girl"],
			
			[ [0x1F469,0x200D,0x1F466] , "Family: Woman, Boy"],
			[ [0x1F469,0x200D,0x1F467] , "Family: Woman, Girl"],
			[ [0x1F469,0x200D,0x1F467,0x200D,0x1F466] , "Family: Woman, Girl, Boy"],
			[ [0x1F469,0x200D,0x1F466,0x200D,0x1F466] , "Family: Woman, Boy, Boy"],
			[ [0x1F469,0x200D,0x1F467,0x200D,0x1F467] , "Family: Woman, Girl, Girl"],
			
			[ 0 , "Silhouettes"],
			[ 0x1F5E3 , "Speaking Head in Silhouette"],
			[ 0x1F464 , "Silhouette of Person"],
			[ 0x1F465 , "Silhouette of Two People"],
			[ 0x1F463 , "Footprints"],
				
			[ 0 , "&nbsp;", true ],
			[ -10 , "Build A Family",true],
			[ 0 , "&nbsp;", true ],
			[ -11 , "Build Romance",true],
			[ 0 , "&nbsp;", true ],
		);



		Smiley.alltabs.AND_Nature = new Array(
			[ 0x1F41D , "Nature and Animals"],
				
			[ 0x1F490 , "Bouquet"],
			[ 0x1F339 , "ROSE"],
			[ 0x1F940 , "Wilted Flower"],
			[ 0x1F337 , "TULIP"],
			[ 0x1F33A , "HIBISCUS"],
			[ 0x1F338 , "CHERRY BLOSSOM"],
			[ 0x1F3f5 , "Rosette"],
			[ 0x1F33B , "SUNFLOWER"],
			[ 0x1F33C , "BLOSSOM"],
			[ 0x1F4AE , "White Flower"],
			
			[ 0x1F331 , "SEEDLING"],
			[ 0x1F33F , "HERB"],
			[ 0x1F343 , "LEAF FLUTTERING IN WIND"],
			[ 0x2618 ,  "SHAMROCK"],
			[ 0x1F340 , "FOUR LEAF CLOVER"],
			[ 0x1F342 , "FALLEN LEAF"],
			[ 0x1F341 , "MAPLE LEAF"],
			[ 0x1F33E , "EAR OF RICE"],
			[ 0x1F332 , "EVERGREEN TREE"],
			[ 0x1F333 , "DECIDUOUS TREE"],
			[ 0x1F334 , "PALM TREE"],
			[ 0x1F335 , "CACTUS"],
			
			
			[ 0x1F578 , "Spider Web"],
			[ 0x1F41A , "SPIRAL SHELL"],
			
			[ 0x1F30A , "WATER WAVE"],
			[ 0x1F32C , "Wind Blowing Face"],
			[ 0x1F300 , "CYCLONE"],
			[ 0x1F321 , "Thermometer"],
			[ 0x1F525 ,  "Fire"],
			//[ 0x2607 ,  "LIGHTNING"],
			[ 0x26A1 ,  "Thunderbolt"],
			
			[ 0x2604 ,  "COMET"],
			[ 0x1F32A , "Cloud With Tornado"],
			[ 0x1F32B , "FOG"],
			[ 0x1F301 , "FOGGY"],
			[ 0x2744 , "Snowflake"],
			[ 0x2603 ,  "SNOWMAN"],
			[ 0x26C4 ,  "SNOWMAN WITHOUT SNOW"],
			//[ 0x26C7 ,  "BLACK SNOWMAN"],
			
			
			
			[ 0x2600 ,  "Sun"],
			[ 0x1F324 ,  "Sun Behind Small Cloud"],
			[ 0x26C5 ,  "Sun Behind Cloud"],
			[ 0x1F325 ,  "Sun Behind Large Cloud"],
			[ 0x1F326 ,  "Sun Behind Rain Cloud"],
			[ 0x1F328 ,  "Cloud With Snow"],
			[ 0x26C8 ,  "Cloud With Lightning and Rain"],
			[ 0x1F329 ,  "Cloud With Lightning"],
			[ 0x1F327 ,  "Cloud With Rain"],
			[ 0x2601 ,  "Cloud"],
			[ 0x1F4A7 ,  "Droplet"],
			[ 0x2614 ,  "UMBRELLA WITH RAIN DROPS"],
			[ 0x1F308 , "RAINBOW"],
			[ 0x2B50 ,  "Star"],
			[ 0x1F31F , "GLOWING STAR"],
			[ 0x1F320 , "SHOOTING STAR"],
			[ 0x1F4AB ,  "Dizzy"],
			[ 0x2728 ,  "Sparkles"],
			
			 [ 0x1F311 , "NEW MOON SYMBOL"],
			[ 0x1F312 , "WAXING CRESCENT MOON SYMBOL"],
			[ 0x1F313 , "FIRST QUARTER MOON SYMBOL"],
			[ 0x1F314 , "WAXING GIBBOUS MOON SYMBOL"],
			[ 0x1F315 , "FULL MOON SYMBOL"],
			[ 0x1F316 , "WANING GIBBOUS MOON SYMBOL"],
			[ 0x1F317 , "LAST QUARTER MOON SYMBOL"],
			[ 0x1F318 , "WANING CRESCENT MOON SYMBOL"],
			[ 0x1F319 , "CRESCENT MOON"],
			
			
			
			[ 0x1F435 , "MONKEY FACE"],
			[ 0x1F648 , "SEE-NO-EVIL MONKEY"],
			[ 0x1F649 , "HEAR-NO-EVIL MONKEY"],
			[ 0x1F64A , "SPEAK-NO-EVIL MONKEY"],
			[ 0x1F43B , "BEAR FACE"],
			[ 0x1F981 , "LION FACE"],
			[ 0x1F42F , "TIGER FACE"],
			[ 0x1F431 , "CAT FACE"],
			[ 0x1F436 , "DOG FACE"],
			[ 0x1F43A , "WOLF FACE"],
			[ 0x1F439 , "HAMSTER FACE"],
			[ 0x1F42D , "MOUSE FACE"],
			[ 0x1F430 , "RABBIT FACE"],
			
			[ 0x1F99D , "Raccoon"],
			[ 0x1F9A1 , "Badger"],
			[ 0x1F98A , "Fox Face"],
			[ 0x1F428 , "Koala"],
			
			[ 0x1F43C , "PANDA FACE"],
			[ 0x1F437 , "PIG FACE"],
			[ 0x1F43D , "PIG NOSE"],
			[ 0x1F417 , "BOAR"],
			[ 0x1F993 , "Zebra Face"],
			[ 0x1F984 , "Unicorn Face"],
			[ 0x1F434 , "HORSE FACE"],
			[ 0x1F42E , "COW FACE"],
			[ 0x1F99B , "Hippopotamus"],
			[ 0x1F98F , "Rhinoceros"],
			
			[ 0x1F98C , "Deer"],
			[ 0x1F98D , "Gorilla"],
			[ 0x1F438 , "Frog Face"],
			[ 0x1F432 , "Dragon Face"],
			[ 0x1F429 , "Poodle"],
			[ 0x1F415 , "Dog"],
			[ 0x1F408 , "Cat"],
			[ 0x1F405 , "Tiger"],
			[ 0x1F406 , "Leopard"],
			[ 0x1F416 , "Pig"],
			[ 0x1F40E , "Horse"],
			[ 0x1F404 , "COW"],
			[ 0x1F402 , "OX"],
			[ 0x1F403 , "WATER BUFFALO"],
			[ 0x1F411 , "Ewe"],
			[ 0x1F40F , "RAM"],
			[ 0x1F410 , "GOAT"],
			[ 0x1F999 , "Llama"],
			
			[ 0x1F412 , "MONKEY"],
			[ 0x1F43F , "Chipmunk"],
			[ 0x1F407 , "RABBIT"],
			[ 0x1F994 , "Hedgehog"],
			[ 0x1F418 , "ELEPHANT"],
			[ 0x1F992 , "Giraffe"],
			[ 0x1F998 , "Kangaroo"],
			[ 0x1F42A , "DROMEDARY CAMEL"],
			[ 0x1F42B , "BACTRIAN CAMEL"],
			
			[ 0x1F987 , "Bat"],
			[ 0x1F989 , "Owl"],
			[ 0x1F985 , "Eagle"],
			
			[ 0x1F986 , "Duck"],
			[ 0x1F426 , "Bird"],
			[ 0x1F99C , "Parrot"],
			[ 0x1F54A , "Dove"],
			[ 0x1F9A2 , "Swan"],
			[ 0x1F99A , "Peacock"],
			[ 0x1F427 , "Penguin"],
			[ 0x1F983 , "Turkey"],
			[ 0x1F413 , "Rooster"],
			[ 0x1F414 , "Chicken"],
			[ 0x1F423 , "Hatching Chick"],
			[ 0x1F424 , "Baby Chick"],
			[ 0x1F425 , "Front-Facing Baby Chick"],
			
			  
			[ 0x1F409 , "DRAGON"],
			[ 0x1F996 , "T-Rex"],
			[ 0x1F995 , "Sauropod"],
			[ 0x1F422 , "Turtle"],
			[ 0x1F40A , "CROCODILE"],
			[ 0x1F40D , "Snake"],
			[ 0x1F98E , "Lizard"],
			
			
			[ 0x1F421 , "Blowfish"],
			[ 0x1F420 , "Tropical Fish"],
			[ 0x1F41F , "Fish"],
			[ 0x1F988 , "Shark"],
			[ 0x1F42C , "Dolphin"],
			[ 0x1F40B , "WHALE"],
			[ 0x1F433 , "Spouting Whale"],
			[ 0x1F990 , "Shrimp"],
			[ 0x1F99E , "Lobster"],
			[ 0x1F980 , "Crab"],
			[ 0x1F991 , "Squid"],
			[ 0x1F419 , "Octopus"],
			
			
			[ 0x1F982 , "Scorpion"],
			[ 0x1F577 , "Spider"],
			[ 0x1F41C , "Ant"],
			[ 0x1F997 , "Cricket"],
			[ 0x1F99F , "Mosquito"],
			[ 0x1F41E , "Lady Beetle"],
			[ 0x1F41D , "Honeybee"],
			[ 0x1F40C , "SNAIL"],
			[ 0x1F98B , "Butterfly"],
			[ 0x1F41B , "Bug"],
			[ 0x1F9A0 , "Microbe"],
			
			[ 0x1F43E , "PAW PRINTS"],

		);

		Smiley.alltabs.AND_FoodDrink = new Array(
			[ 0x2615 , "Food and Drink"],
			
			[ 0x1F353 , "STRAWBERRY"],
			[ 0x1F352 , "CHERRIES"],
			[ 0x1F34E , "RED APPLE"],
			[ 0x1F349 , "WATERMELON"],
			[ 0x1F351 , "PEACH"],
			[ 0x1F34A , "TANGERINE"],
			[ 0x1F96D , "Mango"],
			[ 0x1F34D , "PINEAPPLE"],
			[ 0x1F34C , "BANANA"],
			[ 0x1F34B , "LEMON"],
			[ 0x1F348 , "MELON"],
			[ 0x1F34F , "GREEN APPLE"],
			[ 0x1F350 , "PEAR"],
			[ 0x1F95D , "Kiwi Fruit"],
			[ 0x1F347 , "GRAPES"],
			[ 0x1F965 , "Coconut"],
			[ 0x1F345 , "TOMATO"],
			[ 0x1F336 , "Hot Pepper"],
			[ 0x1F344 , "Mushroom"],
			[ 0x1F955 , "Carrot"],
			[ 0x1F360 , "ROASTED SWEET POTATO"],
			[ 0x1F345 , "Roasted Sweet Potato"],
			
			[ 0x1F33D , "Ear of Corn"],
			[ 0x1F966 , "Broccoli"],
			[ 0x1F952 , "Cucumber"],
			[ 0x1F96C , "Leafy Green"],
			[ 0x1F951 , "Avocado"],
			[ 0x1F346 , "Eggplant"],
			[ 0x1F954 , "Potato"],
			[ 0x1F95C , "Peanuts"],
			[ 0x1F330 , "Chestnut"],
			
			
			
			[ 0x1F35E , "BREAD"],
			[ 0x1F950 , "Croissant"],
			[ 0x1F956 , "Baguette Bread"],
			[ 0x1F96F , "Bagel"],
			[ 0x1F95E , "Pancakes"],
			[ 0x1F373 , "Cooking"],
			[ 0x1F95A , "Egg"],
			[ 0x1F9C0 , "Cheese Wedge"],
			[ 0x1F953 , "Bacon"],
			[ 0x1F969 , "Cut of Meat"],
			[ 0x1F357 , "Poultry Leg"],
			[ 0x1F356 , "Meat on Bone"],
			[ 0x1F354 , "HAMBURGER"],
			[ 0x1F32D , "Hot Dog"],
			[ 0x1F96A , "Sandwich"],
			[ 0x1F968 , "Pretzel"],
			[ 0x1F35F , "FRENCH FRIES"],
			[ 0x1F355 , "Pizza"],
			[ 0x1F32F , "Burrito"],
			[ 0x1F32E , "Taco"],
			[ 0x1F959 , "Stuffed Flatbread"],
			[ 0x1F958 , "Shallow Pan of Food"],
			[ 0x1F35D , "SPAGHETTI"],
			[ 0x1F96B , "Canned Food"],
			[ 0x1F957 , "Green Salad"],
			[ 0x1F372 , "POT OF FOOD"],
			[ 0x1F35B , "Curry Rice"],
			[ 0x1F963 , "Bowl With Spoon"],
			[ 0x1F35C , "Steaming Bowl"],
			[ 0x1F961 , "Takeout Box"],
			[ 0x1F35A , "Cooked Rice"],
			[ 0x1F371 , "BENTO BOX"],
			[ 0x1F95F , "Dumpling"],
			[ 0x1F359 , "RICE BALL"],
			[ 0x1F358 , "RICE CRACKER"],
			[ 0x1F365 , "FISH CAKE WITH SWIRL DESIGN"],
			[ 0x1F362 , "ODEN"],
			[ 0x1F361 , "DANGO"],
			
			[ 0x1F960 , "Fortune Cookie"],
			[ 0x1F96E , "Moon Cake"],
			[ 0x1F367 , "SHAVED ICE"],
			[ 0x1F368 , "ICE CREAM"],
			[ 0x1F366 , "SOFT ICE CREAM"],
			[ 0x1F967 , "Pie"],
			[ 0x1F370 , "Shortcake"],
			[ 0x1F36E , "Custard"],
			[ 0x1F382 , "Birthday Cake"],
			[ 0x1F9C1 , "Cupcake"],
			[ 0x1F36D , "Lollipop"],
			[ 0x1F36C , "Candy"],
			[ 0x1F36B , "Chocolate Bar"],
			[ 0x1F369 , "Doughnut"],
			[ 0x1F36A , "Cookie"],
			[ 0x1F36F , "Honey Pot"],
			[ 0x1F9C2 , "Salt"],
			[ 0x1F37F , "Popcorn"],
			
			
			[ 0x1F964 , "Cup With Straw"],
			[ 0x1F37B , "Clinking Beer Mugs"],
			[ 0x1F37A , "Beer Mug"],
			[ 0x1F377 , "Wine Glass"],
			[ 0x1F37E , "Bottle With Popping Cork"],
			[ 0x1F942 , "Clinking Glasses"],
			[ 0x1F943 , "Tumbler Glass"],
			[ 0x1F378 , "Cocktail Glass"],
			[ 0x1F379 , "Tropical Drink"],
			[ 0x1F376 , "Sake"],
			[ 0x1F37C , "Baby Bottle"],
			[ 0x1F95B , "Glass of Milk"],
			[ 0x2615 , "Hot Beverage"],
			[ 0x1F375 , "Teacup Without Handle"],
			[ 0x1F962 , "Chopsticks"],
			[ 0x1F37D , "Fork and Knife With Plate"],
			[ 0x1F374 , "Fork and Knife"],
			[ 0x1F944 , "Spoon"],
			[ 0x1F52A , "Kitchen Knife"],
			
		);


		Smiley.alltabs.AND_TravelPlaces = new Array(
			[ 0x1F3D9 , "Travel and Places"],
			
			[ 0x1F6B2 , "BICYCLE"],
			[ 0x1F6F9 , "Skateboard"],
			[ 0x1F6F4 , "Kick Scooter"],
			[ 0x1F6F5 , "Motor Scooter"],
			[ 0x1F3CD , "Motorcycle"],
			[ 0x1F3CE , "Racing Car"],
			[ 0x1F690 , "MINIBUS"],
			[ 0x1F69A , "DELIVERY TRUCK"],
			[ 0x1F69B , "ARTICULATED LORRY"],
			[ 0x1F698 , "ONCOMING AUTOMOBILE"],
			[ 0x1F686 , "TRAIN"],
			[ 0x1F696 , "ONCOMING TAXI"],
			[ 0x1F694 , "ONCOMING POLICE CAR"],
			[ 0x1F68D , "ONCOMING BUS"],
			[ 0x1F68A , "TRAM"],
			[ 0x1F689 , "STATION"],
			[ 0x1F6E4 , "Railway Track"],
			[ 0x1F6e3 , "Motorway"],
			
			[ 0x1F697 , "AUTOMOBILE"],
			[ 0x1F685 , "HIGH-SPEED TRAIN WITH BULLET NOSE"],
			[ 0x1F695 , "TAXI"],
			[ 0x1F693 , "POLICE CAR"],
			[ 0x1F68C , "BUS"],
			[ 0x1F692 , "FIRE ENGINE"],
			[ 0x1F691 , "AMBULANCE"],
			[ 0x1F699 , "Sport Utility Vehicle"],
			[ 0x1F681 , "HELICOPTER"],
			[ 0x1F68F , "BUS STOP"],
			[ 0x1F687 , "METRO"],
			[ 0x26FD , "FUEL PUMP"],
			[ 0x1F6E2 , "Oil Drum"],
			
			[ 0x1F6A5 , "HORIZONTAL TRAFFIC LIGHT"],
			[ 0x1F6A6 , "VERTICAL TRAFFIC LIGHT"],
			[ 0x1F6A7 , "CONSTRUCTION SIGN"],
			[ 0x1F6D1 , "Stop Sign"],
			[ 0x1F6A8 , "Police Car Light"],
			
			[ 0x1F69C , "TRACTOR"],
			[ 0x1F682 , "STEAM LOCOMOTIVE"],
			[ 0x1F68E , "TROLLEYBUS"],
			[ 0x1F68B , "TRAM CAR"],
			[ 0x1F69E , "MOUNTAIN RAILWAY"],
			[ 0x1F683 , "RAILWAY CAR"],
			[ 0x1F688 , "LIGHT RAIL"],
			[ 0x1F69D , "MONORAIL"],
			[ 0x1F684 , "HIGH-SPEED TRAIN"],
			[ 0x1F69F , "SUSPENSION RAILWAY"],
			[ 0x1F6A0 , "MOUNTAIN CABLEWAY"],
			[ 0x1F6A1 , "AERIAL TRAMWAY"],
			[ 0x1F6A3 , "ROWBOAT"],
			[ 0x1F6F6 , "Canoe"],
			[ 0x26F5 ,  "SAILBOAT"],
			[ 0x26F4 ,  "FERRY"],
			[ 0x1F6A4 , "SPEEDBOAT"],
			[ 0x1F6E5 , "Motor Boat"],
			[ 0x1F6F3 , "Passenger Ship"],
			[ 0x1F6A2 , "SHIP"],
			[ 0x2693 , "Anchor"],
			[ 0x1F9ED , "Compass"],
			
			[ 0x1F6E9 ,  "Small Airplane"],
			[ 0x2708 ,  "AIRPLANE"],
			[ 0x1F6EB ,  "Airplane Departure"],
			[ 0x1F6EC ,  "Airplane Arrival"],
			[ 0x1F4BA ,  "Seat"],
			[ 0x1F9F3 ,  "Luggage"],
			
			[ 0x1F6C3 , "Customs"],
			
			
			[ 0x1F5FA , "World Map"],
			[ 0x1F310 , "GLOBE WITH MERIDIANS"],
			[ 0x1F30D , "EARTH GLOBE EUROPE-AFRICA"],
			[ 0x1F30E , "EARTH GLOBE AMERICAS"],
			[ 0x1F30F , "EARTH GLOBE ASIA-AUSTRALIA"],
			
			[ 0x1F680 , "ROCKET"],
			[ 0x1F6F8 , "Flying Saucer"],
			
			
			[ 0x1F3D5 , "Camping"],
			[ 0x26FA , "Tent"],
			[ 0x1F3E0 , "HOUSE BUILDING"],
			[ 0x1F3E1 , "HOUSE WITH GARDEN"],
			[ 0x1F3D8 , "Houses"],
			[ 0x1F3DA , "Derelict House"],
			[ 0x1F3D7 , "Building Construction"],
			[ 0x1F3E2 , "OFFICE BUILDING"],
			[ 0x1F3ED , "FACTORY"],
			[ 0x1F3E3 , "JAPANESE POST OFFICE"],
			[ 0x1F3E4 , "EUROPEAN POST OFFICE"],
			[ 0x1F3E5 , "HOSPITAL"],
			[ 0x1F3E6 , "BANK"],
			[ 0x1F3E8 , "HOTEL"],
			[ 0x1F3E9 , "LOVE HOTEL"],
			[ 0x1F3EA , "CONVENIENCE STORE"],
			[ 0x1F3EB , "SCHOOL"],
			[ 0x1F3EC , "DEPARTMENT STORE"],
			[ 0x1F3DF , "Stadium"],
			[ 0x1F3EF , "JAPANESE CASTLE"],
			[ 0x1F3F0 , "EUROPEAN CASTLE"],
			[ 0x1F492 , "Wedding"],
			[ 0x26EA , "Church"],
			[ 0x1F54C , "Mosque"],
			[ 0x1F54D , "Synagogue"],
			[ [0x26E9, 0xFE0F] , "Shinto Shrine"],
			[ 0x1F54B , "Kaaba"],

			[ 0x1F3DB , "Classical Building"],
			[ 0x1F5FF , "Moai"],
			[ 0x1F5FC , "Tokyo Tower"],
			[ 0x1F5FD , "Statue of Liberty"],
			[ 0x1F3AA , "Circus Tent"],
			[ 0x1F3A0 , "Carousel Horse"],
			[ 0x1F3A2 , "Roller Coaster"],
			[ 0x1F3A1 , "Ferris Wheel"],
			[ 0x26F2 , "Fountain"],
			[ 0x1F305 , "Sunrise"],
			[ 0x1F304 , "Sunrise Over Mountains"],
			[ 0x1F306 , "Cityscape at Dusk"],
			[ 0x1F301 , "Foggy"],
			[ 0x1F3D9 , "Cityscape"],
			[ 0x1F307 , "Sunset"],
			[ 0x1F303 , "Night With Stars"],
			[ 0x1F30C , "Milky Way"],
			[ 0x1F309 , "Bridge at Night"],
			[ 0x1F3D4 , "Snow-Capped Mountain"],
			[ 0x26F0 , "Mountain"],
			[ 0x1F30B , "Volcano"],
			[ 0x1F5FB , "Mount Fuji"],
			[ 0x1F3DE , "National Park"],
			[ 0x1F3D6 , "Beach With Umbrella"],
			[ [0x26F1, 0xFE0F] , "Umbrella on Ground"],
			[ 0x1F3DD , "Desert Island"],
			[ 0x1F3DC , "Desert"],
			
			//[ [0x26DF,0xFE0F] , "TRUCK"],
			
		);

		Smiley.alltabs.AND_Activities = new Array(
			[ 0x1F3C6 , "Activities and Events"],

			[ 0x1F389 , "Party Popper"],
			[ 0x1F382 , "Birthday Cake"],
			[ 0x1F388 , "Balloon"],
			[ 0x1F381 , "Wrapped Gift"],
			[ 0x1F380 , "Ribbon"],
			[ 0x1F384 , "Christmas Tree"],
			[ 0x1F383 , "Jack-O-Lantern"],
			[ 0x1F387 , "Sparkler"],
			[ 0x1F386 , "Fireworks"],
			
			[ 0x1F38A , "Confetti Ball"],
			[ 0x1F9E8 , "Firecracker"],
			[ 0x1F9E7 , "Red Envelope"],
			[ 0x1F390 , "Wind Chime"],
			[ 0x1F38F , "Carp Streamer"],
			[ 0x1F38E , "Japanese Dolls"],
			[ 0x1F391 , "Moon Viewing Ceremony"],
			[ 0x1F38D , "Pine Decoration"],
			[ 0x1F38B , "Tanabata Tree"],
			
			[ 0x1F947 , "1st Place Medal"],
			[ 0x1F948 , "2nd Place Medal"],
			[ 0x1F949 , "3rd Place Medal"],
			[ 0x1F3C6 , "Trophy"],
			[ 0x1F3C5 , "Sports Medal"],
			[ 0x1F396 , "Military Medal"],
			[ 0x1F397 , "Reminder Ribbon"],
			[ 0x1F39F , "Admission Tickets"],
			[ 0x1F3AB , "Ticket"],
			
			[ 0x1F3BC , "Musical Score"],
			[ 0x1F3B5 , "Musical Note"],
			[ 0x1F3B6 , "Musical Notes"],
			[ 0x1F399 , "Studio Microphone"],
			[ 0x1F39A , "Level Slider"],
			[ 0x1F39B , "Control Knobs"],
			[ 0x1F3A4 , "Microphone"],
			[ 0x1F3A7 , "Headphone"],
			[ 0x1F4FB , "Radio"],
			
			[ 0x1F3B7 , "Saxophone"],
			[ 0x1F3B8 , "Guitar"],
			[ 0x1F3BA , "Trumpet"],
			[ 0x1F3BB , "Violin"],
			[ 0x1F941 , "Drum"],
			[ 0x1F3B9 , "Musical Keyboard"],
			[ 0x1F3AC , "Clapper Board"],
			[ 0x1F4E3 , "Megaphone"],
			[ 0x1F4E2 , "Loudspeaker"],
			
			[ 0x1F3AD , "Performing Arts"],
			[ 0x1F39E , "Film Frames"],
			[ 0x1F3A5 , "Movie Camera"],
			[ 0x1F4FD , "Film Projector"],
			[ 0x1F4F9 , "Video Camera"],
			[ 0x1F4FC , "Videocassette"],
			[ 0x1F4FA , "Television"],
			[ 0x1F4F7 , "Camera"],
			[ 0x1F4F8 , "Camera With Flash"],
			
			[ 0x26BD , "Soccer Ball"],
			[ 0x26BE , "Baseball"],
			[ 0x1F94E , "Softball"],
			[ 0x1F3C0 , "Basketball"],
			[ 0x1F3D0 , "Volleyball"],
			[ 0x1F3C8 , "American Football"],
			[ 0x1F3C9 , "Rugby Football"],
			[ 0x1F3BE , "Tennis"],
			[ 0x1F3F8 , "Badminton"],
			
			[ 0x1F94D , "Lacrosse"],
			[ 0x1F3CF , "Cricket Game"],
			[ 0x1F3D1 , "Field Hockey"],
			[ 0x1F3D2 , "Ice Hockey"],
			[ 0x1F94C , "Curling Stone"],
			[ 0x1F3BF , "Skis"],
			[ [0x26F8,0xFE0F] , "Ice Skate"],
			[ 0x1F6F7 , "Sled"],
			[ 0x1F945 , "Goal Net"],
			
			[ 0x1F94A , "Boxing Glove"],
			[ 0x1F94B , "Martial Arts Uniform"],
			[ 0x1F3BD , "Running Shirt"],
			[ 0x1F3F9 , "Bow and Arrow"],
			[ 0x26F3 , "Flag in Hole"],
			[ 0x1F3A3 , "Fishing Pole"],
			[ 0x1F3B3 , "Bowling"],
			[ 0x1F3D3 , "Ping Pong"],
			[ 0x1F94F , "Flying Disc"],
			
			[ 0x1F3AF , "Direct Hit"],
			[ 0x1F3B1 , "Pool 8 Ball"],
			[ [0x265F,0xFE0F] , "Chess Pawn"],
			[ 0x1F9E9 , "Jigsaw"],
			[ 0x1F3AE , "Video Game"],
			[ 0x1F579 , "Joystick"],
			[ 0x1F47E , "Alien Monster"],
			[ 0x1F52B , "Pistol"],
			[ 0x1F0CF , "Joker"],
			
			[ 0x1F004 , "Mahjong Red Dragon"],
			[ 0x1F3B4 , "Flower Playing Cards"],
			[ 0x1F3B2 , "Game Die"],
			[ 0x1F3B0 , "Slot Machine"],
			[ 0x1F3A8 , "Artist Palette"],
			[ 0x1F5BC , "Framed Picture"],
			[ 0x1F9F5 , "Thread"],
			[ 0x1F9F6 , "Yarn"],
			
		);

		Smiley.alltabs.AND_Objects = new Array(
			[ 0x1F4A1 , "Objects"],
			
			[ 0x1F4F1 , "Mobile Phone"],
			[ 0x1F4F2 , "Mobile Phone With Arrow"],
			[ [0x260E,0xFE0F] , "Telephone"],
			[ 0x1F4DE , "Telephone Receiver"],
			[ 0x1F4DF , "Pager"],
			[ 0x1F4E0 , "Fax Machine"],
			[ 0x1F50C , "Electric Plug"],
			[ 0x1F50B , "Battery"],
			[ 0x1F5B2 , "Trackball"],
			
			[ 0x1F4BD , "Computer Disk"],
			[ 0x1F4BE , "Floppy Disk"],
			[ 0x1F4BF , "Optical Disk"],
			[ 0x1F4C0 , "DVD"],
			[ 0x1F5A5 , "Desktop Computer"],
			[ 0x1F4BB , "Laptop Computer"],
			[ [0x2328,0xFE0F] , "Keyboard"],
			[ 0x1F5A8 , "Printer"],
			[ 0x1F5B1 , "Computer Mouse"],
			
			[ 0x1F9EE , "Abacus"],
			[ 0x1F3E7 , "ATM Sign"],
			[ 0x1F4B8 , "Money With Wings"],
			[ 0x1F4B5 , "Dollar Banknote"],
			[ 0x1F4B4 , "Yen Banknote"],
			[ 0x1F4B6 , "Euro Banknote"],
			[ 0x1F4B7 , "Pound Banknote"],
			[ 0x1F4B3 , "Credit Card"],
			[ 0x1F4B0 , "Money Bag"],
			
			[ 0x1F9FE , "Receipt"],
			[ 0x1F6D2 , "Shopping Cart"],
			[ 0x1F6CD , "Shopping Bags"],
			[ 0x1F9F4 , "Lotion Bottle"],
			[ 0x1F9FC , "Soap"],
			[ 0x1F9FD , "Sponge"],
			[ 0x1F9F9 , "Broom"],
			[ 0x1F56F , "Candle"],
			[ 0x1F4A1 , "Light Bulb"],
			
			[ 0x1F526 , "Flashlight"],
			[ 0x1F3EE , "Red Paper Lantern"],
			[ 0x1F9F1 , "Brick"],
			[ 0x1F6AA , "Door"],
			[ 0x1F6CF , "Bed"],
			[ 0x1F6CB , "Couch and Lamp"],
			[ 0x1F6C1 , "Bathtub"],
			[ 0x1F6BF , "Shower"],
			[ 0x1F6BD , "Toilet"],
			
			[ 0x1F9EF , "Fire Extinguisher"],
			[ 0x1F9FB , "Roll of Paper"],
			[ 0x1F9F8 , "Teddy Bear"],
			[ 0x1F9F7 , "Safety Pin"],
			[ 0x1F9FA , "Basket"],
			[ 0x1F9E6 , "Socks"],
			[ 0x1F9E3 , "Scarf"],
			[ 0x1F456 , "Jeans"],
			[ 0x1F455 , "T-Shirt"],
			
			[ 0x1F45A , "Woman’s Clothes"],
			[ 0x1F454 , "Necktie"],
			[ 0x1F457 , "Dress"],
			[ 0x1F9E5 , "Coat"],
			[ 0x1F392 , "Backpack"],
			[ 0x1F45D , "Clutch Bag"],
			[ 0x1F45B , "Purse"],
			[ 0x1F45C , "Handbag"],
			[ 0x1F4BC , "Briefcase"],
			
			[ 0x1F97C , "Lab Coat"],
			[ 0x1F459 , "Bikini"],
			[ 0x1F458 , "Kimono"],
			[ 0x1F3A9 , "Top Hat"],
			[ 0x1F393 , "Graduation Cap"],
			[ 0x1F452 , "Woman's Hat"],
			[ 0x1F9E2 , "Billed Cap"],
			[ [0x26D1,0xFE0F] , "Rescue Worker's Helmet"],
			[ 0x1F451 , "Crown"],
			
			[ [0x2602,0xFE0F] , "Umbrella"],
			[ 0x1F302 , "Closed Umbrella"],
			[ 0x1F48D , "Ring"],
			[ 0x1F48E , "Gem Stone"],
			[ 0x1F484 , "Lipstick"],
			[ 0x1F460 , "High-Heeled Shoe"],
			[ 0x1F45F , "Running Shoe"],
			[ 0x1F45E , "Man’s Shoe"],
			[ 0x1F97F , "Flat Shoe"],
			
			[ 0x1F461 , "Woman’s Sandal"],
			[ 0x1F462 , "Woman’s Boot"],
			[ 0x1F97E , "Hiking Boot"],
			[ 0x1F9E4 , "Gloves"],
			[ 0x1F97D , "Goggles"],
			[ 0x1F453 , "Glasses"],
			[ 0x1F576 , "Sunglasses"],
			[ 0x1F489 , "Syringe"],
			[ 0x1F48A , "Pill"],
			
			[ [0x2697,0xFE0F] , "Alembic"],
			[ 0x1F9EB , "Petri Dish"],
			[ 0x1F9EA , "Test Tube"],
			[ 0x1F321 , "Thermometer"],
			[ 0x1F9EC , "DNA"],
			[ 0x1F52C , "Microscope"],
			[ 0x1F52D , "Telescope"],
			[ 0x1F4E1 , "Satellite Antenna"],
			[ 0x1F6F0 , "Satellite"],
			
			[ 0x1F9F2 , "Magnet"],
			[ 0x1F5DC , "Clamp"],
			[ 0x1F529 , "Nut and Bolt"],
			[ 0x1F528 , "Hammer"],
			[ [0x2692,0xFE0F] , "Hammer and Pick"],
			[ 0x1F6E0 , "Hammer and Wrench"],
			[ [0x26CF,0xFE0F] , "Pick"],
			[ 0x1F527 , "Wrench"],
			[ 0x1F9F0 , "Toolbox"],
			
			[ [0x2699,0xFE0F] , "Gear"],
			[ 0x1F517 , "Link"],
			[ [0x26D3,0xFE0F] , "Chains"],
			[ 0x1F4CE , "Paperclip"],
			[ 0x1F587 , "Linked Paperclips"],
			[ 0x1F4CF , "Straight Ruler"],
			[ 0x1F4D0 , "Triangular Ruler"],
			[ 0x1F4CC , "Pushpin"],
			[ 0x1F4CD , "Round Pushpin"],
			
			[ 0x1F58C , "Paintbrush"],
			[ 0x1F58A , "Pen"],
			[ 0x1F58B , "Fountain Pen"],
			[ 0x1F58D , "Crayon"],
			[ [0x2712,0xFE0F] , "Black Nib"],
			[ [0x270F,0xFE0F] , "Pencil"],
			[ 0x1F4DD , "Memo"],
			[ 0x1F5D1 , "Wastebasket"],
			[ [0x2702,0xFE0F] , "Scissors"],
			
			[ 0x1F4D2 , "Ledger"],
			[ 0x1F4D4 , "Notebook With Decorative Cover"],
			[ 0x1F4D5 , "Closed Book"],
			[ 0x1F4D3 , "Notebook"],
			[ 0x1F4D7 , "Green Book"],
			[ 0x1F4D8 , "Blue Book"],
			[ 0x1F4D9 , "Orange Book"],
			[ 0x1F4DA , "Books"],
			[ 0x1F4D6 , "Open Book"],
			
			[ 0x1F516 , "Bookmark"],
			[ 0x1F5D2 , "Spiral Notepad"],
			[ 0x1F4C4 , "Page Facing Up"],
			[ 0x1F4C3 , "Page With Curl"],
			[ 0x1F4CB , "Clipboard"],
			[ 0x1F4C7 , "Card Index"],
			[ 0x1F4D1 , "Bookmark Tabs"],
			[ 0x1F5C3 , "Card File Box"],
			[ 0x1F5C4 , "File Cabinet"],
			
			[ 0x1F5C2 , "Card Index Dividers"],
			[ 0x1F4C2 , "Open File Folder"],
			[ 0x1F4C1 , "File Folder"],
			[ 0x1F4CA , "Bar Chart"],
			[ 0x1F4C8 , "Chart Increasing"],
			[ 0x1F4C9 , "Chart Decreasing"],
			[ 0x1F4F0 , "Newspaper"],
			[ 0x1F5DE , "Rolled-Up Newspaper"],
			[ 0x1F4E6 , "Package"],
			
			[ 0x1F4EB , "Closed Mailbox With Raised Flag"],
			[ 0x1F4EA , "Closed Mailbox With Lowered Flag"],
			[ 0x1F4EC , "Open Mailbox With Raised Flag"],
			[ 0x1F4ED , "Open Mailbox With Lowered Flag"],
			[ 0x1F4EE , "Postbox"],
			[ [0x2709,0xFE0F] , "Envelope"],
			[ 0x1F4E7 , "E-Mail"],
			[ 0x1F4E9 , "Envelope With Arrow"],
			[ 0x1F4E8 , "Incoming Envelope"],
			
			[ 0x1F48C , "Love Letter"],
			[ 0x1F4E4 , "Outbox Tray"],
			[ 0x1F4E5 , "Inbox Tray"],
			[ 0x1F5F3 , "Ballot Box With Ballot"],
			[ 0x1F3F7 , "Label"],
			[ 0x1F4EF , "Postal Horn"],
			[ 0x1F5D3 , "Spiral Calendar"],
			[ 0x1F4C5 , "Calendar"],
			[ 0x1F4C6 , "Tear-Off Calendar"],
			
			[ 0x1F55B , "CLOCK FACE TWELVE OCLOCK"],
			[ 0x1F567 , "CLOCK FACE TWELVE-THIRTY"],
			[ 0x1F550 , "CLOCK FACE ONE OCLOCK"],
			[ 0x1F55C , "CLOCK FACE ONE-THIRTY"],
			[ 0x1F551 , "CLOCK FACE TWO OCLOCK"],
			[ 0x1F55D , "CLOCK FACE TWO-THIRTY"],
			[ 0x1F552 , "CLOCK FACE THREE OCLOCK"],
			[ 0x1F55E , "CLOCK FACE THREE-THIRTY"],
			[ 0x1F553 , "CLOCK FACE FOUR OCLOCK"],
			[ 0x1F55F , "CLOCK FACE FOUR-THIRTY"],
			[ 0x1F554 , "CLOCK FACE FIVE OCLOCK"],
			[ 0x1F560 , "CLOCK FACE FIVE-THIRTY"],
			[ 0x1F555 , "CLOCK FACE SIX OCLOCK"],
			[ 0x1F561 , "CLOCK FACE SIX-THIRTY"],
			[ 0x1F556 , "CLOCK FACE SEVEN OCLOCK"],
			[ 0x1F562 , "CLOCK FACE SEVEN-THIRTY"],
			[ 0x1F557 , "CLOCK FACE EIGHT OCLOCK"],
			[ 0x1F563 , "CLOCK FACE EIGHT-THIRTY"],
			[ 0x1F558 , "CLOCK FACE NINE OCLOCK"],
			[ 0x1F564 , "CLOCK FACE NINE-THIRTY"],
			[ 0x1F559 , "CLOCK FACE TEN OCLOCK"],
			[ 0x1F565 , "CLOCK FACE TEN-THIRTY"],
			[ 0x1F55A , "CLOCK FACE ELEVEN OCLOCK"],
			[ 0x1F566 , "CLOCK FACE ELEVEN-THIRTY"],
			
			[ [0x231B,0xFE0F] , "HOURGLASS" ],
			[ [0x23F3,0xFE0F] , "HOURGLASS WITH FLOWING SAND" ],
			[ [0x231A,0xFE0F] , "WATCH" ],
			[ [0x23F0,0xFE0F] , "ALARM CLOCK" ],
			[ [0x23F1,0xFE0F] , "STOPWATCH" ],
			[ [0x23F2,0xFE0F] , "TIMER CLOCK" ],
			[ 0x1F570 , "Mantelpiece Clock" ],
			
			
			
			[ 0x1F6CE , "Bellhop Bell"],
			[ 0x1F514 , "Bell"],
			[ 0x1F512 , "Locked"],
			[ 0x1F513 , "Unlocked"],
			[ 0x1F50F , "Locked With Pen"],
			[ 0x1F510 , "Locked With Key"],
			[ 0x1F511 , "Key"],
			[ 0x1F5DD , "Old Key"],
			[ 0x1F6E1 , "Shield"],
			[ 0x1F5E1 , "Dagger"],
			[ [0x2694,0xFE0F] , "Crossed Swords"],
			[ 0x1F4A3 , "Bomb"],
			[ 0x1F6AC , "Cigarette"],
			[ [0x26B0,0xFE0F] , "Coffin"],
				
			[ [0x26B1,0xFE0F] , "Funeral Urn"],
			[ 0x1F3FA , "Amphora"],
			[ 0x1F4DC , "Scroll"],
			[ 0x1F52E , "Crystal Ball"],
			[ 0x1F9FF , "Nazar Amulet"],
			[ 0x1F4FF , "Prayer Beads"],
			[ 0x1F488 , "Barber Pole"],
			[ [0x2696,0xFE0F] , "Balance Scale"],
			[ 0x1F50D , "Magnifying Glass Tilted Left"],
			
			[ 0x1F50E , "Magnifying Glass Tilted Right"],
			[ 0x1F4A0 , "Diamond With a Dot"],
			
		);

		Smiley.alltabs.AND_Symbols = new Array(
			[ 0x1F523 , "Shapes"],	 
			
			[ 0x2755 , "White Exclamation Mark Ornament"],
			[ 0x2754 , "White Question Mark Ornament"],
			[ 0x2757 , "Red Exclamation Mark"],
			[ 0x2753 , "Red Question Mark"],
			[ [0x2049,0xFE0F] , "Exclamation Question Mark"],
			[ [0x203C,0xFE0F] , "Double Exclamation Mark"],
			[ 0x2B55 , "Heavy Large Circle"],
			[ 0x274C , "Cross Mark"],
			[ 0x1F4AF , "Hundred Points"],
			
			[ 0x1F6B3 , "No Bicycles"],
			[ 0x1F6AD , "No Smoking"],
			[ 0x1F6AF , "No Littering"],
			[ 0x1F6B1 , "Non-Potable Water"],
			[ 0x1F6B7 , "No Pedestrians"],
			[ 0x1F4F5 , "No Mobile Phones"],
			[ 0x1F51E , "No One Under Eighteen"],
			[ 0x1F515 , "Bell With Slash"],
			[ 0x1F507 , "Muted Speaker"],
			
			[ 0x1F6AB , "Prohibited"],
			[ 0x1F170 , "Blood Type A"],
			[ 0x1F18E , "Blood Type AB"],
			[ 0x1F171 , "Blood Type B"],
			[ 0x1F191 , "Clear Button"],
			[ 0x1F17E , "Blood Type O"],
			[ 0x1F198 , "SOS Button"],
			[ 0x26D4 , "No Entry"],
			[ 0x1F4DB , "Name Badge"],
			
			
			[ 0x2668 , "Hot Springs"],
			[ 0x1F250 , "Japanese \"Bargain\" Button"],
			[ 0x3299 , "Japanese \"Secret\" Button"],
			[ 0x3297 , "Japanese \"Congratulations\" Button"],
			[ 0x1F234 , "Japanese \"Passing Grade\" Button"],
			[ 0x1F235 , "Japanese \"No Vacancy\" Button"],
			[ 0x1F239 , "Japanese \"Discount\" Button"],
			[ 0x1F232 , "Japanese \"Prohibited\" Button"],
			[ 0x1F251 , "Japanese \"Acceptable\" Button"],
			
			[ 0x1F236 , "Japanese \"Not Free of Charge\" Button"],
			[ 0x1F21A , "Japanese \"Free of Charge\" Button"],
			[ 0x1F238 , "Japanese \"Application\" Button"],
			[ 0x1F23A , "Japanese \"Open for Business\" Button"],
			[ 0x1F237 , "Japanese \"Monthly Amount\" Button"],
			[ 0x1F19A , "Vs Button"],
			[ 0x1F3A6 , "Cinema"],
			[ 0x1F4F6 , "Antenna Bars"],
			[ 0x1F501 , "Repeat Button"],
			
			[ 0x1F502 , "Repeat Single Button"],
			[ 0x1F500 , "Shuffle Tracks Button"],
			[ [0x25B6,0xFE0F] , "Play Button"],
			[ [0x23E9,0xFE0F] , "Fast-Forward Button"],
			[ [0x23ED,0xFE0F] , "Next Track Button"],
			[ [0x23EF,0xFE0F] , "Play or Pause Button"],
			[ [0x25C0,0xFE0F] , "Reverse Button"],
			[ [0x23EA,0xFE0F] , "Fast Reverse Button"],
			[ [0x23EE,0xFE0F] , "Last Track Button"],
			
			[ 0x1F53C , "Upwards Button"],
			[ [0x23EB,0xFE0F] , "Fast Up Button"],
			[ 0x1F53D , "Downwards Button"],
			[ [0x23EC,0xFE0F] , "Fast Down Button"],
			[ [0x23F8,0xFE0F] , "Pause Button"],
			[ [0x23F9,0xFE0F] , "Stop Button"],
			[ [0x23FA,0xFE0F] , "Record Button"],
			[ [0x23CF,0xFE0F] , "Eject Button"],
			[ 0x1F4F3 , "Vibration Mode"],
			
			[ 0x1F4F4 , "Mobile Phone Off"],
			[ 0x1F505 , "Low Brightness Symbol"],
			[ 0x1F506 , "High Brightness Symbol"],
			[ 0x1F508 , "Speaker Low Volume"],
			[ 0x1F509 , "Speaker Medium Volume"],
			[ 0x1F50A , "Speaker High Volume"],
			[ [0x269C,0xFE0F] , "Fleur-de-lis"],
			[ 0x1F531 , "Trident Emblem"],
			[ [0x303D,0xFE0F] , "Part Alternation Mark"],
			
			[ [0x2622,0xFE0F] , "Radioactive"],
			[ [0x2623,0xFE0F] , "Biohazard"],
			[ [0x26A0,0xFE0F] , "Warning"],
			[ 0x1F6B8 , "Children Crossing"],
			[ 0x1F530 , "Japanese Symbol for Beginner"],
			[ [0x267B,0xFE0F] , "Recycling Symbol"],
			[ 0x1F22F , "Japanese \"Reserved\" Button"],
			[ 0x1F4B9 , "Chart Increasing With Yen"],
			[ 0x1F4B1 , "Currency Exchange"],
			
			[ 0x1F4B2 , "Heavy Dollar Sign"],
			[ [0x2733,0xFE0F] , "Eight-Spoked Asterisk"],
			[ [0x2746,0xFE0F] , "Sparkle"],
			[ [0x2734,0xFE0F] , "Eight-Pointed Star"],
			[ [0x274E,0xFE0F] , "Cross Mark Button"],
			[ [0x2705,0xFE0F] , "White Heavy Check Mark"],
			[ [0x2714,0xFE0F] , "Heavy Check Mark"],
			[ [0x2611,0xFE0F] , "Ballot Box With Check"],
			[ 0x1F6BE , "Water Closet"],
			
			[ 0x1F6BB , "Restroom"],
			[ 0x1F6B9 , "Men&apos;s Room"],
			[ 0x1F6BA , "Women&apos;s Room"],
			[ [0x267F,0xFE0F] , "Wheelchair Symbol"],
			[ 0x1F6BC , "Baby Symbol"],
			[ 0x1F6AE , "Litter in Bin Sign"],
			[ 0x1F6B0 , "Potable Water"],
			[ 0x1F6C2 , "Passport Control"],
			[ 0x1F6C3 , "Customs"],
			
			[ 0x1F6C4 , "Baggage Claim"],
			[ 0x1F6C5 , "Left Luggage"],
			[ 0x1F310 , "Globe With Meridians"],
			[ [0x2695,0xFE0F] , "Medical Symbol (Staff of Aesculapius)"],
			[ 0x1F17F , "Parking Sign"],
			[ [0x24C2,0xFE0F] , "Metro"],
			[ [0x2139,0xFE0F] , "Information"],
			[ 0x1F3E7 , "ATM Sign"],
			[ 0x1F201 , "Japanese \"Here\" Button"],
			
			[ 0x1F202 , "Japanese \"Service\" or \"Service Charge\" Button"],
			[ 0x1F233 , "Japanese \"Vacancy\" Button"],
			[ 0x1F196 , "NG Button (No Good)"],
			[ 0x1F520 , "Input Latin Uppercase"],
			[ 0x1F521 , "Input Latin Lowercase"],
			[ 0x1F524 , "Input Latin Letters"],
			[ 0x1F197 , "OK Button"],
			[ 0x1F192 , "Cool Button"],
			[ 0x1F195 , "New Button"],
			
			[ 0x1F193 , "Free Button"],
			[ 0x1F199 , "Up! Button"],
			[ 0x1F523 , "Input Symbols"],
			[ 0x1F522 , "Input Numbers"],
			[ [0x23,0xFE0F,0x20E3] , "Keycap Number Sign"],
			[ [0x2A,0xFE0F,0x20E3] , "Keycap Asterisk"],
			[ [0x30,0xFE0F,0x20E3] , "Keycap Digit Zero"],
			[ [0x31,0xFE0F,0x20E3] , "Keycap Digit One"],
			[ [0x32,0xFE0F,0x20E3] , "Keycap Digit Two"],
			
			[ [0x33,0xFE0F,0x20E3] , "Keycap Digit Three"],
			[ [0x34,0xFE0F,0x20E3] , "Keycap Digit Four"],
			[ [0x35,0xFE0F,0x20E3] , "Keycap Digit Five"],
			[ [0x36,0xFE0F,0x20E3] , "Keycap Digit Six"],
			[ [0x37,0xFE0F,0x20E3] , "Keycap Digit Seven"],
			[ [0x38,0xFE0F,0x20E3] , "Keycap Digit Eight"],
			[ [0x39,0xFE0F,0x20E3] , "Keycap Digit Nine"],
			[ 0x1F51F , "Keycap Ten"],
			[ [0x2B06,0xFE0F] , "Up Arrow"],
				
			[ [0x2197,0xFE0F] , "Up-Right Arrow"],
			[ [0x27A1,0xFE0F] , "Right Arrow"],
			[ [0x2198,0xFE0F] , "Down-Right Arrow"],
			[ [0x2B07,0xFE0F] , "Down Arrow"],
			[ [0x2199,0xFE0F] , "Down-Left Arrow"],
			[ [0x2B05,0xFE0F] , "Left Arrow"],
			[ [0x2196,0xFE0F] , "Up-Left Arrow"],
			[ [0x2195,0xFE0F] , "Up-Down Arrow"],
			[ [0x2194,0xFE0F] , "Left-Right Arrow"],
			
			[ [0x21A9,0xFE0F] , "Right Arrow Curving Left"],
			[ [0x21AA,0xFE0F] , "Left Arrow Curving Right"],
			[ [0x2934,0xFE0F] , "Right Arrow Curving Up"],
			[ [0x2935,0xFE0F] , "Right Arrow Curving Down"],
			[ 0x1F503 , "Clockwise Vertical Arrows"],
			[ 0x1F504 , "Counterclockwise Arrows Button"],
			[ 0x1F519 , "Back Arrow"],
			[ 0x1F51A , "End Arrow"],
			[ 0x1F51B , "On! Arrow"],
			
			[ 0x1F51C , "Soon Arrow"],
			[ 0x1F51D , "Top Arrow"],
			[ 0x1F6D0 , "Place of Worship"],
			[ [0x269B,0xFE0F] , "Atom Symbol"],
			[ 0x1F549 , "Om"],
			[ [0x2721,0xFE0F] , "Star of David"],
			[ 0x1F52F , "Dotted Six-Pointed Star"],
			[ [0x2638,0xFE0F] , "Wheel of Dharma"],
			[ [0x262F,0xFE0F] , "Yin Yang"],
			
			[ [0x271D,0xFE0F] , "Latin Cross"],
			[ [0x2626,0xFE0F] , "Orthodox Cross"],
			[ [0x262A,0xFE0F] , "Star and Crescent"],
			[ [0x262E,0xFE0F] , "Peace Symbol"],
			[ 0x1F54E , "Menorah"],
			[ [0x267E,0xFE0F] , "Infinity"],
			[ 0x1F194 , "ID Button"],
			[ [0x2716,0xFE0F] , "Heavy Multiplication X"],
			[ [0x2795,0xFE0F] , "Heavy Plus Sign"],
			
			[ [0x2796,0xFE0F] , "Heavy Minus Sign"],
			[ [0x2797,0xFE0F] , "Heavy Division Sign"],
			[ [0x3030,0xFE0F] , "Wavy Dash"],
			[ [0x27B0,0xFE0F] , "Curly Loop"],
			[ [0x27BF,0xFE0F] , "Double Curly Loop"],
			[ [0xA9,0xFE0F] , "Copyright"],
			[ [0xAE,0xFE0F] , "Registered"],
			[ [0x2122,0xFE0F] , "Trade Mark"],
			[ [0x1F441,0x200D,0x1F5E8] , "Eye in Speech Bubble"],
			
			[ [0x25AA,0xFE0F] , "Black Small Square"],
			[ [0x25FE,0xFE0F] , "Black Medium-Small Square"],
			[ [0x25FC,0xFE0F] , "Black Medium Square"],
			[ [0x2B1B,0xFE0F] , "Black Large Square"],
			[ 0x1F532 , "Black Square Button"],
			[ [0x26AA,0xFE0F] , "White Circle"],
			[ [0x26AB,0xFE0F] , "Black Circle"],
			[ 0x1F534, "Red Circle"],
			[ 0x1F535 , "Blue Circle"],
			
			[ [0x25AB,0xFE0F] , "White Small Square"],
			[ [0x25FD,0xFE0F] , "White Medium-Small Square"],
			[ [0x25FB,0xFE0F] , "White Medium Square"],
			[ [0x2B1C,0xFE0F] , "White Large Square"],
			[ 0x1F533 , "White Square Button"],
			[ 0x1F537 , "Large Blue Diamond"],
			[ 0x1F539 , "Small Blue Diamond"],
			[ 0x1F536 , "Large Orange Diamond"],
			[ 0x1F538 , "Small Orange Diamond"],
			
			[ 0x1F53B , "Red Triangle Pointed Down"],
			[ 0x1F53A , "Red Triangle Pointed Up"],
			[ 0x1F518 , "Radio Button"],
			[ [0x2665,0xFE0F] , "Heart Suit"],
			[ [0x2666,0xFE0F] , "Diamond Suit"],
			[ [0x2660,0xFE0F] , "Spade Suit"],
			[ [0x2663,0xFE0F] , "Club Suit"],
			[ [0x2648,0xFE0F] , "Aries"],
			[ [0x2649,0xFE0F] , "Taurus"],
			
			[ [0x264A,0xFE0F] , "Gemini"],
			[ [0x264B,0xFE0F] , "Cancer"],
			[ [0x264C,0xFE0F] , "Leo"],
			[ [0x264D,0xFE0F] , "Virgo"],
			[ [0x264E,0xFE0F] , "Libra"],
			[ [0x264F,0xFE0F] , "Scorpio"],
			[ [0x2650,0xFE0F] , "Sagittarius"],
			[ [0x2651,0xFE0F] , "Capricorn"],
			[ [0x2652,0xFE0F] , "Aquarius"],
			
			[ [0x2653,0xFE0F] , "Pisces"],
			[ [0x26CE,0xFE0F] , "Ophiuchus"],
			[ [0x2640,0xFE0F] , "Female Sign"],
			[ [0x2642,0xFE0F] , "Male Sign"],
			
			[ [0x26A2,0xFE0F] , "DOUBLED FEMALE SIGN"],
			[ [0x26A3,0xFE0F] , "DOUBLED MALE SIGN"],
			[ [0x26A4,0xFE0F] , "INTERLOCKED FEMALE AND MALE SIGN"],
			[ [0x26A5,0xFE0F] , "MALE AND FEMALE SIGN"],
			[ [0x26A6,0xFE0F] , "MALE WITH STROKE SIGN"],
			[ [0x26A7,0xFE0F] , "MALE WITH STROKE AND MALE AND FEMALE SIGN"],
			[ [0x26A8,0xFE0F] , "VERTICAL MALE WITH STROKE SIGN"],
			[ [0x26A9,0xFE0F] , "HORIZONTAL MALE WITH STROKE SIGN"],
			

		);


		Smiley.alltabs.AND_Flags = new Array(
			[ 0x2691 , "Flags"],

			
			[ 0x1F3C1 , "Chequered Flag"],
			[ 0x1F6A9 , "Triangular Flag"],
			[ 0x1F38C , "Crossed Flags"],
			[ 0x1F3F4 , "Black Flag"],
			[ 0x1F3F3 , "White Flag"],
			[ [0x1F3F3,0xFE0F,0x200D, 0x1F308] , "Rainbow Flag"],
			[ [0x1F3F4,0x200D, 0x2620, 0xFE0F] , "Pirate Flag"],
			[ [0x1F1E6,0x1F1E8] , "Flag: Ascension Island"],
			[ [0x1F1E6,0x1F1E9] , "Flag: Andorra"],
			
			[ [0x1F1E6,0x1F1EA] , "Flag: United Arab Emirates"],
			[ [0x1F1E6,0x1F1EB] , "Flag: Afghanistan"],
			[ [0x1F1E6,0x1F1EC] , "Flag: Antigua & Barbuda"],
			[ [0x1F1E6,0x1F1EE] , "Flag: Anguilla"],
			[ [0x1F1E6,0x1F1F1] , "Flag: Albania"],
			[ [0x1F1E6,0x1F1F2] , "Flag: Armenia"],
			[ [0x1F1E6,0x1F1F4] , "Flag: Angola"],
			[ [0x1F1E6,0x1F1F6] , "Flag: Antarctica"],
			[ [0x1F1E6,0x1F1F7] , "Flag: Argentina"],
			
			[ [0x1F1E6,0x1F1F8] , "Flag: American Samoa"],
			[ [0x1F1E6,0x1F1F9] , "Flag: Austria"],
			[ [0x1F1E6,0x1F1FA] , "Flag: Australia"],
			[ [0x1F1E6,0x1F1FC] , "Flag: Aruba"],
			[ [0x1F1E6,0x1F1FD] , "Flag: &#xC5;land Islands"],
			[ [0x1F1E6,0x1F1FF] , "Flag: Azerbaijan"],
			[ [0x1F1E7,0x1F1E6] , "Flag: Bosnia & Herzegovina"],
			[ [0x1F1E7,0x1F1E7] , "Flag: Barbados"],
			[ [0x1F1E7,0x1F1E9] , "Flag: Bangladesh"],
			
			[ [0x1F1E7,0x1F1EA] , "Flag: Belgium"],
			[ [0x1F1E7,0x1F1EB] , "Flag: Burkina Faso"],
			[ [0x1F1E7,0x1F1EC] , "Flag: Bulgaria"],
			[ [0x1F1E7,0x1F1ED] , "Flag: Bahrain"],
			[ [0x1F1E7,0x1F1EE] , "Flag: Burundi"],
			[ [0x1F1E7,0x1F1EF] , "Flag: Benin"],
			[ [0x1F1E7,0x1F1F2] , "Flag: Bermuda"],
			[ [0x1F1E7,0x1F1F3] , "Flag: Brunei"],
			[ [0x1F1E7,0x1F1F4] , "Flag: Bolivia"],
			
			[ [0x1F1E7,0x1F1F7] , "Flag: Brazil"],
			[ [0x1F1E7,0x1F1F8] , "Flag: Bahamas"],
			[ [0x1F1E7,0x1F1F9] , "Flag: Bhutan"],
			[ [0x1F1E7,0x1F1FB] , "Flag: Bouvet Island"],
			[ [0x1F1E7,0x1F1FC] , "Flag: Botswana"],
			[ [0x1F1E7,0x1F1FE] , "Flag: Belarus"],
			[ [0x1F1E7,0x1F1FF] , "Flag: Belize"],
			[ [0x1F1E8,0x1F1E6] , "Flag: Canada"],
			[ [0x1F1E8,0x1F1E8] , "Flag: Cocos (Keeling) Islands"],
			[ [0x1F1E8,0x1F1E9] , "Flag: Congo - Kinshasa"],
			
			[ [0x1F1E8,0x1F1EB] , "Flag: Central African Republic"],
			[ [0x1F1E8,0x1F1EC] , "Flag: Congo - Brazzaville"],
			[ [0x1F1E8,0x1F1ED] , "Flag: Switzerland"],
			[ [0x1F1E8,0x1F1EE] , "Flag: C&#xF4;te d&#x2019;Ivoire"],
			[ [0x1F1E8,0x1F1F0] , "Flag: Cook Islands"],
			[ [0x1F1E8,0x1F1F1] , "Flag: Chile"],
			[ [0x1F1E8,0x1F1F2] , "Flag: Cameroon"],
			[ [0x1F1E8,0x1F1F3] , "Flag: China"],
			[ [0x1F1E8,0x1F1F4] , "Flag: Colombia"],
			
			[ [0x1F1E8,0x1F1F5] , "Flag: Clipperton Island"],
			[ [0x1F1E8,0x1F1F7] , "Flag: Costa Rica"],
			[ [0x1F1E8,0x1F1FA] , "Flag: Cuba"],
			[ [0x1F1E8,0x1F1FB] , "Flag: Cape Verde"],
			[ [0x1F1E8,0x1F1FC] , "Flag: Cura&#xE7;ao"],
			[ [0x1F1E8,0x1F1FD] , "Flag: Christmas Island"],
			[ [0x1F1E8,0x1F1FE] , "Flag: Cyprus"],
			[ [0x1F1E8,0x1F1FF] , "Flag: Czechia"],
			[ [0x1F1E9,0x1F1EA] , "Flag: Germany"],
			
			[ [0x1F1E9,0x1F1EF] , "Flag: Djibouti"],
			[ [0x1F1E9,0x1F1F0] , "Flag: Denmark"],
			[ [0x1F1E9,0x1F1F2] , "Flag: Dominica"],
			[ [0x1F1E9,0x1F1F4] , "Flag: Dominican Republic"],
			[ [0x1F1E9,0x1F1FF] , "Flag: Algeria"],
			[ [0x1F1EA,0x1F1E8] , "Flag: Ecuador"],
			[ [0x1F1EA,0x1F1E9] , "Flag: Estonia"],
			[ [0x1F1EA,0x1F1EC] , "Flag: Egypt"],
			[ [0x1F1EA,0x1F1F7] , "Flag: Eritrea"],
			
			[ [0x1F1EA,0x1F1F8] , "Flag: Spain"],
			[ [0x1F1EA,0x1F1F9] , "Flag: Ethiopia"],
			[ [0x1F1EA,0x1F1FA] , "Flag: European Union"],
			[ [0x1F1EB,0x1F1EE] , "Flag: Finland"],
			[ [0x1F1EB,0x1F1EF] , "Flag: Fiji"],
			[ [0x1F1EB,0x1F1F2] , "Flag: Micronesia"],
			[ [0x1F1EB,0x1F1F4] , "Flag: Faroe Islands"],
			[ [0x1F1EB,0x1F1F7] , "Flag: France"],
			[ [0x1F1EC,0x1F1E6] , "Flag: Gabon"],
			
			[ [0x1F1EC,0x1F1E7] , "Flag: United Kingdom"],
			[ [0x1F1EC,0x1F1E9] , "Flag: Grenada"],
			[ [0x1F1EC,0x1F1EA] , "Flag: Georgia"],
			[ [0x1F1EC,0x1F1EC] , "Flag: Guernsey"],
			[ [0x1F1EC,0x1F1ED] , "Flag: Ghana"],
			[ [0x1F1EC,0x1F1EE] , "Flag: Gibraltar"],
			[ [0x1F1EC,0x1F1F1] , "Flag: Greenland"],
			[ [0x1F1EC,0x1F1F2] , "Flag: Gambia"],
			[ [0x1F1EC,0x1F1F3] , "Flag: Guinea"],
			
			[ [0x1F1EC,0x1F1F6] , "Flag: Equatorial Guinea"],
			[ [0x1F1EC,0x1F1F7] , "Flag: Greece"],
			[ [0x1F1EC,0x1F1F9] , "Flag: Guatemala"],
			[ [0x1F1EC,0x1F1FA] , "Flag: Guam"],
			[ [0x1F1EC,0x1F1FC] , "Flag: Guinea-Bissau"],
			[ [0x1F1EC,0x1F1FE] , "Flag: Guyana"],
			[ [0x1F1ED,0x1F1F0] , "Flag: Hong Kong SAR China"],
			[ [0x1F1ED,0x1F1F2] , "Flag: Heard & McDonald Islands"],
			[ [0x1F1ED,0x1F1F3] , "Flag: Honduras"],
			
			[ [0x1F1ED,0x1F1F7] , "Flag: Croatia"],
			[ [0x1F1ED,0x1F1F9] , "Flag: Haiti"],
			[ [0x1F1ED,0x1F1FA] , "Flag: Hungary"],
			[ [0x1F1EE,0x1F1E8] , "Flag: Canary Islands"],
			[ [0x1F1EE,0x1F1E9] , "Flag: Indonesia"],
			[ [0x1F1EE,0x1F1EA] , "Flag: Ireland"],
			[ [0x1F1EE,0x1F1F1] , "Flag: Israel"],
			[ [0x1F1EE,0x1F1F2] , "Flag: Isle of Man"],
			[ [0x1F1EE,0x1F1F3] , "Flag: India"],
			
			[ [0x1F1EE,0x1F1F4] , "Flag: British Indian Ocean Territory"],
			[ [0x1F1EE,0x1F1F6] , "Flag: Iraq"],
			[ [0x1F1EE,0x1F1F7] , "Flag: Iran"],
			[ [0x1F1EE,0x1F1F8] , "Flag: Iceland"],
			[ [0x1F1EE,0x1F1F9] , "Flag: Italy"],
			[ [0x1F1EF,0x1F1EA] , "Flag: Jersey"],
			[ [0x1F1EF,0x1F1F2] , "Flag: Jamaica"],
			[ [0x1F1EF,0x1F1F4] , "Flag: Jordan"],
			[ [0x1F1EF,0x1F1F5] , "Flag: Japan"],
			
			[ [0x1F1F0,0x1F1EA] , "Flag: Kenya"],
			[ [0x1F1F0,0x1F1EC] , "Flag: Kyrgyzstan"],
			[ [0x1F1F0,0x1F1ED] , "Flag: Cambodia"],
			[ [0x1F1F0,0x1F1EE] , "Flag: Kiribati"],
			[ [0x1F1F0,0x1F1F2] , "Flag: Comoros"],
			[ [0x1F1F0,0x1F1F3] , "Flag: St. Kitts & Nevis"],
			[ [0x1F1F0,0x1F1F5] , "Flag: North Korea"],
			[ [0x1F1F0,0x1F1F7] , "Flag: South Korea"],
			[ [0x1F1F0,0x1F1FC] , "Flag: Kuwait"],
			
			[ [0x1F1F0,0x1F1FE] , "Flag: Cayman Islands"],
			[ [0x1F1F0,0x1F1FF] , "Flag: Kazakhstan"],
			[ [0x1F1F1,0x1F1E6] , "Flag: Laos"],
			[ [0x1F1F1,0x1F1E7] , "Flag: Lebanon"],
			[ [0x1F1F1,0x1F1E8] , "Flag: St. Lucia"],
			[ [0x1F1F1,0x1F1EE] , "Flag: Liechtenstein"],
			[ [0x1F1F1,0x1F1F0] , "Flag: Sri Lanka"],
			[ [0x1F1F1,0x1F1F7] , "Flag: Liberia"],
			[ [0x1F1F1,0x1F1F8] , "Flag: Lesotho"],
			
			[ [0x1F1F1,0x1F1F9] , "Flag: Lithuania"],
			[ [0x1F1F1,0x1F1FA] , "Flag: Luxembourg"],
			[ [0x1F1F1,0x1F1FB] , "Flag: Latvia"],
			[ [0x1F1F1,0x1F1FE] , "Flag: Libya"],
			[ [0x1F1F2,0x1F1E6] , "Flag: Morocco"],
			[ [0x1F1F2,0x1F1E8] , "Flag: Monaco"],
			[ [0x1F1F2,0x1F1E9] , "Flag: Moldova"],
			[ [0x1F1F2,0x1F1EA] , "Flag: Montenegro"],
			[ [0x1F1F2,0x1F1EC] , "Flag: Madagascar"],
			
			[ [0x1F1F2,0x1F1ED] , "Flag: Marshall Islands"],
			[ [0x1F1F2,0x1F1F0] , "Flag: North Macedonia"],
			[ [0x1F1F2,0x1F1F1] , "Flag: Mali"],
			[ [0x1F1F2,0x1F1F2] , "Flag: Myanmar (Burma)"],
			[ [0x1F1F2,0x1F1F3] , "Flag: Mongolia"],
			[ [0x1F1F2,0x1F1F4] , "Flag: Macau Sar China"],
			[ [0x1F1F2,0x1F1F5] , "Flag: Northern Mariana Islands"],
			[ [0x1F1F2,0x1F1F7] , "Flag: Mauritania"],
			[ [0x1F1F2,0x1F1F8] , "Flag: Montserrat"],
			
			[ [0x1F1F2,0x1F1F9] , "Flag: Malta"],
			[ [0x1F1F2,0x1F1FA] , "Flag: Mauritius"],
			[ [0x1F1F2,0x1F1FB] , "Flag: Maldives"],
			[ [0x1F1F2,0x1F1FC] , "Flag: Malawi"],
			[ [0x1F1F2,0x1F1FD] , "Flag: Mexico"],
			[ [0x1F1F2,0x1F1FE] , "Flag: Malaysia"],
			[ [0x1F1F2,0x1F1FF] , "Flag: Mozambique"],
			[ [0x1F1F3,0x1F1E6] , "Flag: Namibia"],
			[ [0x1F1F3,0x1F1EA] , "Flag: Niger"],
			
			[ [0x1F1F3,0x1F1EB] , "Flag: Norfolk Island"],
			[ [0x1F1F3,0x1F1EC] , "Flag: Nigeria"],
			[ [0x1F1F3,0x1F1EA] , "Flag: Nicaragua"],
			[ [0x1F1F3,0x1F1F1] , "Flag: Netherlands"],
			[ [0x1F1F3,0x1F1F4] , "Flag: Norway"],
			[ [0x1F1F3,0x1F1F5] , "Flag: Nepal"],
			[ [0x1F1F3,0x1F1F7] , "Flag: Nauru"],
			[ [0x1F1F3,0x1F1FA] , "Flag: Niue"],
			[ [0x1F1F3,0x1F1FF] , "Flag: New Zealand"],
			
			[ [0x1F1F4,0x1F1F2] , "Flag: Oman"],
			[ [0x1F1F5,0x1F1E6] , "Flag: Panama"],
			[ [0x1F1F5,0x1F1EA] , "Flag: Peru"],
			[ [0x1F1F5,0x1F1EB] , "Flag: French Polynesia"],
			[ [0x1F1F5,0x1F1EC] , "Flag: Papua New Guinea"],
			[ [0x1F1F5,0x1F1ED] , "Flag: Philippines"],
			[ [0x1F1F5,0x1F1F0] , "Flag: Pakistan"],
			[ [0x1F1F5,0x1F1F1] , "Flag: Poland"],
			[ [0x1F1F5,0x1F1F3] , "Flag: Pitcairn Islands"],
			
			[ [0x1F1F5,0x1F1F7] , "Flag: Puerto Rico"],
			[ [0x1F1F5,0x1F1F8] , "Flag: Palestinian Territories"],
			[ [0x1F1F5,0x1F1F9] , "Flag: Portugal"],
			[ [0x1F1F5,0x1F1FC] , "Flag: Palau"],
			[ [0x1F1F5,0x1F1FE] , "Flag: Paraguay"],
			[ [0x1F1F6,0x1F1E6] , "Flag: Qatar"],
			[ [0x1F1F7,0x1F1F4] , "Flag: Romania"],
			[ [0x1F1F7,0x1F1F8] , "Flag: Serbia"],
			[ [0x1F1F7,0x1F1FA] , "Flag: Russia"],
			
			[ [0x1F1F7,0x1F1FC] , "Flag: Rwanda"],
			[ [0x1F1F8,0x1F1E6] , "Flag: Saudi Arabia"],
			[ [0x1F1F8,0x1F1E7] , "Flag: Solomon Islands"],
			[ [0x1F1F8,0x1F1E8] , "Flag: Seychelles"],
			[ [0x1F1F8,0x1F1E9] , "Flag: Sudan"],
			[ [0x1F1F8,0x1F1EA] , "Flag: Sweden"],
			[ [0x1F1F8,0x1F1EC] , "Flag: Singapore"],
			[ [0x1F1F8,0x1F1ED] , "Flag: St. Helena"],
			[ [0x1F1F8,0x1F1EE] , "Flag: Slovenia"],
			
			[ [0x1F1F8,0x1F1EF] , "Flag: Svalbard & Jan Mayen"],
			[ [0x1F1F8,0x1F1F0] , "Flag: Slovakia"],
			[ [0x1F1F8,0x1F1F1] , "Flag: Sierra Leone"],
			[ [0x1F1F8,0x1F1F2] , "Flag: San Marino"],
			[ [0x1F1F8,0x1F1F3] , "Flag: Senegal"],
			[ [0x1F1F8,0x1F1F4] , "Flag: Somalia"],
			[ [0x1F1F8,0x1F1F7] , "Flag: Suriname"],
			[ [0x1F1F8,0x1F1F8] , "Flag: South Sudan"],
			[ [0x1F1F8,0x1F1F9] , "Flag: S&#xE3;o Tom&#xE9; &#x26; Pr&#xED;ncipe"],
			
			[ [0x1F1F8,0x1F1FB] , "Flag: El Salvador"],
			[ [0x1F1F8,0x1F1FD] , "Flag: Sint Maarten"],
			[ [0x1F1F8,0x1F1FE] , "Flag: Syria"],
			[ [0x1F1F8,0x1F1FF] , "Flag: Swaziland"],
			[ [0x1F1F9,0x1F1E6] , "Flag: Tristan Da Cunha"],
			[ [0x1F1F9,0x1F1E8] , "Flag: Turks & Caicos Islands"],
			[ [0x1F1F9,0x1F1E9] , "Flag: Chad"],
			[ [0x1F1F9,0x1F1EC] , "Flag: Togo"],
			[ [0x1F1F9,0x1F1ED] , "Flag: Thailand"],
			
			[ [0x1F1F9,0x1F1EF] , "Flag: Tajikistan"],
			[ [0x1F1F9,0x1F1F0] , "Flag: Tokelau"],
			[ [0x1F1F9,0x1F1F1] , "Flag: Timor-Leste"],
			[ [0x1F1F9,0x1F1F2] , "Flag: Turkmenistan"],
			[ [0x1F1F9,0x1F1F3] , "Flag: Tunisia"],
			[ [0x1F1F9,0x1F1F4] , "Flag: Tonga"],
			[ [0x1F1F9,0x1F1F7] , "Flag: Turkey"],
			[ [0x1F1F9,0x1F1F9] , "Flag: Trinidad & Tobago"],
			[ [0x1F1F9,0x1F1FB] , "Flag: Tuvalu"],
			
			[ [0x1F1F9,0x1F1FC] , "Flag: Taiwan"],
			[ [0x1F1F9,0x1F1FF] , "Flag: Tanzania"],
			[ [0x1F1FA,0x1F1E6] , "Flag: Ukraine"],
			[ [0x1F1FA,0x1F1EC] , "Flag: Uganda"],
			[ [0x1F1FA,0x1F1F2] , "Flag: U.S. Outlying Islands"],
			[ [0x1F1FA,0x1F1F3] , "Flag: United Nations"],
			[ [0x1F1FA,0x1F1F8] , "Flag: United States"],
			[ [0x1F1FA,0x1F1FE] , "Flag: Uruguay"],
			[ [0x1F1FA,0x1F1FF] , "Flag: Uzbekistan"],
			
			[ [0x1F1FB,0x1F1E6] , "Flag: Vatican City"],
			[ [0x1F1FB,0x1F1E8] , "Flag: St. Vincent & Grenadines"],
			[ [0x1F1FB,0x1F1EA] , "Flag: Venezuela"],
			[ [0x1F1FB,0x1F1EC] , "Flag: British Virgin Islands"],
			[ [0x1F1FB,0x1F1EE] , "Flag: U.S. Virgin Islands"],
			[ [0x1F1FB,0x1F1F3] , "Flag: Vietnam"],
			[ [0x1F1FB,0x1F1FA] , "Flag: Vanuatu"],
			[ [0x1F1FC,0x1F1F8] , "Flag: Samoa"],
			[ [0x1F1FE,0x1F1EA] , "Flag: Yemen"],
			
			[ [0x1F1FF,0x1F1E6] , "Flag: South Africa"],
			[ [0x1F1FF,0x1F1FC] , "Flag: Zimbabwe"],
			[ [0x1F3F4,0xE0067,0xE0062,0xE0065,0xE006E,0xE0067,0xE007F] , "Flag: England"],
			[ [0x1F3F4,0xE0067,0xE0062,0xE0073,0xE0063,0xE0074,0xE007F] , "Flag: Scotland"],
			[ [0x1F3F4,0xE0067,0xE0062,0xE0077,0xE006C,0xE0073,0xE007F] , "Flag: Wales"],
			
			[ 0x26FF , "WHITE FLAG WITH HORIZONTAL MIDDLE BLACK STRIPE"],
			[ 0x1F3F1 , "WHITE PENNANT"],
			[ 0x1F3F2 , "BLACK PENNANT"],
		);

		Smiley.alltabs.AND_EXT_Symbols = new Array(
			[ 0x2692 , "Symbols"],	 

			[ 0 , "Map and Taffic Symbols"],
			[ 0x2690 , "WHITE FLAG"],
			[ 0x2691 , "BLACK FLAG"],
			[ 0x2692 , "HAMMER AND PICK"],
			[ 0x2693 , "ANCHOR"],
			[ 0x2694 , "CROSSED SWORDS"],
			[ 0x2695 , "STAFF OF AESCULAPIUS"],
			[ 0x2696 , "SCALES"],
			[ 0x2697 , "ALEMBIC"],
			[ 0x2698 , "FLOWER"],
			[ 0x2699 , "GEAR"],
			[ 0x269A , "STAFF OF HERMES"],
			[ 0x269B , "ATOM SYMBOL"],
			[ 0x26E3 , "HEAVY SIRCLE WITH STROKE AND TWO DOTS ABOVE"],
			[ 0x26E8 , "BLACK CROSS ON SHIELD"],
			[ 0x26E9 , "SHINTO SHRINE"],
			[ 0x26EA , "CHURCH"],
			[ 0x26EB , "CASTLE"],
			[ 0x26EC , "HISTORIC SITE"],
			[ 0x26ED , "GEAR WITHOUT HUB"],
			[ 0x26EE , "GEAR WITH HANDLES"],
			[ 0x26EF , "MAP SYMBOL FOR LIGHTHOUSE"],
			[ 0x26F0 , "MOUNTAIN"],
			[ 0x26F1 , "UMBRELLA ON GROUND"],
			[ 0x26F2 , "FOUNTAIN"],
			[ 0x26F3 , "FLAG IN HOLE"],
			[ 0x26F4 , "FERRY"],
			[ 0x26F5 , "SAILBOAT"],
			[ 0x26F6 , "SQUARE FOUR CORNERS"],
			[ 0x26F7 , "SKIER"],
			[ 0x26F8 , "ICE SKATE"],
			[ 0x26F9 , "PERSON WITH BALL"],
			[ 0x26FA , "TENT"],
			[ 0x26FB , "JAPANESE BANK SYMBOL"],
			[ 0x26FC , "HEADSTONE GRAVEYARD SYMBOL"],
			[ 0x26FD , "FUEL PUMP"],
			[ 0x26FE , "CUP ON BLACK SQUARE"],
			[ 0x26FF , "WHITE FLAG WITH HORIZONTAL MIDDLE BLACK STRIPE"],
			[ 0x2668 , "HOT SPRINGS"],
			
			[ 0 , ""],
			[ 0x26CC , "CROSSING LANES"],
			[ 0x26CD , "DISABLED CAR"],
			[ 0x26CF , "PICK"],
			[ 0x26D0 , "CAR SLIDING"],
			[ 0x26D1 , "HELMET WITH WHITE CROSS"],
			[ 0x26D2 , "CIRCLED CROSSING LANES"],
			[ 0x26D3 , "CHAINS"],
			[ 0x26D4 , "NO ENTRY"],
			[ 0x26D5 , "ALTERNATE ONE-WAY LEFT TRAFFIC"],
			[ 0x26D6 , "BLACK TWO-WAY LEFT WAY TRAFFIC"],
			[ 0x26D7 , "WHITE TWO-WAY LEFT WAY TRAFFIC"],
			[ 0x26D8 , "BLACK LEFT LANE MERGE"],
			[ 0x26D9 , "WHITE LEFT LANE MERGE"],
			[ 0x26DA , "DRIVE SLOW SIGN"],
			[ 0x26DB , "HEAVY WHITE DOWN-POINTING TRIANGLE"],
			[ 0x26DC , "LEFT CLOSED ENTRY"],
			[ 0x26DD , "SQUARED SALTIRE"],
			[ 0x26DE , "FALLING DIAGONAL IN WHITE CIRCLE IN BLACK SQUARE"],
			[ 0x26DF , "BLACK TRUCK"],
			[ 0x26E0 , "RESTRICTED LEFT ENTRY-1"],
			[ 0x26E1 , "RESTRICTED LEFT ENTRY-2"],


			[ 0 , "Signs and Symbols"],
			[ 0x1F6A5 , "HORIZONTAL TRAFFIC LIGHT"],
			[ 0x1F6A6 , "VERTICAL TRAFFIC LIGHT"],
			[ 0x1F6A7 , "CONSTRUCTION SIGN"],
			[ 0x1F6A8 , "POLICE CARS REVOLVING LIGHT"],
			[ 0x1F6A9 , "TRIANGULAR FLAG ON POST"],
			[ 0x26F3 ,  "FLAG IN HOLE"],
			[ 0x1F6AA , "DOOR"],
			[ 0x1F6AB , "NO ENTRY SIGN"],
			[ 0x26D4 ,  "NO ENTRY"],
			[ 0x1F6AC , "SMOKING SYMBOL"],
			[ 0x1F6AD , "NO SMOKING SYMBOL"],
			[ 0x1F6AE , "PUT LITTER IN ITS PLACE SYMBOL"],
			[ 0x1F6AF , "DO NOT LITTER SYMBOL"],
			[ 0x1F6B0 , "POTABLE WATER SYMBOL"],
			[ 0x1F6B1 , "NON-POTABLE WATER SYMBOL"],
			[ 0x1F6B2 , "BICYCLE"],
			[ 0x1F6B3 , "NO BICYCLES"],
			[ 0x1F6B4 , "BICYCLIST"],
			[ 0x1F6B5 , "MOUNTAIN BICYCLIST"],
			[ 0x1F6B6 , "PEDESTRIAN"],
			[ 0x1F6B7 , "NO PEDESTRIANS"],
			[ 0x1F6B8 , "CHILDREN CROSSING"],
			[ 0x1F6B9 , "MENS SYMBOL"],
			[ 0x1F6BA , "WOMENS SYMBOL"],
			[ 0x1F6BB , "RESTROOM"],
			[ 0x1F6BC , "BABY SYMBOL"],
			[ 0x1F6BD , "TOILET"],
			[ 0x1F6BE , "WATER CLOSET"],
			[ 0x1F6BF , "SHOWER"],
			[ 0x1F6C0 , "BATH"],
			[ 0x1F6C1 , "BATHTUB"],
			[ 0x1F6C2 , "PASSPORT CONTROL"],
			[ 0x1F6C3 , "CUSTOMS"],
			[ 0x1F6C4 , "BAGGAGE CLAIM"],
			[ 0x1F6C5 , "LEFT LUGGAGE"],
			[ 0x2706 , "TELEPHONE LOCATION SIGN"],
			[ 0x267F , "WHEELCHAIR SYMBOL"],
			
			[ 0 , "Cultural Symbols" ], 
			[ 0x1F5FB , "MOUNT FUJI"],
			[ 0x1F5FC , "TOYKO TOWER"],
			[ 0x1F5FD , "STATUE OF LIBERTY"],
			[ 0x1F5FE , "SILHOUETTE OF JAPAN"],
			[ 0x1F5FF , "MOYAI"],


			[ 0 , "Weather, Landscape and Sky"],

			[ 0x1F300 , "CYCLONE"],
			[ 0x26C6 , "RAIN"],
			[ 0x1F301 , "FOGGY"],
			[ 0x2602 ,  "UMBRELLA"],
			[ 0x2614 ,  "UMBRELLA WITH RAIN DROPS"],
			[ 0x1F302 , "CLOSED UMBRELLA"],
			[ 0x2601 ,  "CLOUD"],
			[ 0x26C5 ,  "SUN BEHIND CLOUD"],
			[ 0x2603 ,  "SNOWMAN"],
			[ 0x26C4 ,  "SNOWMAN WITHOUT SNOW"],
			[ 0x26C7 ,  "BLACK SNOWMAN"],
			[ 0x2607 ,  "LIGHTNING"],
			[ 0x2608 ,  "THUNDERSTORM"],
			[ 0x26C8 ,  "THUNDER CLOUD AND RAIN"],
			[ 0x1F303 , "NIGHT WITH STARS"],
			[ 0x1F304 , "SUNRISE OVER MOUNTAINS"],
			[ 0x1F305 , "SUNRISE"],
			[ 0x1F306 , "CITYSCAPE AT DUSK"],
			[ 0x1F307 , "SUNSET OVER BUILDINGS"],
			[ 0x1F308 , "RAINBOW"],
			[ 0x1F309 , "BRIDGE AT NIGHT"],
			[ 0x1F30A , "WATER WAVE"],
			[ 0x1F30B , "VOLCANO"],
			[ 0x1F30C , "MILKY WAY"],
			[ 0 , "Globes" ],  
			[ 0x1F30D , "EARTH GLOBE EUROPE-AFRICA"],
			[ 0x1F30E , "EARTH GLOBE AMERICAS"],
			[ 0x1F30F , "EARTH GLOBE ASIA-AUSTRALIA"],
			[ 0x1F310 , "GLOBE WITH MERIDIANS"],
			[ 0 , "Astronomy" ],  
			[ 0x1F311 , "NEW MOON SYMBOL"],
			[ 0x1F312 , "WAXING CRESCENT MOON SYMBOL"],
			[ 0x1F313 , "FIRST QUARTER MOON SYMBOL"],
			[ 0x1F314 , "WAXING GIBBOUS MOON SYMBOL"],
			[ 0x1F315 , "FULL MOON SYMBOL"],
			[ 0x1F316 , "WANING GIBBOUS MOON SYMBOL"],
			[ 0x1F317 , "LAST QUARTER MOON SYMBOL"],
			[ 0x1F318 , "WANING CRESCENT MOON SYMBOL"],
			[ 0x1F319 , "CRESCENT MOON"],
			[ 0x263D ,  "FIRST QUARTER MOON"],
			[ 0x263E ,  "LAST QUARTER MOON"],
			
			[ 0x1F31F , "GLOWING STAR"],
			[ 0x1F320 , "SHOOTING STAR"],
			[ 0x2604 ,  "COMET"],
			[ 0x2605 ,  "BLACK STAR"],
			[ 0x2606 ,  "WHITE STAR"],
			[ 0x2600 ,  "BLACK SUN WITH RAYS"],
			[ 0x263C ,  "WHITE SUN WITH RAYS"],
			[ 0 , "" ],
			[ 0x2609 ,  "SUN"],
			[ 0x260A ,  "ASCENDING NODE"],
			[ 0x260B ,  "DESCENDING NODE"],
			[ 0x260C ,  "CONJUNCTION"],
			[ 0x260D ,  "OPPOSITION"],

			
			[ 0x1F4B0 , "MONEY BAG"],
			[ 0x1F4B1 , "CURRENCY EXCHANGE"],
			[ 0x1F4B2 , "HEAVY DOLLAR SIGN"],
			[ 0x1F4B3 , "CREDIT CARD"],
			[ 0x1F4B4 , "BANKNOTE WITH YEN SIGN"],
			[ 0x1F4B5 , "BANKNOTE WITH DOLLAR SIGN"],
			[ 0x1F4B6 , "BANKNOTE WITH EURO SIGN"],
			[ 0x1F4B7 , "BANKNOTE WITH POUND SIGN"],
			[ 0x1F4B8 , "MONEY WITH WINGS"],
			[ 0x1F4B9 , "CHART WITH UPWARDS TREND AND YEN SIGN"],
			[ 0x1F3E7 , "AUTOMATED TELLER MACHINE"],
			
			[ 0 , "Currency Symbols" ],
			[ 0x0024 , "DOLLAR SIGN"],
			[ 0x00A2 , "CENT SIGN"],
			[ 0x00A3 , "POUND SIGN"],
			[ 0x00A4 , "CURRENCY SIGN"],
			[ 0x00A5 , "YEN SIGN"],
			[ 0x0192 , "LATIN SMALL LETTER F WITH HOOK"],
			[ 0x060B , "AFGHANI SIGN"],
			[ 0x09F2 , "BENGALI RUPEE MARK"],
			[ 0x09F3 , "BENGALI RUPEE SIGN"],
			[ 0x0AF1 , "GUJARATI RUPEE SIGN"],
			[ 0x0BF9 , "TAMIL RUPEE SIGN"],
			[ 0x0E3F , "THAI CURRENCY SYMBOL BAHT"],
			[ 0x17DB , "KHMER CURRENCY SYMBOL RIEL"],
			[ 0x2133 , "SCRIPT CAPITAL M"],
			[ 0x5143 , "CJK UNIFIED IDEOGRAPH-5143"],
			[ 0x5186 , "CJK UNIFIED IDEOGRAPH-5186"],
			[ 0x5706 , "CJK UNIFIED IDEOGRAPH-5706"],
			[ 0x5713 , "CJK UNIFIED IDEOGRAPH-5713"],
			[ 0xFDFC , "RIAL SIGN"],
			
			[ 0x20A0 , "EURO_CURRENCY SIGN"],
			[ 0x20A1 , "COLON SIGN"],
			[ 0x20A2 , "CRUZEIRO SIGN"],
			[ 0x20A3 , "FRENCH FRANC SIGN"],
			[ 0x20A4 , "LIRA SIGN"],
			[ 0x20A5 , "MILL SIGN"],
			[ 0x20A6 , "NAIRA SIGN"],
			[ 0x20A7 , "PESETA SIGN"],
			[ 0x20A8 , "RUPEE SIGN"],
			[ 0x20A9 , "WON SIGN"],
			[ 0x20AA , "NEW SHEQEL SIGN"],
			[ 0x20AB , "DONG SIGN"],
			[ 0x20AC , "EURO SIGN"],
			[ 0x20AD , "KIP SIGN"],
			[ 0x20AE , "TUGRIK SIGN"],
			[ 0x20AF , "DRACHMA SIGN"],
			[ 0x20B0 , "GERMAN PENNY SIGN"],
			[ 0x20B1 , "PESO SIGN"],
			[ 0x20B2 , "GUARANI SIGN"],
			[ 0x20B3 , "AUSTRAL SIGN"],
			[ 0x20B4 , "HRYVNIA SIGN"],
			[ 0x20B5 , "CEDI SIGN"],
			[ 0x20B6 , "LIVRE TOURNOIS SIGN"],
			[ 0x20B7 , "SPESMILO SIGN"],
			[ 0x20B8 , "TENGE SIGN"],
			[ 0x20B9 , "INDIAN RUPEE SIGN"],
			[ 0x20BA , "TURKISH LIRA SIGN"],
			
			[ 0 , "Check OCR Characters" ],
			[ 0x2446 , "OCR BRANCH BANK IDENTIFICATION"],
			[ 0x2447 , "OCR AMOUNT OF CHECK"],
			[ 0x2448 , "OCR DASH"],
			[ 0x2449 , "OCR CUSTOMER ACCOUNT NUMBER"],
			
			
			[ 0 , "Tools"],	 
			  
			[ 0x1F525 , "FIRE"],
			[ 0x1F526 , "ELECTRIC TORCH"],
			[ 0x1F527 , "WRENCH"],
			[ 0x1F528 , "HAMMER"],
			[ 0x1F529 , "NUT AND BOLT"],
			[ 0x1F52A , "HOCHO"],
			[ 0x1F52B , "PISTOL"],
			[ 0x1F52C , "MICROSCOPE"],
			[ 0x1F52D , "TELESCOPE"],
			[ 0x1F52E , "CRYSTAL BALL"],
			[ 0x1F52F , "SIX POINTED STAR WITH MIDDLE DOT"],
			[ 0x1F530 , "JAPANESE SYMBOL FOR BEGINNER"],
			[ 0x1F531 , "TRIDENT EMBLEM"],
			
			
			[ 0 , "Medical and Warning Symbols"],	 

			[ 0x1F489 , "SYRINGE"],
			[ 0x1F48A , "PILL"],
			[ 0x2624 , "CADUCEUS"],
			[ 0x2695 , "STAFF OF AESCULAPIUS"],
			[ 0x2625 , "ANKH"],
			[ 0 , "" ],
			[ 0x2620 , "SKULL AND CROSSBONES"],
			[ 0x2621 , "CAUTION SING"],
			[ 0x2622 , "RADIOACTIVE SIGN"],
			[ 0x2623 , "BIOHAZARD SIGN"],
			[ 0x26A0 , "WARNING SIGN"],
			[ 0x26A1 , "HIGH VOLTAGE SIGN"],
			
			
			[ 0 , "Religious and Political Symbols"],	 

			[ 0x2719 , "OUTLINED GREEK CROSS"],
			[ 0x271A , "HEAVY GREEK CROSS"],
			[ 0x271B , "OPEN CENTRE CROSS"],
			[ 0x271C , "HEAVY OPEN CENTRE CROSS"],
			[ 0x271D , "LATIN CROSS"],
			[ 0x271E , "SHADOWED WHITE LATIN CROSS"],
			[ 0x271F , "OUTLINED LATIN CROSS"],
			[ 0x2720 , "MALTESE CROSS"],
			[ 0x2721 , "STAR OF DAVID"],
			
			[ 0x2626 , "ORTHODOX CROSS"],
			[ 0x2627 , "CHI RHO"],
			[ 0x2628 , "CROSS OF LORRAINE"],
			[ 0x2629 , "CROSS OF JERUSALEM"],
			[ 0x2613 , "SALTIRE"],
			[ 0x1F540, "CIRCLED CROSS POMMEE"],
			[ 0x1F541, "CROSS POMMEE WITH HALF-CIRCLE BELOW"],
			[ 0x1F542, "CROSS POMMEE"],
			[ 0x1F543, "NOTCHED LEFT SEMICIRCLE WITH THREE DOTS"],
			[ 0x2638 , "WHEEL OF DHARMA"],
			[ 0x2670 , "WEST SYRIAC CROSS"],
			[ 0x2671 , "EAST SYRIAC CROSS"],
			[ 0 , "" ],
			[ 0x268A , "MONOGRAM FOR YANG"],
			[ 0x268B , "MONOGRAM FOR YIN"],
			[ 0x268C , "DIGRAM FOR GREATER YANG"],
			[ 0x268D , "DIGRAM FOR LESSER YIN"],
			[ 0x268E , "DIGRAM FOR LESSER YANG"],
			[ 0x268F , "DIGRAM FOR MOUNTAIN"],
			[ 0x2630 , "TRIGRAM FOR GREATER YIN"],
			[ 0x2631 , "TRIGRAM FOR LAKE"],
			[ 0x2632 , "TRIGRAM FOR FIRE"],
			[ 0x2633 , "TRIGRAM FOR THUNDER"],
			[ 0x2634 , "TRIGRAM FOR WIND"],
			[ 0x2635 , "TRIGRAM FOR WATER"],
			[ 0x2636 , "TRIGRAM FOR MOUNTAIN"],
			[ 0x2637 , "TRIGRAM FOR EARTH"],
			[ 0 , "" ],
			[ 0x262A , "STAR AND CRESENT"],
			[ 0x262B , "FARSI SYMBOL"],
			[ 0x262C , "ADI SHAKTI"],
			[ 0x262D , "HAMMER AND SICKLE"],
			[ 0x262E , "PEACE SYMBOL"],
			[ 0x262F , "YIN YANG"],
			[ 0x269C , "FLEUR-DE-LIS"],
			[ 0x269D , "OUTLINED WHITE STAR"],
			[ 0 , "" ],
			[ 0x2610 , "BALLOT BOX"],
			[ 0x2611 , "BALLOT BOX WITH CHECK"],
			[ 0x2612 , "BALLOT BOX WITH X"],
			[ 0x2717 , "BALLOT X"],
			[ 0 , "" ],
			[ 0x26E4 , "PENTAGRAM"],
			[ 0x26E5 , "RIGHT-HANDED INTERLACED PENTAGRAM"],
			[ 0x26E6 , "LEFT-HANDED INTERLACED PENTAGRAM"],
			[ 0x26E7 , "INVERTED PENTAGRAM"],
			  

			[ 0 , "Astrological and Zodiac Symbols"],	 

			[ 0x263D , "FIRST QUARTER MOON"],
			[ 0x263E , "LAST QUARTER MOON"],
			[ 0x263F , "MERCURY"],
			[ 0x2640 , "VENUS"],
			[ 0x2641 , "EARTH"],
			[ 0x2642 , "MARS"],
			[ 0x2643 , "JUPITER"],
			[ 0x2644 , "SATURN"],
			[ 0x2645 , "URANUS"],
			[ 0x26E2 , "ASTRONOMICAL SYMBOL FOR URANUS"],
			[ 0x2646 , "NEPTUNE"],
			[ 0x2647 , "PLUTO"],
			[ 0 , "" ],
			[ 0x2648 , "ARIES"],
			[ 0x2649 , "TAURUS"],
			[ 0x264A , "GEMINI"],
			[ 0x264B , "CANCER"],
			[ 0x264C , "LEO"],
			[ 0x264D , "VIRGO"],
			[ 0x264E , "LIBRA"],
			[ 0x264F , "SCORPUS"],
			[ 0x2650 , "SAGITTARIUS"],
			[ 0x2651 , "CAPRICORN"],
			[ 0x2652 , "AQUARIUS"],
			[ 0x2653 , "PICES"],
			[ 0 , "" ],
			[ 0x26B3 , "CERES"],
			[ 0x26B4 , "PALLAS"],
			[ 0x26B5 , "JUNO"],
			[ 0x26B6 , "VESTA"],
			[ 0x26B7 , "CHIRON"],
			[ 0x26B8 , "BLACK MOON LILITH"],
			[ 0x26B9 , "SEXTILE"],
			[ 0x26BA , "SEMISEXTILE"],
			[ 0x26BB , "QUINCUNX"],
			[ 0x26BC , "SESQUIQUADRATE"],
			[ 0x26CE , "OPHICHUS"],
			
			[ 0 , "Recycling Symbols"],	 

			[ 0x2672 , "UNIVERSAL RECYCLING SYMBOL"],
			[ 0x2673 , "RECYCLING SYMBOL FOR TYPE-1 PLASTICS"],
			[ 0x2674 , "RECYCLING SYMBOL FOR TYPE-2 PLASTICS"],
			[ 0x2675 , "RECYCLING SYMBOL FOR TYPE-3 PLASTICS"],
			[ 0x2676 , "RECYCLING SYMBOL FOR TYPE-4 PLASTICS"],
			[ 0x2677 , "RECYCLING SYMBOL FOR TYPE-5 PLASTICS"],
			[ 0x2678 , "RECYCLING SYMBOL FOR TYPE-6 PLASTICS"],
			[ 0x2679 , "RECYCLING SYMBOL FOR TYPE-7 PLASTICS"],
			[ 0x267A , "RECYCLING SYMBOL FOR GENERIC MATERIALS"],
			[ 0x267B , "BLACK UNIVERSAL RECYCLING SYMBOL"],
			[ 0x267C , "RECYCLED PAPER SYMBOL"],
			[ 0x267D , "PARTIALLY-RECYCLED PAPER SYMBOL"],
			[ 0x267E , "PERMANENT PAPER SIGN"],
			
			[ 0 , "Genealogical and Gender Symbols"],	 

			[ 0x26AD , "MARRIAGE SYMBOL"],
			[ 0x26AE , "DIVORSE SYMBOL"],
			[ 0x26AF , "UNMARRIED PARTNERSHIP SYMBOL"],
			[ 0x26B0 , "COFFIN"],
			[ 0x26B1 , "FUNERAL URN"],
			[ 0 , ""],
			[ 0x2640 , "FEMALE SIGN"],
			[ 0x2642 , "MALE SIGN"],
			[ 0x26A2 , "DOUBLED FEMALE SIGN"],
			[ 0x26A3 , "DOUBLED MALE SIGN"],
			[ 0x26A4 , "INTERLOCKED FEMALE AND MALE SIGN"],
			[ 0x26A5 , "MALE AND FEMALE SIGN"],
			[ 0x26A6 , "MALE WITH STROKE SIGN"],
			[ 0x26A7 , "MALE WITH STROKE AND MALE AND FEMALE SIGN"],
			[ 0x26A8 , "VERTICAL MALE WITH STROKE SIGN"],
			[ 0x26A9 , "HORIZONTAL MALE WITH STROKE SIGN"],
			[ 0x26B2 , "NEUTER"],
			
			  
			[ 0 , "Letter-Like Symbols"],
			  
			[ 0x2100 , "ACCOUNT OF"],
			[ 0x2101 , "ADDRESSED TO THE SUBJECT"],
			[ 0x2102 , "DOUBLE-STRUCK CAPITAL C"],
			[ 0x2103 , "DEGREE CELSIUS"],
			[ 0x2104 , "CENTRE LINE SYMBOL"],
			[ 0x2105 , "CARE OF"],
			[ 0x2106 , "CADA UNA"],
			[ 0x2107 , "EULER CONSTANT"],
			[ 0x2108 , "SCRUPLE"],
			[ 0x2109 , "DEGREE FAHRENHEIT"],
			[ 0x210A , "SCRIPT SMALL G"],
			[ 0x210B , "SCRIPT CAPITAL H"],
			[ 0x210C , "BLACK-LETTER CAPITAL H"],
			[ 0x210D , "DOUBLE-STRUCK CAPITAL H"],
			[ 0x210E , "PLANCK CONSTANT"],
			[ 0x210F , "PLANCK CONSTANT OVER TWO PI"],
			
			[ 0x2110 , "SCRIPT CAPITAL I"],
			[ 0x2111 , "BLACK-LETTER CAPITAL I"],
			[ 0x2112 , "SCRIPT CAPITAL L"],
			[ 0x2113 , "SCRIPT SMALL L"],
			[ 0x2114 , "L B BAR SYMBOL"],
			[ 0x2115 , "DOUBLE-STRUCK CAPITAL N"],
			[ 0x2116 , "NUMERO SIGN"],
			[ 0x2117 , "SOUND RECORDING COPYRIGHT"],
			[ 0x2118 , "SCRIPT CAPITAL P"],
			[ 0x2119 , "DOUBLE-STRUCK CAPITAL P"],
			[ 0x211A , "DOUBLE-STRUCK CAPITAL Q"],
			[ 0x211B , "SCRIPT CAPITAL R"],
			[ 0x211C , "BLACK-LETTER CAPITAL R"],
			[ 0x211D , "DOUBLE-STRUCK CAPITAL R"],
			[ 0x211E , "PRESCRIPTION TAKE"],
			[ 0x211F , "RESPONSE"],
			
			[ 0x2120 , "SERVICE MARK"],
			[ 0x2121 , "TELEPHONE SIGN"],
			[ 0x2122 , "TRADE MARK SIGN", "font-family: inherit"],
			[ 0x2123 , "VERSICLE"],
			[ 0x2124 , "DOUBLE-STRUCK CAPITAL Z"],
			[ 0x2125 , "OUNCE SIGN"],
			[ 0x2126 , "OHM SIGN"],
			[ 0x2127 , "INVERTED OHM SIGN"],
			[ 0x2128 , "BLACK-LETTER CAPITAL Z"],
			[ 0x2129 , "TURNED GREEK SMALL LETTER IOTA"],
			[ 0x212A , "KELVIN SIGN"],
			[ 0x212B , "ANGSTROM SIGN"],
			[ 0x212C , "SCRIPT CAPITAL B"],
			[ 0x212D , "BLACK-LETTER CAPITAL C"],
			[ 0x212E , "ESTIMATED SYMBOL"],
			[ 0x212F , "SCRIPT SMALL E"],
			
			[ 0x2130 , "SCRIPT CAPITAL E"],
			[ 0x2131 , "SCRIPT CAPITAL F"],
			[ 0x2132 , "TURNED CAPITAL F"],
			[ 0x2133 , "SCRIPT CAPITAL M"],
			[ 0x2134 , "SCRIPT SMALL O"],
			[ 0x2135 , "ALEF SYMBOL"],
			[ 0x2136 , "BET SYMBOL"],
			[ 0x2137 , "GIMEL SYMBOL"],
			[ 0x2138 , "DALET SYMBOL"],
			[ 0x2139 , "INFORMATION SOURCE", "font-family: inherit"],
			[ 0x213A , "ROTATED CAPITAL Q"],
			[ 0x213B , "FACSIMILE SIGN"],
			[ 0x213C , "DOUBLE-STRUCK SMALL PI"],
			[ 0x213D , "DOUBLE-STRUCK SMALL GAMMA"],
			[ 0x213E , "DOUBLE-STRUCK CAPITAL GAMMA"],
			[ 0x213F , "DOUBLE-STRUCK CAPITAL PI"],
			
			[ 0x2140 , "DOUBLE-STRUCK N-ARY SUMMATION"],
			[ 0x2141 , "TURNED SANS-SERIF CAPITAL G"],
			[ 0x2142 , "TURNED SANS-SERIF CAPITAL L"],
			[ 0x2143 , "REVERSED SANS-SERIF CAPITAL L"],
			[ 0x2144 , "TURNED SANS-SERIF CAPITAL Y"],
			[ 0x2145 , "DOUBLE-STRUCK ITALIC CAPITAL D"],
			[ 0x2146 , "DOUBLE-STRUCK ITALIC SMALL D"],
			[ 0x2147 , "DOUBLE-STRUCK ITALIC SMALL E"],
			[ 0x2148 , "DOUBLE-STRUCK ITALIC SMALL I"],
			[ 0x2149 , "DOUBLE-STRUCK ITALIC SMALL J"],
			[ 0x214A , "PROPERTY LINE"],
			[ 0x214B , "TURNED AMPERSAND"],
			[ 0x214C , "PER SIGN"],
			[ 0x214D , "AKTIESELSKAB"],
			[ 0x214E , "TURNED SMALL F"],
			[ 0x214F , "SYMBOL FOR SAMARITAN SOURCE"],
		);	  
			 


			 

		Smiley.alltabs.AND_EXT_Entertain = new Array(
			[ 0x265F , "Entertainment"],

			[ 0 , "Celebration"],	 	  
			[ 0x1F380 , "RIBBON"],
			[ 0x1F381 , "WRAPPED PRESENT"],
			[ 0x1F4E6 , "PACKAGE"],
			[ 0x1F382 , "BIRTHDAY CAKE"],
			[ 0x1F383 , "JACK-O-LANTERN"],
			[ 0x1F384 , "CHRISTMAS TREE"],
			[ 0x1F385 , "FATHER CHRISTMAS"],
			[ 0x1F386 , "FIREWORKS"],
			[ 0x1F387 , "FIREWORK SPARKLER"],
			[ 0x1F388 , "BALLOON"],
			[ 0x1F389 , "PARTY POPPER"],
			[ 0x1F38A , "CONFETTI BALL"],
			[ 0x1F38B , "TANABATA TREE"],
			[ 0x1F38C , "CROSSED FLAGS"],
			[ 0x1F38D , "PINE DECORATION"],
			[ 0x1F38E , "JAPANESE DOLLS"],
			[ 0x1F38F , "CARP STREAMER"],
			[ 0x1F390 , "WIND CHIME"],
			[ 0x1F391 , "MOON VIEWING CEREMONY"],
			[ 0x1F392 , "SCHOOL SATCHEL"],
			[ 0x1F393 , "GRADUATION CAP"],
			[ 0 , "" ],
			[ 0x1F3A0 , "CAROUSEL HORSE"],
			[ 0x1F3A1 , "FERRIS WHEEL"],
			[ 0x1F3A2 , "ROLLER COASTER"],
			[ 0x1F3A3 , "FISHING POLE AND FISH"],
			[ 0x1F3A4 , "MICROPHONE"],
			[ 0x1F3A5 , "MOVIE CAMERA"],
			[ 0x1F3A6 , "CINEMA"],
			[ 0x1F3A7 , "HEADPHONE"],
			[ 0x1F3A8 , "ARTIST PALETTE"],
			[ 0x1F3A9 , "TOP HAT"],
			[ 0x1F3AA , "CIRCUS TENT"],
			[ 0x1F3AB , "TICKET"],
			[ 0x1F3AC , "CLAPPER BOARD"],
			[ 0x1F3AD , "PERFORMING ARTS"],	
			[ 0 , "Music" ],
			[ 0x1F3B5 , "MUSICAL NOTE"],
			[ 0x2669 ,  "QUARTER NOTE"],
			[ 0x266A ,  "EIGHTH NOTE"],
			[ 0x266B ,  "BEAMED EIGHTH NOTES"],
			[ 0x266C ,  "BEAMED SIXTEENTH NOTES"],
			[ 0x1F3B6 , "MULTIPLE MUSICAL NOTES"],
			[ 0x266D ,  "MUSIC FLAT SIGN"],
			[ 0x266E ,  "MUSIC NATURAL SIGN"],
			[ 0x266F ,  "MUSIC SHARP SIGN"],
			[ 0x1F3B7 , "SAXOPHONE"],
			[ 0x1F3B8 , "GUITAR"],
			[ 0x1F3B9 , "MUSICAL KEYBOARD"],
			[ 0x1F3BA , "TRUMPET"],
			[ 0x1F3BB , "VIOLIN"],
			[ 0x1F3BC , "MUSICAL SCORE"],
			[ 0x1D11E , "MUSICAL SYMBOL G CLEF"],
			[ [0x303D,0xFE0F] , "Part Alternation Mark"],
			  

			[ 0 , "Game Symbols"],
			
			[ 0x1F3AE , "VIDEO GAME"],
			[ 0x1F3AF , "DIRECT HIT"],
			[ 0x1F3B0 , "SLOT MACHINE"],
			[ 0x1F3B1 , "BILLIARDS"],
			[ 0x1F3B2 , "GAME DIE"],
			[ 0x1F3B3 , "BOWLING"],
			[ 0x1F3B4 , "FLOWER PLAYING CARDS"],
			[ 0x270A , "ROCK"],
			[ 0x270B , "PAPER"],
			[ 0x270C , "SCISSORS"],
			[ 0 , "Board Games" ],
			[ 0x2616 , "WHITE SHOGI PIECE" ],
			[ 0x2617 , "BLACK SHOGI PIECE" ],
			[ 0x26C9 , "TURNED WHITE SHOGI PIECE" ],
			[ 0x26CA , "TURNED BLACK SHOGI PIECE" ],
			[ 0x26CB , "WHITE DIAMOND IN SQUARE" ],
			[ 0x2680 , "DIE FACE-1" ],
			[ 0x2681 , "DIE FACE-2" ],
			[ 0x2682 , "DIE FACE-3" ],
			[ 0x2683 , "DIE FACE-4" ],
			[ 0x2684 , "DIE FACE-5" ],
			[ 0x2685 , "DIE FACE-6" ],
			[ 0x2686 , "WHITE CIRCLE WITH DOT RIGHT" ],
			[ 0x2687 , "WHITE CIRCLE WITH TWO DOTS" ],
			[ 0x2688 , "BLACK CIRCLE WITH WHITE DOT RIGHT" ],
			[ 0x2689 , "BLACK CIRCLE WITH TWO WHITE DOTS" ],
			[ 0x26C0 , "WHITE DRAUGHTS MAN" ],
			[ 0x26C1 , "WHITE DRAUGHTS KING" ],
			[ 0x26C2 , "BLACK DRAUGHTS MAN" ],
			[ 0x26C3 , "BLACK DRAUGHTS KING" ],
			[ 0x2654 , "WHITE CHESS KING" ],
			[ 0x2655 , "WHITE CHESS QUEEN" ],
			[ 0x2656 , "WHITE CHESS ROOK" ],
			[ 0x2657 , "WHITE CHESS BISHOP" ],
			[ 0x2658 , "WHITE CHESS KNIGHT" ],
			[ 0x2659 , "WHITE CHESS PAWN" ],
			[ 0x265A , "BLACK CHESS KING" ],
			[ 0x265B , "BLACK CHESS QUEEN" ],
			[ 0x265C , "BLACK CHESS ROOK" ],
			[ 0x265D , "BLACK CHESS BISHOP" ],
			[ 0x265E , "BLACK CHESS KNIGHT" ],
			[ 0x265F , "BLACK CHESS PAWN" ],
			
			[ 0 , "Playing Cards" ],
			[ 0x2660 , "BLACK SPADE SUIT" ],
			[ 0x2663 , "BLACK CLUB SUIT" ],
			[ 0x2665 , "BLACK HEART SUIT" ],
			[ 0x2666 , "BLACK DIAMOND SUIT" ],
			[ 0x2664 , "WHITE SPADE SUIT" ],
			[ 0x2667 , "WHITE CLUB SUIT" ],
			[ 0x2661 , "WHITE HEART SUIT" ],
			[ 0x2662 , "WHITE DIAMOND SUIT" ],
			
			[ 0x1F0A0 , "PLAYING CARD BACK" ],
			
			[ 0x1F0A1 , "PLAYING CARD ACE OF SPADES" ],
			[ 0x1F0A2 , "PLAYING CARD TWO OF SPADES" ],
			[ 0x1F0A3 , "PLAYING CARD THREE OF SPADES" ],
			[ 0x1F0A4 , "PLAYING CARD FOUR OF SPADES" ],
			[ 0x1F0A5 , "PLAYING CARD FIVE OF SPADES" ],
			[ 0x1F0A6 , "PLAYING CARD SIX OF SPADES" ],
			[ 0x1F0A7 , "PLAYING CARD SEVEN OF SPADES" ],
			[ 0x1F0A8 , "PLAYING CARD EIGHT OF SPADES" ],
			[ 0x1F0A9 , "PLAYING CARD NINE OF SPADES" ],
			[ 0x1F0AA , "PLAYING CARD TEN OF SPADES" ],
			[ 0x1F0AB , "PLAYING CARD JACK OF SPADES" ],
			[ 0x1F0AC , "PLAYING CARD KNIGHT OF SPADES" ],
			[ 0x1F0AD , "PLAYING CARD QUEEN OF SPADES" ],
			[ 0x1F0AE , "PLAYING CARD KING OF SPADES" ],
			
			[ 0x1F0b1 , "PLAYING CARD ACE OF HEARTS" ],
			[ 0x1F0b2 , "PLAYING CARD TWO OF HEARTS" ],
			[ 0x1F0b3 , "PLAYING CARD THREE OF HEARTS" ],
			[ 0x1F0b4 , "PLAYING CARD FOUR OF HEARTS" ],
			[ 0x1F0b5 , "PLAYING CARD FIVE OF HEARTS" ],
			[ 0x1F0b6 , "PLAYING CARD SIX OF HEARTS" ],
			[ 0x1F0b7 , "PLAYING CARD SEVEN OF HEARTS" ],
			[ 0x1F0b8 , "PLAYING CARD EIGHT OF HEARTS" ],
			[ 0x1F0b9 , "PLAYING CARD NINE OF HEARTS" ],
			[ 0x1F0bA , "PLAYING CARD TEN OF HEARTS" ],
			[ 0x1F0bB , "PLAYING CARD JACK OF HEARTS" ],
			[ 0x1F0bC , "PLAYING CARD KNIGHT OF HEARTS" ],
			[ 0x1F0bD , "PLAYING CARD QUEEN OF HEARTS" ],
			[ 0x1F0bE , "PLAYING CARD KING OF HEARTS" ],
			
			[ 0x1F0c1 , "PLAYING CARD ACE OF DIAMONDS" ],
			[ 0x1F0c2 , "PLAYING CARD TWO OF DIAMONDS" ],
			[ 0x1F0c3 , "PLAYING CARD THREE OF DIAMONDS" ],
			[ 0x1F0c4 , "PLAYING CARD FOUR OF DIAMONDS" ],
			[ 0x1F0c5 , "PLAYING CARD FIVE OF DIAMONDS" ],
			[ 0x1F0c6 , "PLAYING CARD SIX OF DIAMONDS" ],
			[ 0x1F0c7 , "PLAYING CARD SEVEN OF DIAMONDS" ],
			[ 0x1F0c8 , "PLAYING CARD EIGHT OF DIAMONDS" ],
			[ 0x1F0c9 , "PLAYING CARD NINE OF DIAMONDS" ],
			[ 0x1F0cA , "PLAYING CARD TEN OF DIAMONDS" ],
			[ 0x1F0cB , "PLAYING CARD JACK OF DIAMONDS" ],
			[ 0x1F0cC , "PLAYING CARD KNIGHT OF DIAMONDS" ],
			[ 0x1F0cD , "PLAYING CARD QUEEN OF DIAMONDS" ],
			[ 0x1F0cE , "PLAYING CARD KING OF DIAMONDS" ],
			
			[ 0x1F0d1 , "PLAYING CARD ACE OF CLUBS" ],
			[ 0x1F0d2 , "PLAYING CARD TWO OF CLUBS" ],
			[ 0x1F0d3 , "PLAYING CARD THREE OF CLUBS" ],
			[ 0x1F0d4 , "PLAYING CARD FOUR OF CLUBS" ],
			[ 0x1F0d5 , "PLAYING CARD FIVE OF CLUBS" ],
			[ 0x1F0d6 , "PLAYING CARD SIX OF CLUBS" ],
			[ 0x1F0d7 , "PLAYING CARD SEVEN OF CLUBS" ],
			[ 0x1F0d8 , "PLAYING CARD EIGHT OF CLUBS" ],
			[ 0x1F0d9 , "PLAYING CARD NINE OF CLUBS" ],
			[ 0x1F0dA , "PLAYING CARD TEN OF CLUBS" ],
			[ 0x1F0dB , "PLAYING CARD JACK OF CLUBS" ],
			[ 0x1F0dC , "PLAYING CARD KNIGHT OF CLUBS" ],
			[ 0x1F0dD , "PLAYING CARD QUEEN OF CLUBS" ],
			[ 0x1F0dE , "PLAYING CARD KING OF CLUBS" ],
			
			[ 0x1F0CF , "PLAYING CARD BLACK JOKER" ],
			[ 0x1F0DF , "PLAYING CARD WHITE JOKER" ],
			
			[ 0 , "Mahjong" ],
			[ 0x1F000 , "MAHJONG TILE EAST WIND" ],
			[ 0x1F001 , "MAHJONG TILE SOUTH WIND" ],
			[ 0x1F002 , "MAHJONG TILE WEST WIND" ],
			[ 0x1F003 , "MAHJONG TILE NORTH WIND" ],
			[ 0x1F004 , "MAHJONG TILE RED DRAGON" ],
			[ 0x1F005 , "MAHJONG TILE GREEN DRAGON" ],
			[ 0x1F006 , "MAHJONG TILE WHITE DRAGON" ],
			[ 0x1F007 , "MAHJONG TILE ONE OF CHARACTERS" ],
			[ 0x1F008 , "MAHJONG TILE TWO OF CHARACTERS" ],
			[ 0x1F009 , "MAHJONG TILE THREE OF CHARACTERS" ],
			[ 0x1F00A , "MAHJONG TILE FOUR OF CHARACTERS" ],
			[ 0x1F00B , "MAHJONG TILE FIVE OF CHARACTERS" ],
			[ 0x1F00C , "MAHJONG TILE SIX OF CHARACTERS" ],
			[ 0x1F00D , "MAHJONG TILE SEVEN OF CHARACTERS" ],
			[ 0x1F00E , "MAHJONG TILE EIGHT OF CHARACTERS" ],
			[ 0x1F00F , "MAHJONG TILE NINE OF CHARACTERS" ],
			
			[ 0x1F010 , "MAHJONG TILE ONE OF BAMBOOS" ],
			[ 0x1F011 , "MAHJONG TILE TWO OF BAMBOOS" ],
			[ 0x1F012 , "MAHJONG TILE THREE OF BAMBOOS" ],
			[ 0x1F013 , "MAHJONG TILE FOUR OF BAMBOOS" ],
			[ 0x1F014 , "MAHJONG TILE FIVE OF BAMBOOS" ],
			[ 0x1F015 , "MAHJONG TILE SIX OF BAMBOOS" ],
			[ 0x1F016 , "MAHJONG TILE SEVEN OF BAMBOOS" ],
			[ 0x1F017 , "MAHJONG TILE EIGHT OF BAMBOOS" ],
			[ 0x1F018 , "MAHJONG TILE NINE OF BAMBOOS" ],
			
			[ 0x1F019 , "MAHJONG TILE ONE OF CIRCLES" ],
			[ 0x1F01A , "MAHJONG TILE TWO OF CIRCLES" ],
			[ 0x1F01B , "MAHJONG TILE THREE OF CIRCLES" ],
			[ 0x1F01C , "MAHJONG TILE FOUR OF CIRCLES" ],
			[ 0x1F01D , "MAHJONG TILE FIVE OF CIRCLES" ],
			[ 0x1F01E , "MAHJONG TILE SIX OF CIRCLES" ],
			[ 0x1F01F , "MAHJONG TILE SEVEN OF CIRCLES" ],
			[ 0x1F020 , "MAHJONG TILE EIGHT OF CIRCLES" ],
			[ 0x1F021 , "MAHJONG TILE NINE OF CIRCLES" ],
			
			[ 0x1F022 , "MAHJONG TILE PLUM" ],
			[ 0x1F023 , "MAHJONG TILE ORCHID" ],
			[ 0x1F024 , "MAHJONG TILE BAMBOO" ],
			[ 0x1F025 , "MAHJONG TILE CHRYSANTHEMUM" ],
			[ 0x1F026 , "MAHJONG TILE SPRING" ],
			[ 0x1F027 , "MAHJONG TILE SUMMER" ],
			[ 0x1F028 , "MAHJONG TILE AUTUMN" ],
			[ 0x1F029 , "MAHJONG TILE WINTER" ],
			[ 0x1F02A , "MAHJONG TILE JOKER" ],
			[ 0x1F02B , "MAHJONG TILE BACK" ],
			
			[ 0 , "Dominos" ],
			[ 0x1F030 , "DOMINO TILE HORIZONTAL BACK" ],
			[ 0x1F031 , "DOMINO TILE HORIZONTAL-00-00" ],
			[ 0x1F032 , "DOMINO TILE HORIZONTAL-00-01" ],
			[ 0x1F033 , "DOMINO TILE HORIZONTAL-00-02" ],
			[ 0x1F034 , "DOMINO TILE HORIZONTAL-00-03" ],
			[ 0x1F035 , "DOMINO TILE HORIZONTAL-00-04" ],
			[ 0x1F036 , "DOMINO TILE HORIZONTAL-00-05" ],
			[ 0x1F037 , "DOMINO TILE HORIZONTAL-00-06" ],
			[ 0x1F038 , "DOMINO TILE HORIZONTAL-01-00" ],
			[ 0x1F039 , "DOMINO TILE HORIZONTAL-01-01" ],
			[ 0x1F03A , "DOMINO TILE HORIZONTAL-01-02" ],
			[ 0x1F03B , "DOMINO TILE HORIZONTAL-01-03" ],
			[ 0x1F03C , "DOMINO TILE HORIZONTAL-01-04" ],
			[ 0x1F03D , "DOMINO TILE HORIZONTAL-01-05" ],
			[ 0x1F03E , "DOMINO TILE HORIZONTAL-01-06" ],
			[ 0x1F03F , "DOMINO TILE HORIZONTAL-02-00" ],
			[ 0x1F040 , "DOMINO TILE HORIZONTAL-02-01" ],
			[ 0x1F041 , "DOMINO TILE HORIZONTAL-02-02" ],
			[ 0x1F042 , "DOMINO TILE HORIZONTAL-02-03" ],
			[ 0x1F043 , "DOMINO TILE HORIZONTAL-02-04" ],
			[ 0x1F044 , "DOMINO TILE HORIZONTAL-02-05" ],
			[ 0x1F045 , "DOMINO TILE HORIZONTAL-02-06" ],
			[ 0x1F046 , "DOMINO TILE HORIZONTAL-03-00" ],
			[ 0x1F047 , "DOMINO TILE HORIZONTAL-03-01" ],
			[ 0x1F048 , "DOMINO TILE HORIZONTAL-03-02" ],
			[ 0x1F049 , "DOMINO TILE HORIZONTAL-03-03" ],
			[ 0x1F04A , "DOMINO TILE HORIZONTAL-03-04" ],
			[ 0x1F04B , "DOMINO TILE HORIZONTAL-03-05" ],
			[ 0x1F04C , "DOMINO TILE HORIZONTAL-03-06" ],
			[ 0x1F04D , "DOMINO TILE HORIZONTAL-04-00" ],
			[ 0x1F04E , "DOMINO TILE HORIZONTAL-04-01" ],
			[ 0x1F04F , "DOMINO TILE HORIZONTAL-04-02" ],
			[ 0x1F050 , "DOMINO TILE HORIZONTAL-04-03" ],
			[ 0x1F051 , "DOMINO TILE HORIZONTAL-04-04" ],
			[ 0x1F052 , "DOMINO TILE HORIZONTAL-04-05" ],
			[ 0x1F053 , "DOMINO TILE HORIZONTAL-04-06" ],
			[ 0x1F054 , "DOMINO TILE HORIZONTAL-05-00" ],
			[ 0x1F055 , "DOMINO TILE HORIZONTAL-05-01" ],
			[ 0x1F056 , "DOMINO TILE HORIZONTAL-05-02" ],
			[ 0x1F057 , "DOMINO TILE HORIZONTAL-05-03" ],
			[ 0x1F058 , "DOMINO TILE HORIZONTAL-05-04" ],
			[ 0x1F059 , "DOMINO TILE HORIZONTAL-05-05" ],
			[ 0x1F05A , "DOMINO TILE HORIZONTAL-05-06" ],
			[ 0x1F05B , "DOMINO TILE HORIZONTAL-06-00" ],
			[ 0x1F05C , "DOMINO TILE HORIZONTAL-06-01" ],
			[ 0x1F05D , "DOMINO TILE HORIZONTAL-06-02" ],
			[ 0x1F05E , "DOMINO TILE HORIZONTAL-06-03" ],
			[ 0x1F05F , "DOMINO TILE HORIZONTAL-06-04" ],
			[ 0x1F060 , "DOMINO TILE HORIZONTAL-06-05" ],
			[ 0x1F061 , "DOMINO TILE HORIZONTAL-06-06" ],
			
			[ 0x1F062 , "DOMINO TILE VERTICAL BACK" ],
			[ 0x1F063 , "DOMINO TILE VERTICAL-00-00" ],
			[ 0x1F064 , "DOMINO TILE VERTICAL-00-01" ],
			[ 0x1F065 , "DOMINO TILE VERTICAL-00-02" ],
			[ 0x1F066 , "DOMINO TILE VERTICAL-00-03" ],
			[ 0x1F067 , "DOMINO TILE VERTICAL-00-04" ],
			[ 0x1F068 , "DOMINO TILE VERTICAL-00-05" ],
			[ 0x1F069 , "DOMINO TILE VERTICAL-00-06" ],
			[ 0x1F06A , "DOMINO TILE VERTICAL-01-00" ],
			[ 0x1F06B , "DOMINO TILE VERTICAL-01-01" ],
			[ 0x1F06C , "DOMINO TILE VERTICAL-01-02" ],
			[ 0x1F06D , "DOMINO TILE VERTICAL-01-03" ],
			[ 0x1F06E , "DOMINO TILE VERTICAL-01-04" ],
			[ 0x1F06F , "DOMINO TILE VERTICAL-01-05" ],
			[ 0x1F070 , "DOMINO TILE VERTICAL-01-06" ],
			[ 0x1F071 , "DOMINO TILE VERTICAL-02-00" ],
			[ 0x1F072 , "DOMINO TILE VERTICAL-02-01" ],
			[ 0x1F073 , "DOMINO TILE VERTICAL-02-02" ],
			[ 0x1F074 , "DOMINO TILE VERTICAL-02-03" ],
			[ 0x1F075 , "DOMINO TILE VERTICAL-02-04" ],
			[ 0x1F076 , "DOMINO TILE VERTICAL-02-05" ],
			[ 0x1F077 , "DOMINO TILE VERTICAL-02-06" ],
			[ 0x1F078 , "DOMINO TILE VERTICAL-03-00" ],
			[ 0x1F079 , "DOMINO TILE VERTICAL-03-01" ],
			[ 0x1F07A , "DOMINO TILE VERTICAL-03-02" ],
			[ 0x1F07B , "DOMINO TILE VERTICAL-03-03" ],
			[ 0x1F07C , "DOMINO TILE VERTICAL-03-04" ],
			[ 0x1F07D , "DOMINO TILE VERTICAL-03-05" ],
			[ 0x1F07E , "DOMINO TILE VERTICAL-03-06" ],
			[ 0x1F07F , "DOMINO TILE VERTICAL-04-00" ],
			[ 0x1F080 , "DOMINO TILE VERTICAL-04-01" ],
			[ 0x1F081 , "DOMINO TILE VERTICAL-04-02" ],
			[ 0x1F082 , "DOMINO TILE VERTICAL-04-03" ],
			[ 0x1F083 , "DOMINO TILE VERTICAL-04-04" ],
			[ 0x1F084 , "DOMINO TILE VERTICAL-04-05" ],
			[ 0x1F085 , "DOMINO TILE VERTICAL-04-06" ],
			[ 0x1F086 , "DOMINO TILE VERTICAL-05-00" ],
			[ 0x1F087 , "DOMINO TILE VERTICAL-05-01" ],
			[ 0x1F088 , "DOMINO TILE VERTICAL-05-02" ],
			[ 0x1F089 , "DOMINO TILE VERTICAL-05-03" ],
			[ 0x1F08A , "DOMINO TILE VERTICAL-05-04" ],
			[ 0x1F08B , "DOMINO TILE VERTICAL-05-05" ],
			[ 0x1F08C , "DOMINO TILE VERTICAL-05-06" ],
			[ 0x1F08D , "DOMINO TILE VERTICAL-06-00" ],
			[ 0x1F08E , "DOMINO TILE VERTICAL-06-01" ],
			[ 0x1F08F , "DOMINO TILE VERTICAL-06-02" ],
			[ 0x1F090 , "DOMINO TILE VERTICAL-06-03" ],
			[ 0x1F091 , "DOMINO TILE VERTICAL-06-04" ],
			[ 0x1F092 , "DOMINO TILE VERTICAL-06-05" ],
			[ 0x1F093 , "DOMINO TILE VERTICAL-06-06" ],
			
		);
		  


		Smiley.alltabs.AND_EXT_TechSymbols = new Array(
			[ 0x235F , "Technical Symbols"],
			
			

			[ 0 , "User Interface Icons" ],
			[ 0x1F500 , "TWISTED RIGHTWARDS ARROWS"],
			[ 0x1F501 , "CLOCKWISE RIGHTWARDS AND LEFTWARDS OPEN CIRCLE ARROWS"],
			[ 0x1F502 , "CLOCKWISE RIGHTWARDS AND LEFTWARDS OPEN CIRCLE ARROWS WITH CIRCLED ONE OVERLAY"],
			[ 0x1F503 , "CLOCKWISE DOWNWARDS AND UPWARDS OPEN CIRCLE ARROWS"],
			[ 0x1F504 , "ANTICLOCKWISE DOWNWARDS AND UPWARDS OPEN CIRCLE ARROWS"],
			[ 0x1F505 , "LOW BRIGHTNESS SYMBOL"],
			[ 0x1F506 , "HIGH BRIGHTNESS SYMBOL"],
			[ 0x1F507 , "SPEAKER WITH CANCELLATION STROKE"],
			[ 0x1F508 , "SPEAKER"],
			[ 0x1F509 , "SPEAKER WITH ONE SOUND WAVE"],
			[ 0x1F50A , "SPEAKER WITH THREE SOUND WAVES"],
			[ 0x1F50B , "BATTERY"],
			[ 0x1F50C , "ELECTRIC PLUG"],
			[ 0x1F50D , "LEFT-POINTING MAGNIFYING GLASS"],
			[ 0x1F50E , "RIGHT-POINTING MAGNIFYING GLASS"],
			[ 0x1F50F , "LOCK WITH INK PEN"],
			[ 0x1F510 , "CLOSED LOCK WITH KEY"],
			[ 0x1F511 , "KEY"],
			[ 0x26BF , "SQUARE KEY"],
			[ 0x1F512 , "LOCK"],
			[ 0x1F513 , "OPEN LOCK"],
			[ 0x1F514 , "BELL"],
			[ 0x1F515 , "BELL WITH CANCELLATION STROKE"],
			[ 0x1F516 , "BOOKMARK"],
			[ 0x1F517 , "LINK SYMBOL"],
			[ 0x1F518 , "RADIO BUTTON"],
			[ [0x2611,0xFE0F] , "CHECKBOX"],
			[ 0x231A , "WATCH"],
			[ 0x231B , "HOURGLASS"],
			[ 0 , "Keyboard Key Symbols" ],
			[ [0x1F519,0x0FE0E] , "BACK WITH LEFTWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51A,0x0FE0E] , "END WITH LEFTWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51B,0x0FE0E] , "ON WITH EXCLAMATION MARK WITH LEFT RIGHT ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51C,0x0FE0E] , "SOON WITH RIGHTWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51D,0x0FE0E] , "TOP WITH UPWARDS ARROW ABOVE","font-family: inherit;"],
			[ [0x1F51E,0x0FE0E] , "NO ONE UNDER EIGHTEEN SYMBOL","font-family: inherit;"],
			[ [0x1F51F,0x0FE0E] , "KEYCAP TEN","font-family: inherit;"],
			[ 0x2318 , "COMMAND KEY"],
			[ 0x2324 , "UP ARROWHEAD BETWEEN TWO HORIZONTAL BARS"],
			[ 0x2325 , "OPTION KEY"],
			[ 0x2326 , "ERASE TO THE RIGHT"],
			[ 0x232B , "ERASE TO THE LEFT"],
			[ 0x2327 , "X IN A RECTANGLE BOX"],
			[ [0x2328,0xFE0E] , "KEYBOARD","font-family: inherit;"],
			[ 0x2380 , "INSERTION SYMBOL"],
			[ 0x2381 , "CONTINOUOS UNDERLINE SYMBOL"],
			[ 0x2382 , "DISCONTINOUOS UNDERLINE SYMBOL"],
			[ 0x2383 , "EMPHASIS SYMBOL"],
			[ 0x2384 , "COMPOSITION SYMBOL"],
			[ 0x2385 , "WHITE SQUARE WITH CENTER VERTICAL LINE"],
			[ 0x2386 , "ENTER SYMBOL"],
			[ 0x2387 , "ALTERNATIVE KEY SYMBOL"],
			[ 0x2388 , "HELM SYMBOL"],
			[ 0x2389 , "CIRCLED HORIZONTAL BAR WITH NOTCH"],
			[ 0x238A , "CIRCLED TRIANGLE DOWN"],
			[ 0x238B , "BROKEN CIRCLE WITH NORTHWEST ARROW"],
			[ 0x238C , "UNDO SYMBOL"],
			[ 0x2396 , "DECIMAL SEPARATOR KEY SYMBOL"],
			[ 0x2397 , "PREVIOUS PAGE"],
			[ 0x2398 , "NEXT PAGE"],
			[ 0x2399 , "PRINT SCREEN SYMBOL"],
			[ 0x239A , "CLEAR SCREEN SYMBOL"],
			[ 0x23CE , "RETURN SYMBOL"],
			[ [0x23CF,0x0FE0E] , "EJECT SYMBOL","font-family: inherit;"],
			[ [0x23E9,0x0FE0E] , "BLACK RIGHT-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23EA,0x0FE0E] , "BLACK LEFT-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23EB,0x0FE0E] , "BLACK UP-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23EC,0x0FE0E] , "BLACK DOWN-POINTING DOUBLE TRIANGLE","font-family: inherit;"],
			[ [0x23ED,0x0FE0E] , "BLACK RIGHT-POINTING DOUBLE TRIANGLE WITH VERTICAL BAR","font-family: inherit;"],
			[ [0x23EE,0x0FE0E] , "BLACK LEFT-POINTING DOUBLE TRIANGLE WITH VERTICAL BAR","font-family: inherit;"],
			[ [0x23EF,0x0FE0E] , "BLACK RIGHT-POINTING TRIANGLE WITH DOUBLE VERTICAL BAR","font-family: inherit;"],
			
			[ 0 , "Input Type Symbols" ],
			[ [0x1F520,0x0FE0E] , "INPUT SYMBOL FOR LATIN CAPITAL LETTERS","font-family: inherit;"],
			[ [0x1F521,0x0FE0E] , "INPUT SYMBOL FOR LATIN SMALL LETTERS","font-family: inherit;"],
			[ [0x1F522,0x0FE0E] , "INPUT SYMBOL FOR NUMBERS","font-family: inherit;"],
			[ [0x1F523,0x0FE0E] , "INPUT SYMBOL FOR SYMBOLS","font-family: inherit;"],
			[ [0x1F524,0x0FE0E] , "INPUT SYMBOL FOR LATIN LETTERS","font-family: inherit;"],

			
			[ 0 , "Technical Symbols"],
			
			[ 0x2300 , "DIAMETER SIGN"],
			[ 0x2301 , "ELECTRIC ARROW"],
			[ 0x2302 , "HOUSE"],
			[ 0x2303 , "UP ARROWHEAD"],
			[ 0x2304 , "DOWN ARROWHEAD"],
			[ 0x2305 , "PROJECTIVE"],
			[ 0x2306 , "PERSPECTIVE"],
			[ 0x2307 , "WAVY LINE"],
			[ [0x3030,0x0FE0E] , "WAVY DASH","font-family: inherit;"],
			
			[ 0x230C , "BOTTOM RIGHT CROP"],
			[ 0x230D , "BOTTOM LEFT CROP"],
			[ 0x230E , "TOP RIGHT CROP"],
			[ 0x230F , "TOP LEFT CROP"],
			
			[ 0x2310 , "REVERSED NOT SIGN"],
			[ 0x2311 , "SQUARE LOZENGE"],
			[ 0x2312 , "ARC"],
			[ 0x2313 , "SEGMENT"],
			[ 0x2314 , "SECTOR"],
			[ 0x2315 , "TELEPHONE RECORDER"],
			[ 0x2316 , "POSITION INDICATOR"],
			[ 0x2317 , "VIEWDATA SQUARE"],
			[ 0x2318 , "PLACE OF INTEREST SIGN"],
			[ 0x2319 , "TURNED NOT SIGN"],

			[ 0x231C , "TOP LEFT CORNER"],
			[ 0x231D , "TOP RIGHT CORNER"],
			[ 0x231E , "BOTTOM LEFT CORNER"],
			[ 0x231F , "BOTTOM RIGHT CORNER"],
			
			[ 0x232C , "BENZENE RING"],
			[ 0x23E3 , "BENZENE RING WITH CIRCLE"],
			[ 0x232D , "CYLINDRICITY"],
			[ 0x232E , "ALL AROUND-PROFILE"],
			[ 0x232F , "SYMMETRY"],
			
			[ 0x2330 , "TOTAL RUNOUT"],
			[ 0x2331 , "DIMENSION ORIGIN"],
			[ 0x2332 , "CONICAL TAPER"],
			[ 0x2333 , "SLOPE"],
			[ 0x2334 , "COUNTERBORE"],
			[ 0x2335 , "COUNTERSINK"],
			
			[ 0x237B , "NOT CHECK MARK"],
			[ 0x237C , "RIGHT ANGLE WITH DOWNWARDS ZIGZAG ARROW"],
			[ 0x237D , "SHOULDERED OPEN BOX"],
			[ 0x237E , "BELL SYMBOL"],
			[ 0x237F , "VERTICAL LINE WITH MIDDLE DOT"],
			
			[ 0x23CD , "SQUARE FOOT"],
			[ 0x269E , "THREE LINES CONVERGING RIGHT"],
			[ 0x269F , "THREE LINES CONVERGING LEFT"],
			
			[ 0 , "Electrical Symbols"],
			[ 0x238D , "MONOSTABLE SYMBOL"],
			[ 0x238E , "HYSTERESIS SYMBOL"],
			[ 0x238F , "OPEN-CIRCUIT-OUTPUT H-TYPE SYMBOL"],
			
			[ 0x2390 , "OPEN-CIRCUIT-OUTPUT L-TYPE SYMBOL"],
			[ 0x2391 , "PASSIVE-PULL-DOWN-OUTPUT SYMBOL"],
			[ 0x2392 , "PASSIVE-PULL-UP-OUTPUT SYMBOL"],
			[ 0x2393 , "DIRECT CURRENT SYMBOL FORM TWO"],
			[ 0x2394 , "SOFTWARE-FUNCTION SYMBOL"],

			[ 0x23DA , "EARTH GROUND"],
			[ 0x23DB , "FUSE"],
			
			[ 0x23E2 , "WHITE TRAPEZIUM"],
			[ 0x23E4 , "STRAIGHTNESS"],
			[ 0x23E5 , "FLATNESS"],
			[ 0x23E6 , "AC CURRENT"],
			[ 0x23E7 , "ELECTRICAL INTERSECTION"],
			[ 0x23E8 , "DECIMAL EXPONENT SYMBOL"],
			
			[ 0 , "Dentistry Symbols"],
			[ 0x23BE , "DENTISTRY SYMBOL LIGHT VERTICAL AND TOP RIGHT"],
			[ 0x23BF , "DENTISTRY SYMBOL LIGHT VERTICAL AND BOTTOM RIGHT"],
			[ 0x23C0 , "DENTISTRY SYMBOL LIGHT VERTICAL WITH CIRCLE"],
			[ 0x23C1 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL WITH CIRCLE"],
			[ 0x23C2 , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL WITH CIRCLE"],
			[ 0x23C3 , "DENTISTRY SYMBOL LIGHT VERTICAL WITH TRIANGLE"],
			[ 0x23C4 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL WITH TRIANGLE"],
			[ 0x23C5 , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL WITH TRIANGLE"],
			[ 0x23C6 , "DENTISTRY SYMBOL LIGHT VERTICAL WITH WAVE"],
			[ 0x23C7 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL WITH WAVE"],
			[ 0x23C8 , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL WITH WAVE"],
			[ 0x23C9 , "DENTISTRY SYMBOL LIGHT DOWN AND HORIZONTAL"],
			[ 0x23CA , "DENTISTRY SYMBOL LIGHT UP AND HORIZONTAL"],
			[ 0x23CB , "DENTISTRY SYMBOL LIGHT VERTICAL AND TOP LEFT"],
			[ 0x23CC , "DENTISTRY SYMBOL LIGHT VERTICAL AND BOTTOM LEFT"],
			
			[ 0 , "Mertrical Symbols"],
			[ 0x23D1 , "METRICAL BREVE"],
			[ 0x23D2 , "METRICAL LONG OVER SHORT"],
			[ 0x23D3 , "METRICAL SHORT OVER LONG"],
			[ 0x23D4 , "METRICAL LONG OVER TWO SHORT"],
			[ 0x23D5 , "METRICAL TWO SHORT OVER LONG"],
			[ 0x23D6 , "METRICAL TWO SHORTS JOINED"],
			[ 0x23D7 , "METRICAL TRISEME"],
			[ 0x23D8 , "METRICAL TETRASEME"],
			[ 0x23D9 , "METRICAL PENTASEME"],
			
			[ 0 , "APL Symbols"],
			[ 0x2336 , "APL FUNCTIONAL SYMBOL I-BEAM"],
			[ 0x2395 , "APL FUNCTIONAL SYMBOL QUAD"],
			[ 0x2337 , "APL FUNCTIONAL SYMBOL SQUISH QUAD"],
			[ 0x2338 , "APL FUNCTIONAL SYMBOL QUAD EQUAL"],
			[ 0x2339 , "APL FUNCTIONAL SYMBOL QUAD DIVIDE"],
			[ 0x233A , "APL FUNCTIONAL SYMBOL QUAD DIAMOND"],
			[ 0x233B , "APL FUNCTIONAL SYMBOL QUAD JOT"],
			[ 0x233C , "APL FUNCTIONAL SYMBOL QUAD CIRCLE"],
			[ 0x233D , "APL FUNCTIONAL SYMBOL CIRCLE STILE"],
			[ 0x233E , "APL FUNCTIONAL SYMBOL CIRCLE JOT"],
			[ 0x233F , "APL FUNCTIONAL SYMBOL SLASH BAR"],
			
			[ 0x2340 , "APL FUNCTIONAL SYMBOL BACKSLASH BAR"],
			[ 0x2341 , "APL FUNCTIONAL SYMBOL QUAD SLASH"],
			[ 0x2342 , "APL FUNCTIONAL SYMBOL QUAD BACKSLASH"],
			[ 0x2343 , "APL FUNCTIONAL SYMBOL QUAD LESS_THAN"],
			[ 0x2344 , "APL FUNCTIONAL SYMBOL QUAD GREATER_THAN"],
			[ 0x2345 , "APL FUNCTIONAL SYMBOL LEFTWARDS VANE"],
			[ 0x2346 , "APL FUNCTIONAL SYMBOL RIGHTWARDS VANE"],
			[ 0x2347 , "APL FUNCTIONAL SYMBOL QUAD LEFTWARDS ARROW"],
			[ 0x2348 , "APL FUNCTIONAL SYMBOL QUAD RIGHTWARDS ARROW"],
			[ 0x2349 , "APL FUNCTIONAL SYMBOL CIRCLE BACKSLASH"],
			[ 0x234A , "APL FUNCTIONAL SYMBOL DOWN TACK UNDERBAR"],
			[ 0x234B , "APL FUNCTIONAL SYMBOL DELTA STILE"],
			[ 0x234C , "APL FUNCTIONAL SYMBOL QUAD DOWN CARET"],
			[ 0x234D , "APL FUNCTIONAL SYMBOL QUAD DELTA"],
			[ 0x234E , "APL FUNCTIONAL SYMBOL DOWN TACK JOT"],
			[ 0x234F , "APL FUNCTIONAL SYMBOL UPWARDS VANE"],
			
			[ 0x2350 , "APL FUNCTIONAL SYMBOL QUAD UPWARDS ARROW"],
			[ 0x2351 , "APL FUNCTIONAL SYMBOL UP TACK OVERBAR"],
			[ 0x2352 , "APL FUNCTIONAL SYMBOL DEL STILE"],
			[ 0x2353 , "APL FUNCTIONAL SYMBOL QUAD UP CARET"],
			[ 0x2354 , "APL FUNCTIONAL SYMBOL QUAD DEL"],
			[ 0x2355 , "APL FUNCTIONAL SYMBOL UP TACK JOT"],
			[ 0x2356 , "APL FUNCTIONAL SYMBOL DOWNWARDS VANE"],
			[ 0x2357 , "APL FUNCTIONAL SYMBOL QUAD DOWNWARDS ARROW"],
			[ 0x2358 , "APL FUNCTIONAL SYMBOL QUOTE UNDERBAR"],
			[ 0x2359 , "APL FUNCTIONAL SYMBOL DELTA UNDERBAR"],
			[ 0x235A , "APL FUNCTIONAL SYMBOL DIAMOND UNDERBAR"],
			[ 0x235B , "APL FUNCTIONAL SYMBOL JOT UNDERBAR"],
			[ 0x235C , "APL FUNCTIONAL SYMBOL CIRCLE UNDERBAR"],
			[ 0x235D , "APL FUNCTIONAL SYMBOL SHOE JOT"],
			[ 0x235E , "APL FUNCTIONAL SYMBOL QUOTE QUAD"],
			[ 0x235F , "APL FUNCTIONAL SYMBOL CIRCLE STAR"],
			
			[ 0x2360 , "APL FUNCTIONAL SYMBOL QUAD COLON"],
			[ 0x2361 , "APL FUNCTIONAL SYMBOL UP TACK DIAERESIS"],
			[ 0x2362 , "APL FUNCTIONAL SYMBOL DEL DIAERESIS"],
			[ 0x2363 , "APL FUNCTIONAL SYMBOL STAR DIAERESIS"],
			[ 0x2364 , "APL FUNCTIONAL SYMBOL JOT DIAERESIS"],
			[ 0x2365 , "APL FUNCTIONAL SYMBOL CIRCLE DIAERESIS"],
			[ 0x2366 , "APL FUNCTIONAL SYMBOL DOWN SHOE STILE"],
			[ 0x2367 , "APL FUNCTIONAL SYMBOL LEFT SHE STILE"],
			[ 0x2368 , "APL FUNCTIONAL SYMBOL TILDE DIAERESIS"],
			[ 0x2369 , "APL FUNCTIONAL SYMBOL GREATER_THAN DIAERESIS"],
			[ 0x236A , "APL FUNCTIONAL SYMBOL COMMA BAR"],
			[ 0x236B , "APL FUNCTIONAL SYMBOL DEL TILDE"],
			[ 0x236C , "APL FUNCTIONAL SYMBOL ZILDE"],
			[ 0x236D , "APL FUNCTIONAL SYMBOL STILE TILDE"],
			[ 0x236E , "APL FUNCTIONAL SYMBOL SEMICOLON UNDERBAR"],
			[ 0x236F , "APL FUNCTIONAL SYMBOL QUAD NOT EQUAL"],
			
			[ 0x2370 , "APL FUNCTIONAL SYMBOL QUAD QUESTION"],
			[ 0x2371 , "APL FUNCTIONAL SYMBOL DOWN CARET TILDE"],
			[ 0x2372 , "APL FUNCTIONAL SYMBOL UP CARET TILDE"],
			[ 0x2373 , "APL FUNCTIONAL SYMBOL IOTA"],
			[ 0x2374 , "APL FUNCTIONAL SYMBOL RHO"],
			[ 0x2375 , "APL FUNCTIONAL SYMBOL OMEGA"],
			[ 0x2376 , "APL FUNCTIONAL SYMBOL ALPHA UNDERBAR"],
			[ 0x2377 , "APL FUNCTIONAL SYMBOL EPISON UNDERBAR"],
			[ 0x2378 , "APL FUNCTIONAL SYMBOL IOTA UNDERBAR"],
			[ 0x2379 , "APL FUNCTIONAL SYMBOL OMEGA UNDERBAR"],
			[ 0x237A , "APL FUNCTIONAL SYMBOL ALPHA"],
			
		);


		 

		Smiley.alltabs.AND_EXT_Shapes = new Array(
			[ 0x1F532 , "Shapes"],	 
			
			[ 0x25A0 , "BLACK SQUARE"],
			[ 0x25A1 , "WHITE SQUARE"],
			[ 0x25A2 , "WHITE SQUARE WITH ROUNDED CORNERS"],
			[ 0x25A3 , "WHITE SQUARE CONTAINTING BLACK SMALL SQUARE"],
			[ 0x25A4 , "SQUARE WITH HORIZONTAL FILL"],
			[ 0x25A5 , "SQUARE WITH VERTICAL FILL"],
			[ 0x25A6 , "SQUARE WITH ORTHOGONAL CROSSHATCH FILL"],
			[ 0x25A7 , "SQUARE WITH UPPER LEFT TO LOWER RIGHT FILL"],
			[ 0x25A8 , "SQUARE WITH UPPER RIGHT TO LOWER LEFT FILL"],
			[ 0x25A9 , "SQUARE WITH DIAGONAL CROSSHATCH FILL"],
			[ 0x25AA , "BLACK SMALL SQUARE"],
			[ 0x25AB , "WHITE SMALL SQUARE"],
			[ 0x2B1D , "BLACK VERY SMALL SQUARE"],
			[ 0x2B1E , "WHITE VERY SMALL SQUARE"],
			[ 0x25AC , "BLACK RECTANGLE"],
			[ 0x25AD , "WHITE RACTANGLE"],
			[ 0x25AE , "BLACK VERTICAL SQUARE"],
			[ 0x25AF , "WHITE VERTICAL RACTANGLE"],
			
			[ 0x25B0 , "BLACK PARALLELOGRAM"],
			[ 0x25B1 , "WHITE PARALLELOGRAM"],
			[ 0x25B2 , "BLACK POINTING-UP TRIANGLE"],
			[ 0x25B3 , "WHITE POINTING-UP TRIANGLE"],
			[ 0x25B4 , "BLACK POINTING-UP SMALL TRIANGLE"],
			[ 0x25B5 , "WHITE POINTING-UP SMALL TRIANGLE"],
			[ [0x25B6,0xFE0E] , "BLACK POINTING-RIGHT TRIANGLE","font-family: inherit;"],
			[ 0x25B7 , "WHITE POINTING-RIGHT TRIANGLE"],
			[ 0x25B8 , "BLACK POINTING-RIGHT SMALL TRIANGLE"],
			[ 0x25B9 , "WHITE POINTING-RIGHT SMALL TRIANGLE"],
			[ 0x2023 , "TRIANGULAR BULLET"],
			[ 0x25BA , "BLACK POINTING-RIGHT POINTER"],
			[ 0x25BB , "WHITE POINTING-RIGHT POINTER"],
			[ 0x25BC , "BLACK POINTING-DOWN TRIANGLE"],
			[ 0x25BD , "WHITE POINTING-DOWN TRIANGLE"],
			[ 0x26DB , "HEAVY WHITE POINTING-DOWN TRIANGLE"],
			[ 0x25BE , "BLACK POINTING-DOWN SMALL TRIANGLE"],
			[ 0x25BF , "WHITE POINTING-DOWN SMALL TRIANGLE"],
			
			[ [0x25C0,0xFE0E] , "BLACK POINTING-LEFT TRIANGLE","font-family: inherit;"],
			[ 0x25C1 , "WHITE POINTING-LEFT TRIANGLE"],
			[ 0x25C2 , "BLACK POINTING-LEFT SMALL TRIANGLE"],
			[ 0x25C3 , "WHITE POINTING-LEFT SMALL TRIANGLE"],
			[ 0x25C4 , "BLACK POINTING-LEFT POINTER"],
			[ 0x25C5 , "WHITE POINTING-LEFT POINTER"],
			[ 0x25C6 , "BLACK DIAMOND"],
			[ 0x25C7 , "WHITE DIAMOND"],
			[ 0x2B25 , "BLACK MEDIUM DIAMOND"],
			[ 0x2B26 , "WHITE MEDIUM DIAMOND"],
			[ 0x25C8 , "WHITE DIAMOND CONTAINING BLACK SMALL DIAMOND"],
			[ 0x25C9 , "FISHEYE"],
			[ 0x25CA , "LOZENGE"],
			[ 0x29EB , "BLACK LOZENGE"],
			[ 0x25CB , "WHITE CIRCLE"],
			[ 0x2B58 , "HEAVY CIRCLE"],
			[ 0x25CC , "DOTTED DIRCLE"],
			[ 0x25CD , "CIRCLE WITH VERTICAL FILL"],
			[ 0x25CE , "BULLSEYE"],
			[ 0x2B57 , "HEAVY CIRCLE WITH CIRCLE INSIDE"],
			[ 0x25CF , "BLACK CIRCLE"],
			[ 0x2B24 , "BLACK LARGE CIRCLE"],
			
			[ 0x25D0 , "CIRCLE WITH LEFT HALF BLACK"],
			[ 0x25D1 , "CIRCLE WITH RIGHT HALF BLACK"],
			[ 0x25D2 , "CIRCLE WITH LOWER HALF BLACK"],
			[ 0x25D3 , "CIRCLE WITH UPPER HALF BLACK"],
			[ 0x25D4 , "CIRCLE WITH UPPER RIGHT QUADRANT BLACK"],
			[ 0x25D5 , "CIRCLE WITH ALL BUT UPPER LEFT QUADRENT BLACK"],
			[ 0x25D6 , "LEFT HALF BLACK CIRCLE"],
			[ 0x25D7 , "RIGHT HALF BLACK CIRCLE"],
			[ 0x2022 , "BULLET"],
			[ 0x25D8 , "INVERSE BULLET"],
			[ 0x25D9 , "INVERSE WHITE CIRCLE"],
			[ 0x25DA , "LOWER HALF INVERSE WHITE CIRCLE"],
			[ 0x25DB , "UPPER HALF INVERSE WHITE CIRCLE"],
			[ 0x25DC , "UPPER LEFT QUADRENT CIRCULAR ARC"],
			[ 0x25DD , "UPPER RIGHT QUADRENT CIRCULAR ARC"],
			[ 0x25DE , "LOWER RIGHT QUADRENT CIRCULAR ARC"],
			[ 0x25DF , "LOWER LEFT QUADRENT CIRCULAR ARC"],
			
			[ 0x25E0 , "UPPER HALF CIRCLE"],
			[ 0x25E1 , "LOWER HALF CIRCLE"],
			[ 0x25E2 , "BLACK LOWER RIGHT TRIANGLE"],
			[ 0x25E3 , "BLACK LOWER LEFT TRIANGLE"],
			[ 0x25E4 , "BLACK UPPER LEFT TRIANGLE"],
			[ 0x25E5 , "BLACK UPPER RIGHT TRIANGLE"],
			[ 0x25E6 , "WHITE BULLET"],
			[ 0x25E7 , "SQUARE WITH LEFT HALF BLACK"],
			[ 0x25E8 , "SQUARE WITH RIGHT HALF BLACK"],
			[ 0x2B12 , "SQUARE WITH TOP HALF BLACK"],
			[ 0x2B13 , "SQUARE WITH BOTTOM HALF BLACK"],
			[ 0x25E9 , "SQUARE WITH UPPER LEFT DIAGONAL HALF BLACK"],
			[ 0x25EA , "SQUARE WITH LOWER RIGHT DIAGONAL HALF BLACK"],
			[ 0x2B14 , "SQUARE WITH UPPER RIGHT DIAGONAL HALF BLACK"],
			[ 0x2B15 , "SQUARE WITH LOWER LEFT DIAGONAL HALF BLACK"],
			[ 0x25EB , "WHITE SQUARE WITH VERTICAL BISECTING LINE"],
			[ 0x25EC , "WHITE UP-POINTING TRIANGLE WITH DOT"],
			[ 0x25ED , "UP-POINTING TRIANGLE WIHT LEFT HALF BLACK"],
			[ 0x25EE , "UP-POINTING TRIANGLE WIHT RIGHT HALF BLACK"],
			
			[ 0x29E8 , "DOWN-POINTING TRIANGLE WIHT LEFT HALF BLACK"],
			[ 0x29E9 , "DOWN-POINTING TRIANGLE WIHT RIGHT HALF BLACK"],
			[ 0x29EA , "BLACK DIAMOND WITH DOWN ARROW"],
			[ 0x29EC , "WHITE CIRCLE WITH DOWN ARROW"],
			[ 0x29ED , "BLACK CIRCLE WITH DOWN ARROW"],
			
			
			[ 0x25EF , "LARGE CIRCLE"],
			
			[ 0x25F0 , "WHITE SQUARE WITH UPPER LEFT QUADRANT"],
			[ 0x25F1 , "WHITE SQUARE WITH LOWER LEFT QUADRANT"],
			[ 0x25F2 , "WHITE SQUARE WITH LOWER RIGHT QUADRANT"],
			[ 0x25F3 , "WHITE SQUARE WITH UPPER RIGHT QUADRANT"],
			[ 0x25F4 , "WHITE CIRCLE WITH UPPER LEFT QUADRANT"],
			[ 0x25F5 , "WHITE CIRCLE WITH LOWER LEFT QUADRANT"],
			[ 0x25F6 , "WHITE CIRCLE WITH LOWER RIGHT QUADRANT"],
			[ 0x25F7 , "WHITE CIRCLE WITH UPPER RIGHT QUADRANT"],
			[ 0x25F8 , "UPPER LEFT TRIANGLE"],
			[ 0x25F9 , "UPPER RIGHT TRIANGLE"],
			[ 0x25FA , "LOWER LEFT TRIANGLE"],
			[ 0x25FF , "LOWER RIGHT TRIANGLE"],
			[ 0x22BF , "RIGHT TRIANGLE"],
			[ 0x25FB , "WHITE MEDIUM SQUARE"],
			[ 0x25FC , "BLACK MEDIUM SQUARE"],
			[ 0x25FD , "WHITE MEDIUM SMALL SQUARE"],
			[ 0x25FE , "BLACK MEDIUM SMALL SQUARE"],
			
			[ 0x2B16 , "DIAMOND WIHT LEFT HALF BLACK"],
			[ 0x2B17 , "DIAMOND WIHT RIGHT HALF BLACK"],
			[ 0x2B18 , "DIAMOND WIHT TOP HALF BLACK"],
			[ 0x2B19 , "DIAMOND WIHT BOTTOM HALF BLACK"],
			[ 0x2B1A , "DOTTED SQUARE"],
			[ 0x2B1B , "BLACK LARGE SQUARE"],
			[ 0x2B1C , "WHITE LARGE SQUARE"],
			[ 0x2B1D , "BLACK VERY SMALL SQUARE"],
			[ 0x2B1E , "WHITE VERY SMALL SQUARE"],
			
			[ 0x2B1F , "BLACK PENTAGON"],
			[ 0x2B20 , "WHITE PENTAGON"],
			[ 0x2B21 , "WHITE HEXAGON"],
			[ 0x2B22 , "BLACK HEXAGON"],
			[ 0x2B23 , "HORIZONTAL BLACK HEXAGON"],
			
			[ 0x2B25 , "BLACK MEDIUM DIAMOND"],
			[ 0x2B26 , "WHITE MEDIUM DIAMOND"],
			[ 0x2B27 , "BLACK MEDIUM LOZENGE"],
			[ 0x2B28 , "WHITE MEDIUM LOZENGE"],
			[ 0x2B29 , "BLACK SMALL DIAMOND"],
			[ 0x22C4 , "WHITE SMALL DIAMOND"],
			[ 0x2B2A , "BLACK SMALL LOZENGE"],
			[ 0x2B2B , "WHITE SMALL LOZENGE"],
			[ 0x2B2C , "BLACK HORIZONTAL ELLIPSE"],
			[ 0x2B2D , "WHITE HORIZONTAL ELLIPSE"],
			[ 0x2B2E , "BLACK VERTICAL ELLIPSE"],
			[ 0x2B2F , "WHITE VERTICAL ELLIPSE"],
			
			[ [0x2B50,0xFE0E] , "WHITE MEDIUM STAR","font-family: inherit;"],
			[ 0x22C6 , "BLACK MEDIUM STAR"],
			[ 0x2B51 , "BLACK SMALL STAR"],
			[ 0x2B52 , "WHITE SMALL STAR"],
			[ 0x2B53 , "BLACK RIGHT-POINTING HEXAGON"],
			[ 0x2B54 , "WHITE RIGHT-POINTING HEXAGON"],
			[ [0x2B55,0xFE0E] , "HEAVY LARGE CIRCLE","font-family: inherit;"],
			[ [0x274C,0xFE0E] , "CROSS MARK","font-family: inherit;"],
			[ 0x2B56 , "HEAVY LARGE OVAL WITH OVAL INSIDE"],
			[ 0x2B57 , "HEAVY LARGE CIRCLE WITH CIRCLE INSIDE"],
			[ 0x2B58 , "HEAVY CIRCLE"],
			[ 0x2B59 , "HEAVY CIRCLED SALTIRE"],
			
			[ 0 , "Emoji Shapes" ],
			[ 0x1F532 , "BLACK SQUARE BUTTON"],
			[ 0x1F533 , "WHITE SQUARE BUTTON"],
			[ 0x1F534 , "LARGE RED CIRCLE"],
			[ 0x1F535 , "LARGE BLUE CIRCLE"],
			[ 0x1F536 , "LARGE ORANGE DIAMOND"],
			[ 0x1F537 , "LARGE BLUE DIAMOND"],
			[ 0x1F538 , "SMALL ORANGE DIAMOND"],
			[ 0x1F539 , "SMALL BLUE DIAMOND"],
			[ 0x1F53A , "UP-POINTING RED TRIANGLE"],
			[ 0x1F53B , "DOWN-POINTING RED TRIANGLE"],
			[ 0x1F53C , "UP-POINTING SMALL RED TRIANGLE"],
			[ 0x1F53D , "DOWN-POINTING SMALL RED TRIANGLE"],
			/*  <td title="reserved" bgcolor="#CCCCCC"></td>
			  <td title="reserved" bgcolor="#CCCCCC"></td>*/
			[ 0x274D , "SHADOWED WHITE CIRCLE"],
			[ 0x274F , "LOWER RIGHT DROP-SHADOWED WHITE SQUARE"],
			[ 0x2750 , "UPPER RIGHT DROP-SHADOWED WHITE SQUARE"],
			[ 0x2751 , "LOWER RIGHT SHADOWED WHITE SQUARE"],
			[ 0x2752 , "UPPER RIGHT SHADOWED WHITE SQUARE"],
			  
			[ 0 , "Box Drawing" ],
			[ 0x2500 , "BOX DRAWINGS LIGHT HORIZONTAL "],
			[ 0x2501 , "BOX DRAWINGS HEAVY HORIZONTAL"],
			[ 0x2502 , "BOX DRAWINGS LIGHT VERTICAL"],
			[ 0x2503 , "BOX DRAWINGS HEAVY VERTICAL"],
			[ 0x2504 , "BOX DRAWINGS LIGHT TRIPLE DASH HORIZONTAL"],
			[ 0x2505 , "BOX DRAWINGS HEAVY TRIPLE DASH HORIZONTAL"],
			[ 0x2506 , "BOX DRAWINGS LIGHT TRIPLE DASH VERTICAL"],
			[ 0x2507 , "BOX DRAWINGS HEAVY TRIPLE DASH VERTICAL"],
			[ 0x2508 , "BOX DRAWINGS LIGHT QUADRUPLE DASH HORIZONTAL"],
			[ 0x2509 , "BOX DRAWINGS HEAVY QUADRUPLE DASH HORIZONTAL"],
			[ 0x250A , "BOX DRAWINGS LIGHT QUADRUPLE DASH VERTICAL"],
			[ 0x250B , "BOX DRAWINGS HEAVY QUADRUPLE DASH VERTICAL"],
			[ 0x250C , "BOX DRAWINGS LIGHT DOWN AND RIGHT"],
			[ 0x250D , "BOX DRAWINGS DOWN LIGHT AND RIGHT HEAVY"],
			[ 0x250E , "BOX DRAWINGS DOWN HEAVY AND RIGHT LIGHT"],
			[ 0x250F , "BOX DRAWINGS HEAVY DOWN AND RIGHT"],
			
			[ 0x2510 , "BOX DRAWINGS LIGHT DOWN AND LEFT"],
			[ 0x2511 , "BOX DRAWINGS DOWN LIGHT AND LEFT HEAVY"],
			[ 0x2512 , "BOX DRAWINGS DOWN HEAVY AND LEFT LIGHT"],
			[ 0x2513 , "BOX DRAWINGS HEAVY DOWN AND LEFT"],
			[ 0x2514 , "BOX DRAWINGS LIGHT UP AND RIGHT"],
			[ 0x2515 , "BOX DRAWINGS UP LIGHT AND RIGHT HEAVY"],
			[ 0x2516 , "BOX DRAWINGS UP HEAVY AND RIGHT LIGHT"],
			[ 0x2517 , "BOX DRAWINGS HEAVY UP AND RIGHT"],
			[ 0x2518 , "BOX DRAWINGS LIGHT UP AND LEFT"],
			[ 0x2519 , "BOX DRAWINGS UP LIGHT AND LEFT HEAVY"],
			[ 0x251A , "BOX DRAWINGS UP HEAVY AND LEFT LIGHT"],
			[ 0x251B , "BOX DRAWINGS HEAVY UP AND LEFT"],
			[ 0x251C , "BOX DRAWINGS LIGHT VERTICAL AND RIGHT"],
			[ 0x251D , "BOX DRAWINGS VERTICAL LIGHT AND RIGHT HEAVY"],
			[ 0x251E , "BOX DRAWINGS UP HEAVY AND RIGHT DOWN LIGHT"],
			[ 0x251F , "BOX DRAWINGS DOWN HEAVY AND RIGHT UP LIGHT"],
			
			[ 0x2520 , "BOX DRAWINGS VERTICAL HEAVY AND RIGHT LIGHT"],
			[ 0x2521 , "BOX DRAWINGS DOWN LIGHT AND RIGHT UP HEAVY"],
			[ 0x2522 , "BOX DRAWINGS UP LIGHT AND RIGHT DOWN HEAVY"],
			[ 0x2523 , "BOX DRAWINGS HEAVY VERTICAL AND RIGHT"],
			[ 0x2524 , "BOX DRAWINGS LIGHT VERTICAL AND LEFT"],
			[ 0x2525 , "BOX DRAWINGS VERTICAL LIGHT AND LEFT HEAVY"],
			[ 0x2526 , "BOX DRAWINGS UP HEAVY AND LEFT DOWN LIGHT"],
			[ 0x2527 , "BOX DRAWINGS DOWN HEAVY AND LEFT UP LIGHT"],
			[ 0x2528 , "BOX DRAWINGS VERTICAL HEAVY AND LEFT LIGHT"],
			[ 0x2529 , "BOX DRAWINGS DOWN LIGHT AND LEFT UP HEAVY"],
			[ 0x252A , "BOX DRAWINGS UP LIGHT AND LEFT DOWN HEAVY"],
			[ 0x252B , "BOX DRAWINGS HEAVY VERTICAL AND LEFT"],
			[ 0x252C , "BOX DRAWINGS LIGHT DOWN AND HORIZONTAL"],
			[ 0x252D , "BOX DRAWINGS LEFT HEAVY AND RIGHT DOWN LIGHT"],
			[ 0x252E , "BOX DRAWINGS RIGHT HEAVY AND LEFT DOWN LIGHT"],
			[ 0x252F , "BOX DRAWINGS DOWN LIGHT AND HORIZONTAL HEAVY"],
			
			[ 0x2530 , "BOX DRAWINGS DOWN HEAVY AND HORIZONTAL LIGHT"],
			[ 0x2531 , "BOX DRAWINGS RIGHT LIGHT AND LEFT DOWN HEAVY"],
			[ 0x2532 , "BOX DRAWINGS LEFT LIGHT AND RIGHT DOWN HEAVY"],
			[ 0x2533 , "BOX DRAWINGS HEAVY DOWN AND HORIZONTAL"],
			[ 0x2534 , "BOX DRAWINGS LIGHT UP AND HORIZONTAL"],
			[ 0x2535 , "BOX DRAWINGS LEFT HEAVY AND RIGHT UP LIGHT"],
			[ 0x2536 , "BOX DRAWINGS RIGHT HEAVY AND LEFT UP LIGHT"],
			[ 0x2537 , "BOX DRAWINGS UP LIGHT AND HORIZONTAL HEAVY"],
			[ 0x2538 , "BOX DRAWINGS UP HEAVY AND HORIZONTAL LIGHT"],
			[ 0x2539 , "BOX DRAWINGS RIGHT LIGHT AND LEFT UP HEAVY"],
			[ 0x253A , "BOX DRAWINGS LEFT LIGHT AND RIGHT UP HEAVY"],
			[ 0x253B , "BOX DRAWINGS HEAVY UP AND HORIZONTAL"],
			[ 0x253C , "BOX DRAWINGS LIGHT VERTICAL AND HORIZONTAL"],
			[ 0x253D , "BOX DRAWINGS LEFT HEAVY AND RIGHT VERTICAL LIGHT"],
			[ 0x253E , "BOX DRAWINGS RIGHT HEAVY AND LEFT VERTICAL LIGHT"],
			[ 0x253F , "BOX DRAWINGS VERTICAL LIGHT AND HORIZONTAL HEAVY"],
			
			[ 0x2540 , "BOX DRAWINGS UP HEAVY AND DOWN HORIZONTAL LIGHT"],
			[ 0x2541 , "BOX DRAWINGS DOWN HEAVY AND UP HORIZONTAL LIGHT"],
			[ 0x2542 , "BOX DRAWINGS VERTICAL HEAVY AND HORIZONTAL LIGHT"],
			[ 0x2543 , "BOX DRAWINGS LEFT UP HEAVY AND RIGHT DOWN LIGHT"],
			[ 0x2544 , "BOX DRAWINGS RIGHT UP HEAVY AND LEFT DOWN LIGHT"],
			[ 0x2545 , "BOX DRAWINGS LEFT DOWN HEAVY AND RIGHT UP LIGHT"],
			[ 0x2546 , "BOX DRAWINGS RIGHT DOWN HEAVY AND LEFT UP LIGHT"],
			[ 0x2547 , "BOX DRAWINGS DOWN LIGHT AND UP HORIZONTAL HEAVY"],
			[ 0x2548 , "BOX DRAWINGS UP LIGHT AND DOWN HORIZONTAL HEAVY"],
			[ 0x2549 , "BOX DRAWINGS RIGHT LIGHT AND LEFT VERTICAL HEAVY"],
			[ 0x254A , "BOX DRAWINGS LEFT LIGHT AND RIGHT VERTICAL HEAVY"],
			[ 0x254B , "BOX DRAWINGS HEAVY VERTICAL AND HORIZONTAL"],
			[ 0x254C , "BOX DRAWINGS LIGHT DOUBLE DASH HORIZONTAL"],
			[ 0x254D , "BOX DRAWINGS HEAVY DOUBLE DASH HORIZONTAL"],
			[ 0x254E , "BOX DRAWINGS LIGHT DOUBLE DASH VERTICAL"],
			[ 0x254F , "BOX DRAWINGS HEAVY DOUBLE DASH VERTICAL"],
			
			[ 0x2550 , "BOX DRAWINGS DOUBLE HORIZONTAL"],
			[ 0x2551 , "BOX DRAWINGS DOUBLE VERTICAL"],
			[ 0x2552 , "BOX DRAWINGS DOWN SINGLE AND RIGHT DOUBLE"],
			[ 0x2553 , "BOX DRAWINGS DOWN DOUBLE AND RIGHT SINGLE"],
			[ 0x2554 , "BOX DRAWINGS DOUBLE DOWN AND RIGHT"],
			[ 0x2555 , "BOX DRAWINGS DOWN SINGLE AND LEFT DOUBLE"],
			[ 0x2556 , "BOX DRAWINGS DOWN DOUBLE AND LEFT SINGLE"],
			[ 0x2557 , "BOX DRAWINGS DOUBLE DOWN AND LEFT"],
			[ 0x2558 , "BOX DRAWINGS UP SINGLE AND RIGHT DOUBLE"],
			[ 0x2559 , "BOX DRAWINGS UP DOUBLE AND RIGHT SINGLE"],
			[ 0x255A , "BOX DRAWINGS DOUBLE UP AND RIGHT"],
			[ 0x255B , "BOX DRAWINGS UP SINGLE AND LEFT DOUBLE"],
			[ 0x255C , "BOX DRAWINGS UP DOUBLE AND LEFT SINGLE"],
			[ 0x255D , "BOX DRAWINGS DOUBLE UP AND LEFT"],
			[ 0x255E , "BOX DRAWINGS VERTICAL SINGLE AND RIGHT DOUBLE"],
			[ 0x255F , "BOX DRAWINGS VERTICAL DOUBLE AND RIGHT SINGLE"],
			
			[ 0x2560 , "BOX DRAWINGS DOUBLE VERTICAL AND RIGHT"],
			[ 0x2561 , "BOX DRAWINGS VERTICAL SINGLE AND LEFT DOUBLE"],
			[ 0x2562 , "BOX DRAWINGS VERTICAL DOUBLE AND LEFT SINGLE"],
			[ 0x2563 , "BOX DRAWINGS DOUBLE VERTICAL AND LEFT"],
			[ 0x2564 , "BOX DRAWINGS DOWN SINGLE AND HORIZONTAL DOUBLE"],
			[ 0x2565 , "BOX DRAWINGS DOWN DOUBLE AND HORIZONTAL SINGLE"],
			[ 0x2566 , "BOX DRAWINGS DOUBLE DOWN AND HORIZONTAL"],
			[ 0x2567 , "BOX DRAWINGS UP SINGLE AND HORIZONTAL DOUBLE"],
			[ 0x2568 , "BOX DRAWINGS UP DOUBLE AND HORIZONTAL SINGLE"],
			[ 0x2569 , "BOX DRAWINGS DOUBLE UP AND HORIZONTAL"],
			[ 0x256A , "BOX DRAWINGS VERTICAL SINGLE AND HORIZONTAL DOUBLE"],
			[ 0x256B , "BOX DRAWINGS VERTICAL DOUBLE AND HORIZONTAL SINGLE"],
			[ 0x256C , "BOX DRAWINGS DOUBLE VERTICAL AND HORIZONTAL"],
			[ 0x256D , "BOX DRAWINGS LIGHT ARC DOWN AND RIGHT"],
			[ 0x256E , "BOX DRAWINGS LIGHT ARC DOWN AND LEFT"],
			[ 0x256F , "BOX DRAWINGS LIGHT ARC UP AND LEFT"],
			
			[ 0x2570 , "BOX DRAWINGS LIGHT ARC UP AND RIGHT"],
			[ 0x2571 , "BOX DRAWINGS LIGHT DIAGONAL UPPER RIGHT TO LOWER LEFT"],
			[ 0x2572 , "BOX DRAWINGS LIGHT DIAGONAL UPPER LEFT TO LOWER RIGHT"],
			[ 0x2573 , "BOX DRAWINGS LIGHT DIAGONAL CROSS"],
			[ 0x2574 , "BOX DRAWINGS LIGHT LEFT"],
			[ 0x2575 , "BOX DRAWINGS LIGHT UP"],
			[ 0x2576 , "BOX DRAWINGS LIGHT RIGHT"],
			[ 0x2577 , "BOX DRAWINGS LIGHT DOWN"],
			[ 0x2578 , "BOX DRAWINGS HEAVY LEFT"],
			[ 0x2579 , "BOX DRAWINGS HEAVY UP"],
			[ 0x257A , "BOX DRAWINGS HEAVY RIGHT"],
			[ 0x257B , "BOX DRAWINGS HEAVY DOWN"],
			[ 0x257C , "BOX DRAWINGS LIGHT LEFT AND HEAVY RIGHT"],
			[ 0x257D , "BOX DRAWINGS LIGHT UP AND HEAVY DOWN"],
			[ 0x257E , "BOX DRAWINGS HEAVY LEFT AND LIGHT RIGHT"],
			[ 0x257F , "BOX DRAWINGS HEAVY UP AND LIGHT DOWN"],
			
			[ 0 , "" ],
			[ 0x23BA , "HORIZONTAL SCAN LINE-1"],
			[ 0x23BB , "HORIZONTAL SCAN LINE-3"],
			[ 0x23BC , "HORIZONTAL SCAN LINE-7"],
			[ 0x23BD , "HORIZONTAL SCAN LINE-9"],
			[ 0x23B8 , "LEFT VERTICAL BOX LINE"],
			[ 0x23B9 , "RIGHT VERTICAL BOX LINE"],
			
			[ 0 , "Block Elements" ],
			[ 0x2580 , "UPPER HALF BLOCK"],
			[ 0x2581 , "LOWER ONE EIGHT BLOCK"],
			[ 0x2582 , "LOWER ONE QUARTER BLOCK"],
			[ 0x2583 , "LOWER THREE EIGHTS BLOCK"],
			[ 0x2584 , "LOWER HALF BLOCK"],
			[ 0x2585 , "LOWER FIVE EIGHTS BLOCK"],
			[ 0x2586 , "LOWER THREE QUARTERS BLOCK"],
			[ 0x2587 , "LOWER SEVEN EIGHTS BLOCK"],
			[ 0x2588 , "FULL BLOCK"],
			[ 0x2589 , "LEFT SEVEN EIGHTS BLOCK"],
			[ 0x258A , "LEFT THREE QUARTERS BLOCK"],
			[ 0x258B , "LEFT FIVE EIGHTS BLOCK"],
			[ 0x258C , "LEFT HALF BLOCK"],
			[ 0x258D , "LEFT THREE EIGHTS BLOCK"],
			[ 0x258E , "LEFT ONE QUARTER BLOCK"],
			[ 0x258F , "LEFT ONE EIGHT BLOCK"],
			
			[ 0x2590 , "RIGHT HALF BLOCK"],
			[ 0x2591 , "LIGHT SHADE"],
			[ 0x2592 , "MEDIUM SHADE"],
			[ 0x2593 , "DARK SHADE"],
			[ 0x2594 , "UPPER ONE EIGHT BLOCK"],
			[ 0x2595 , "RIGHT ONE EIGHT BLOCK"],
			[ 0x2596 , "QUADRANT LOWER LEFT"],
			[ 0x2597 , "QUADRANT LOWER RIGHT"],
			[ 0x2598 , "QUADRANT UPPER LEFT"],
			[ 0x259D , "QUADRANT UPPER RIGHT"],
			[ 0x2599 , "QUADRANT UPPER LEFT AND LOWER LEF T AND LOWER RIGHT"],
			[ 0x259A , "QUADRANT UPPER LEFT AND LOWER RIGHT"],
			[ 0x259B , "QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER LEFT"],
			[ 0x259C , "QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER RIGHT"],
			[ 0x259E , "QUADRANT UPPER RIGHT AND LOWER LEFT"],
			[ 0x259F , "QUADRANT UPPER RIGHT AND LOWER LEFT AND LOWER RIGHT"],
			
			[ 0x2758 , "LIGHT VERTICAL BAR"],
			[ 0x2759 , "MEDIUM VERTICAL BAR"],
			[ 0x275A , "HEAVY VERTICAL BAR"],
			
			[0, "Spaces"],
			[32 , "Normal Space" ],
			[0x2002 , "en_space" ],
			[0x2003 , "em_space" ],
			[0x2005 , "for-per-em_space" ],
			
			
			[ 0 , "Dingbats"],	 
			
			[ 0x2701 , "UPPER BLADE SCISSORS"],
			[ 0x2702 , "BLACK SCISSORS"],
			[ 0x2703 , "LOWER BLADE SCISSORS"],
			[ 0x2704 , "WHITE SCISSORS"],
			[ 0x2705 , "WHITE HEAVY CHECK MARK"],
			[ 0x2714 , "BLACK HEAVY CHECK MARK"],
			[ 0x2713 , "CHECK MARK"],
			[ 0x2706 , "TELEPHONE LOCATION SIGN"],
			[ 0x2707 , "TAPE DRIVE"],
			[ 0x2708 , "AIRPLANE"],
			[ 0x2709 , "ENVELOPE"],
			[ 0x270A , "RAISED FIST"],
			[ 0x270B , "RAISED HAND"],
			[ 0x270C , "VICTORY HAND"],
			[ 0x270D , "WRITTING HAND"],
			[ 0x270E , "LOWER RIGHT PENCIL"],
			[ 0x270F , "PENCIL"],
			
			[ 0x2710 , "UPPER RIGHT PENCIL"],
			[ 0x2711 , "WHITE NIB"],
			[ 0x2712 , "BLACK NIB"],
			[ 0x2715 , "MULTIPLICATION x"],
			[ 0x2716 , "HEAVY MULTIPLICATION x"],
			[ 0x2795 , "HEAVY PLUS SIGN"],
			[ 0x2796 , "HEAVY MINUS SIGN"],
			[ 0x2797 , "HEAVY DIVISION SIGN"],
			[ 0x2717 , "BALLOT X"],
			[ 0x2718 , "HEAVY BALLOT X"],
			
			[ 0x274C , "CROSS MARK"],
			[ 0x274D , "SHADOWED WHITE CIRCLE"],
			[ 0x274E , "NEGATIVE SQUARED CROSS MARK"],
			[ 0x274F , "LOWER RIGHT DROP-SHADOWED WHITE SQUARE"],
			
			[ 0x2750 , "UPPER RIGHT DROP-SHADOWED WHITE SQUARE"],
			[ 0x2751 , "LOWER RIGHT SHADOWED WHITE SQUARE"],
			[ 0x2752 , "UPPER RIGHT SHADOWED WHITE SQUARE"],
			[ 0x2753 , "BLACK QUESTION MARK ORNAMENT"],
			[ 0x2754 , "WHITE QUESTION MARK ORNAMENT"],
			[ 0x2755 , "WHITE EXCLAMATION MARK ORNAMENT"],
			[ 0x2756 , "BLACK DIAMOND MINUE WHITE X"],
			[ 0x2757 , "HEAVY EXCLAMATION MARK SYMBOL"],
			[ 0x2758 , "LIGHT VERTICAL BAR"],
			[ 0x2759 , "MEDIUM VERTICAL BAR"],
			[ 0x275A , "HEAVY VERTICAL BAR"],
			
			[ 0x27B0 , "CURLY LOOP"],
			[ 0x27BF , "DOUBLE CURLEY LOOP"],
			
			[ 0 , "Stars, Asterisks and Snowflakes"],
			[ 0x2722 , "FOUR TEARDTOP-SPOKED ASTERISK"],
			[ 0x2723 , "FOUR BALOON-SPOKED ASTERISK"],
			[ 0x2724 , "HEAVY FOUR BALOON-SPOKED ASTERISK"],
			[ 0x2725 , "FOUR CLUB-SPOKED ASTERISK"],
			[ 0x2726 , "BLACK FOUR POINTED STAR"],
			[ 0x2727 , "WHITE FOUR POINTED STAR"],
			[ 0x2728 , "SPARKLES"],
			[ 0x2606 , "WHITE STAR"],
			[ 0x2729 , "STRESS OUTLINED WHITE STAR"],
			[ 0x272A , "CIRCLED WHITE STAR"],
			[ 0x272B , "OPEN CENTRE BLACK STAR"],
			[ 0x272C , "BLACK CENTRE WHITE STAR"],
			[ 0x272D , "OUTLINED BLACK STAR"],
			[ 0x272E , "HEAVY OUTLINED BLACK STAR"],
			[ 0x272F , "PINWHEEL STAR"],
			
			[ 0x2730 , "SHADOWED WHITE STAR"],
			[ 0x2731 , "HEAVY ASTERISK"],
			[ 0x2732 , "OPEN CENTRE ASTERISK"],
			[ 0x2733 , "EIGHT SPOKED ASTERISK"],
			[ 0x2734 , "EIGHT POINTED BLACK STAR"],
			[ 0x2735 , "EIGHT POINTED PINWHEEL STAR"],
			[ 0x2736 , "SIX POINTED BLACK STAR"],
			[ 0x2737 , "EIGHT POINTED RECTILINEAR BLACK STAR"],
			[ 0x2738 , "HEAVY EIGHT POINTED RECTILINEAR BLACK STAR"],
			[ 0x2739 , "TWELVE POINTED BLACK STAR"],
			[ 0x273A , "SIXTEEN POINTED BLACK STAR"],
			[ 0x273B , "TEARDROP-SPOKED ASTERISK"],
			[ 0x273C , "OPEN CENTRE TEARDROP-SPOKED ASTERISK"],
			[ 0x273D , "HEAVY TEARDROP-SPOKED ASTERISK"],
			[ 0x273E , "SIX PETALLED BLACK AND WHITE FLORETTE"],
			[ 0x273F , "BLACK FLORETTE"],
			
			[ 0x2740 , "WHITE FLORETTE"],
			[ 0x2741 , "EIGHT PETALED OUTLINED BLACK FLORETTE"],
			[ 0x2742 , "CIRCLED OPEN CENTER EIGHT POINTED STAR"],
			[ 0x2743 , "HEAVY TEARDROP-SPOKED PINWHEELED ASTERISK"],
			[ 0x2744 , "SNOWFLAKE"],
			[ 0x2745 , "TIGHT TRIFOLIATE SNOWFLAKE"],
			[ 0x2746 , "HEAVY CHEVRON SNOWFLAKE"],
			[ 0x2747 , "SPARKLE"],
			[ 0x2748 , "HEAVY SPARKLE"],
			[ 0x2749 , "BALOON-SPOKED ASTERISK"],
			[ 0x274A , "EIGHT TEARDROP-SPOKED PROPELLER ASTERISK"],
			[ 0x274B , "HEAVY EIGHT TEARDROP-SPOKED PROPELLER ASTERISK"],
			
			[ 0 , "Punctuation Ornaments"],
			[ 0x275B , "HEAVY SINGLE TURNED COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275C , "HEAVY SINGLE COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275D , "HEAVY DOUBLE TURNED COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275E , "HEAVY DOUBLE COMMA QUOTATION MARK ORNAMENT"],
			[ 0x275F , "HEAVY LOW SINGLE COMMA QUOTATION MARK ORNAMENT"],
			
			[ 0x2760 , "HEAVY LOW DOUBLE COMMA QUOTATION MARK ORNAMENT"],
			[ 0x2761 , "CURVED STEM PARAGRAPH SIGN ORNAMENT"],
			[ 0x2762 , "HEAVY EXCLAIMATION MARK ORNAMENT"],
			[ 0x2763 , "HEAVY HEART EXCLAMATION MARK ORNAMENT"],
			[ 0x2764 , "HEAVY BLACK HEART"],
			[ 0x2765 , "ROTATED HEAVY BLACK HEART BULLET"],
			[ 0x2766 , "FLORAL HEART"],
			[ 0x2767 , "ROTATED FLORAL HEART BULLET"],
			[ 0x2619 , "REVERSE ROTATED FLORAL HEART BULLET"],
			[ 0x2768 , "MEDIUM LEFT PARENTHESIS ORNAMENT"],
			[ 0x2769 , "MEDIUM RIGHT PARENTHESIS ORNAMENT"],
			[ 0x276A , "MEDIUM FLATTENED LEFT PARENTHESIS ORNAMENT"],
			[ 0x276B , "MEDIUM FLATTENED RIGHT PARENTHESIS ORNAMENT"],
			[ 0x276C , "MEDIUM LEFT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x276D , "MEDIUM RIGHT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x276E , "HEAVY LEFT-POINTING ANGEL QUOTATION MARK ORNAMENT"],
			[ 0x276F , "HEAVY RIGHT-POINTING ANGEL QUOTATION MARK ORNAMENT"],
			
			[ 0x2770 , "HEAVY LEFT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x2771 , "HEAVY RIGHT-POINTING ANGEL BRACKET ORNAMENT"],
			[ 0x2772 , "LIGHT LEFT-POINTING TORTOISE SHELL BRACKED ORNAMENT"],
			[ 0x2773 , "LIGHT RIGHT-POINTING TORTOISE SHELL BRACKED ORNAMENT"],
			[ 0x2774 , "MEDIUM LEFT CURLY BRACKET ORNAMENT"],
			[ 0x2775 , "MEDIUM RIGHT CURLY BRACKET ORNAMENT"],
			
			[ 0 , "Dingbat Circled Digits"],
			[ 0x2776 , "DINGBAT NEGATIVE CIRCLED DIGIT ONE"],
			[ 0x2777 , "DINGBAT NEGATIVE CIRCLED DIGIT TWO"],
			[ 0x2778 , "DINGBAT NEGATIVE CIRCLED DIGIT THREE"],
			[ 0x2779 , "DINGBAT NEGATIVE CIRCLED DIGIT FOUR"],
			[ 0x277A , "DINGBAT NEGATIVE CIRCLED DIGIT FIVE"],
			[ 0x277B , "DINGBAT NEGATIVE CIRCLED DIGIT SIX"],
			[ 0x277C , "DINGBAT NEGATIVE CIRCLED DIGIT SEVEN"],
			[ 0x277D , "DINGBAT NEGATIVE CIRCLED DIGIT EIGHT"],
			[ 0x277E , "DINGBAT NEGATIVE CIRCLED DIGIT NINE"],
			[ 0x277F , "DINGBAT NEGATIVE CIRCLED NUMBER TEN"],
			
			[ 0x2780 , "DINGBAT CIRCLED SANS-SERIF DIGIT ONE"],
			[ 0x2781 , "DINGBAT CIRCLED SANS-SERIF DIGIT TWO"],
			[ 0x2782 , "DINGBAT CIRCLED SANS-SERIF DIGIT THREE"],
			[ 0x2783 , "DINGBAT CIRCLED SANS-SERIF DIGIT FOUR"],
			[ 0x2784 , "DINGBAT CIRCLED SANS-SERIF DIGIT FIVE"],
			[ 0x2785 , "DINGBAT CIRCLED SANS-SERIF DIGIT SIX"],
			[ 0x2786 , "DINGBAT CIRCLED SANS-SERIF DIGIT SEVER"],
			[ 0x2787 , "DINGBAT CIRCLED SANS-SERIF DIGIT EIGHT"],
			[ 0x2788 , "DINGBAT CIRCLED SANS-SERIF DIGIT NINE"],
			[ 0x2789 , "DINGBAT CIRCLED SANS-SERIF NUMBER TEN"],
			[ 0x278A , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT ONE"],
			[ 0x278B , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT TWO"],
			[ 0x278C , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT THREE"],
			[ 0x278D , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT FOUR"],
			[ 0x278E , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT FIVE"],
			[ 0x278F , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT SIX"],
			
			[ 0x2790 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT SEVEN"],
			[ 0x2791 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT EIGHT"],
			[ 0x2792 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF DIGIT NINE"],
			[ 0x2793 , "DINGBAT NEGATIVE CIRCLED SANS-SERIF NUMBER TEN"],
			
			[ 0 , "Dingbat Arrows"],
			[ 0x2794 , "HEAVY WIDE-HEADED RIGHTWARDS ARROW"],
			[ 0x2798 , "HEAVY SOUTH EAST ARROW"],
			[ 0x2799 , "HEAVY RIGHTWARDS ARROW"],
			[ 0x279A , "HEAVY NORTH EAST ARROW"],
			[ 0x279B , "DRAFTING POINT RIGHTWARDS ARROW"],
			[ 0x279C , "HEAVY ROUND-TIPPED RIGHTWARDS ARROW"],
			[ 0x279D , "TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279E , "HEAVY TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279F , "DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			
			[ 0x27A0 , "HEAVY DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ [0x27A1,0xFE0E] , "BLACK RIGHTWARDS ARROW","font-family: inherit;"],
			[ [0x2B05,0xFE0E] , "BLACK LEFTWARDS ARROW","font-family: inherit;"],
			[ 0x27A2 , "THREE-D TOP-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A3 , "THREE-D BOTTOM-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A4 , "BLACK RIGHTWARDS ARROWHEAD"],
			[ 0x27A5 , "HEAVY BLACK CURVED DOWNAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A6 , "HEAVY BLACK CURVED UPAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A7 , "SQUAT BLACK RIGHTWARDS ARROW"],
			[ 0x27A8 , "HEAVY CONCAVE-POIINTED BLACK RIGHTWARDS ARROW"],
			[ 0x27A9 , "RIGHT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AA , "LEFT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AB , "BLACK-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AC , "FRONT-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AD , "HEAVY LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AE , "HEAVY UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AF , "NOTCHED LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			
			[ 0x27B1 , "NOTCHED UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27B2 , "CIRCLED HEAVY WHITE RIGHTWARDS ARROW"],
			[ 0x27B3 , "WHITE-FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B4 , "BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B5 , "BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B6 , "BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27B7 , "HEAVY BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B8 , "HEAVY BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B9 , "HEAVY BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27BA , "TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BB , "HEAVY TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BC , "WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BD , "HEAVY WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BE , "OPEN-OUTLINED RIGHTWARDS ARROW"],
			
			
			[ 0 , "Simple Arrows"],
			[ 0x2190 , "LEFTWARDS ARROW"],
			[ 0x2191 , "UPWARDS ARROW"],
			[ 0x2192 , "RIGHTWARDS ARROW"],
			[ 0x2193 , "DOWNWARDS ARROW"],
			[ [0x2194,0xFE0E] , "LEFT RIGHT ARROW","font-family: inherit;"],
			[ [0x2195,0xFE0E] , "UP DOWN ARROW","font-family: inherit;"],
			[ [0x2196,0xFE0E] , "NORTH WEST ARROW","font-family: inherit;"],
			[ [0x2197,0xFE0E] , "NORTH EAST ARROW","font-family: inherit;"],
			[ [0x2198,0xFE0E] , "SOUTH EAST ARROW","font-family: inherit;"],
			[ [0x2199,0xFE0E] , "SOUTH WEST ARROW","font-family: inherit;"],
			
			[ 0x23AF , "HORIZONTAL LINE EXTENSION"],
			[ 0x23D0 , "VERTICAL LINE EXTENSION"],
			
			[ 0 , "Arrows with modifications"],
			[ 0x219A , "LEFTWARDS ARROW WITH STROKE"],
			[ 0x219B , "RIGHTWARDS ARROW WITH STROKE"],
			[ 0x219C , "LEFTWARDS WAVE ARROW"],
			[ 0x219D , "RIGHTWARDS WAVE ARROW"],
			[ 0x219E , "LEFTWARDS TWO HEADED ARROW"],
			[ 0x219F , "UPWARDS TWO HEADED ARROW"],
			
			[ 0x21A0 , "RIGHTWARDS TWO HEADED ARROW"],
			[ 0x21A1 , "DOWNWARDS TWO HEADED ARROW"],
			[ 0x21A2 , "LEFTWARDS ARROW WITH TAIL"],
			[ 0x21A3 , "RIGHTWARDS ARROW WITH TAIL"],
			[ 0x21A4 , "LEFTWARDS ARROW FROM BAR"],
			[ 0x21A5 , "UPWARDS ARROW FROM BAR"],
			[ 0x21A6 , "RIGHTWARDS ARROW FROM BAR"],
			[ 0x21A7 , "DOWNWARDS ARROW FROM BAR"],
			[ 0x21A8 , "UP DOWN ARROW WITH BASE"],
			[ [0x21A9,0xFE0E] , "LEFTWARDS ARROW WITH HOOK","font-family: inherit;"],
			[ [0x21AA,0xFE0E] , "RIGHTWARDS ARROW WITH HOOK","font-family: inherit;"],
			[ 0x21AB , "LEFTWARDS ARROW WITH LOOP"],
			[ 0x21AC , "RIGHTWARDS ARROW WITH LOOP"],
			[ 0x21AD , "LEFT RIGHT WAVE ARROW"],
			[ 0x21AE , "LEFT RIGHT ARROW WITH STROKE"],
			[ 0x21AF , "DOWNWARDS ZIGZAG ARROW"],
			
			[ 0x21B0 , "UPWARDS ARROW WITH TIP LEFTWARDS"],
			[ 0x21B1 , "UPWARDS ARROW WITH TIP RIGHTWARDS"],
			[ 0x21B2 , "DOWNWARDS ARROW WITH TIP LEFTWARDS"],
			[ 0x21B3 , "DOWNWARDS ARROW WITH TIP RIGHTWARDS"],
			
			[ 0x2B0E , "RIGHTWARDS ARROW WITH TIP DOWNWARDS"],
			[ 0x2B0F , "RIGHTWARDS ARROW WITH TIP UPWARDS"],
			[ 0x2B10 , "LEFTWARDS ARROW WITH TIP DOWNWARDS"],
			[ 0x2B11 , "LEFTWARDS ARROW WITH TIP UPWARDS"],
			
			[ 0 , "Keyboard Symbols and Circle Arrows"],
			[ 0x21B4 , "RIGHTWARDS ARROW WITH CORNER DOWNWARDS"],
			[ 0x21B5 , "DOWNWARDS ARROW WITH CORNER LEFTWARDS"],
			[ 0x21B6 , "ANTICLOCKWISE TOP SEMICIRCLE ARROW"],
			[ 0x21B7 , "CLOCKWISE TOP SEMICIRCLE ARROW"],
			[ 0x21B8 , "NORTHWEST ARROW TO LONG BAR"],
			[ 0x21B9 , "LEFTWARDS ARROW TO BAR OVER RIGHTWARDS ARROW TO BAR"],
			[ 0x21BA , "ANTICLOCKWISE OPEN CIRCLE ARROW"],
			[ 0x21BB , "CLOCKWISE OPEN CIRCLE ARROW"],
			[ 0 , "Harpoons"],
			[ 0x21BC , "LEFTWARDS HARPOON WITH BARB UPWARDS"],
			[ 0x21BD , "LEFTWARDS HARPOON WITH BARB DOWNWARDS"],
			[ 0x21BE , "UPWARDS HARPOON WITH BARB RIGHTWARDS"],
			[ 0x21BF , "UPWARDS HARPOON WITH BARB LEFTWARDS"],
			
			[ 0x21C0 , "RIGHTWARDS HARPOON WITH BARB UPWARDS"],
			[ 0x21C1 , "RIGHTWARDS HARPOON WITH BARB DOWNWARDS"],
			[ 0x21C2 , "DOWNWARDS HARPOON WITH BARB RIGHTWARDS"],
			[ 0x21C3 , "DOWNWARDS HARPOON WITH BARB LEFTWARDS"],
			[ 0 , "Paired Arrows and Harpoons"],
			[ 0x21C4 , "RIGHTWARDS ARROW OVER LEFTWARDS ARROW"],
			[ 0x21C5 , "UPWARDS ARROW LEFTWARDS OF DOWNWARDS ARROW"],
			[ 0x21C6 , "LEFTWARDS ARROW OVER RIGHTWARDS ARROW"],
			[ 0x21C7 , "LEFTWARDS PAIRED ARROWS"],
			[ 0x21C8 , "UPWARDS PAIRED ARROWS"],
			[ 0x21C9 , "RIGHTWARDS PAIRD ARROWS"],
			[ 0x21CA , "DOWNWARDS PAIRED ARROWS"],
			[ 0x21CB , "LEFTWARDS HARPOON OVER RIGHTWARDS HARPOON"],
			[ 0x21CC , "RIGHTWARDS HARPOON OVER LEFTWARDS HARPOON"],
			[ 0 , "Double Arrows"],
			[ 0x21CD , "LEFTWARDS DOUBLE ARROW WITH STROKE"],
			[ 0x21CE , "LEFT RIGHT DOUBLE ARROW WITH STROKE"],
			[ 0x21CF , "RIGHTWARDS DOUBLE ARROW WITH STROKE"],
			
			[ 0x21D0 , "LEFTWARDS DOUBLE ARROW"],
			[ 0x21D1 , "UPWARDS DOUBLE ARROW"],
			[ 0x21D2 , "RIGHTWARDS DOUBLE ARROW"],
			[ 0x21D3 , "DOWNWARDS DOUBLE ARROW"],
			[ 0x21D4 , "LEFT RIGHT DOUBLE ARROW"],
			[ 0x21D5 , "UP DOWN DOUBLE ARROW"],
			[ 0x21D6 , "NORTH WEST DOUBLE ARROW"],
			[ 0x21D7 , "NORTH EAST DOUBLE ARROW"],
			[ 0x21D8 , "SOUTH EAST DOUBLE ARROW"],
			[ 0x21D9 , "SOUTH WEST DOUBLE ARROW"],
			[ 0 , "Miscellaneous Arrows and Keyboard Sybmols"],
			[ 0x21DA , "LEFTWARDS TRIPLE ARROW"],
			[ 0x21DB , "RIGHTWARDS TRIPLE ARROW"],
			[ 0x21DC , "LEFTWARDS SQUIGGLE ARROW"],
			[ 0x21DD , "RIGHTWARDS SQUIGGLE ARROW"],
			[ 0x21DE , "UPWARDS ARROW WITH DOUBLE STROKE"],
			[ 0x21DF , "DOWNWARDS ARROW WITH DOUBLE STROKE"],
			
			[ 0x21E0 , "LEFTWARDS DASHED ARROW"],
			[ 0x21E1 , "UPWARDS DASHED ARROW"],
			[ 0x21E2 , "RIGHTWARDS DASHED ARROW"],
			[ 0x21E3 , "DOWNWARDS DASHED ARROW"],
			[ 0x21E4 , "LEFTWARDS ARROW TO BAR"],
			[ 0x21E5 , "RIGHTWARDS ARROW TO BAR"],
			[ 0 , "White Arrows and Keyboard Sybmols"],
			[ 0x21E6 , "LEFTWARDS WHITE ARROW"],
			[ 0x21E7 , "UPWARDS WHITE ARROW"],
			[ 0x21E8 , "RIGHTWARDS WHITE ARROW"],
			[ 0x21E9 , "DOWNWARDS WHITE ARROW"],
			[ 0x21EA , "UPWARDS WHITE ARROW FROM BAR"],
			[ 0x21EB , "UPWARDS WHITE ARROW ON A PEDESTAL"],
			[ 0x21EC , "UPWARDS WHITE ARROW ON A PEDESTAL WITH HORIZONTAL BAR"],
			[ 0x21ED , "UPWARDS WHITE ARROW ON A PEDESTAL WITH VERTICAL BAR"],
			[ 0x21EE , "UPWARDS WHITE DOUBLE ARROW"],
			[ 0x21EF , "UPWARDS WHITE DOUBLE ARROW ON A PEDESTAL"],
			
			[ 0x21F0 , "RIGHTWARDS WHITE ARROW FROM WALL"],
			[ 0x21F1 , "NORTH WEST ARROW TO CORNER"],
			[ 0x21F2 , "SOUTH EAST ARROW TO CORNER"],
			[ 0x21F3 , "UP DOWN WHITE ARROW"],
			
			[ 0x2B00 , "NORTH EAST WHITE ARROW"],
			[ 0x2B01 , "NORTH WEST WHITE ARROW"],
			[ 0x2B02 , "SOUTH EAST WHITE ARROW"],
			[ 0x2B03 , "SOUTH WEST WHITE ARROW"],
			
			[ 0 , "Black Arrows"],
			[ [0x27A1,0xFE0E] , "RIGHTWARDS BLACK ARROW","font-family: inherit;"],
			[ 0x279E , "HEAVY RIGHTWARDS BLACK ARROW"],
			[ [0x2B05,0xFE0E] , "LEFTWARDS BLACK ARROW","font-family: inherit;"],
			[ [0x2B06,0xFE0E] , "UPWARDS BLACK ARROW","font-family: inherit;"],
			[ [0x2B07,0xFE0E] , "DOWNWARDS BLACK ARROW","font-family: inherit;"],
			[ 0x2B08 , "NORTH EAST WHITE ARROW"],
			[ 0x2B09 , "NORTH WEST WHITE ARROW"],
			[ 0x2B0A , "SOUTH EAST WHITE ARROW"],
			[ 0x2B0B , "SOUTH WEST WHITE ARROW"],
			[ 0x2B0C , "LEFT RIGHT BLACK ARROW"],
			[ 0x2B0D , "UP DOWN BLACK ARROW"],
			
			
			[ 0 , "Miscellaneous Arrows"],
			[ 0x21F4 , "RIGHT ARROW WITH SMALL CIRCLE"],
			[ 0x21F5 , "DOWNWARDS ARROW LEFTWARDS OF UPWARDS ARROW"],
			[ 0x21F6 , "THREE RIGHTWARDS ARRWOS"],
			[ 0x21F7 , "LEFTWARDS ARROW WITH VERTICAL STROKE"],
			[ 0x21F8 , "RIGHTWARDS ARROW WITH VERTICAL STROKE"],
			[ 0x21F9 , "LEFT RIGHT ARROW WITH VERTICAL STROKE"],
			[ 0x21FA , "LEFTWARDS ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x21FB , "RIGHTWARDS ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x21FC , "LEFT RIGHT ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x21FD , "LEFTWARDS OPEN-HEADED ARROW"],
			[ 0x21FE , "RIGHTWARDS OPEN-HEADED ARROW"],
			[ 0x21FF , "LEFT RIGHT OPEN-HEADED ARROW"],
			[ 0x27F4 , "RIGHT ARROW WITH CIRCLED PLUS"],
			
			[ 0x2B30 , "LEFT ARROW WITH SMALL CIRCLE"],
			[ 0x2B31 , "THREE LEFTWARDS ARROW"],
			[ 0x2B32 , "LEFT ARROW WITH CIRCLED PLUS"],
			[ 0x2B34 , "LEFTWARDS TWO-HEADED ARROW WITH VERTICAL STROKE"],
			[ 0x2B35 , "LEFTWARDS TWO-HEADED ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x2B36 , "LEFTWARDS TWO-HEADED ARROW FROM BAR"],
			[ 0x2B37 , "LEFTWARDS TWO-HEADED TRIPPLE DASH ARROW"],
			[ 0x2B38 , "LEFTWARDS ARROW WITH DOTTED STEM"],
			[ 0x2B39 , "LEFTWARDS ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2B3A , "LEFTWARDS ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			[ 0x2B3B , "LEFTWARDS TWO-HEADED ARROW WITH TAIL"],
			[ 0x2B3C , "LEFTWARDS TWO-HEADED ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2B3D , "LEFTWARDS TWO-HEADED ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			
			[ 0x2B45 , "LEFTWARDS QUADRUPLE ARROW"],
			[ 0x2B46 , "RIGHTWARDS QUADRUPLE ARROW"],
			
			[ 0x27F0 , "UPWARDS QUADRUPLE ARROW"],
			[ 0x27F1 , "DOWNWARDS QUADRUPLE ARROW"],
			[ 0x27F2 , "ANTICLOCKWISE GAPPED CIRCLE ARROW"],
			[ 0x27F3 , "CLOCKWISE GAPPED CIRCLE ARROW"],
			
			[ 0x2900 , "RIGHTWARDS TWO-HEADED ARROW WITH VERTICAL STROKE"],
			[ 0x2901 , "RIGHTWARDS TWO-HEADED ARROW WITH DOUBLE VERTICAL STROKE"],
			[ 0x2902 , "LEFTWARDS DOUBLE ARROW WITH VERTICAL STROKE"],
			[ 0x2903 , "RIGHTWARDS DOUBLE ARROW WITH VERTICAL STROKE"],
			[ 0x2904 , "LEFT RIGHT DOUBLE ARROW EITH VERTICAL STROKE"],
			[ 0x2905 , "RIGHTWARDS TWO-HEADED ARROW FROM BAR"],
			[ 0x2906 , "LEFTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x2907 , "RIGHTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x2908 , "DOWNWARDS ARROW WITH HORIZONTAL STROKE"],
			[ 0x2909 , "UPWARDS ARROW WITH HORIZONTAL STROKE"],
			[ 0x290A , "UPWARDS TRIPPLE ARROW"],
			[ 0x290B , "DOWNWARDS TRIPPLE ARROW"],
			[ 0x290C , "LEFTWARDS DOUBLE DASH ARROW"],
			[ 0x290D , "RIGHTWARDS DOUBLE DASH ARROW"],
			[ 0x290E , "LEFTWARDS TRIPPLE DASH ARROW"],
			[ 0x290F , "RIGHTWARDS TRIPPLE DASH ARROW"],
			
			[ 0x2910 , "RIGHTWARDS TWO-HEADED TRIPPLE DASH ARROWE"],
			[ 0x2911 , "RIGHTWARDS ARROW WITH DOTTED STEM"],
			[ 0x2912 , "UPWARDS ARROW TO BAR"],
			[ 0x2913 , "DOWNWARDS ARROW TO BAR"],
			[ 0x2914 , "RIGHTWARDS ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2915 , "RIGHTWARDS ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			[ 0x2916 , "RIGHTWARDS TWO-HEADED ARROW WITH TAIL"],
			[ 0x2917 , "RIGHTWARDS TWO-HEADED ARROW WITH TAIL WITH VERTICAL STROKE"],
			[ 0x2918 , "RIGHTWARDS TWO-HEADED ARROW WITH TAIL WITH DOUBLE VERTICAL STROKE"],
			
			[ 0x291D , "LEFTWARDS ARROW TO BLACK DIAMOND"],
			[ 0x291E , "RIGHTWARDS ARROW TO BLACK DIAMOND"],
			[ 0x291F , "LEFTWARDS ARROW FROM BAR TO BLACK DIAMOND"],
			
			[ 0x2920 , "RIGHTWARDS ARROW FROM BAR TO BLACK DIAMOND"],
			[ 0x2921 , "NORTH WEST AND SOUTH EAST ARROW"],
			[ 0x2922 , "NORTH EAST AND SOUTH WEST ARROW"],
			[ 0x2923 , "NORTH WEST ARROW WITH HOOK"],
			[ 0x2924 , "NORTH EAST ARROW WITH HOOK"],
			[ 0x2925 , "SOUTH EAST ARROW WITH HOOK"],
			[ 0x2926 , "SOUTH WEST ARROW WITH HOOK"],
			
			[ 0x2970 , "RIGHTWARDS DOUBLE ARROW WITH ROUNDED HEAD"],
			
			[ 0 , "Crossing Arrows for Knot Theory"],
			[ 0x2927 , "NORTH WEST ARROW AND NORTH EAST ARROW"],
			[ 0x2928 , "NORTH EAST ARROW AND SOUTH EAST ARROW"],
			[ 0x2929 , "SOUTH EAST ARROW AND SOUTH WEST ARROW"],
			[ 0x292A , "SOUTH WEST ARROW AND NORTH WEST ARROW"],
			[ 0x292B , "RISING DIAGNAL CROSSING FALLING DIAGONAL"],
			[ 0x292C , "FALLING DIAGONAL CROSSING RISING DIAGNAL"],
			[ 0x292D , "SOUTH EAST ARROW CROSSING NORTH EAST ARROW"],
			[ 0x292E , "NORTH EAST ARROW CROSSING SOUTH EAST ARROW"],
			[ 0x292F , "FALLING DIAGONAL CROSSING NORTH EAST ARROW"],
			
			[ 0x2930 , "RISING DIAGNAL CROSSING SOUTH EAST ARROW"],
			[ 0x2931 , "NORTH EAST ARROW CROSSING NORTH WEST ARROW"],
			[ 0x2932 , "NORTH WEST ARROW CROSSING NORTH EAST ARROW"],
			
			[ 0 , "Miscellaneous Curved Arrows"],
			[ 0x2B3F , "WAVE ARROW POINTING DIRECTLY LEFT"],
			[ 0x2933 , "WAVE ARROW POINTING DIRECTLY RIGHT"],
			[ [0x2934,0xFE0E] , "ARROW POINTING RIGHTWARDS THEN CURVING UPWARDS","font-family: inherit;"],
			[ [0x2935,0xFE0E] , "ARROW POINTING RIGHTWARDS THEN CURVING DOWNWARDS","font-family: inherit;"],
			[ 0x2936 , "ARROW POINTING DOWNWARDS THEN CURVING LEFTWARDS"],
			[ 0x2937 , "ARROW POINTING DOWNWARDS THEN CURVING RIGHTWARDS"],
			[ 0x2938 , "RIGHT SIDE ARC CLOCKWISE ARROW"],
			[ 0x2939 , "LEFT SIDE ARC ANTICLOCKWISE ARROW"],
			[ 0x293A , "TOP ARC ANTICLOCKWISE ARROW"],
			[ 0x293B , "BOTTOM ARC ANTICLOCKWISE ARROW"],
			[ 0x293C , "TOP ARC CLOCKWISE ARROW WITH MINUS"],
			[ 0x293D , "TOP ARC ANTICLOCKWISE ARROW WITH PLUS"],
			[ 0x293E , "LOWER RIGHT SEMICURCULAR CLOCKWISE ARROW"],
			[ 0x293F , "LOWER LEFT SEMICURCULAR ANTICLOCKWISE ARROW"],
			
			[ 0x2940 , "ANTICLOCKWISE CLOSED CIRCLE ARROW"],
			[ 0x2941 , "CLOCKWISE CLOSED CIRCLE ARROW"],
			
			[ 0 , "Arrows with Combined Operators"],
			[ 0x2942 , "RIGHTWARDS ARROW ABOVE SHORT LEFTWARDS ARROW"],
			[ 0x2943 , "LEFTWARDS ARROW ABOVE SHORT RIGHTWARDS ARROW"],
			[ 0x2944 , "SHORT RIGHTWARDS ARROW ABOVE LEFTWARDS ARROW"],
			[ 0x2945 , "RIGHTWARDS ARROW WITH PLUS BELOW"],
			[ 0x2946 , "LEFTWARDS ARROW WITH PLUS BELOW"],
			[ 0x2947 , "RIGHTWARDS ARROW THROUGH X"],
			[ 0x2B3E , "LEFTWARDS ARROW THROUGH X"],
			[ 0x2948 , "LEFT RIGHT ARROW THROUGH SMALL CIRCLE"],
			[ 0x2949 , "UPWARDS TWO-HEADED ARROW FROM SMALL CIRCLE"],
			
			[ 0x2971 , "EQUALS SIGN ABOVE RIGHTWARDS ARROW"],
			[ 0x2B40 , "EQUALS SIGN ABOVE LEFTWARDS ARROW"],
			[ 0x2B41 , "REVERSE TILDE OPERATOR ABOVE LEFTWARDS ARROW"],
			[ 0x2B42 , "LEFTWARDS ARROW ABOVE REVERSE ALMOST EQUAL TO"],
			[ 0x2B47 , "REVERSE TILDE OPERATOR ABOVE RIGHTWARDS ARROW"],
			[ 0x2B48 , "RIGHTWARDS ARROW ABOVE REVERSE ALMOST EQUAL TO"],
			[ 0x2B49 , "TILDE OPERATOR ABOVE LEFTWARDS ARROW"],
			[ 0x2B4A , "LEFTWARDS ARROW ABOVE ALMOST EQUAL TO"],
			[ 0x2B4B , "LEFTWARDS ARROW ABOVE REVERSE TILDE OPERATOR"],
			[ 0x2B4C , "RIGHTWARDS ARROW ABOVE REVERSE TILDE OPERATOR"],
			[ 0x2972 , "TILDE OPERATOR ABOVE RIGHTWARDS ARROW"],
			[ 0x2973 , "LEFTWARDS ARROW ABOVE TILDE OPERATOR"],
			[ 0x2974 , "RIGHTWARDS ARROW ABOVE TILDE OPERATOR"],
			[ 0x2975 , "RIGHTWARDS ARROW ABOVE ALMOST EQUAL TO"],
			[ 0x2976 , "LESS-THAN ABOVE LEFTWARDS ARROW"],
			[ 0x2977 , "LEFTWARDS ARROW THROUGH LESS-THAN"],
			[ 0x2B43 , "RIGHTWARDS ARROW THROUGH GREATER-THAN"],
			[ 0x2B44 , "RIGHTWARDS ARROW THROUGH SUPEERSET"],
			[ 0x2978 , "GREATER-THAN ABOVE RIGHTWARDS ARROW"],
			[ 0x2979 , "SUBSET ABOVE RIGHTWARDS ARROW"],
			[ 0x297A , "LEFTWARDS ARROW THROUGH SUBSET"],
			[ 0x297B , "SUPERSET ABOVE LEFTWARDS ARROW"],
			
			[ 0 , "Modified Harpoons"],
			[ 0x294A , "LEFT BARB UP RIGHT BARB DOWN HARPOON"],
			[ 0x294B , "LEFT BARB DOWN RIGHT BARB UP HARPOON"],
			[ 0x294C , "UP BARB RIGHT DOWN BARB LEFT HARPOON"],
			[ 0x294D , "UP BARB LEFT DOWN BARB RIGHT HARPOON"],
			[ 0x294E , "LEFT BARB UP RIGHT BARB UP HARPOON"],
			[ 0x294F , "UP BARB RIGHT DOWN BARB RIGHT HARPOON"],
			
			[ 0x2950 , "LEFT BARB DOWN RIGHT BARB DOWN HARPOON"],
			[ 0x2951 , "UP BARB LEFT DOWN BARB LEFT HARPOON"],
			[ 0x2952 , "LEFTWARDS HARPOON WITH BARB UP TO BAR"],
			[ 0x2953 , "RIGHTWARDS HARPOON WITH BARB UP TO BAR"],
			[ 0x2954 , "UPWARDS HARPOON WITH BARB RIGHT TO BAR"],
			[ 0x2955 , "DOWNWARDS HARPOON WITH BARB RIGHT TO BAR"],
			[ 0x2956 , "LEFTWARDS HARPOON WITH BARB DOWN TO BAR"],
			[ 0x2957 , "RIGHTWARDS HARPOON WITH BARB DOWN TO BAR"],
			[ 0x2958 , "UPWARDS HARPOON WITH BARB LEFT TO BAR"],
			[ 0x2959 , "DOWNWARDS HARPOON WITH BARB LEFT TO BAR"],
			[ 0x295A , "LEFTWARDS HARPOON WITH BARB UP FROM BAR"],
			[ 0x295B , "RIGHTWARDS HARPOON WITH BARB UP FROM BAR"],
			[ 0x295C , "UPWARDS HARPOON WITH BARB RIGHT FROM BAR"],
			[ 0x295D , "DOWNWARDS HARPOON WITH BARB RIGHT FROM BAR"],
			[ 0x295E , "LEFTWARDS HARPOON WITH BARB DOWN FROM BAR"],
			[ 0x295F , "RIGHTWARDS HARPOON WITH BARB DOWN FROM BAR"],
			
			[ 0x2960 , "UPWARDS HARPOON WITH BARB LEFT FROM BAR"],
			[ 0x2961 , "DOWNWARDS HARPOON WITH BARB LEFT FROM BAR"],
			
			[ 0x2962 , "LEFTWARDS HARPOON WITH BARB UP ABOVE LEFTWARDS HARPOON WITH BARB DOWN"],
			[ 0x2963 , "UPWARDS HARPOON WITH BARB LEFT BESIDE UPWARDS HARPOON WITH BARB RIGHT"],
			[ 0x2964 , "RIGHTWARDS HARPOON WITH BARB UP ABOVE RIGHTWARDS HARPOON WITH BARB DOWN"],
			[ 0x2965 , "DOWNWARDS HARPOON WITH BARB LEFT BESIDE DOWNWARDS HARPOON WITH BARB RIGHT"],
			[ 0x2966 , "LEFTWARDS HARPOON WITH BARB UP ABOVE RIGHTWARDS HARPOON WITH BARB UP"],
			[ 0x2967 , "LEFTWARDS HARPOON WITH BARB DOWN ABOVE RIGHTWARDS HARPOON WITH BARB DOWN"],
			[ 0x2968 , "RIGHTWARDS HARPOON WITH BARB UP ABOVE LEFTWARDS HARPOON WITH BARB UP"],
			[ 0x2969 , "RIGHTWARDS HARPOON WITH BARB DOWN ABOVE LEFTWARDS HARPOON WITH BARB DOWN"],
			[ 0x296A , "LEFTWARDS HARPOON WITH BARB UP ABOVE LONG DASH"],
			[ 0x296B , "LEFTWARDS HARPOON WITH BARB DOWN BELOW LONG DASH"],
			[ 0x296C , "RIGHTWARDS HARPOON WITH BARB UP ABOVE LONG DASH"],
			[ 0x296D , "RIGHTWARDS HARPOON WITH BARB DOWN BELOW LONG DASH"],
			[ 0x296E , "UPWARDS HARPOON WITH BARB LEFT DOWNWARDS UPWARDS HARPOON WITH BARB RIGHT"],
			[ 0x296F , "DOWNWARDS HARPOON WITH BARB LEFT BESIDE UPWARDS HARPOON WITH BARB RIGHT"],
			
			[ 0 , "Arrow Tails"],
			[ 0x2919 , "LEFTWARDS ARROW-TAIL"],
			[ 0x291A , "RIGHTWARDS ARROW-TAIL"],
			[ 0x291B , "LEFTWARDS DOUBLE ARROW-TAIL"],
			[ 0x291C , "RIGHTWARDS DOUBLE ARROW-TAIL"],
			
			[ 0x297C , "LEFT FISH TAIL"],
			[ 0x297D , "RIGHT FISH TAIL"],
			[ 0x297E , "UP FISH TAIL"],
			[ 0x297F , "DOWN FISH TAIL"],
			
			
			[ 0 , "Dingbat Arrows"],
			[ 0x2794 , "HEAVY WIDE-HEADED RIGHTWARDS ARROW"],
			[ 0x2798 , "HEAVY SOUTH EAST ARROW"],
			[ 0x2799 , "HEAVY RIGHTWARDS ARROW"],
			[ 0x279A , "HEAVY NORTH EAST ARROW"],
			[ 0x279B , "DRAFTING POINT RIGHTWARDS ARROW"],
			[ 0x279C , "HEAVY ROUND-TIPPED RIGHTWARDS ARROW"],
			[ 0x279D , "TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279E , "HEAVY TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x279F , "DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			
			[ 0x27A0 , "HEAVY DASHED TRIANGLE-HEADED RIGHTWARDS ARROW"],
			[ 0x27A2 , "THREE-D TOP-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A3 , "THREE-D BOTTOM-LIGHTED RIGHTWARDS ARROWHEAD"],
			[ 0x27A4 , "BLACK RIGHTWARDS ARROWHEAD"],
			[ 0x27A5 , "HEAVY BLACK CURVED DOWNAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A6 , "HEAVY BLACK CURVED UPAWARDS AND RIGHTWARDS ARROW"],
			[ 0x27A7 , "SQUAT BLACK RIGHTWARDS ARROW"],
			[ 0x27A8 , "HEAVY CONCAVE-POIINTED BLACK RIGHTWARDS ARROW"],
			[ 0x27A9 , "RIGHT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AA , "LEFT-SHADED WHITE RIGHTWARDS ARROW"],
			[ 0x27AB , "BLACK-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AC , "FRONT-TILTED SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AD , "HEAVY LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AE , "HEAVY UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27AF , "NOTCHED LOWER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			
			[ 0x27B1 , "NOTCHED UPPER RIGHT-SHADOWED WHITE RIGHTWARDS ARROW"],
			[ 0x27B2 , "CIRCLED HEAVY WHITE RIGHTWARDS ARROW"],
			[ 0x27B3 , "WHITE-FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B4 , "BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B5 , "BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B6 , "BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27B7 , "HEAVY BLACK FEATHERED SOUTH EAST ARROW"],
			[ 0x27B8 , "HEAVY BLACK FEATHERED RIGHTWARDS ARROW"],
			[ 0x27B9 , "HEAVY BLACK FEATHERED NORTH EAST ARROW"],
			[ 0x27BA , "TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BB , "HEAVY TEARDROP-BARBED RIGHTWARDS ARROW"],
			[ 0x27BC , "WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BD , "HEAVY WEDGE-TAILED RIGHTWARDS ARROW"],
			[ 0x27BE , "OPEN-OUTLINED RIGHTWARDS ARROW"],
			
			[ 0 , "Long Arrows", true],
			[ 0x27F5 , "LONG LEFTWARDS ARROW"],
			[ 0x27F6 , "LONG RIGHTWARDS ARROW"],
			[ 0x27F7 , "LONG LEFT RIGHT ARROW"],
			[ 0x27F8 , "LONG LEFTWARDS DOUBLE ARROW"],
			[ 0x27F9 , "LONG RIGHTWARDS DOUBLE ARROW"],
			[ 0x27FA , "LONG LEFT RIGHT DOUBLE ARROW"],
			[ 0 , ""],
			[ 0x27FB , "LONG LEFTWARDS ARROW FROM BAR"],
			[ 0x27FC , "LONG RIGHTWARDS ARROW FROM BAR"],
			[ 0x27FD , "LONG LEFTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x27FE , "LONG RIGHTWARDS DOUBLE ARROW FROM BAR"],
			[ 0x2B33 , "LONG LEFTWARDS SQUIGGLE ARROW"],
			[ 0x27FF , "LONG RIGHTWARDS SQUIGGLE ARROW"],

		);

		Smiley.alltabs.OlderScripts = new Array(
			[ [0x16BC,0x16D2] , "Older Scripts"],
			
			[ 0 , "Runic"],
			[ 0x16A0 , "RUNIC LETTER FEHU FEOH FE F"],
			[ 0x16A1 , "RUNIC LETTER V"],
			[ 0x16A2 , "RUNIC LETTER URUZ UR U"],
			[ 0x16A3 , "RUNIC LETTER YR"],
			[ 0x16A4 , "RUNIC LETTER Y"],
			[ 0x16A5 , "RUNIC LETTER W"],
			[ 0x16A6 , "RUNIC LETTER THURISAZ THURS THORN"],
			[ 0x16A7 , "RUNIC LETTER ETH"],
			[ 0x16A8 , "RUNIC LETTER ANSUZ A"],
			[ 0x16A9 , "RUNIC LETTER OS O"],
			[ 0x16AA , "RUNIC LETTER AC A"],
			[ 0x16AB , "RUNIC LETTER AESC"],
			[ 0x16AC , "RUNIC LETTER LONG-BRANCH-OSS O"],
			[ 0x16AD , "RUNIC LETTER SHORT-TWIG-OSS O"],
			[ 0x16AE , "RUNIC LETTER O"],
			[ 0x16AF , "RUNIC LETTER OE"],
			
			[ 0x16B0 , "RUNIC LETTER ON"],
			[ 0x16B1 , "RUNIC LETTER RAIDO RAD REID R"],
			[ 0x16B2 , "RUNIC LETTER KAUNA"],
			[ 0x16B3 , "RUNIC LETTER CEN"],
			[ 0x16B4 , "RUNIC LETTER KAUN K"],
			[ 0x16B5 , "RUNIC LETTER G"],
			[ 0x16B6 , "RUNIC LETTER ENG"],
			[ 0x16B7 , "RUNIC LETTER GEBO GYFU G"],
			[ 0x16B8 , "RUNIC LETTER GAR"],
			[ 0x16B9 , "RUNIC LETTER WUNJO WYNN W"],
			[ 0x16BA , "RUNIC LETTER HAGLAZ H"],
			[ 0x16BB , "RUNIC LETTER HAEGL H"],
			[ 0x16BC , "RUNIC LETTER LONG-BRANCH-HAGALL H"],
			[ 0x16BD , "RUNIC LETTER SHORT-TWIG-HAGALL H"],
			[ 0x16BE , "RUNIC LETTER NAUDIZ NYD NAUD N"],
			[ 0x16BF , "RUNIC LETTER SHORT-TWIG-NAUD N"],
			
			[ 0x16C0 , "RUNIC LETTER DOTTED-N"],
			[ 0x16C1 , "RUNIC LETTER ISAZ IS ISS I"],
			[ 0x16C2 , "RUNIC LETTER E"],
			[ 0x16C3 , "RUNIC LETTER JERAN J"],
			[ 0x16C4 , "RUNIC LETTER GER"],
			[ 0x16C5 , "RUNIC LETTER LONG-BRANCH-AR AE"],
			[ 0x16C6 , "RUNIC LETTER SHORT-TWIG-AR A"],
			[ 0x16C7 , "RUNIC LETTER IWAZ EOH"],
			[ 0x16C8 , "RUNIC LETTER PERTHO PEORTH P"],
			[ 0x16C9 , "RUNIC LETTER ALGIZ EOLHX"],
			[ 0x16CA , "RUNIC LETTER SOWILO S"],
			[ 0x16CB , "RUNIC LETTER SIGEL LONG-BRANCH-SOL S"],
			[ 0x16CC , "RUNIC LETTER SHORT-TWIG-SOL S"],
			[ 0x16CD , "RUNIC LETTER C"],
			[ 0x16CE , "RUNIC LETTER Z"],
			[ 0x16CF , "RUNIC LETTER TIWAZ TIR TYR T"],
			
			[ 0x16D0 , "RUNIC LETTER SHORT-TWIG-TYR T"],
			[ 0x16D1 , "RUNIC LETTER D"],
			[ 0x16D2 , "RUNIC LETTER BERKANAN BEORC BJARKAN B"],
			[ 0x16D3 , "RUNIC LETTER SHORT-TWIG-BJARKAN B"],
			[ 0x16D4 , "RUNIC LETTER DOTTED-P"],
			[ 0x16D5 , "RUNIC LETTER OPEN-P"],
			[ 0x16D6 , "RUNIC LETTER EHWAZ EH E"],
			[ 0x16D7 , "RUNIC LETTER MANNAZ MAN M"],
			[ 0x16D8 , "RUNIC LETTER LONG-BRANCH-MADR M"],
			[ 0x16D9 , "RUNIC LETTER SHORT-TWIG-MADR M"],
			[ 0x16DA , "RUNIC LETTER LAUKAZ LAGU LOGR L"],
			[ 0x16DB , "RUNIC LETTER DOTTED-L"],
			[ 0x16DC , "RUNIC LETTER INGWAZ"],
			[ 0x16DD , "RUNIC LETTER ING"],
			[ 0x16DE , "RUNIC LETTER DAGAZ DAEG D"],
			[ 0x16DF , "RUNIC LETTER OTHALAN ETHEL O"],
			
			[ 0x16E0 , "RUNIC LETTER EAR"],
			[ 0x16E1 , "RUNIC LETTER IOR"],
			[ 0x16E2 , "RUNIC LETTER CWEORTH"],
			[ 0x16E3 , "RUNIC LETTER CALC"],
			[ 0x16E4 , "RUNIC LETTER CEALC"],
			[ 0x16E5 , "RUNIC LETTER STAN"],
			[ 0x16E6 , "RUNIC LETTER LONG-BRANCH-YR"],
			[ 0x16E7 , "RUNIC LETTER SHORT-TWIG-YR"],
			[ 0x16E8 , "RUNIC LETTER ICELANDIC-YR"],
			[ 0x16E9 , "RUNIC LETTER Q"],
			[ 0x16EA , "RUNIC LETTER X"],
			[ 0x16EB , "RUNIC SINGLE PUNCTUATION"],
			[ 0x16EC , "RUNIC MULTIPLE PUNCTUATION"],
			[ 0x16ED , "RUNIC CROSS PUNCTUATION"],
			[ 0x16EE , "RUNIC ARLAUG SYMBOL"],
			[ 0x16EF , "RUNIC TVIMADUR SYMBOL"],
			
			[ 0x16F0 , "RUNIC BELGTHOR SYMBOL"],
			[ 0x16F1 , "RUNIC LETTER K"],
			[ 0x16F2 , "RUNIC LETTER SH"],
			[ 0x16F3 , "RUNIC LETTER OO"],
			[ 0x16F4 , "RUNIC LETTER FRANKS CASKET OS"],
			[ 0x16F5 , "RUNIC LETTER FRANKS CASKET IS"],
			[ 0x16F6 , "RUNIC LETTER FRANKS CASKET EH"],
			[ 0x16F7 , "RUNIC LETTER FRANKS CASKET AC"],
			[ 0x16F8 , "RUNIC LETTER FRANKS CASKET AESC"],
			
			
			[ 0 , "Cherokee"],
			
			[ 0x13A0 , "CHEROKEE LETTER A"],
			[ 0x13A1 , "CHEROKEE LETTER E"],
			[ 0x13A2 , "CHEROKEE LETTER I"],
			[ 0x13A3 , "CHEROKEE LETTER O"],
			[ 0x13A4 , "CHEROKEE LETTER U"],
			[ 0x13A5 , "CHEROKEE LETTER V"],
			[ 0x13A6 , "CHEROKEE LETTER GA"],
			[ 0x13A7 , "CHEROKEE LETTER KA"],
			[ 0x13A8 , "CHEROKEE LETTER GE"],
			[ 0x13A9 , "CHEROKEE LETTER GI"],
			[ 0x13AA , "CHEROKEE LETTER GO"],
			[ 0x13AB , "CHEROKEE LETTER GU"],
			[ 0x13AC , "CHEROKEE LETTER GV"],
			[ 0x13AD , "CHEROKEE LETTER HA"],
			[ 0x13AE , "CHEROKEE LETTER HE"],
			[ 0x13AF , "CHEROKEE LETTER HI"],
			
			[ 0x13B0 , "CHEROKEE LETTER HO"],
			[ 0x13B1 , "CHEROKEE LETTER HU"],
			[ 0x13B2 , "CHEROKEE LETTER HV"],
			[ 0x13B3 , "CHEROKEE LETTER LA"],
			[ 0x13B4 , "CHEROKEE LETTER LE"],
			[ 0x13B5 , "CHEROKEE LETTER LI"],
			[ 0x13B6 , "CHEROKEE LETTER LO"],
			[ 0x13B7 , "CHEROKEE LETTER LU"],
			[ 0x13B8 , "CHEROKEE LETTER LV"],
			[ 0x13B9 , "CHEROKEE LETTER MA"],
			[ 0x13BA , "CHEROKEE LETTER ME"],
			[ 0x13BB , "CHEROKEE LETTER MI"],
			[ 0x13BC , "CHEROKEE LETTER MO"],
			[ 0x13BD , "CHEROKEE LETTER MU"],
			[ 0x13BE , "CHEROKEE LETTER NA"],
			[ 0x13BF , "CHEROKEE LETTER HNA"],
			
			[ 0x13C0 , "CHEROKEE LETTER NAH"],
			[ 0x13C1 , "CHEROKEE LETTER NE"],
			[ 0x13C2 , "CHEROKEE LETTER NI"],
			[ 0x13C3 , "CHEROKEE LETTER NO"],
			[ 0x13C4 , "CHEROKEE LETTER NU"],
			[ 0x13C5 , "CHEROKEE LETTER NV"],
			[ 0x13C6 , "CHEROKEE LETTER QUA"],
			[ 0x13C7 , "CHEROKEE LETTER QUE"],
			[ 0x13C8 , "CHEROKEE LETTER QUI"],
			[ 0x13C9 , "CHEROKEE LETTER QUO"],
			[ 0x13CA , "CHEROKEE LETTER QUU"],
			[ 0x13CB , "CHEROKEE LETTER QUV"],
			[ 0x13CC , "CHEROKEE LETTER SA"],
			[ 0x13CD , "CHEROKEE LETTER S"],
			[ 0x13CE , "CHEROKEE LETTER SE"],
			[ 0x13CF , "CHEROKEE LETTER SI"],
			
			[ 0x13D0 , "CHEROKEE LETTER SO"],
			[ 0x13D1 , "CHEROKEE LETTER SU"],
			[ 0x13D2 , "CHEROKEE LETTER SV"],
			[ 0x13D3 , "CHEROKEE LETTER DA"],
			[ 0x13D4 , "CHEROKEE LETTER TA"],
			[ 0x13D5 , "CHEROKEE LETTER DE"],
			[ 0x13D6 , "CHEROKEE LETTER TE"],
			[ 0x13D7 , "CHEROKEE LETTER DI"],
			[ 0x13D8 , "CHEROKEE LETTER TI"],
			[ 0x13D9 , "CHEROKEE LETTER DO"],
			[ 0x13DA , "CHEROKEE LETTER DU"],
			[ 0x13DB , "CHEROKEE LETTER DV"],
			[ 0x13DC , "CHEROKEE LETTER DLA"],
			[ 0x13DD , "CHEROKEE LETTER TLA"],
			[ 0x13DE , "CHEROKEE LETTER TLE"],
			[ 0x13DF , "CHEROKEE LETTER TLI"],
			
			[ 0x13E0 , "CHEROKEE LETTER TLO"],
			[ 0x13E1 , "CHEROKEE LETTER TLU"],
			[ 0x13E2 , "CHEROKEE LETTER TLV"],
			[ 0x13E3 , "CHEROKEE LETTER TSA"],
			[ 0x13E4 , "CHEROKEE LETTER TSE"],
			[ 0x13E5 , "CHEROKEE LETTER TSI"],
			[ 0x13E6 , "CHEROKEE LETTER TSO"],
			[ 0x13E7 , "CHEROKEE LETTER TSU"],
			[ 0x13E8 , "CHEROKEE LETTER TSV"],
			[ 0x13E9 , "CHEROKEE LETTER WA"],
			[ 0x13EA , "CHEROKEE LETTER WE"],
			[ 0x13EB , "CHEROKEE LETTER WI"],
			[ 0x13EC , "CHEROKEE LETTER WO"],
			[ 0x13ED , "CHEROKEE LETTER WU"],
			[ 0x13EE , "CHEROKEE LETTER WV"],
			[ 0x13EF , "CHEROKEE LETTER YA"],
			
			[ 0x13F0 , "CHEROKEE LETTER YE"],
			[ 0x13F1 , "CHEROKEE LETTER YI"],
			[ 0x13F2 , "CHEROKEE LETTER YO"],
			[ 0x13F3 , "CHEROKEE LETTER YU"],
			[ 0x13F4 , "CHEROKEE LETTER YV"],
			[ 0x13F5 , "CHEROKEE LETTER MV"],
			[ 0x13F8 , "CHEROKEE SMALL LETTER YE"],
			[ 0x13F9 , "CHEROKEE SMALL LETTER YI"],
			[ 0x13FA , "CHEROKEE SMALL LETTER YO"],
			[ 0x13FB , "CHEROKEE SMALL LETTER YU"],
			[ 0x13FC , "CHEROKEE SMALL LETTER YV"],
			[ 0x13FD , "CHEROKEE SMALL LETTER MV"],
/*  not currently supported by a default windows font
			[ 0 , "Phaistos Disc"],
			
			[ 0x101D0 , "PEDESTRIAN"],
			[ 0x101D1 , "PLUMED HEAD"],
			[ 0x101D2 , "TATTOOED HEAD"],
			[ 0x101D3 , "CAPTIVE"],
			[ 0x101D4 , "CHILD"],
			[ 0x101D5 , "WOMAN"],
			[ 0x101D6 , "HELMET"],
			[ 0x101D7 , "GAUNTLET"],
			[ 0x101D8 , "TIARA"],
			[ 0x101D9 , "ARROW"],
			[ 0x101DA , "BOW"],
			[ 0x101DB , "SHIELD"],
			[ 0x101DC , "CLUB"],
			[ 0x101DD , "MANACLES"],
			[ 0x101DE , "MATTOCK"],
			[ 0x101DF , "SAW"],
			
			[ 0x101E0 , "LID"],
			[ 0x101E1 , "BOOMERANG"],
			[ 0x101E2 , "CARPENTRY PLANE"],
			[ 0x101E3 , "DOLIUM"],
			[ 0x101E4 , "COMB"],
			[ 0x101E5 , "SLING"],
			[ 0x101E6 , "COLUMN"],
			[ 0x101E7 , "BEEHIVE"],
			[ 0x101E8 , "SHIP"],
			[ 0x101E9 , "HORN"],
			[ 0x101EA , "HIDE"],
			[ 0x101EB , "BULLS LEG"],
			[ 0x101EC , "CAT"],
			[ 0x101ED , "RAM"],
			[ 0x101EE , "EAGLE"],
			[ 0x101EF , "DOVE"],
			
			[ 0x101F0 , "TUNNY"],
			[ 0x101F1 , "BEE"],
			[ 0x101F2 , "PLANE TREE"],
			[ 0x101F3 , "VINE"],
			[ 0x101F4 , "PAPYRUS"],
			[ 0x101F5 , "ROSETTE"],
			[ 0x101F6 , "LILY"],
			[ 0x101F7 , "OX BACK"],
			[ 0x101F8 , "FLUTE"],
			[ 0x101F9 , "GRATER"],
			[ 0x101FA , "STRAINER"],
			[ 0x101FB , "SMALL AXE"],
			[ 0x101FC , "WAVY BAND"],
			[ 0x101FD , "PHAISTOS DISC SIGN COMBINING OBLIQUE STROKE"],
*/
		);

		/*
		Smiley.alltabs.OlderScripts.push( new Array( 0 , "Linear A (Not correct character names)") );
		for(i=0;i<0x186;i++){
			if( (i>0x136 && i< 0x140) || (i>0x155 && i<0x160))
				continue; //skipped codepoints
			var str = "LINEAR A "+i;
			Smiley.alltabs.OlderScripts.push( new Array( 0x10600+i , str) );
		};
		*/

		/* not currently supported by a default windows font
		Smiley.alltabs.OlderScripts.push( new Array( 0 , "Linear B Syllabary (Not correct character names)") );
		for(i=0;i<0x5D;i++){
			if( i==0xC || i==0x27 || i==0x3B || i==0x3E ||  (i>0x4D && i<0x50) )
				continue; //skipped codepoints
			var str = "LINEAR B SYLLABLE "+i;
			Smiley.alltabs.OlderScripts.push( new Array( 0x10000+i , str) );
		};

		Smiley.alltabs.OlderScripts.push( new Array( 0 , "Linear B Ideograms (Not correct character names)") );
		for(i=0x80;i<0xFA;i++){
			var str = "LINEAR B IDEOGRAM "+i;
			Smiley.alltabs.OlderScripts.push( new Array( 0x10000+i , str) );
		};

		Smiley.alltabs.OlderScripts.push( new Array( 0 , "Aegean Numbers") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10100 , "AEGEAN WORD SEPARATOR LINE") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10101 , "AEGEAN WORD SEPARATOR DOT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10102 , "AEGEAN CHECK MARK" ) );

		Smiley.alltabs.OlderScripts.push( new Array( 0x10107 , "AEGEAN NUMBER ONE") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10108 , "AEGEAN NUMBER TWO") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10109 , "AEGEAN NUMBER THREE") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1010A , "AEGEAN NUMBER FOUR") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1010B , "AEGEAN NUMBER FIVE") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1010C , "AEGEAN NUMBER SIX") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1010D , "AEGEAN NUMBER SEVEN") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1010E , "AEGEAN NUMBER EIGHT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1010F , "AEGEAN NUMBER NINE") );

		Smiley.alltabs.OlderScripts.push( new Array( 0x10110 , "AEGEAN NUMBER TEN") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10111 , "AEGEAN NUMBER TWENTY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10112 , "AEGEAN NUMBER THIRTY" ) );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10113 , "AEGEAN NUMBER FORTY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10114 , "AEGEAN NUMBER FIFTY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10115 , "AEGEAN NUMBER SIXTY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10116 , "AEGEAN NUMBER SEVENTY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10117 , "AEGEAN NUMBER EIGHTY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10118 , "AEGEAN NUMBER NINETY") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10119 , "AEGEAN NUMBER ONE HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1011A , "AEGEAN NUMBER TWO HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1011B , "AEGEAN NUMBER THREE HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1011C , "AEGEAN NUMBER FOUR HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1011D , "AEGEAN NUMBER FIVE HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1011E , "AEGEAN NUMBER SIX HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1011F , "AEGEAN NUMBER SEVEN HUNDRED") );

		Smiley.alltabs.OlderScripts.push( new Array( 0x10120 , "AEGEAN NUMBER EIGHT HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10121 , "AEGEAN NUMBER NINE HUNDRED") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10122 , "AEGEAN NUMBER ONE THOUSAND" ) );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10123 , "AEGEAN NUMBER TWO THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10124 , "AEGEAN NUMBER THREE THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10125 , "AEGEAN NUMBER FOUR THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10126 , "AEGEAN NUMBER FIVE THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10127 , "AEGEAN NUMBER SIX THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10128 , "AEGEAN NUMBER SEVEN THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10129 , "AEGEAN NUMBER EIGHT THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1012A , "AEGEAN NUMBER NINE THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1012B , "AEGEAN NUMBER TEN THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1012C , "AEGEAN NUMBER TWENTY THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1012D , "AEGEAN NUMBER THIRTY THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1012E , "AEGEAN NUMBER FORTY THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1012F , "AEGEAN NUMBER FIFTY THOUSAND") );

		Smiley.alltabs.OlderScripts.push( new Array( 0x10130 , "AEGEAN NUMBER SIXTY THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10131 , "AEGEAN NUMBER SEVENTY THOUSAND") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10132 , "AEGEAN NUMBER EIGHTY THOUSAND" ) );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10133 , "AEGEAN NUMBER NINETY THOUSAND") );

		Smiley.alltabs.OlderScripts.push( new Array( 0x10137 , "AEGEAN WEIGHT BASE UNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10138 , "AEGEAN WEIGHT FIRST SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x10139 , "AEGEAN WEIGHT SECOND SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1013A , "AEGEAN WEIGHT THIRD SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1013B , "AEGEAN WEIGHT FOURTH SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1013C , "AEGEAN DRY MEASURE FIRST SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1013D , "AEGEAN LIQUID MEASURE FIRST SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1013E , "AEGEAN MEASURE SECOND SUBUNIT") );
		Smiley.alltabs.OlderScripts.push( new Array( 0x1013F , "AEGEAN MEASURE THIRD SUBUNIT") );
*/


		Smiley.alltabs.Cuneiform = new Array();
		Smiley.alltabs.Cuneiform[0] = new Array( 0x12000 , "Cuneiform", "smileyheiro",null,6); 
		for(i=0;i<0x399;i++){
			// NOTE: not the correct names - 
			var str = "CUNIFROM CHARACTER "+(i+1);
			Smiley.alltabs.Cuneiform[i+1] = new Array( 0x12000+i , str);
		}


		Smiley.tabGroups.push({tabs: new Array(
					Smiley.alltabs.Smileys,
					Smiley.alltabs.Transport,
					Smiley.alltabs.Map,
					Smiley.alltabs.Signs,
					Smiley.alltabs.Weather,
					Smiley.alltabs.Plants,
					Smiley.alltabs.Animals,
					Smiley.alltabs.Entertain,
					Smiley.alltabs.Games,
					Smiley.alltabs.Sports,
					Smiley.alltabs.People,
					Smiley.alltabs.Romance,
					Smiley.alltabs.Food,
					Smiley.alltabs.Buildings,
					Smiley.alltabs.Comic,
					Smiley.alltabs.Money,
					Smiley.alltabs.Office,
					Smiley.alltabs.Tools,
					Smiley.alltabs.Tech,
					Smiley.alltabs.UIsymbols,
					Smiley.alltabs.Shapes,
					Smiley.alltabs.Arrows,
					Smiley.alltabs.Dingbats,
					Smiley.alltabs.Clocks,
					Smiley.alltabs.Medical,
					Smiley.alltabs.Gender,
					Smiley.alltabs.Religious,
					Smiley.alltabs.Astro,
					Smiley.alltabs.Recycle,
					Smiley.alltabs.Braille,
					Smiley.alltabs.Math,
					Smiley.alltabs.Alchemy,
					Smiley.alltabs.Egyptian,
					Smiley.alltabs.Cuneiform,
					Smiley.alltabs.OlderScripts,
				),
			name: "Unicode 6.0"}
		);


		Smiley.tabGroups.push({tabs: new Array(
				Smiley.alltabs.AND_Smileys,
				Smiley.alltabs.AND_People,
				Smiley.alltabs.AND_Nature,
				Smiley.alltabs.AND_FoodDrink,
				Smiley.alltabs.AND_TravelPlaces,
				Smiley.alltabs.AND_Activities,
				Smiley.alltabs.AND_Objects,
				Smiley.alltabs.AND_Symbols,
				Smiley.alltabs.AND_Flags,
				[],
				[],
				Smiley.alltabs.AND_EXT_Symbols,
				Smiley.alltabs.AND_EXT_Entertain,
				Smiley.alltabs.AND_EXT_Shapes,
				Smiley.alltabs.AND_EXT_TechSymbols,
				Smiley.alltabs.Braille,
				Smiley.alltabs.Math,
				Smiley.alltabs.Alchemy,
				Smiley.alltabs.Egyptian,
				Smiley.alltabs.Cuneiform,
				Smiley.alltabs.OlderScripts,
			),
			name: "Android Emoji" }
		);

		Smiley.windowTitle = "Emoji Window";

				
		
		Smiley.install();
        
	}
});
