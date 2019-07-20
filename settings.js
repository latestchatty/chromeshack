let DefaultSettings = {
    enabled_scripts: [
        "shrink_user_icons",
        "reduced_color_user_icons",
        "image_loader",
        "image_loader_newtab",
        "video_loader",
        "embed_socials",
        "getpost",
        "nws_incognito",
        "new_comment_highlighter",
        "post_preview"
    ],

    post_preview_location: "Right",

    mod_marker_css: "color: red !important",

    collapsed_threads: [],

    original_poster_css: "font-weight: bold; color: #FFFFCC;",

    highlight_users_groups: [
        { name: "Mods", enabled: true, built_in: true, css: "color: red !important", users: [
            "geedeck",
            "helvetica",
            "Frozen Pixel",
            "ajax",
            "bitchesbecrazy",
            "busdriver303",
            "dante",
            "Dave-A",
            "Deathlove",
            "degenerate",
            "edgewise",
            "electroly",
            "filtersweep",
            "hirez",
            "kaiser",
            "Megara9",
            "Morgin",
            "multisync",
            "ninjase",
            "paranoid android",
            "portax",
            "redfive",
            "Serpico74",
            "sexpansion pack",
            "squigiliwams",
            "thaperfectdrug",
            "thekidd",
            "zakk",
            "EvilDolemite",
            "LoioshDwaggie",
            "eonix",
            "woddemandred",
            "enigmatic",
            "genjuro",
            "lacker",
            "pupismyname",
            "brickmatt",
            "carnivac",
            "haiku",
            "jokemon",
            "sexninja!!!!",
            "tomservo",
            "cygnus x-1",
            "edlin",
            "utilitymaximizer",
            "serpico74",
            "drucifer",
            "dognose",
            "sgtsanity",
            "mikecyb",
            "rauol duke"
        ] },
        { name: "Employees", enabled: true, built_in: true, css: "color: green !important", users: [
            "Steve Gibson",
            "Maarten Goldstein",
            "Chris Faylor",
            "Nick Breckon",
            "Aaron Linde",
            "Alice O'Conner",
            "Jeff Mattas",
            "Garnett Lee",
            "Brian Leahy",
            "Ackbar2020",
            "greg-m",
            "XAVdeMATOS",
            "Shacknews",
            "sHugamom",
            "Chris Remo",
            "TylerJSmith",
            "OzzieMejia",
            "John Keefer",
            "Keefinator",
            "Andrew Yoon",
            "the man with the briefcase",
            "staymighty",
            "xosammyjoe",
            "hammersuit",
            "Steve Watts",
            "SporkyReeve",
            "Daniel Perez",
            "Daniel_Perez",
            "Greg Burke",
            "GBurke59",
            "joshua hawkins",
            "steven wong",
            "squid wizard",
            "beardedaxe",
            "Crabs Jarrard",
            "David Craddock",
            "Charles Singletary Jr"
        ] },
        { name: "Game Devs", enabled: true, built_in: true, css: "color: purple !important", users: [
            "jason bergman", "dahanese", // 2K Games
            "OverloadUT", // 2K Sports
            "georgeb3dr", "Joe3DR", "Mr. 9000", "Scatti", "ScottMi11er", // 3D Realms
            "Dravalen", // Airtight Games
            "fredrik s", // Affectworks
            "derean", // Artificial Mind & Movement
            "YoYo", // Atari (Dallas)
            "lplasmatron", "speon", // Bethesda Softworks
            "Derek French", // Bioware
            "dmiller", // Bungie
            "Karnov", // Buzz Monkey
            "aavenr", "-efx-", // Digital Illusions CE (Sweden)
            "timmie", // EA Canada
            "CliffyB", "fufux", // Epic
            "jbury", // Free Radical Design
            "Ivan Sulic", // Flagship Studios
            "Torque X", "d3tached", "sullisnack", // Garage Games
            "timaste", "timmytaste", // Indie Contractor
            "hellchick", // Gas Powered Games
            "rickmus", "byorn", "DaMojo", "duvalmagic", "kungfusquirrel", "MADMikeDavis", "mikeyzilla", "wieder", "dopefish", // Gearbox
            "threeup", // hb-studios
            "lvlmaster", "zeroprey", // Human Head
            "patd", "toddh", "xian", // id Software
            "Avatar", "DKo5", "Inherent", // Infinity Ward
            "SilverSnake", // Massive
            "cannelbrae", // Monolith
            "cpnkegel", "Cowbs", // Naughty Dog
            "Zoid", // NCSoft
            "Normality", // Nerve
            "Jabby", // Obsidian
            "darweidu", "Freshview", "gndagger", "Rampancy", "sammyl", "tostador", // Pandemic
            "Buckyfg1", // Piranha
            "cheshirecat", // Planet Moon
            "PetriRMD", // Remedy
            "Andy Hanson", // Retro
            "Jack Mathews", // Retro
            "bozer", // Rockstar
            "s2jason", // S2 Games
            "bakanoodle", // Slant Six
            "mittense", // Stardock
            "AshenTemper", // Stray Bullet
            "dtabacco", "jake2000", "mikeycyb", // TellTale
            "brome", // ThreeWave
            "Krypt_", // Treyarch
            "Ease_One", // Trauma
            "mnok", // Ubisoft
            "MrLobo", // Ubisoft
            "Doug_Support", "Erik Johnson", "garymct", "locash", "RobinWalker", // Valve
            "ColoradoCNC", "Pezman", // Vivendi
            "Knytehawkk", // Zemnott
            "deveus1", // Activision
            "lord cecil", // Uber
            "eonix", // Relic
            "whippedcracker", // Vigil
            "Fred Garvin", // former BioWare
            "Omning",
            "robinchyo",
            "Romsteady",
            "drhazard", // Volition
            "freakynipples69" // MindShaft
        ] },
        { name: "Original Poster", enabled: true, built_in: true, css: "font-weight: bold; color: yellow !important" },
        { name: "Friends", enabled: true, built_in: false, css: "border: 1px dotted white !important", users: [] }
    ]
};

const getSetting = async (key, defaultVal) => {
    let settings = await getSettings();
    if (!settingsContain(key)) setSetting(key, defaultVal);
    return settings[key] || DefaultSettings[key];
};

const getSettings = () => {
    return browser.storage.local.get();
};

const setSetting = (key, val) => {
    browser.storage.local.set({ [key]: val });
};

const removeSetting = key => {
    browser.storage.local.remove(key);
};

const resetSettings = () => {
    browser.storage.local.clear();
};

const settingsContain = async key => {
    return objContains(key, await getSettings());
};
