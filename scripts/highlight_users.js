settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("highlight_users") || getSetting("enabled_scripts").contains("color_style_usernames"))
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
                    "12398" , // geedeck (status unknown post modpocopalypse)
                    "171127", // helvetica (status unknown post modpocopalypse)
                    "174581", // Frozen Pixel (promoted to head mod Aug 8 2014) (status unknown post modpocopalypse)
                    // Pleb Mods
                    "168479", // ajax (status unknown post modpocopalypse)
                    "228129", // bitchesbecrazy (status unknown post modpocopalypse)
                    "9085"  , // busdriver3030 (status unknown post modpocopalypse)
                    "5334"  , // dante (status unknown post modpocopalypse)
                    "185650", // Dave-A (status unknown post modpocopalypse)
                    "9509"  , // Deathlove (status unknown post modpocopalypse)
                    "3259"  , // degenerate (status unknown post modpocopalypse)
                    "168256", // edgewise (status unknown post modpocopalypse)
                    "172215", // electroly (status unknown post modpocopalypse)
                    "169197", // filtersweep (status unknown post modpocopalypse)
                    "8105"  , // hirez (status unknown post modpocopalypse)
                    "7570"  , // kaiser (status unknown post modpocopalypse)
                    "169887", // Megara9 (status unknown post modpocopalypse)
                    "44566" , // Morgin (status unknown post modpocopalypse)
                    "3243"  , // p[multisync]p (status unknown post modpocopalypse)
                    "194196", // ninjase (status unknown post modpocopalypse)
                    "8316"  , // paranoid android (status unknown post modpocopalypse)
                    "9031"  , // portax (status unknown post modpocopalypse)
                    "9211"  , // redfive (status unknown post modpocopalypse)
                    "16880" , // Serpico74 (status unknown post modpocopalypse)
                    "7660"  , // sexpansion pack (status unknown post modpocopalypse)
                    "208786", // squigiliwams  (status unknown post modpocopalypse)
                    "2650"  , // thaperfectdrug (aka Dave-A) (status unknown post modpocopalypse)
                    "32016" , // thekidd (status unknown post modpocopalypse)
                    "1194"  , // zakk (status unknown post modpocopalypse)
                    "14628" , // EvilDolemite (became mod Aug 8 2014) (status unknown post modpocopalypse)
                    "169401", // LoioshDwaggie (became mod Aug 8 2014) (status unknown post modpocopalypse)
                    "175142", // eonix (became mod Aug 8 2014) (status unknown post modpocopalypse)
                    "126826",  // woddemandred (became mod Aug 8 2014) (status unknown post modpocopalypse)
                    
                    // Dead mods                
                    "7438"  , // enigmatic (service ended Aug 01 2012?)
                    "169489", // s[genjuro]s (service ended Feb 02 2012)
                    "5278"  , // lacker (service ended Feb 02 2012)
                    "6674"  , // pupismyname (service ended Feb 02 2012)
                    "171402", // brickmatt (service ended Aug 01 2012)
                    "6585"  , // carnivac (service ended Aug 01 2012?)
                    "9980"  , // haiku (service ended Aug 01 2012?)
                    "44583" , // jokemon (service ended Aug 01 2012?)
                    "8349"  , // sexninja!!!! (service ended Aug 01 2012?)
                    "6933"  , // tomservo (service ended Feb 02 2012)
                    "8048"  , // cygnus x-1 (service ended Aug 01 2012?)
                    "167953", // edlin (service ended Feb 02 2012)
                    "15130" , // utilitymaximizer (service ended Feb 02 2012)
                    "16880" , // serpico74 (service ended Aug 01 2012?)
                    "10028" , // drucifer (service ended Jan 10 2014)
                    "6380"  , // dognose (service ended Jan 10 2014)
                    "169927", // sgtsanity (service ended Jan 10 2014)
                    "169942", // mikecyb (service ended Jan 10 2014)
                    "169049", // rauol duke (resigned from head mod status Aug 8 2014, turned in badge and gun on ??)

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
                    "10024812", // John Keefer (Keefinator)
                    "10005228", // Andrew Yoon
                    "10186691", // the man with the briefcase
                    "10187365", // staymighty
                    "10187465", // xosammyjoe
                    "3014718" , // hammersuit
                    "226769"  , // Steve Watts (SporkyReeve)
                    "10187754", // Daniel Perez (Daniel_Perez)
                    "10187639", // Greg Burke (GBurke59)
                    "10187730", // joshua hawkins
                    "10187323", // steven wong
                    "10187419", // squid wizard
                    "10187781", // beardedaxe
                    "209604"  , // Crabs Jarrard
                    "173110"  , // David Craddock
                    "10194943", // Charles Singletary Jr
                    "10184559", // plonkus 
                ],

                "Game Devs":
                [
                    "4957","171370", //2k Games   jason bergman,  dahanese
                    "182981", //2K Sports OverloadUT
                    '175229', //343 Industries  gigaduck 
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
                    '10187646',//Full time indie contractor / developer now, timmytaste - Tim Aste (timaste line above)
                    '4605',//Gas Powered Games  hellchick - Caryn Law
                    '3829','169955','171337','6020','168552','172976','166528','4178','2236',//Gearbox Software  rickmus, byorn, DaMojo - Pat Krefting, duvalmagic - Randy Pitchford, kungfusquirrel, MADMikeDavis, mikeyzilla - Mike Neumann, wieder - Charlie Wiederhold, dopefish,  Technically Steve Gibson ('4') should be here as well
                    '172526',//hb-studios  threeup
                    '168561',// High Voltage Software  Bantis 
                    '171752','19054',//Human Head  lvlmaster, zeroprey
                    '170311','3982','4916',//Id Software  patd - Patrick Duffy, toddh - Todd Hollenshead, xian - Christian Antkow
                    '102','21915','119746',//Infinity Ward  Avatar, DKo5, Inherent
                    '173164',//Insomniac Games - lowpoly 
                    '169079',//Massive Entertainment  SilverSnake
                    '12865',//Monolith  cannelbrae
                    '183170','172349',//Naughty Dog  Cowbs (previously known as cpnkegel)
                    '1347',//NCSoft  Zoid - Dave Kirsch
                    '12631',//Nerve Software  Normality - Joel Martin
                    '3750',//Obsidian Entertainment - Adam Brennecke (Jabby)
                    '12656',//Online Alchemy  KnyteHawkk 
                    '12963','6507','27483','169925','11816','4257',//Pandemic Studios  darweidu, Freshview, gndagger, Rampancy, sammyl, tostador
                    '170163',//Piranha Games  Buckyfg1
                    '4262',//Planet Moon  cheshirecat
                    '171863',//Red 5 Studios rgoer 
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
                    '170008',//Vicarious Visions  smalakar 
                    '170414','9172',//Vivendi Universal  ColoradoCNC, Pezman
                    '12656',//Zemnott  KnyteHawkk - Jared Larsen
                    '170084', // deveus1 (Activision)
                    '139966', // lord cecil (Uber Entertainment)
                    '175142', // eonix (Relic)
                    '171493', // whippedcracker (Vigil Games)
                    '11544', //Fred Garvin (formerly of BioWare, currently does sound direction for games)
                    '49660','169993','174785',//Former Game Indusrty People     Omning, robingchyo, Romsteady
                    '173472', // drhazard (Volition)
                    '171424', // freakynipples69 indie game dev, MindShaft Games
                    '169168',// Contract work - mikage Worked on Saints Row 
                    '173588', //Side Scroll Studios - valcan_s
                ]
            },
            
            images: [
                //0: //duke
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAA1pJREFUOMuNk0tsVGUAhb//3tvpdObO9DGvlulYKkihY2kCAmqIQEnYENl1gSgJPtCFaAwJjVaD1loNcWNqQjQxuFGD1UACQhpthWhNG0rpFAWxTR8z7ZR5QB/zvNOZ+V2gXbnwrE++zXcO/JOuNw8J/mc+Odqy2tUAvvqsXRx6+QN5/JX97c6Sks4Gr5NMYoEVJY/ZphAKBtFNHmZCy5hMJSdf/7y/A6DjhVaxSjrTfWJs3zZfk54JF8RChOD4bRwOO2mZIb60hJotA1kh40mhTS9K4ob51ttfnveLrhMHxVunvpFXz3XKev1+4bfec2roTpi78wZGFirtFrxuL4VUBr2sFIe7ipxuLUykpOppfPy0AHj12ZaP3u94qW3s8hmm/ppkcGiWMosXr9dPNDRH6l4Uk5BIY5GlZJKcGWlueEx8cWlYaACDgdFELh4jGppBpA3UzApNm5o42Po814Z/xijEMLIGqoT54Dw5zS5uRzLHpZQoAG63V1GkgqtMp6luLdU2KzJ5l8TcTWyFBKn4AvFojNDsHDaLlWQsyq7dO58RQjwAaCuKaiymmA9GSK+oyHIXRpUbR7MfrcoJ0oJeWUdOLWcwMM5CIs3Y6MjWVY0NDY0XF7Oc3LHngBz/c1aMBKIsjETo6RvCWVmFzenjl5FefJVO7CtFlhNxaUTzAkA9++l7vNHZHfZVW97d+cSO4g89vcpW/zYOP3cEq93EzakIF4Z+JymLRMNRjh15kZQUYnByui2VTQ2o3126AsD2zWsPOMwmb2YpiYbK3r17gDQPO1w8pJfjtoKHPE8/9SR2p43a9bU3BoYDP6n/DslVXnqdfPGoRdGKHodH+Gqc6KWSe5MzbHlkA+STbFlXR4WqUlPv49fRkR9v3Jm+qgHsbq7hXP+t69X2yj+aW3b5vbpeDIZnFFVmKBgp+vouU+bRKTHb+b7nLE7/Zgr5BwIUgCuBeY61tojT5wce3fdal8hZKxTdtSafzqtkhYbV4yAwPk5sOUH9hk3Y7S4mJmZYBQB09/TLtsP7hZRSae88tTFWKNGkbQ0JQ8Fis7N+YyPLaYNkxmAuGkW1WFSA/7ywlAlFCFvxQvfH74hIpCO3GC7cl4a6rqaWyFRYRjWz+PDrb7eHlzPX/gbGpHAczlFCrQAAAABJRU5ErkJggg==) !important;',
                //1: //code monkey
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAAXNSR0IArs4c6QAAAfVJREFUKM+Fkj9oU0Ecxz8XnnCBDhdo4R50yBscrrTDy5ZCB7M1m4QOScbq1LpoO+moU6OL3apj4yDBLWMcCu1QyBsSeoNDHAJ9YOG9QeiBgedQTP+k6mf63e/uw4/78hPcw4fHQebSEfwCHoBUAU++jMTdd7ca+xthVkgjpHd1dhNu1YkK2f4ciRm59ayRhZ4jMKu4n47zQYc0jlA6xF+pIeckI3tMNJHsvG+LqXy428i4iKnWX6IWCgDE1nJ29JGltU20MQCkPxK6n97AvKa51xa51rrOGLbR2kxFAG0MhaA6FQHUQgGtDQzbtNZ15vmTGCUhn58NzpRXZ3r5PCgPcDE5imVSB/IyuU4xLCHCEnJOTus/yMuE1AHFMrnmwYkAcOMu9rTPv7Cnfdy4C0Dz4ESI1kaYVeQIFmv4K5Vbf7xLbC3ngx6MO/RcgOcriVx5hVmr8D+0MWhjsEcGf9Ahl8QxftEQWYsIS0TW3ivevPeLhiSO8VCG0bBH+KjGVr1BqdH86+SteoMwCIi+dkAZxOunm5mOe5SWQ9TDKsGNZO8yivqk37r0hxGxrlxtWGv3RSaHh6zOO2SxivRLFBavg0vGFnfex33vcnwhcctNdvbeiulu779rZURdCukZcpKiPIcDJJBOJM5TJGoJwirbz3cEwG/eJLw3FFqDogAAAABJRU5ErkJggg==) !important;',
                //2: //360
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gcTExIr3kRnJAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAADh0lEQVQ4yz3DfWiUdQDA8e/v99xzt7u93F5ap207VzlTmq9RqyCXo2Li2yxIMEqx1rZeJJsMjCyigTSTttR/tBqJpWTDF0QoSyhbJLU/qs0wkY3EgbZ72W1399zz+z3Pr3+qD3wE/5IP1uD/dIPezl1LFzbf11NaEV1VUloyVytNIpFMTqfS313/7erBtz7s/bZsYyOZk6P877Xu1wGo2PfYsfuHOsymC73+2YlLxri+yaWz5uzlYfP0uXf85SfaTWxg9TAgO7pfBUCsX7+BM2dOM3jisz+m7s4tPHbjSzwsbrqKylAtIRNm3PmT2lAQSyiaIw+bur9uTx1694N4c0tLVgAMfvLp0KqWVU9WVVYy7ad4Y2Q7k65DSktmXI85YUGVZXj5jm5qRJypZMKMjo2NdnW1L7E6OzqXrlm7bqC6uhrbtii2S1kQXcHVv09hyQBBY2goUqyNtXNvZDGucrEsS4TD4Vh9/Z1X5MrmR7urqiqMEOD7BomgdXgPDjZxW1NnexRZ8Ozlo2R0Fs/3EALC4bBpmL/gFRkti66UUgrP85AebP25H+1PcUtbNEbreGTOcqYU1IQ0W67sJ2gsPN9gSSnKoqUPSTsYnGd8g1Ka8zd/ZWjyG+IhQ0v1Yl5c8THty/pYU9NKPKSYVBMcSVwE3yCkIBKJSOn7PkprpAddYweoLwqwLraUnuV78Twfz/PY3NDNczVPUBOE/YnT5I2LlBI7YCPzufyEUppD18/j+GmaovPYueBNsvkcSikKBZfM7DTrb9vC6ooVVAYMBxJfE7RsfHxfptKpi8bR5uDkOeKhCLvjO5mezZDN5pidzTIzM0tmJkt6Ns3m4mdYVFTNycyPSFsaJ+9csmKxudcCtdGuo7kLDNS9RBXlaM9DKZeCUyDvOOSyWfJ5B6U1TcVLOD59gXuK7hKJ0fFd1sjILzftptoldnVk0bbix3F9hdYa11U4BRfHKeC6CmMMAUtSXlRGysyYsfFrV/o7d3fI1tbVfLF931MPJOaO5tw8nvbQSqOVxvM0xvhYAUnQtgmGQiCEWezUps5sfX/Z9u4dCIDyzY2kPx/lo8ODp+Y3NGyIRMLGsiwhpeS/QghjjC8mxidG9ux8u9lqq8te7DuJBeD8fou2tjb69r53vLy87GxJSVmp4xRiAoq10iSTyUwimfhq+Ifvdzz/wraedZs2qqH+IwD8A2biqKPkxObIAAAAAElFTkSuQmCC) !important;',
                //3: //ps4
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gcTExE1D2YJhAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAC3ElEQVQ4y12SzUsjaRDGn+q3O0gGTDB4i7MkOuguioddRDwFowdBWCdhEJ2DC+IeBY9h9+gfIKvMwQ+8JRAJePBkDt765FERGYiDwgRnevArrf3xvm/twengTJ2Kqqd+RT0U4aeYnp5+EwTBe9/3i0qpX7XWwrKsz0KIumma25VKxU6lUjrS0/chHBwcIJ/PV13XfSuEMA3DiDQMgJgZUkoWQlz09fWNNpvNr4eHh88AABgbG9tXSv1pWRYTEYVhCGaGZVkgastYSkkAvvb09PxRrVYvCQByuVz18fHxnWVZzypmzM3NIZPJoFwuo9FowDCMCMRaa1JKfRkeHs6KycnJN/f39xumaRIzEzODmTE6OorZ2VkUCgVMTEwglUrh+PgYzEzfl7xyXfeTGQTBvGEYptb6BzOZGQBQq9VwdXWFlZUVhGGInZ2dZ/OI4Hnev+bT01Mx2vpyOAISUTsfGhqCUqp9iu/7r00p5W8vTGoDIuDPudY6AhAAmFJKIYTgqBCGIcIwhBCiDXx4eAAAlMvldo+IwMwQ6XT6b6VUp2VZGBwcxNLSEtbW1nB3d4dsNovT01OcnJzg+voa/f39GBgYQDweR7PZ5CAIyCCiekdHB46OjrC9vQ0pJfL5PBqNBgDAdV2USiVcXFxgY2MD6XQa6+vrWF5eJqWULzKZzLdWq/VXMpmE53nkOA4WFxdhWRZ6e3txfn6OWq2GYrGIUqkEx3GwubmJra0tdHZ2rpPjOEYul/sIIMvPQQAwMjKC1dVV1Ot1jI+PY3d3F3t7eyAiJiJSSrmJRGKQAGBqaip1eXl5RkTdkXFKKUgp0dXVhdvbWxARTNMEAGitkUwm523brhgAcHNz8627u/t3rfUXrTW01jAMg2OxGFqtFkzTZCEEtNaQUrqJROK9bduVQqGAHx5gYWHh1dnZ2bznef/4vv/Ly/8wDMOPx+MfYrHYf7Ztf5qZmcH+/j7+By81e9Mlb3YfAAAAAElFTkSuQmCC) !important;',
                //4: //switch
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gcTExEOvm3goAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAACZ0lEQVQ4y3WSy0vUURTHP+f+7mhj4Q/SXlL0kmpRLTLNyCSjpe2CHkTQXxC4aVVBRBBRIC1a5aIHtIioaBWGMhUl9o6iYoqSMpmsMGumce69p4UzORp+N/ecezjfy/f7vUIRg4ODkk6na1pbW4f7+vpmqmquubk5pFKped77BVEUpZ1zjXEc9zQ0NJTWMKWirq5OnXNDANls9mEulzuXSqXWOecuG2NWAbOiKNooIpYymPJGRI719vZ2AK9UdYP3fp+IHPXe7/HeLwghHBSRMC1BMpnsDMGfMsacBs6jeqCtra0HMKoKEGWzOSY9uuPOIy60rK7a1fN8a/bPjHBm07L8yuoqu+3603yiqrIi0mDnJn/brs1N7v6XjDn8IuPjGTlzpbXx9v4Hz/7YI+vXxKuuP/nx0VYK3vGjUACg3+X5WQAUFpIE4JOzdI85GKug/uaDn+n25lpz/PHL9o+2UgQdF6Qyrk0ABBAitORRUbjyjmR1R/+rRqOuuFEaCpMxtQdEBUTJBwmGIjsAikqxV2V6TJCKmTIQF4ID8GaCFbXFgvLz/xgBcqoGIK5IhKI25tjgAcl6p8hkUcaYMg4j9GZ+CcDFpuXUehcWaSF0NSw1AN1fRya8KsL+49NxbSffZ2Tv4hq3ZU5sM9sn/vzd4RF36fOoJSH/kkIC1qsfRS1qQFQZswld2/3a7lwYu5bZsQ0U9NbwaLg2lLOSEBUVUVEIUBtVFkRVE4tv9P8asBWJUpjKFLvKEi5drdCx72/bm2pka/c9di9ZMv/sh28n8k6qfcRUn8pjxqiTyISBzsb6Q1ffDIz8Be9LDbNUqRL3AAAAAElFTkSuQmCC) !important;',
                //5: //worker
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAP8SURBVHjaYvz//z/D8TxmBjBgZGD4++UfGyuPRKeIiW8kr6K+MCvTT6Y3d89/27Ht0JlNJx4VvvjGcOHKKwYGqA4GgABiABlwLIcRjI9kMjBc7jI++vXxif9g8O/L//9fb/3///7Q//+PZv9f32D3WVuYwQ2kjwmKAQIIhBmY+YUYmHj5GbjEZRuVguqsuGR0GBh+f2Rg+P4OiIH0lw8MDP+4GAISw3nCvTQXALXwsQBdC8IAAQQ2gJGNneE/ExODoKpRNKeAMAPD2+tATQ+BmoFu/QXU/Ocrw59vnxj+/2JkcHfUllAWZojVkGZlAGGAAGIBGfDs83+GXz//Mwj8Y2Rn/PkCGBBAcxlZgbb+AbK/Mvz7/ZXh7/8/DD+/fmb49esrIysbswwLKyQUAAIIbMDTZ88Zfv9mYPh24thhBX3TSA5uSaCmPwz/Gf4x/P/3l+HP3z8M3358YfgFdNnhk5f+3H7x9wIn21+wAQABBDbgIGMJAy8/I8O1+79KWfbd8w+2+cbFwMrL8AcY1r9//2L4+eUtw9cX1xiuPPjKMHXrl2N//zOs/PKLHehKZgaAAGIExQJ/LAPQAAZxZ0OG1fJ/b9gEKO9n/PPyJAPbnw/AmP3B8Or1F4YPAvoM577HMTx98+PD1lWzE989uriB4ftdBoAAAkejcORXrtQZv65cuv3p/5U7v/5fevP//6r9d/8fcDT8f1yO9f/8mev/z7j6//+Ba///33j0/3/vylu/mAVtQkGuBwggsAH6ed87Nl34+f/cvc//P/789//9j///33wHGhSf/P+wuu7/O1du/X/3+///P3/+/7/z4sf/M8/+//dMmwVKTuIAAQSORjXZ/7H/2RgYPv7nYLj/gZHhLTDw3334AI5seUkhhi8vXjG8B8b5keevGe58YmR4/Y2BwdTZW5SVRzkVIIDAgcjOzSj2+icLw4//TAyfgZo5gJjp+RcGxXfvGNg+fWR4cesJwytjBoYrrz8wfHrPw6AoBgw/HgEGdh4RY4AAAhvw+jMrw7s/TAyffjIwcAJFmIG28d+8y6B59wYD693bDB+uXWf48R5o0T9Vhu+/gK4DRvmLL4zAGPrPBhBAYAOuHD1yT9HYXk2QC5g8gc5j+g9MiKzSDM+FVBief2FiuC2jz/D/LQPDf6AFHPxAzUAXnjl6m+Hnh/v3AAIIHI2MvO5uss4la3S8nHiFJZkZuDiABnEDDQKmrj+//jKw8HMw/PsKTNk/gOEEzB63jlxkuL6i9NbfD7t9AQIIYgCPPQPD18carMIa9TxyFhZcosK8bFwczIzsLExMzEwM/3/8ZvgNjJVv7z78+vL0yvsfz/btZfj3vB3o+McAAQYAN1i/XKmb8j4AAAAASUVORK5CYII=) !important;',
                //6: //briefcase
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,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) !important;',
                //7: //bomb
                'padding: 0px 16px 0px 0px; background-repeat: no-repeat !important; background-position: top right !important; min-width: 16px; min-height: 16px; content: "\\a0"; background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB/0lEQVR42oWSS2gTYRSFL4JoCdFQIRIVItm4CcHHInGVcSHNCHYhpASSOpAXVDQMUYRohSm4SRDiwoXgpi4M+KiOjFCsC4mIK50MVsHiqz4qiotgFSKIHG/+8EMI6XjgYx6cc/57h6FhyufzO7LZ7H5N0zZSn2CRgns0OzSUTCZHODhTKBRs5iGzwnwqFosHpOfDedK5BDDJZGaZXhmb1jPPOLDKHJcBfneFn38zl87qE9aJKe0v7ooC4A7h9Rl6LEd+wKZfPPY2GlA6nd40rSfPNS/u+rF6fQS4TcBcj0cTdEyYOPw1kUi849vnDPpwGGV+jHYuqLT8dpqAW8xN5gbhzzVqiIJQKPQkGAwiEolAVVWkUil4vV5YliWLDIbsIl3uBpdOEZ5mCZ9nxAGkeDweVCoV8M6QKpfLMixR7h+k3UsnCQsJ0ufH+FntFTulUgnxeBy2baNf9XodnU4HhmHIdagbpgGh0WggEAhA6s3oKOS13W6DJacYKpimKQysYRO4F8gJ/H6/MLVaLRGoVqtoNptgiRXcCsQ3iMViwqxlMjgyPi4CAzi0hpTu6bVaDdFoFK9evITUe2cRi44Dn8+Hro9cZITDYeRyOVxYtxUrew/je/Y0fl6dw+SeqPwP3CUnmdywBW19SvDtaGaN3d2F5c1hfFEO4eP2ff8t+AeR32c0RhikxgAAAABJRU5ErkJggg==) !important;' ,
                //8: //hey!
                'padding: 0px 5px 0px 5px; background-image: url(data:image/gif;base64,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) !important; color: black !important; background-repeat: repeat !important;',
            ],

            install: function()
            {
                if(getSetting("enabled_scripts").contains("highlight_users"))
                {
                    
                    
                    
                    for (var i = 0; i < HighlightUsers.groups.length; i++)
                    {
                        var group = HighlightUsers.groups[i];
                        if (group.enabled)
                        {
                            if (group.name == "Original Poster")
                            {
                                //remove Shacknews' Original Poster highlighting - can conflict with the style we are trying to apply here
                                HighlightUsers.css += "div.oneline.op a + span.oneline_user { background-color: unset; }\n";
                                
                                HighlightUsers.originalPosterCss = group.css;
                                processPostEvent.addHandler(HighlightUsers.gatherOriginalPosterCss);
                            }
                            else if (group.name == "Self"){
                                 HighlightUsers.css += "div.oneline span.this_user, span.this-user a { "+group.css+"}\n";
                            }
                            else
                            {
                                var users = group.users;
                                if (group.built_in)
                                    users = HighlightUsers.built_in_groups[group.name];

                                HighlightUsers.combineCss(users, group);
                            }
                        }
                    }
                }

                if(getSetting("enabled_scripts").contains("color_style_usernames"))
                {
                    var colornames = function(){
                        //get all author ids from page
                        var elm = document.getElementById("chatty_comments_wrap");
                        var regex = /author_\d+/g
                        var matches = (elm.innerHTML).match(regex);
                        
                        var done = new Array();
                        var css = "";
                        var tempcss = "";
                        var type = Number(getSetting("color_style_usernames_type"));
                        if(isNaN(type)) type = 1;
                        
                        if(type == 3 || type == 4)
                        {
                            css += "div.postmeta span.author span.user a { background-position-y: 3px; background-position-x: 5px; }\n";
                        }
                        
                        //iterate matches, check each if already done, if not, generate CSS and mark as done
                        for(i=1;i<matches.length;i++)
                        {
                            if(done[matches[i]]!=1)
                            {
                                done[matches[i]]=1;
                                var id =  matches[i].split('_')[1];
                                var fullid = "000000"+id;
                                tempcss = "";
                                
                                //generate css for this user's name according to coloring chosen
                                switch(type)
                                {
                                    default:
                                    case 1:{
                                        var color = fullid.substr(fullid.length-6);
                                        var r = 255-((color.charAt(5)*20) + (color.charAt(2)*2));
                                        var g = 255-((color.charAt(4)*20) + (color.charAt(1)*2));
                                        var b = 255-((color.charAt(3)*20) + (color.charAt(0)*2));
                                        tempcss += 'color: rgb('+r+','+g+','+b+'); ';
                                    }
                                    break;
                                    case 2:{
                                        var color = Number(fullid);
                                        var hex = color.toString(16);
                                        hex = "000000"+hex;
                                        tempcss += 'color: #'+hex.substr(hex.length-6)+'; filter: drop-shadow(0px 0px 1px #888);';
                                    }
                                    break;
                                    case 3:
                                    case 4:{
                                        var width = 100;
                                        var height = 20;
                                        var userelm = null;
                                        var color1 = "red";
                                        var color2 = "blue";
                                        var username = "Unknown Name";
                                        var fontname = "ariel, helvetica";
                                        var fontsize = "16px";
                                        var fontweight = "normal";
                                        var outline = false;
                                        
                                        try{
                                            //first, we need to get one of the elements that contain the user name to get it's width
                                            //so first try to find the name in a one line (reply) post (greater chance of it being in a reply)
                                            var replies = document.getElementsByClassName("olauthor_"+id);
                                            if(replies != null && replies.length > 0)
                                            {
                                                var userelms = replies.item(0).getElementsByClassName("oneline_user");
                                                if(userelms != null && userelms.length > 0)
                                                {
                                                    userelm = userelms.item(0);
                                                }
                                            }
                                            
                                            //if not found, try fullpost
                                            if(userelm == null)
                                            {
                                                var fullposts = document.getElementsByClassName("fpauthor_"+id);
                                                if(fullposts != null && fullposts.length > 0)
                                                {
                                                    var userelms = fullposts.item(0).getElementsByClassName("user");
                                                    if(userelms != null && userelms.length>0)
                                                    {
                                                        userelm = userelms.item(0).firstElementChild;
                                                    }
                                                }
                                            }
                                            
                                            if(userelm != null)
                                            {
                                                //get properties we need for the svg
                                                width = userelm.clientWidth || userelm.offsetWidth || width;
                                                height = userelm.clientHeight || userelm.offsetHeight || height;
                                                username = userelm.innerText;
                                                var computedStyle = window.getComputedStyle( userelm, null );
                                                fontname = computedStyle.getPropertyValue( "font-family" );
                                                fontsize = computedStyle.getPropertyValue( "font-size" );
                                                fontweight = computedStyle.getPropertyValue( "font-weight" );
                                                fontsize = parseFloat(fontsize);
                                                width += 10;
                                            }
                                            
                                            if(type == 3)
                                            {
                                                var color = fullid.substr(fullid.length-6);
                                                var r1 = 255-((color.charAt(5)*20) + (color.charAt(2)*2));
                                                var g1 = 255-((color.charAt(4)*20) + (color.charAt(1)*2));
                                                var b1 = 255-((color.charAt(3)*20) + (color.charAt(0)*2));
                                                var r2 = 255-((color.charAt(1)*20) + (color.charAt(3)*2));
                                                var g2 = 255-((color.charAt(0)*20) + (color.charAt(5)*2));
                                                var b2 = 255-((color.charAt(2)*20) + (color.charAt(4)*2));
                                                
                                                color1 = "rgb("+r1+","+g1+","+b1+")";
                                                color2 = "rgb("+r2+","+g2+","+b2+")";
                                            }
                                            else if (type == 4)
                                            {
                                                var color = Number(fullid);
                                                var hex = color.toString(16);
                                                hex = "000000"+hex;
                                                hex = hex.substr(hex.length-6);
                                                var hex2 = hex.charAt(3)+hex.charAt(1)+hex.charAt(5)+hex.charAt(0)+hex.charAt(4)+hex.charAt(2);
                                                
                                                color1 = "#"+hex;
                                                color2 = "#"+hex2;
                                                outline = true;
                                            }
                                        }
                                        catch(error)
                                        {
                                            //oops
                                        }
                                        
                                        var gradientTextSvg = HighlightUsers.generateGradient(username, color1, color2, width, height,fontname, fontsize, fontweight, outline);
                                        
                                        //tempcss += 'display: inline-block; background: linear-gradient(to right, rgb('+r1+','+g1+','+b1+'), rgb('+r2+','+g2+','+b2+')); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none;';
                                        //tempcss += 'display: inline-block; background: linear-gradient(to right, #'+hex+', #'+hex2+'); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0px 0px 1px #888); text-shadow: none;';
                                        
                                        tempcss += "color: transparent; " + gradientTextSvg +" background-repeat: no-repeat; background-position-x: 5px; padding-right: 10px; text-shadow: none;";
                                    }
                                    break;

                                }
                                
                                
                                if(tempcss.length>0){
                                    css += '#page div.oneline.olauthor_' + id + ' span.oneline_user, #page div.fpauthor_' + id + ' div.postmeta span.author span.user a { ';
                                    css += tempcss;
                                    css += '}\n';
                                }
                            }
                        }
                        insertStyle(css);
                    }
                    window.setTimeout(colornames,250); //delay the coloring of the names so other more important things get done first
                    
                }
                
                
            },
            
            generateGradient: function(username, color1, color2, width, height, fontname, fontsize, fontweight, outline)
            {
                var outlinetext = "";
                if(outline)
                {
                    outlinetext = `<text x="0" y="12" stroke="#888" stroke-width="1px" style="font-family: ${fontname};font-size: ${fontsize}px; font-weight: ${fontweight};line-height: 16px;">${username}</text>`;
                }
                var svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px"><defs><linearGradient id="grad" gradientUnits="userSpaceOnUse"><stop stop-color="${color1}" offset="10%"></stop><stop stop-color="${color2}" offset="90%"></stop></linearGradient></defs>${outlinetext}<text x="0" y="12" fill="url(#grad)" style="font-family: ${fontname};font-size: ${fontsize}px; font-weight: ${fontweight};line-height: 16px;">${username}</text></svg>`;
                var encoded = window.btoa(svg);
                var backgroundimg = "\nbackground-image: url('data:image/svg+xml;base64,"+encoded+"');\n";
                return backgroundimg;
            },

            combineCss: function(users, group)
            {
                var css = "";
                var after = false;
                if( group.image != null && group.image > HighlightUsers.images.length)
                {
                    after = true;
                }
                for (var i = 0; i < users.length; i++)
                {
                    if (i > 0) css += ",\n";
                    if(group.image != null && group.image != 8) //Hey! image shouldn't be applied after
                    {
                        css += "div.olauthor_" + users[i] + " span.oneline_user:after, .fpauthor_" + users[i] + " span.author span.user>a:after";
                    }else{
                        css += "div.olauthor_" + users[i] + " span.oneline_user, .fpauthor_" + users[i] + " span.author span.user>a";
                    }
                }
                if(group.image != null)
                {
                    if(after)
                    {
                        css += " { content: \"\\"+group.image.toString(16)+"\"; -webkit-text-fill-color: initial;}\n";
                    }
                    else
                    {
                        css += " { " + HighlightUsers.images[group.image] + " }\n";
                    }
                }
                else
                {
                    css += " { " + group.css + " }\n";
                }
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
