DefaultSettings = {

    enabled_scripts: [
        "lol",
        "getpost",
        "comment_tags",
        "post_preview",
        "dinogegtik",
        "sparkly_comic",
        "winchatty_comments_search",
        "expiration_watcher",
        "nws_incognito",
        "category_banners",
        "new_comment_highlighter",
        "scrolling_performance_hack"
    ],

    lol_tags: [
        {name: "lol", color: "#f80"},
        {name: "inf", color: "#09c"},
        {name: "unf", color: "#ff0000"},
        {name: "tag", color: "#77bb22"},
        {name: "wtf", color: "#c000c0"}
    ],

    lol_show_counts: 'limited',

    lol_ugh_threshold: '0',

    post_preview_location: "Right",

    post_preview_live: false,

    mod_marker_css: "color: red !important",

    collapsed_threads: [],

    original_poster_css: "font-weight: bold; color: #FFFFCC;",

    highlight_users: [
        { name: "Mods", enabled: true, built_in: true, css: "color: red !important" },
        { name: "Employees", enabled: true, built_in: true, css: "color: green !important" },
        { name: "Original Poster", enabled: true, built_in: true, css: "font-weight: bold; color: yellow !important" },
        { name: "Game Devs", enabled: true, built_in: true, css: "color: purple !important" },
        { name: "Self", enabled: false, built_in: true, css: "border: 1px dashed #ddd; border-radius: 18px;" },
        { name: "Friends", enabled: true, built_in: false, css: "border: 1px dotted green !important", users: [ 177008 ] },
        { name: "Foes", enabled: false, built_in: false, css: "border: 1px dotted red !important", users: [ 2536 ] },
        { name: "Group3", enabled: false, built_in: false, css: "border: 1px dotted blue !important", users: [ 2536 ] },
        { name: "Group4", enabled: false, built_in: false, css: "border: 1px dotted magenta !important", users: [ 2536 ] },
        
        { name: "&#128512;", enabled: false, built_in: false, css: "", image: 128512, users: [ 177008 ] },
        { name: "&#128577;", enabled: false, built_in: false, css: "", image: 128577, users: [ 177008 ] },
        { name: "&#128169;", enabled: false, built_in: false, css: "", image: 128169, users: [ 4 ] }, //Steve Gibson
        { name: "Duke", enabled: false, built_in: false, css: "", image: 0, users: [ 6380 ] }, //dognose
        { name: "&#127918;", enabled: false, built_in: false, css: "", image: 127918, users: [ 177008 ] },
        { name: "Xbone", enabled: false, built_in: false, css: "", image: 2, users: [ 177008 ] },
        { name: "Playstation", enabled: false, built_in: false, css: "", image: 3, users: [ 177008 ] },
        { name: "Switch", enabled: false, built_in: false, css: "", image: 4, users: [ 177008 ] },
        { name: "Worker", enabled: false, built_in: false, css: "", image: 5, users: [ 177008 ] },
        { name: "Briefcase", enabled: false, built_in: false, css: "", image: 6, users: [ 177008 ] },
        { name: "Bomb", enabled: false, built_in: false, css: "", image: 7, users: [ 2953,168063 ] }, //rudds, aznshack
        { name: "Code Monkey", enabled: false, built_in: false, css: "", image: 1, users: [ 5317,173455,172676,6317,171082,4245,2536,161569,182981,177008,172215,170800 ] }, //ThomW,MisterPhoton,naabster,dodob,Pieman,Tissen,Troz,ieGod,OverloadUT,arhughes,electroly,WombatFromHell
        { name: "Hey!", enabled: false, built_in: false, css: "", image: 8, users: [ 168102,28220,3243,10012200 ] }, //polansk,korban,multisync,Shackmeets
        { name: "&#128149;", enabled: false, built_in: false, css: "", image: 128149, users: [ 177008 ] },
        { name: "&#127866;", enabled: false, built_in: false, css: "", image: 127866, users: [ 177008 ] },
        { name: "&#127812;", enabled: false, built_in: false, css: "", image: 127812, users: [ 177008 ] },
        { name: "&#128125;", enabled: false, built_in: false, css: "", image: 128125, users: [ 177008 ] },
        { name: "&#128123;", enabled: false, built_in: false, css: "", image: 128123, users: [ 177008 ] },
        { name: "&#11088;", enabled: false, built_in: false, css: "", image: 11088, users: [ 8099,161578 ] },  //Maddog, mr.sleepy
    ],

    video_loader_hd: true,

    expiration_watcher_style: "Bar",

}
