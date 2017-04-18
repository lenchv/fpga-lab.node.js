/**
 * Класс для работы с клавиатурой
 */
(function() {
    if (window.BoardControllers.Keyboard) {
        return
    }
    var Led = window.BoardControllers.Led;
    var CharToScan = {
        "30":"45",
        "31":"16",
        "32":"1E",
        "33":"26",
        "34":"25",
        "35":"2E",
        "36":"36",
        "37":"3D",
        "38":"3E",
        "39":"46",
        "41":"1C",
        "42":"32",
        "43":"21",
        "44":"23",
        "45":"24",
        "46":"2B",
        "47":"34",
        "48":"33",
        "49":"43",
        "50":"4D",
        "51":"15",
        "52":"2D",
        "53":"1B",
        "54":"2C",
        "55":"3C",
        "56":"2A",
        "57":"1D",
        "58":"22",
        "59":"35",
        "4f":"44",
        "4a":"3B",
        "4b":"42",
        "4c":"4B",
        "5a":"1A",
        "4e":"31",
        "4d":"3A"
    };

    var scanDecode = {
        "45": "0",
        "16": "1",
        "1E": "2",
        "26": "3",
        "25": "4",
        "2E": "5",
        "36": "6",
        "3D": "7",
        "3E": "8",
        "46": "9",
        "1C": "A",
        "32": "B",
        "21": "C",
        "23": "D",
        "24": "E",
        "2B": "F",
        "34": "G",
        "33": "H",
        "43": "I",
        "3B": "J",
        "42": "K",
        "4B": "L",
        "3A": "M",
        "31": "N",
        "44": "O",
        "4D": "P",
        "15": "Q",
        "2D": "R",
        "1B": "S",
        "2C": "T",
        "3C": "U",
        "2A": "V",
        "1D": "W",
        "22": "X",
        "35": "Y",
        "1A": "Z"
    };

    var scanCodes = {
        "0":"45",
        "1":"16",
        "2":"1E",
        "3":"26",
        "4":"25",
        "5":"2E",
        "6":"36",
        "7":"3D",
        "8":"3E",
        "9":"46",
        "A":"1C",
        "B":"32",
        "C":"21",
        "D":"23",
        "E":"24",
        "F":"2B",
        "G":"34",
        "H":"33",
        "I":"43",
        "J":"3B",
        "K":"42",
        "L":"4B",
        "M":"3A",
        "N":"31",
        "O":"44",
        "P":"4D",
        "Q":"15",
        "R":"2D",
        "S":"1B",
        "T":"2C",
        "U":"3C",
        "V":"2A",
        "W":"1D",
        "X":"22",
        "Y":"35",
        "Z":"1A",
        "[":"54",
        "`":"0E",
        "INSERT":"E0,70",
        "-":"4E",
        "HOME":"E0,6C",
        "=":"55",
        "PG UP":"E0,7D",
        "\\":"5D",
        "DELETE":"E0,71",
        "BKSP":"66",
        "END":"E0,69",
        "SPACE":"29",
        "PG DN":"E0,7A",
        "TAB":"0D",
        "U ARROW":"E0,75",
        "L ARROW":"E0,6B",
        "CAPS":"58",
        "L SHFT":"12",
        "D ARROW":"E0,72",
        "L CTRL":"14",
        "R ARROW":"E0,74",
        "L GUI":"E0,1F",
        "NUM":"77",
        "L ALT":"11",
        "KP /":"E0,4A",
        "R SHFT":"59",
        "KP *":"7C",
        "R CTRL":"E0,14",
        "KP -":"7B",
        "R GUI":"E0,27",
        "KP +":"79",
        "R ALT":"E0,11",
        "KP EN":"E0,5A",
        "APPS":"E0,2F",
        "KP .":"71",
        "ENTER":"5A",
        "KP 0":"70",
        "ESC":"76",
        "KP 1":"69",
        "F1":"05",
        "KP 2":"72",
        "F2":"06",
        "KP 3":"7A",
        "F3":"04",
        "KP 4":"6B",
        "F4":"0C",
        "KP 5":"73",
        "F5":"03",
        "KP 6":"74",
        "F6":"0B",
        "KP 7":"6C",
        "F7":"83",
        "KP 8":"75",
        "F8":"0A",
        "KP 9":"7D",
        "F9":"01",
        "]":"5B",
        "F10":"09",
        ";":"4C",
        "F11":"78",
        "'":"52",
        "F12":"07",
        ",":"41",
        "PRNT":"E0,12,",
        ".":"49",
        "SCROLL":"7E",
        "/":"4A",
        "PAUSE":"E1,14,77,"
    };

    var Keyboard = function(selector) {
        var _this = this;
        window.BoardControllers.Controller.apply(_this, arguments);
        _this.keyboard = $(selector);
        _this.button = _this.keyboard.find("#keyboard_btn");
        _this.enabled = _this.button.prop("checked");
        _this.leds = {
            capsLock: new Led(selector + " .keyboard__caps-lock"),
            numLock: new Led(selector + " .keyboard__num-lock"),
            scrollLock: new Led(selector + " .keyboard__scroll-lock")
        };

        _this.button.on("change", function() {
            _this.enabled = $(this).prop("checked");
        });
        $(document).on("keydown", function(e) {
            e = e || window.event;
            if (_this.enabled) {
                (e.preventDefault ? e.preventDefault() : e.returnValue = false);
                console.log([scanDecode[CharToScan[e.keyCode.toString(16)]], e.keyCode.toString(16), scanCodes[String.fromCharCode(e.keyCode)]]);
            }
        });
    };
    Keyboard.prototype = Object.create(window.BoardControllers.Controller.prototype);
    Keyboard.prototype.constructor = Keyboard;

    window.BoardControllers.Keyboard = Keyboard;
})(window.BoardControllers);