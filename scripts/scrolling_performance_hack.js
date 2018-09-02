settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("scrolling_performance_hack")) {
        // kill any scroll event listeners.
        // passing true for `useCapture` will let us stop propagation before any other listeners see it
        document.addEventListener('scroll', function(event) {
            event.stopImmediatePropagation();
        }, true);

        // force the top bar to be collapsed because one of the event listeners was responsible for collapsing the bar.
        // instead of swapping the classes on the header element (thus allowing for some other code to put it back
        // later when we don't want it to), we will enable some CSS rules that make .headroom--top look the same as
        // .headroom--not-top
        document.body.className += ' scrolling_performance_hack';

        // allow our other scripts to re-apply their own scroll handlers
        scrollHackAppliedEvent.raise();
    }
});
