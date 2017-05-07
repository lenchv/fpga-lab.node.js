/**
 * Класс для работы с клавиатурой
 */
(function() {
    if (window.BoardControllers.Keyboard) {
        return
    }
    var Led = window.BoardControllers.Led;
    /** Карта символов { JS_CODE : KEYBOARD_CODE } */
    var CharToScan = {
        0x30:0x45, 0x31:0x16, 0x32:0x1E, 0x33:0x26, 0x34:0x25, 0x35:0x2E, 0x36:0x36, 0x37:0x3D,
        0x38:0x3E, 0x39:0x46, 0x41:0x1C, 0x42:0x32, 0x43:0x21, 0x44:0x23, 0x45:0x24, 0x46:0x2B,
        0x47:0x34, 0x48:0x33, 0x49:0x43, 0x50:0x4D, 0x51:0x15, 0x52:0x2D, 0x53:0x1B, 0x54:0x2C,
        0x55:0x3C, 0x56:0x2A, 0x57:0x1D, 0x58:0x22, 0x59:0x35, 0x4f:0x44, 0x4a:0x3B, 0x4b:0x42,
        0x4c:0x4B, 0x5a:0x1A, 0x4e:0x31, 0x4d:0x3A, 0x1b:0x76, 0xC0:0x0E, 0x09:0x0D, 0x14:0x58,
        0x10:0x12, 0x11:0x14, 0x12:0x11, 0x20:0x29, 0x110:0x59, 0x111:0xE014, 0x112:0xE011, 0x0D:0x5A,
        0xDC:0x5D, 0x08:0x66, 0xBB:0x55, 0xBD:0x4E, 0xDB:0x54, 0xDD:0x5B, 0xDE:0x52, 0xBA:0x4C,
        0xBC:0x41, 0xBE:0x49, 0xBF:0x4A, 0x70:0x05, 0x71:0x06, 0x72:0x04, 0x73:0x0C, 0x74:0x03,
        0x75:0x0B, 0x76:0x83, 0x77:0x0A, 0x78:0x01, 0x79:0x09, 0x7A:0x78, 0x7B:0x07, 0x26:0xE075,
        0x25:0xE06B, 0x28:0xE072, 0x27:0xE074, 0x90:0x77, 0x91:0x7E, 0x2D:0xE070, 0x24:0xE06C, 0x2E:0xE071,
        0x23:0xE069, 0x22:0xE07A, 0x21:0xE07D, 0x6d:0x7B, 0x6f:0xE04A, 0x6a:0x7C, 0x6e:0x71, 0x6b:0x79,
        0x10d:0xE05A, 0x60:0x70, 0x61:0x69, 0x62:0x72, 0x63:0x7A, 0x64:0x6B, 0x65:0x73, 0x66:0x74,
        0x67:0x6C, 0x68:0x75, 0x69:0x7D
    };

    var scanDecode = {
        0x45:"0",
        0x16:"1",
        0x1E:"2",
        0x26:"3",
        0x25:"4",
        0x2E:"5",
        0x36:"6",
        0x3D:"7",
        0x3E:"8",
        0x46:"9",
        0x1C:"A",
        0x32:"B",
        0x21:"C",
        0x23:"D",
        0x24:"E",
        0x2B:"F",
        0x34:"G",
        0x33:"H",
        0x43:"I",
        0x3B:"J",
        0x42:"K",
        0x4B:"L",
        0x3A:"M",
        0x31:"N",
        0x44:"O",
        0x4D:"P",
        0x15:"Q",
        0x2D:"R",
        0x1B:"S",
        0x2C:"T",
        0x3C:"U",
        0x2A:"V",
        0x1D:"W",
        0x22:"X",
        0x35:"Y",
        0x1A:"Z",
        0x76:"ESC",
        0x0E:"`",
        0x0D:"TAB",
        0x58:"CAPS",
        0x12:"L SHFT",
        0x14:"L CTRL",
        0xE070:"INSERT",
        0x54:"[",
        0x4E:"-",
        0xE06C:"HOME",
        0x55:"=",
        0xE07D:"PG UP",
        0x5D:"\\",
        0xE071:"DELETE",
        0x66:"BKSP",
        0xE069:"END",
        0x29:"SPACE",
        0xE07A:"PG DN",
        0xE075:"U ARROW",
        0xE06B:"L ARROW",
        0xE072:"D ARROW",
        0xE074:"R ARROW",
        0xE01F:"L GUI",
        0x77:"NUM",
        0x11:"L ALT",
        0x59:"R SHFT",
        0xE014:"R CTRL",
        0xE027:"R GUI",
        0xE011:"R ALT",
        0xE02F:"APPS",
        0x5A:"ENTER",
        0x05:"F1",
        0x06:"F2",
        0x04:"F3",
        0x0C:"F4",
        0x03:"F5",
        0x0B:"F6",
        0x83:"F7",
        0x0A:"F8",
        0x01:"F9",
        0x09:"F10",
        0x78:"F11",
        0x07:"F12",
        0x7B:"KP -",
        0xE04A:"KP /",
        0x7C:"KP *",
        0x71:"KP .",
        0x79:"KP +",
        0xE05A:"KP EN",
        0x70:"KP 0",
        0x69:"KP 1",
        0x72:"KP 2",
        0x7A:"KP 3",
        0x6B:"KP 4",
        0x73:"KP 5",
        0x74:"KP 6",
        0x6C:"KP 7",
        0x75:"KP 8",
        0x7D:"KP 9",
        0x5B:"]",
        0x4C:";",
        0x52:"'",
        0x41:",",
        0x49:".",
        0x7E:"SCROLL",
        0x4A:"/"
    };


    var Keyboard = function(selector) {
        var _this = this;
        window.BoardControllers.Controller.apply(_this, arguments);
        _this.code = 0x06;
        _this.keyboard = $(selector);
        _this.button = _this.keyboard.find("#keyboard_btn");
        _this.enabled = _this.button.prop("checked");
        _this.leds = {
            capsLock: new Led(selector + " .keyboard__caps-lock"),
            numLock: new Led(selector + " .keyboard__num-lock"),
            scrollLock: new Led(selector + " .keyboard__scroll-lock"),
            switch: function(byte) {
                this.capsLock.switch(!!(byte & 0x04));
                this.numLock.switch(!!(byte & 0x02));
                this.scrollLock.switch(!!(byte & 0x01));
            }
        };
        _this.comandState = Keyboard.COMMANDS.IDLE;
        _this.scanCodeTrigger = null;
        _this.button.on("change", function() {
            _this.enabled = $(this).prop("checked");
        });
        $(document).on("keydown", function(e) {
            e = e || window.event;
            if (_this.enabled) {
                (e.preventDefault ? e.preventDefault() : e.returnValue = false);
                var charCode = e.keyCode;
                var data = getScanCode(charCode, e.originalEvent.location);
                if (data) {
                    _this.scanCodeTrigger = data;
                    _this.emit("change", {data: data});
                }
            }
        });
        $(document).on("keyup", function(e) {
            e = e || window.event;
            if (_this.enabled) {
                (e.preventDefault ? e.preventDefault() : e.returnValue = false);
                var charCode = e.keyCode;
                var data = getScanCode(charCode, e.originalEvent.location);
                if (data) {
                    data.unshift(0xF0);
                    _this.emit("change", {data: data});
                }
            }
        });
        /**
         *  Возвращает скан код клавиши по символьному коду
         * @param charCode - ASCII код клавиши
         * @param location - расположение на клавиатуре для правых alt,shift, ctr, enter
         * @returns {*}
         */
        var getScanCode = function(charCode, location) {
            // right ctrl, shit, alt
            if ([0x10,0x11,0x12].indexOf(charCode) >= 0 && location === 2) {
                charCode += 0x100;
            }
            // numpad enter
            if (charCode === 0x0D && location === 3) {
                charCode += 0x100;
            }
            if (scanDecode[CharToScan[charCode]]) {
                var scanCode = CharToScan[charCode];
                var data = [];
                if (scanCode > 0xFF) {
                    while (scanCode) {
                        data.unshift(scanCode & 0xFF);
                        scanCode = scanCode >> 8;
                    }
                } else {
                    data.push(scanCode);
                }
                return data;
            }
            return false;
        };
    };
    Keyboard.prototype = Object.create(window.BoardControllers.Controller.prototype);
    Keyboard.prototype.constructor = Keyboard;
    Keyboard.COMMANDS = {
        IDLE: 0,
        LEDS: 1
    };
    Keyboard.prototype.getCode = function() {
        return this.code;
    };
    Keyboard.prototype.change = function(callback) {
        this.on("change", (function(that) {
            return function(data) {
                callback.apply(that, [data]);
            }
        })(this));
    };

    Keyboard.prototype.command = function(data) {
        if (this.comandState === Keyboard.COMMANDS.IDLE) {
            switch(data) {
                case 0xED:
                    this.emit("change", {data: [0xFA]});
                    this.comandState = Keyboard.COMMANDS.LEDS;
                    break;
                case 0xFE:
                    this.emit("change", {data: this.scanCodeTrigger});
                    break;
                case 0xFF:
                    this.leds.switch(0x07);
                    setTimeout((function(ctx) {
                        return function() {
                            ctx.leds.switch(0x00);
                        };
                    })(this), 250);
                    this.scanCodeTrigger = null;
                    break;
                case 0xEE:
                    this.emit("change", {data: [0xEE]});
                    break;
                case 0xF2:
                    this.emit("change", {data: [0xAB, 0x83]});
                    break;
            }
        } else if (this.comandState === Keyboard.COMMANDS.LEDS) {
            this.comandState = Keyboard.COMMANDS.IDLE;
            this.leds.switch(data);
        }
    };

    window.BoardControllers.Keyboard = Keyboard;
})(window.BoardControllers);