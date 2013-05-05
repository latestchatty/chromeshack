LoginExtender =
{
	extendLogin: function()
	{
		chrome.runtime.sendMessage({name: "extendLoginCookie"});
	}
}

settingsLoadedEvent.addHandler(function() {
	if (getSetting("enabled_scripts").contains("extend_login"))
	{
		LoginExtender.extendLogin();
	}
});