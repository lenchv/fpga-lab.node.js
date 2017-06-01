/**
 * Общий класс для контроллеров платы
 */
(function() {
    if (!window.BoardControllers) window.BoardControllers = {};
    if (window.BoardControllers.Controller) {
        return
    }
    var Controller = function() { this.events = {}; };
    Controller.prototype.on = function(event, callback) {
        if (callback instanceof Function) {
            if (!this.events[event]) {
                this.events[event] = [callback];
            } else {
                this.events[event].push(callback);
            }
        }
    };
    Controller.prototype.emit = function(event, data) {
        if (this.events[event]) {
            for(var i = 0; i < this.events[event].length; i++) {
                this.events[event][i](data);
            }
        }
    };
    Controller.prototype.change = function(callback) {
        this.on("change", (function(that) {
            return function(data) {
                callback.apply(that, [data]);
            }
        })(this));
    };
    Controller.prototype.getCode = function() {
        return 0;
    };
    window.BoardControllers.Controller = Controller;
})(window);
