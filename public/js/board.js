(function(window) {
    if (window.Board) {
        return;
    }
    window.Board = (function() {
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
        /** Главный класс кнопки */
        var Button = function(selector) {
            Controller.apply(this, arguments);
            this.btn = $(selector);
        };
        Button.prototype.switch = function() {};
        Button.prototype = Object.create(Controller.prototype);
        Button.prototype.constructor = Button;
        /** Клас кнопки переключателя */
        var SwitchBtn = function(selector) {
            Button.apply(this, arguments);
            var _this = this;
            this.btn.find("[type='checkbox']").on("change", function() {
                _this.emit('change', {state: $(this).prop('checked'), target: _this});
            });
        };
        SwitchBtn.prototype = Object.create(Button.prototype);
        SwitchBtn.prototype.constructor = SwitchBtn;
        SwitchBtn.prototype.state = function() {
            return this.btn.find("[type='checkbox']").prop('checked');
        };
        SwitchBtn.prototype.switch = function(state) {
            this.btn.find("[type='checkbox']").prop('checked', !!state);
        };
            /** Класс кнопки работающей по нажатию */
        var PushBtn = function(selector) {
            var _this = this;
            Button.apply(this, arguments);
            this.btn.on('mousedown', function() {
                _this.switch(true);
            });
            $(document).on('mouseup', function() {
                if (_this.push) {
                    _this.switch(false);
                }
            });
        };
        PushBtn.prototype = Object.create(Button.prototype);
        PushBtn.prototype.constructor = PushBtn;
        PushBtn.prototype.state = function() {
            return this.push;
        };
        PushBtn.prototype.switch = function(state) {
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
            /** Объект для работы с коллекцией кнопок */
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
        /** Класс для работы со светодиодами */
        var Led = function(selector) {
            Controller.apply(this, arguments);
            this.led = $(selector);
        };
        Led.prototype = Object.create(Controller.prototype);
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
        /** Объект работы со светодиодами */
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
        var Rotary = function(selector) {
            Controller.apply(this, arguments);
            this.code = 4;
            this.controller = $(selector);
            this.isDown = false;
            this.center = {
                x: this.controller.offset().left+this.controller.width()/2,
                y: this.controller.offset().top+this.controller.height()/2
            };
            this.isDblClick = Rotary.StateClick.NO_CLICK;
            this.currentAngle = Rotary.AngleState.ANGLE_0;
            this.prevAngle = Rotary.AngleState.ANGLE_0;
            // Подключаем обработчики в контексте объекта
            $(document).on("mousemove", (function(context) {
                return function() {
                    context.mousemoveHandler.apply(context, arguments);
                };
            })(this));
            this.controller.on("mousedown", (function(context) {
                return function() {
                    context.mousedownHandler.apply(context, arguments);
                };
            })(this));
            $(document).on("mouseup", (function(context) {
                return function() {
                    context.mouseupHandler.apply(context, arguments);
                };
            })(this));
        };
        Rotary.prototype = Object.create(Controller.prototype);
        Rotary.prototype.constructor = Rotary;
        // Состояния для двойного клика
        Rotary.StateClick = {
            NO_CLICK: 0,
            FIRST_CLICK: 1,
            DOUBLE_CLICK: 2
        };
        // Состояния для поворотов
        Rotary.AngleState = {
            ANGLE_0: 0,
            ANGLE_90: 1,
            ANGLE_180: 2,
            ANGLE_270: 3
        };
        // Состояние направлений
        Rotary.Dir = {
            LEFT: 0,
            RIGHT: 1
        };
        Rotary.prototype.mousemoveHandler = function(e) {
            if(this.isDown) {
                var angle = Math.atan2(
                        e.pageX - this.center.x,
                        -(e.pageY - this.center.y)
                    )*(180/Math.PI);
                this.rotate(angle);
                this.controller.css({"-webkit-transform": "rotate("+parseInt(angle)+"deg)"});
                this.controller.css({"-moz-transform": "rotate("+parseInt(angle)+"deg)"});
                this.controller.css({"transform": "rotate("+parseInt(angle)+"deg)"});
            }
        };
        Rotary.prototype.mousedownHandler = function(e) {
            e.originalEvent.preventDefault();
            var _this = this;
            _this.isDown = true;
            switch (_this.isDblClick) {
                case Rotary.StateClick.NO_CLICK:
                    _this.isDblClick = Rotary.StateClick.FIRST_CLICK;
                    setTimeout(function() {
                        if (_this.isDblClick === Rotary.StateClick.FIRST_CLICK) {
                            _this.isDblClick = Rotary.StateClick.NO_CLICK;
                        } else {
                            _this.isDown = false;
                        }
                    }, 250);
                    break;
                case Rotary.StateClick.FIRST_CLICK:
                    _this.isDblClick = Rotary.StateClick.DOUBLE_CLICK;
                    _this.controller.addClass("rotary_push");
                    _this.emit('change', {data: [4], target: this.controller});
                    break;
            }
        };
        Rotary.prototype.mouseupHandler = function(e) {
            this.isDown = false;
            if (this.isDblClick === Rotary.StateClick.DOUBLE_CLICK) {
                this.isDblClick = Rotary.StateClick.NO_CLICK;
                this.controller.removeClass("rotary_push");
            }
        };
        Rotary.prototype.direction = function() {
            if (
                this.prevAngle === Rotary.AngleState.ANGLE_270
                &&
                this.currentAngle === Rotary.AngleState.ANGLE_0
            ) {
                return Rotary.Dir.RIGHT;
            }
            if (
                this.prevAngle === Rotary.AngleState.ANGLE_0
                &&
                this.currentAngle === Rotary.AngleState.ANGLE_270
            ) {
                return Rotary.Dir.LEFT;
            }
            if (this.prevAngle > this.currentAngle) {
                return Rotary.Dir.LEFT;
            } else {
                return Rotary.Dir.RIGHT;
            }
        };
        Rotary.prototype.rotate = function(angle) {
            if (angle > 0 && angle < 90) {
                this.currentAngle = Rotary.AngleState.ANGLE_0;
            } else if (angle > 90 && angle < 180) {
                this.currentAngle = Rotary.AngleState.ANGLE_90;
            } else if (angle < -90 && angle > -180) {
                this.currentAngle = Rotary.AngleState.ANGLE_180;
            } else if (angle < 0 && angle > -90) {
                this.currentAngle = Rotary.AngleState.ANGLE_270;
            }

            if (this.prevAngle !== this.currentAngle) {
                if (this.direction() === Rotary.Dir.LEFT) {
                    this.emit('change', {data: [2], target: this.controller});
                } else {
                    this.emit('change', {data: [1], target: this.controller});
                }
                this.prevAngle = this.currentAngle;
            }
        };
        Rotary.prototype.change = function(callback) {
            this.on('change', (function(context) {
                return function(data) {
                    callback.apply(context, [data]);
                }
            })(this));
        };
        Rotary.prototype.getCode = function() {
            return this.code;
        };
        var _this = null,
            rotar = null;
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
            }
        };
    })();
})(window);