/**
 * Запускает сервер для приема видеопотока в виде изображений
 * и передает в websocket с событием "video-stream"
 *
 * Видеопоток запускается для всех настроенных видеокамер
 * так как видеопоток перезапускаются автоматически, то
 * настройка плат на совести администратора
 *
 * io - объект socket.io
 */
var http = require('http'),
    log = require('../lib/log')(module),
    async = require('async'),
    startFfmpeg = require("../lib/ffmpeg"),
    Board = require('../model/board').Board,
    port = require('../config').get("video:server").port;

module.exports = function(io) {
    var ffmpeg = {},
        secrets = [];
    Board.find({active: true}, function(err, board) {
        if (err) {
            log.error(err);
        } else if (board instanceof Array) {
            board.forEach(function(b) {
                secrets.push(b.webcamsecret);
                ffmpeg[b.webcamsecret] = startFfmpeg(b.webcam, b.webcamsecret);
            });
        }
    });
    http.createServer(function(request, response) {
        var params = request.url.substr(1).split('/'),
            secret = params[0];
        if( secrets.indexOf(secret) >= 0 ) {

            width = (params[1] || 320)|0;
            height = (params[2] || 240)|0;
            var data = [], dataLen = 0;
            request.on('data', function (chunk) {
                data.push(chunk);
                dataLen += chunk.length;
            });

            request.on('end', function (chunk) {
                var buf = Buffer.alloc(dataLen);
                for (var i = 0, len = data.length, pos = 0; i < len; i++) {
                    data[i].copy(buf, pos);
                    pos += data[i].length;
                }

                io.sockets.volatile.to(secret).emit("video-stream", 'data:image/jpeg;base64,' + buf.toString('base64'));
                buf = undefined;
            });

        } else {
            log.error(
                'Failed Stream Connection: '+ request.socket.remoteAddress +
                request.socket.remotePort + ' - wrong secret.'
            );
            response.end();
        }

    }).listen(port).on('close', function() {
        // завершаем видеопотоки
        async.each(ffmpeg, function(f, callback) {
            if (f) f.kill("end");
            callback();
        }, function(err) {});
    });
};