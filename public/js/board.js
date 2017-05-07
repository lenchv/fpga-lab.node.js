(function(window) {
    if (window.Board) {
        return;
    }
    window.Board = (function() {
        var Button = window.BoardControllers.Button;
        var SwitchBtn = window.BoardControllers.SwitchButton;
        var PushBtn = window.BoardControllers.PushButton;
        var Led = window.BoardControllers.Led;
        var Rotary = window.BoardControllers.Rotary;
        var Keyboard = window.BoardControllers.Keyboard;
        // кнопки
        var buttons = (function() {
            var buttons = [],
                code = 3;
            return {
                getCode: function() {
                    return code;
                },
                add: function(btn) {
                    if (btn instanceof Button) {
                        buttons.unshift(btn);
                    }
                },
                getByte: function() {
                    var byte = 0,
                        n = 1;
                    for (var i = 0; i < buttons.length; i++) {
                        if (buttons[i].state()) {
                            byte += n;
                        }
                        n *= 2;
                    }
                    return byte;
                },
                getData: function() {
                    return [this.getByte()];
                },
                change: function(callback) {
                    for (var i = 0; i < buttons.length; i++) {
                        buttons[i].on('change', (function(that) {
                            return function(data) {
                                data.data = [that.getByte()];
                                callback.apply(that, [data]);
                            }
                        })(this));
                    }
                },
                set: function(byte) {
                    var n = 1;
                    for (var i = 0; i < buttons.length; i++) {
                        buttons[i].switch(!!(byte & n));
                        n *= 2;
                    }
                }
            };
        })();
        // светодиоды
        var leds = (function() {
            var leds = [],
                code = 2;
            return {
                getCode: function() {
                    return code;
                },
                add: function(l) {
                    if (l instanceof Led) {
                        leds.unshift(l);
                    }
                },
                set: function(byte) {
                    byte = parseInt(byte);
                    var n = 1;
                    for (var i = 0; i < leds.length; i++) {
                        leds[i].switch(!!(byte & n));
                        n *= 2;
                    }
                },
                getByte: function() {
                    var byte = 0,
                        n = 1;
                    for (var i = 0; i < leds.length; i++) {
                        if (leds[i].state()) {
                            byte += n;
                        }
                        n *= 2;
                    }
                    return byte;
                },
                getData: function() {
                    return [this.getByte()];
                },
                change: function(callback) {
                    for (var i = 0; i < leds.length; i++) {
                        leds[i].on('change', (function(that) {
                            return function(data) {
                                data.data = [that.getByte()];
                                callback.apply(that, [data]);
                            }
                        })(this));
                    }
                }
            };
        })();

        /** Класс для работы с крутилкой */
        var _this = null,
            rotar = null,
            keyboard = null;
        return {
            init: function(selector) {
                _this = this;
                _this.board = $(selector);
                /* Кнопки */
                buttons.add(new PushBtn(_this.board.find(".board__push-btn-west .push-button")[0]));
                buttons.add(new PushBtn(_this.board.find(".board__push-btn-south .push-button")[0]));
                buttons.add(new PushBtn(_this.board.find(".board__push-btn-north .push-button")[0]));
                buttons.add(new PushBtn(_this.board.find(".board__push-btn-east .push-button")[0]));
                _this.board.find(".board__switches .switch-button").each(function(i, sw) {
                    buttons.add(new SwitchBtn(sw));
                });
                //buttons.change(_this.buttonChangeHandler);
                /* Светодиоды */
                _this.board.find(".board__led .led").each(function(i, l) {
                    leds.add(new Led(l));
                });

                rotar = new Rotary(_this.board.find(".rotary")[0]);

                keyboard = new Keyboard(".keyboard");
            },
            buttonChangeHandler: function(data) {
                leds.set(buttons.getByte());
            },
            inData: function(data) {
                if (!data.code || !data.size) {
                    return;
                }
                var size = data.size,
                    i = 0;
                switch(data.code) {
                    case 2:
                        while (size-- > 0) {
                            leds.set(data.data.data[i++]);
                        }
                        break;
                    case 6:
                        keyboard.command(data.data.data[0]);
                    /*case 3:
                        while (size-- > 0) {
                            buttons.set(data.data.data[i++]);
                        }
                        break;*/
                }
            },
            outData: function(callback) {
                // leds.change(callback);
                buttons.change(callback);
                rotar.change(callback);
                keyboard.change(callback);
            }
        };
    })();
})(window);