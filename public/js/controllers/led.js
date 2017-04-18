/**
 * Класс для работы со светодиодами
 */
(function() {
    if (window.BoardControllers.Led) {
        return
    }
    var Led = function(selector) {
        window.BoardControllers.Controller.apply(this, arguments);
        this.led = $(selector);
    };
    Led.prototype = Object.create(window.BoardControllers.Controller.prototype);
    Led.prototype.constructor = Led;
    Led.prototype.switch = function(state) {
        if (state) {
            if (!this.led.hasClass("led_light")) {
                this.emit('change', {state: state, target: this});
            }
            this.led.addClass("led_light");
        } else {
            if (this.led.hasClass("led_light")) {
                this.emit('change', {state: state, target: this});
            }
            this.led.removeClass("led_light");
        }
    };
    Led.prototype.state = function() {
        return this.led.hasClass("led_light");
    };

    window.BoardControllers.Led = Led;
})(window.BoardControllers);