settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("scrolling_performance_hack")) {
        // kill any scroll event listeners.
        // passing true for `useCapture` will let us stop propagation before any other listeners see it
        document.addEventListener('scroll', function(event) {
            event.stopImmediatePropagation();
        }, true);

        // force the top bar to be collapsed because one of the event listeners was responsible for collapsing the bar
        $('header').removeClass('headroom--top').addClass('headroom--not-top');

        // allow our other scripts to re-apply their own scroll handlers
        scrollHackAppliedEvent.raise();
    }
});
