/**
 * Класс для работы с крутилкой
 */
(function() {
    if (window.BoardControllers.Rotary) {
        return
    }
    var Rotary = function(selector) {
        window.BoardControllers.Controller.apply(this, arguments);
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
    Rotary.prototype = Object.create(window.BoardControllers.Controller.prototype);
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

    window.BoardControllers.Rotary = Rotary;
})(window.BoardControllers);