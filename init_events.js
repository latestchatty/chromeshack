function Event() {
    this.eventHandlers = [];
}

Event.prototype.addHandler = function(callback) {
    this.eventHandlers.push(callback);
};

Event.prototype.removeHandler = function(callback) {
    let index = this.eventHandlers.indexOf(callback);
    if (index >= 0) this.eventHandlers.splice(index, 1);
};

Event.prototype.raise = function() {
    for (let handler of this.eventHandlers) {
        if (handler) handler.apply(this, arguments);
    }
};

var deferredHandlers = [];
// don't forget to Promise.all([...]) these handlers
const addDeferredHandler = (settingPromise, cb) => {
    if (cb) deferredHandlers.push(settingPromise.then(cb));
};

if (!window.eventsInitialized) {
    var fullPostsCompletedEvent = new Event();
    var processPostEvent = new Event();
    var processPostBoxEvent = new Event();
    var processReplyEvent = new Event();
    var processRefreshEvent = new Event();
    var processEmptyTagsLoadedEvent = new Event();
    var processTagDataLoadedEvent = new Event();
    var caughtReplyMutationEvent = new Event();
    window.eventsInitialized = true;
}
