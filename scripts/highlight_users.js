settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("highlight_users"))
    {
        HighlightUsers =
        {
            css: "",

            groups: getSetting("highlight_users"),

            authorRegex: /fpauthor_(\d+)/,
            originalPosterSelectors: [],
            originalPosterCss: "",

            built_in_groups: {
                "Mods":
                [
                    // Head Mods
                    "12398" , // geedeck
                    "171127", // helvetica
                    "169049", // rauol duke
                    // Pleb Mods
                    "168479", // ajax
                    "9085"  , // busdriver3030
                    "5334"  , // dante
                    "185650", // Dave-A
                    "9509"  , // Deathlove
                    "3259"  , // degenerate
                    "6380"  , // dognose
                    "10028" , // drucifer
                    "168256", // edgewise
                    "169197", // filtersweep
                    "174581", // Frozen Pixel
                    "7570"  , // kaiser
                    "169942", // mikecyb
                    "44566"   // Morgin
                    "3243"  , // p[multisync]p
                    "194196", // ninjase
                    "8316"  , // paranoid android
                    "9031"  , // portax
                    "9211"  , // redfive
                    "7660"  , // sexpansion pack
                    "169927", // sgtsanity
                    "32016" , // thekidd
                    "1194"  , // zakk
                    // Dead mods                
                    //"7438"  , // enigmatic (service ended Aug 01 2012?)
                    //"169489", // s[genjuro]s (service ended Feb 02 2012)
                    //"8105"  , // hirez (service ended Aug 01 2012)
                    //"5278"  , // lacker (service ended Feb 02 2012)
                    //"6674"  , // pupismyname (service ended Feb 02 2012)
                    //"171402", // brickmatt (service ended Aug 01 2012)
                    //"6585"  , // carnivac (service ended Aug 01 2012?)
                    //"9980"  , // haiku (service ended Aug 01 2012?)
                    //"44583" , // jokemon (service ended Aug 01 2012?)
                    //"8349"  , // sexninja!!!! (service ended Aug 01 2012?)
                    //"6933"  , // tomservo (service ended Feb 02 2012)
                    //"8048"  , // cygnus x-1 (service ended Aug 01 2012?)
                    //"167953", // edlin (service ended Feb 02 2012)
                    //"15130" , // utilitymaximizer (service ended Feb 02 2012)
                    //"16880" , // serpico74 (service ended Aug 01 2012?)
                ],

                "Employees":
                [
                    "4"       , // Steve Gibson
                    "43653"   , // Maarten Goldstein
                    "175043"  , // Chris Faylor
                    "175046"  , // Nick Breckon
                    "188134"  , // Aaron Linde
                    "204735"  , // Alice O'Connor
                    "213066"  , // Jeff Mattas
                    "212323"  , // Garnett Lee
                    "217677"  , // Brian Leahy
                    "227220"  , // Ackbar2020
                    "203311"  , // greg-m
                    "223050"  , // XAVdeMATOS
                    "14475"   , // Shacknews
                    "44124"   , // sHugamom
                    "172752"  , // Chris Remo
                    "232839"  , // TylerJSmith
                    "10011901", // OzzieMejia
                    "10024812"  // John Keefer (Keefinator)
                ],

                "Game Devs":
                [
                    "4957","171370", //2k Games   jason bergman,  dahanese
                    "182981", //2K Sports OverloadUT
                    "168928","13098","7048","171248","169937","173984", //3D Realms  eskimo spy, georgeb3dr - George Broussard, Joe3DR - Joe Siegler, Mr. 9000 - John Schuch, Scatti, ScottMi11er - Scott Miller
                    '169686', //Airtight Games  Dravalen
                    '119968', //Affectworks  fredrik s
                    '32598', //Artificial Mind & Movement  derean
                    '4929', //Atari (Dallas)  YoYo
                    '174434','170554', //Bethesda Softworks  lplasmatron, speon
                    '8085',//Bioware  Derek French
                    '168742',//Bungie  dmiller - Dan Miller
                    '14633',//Buzz Monkey Software  Karnov
                    '170764','12418',//Digital Illusions CE (dice) (Sweden)   aavenr, -efx-
                    '270',+//EA Canada (PSP)   timmie
                    '4312','170275',//Epic   CliffyB - Cliff Bleszinski, fufux
                    '175192',//Free Radical Design  jbury
                    '186653',//Flagship Studios  Ivan Sulic
                    '7466','173003','172749',//GarageGames  d3tached - (Torque X), sullisnack - Sean Sullivan, timaste - Tim Aste
                    '4605',//Gas Powered Games  hellchick - Caryn Law
                    '3829','169955','171337','6020','168552','172976','166528','4178',//Gearbox Software  rickmus, byorn, DaMojo - Pat Krefting, duvalmagic - Randy Pitchford, kungfusquirrel, MADMikeDavis, mikeyzilla - Mike Neumann, wieder - Charlie Wiederhold
                    '172526',//hb-studios  threeup
                    '171752','19054',//Human Head  lvlmaster, zeroprey
                    '170311','3982','4916',//Id Software  patd - Patrick Duffy, toddh - Todd Hollenshead, xian - Christian Antkow
                    '102','21915','119746',//Infinity Ward  Avatar, DKo5, Inherent
                    '169079',//Massive Entertainment  SilverSnake
                    '12865',//Monolith  cannelbrae
                    '183170','172349',//Naughty Dog  Cowbs (previously known as cpnkegel)
                    '1347',//NCSoft  Zoid - Dave Kirsch
                    '12631',//Nerve Software  Normality - Joel Martin
                    '12963','6507','27483','169925','11816','4257',//Pandemic Studios  darweidu, Freshview, gndagger, Rampancy, sammyl, tostador
                    '170163',//Piranha Games  Buckyfg1
                    '4262',//Planet Moon  cheshirecat
                    '14033',//Remedy Entertainment  PetriRMD - Petri Jarvilehto(?)
                    '8202','2025',//Retro Studios  Andy Hanson - Andy Hanson, Jack Mathews - Jack Mathews
                    '169919',//Rockstar Games  bozer
                    '169712',//S2 Games  s2jason - Jason
                    '171285',//Slant Six  bakanoodle
                    '171466',//Stardock  mittense
                    '173743',//Stray Bullet Games  AshenTemper - Sean Dahlberg
                    '172702','13334','169942',//TellTale Games  dtabacco, jake2000 - Jake Rodkin, mikecyb
                    '173748',//ThreeWave Software  brome - Adam Bromell
                    '172581',//Treyarch  Krypt_ - Brian Glines
                    '6358',//Trauma Studios  Ease_One
                    '171762','168242',//UbiSoft  mnok, MrLobo
                    '173884','12149','125906','173374','190115',//Valve  Doug_Support - Doug Valente (Support), Erik Johnson - Erik Johnson, garymct - Gary McTaggart, locash - Patrick M (Support), RobinWalker
                    '170414','9172',//Vivendi Universal  ColoradoCNC, Pezman
                    '12656',//Zemnott  KnyteHawkk - Jared Larsen
                    '170084', // deveus1 (Activision)
                    '139966', // lord cecil (Uber Entertainment)
                    '175142', // eonix (Relic)
                    '171493', // whippedcracker (Vigil Games)
                    '11544', //Fred Garvin (formerly of BioWare, currently does sound direction for games)
                    '49660','169993','174785'//Former Game Indusrty People     Omning, robingchyo, Romsteady
                ]
            },

            install: function()
            {
                for (var i = 0; i < HighlightUsers.groups.length; i++)
                {
                    var group = HighlightUsers.groups[i];
                    if (group.enabled)
                    {
                        if (group.name == "Original Poster")
                        {
                            HighlightUsers.originalPosterCss = group.css;
                            processPostEvent.addHandler(HighlightUsers.gatherOriginalPosterCss);
                        }
                        else
                        {
                            var users = group.users;
                            if (group.built_in)
                                users = HighlightUsers.built_in_groups[group.name];

                            HighlightUsers.combineCss(users, group.css);
                        }
                    }
                }

            },

            combineCss: function(users, group_css)
            {
                var css = "";
                for (var i = 0; i < users.length; i++)
                {
                    if (i > 0) css += ",\n";
                    // css += "div.olauthor_" + users[i] + " a.oneline_user, .fpauthor_" + users[i] + " span.author>a";
                    css += "div.olauthor_" + users[i] + " span.oneline_user, .fpauthor_" + users[i] + " span.author span.user>a";
                }
                css += " { " + group_css + " }\n";
                HighlightUsers.css += css;
            },

            gatherOriginalPosterCss: function(item, id, is_root_post)
            {
                if (is_root_post)
                {
                    var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");
                    var fpauthor = HighlightUsers.authorRegex.exec(fullpost.className);
                    if (fpauthor)
                    {
                        var authorId = fpauthor[1];
                        HighlightUsers.originalPosterSelectors.push("div#root_" + id + " div.olauthor_" + authorId + " .oneline_user ");
                    }
                }
            },

            installCss: function()
            {
                if (HighlightUsers.originalPosterSelectors.length > 0)
                {
                    HighlightUsers.css += HighlightUsers.originalPosterSelectors.join(", ");
                    HighlightUsers.css += " { " + HighlightUsers.originalPosterCss + " }\n";
                }
                if (HighlightUsers.css.length > 0)
                {
                    // don't highlight current user as mod/employee/dev
                    HighlightUsers.css += "div.oneline a.this_user { color: rgb(0, 191, 243) !important; }";
                    insertStyle(HighlightUsers.css);
                }
                HighlightUsers.uninstall();
            },

            uninstall: function()
            {
                processPostEvent.removeHandler(HighlightUsers.gatherOrignalPosterCss);
                fullPostsCompletedEvent.removeHandler(HighlightUsers.installCss);
            }
        }       

        HighlightUsers.install();
        fullPostsCompletedEvent.addHandler(HighlightUsers.installCss);
    }
});
