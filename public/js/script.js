$(function () {
    var userConsole = window.Terminal("#console").init(), // консоль пользователя
        videoPlayer = window.VideoStream("#video-player").init(),
        fileManager = window.FileManager("#file-manager", "#file_input", "#file-space").init(),
        socket = io.connect('', {
            reconnect: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax : 5000,
            reconnectionAttempts: Infinity
        });
    window.ViewState().init($);
    socket.on('connect', function() {
        userConsole.put("<span class='console__text_success'>Соединение с сервером установлено</span>");
    });
    socket.on('disconnect', function() {
        userConsole.put("<span class='console__text_error'>Соединение с сервером потеряно</span>");
    });

    userConsole.on("put", function(e) {
        socket.emit("put console", e.data);
    });
    userConsole.on("mousemove", function(e) {
        socket.emit("mousemove", e);
    });
    socket.on("com port", function(data) {
        userConsole.put(data.data);
    });
    socket.on("message", function(type, data) {
        if (type === 'logout') {
            location.href = "/";
        } else {
            userConsole.put("<span class='console__text_error'>"+error+"</span>");
        }
    });
    // Прием кадра с видеотрансляции и запись его в img видеоплеера
    socket.on("video-stream", function(data) {
        videoPlayer.setFrame(data);
    });
    // Обработка нажатия на кнопку play или pause
    videoPlayer.on("video-play", function(play) {
        socket.emit("video-play", play);
    });
});


