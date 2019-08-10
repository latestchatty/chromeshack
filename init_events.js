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
        handler.apply(this, arguments);
    }
};

var deferredHandlers = [];
// don't forget to Promise.all([...]) these handlers
const addDeferredHandler = (settingPromise, cb) => {
    deferredHandlers.push(
        settingPromise.then(cb).catch(e => console.log(e))
    );
};

if (!window.eventsInitialized) {
    var fullPostsCompletedEvent = new Event();
    var processPostEvent = new Event();
    var processPostBoxEvent = new Event();
    window.eventsInitialized = true;
}
