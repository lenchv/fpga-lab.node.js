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
            var counter = 2;

            this.code = 4;
            this.controller = $(selector);
            this.isDown = false;
            this.center = {
                x: this.controller.offset().left+this.controller.width()/2,
                y: this.controller.offset().top+this.controller.height()/2
            };
            this.isDblClick = Rotary.StateClick.NO_CLICK;
            this.angle = 0;
            this.prevAngle = 0;
            this.dir = Rotary.Dir.RIGHT;
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

            // Колесико

            var onWheel = (function(context) {
                return function(e) {
                    e = e.originalEvent || window.event;
                    var delta = e.deltaY || e.detail || e.wheelDelta;
                    if (delta > 0) {
                        context.angle -= 15;
                    } else {
                        context.angle += 15;
                    }
                    prev = delta;
                    context.rotate(context.angle);
                    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                }
            })(this);
            if ('onwheel' in document) {
                // IE9+, FF17+, Ch31+
                this.controller.on("wheel", onWheel);
            } else if ('onmousewheel' in document) {
                // устаревший вариант события
                this.controller.on("mousewheel", onWheel);
            } else {
                // Firefox < 17
                this.controller.on("MozMousePixelScroll", onWheel);
            }
            this.doCount = function() {
                if (this.dir === Rotary.Dir.RIGHT) {
                    counter = counter > 2 ? 0 : counter + 1;
                } else {
                    counter = counter < 1 ? 3 : counter - 1;
                }
                return this.getCount();
            };
            this.getCount = function() {
                return this.grayEncode(counter);
            };
            this.grayEncode = function(number) { return counter ^ (counter >> 1); };
            this.grayDecode = function(gray) {
                var bin;
                for (bin = 0; gray; gray >>= 1) {
                    bin ^= gray;
                }
                return bin;
            };
            this.getData = function() {
                return this.getCount() | (this.isDblClick === Rotary.StateClick.DOUBLE_CLICK ? 4 : 0);
            };
        };
        Rotary.prototype = Object.create(Controller.prototype);
        Rotary.prototype.constructor = Rotary;
        // Состояния для двойного клика
        Rotary.StateClick = {
            NO_CLICK: 0,
            FIRST_CLICK: 1,
            DOUBLE_CLICK: 2
        };
        // Состояние направлений
        Rotary.Dir = {
            LEFT: 0,
            RIGHT: 1
        };
        Rotary.prototype.mousemoveHandler = function(e) {
            if(this.isDown) {
                this.angle = Math.atan2(
                        e.pageX - this.center.x,
                        -(e.pageY - this.center.y)
                    )*(180/Math.PI);
                this.rotate(this.angle < 0 ? 360 + this.angle : this.angle);
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
                            //_this.isDown = false;
                        }
                    }, 250);
                    break;
                case Rotary.StateClick.FIRST_CLICK:
                    _this.isDblClick = Rotary.StateClick.DOUBLE_CLICK;
                    _this.controller.addClass("rotary_push");
                    _this.emit('change', {data: [_this.getData()], target: _this.controller});
                    break;
            }
        };
        Rotary.prototype.mouseupHandler = function(e) {
            this.isDown = false;
            if (this.isDblClick === Rotary.StateClick.DOUBLE_CLICK) {
                this.isDblClick = Rotary.StateClick.NO_CLICK;
                this.controller.removeClass("rotary_push");
                this.emit('change', {data: [this.getData()], target: this.controller});
            }
        };
        Rotary.prototype.direction = function(angle) {
            angle = parseInt(angle);
            if (
                this.prevAngle > 350
                &&
                angle < 10
            ) {
                this.dir = Rotary.Dir.RIGHT;
                this.prevAngle = angle;
                return true;
            } else if (
                this.prevAngle < 10
                &&
                angle > 350
            ) {
                this.dir = Rotary.Dir.LEFT;
                this.prevAngle = angle;
                return true;
            } else if (angle > this.prevAngle + 5) {
                this.dir = Rotary.Dir.RIGHT;
                this.prevAngle = angle;
                return true;
            } else if (angle < this.prevAngle - 5) {
                this.dir = Rotary.Dir.LEFT;
                this.prevAngle = angle;
                return true;
            }
            return false;
        };
        Rotary.prototype.rotate = function(angle) {
            if (this.direction(angle)) {
                this.doCount();
                this.emit('change', {data: [this.getData()], target: this.controller});

                this.controller.css({"-webkit-transform": "rotate("+parseInt(angle)+"deg)"});
                this.controller.css({"-moz-transform": "rotate("+parseInt(angle)+"deg)"});
                this.controller.css({"transform": "rotate("+parseInt(angle)+"deg)"});
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