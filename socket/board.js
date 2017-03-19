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

var ComPackage = function() {
    var size = 0,
        intermediateSize = false,
        pack = {
            code: false,
            data: null
        },
        offset = 0,
        newPack = true;
    this.put = function(data) {
        if (intermediateSize >= data.length) {
            intermediateSize -= data.length;
            data.copy(pack.data, offset);
            offset += data.length;
            return 0;
        } else {
            var s = intermediateSize;
            data.copy(pack.data, offset, 0, intermediateSize);
            offset += intermediateSize;
            intermediateSize = 0;
            return s;
        }
    };
    this.meta = function(data) {
        var index = data.indexOf(0xAA55);
        if (index !== -1 && index + 5 <= data.length) {
            newPack = false;
            intermediateSize = size = data.readInt16BE(index+1);
            pack.code = data[index+3];
            pack.data = Buffer.alloc(size);
            return data.slice(index+4);
        }
        return false;
    };
    this.get = function() {
        return {
            code: pack.code,
            data: pack.data.toJSON()
        };
    };
    this.isNew = function() {
        return newPack;
    };
    this.isFilled = function() {
        if (pack.data) {
            return intermediateSize === 0;
        } else {
            return false;
        }
    };
};


var packageFill = function(pack, data) {
    if (pack.isNew()) {
        data = pack.meta(data);
    }
    if (data) {
        var ofs = pack.put(data);
        if (ofs > 0) {
            return data.slice(ofs);
        }
    }
    return false;
};

module.exports = function(socket) {
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
                        socket.handshake.SerialPort = new SerialPort(
                            socket.handshake.board.comport,
                            { autoOpen: false, baudRate: socket.handshake.board.baudRate }
                        );
                        socket.handshake.SerialPort.open(function(err) {
                            if (err) {
                                socket.emit("put console", "Failed connect to " + socket.handshake.board.comport);
                            } else {
                                var pack = new ComPackage();
                                socket.handshake.SerialPort.on("data", function(data) {
                                    console.log(["From serial", data]);
                                    while(data = packageFill(pack, data)) {
                                        console.log([1, pack.get()]);
                                        socket.emit("board", "data", pack.get());
                                        pack = new ComPackage();
                                    }
                                    if (pack.isFilled()) {
                                        console.log([2, pack.get()]);
                                        socket.emit("board", "data", pack.get());
                                        pack = new ComPackage();
                                    }
                                });
                            }
                        });
                    } else {
                        log.error(err.message);
                    }
                });
                break;
            case "serialData":
                if (socket.handshake.SerialPort && socket.handshake.SerialPort.isOpen()) {
                    var bufData = Buffer.from(data.data);
                    var buf = Buffer.alloc(bufData.length + 5); // 0xAA 0x55 <len 2 byte> <code 1 byte> <data> \r \n
                    buf[0] = 0xAA;
                    buf[1] = 0x55;
                    buf.writeUInt16BE(bufData.length, 2);
                    buf[4] = data.code;
                    bufData.copy(buf, 5);
                    //buf[bufData.length+5] = 0x0D;
                    //buf[bufData.length+6] = 0x0A;
                    console.log(["Send buffer",buf]);
                    socket.handshake.SerialPort.write(buf);
                }
                break;
        }
    });

};