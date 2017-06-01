/**
 * Класс для работы с клавиатурой
 */
(function() {
    if (window.BoardControllers.Mouse) {
        return
    }

    var Mouse = function(selector) {
        var _this = this;
        window.BoardControllers.Controller.apply(_this, arguments);
        _this.code = 0x07;
        _this.mouse = $(selector);
        _this.button = _this.mouse.find("#mouse_btn");
        _this.enabled = _this.mouse.prop("checked");
        _this.data = [
            0x08,
            0x00,
            0x00,
            0x00
        ];

        _this.button.on("change", function() {
            _this.enabled = $(this).prop("checked");
            if (_this.enabled) {
                $(document).on('mousemove', mouseMoveHandler);
                $(document).on('mousedown', mouseClickHandler);
                $(document).on('mouseup', mouseClickHandler);
                onWheel(document, wheelHandler);
            } else {
                $(document).off('mousemove', mouseMoveHandler);
                $(document).off('mousedown', mouseClickHandler);
                $(document).off('mouseup', mouseClickHandler);
                offWheel(document, wheelHandler);
            }
        });


        var saveOfsX = 0;
        var saveOfsY = 0;
        var saveDelta = 0;
        _this.offsetX = 0;
        _this.offsetY = 0;
        var mouseMoveHandler = function(e) {
            //console.log({x: ofsX - e.offsetX, y: ofsY - e.offsetY});
            _this.offsetX = (saveOfsX - e.offsetX) * -1;
            _this.offsetY = saveOfsY - e.offsetY;
            if (_this.offsetX < 0) {
                _this.data[0] = _this.data[0] | 0x10;
            } else {
                _this.data[0] = _this.data[0] & ~0x10;
            }
            if (_this.offsetX > 256) {
                _this.data[0] = _this.data[0] | 0x20;
            } else {
                _this.data[0] = _this.data[0] & ~0x20;
            }
            _this.data[1] = Math.abs(_this.offsetX % 256);
            if (_this.offsetY < 0) {
                _this.data[0] = _this.data[0] | 0x20;
            } else {
                _this.data[0] = _this.data[0] & ~0x20;
            }
            if (_this.offsetY > 256) {
                _this.data[0] = _this.data[0] | 0x40;
            } else {
                _this.data[0] = _this.data[0] & ~0x40;
            }
            _this.data[2] = Math.abs(_this.offsetY % 256);
            saveOfsX = e.offsetX;
            saveOfsY = e.offsetY;
            packChange();
        };

        var mouseClickHandler = function(e) {
            e = e || window.event;
            var btnMask = [0x01, 0x04, 0x02];
            _this.data[0] = _this.data[0] ^ btnMask[e.button];
            packChange();
        };

        var wheelHandler = function(e) {
            e = e || window.event;
            var delta = e.deltaY || e.detail || e.wheelDelta,
                d = 0;
            saveDelta += (delta > 0 ? 1 : -1);
            if (saveDelta > 7) {
                saveDelta = 7;
            } else if (saveDelta < -8) {
                saveDelta = -8;
            }
            d = saveDelta;
            if (saveDelta < 0) {
                d = 0x08 | (Math.abs(saveDelta) - 1);
            }
            _this.data[3] =  d | (_this.data[3] & 0xF0);
            packChange();
        };

        var packChange = function() {
            _this.emit("change", {data: _this.data});
            /*
            var show = [];
            _this.data.forEach(function(i) {
                show.push(i.toString(2));
            });
            console.log(show);*/
        };
        var onWheel = function(elem, handler) {
            if (elem.addEventListener) {
                if ('onwheel' in document) {
                    // IE9+, FF17+, Ch31+
                    elem.addEventListener("wheel", handler);
                } else if ('onmousewheel' in document) {
                    // устаревший вариант события
                    elem.addEventListener("mousewheel", handler);
                } else {
                    // Firefox < 17
                    elem.addEventListener("MozMousePixelScroll", handler);
                }
            } else { // IE8-
                elem.attachEvent("onmousewheel", handler);
            }
        };
        var offWheel = function(elem, handler) {
            if (elem.removeEventListener) {
                if ('onwheel' in document) {
                    // IE9+, FF17+, Ch31+
                    elem.removeEventListener("wheel", handler);
                } else if ('onmousewheel' in document) {
                    // устаревший вариант события
                    elem.removeEventListener("mousewheel", handler);
                } else {
                    // Firefox < 17
                    elem.removeEventListener("MozMousePixelScroll", handler);
                }
            } else { // IE8-
                elem.detachEvent("onmousewheel", handler);
            }
        };
    };
    Mouse.prototype = Object.create(window.BoardControllers.Controller.prototype);
    Mouse.prototype.constructor = Mouse;

    Mouse.prototype.getCode = function() {
        return this.code;
    };
    Mouse.prototype.change = function(callback) {
        this.on("change", (function(that) {
            return function(data) {
                callback.apply(that, [data]);
            }
        })(this));
    };

    Mouse.prototype.command = function(data) {
        switch(data) {
            case 0xF2:
                this.emit("change", {data: [0xAB, 0x83]});
                break;
        }
    };

    window.BoardControllers.Mouse = Mouse;
})(window.BoardControllers);