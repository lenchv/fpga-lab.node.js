var SerialPort = require('serialport'),
    proc = require('child_process'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    log = require("../lib/log")(module);
    UserSpace = require("../model/userSpace").UserSpace;
const XILINX_IMPACT = "C:\\Xilinx\\14.7\\LabTools\\LabTools\\bin\\nt\\";
/**
 * Прошивка
 * @param socket - socket client
 * @param file - firmware file name
 * @param callback
 */
var firmWare = function(socket, file, callback) {
    async.waterfall([
        function(next) {
            UserSpace.findOne({user: socket.handshake.user._id}, next);
        },
        function(space, next) {
            var pathToFirmware = __dirname + path.sep + ".." +space.get('folder')+file;
            fs.stat(pathToFirmware, function(err) {
                if (err) return next(err);
                next(null, pathToFirmware);
            });
        },
        function(pathToFirmware, next) {
            var impact = proc.spawn(
                "program.bat",
                [XILINX_IMPACT, pathToFirmware],
                {cwd:  __dirname + path.sep + "../bin/", shell: "cmd.exe"}
            );
            impact.stdout.on("data", function(data) {
                socket.emit("put console", data.toString());
            });
            impact.stderr.on("data", function(data) {
                socket.emit("put console", data.toString());
            });
            impact.on("exit", function(code) {
                if (code === 0) {
                    next();
                } else {
                    next(new Error("Exit code " + code));
                }
            });
        }
    ], callback);
};
/**
 * Класс для работы с пакетом данных для передачи в и приема от платы
 */
var ComPacket = (function() {
    var pack = {
            size: 0,
            code: false,
            data: Buffer.alloc(0)
        },
        offset = 0,
        states = {
            START: 0,
            LENGTH: 1,
            CODE: 2,
            DATA: 3
        },
        state = states.START,
        meta = 0x0000,
        firstByteLength = true,
        filled = false;

    // инициализация пакета
    var init = function() {
        offset = 0;
        filled = false;
        pack = {
            size: 0,
            code: false,
            data: Buffer.alloc(0)
        };
    };
    return {
        // ввода данных
        push: function(data) {
            var byte = data[0];
            switch(state) {
                case states.START:
                    meta = meta << 8;
                    meta += byte;
                    meta = meta & 0x0FFFF;
                    if (meta === 0xAA55) {
                        state = states.LENGTH;
                        init();
                    }
                    break;
                case states.LENGTH:
                    pack.size += byte;
                    if (firstByteLength) {
                        pack.size = pack.size << 8;
                        firstByteLength = false;
                    } else {
                        pack.data = Buffer.alloc(pack.size);
                        state = states.CODE;
                        firstByteLength = true;
                    }
                    break;
                case states.CODE:
                    pack.code = byte;
                    state = states.DATA;
                    break;
                case states.DATA:
                    pack.data[offset] = byte;
                    offset++;
                    if (offset >= pack.size) {
                        filled = true;
                        state = states.START;
                    }
                    break;
            }
        },
        // считывает покет с очисткой
        flush: function() {
            var p = this.get();
            init();
            return p;
        },
        // считывает пакет
        get: function() {
            return {
                size: pack.size,
                code: pack.code,
                data: pack.data.toJSON()
            };
        },
        // пакет готов
        isFilled: function() {
            return filled;
        },
        create: function(data) {
            var bufData = Buffer.from(data.data);
            var buf = Buffer.alloc(bufData.length + 5); // 0xAA 0x55 <len 2 byte> <code 1 byte> <data>
            buf[0] = 0xAA;
            buf[1] = 0x55;
            buf.writeUInt16BE(bufData.length, 2);
            buf[4] = data.code;
            bufData.copy(buf, 5);
            bufData = null;
            return buf;
        }
    };
})();

var connectToComPort = function(socket) {
    if (!socket.handshake.board)
        return false;
    if (socket.handshake.SerialPort)
        return false;

    socket.handshake.SerialPort = new SerialPort(
        socket.handshake.board.comport,
        {
            autoOpen: false,
            baudRate: socket.handshake.board.baudRate,
            parser: SerialPort.parsers.byteLength(1)
        }
    );
    socket.handshake.SerialPort.open(function(err) {
        if (err) {
            socket.emit("put console", "Failed connect to " + socket.handshake.board.comport);
        } else {
            socket.emit("put console", "Connect to " + socket.handshake.board.comport+" successful");
            socket.handshake.SerialPort.on("data", function(data) {
                console.log(data);
                ComPacket.push(data);
                if (ComPacket.isFilled()) {
                    socket.emit("board", "data", ComPacket.flush());
                }
            });
        }
    });
};

module.exports = function(socket) {
    connectToComPort(socket);
    socket.use(function(packet, next) {
        if (!socket.handshake.board) {
            return next(new Error("Плата не выбрана"));
        }
        next();
    });
    /**
     * Прошивка
     */
    socket.on("board", function(type, data) {
        switch(type) {
            case "firmware":
                firmWare(socket, data, function(err) {
                    if (!err) {
                        connectToComPort(socket);
                    } else {
                        log.error(err.message);
                    }
                });
                break;
            case "serialData":
                if (socket.handshake.SerialPort && socket.handshake.SerialPort.isOpen()) {
                    var buf = ComPacket.create(data);
                    socket.handshake.SerialPort.write(buf);
                }
                break;
        }
    });

};