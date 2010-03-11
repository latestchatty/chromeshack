settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("mod_marker"))
    {
        ModMarker = 
        {
            mods: [
                "3259"  , // degenerate
                "10028" , // drucifer
                "168479", // ajax
                "5334"  , // dante
                "7438"  , // enigmatic
                "169489", // s[genjuro]s
                "8105"  , // hirez
                "5278"  , // lacker
                "6674"  , // pupismyname
                "32016" , // thekidd
                "1194"  , // zakk
                "171402", // brickmatt
                "6585"  , // carnivac
                "168256", // edgewise
                "169197", // filtersweep
                "9980"  , // haiku
                "44583" , // jokemon
                "3243"  , // p[multisync]p
                "169049", // rauol duke
                "8349"  , // sexninja!!!!
                "194196", // ninjase
                "6933"  , // tomservo
                "9085"  , // busdriver3030
                "8048"  , // cygnus x-1
                "6380"  , // dognose
                "167953", // edlin
                "12398" , // geedeck
                "171127", // helvetica
                "7570"  , // kaiser
                "8316"  , // paranoid android
                "9031"  , // portax
                "9211"  , // redfive
                "7660"  , // sexpansion pack
                "169927", // sgtsanity
                "15130"   // utilitymaximizer
            ],

            install: function()
            {
                var css = "";
                for (var i = 0; i < ModMarker.mods.length; i++)
                {
                    if (i > 0) css += ",\n";
                    css += "div.olauthor_" + ModMarker.mods[i] + " a.oneline_user, .fpauthor_" + ModMarker.mods[i] + " span.author>a";
                }
                css += " { " + getSetting("mod_marker_css") + " }\n";
                css += "div.oneline a.this_user { color: rgb(0, 191, 243) !important; }"

                insertStyle(css);
            }

        }

        ModMarker.install();
    }
});
