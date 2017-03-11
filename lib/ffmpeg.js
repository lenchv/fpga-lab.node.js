var proc = require('child_process'),
    config = require("../config"),
    log = require('../lib/log')(module);
/**
 * Запускает ffmpeg процесс с видеопотоком
 * @param device - устройство видеокамеры
 * @param secret - секретный ключ, для идентификации видепотока
 * @returns {*}
 */
function startFfmpeg(device, secret) {
    var port = config.get("video:server").port;
    log.info("Video stream http://127.0.0.1:" + port + "/"+secret+"/ start");
    var ffmpeg = proc.execFile("ffmpeg", [
            "-f",
            "dshow",
            "-i",
            "video=\""+device+"\"",
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
            "http://127.0.0.1:"+port+"/"+secret+"/640/480/image-%3d.jpg"
        ],
        {
            cwd: __dirname + "/../bin/ffmpeg/",
            shell: "cmd.exe"
        }
    );
    ffmpeg.on('exit', function() {
        log.info("ffmpeg http://127.0.0.1:" + port + "/"+secret+"/ exit");
        startFfmpeg(device, secret);
    });
    return ffmpeg;
}
module.exports = startFfmpeg;