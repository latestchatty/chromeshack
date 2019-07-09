LocalTimeStamp =
{
    //TODO: convert this into a setting later
    timeAmPm: true,

    convertTime: function(item, id)
    {
        var postdate = getDescendentByTagAndClassName(item, "div", "postdate");
        LocalTimeStamp.adjustTime(postdate);
    },

    adjustTime: function(elm)
    {
		var date = new Date();
		var dstr = elm.innerText.toUpperCase();
		var pos = dstr.indexOf("AM")+dstr.indexOf("PM")+1;
		dstr = dstr.substring(0,pos)+" "+dstr.substr(pos);

		date.setTime(Date.parse(dstr));
		var tz = date.toLocaleString();
		var pos = tz.indexOf("(")
		if(pos>0){
			tz = LocalTimeStamp.formatTimezone(tz.substring(pos+1, tz.length-1));
		}else{
			tz = "";
		}

		var dd = date.toDateString();
		var dt = date.toLocaleTimeString();

        if(LocalTimeStamp.timeAmPm){
			var hours = date.getHours()
			var minutes = date.getMinutes()
			var suffix = "am";
			if (hours >= 12) {
				suffix = "pm";
				hours = hours - 12;
			}
			if (hours == 0) {
				hours = 12;
			}
			if (minutes < 10)
				minutes = "0" + minutes
			dt=hours+":"+minutes+" "+suffix;
        }

		let timestamp = document.createElement("span");
		timestamp.innerText = `${dd} ${dt} ${tz}`;
		// remove only text child of postdate
		for (let c of elm.childNodes) {
			if (c.nodeType === 3) { c.remove(); }
		}
		elm.appendChild(timestamp);
    },

    formatTimezone: function(tz)
    {
        var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
		var timezoneClip = /[^-+\dA-Z]/g;

        return (tz.match(timezone) || [""]).pop().replace(timezoneClip, "");

    }

}

processPostEvent.addHandler(LocalTimeStamp.convertTime);
