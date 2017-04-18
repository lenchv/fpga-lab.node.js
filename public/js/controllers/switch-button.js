/**
 * Класс кнопки переключателя
 */
(function() {
    if (window.BoardControllers.SwitchButton) {
        return
    }
    var SwitchButton = function(selector) {
        window.BoardControllers.Button.apply(this, arguments);
        var _this = this;
        this.btn.find("[type='checkbox']").on("change", function() {
            _this.emit('change', {state: $(this).prop('checked'), target: _this});
        });
    };
    SwitchButton.prototype = Object.create(window.BoardControllers.Button.prototype);
    SwitchButton.prototype.constructor = SwitchButton;
    SwitchButton.prototype.state = function() {
        return this.btn.find("[type='checkbox']").prop('checked');
    };
    SwitchButton.prototype.switch = function(state) {
        this.btn.find("[type='checkbox']").prop('checked', !!state);
    };

    window.BoardControllers.SwitchButton = SwitchButton;
})(window.BoardControllers);