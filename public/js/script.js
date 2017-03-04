$(function () {
    var userConsole = window.Terminal("#console").init(), // консоль пользователя
        video = document.getElementById('video-img'),
        videoPass = "video",
        socket = io.connect();

    $("[data-control='state']").on("click", function() {
        var state = $(this).data("state");
        if (state) {
            $("body").toggleClass(state);
        }
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

    socket.on("video-stream-"+videoPass, function(data) {
        video.src = data;
    });
});

