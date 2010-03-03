function Event()
{
    this.eventHandlers = new Array();
}

Event.prototype.addHandler = function(callback)
{
    this.eventHandlers.push(callback);
}

Event.prototype.raise = function(arg1, arg2)
{
    for (var i = 0; i < this.eventHandlers.length; i++)
    {
        this.eventHandlers[i](arg1, arg2);
    }
}

var parsePostEvent = new Event();
var postBoxEvent = new Event();
