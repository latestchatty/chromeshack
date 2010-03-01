if (String(location.href).indexOf('frame_laryn.x') >= 0)
{
    var qs = new Querystring();
    if (qs.contains("id"))
    {
        console.log(location.href);
        // process inidivitual post
        console.log('loading iframe - single post.')
    }
    else
    {
        console.log(location.href);
        // process individual posts
        console.log('loading iframe - thread.')
    }
}
else if (String(location.href).indexOf('laryn.x') >= 0)
{
    console.log(location.href);
    // process full posts
    console.log('loading chatty.')
}


console.log("finished loading.");

