/**
 * Общий класс для контроллеров платы
 */
(function() {
    if (window.BoardControllers.Button) {
        return
    }
    /** Главный класс кнопки */
    var Button = function(selector) {
        window.BoardControllers.Controller.apply(this, arguments);
        this.btn = $(selector);
    };
    Button.prototype.switch = function() {};
    Button.prototype = Object.create(window.BoardControllers.Controller.prototype);
    Button.prototype.constructor = Button;

    window.BoardControllers.Button = Button;
})(window.BoardControllers);
