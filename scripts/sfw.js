settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("sfw"))
    {
        ShackSFW =
        {
            install: function()
            {
                document.body.className += " shack_sfw";
            },

        }

        ShackSFW.install();
    }
});
