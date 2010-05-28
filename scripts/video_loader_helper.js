
function onYouTubePlayerReady(playerId)
{
    var player = document.getElementById(playerId);

    var resize = "resizeYouTube" + playerId;
    console.log("resize function: " + resize);
    window[resize] = function(quality) { resizeYouTube(player, quality); };

    player.addEventListener("onPlaybackQualityChange", resize);
    player.setPlaybackQuality("hd720");
}


function resizeYouTube(player, quality)
{
    console.log("quality of " + player.id + " changed to " + quality);
    if (quality == "hd720" || quality == "large")
    {
        console.log("quality is `" + quality + "`, resizing player to 854x505");
        player.width = 854;
        player.height = 505;
    }
    else
    {
        console.log("quality is `" + quality + "`, resizing player to 640x385.");
        player.width = 640;
        player.height = 385;
    }
}
