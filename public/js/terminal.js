(function(winddow) {
    if (window.Terminal)
        return;
    window.Terminal = function(selector) {
        var _console = $(selector),
            _carret = $("<span class='console__carret console__carret_hide'>&nbsp;</span>"),
            _this = null,
            _charBuffer = [],
            _event = {};
        _console.append(_carret);
        // получение символа из keypress
        var getChar = function (event) {
            if (event.which == null) { // IE
                if (event.keyCode < 32) return null; // спец. символ
                return String.fromCharCode(event.keyCode)
            }
            if (event.which != 0 && event.charCode != 0) { // все кроме IE
                if (event.which < 32) return null; // спец. символ
                return String.fromCharCode(event.which); // остальные
            }

            return null; // спец. символ
        };
        // метод ввода в консоль с генерацией события
        var _put = function(text) {
            _this.put(text);
            _this.emit("put", {data: text});
        };
        return {
            init: function(selector) {
                _this = this;
                _console
                    .on("focus", function() {
                        $(this)
                            .addClass("console_focus")
                            .addClass("color-900")
                            .removeClass("color-800");
                        _carret.removeClass("console__carret_hide");
                    })
                    .on("blur", function () {
                        $(this)
                            .removeClass("console_focus")
                            .addClass("color-800")
                            .removeClass("color-900");
                        _carret.addClass("console__carret_hide");
                    })
                    .on("keypress", _this.keyPressHandler)
                    .on("mousemove", _this.mouseMoveHandler);
                return _this;
            }, // инициализация
            mouseMoveHandler: function(e) {
                _this.emit("mousemove", {offsetX: e.offsetX, offsetY: e.offsetY, "ok": "ok"});
            },
            keyPressHandler: function(e) {
                e = e || winddow.event;
                var char = getChar(e) || e.keyCode;
                _this.putChar(char);
            }, // обработчик нажатия клавиши
            putChar: function(char) {
                var putChar = char;
                switch (char) {
                    case "\n":
                    case 13:
                        if (_charBuffer.length > 0) {
                            _put(_charBuffer.join(""));
                            _charBuffer = [];
                            _console.find(".console__char").remove();
                            return _this;
                        }
                        break;
                    case ' ':
                    case 32:
                        putChar = "&nbsp;";
                }
                _charBuffer.push(char);
                $(_carret).before("<span class='console__char'>" + putChar + "</span>");
                return _this;
            }, // ввод символа
            put: function(text) {
                $(_carret).before("<div class='console__text'>"+text+"</div>");
                return _this;
            }, // запись в консоль
            on: function(event, callback) {
                if (typeof callback !== 'function') {
                    return _this;
                }
                if (!_event.hasOwnProperty(event)) {
                    _event[event] = [];
                }
                _event[event].push(callback);
                return _this;
            }, // регистратор событий
            emit: function(event, data) {
                if (_event.hasOwnProperty(event)) {
                    $.each(_event[event], function(key, cb) {
                        cb(data);
                    });
                }
            } // исполнитель событий
        };
    };
})(window);