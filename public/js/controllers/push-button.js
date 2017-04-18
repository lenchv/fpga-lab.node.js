/**
 * Класс кнопки работающей по нажатию
 */
(function() {
    if (window.BoardControllers.PushButton) {
        return
    }
    var PushButton = function(selector) {
        var _this = this;
        window.BoardControllers.Button.apply(this, arguments);
        this.btn.on('mousedown', function() {
            _this.switch(true);
        });
        $(document).on('mouseup', function() {
            if (_this.push) {
                _this.switch(false);
            }
        });
    };
    PushButton.prototype = Object.create(window.BoardControllers.Button.prototype);
    PushButton.prototype.constructor = PushButton;
    PushButton.prototype.state = function() {
        return this.push;
    };
    PushButton.prototype.switch = function(state) {
        var _this = this;
        if (state) {
            _this.btn.addClass("push-button_active");
            _this.push = true;
            _this.emit('change', {state: true, target: _this});
        } else {
            _this.btn.removeClass("push-button_active");
            _this.push = false;
            _this.emit('change', {state: false, target: _this});
        }
    };

    window.BoardControllers.PushButton = PushButton;
})(window.BoardControllers);