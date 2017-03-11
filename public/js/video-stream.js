/**
 * Обработчик видеотрансляции
 */
(function(window){
    if (window.VideoStream)
        return;
    window.VideoStream = function(selector) {
        var $video = $(selector),
            $img = $video.find(".video__img"),
            $playBtn = $video.find(".video__play-btn"),
            _this = null,
            _event = [];

        return {
            init: function() {
                _this = this;
                $playBtn.on("click", _this.playHandler);
                return _this;
            },
            playHandler: function() {
                $video.toggleClass("video_play");
                _this.emit("video-play", $video.hasClass("video_play"));
            },
            setFrame: function(data) {
                $img.attr('src', data);
                return _this;
            },
            on: function(event, callback) {
                if (typeof callback !== 'function') {
                    return _this;
                }
                if (!_event.hasOwnProperty(event)) {
                    _event[event] = [];
                }
                _event[event].push(callback);
                return _this;
            }, // регистратор событий
            emit: function(event, data) {
                if (_event.hasOwnProperty(event)) {
                    $.each(_event[event], function(key, cb) {
                        cb(data);
                    });
                }
                return _this;
            } // исполнитель событий
        };
    };
})(window);