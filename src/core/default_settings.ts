const DefaultSettings: Settings = {
  enabled_scripts: [
    "custom_user_filters",
    "getpost",
    "hide_gamification_notices",
    "highlight_users",
    "media_loader",
    "new_comment_highlighter",
    "post_preview",
    "reduced_color_user_icons",
    "shrink_user_icons",
  ],
  enabled_builtins: [
    "az_scroll_fix",
    "single_thread_fix",
    "uncapped_thread_fix",
    "scroll_behavior",
    "image_uploader",
    "user_popup",
    "collapse",
    "color_gauge",
    "comment_tags",
    "emoji_poster",
    "local_timestamp",
    "mod_banners",
    "post_length_counter",
  ],

  enabled_suboptions: ["cuf_hide_fullposts"],

  collapsed_threads: [],

  user_filters: [],

  notifications: [],

  saved_drafts: {},
  saved_templates: [],

  tags_legend_toggled: false,
  post_preview_toggled: false,
  image_uploader_toggled: false,

  highlight_groups: [
    {
      name: "Original Poster",
      enabled: true,
      built_in: true,
      css: "font-weight: bold; color: yellow;",
    },
    {
      name: "Mods",
      enabled: true,
      built_in: true,
      css: "color: red !important;",
    },
    {
      name: "Employees",
      enabled: true,
      built_in: true,
      css: "color: green !important;",
      users: [
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
        "Charles Singletary Jr",
      ],
    },
    {
      name: "Game Devs",
      enabled: true,
      built_in: true,
      css: "color: purple !important;",
      users: [
        "jason bergman",
        "dahanese", // 2K Games
        "OverloadUT", // 2K Sports
        "georgeb3dr",
        "Joe3DR",
        "Mr. 9000",
        "Scatti",
        "ScottMi11er", // 3D Realms
        "Dravalen", // Airtight Games
        "fredrik s", // Affectworks
        "derean", // Artificial Mind & Movement
        "YoYo", // Atari (Dallas)
        "lplasmatron",
        "speon", // Bethesda Softworks
        "Derek French", // Bioware
        "dmiller", // Bungie
        "Karnov", // Buzz Monkey
        "aavenr",
        "-efx-", // Digital Illusions CE (Sweden)
        "timmie", // EA Canada
        "CliffyB",
        "fufux", // Epic
        "jbury", // Free Radical Design
        "Ivan Sulic", // Flagship Studios
        "Torque X",
        "d3tached",
        "sullisnack", // Garage Games
        "timaste",
        "timmytaste", // Indie Contractor
        "hellchick", // Gas Powered Games
        "rickmus",
        "byorn",
        "DaMojo",
        "duvalmagic",
        "kungfusquirrel",
        "MADMikeDavis",
        "mikeyzilla",
        "wieder",
        "dopefish", // Gearbox
        "threeup", // hb-studios
        "lvlmaster",
        "zeroprey", // Human Head
        "patd",
        "toddh",
        "xian", // id Software
        "Avatar",
        "DKo5",
        "Inherent", // Infinity Ward
        "SilverSnake", // Massive
        "cannelbrae", // Monolith
        "cpnkegel",
        "Cowbs", // Naughty Dog
        "Zoid", // NCSoft
        "Normality", // Nerve
        "Jabby", // Obsidian
        "darweidu",
        "Freshview",
        "gndagger",
        "Rampancy",
        "sammyl",
        "tostador", // Pandemic
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
        "dtabacco",
        "jake2000",
        "mikeycyb", // TellTale
        "brome", // ThreeWave
        "Krypt_", // Treyarch
        "Ease_One", // Trauma
        "mnok",
        "MrLobo", // Ubisoft
        "Doug_Support",
        "Erik Johnson",
        "garymct",
        "locash",
        "RobinWalker", // Valve
        "ColoradoCNC",
        "Pezman", // Vivendi
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
        "freakynipples69", // MindShaft
        "gameindustryplant",
      ],
    },
    {
      name: "Friends",
      enabled: true,
      built_in: false,
      css: "border: 1px dotted white !important;",
      users: [],
    },
  ],
};
export { DefaultSettings };
