/**
 * Запускает сервер для приема видеопотока в виде изображений
 * и передает в websocket с событием "video-stream"
 *
 * io - объект socket.io
 * {
 *  device - видеокамера
 *  password - пароль для передачи видеопотока
 *  port - порт на который будет слаться видеопоток
 * }
 */
var proc = require('child_process'),
    http = require('http'),
    log = require('../lib/log')(module);

module.exports = function(io, options) {
    log.info("Video stream start");
    var ffmpeg = proc.execFile("ffmpeg", [
            "-f",
            "dshow",
            "-i",
            "video=\""+options.device+"\"",
            "-f",
            "image2",
            "-b:v",
            "500k",
            "-r",
            "21",
            "-q:v",
            "10",
            "-s",
            "640x480",
            "http://127.0.0.1:"+options.port+"/"+options.password+"/640/480/image-%3d.jpg"
        ],
        {
            cwd: __dirname + "/../bin/ffmpeg/",
            shell: "cmd.exe"
        },
        function(err, stdout, stderr) {
            // todo сделать рестарт ffmpeg если он падает
        }
    );
    /**
     * Заносим клиента в комнату или нет, для передачи видеоданных
     */
    io.sockets.on("connection", function(socket) {
        socket.on('video-play', function(play) {
            if (play === true) {
                socket.join(options.password);
            } else {
                socket.leave(options.password);
            }
        });
    });
    http.createServer(function(request, response) {
        var params = request.url.substr(1).split('/');
        if( params[0] == options.password ) {

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

                io.sockets.volatile.to(options.password).emit("video-stream", 'data:image/jpeg;base64,' + buf.toString('base64'));
                buf = undefined;
            });

        }else {
            log.error(
                'Failed Stream Connection: '+ request.socket.remoteAddress +
                request.socket.remotePort + ' - wrong secret.'
            );
            response.end();
        }

    }).listen(options.port).on('close', function() {
        ffmpeg.kill("end");
    });
};