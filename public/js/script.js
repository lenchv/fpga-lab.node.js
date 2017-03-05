$(function () {
    var userConsole = window.Terminal("#console").init(), // консоль пользователя
        videoPlayer = window.VideoStream("#video-player").init(),
        fileManager = window.FileManager("#file-manager", "#file_input", "#file-space").init(),
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
    // Прием кадра с видеотрансляции и запись его в img видеоплеера
    socket.on("video-stream", function(data) {
        videoPlayer.setFrame(data);
    });
    // Обработка нажатия на кнопку play или pause
    videoPlayer.on("video-play", function(play) {
        socket.emit("video-play", play);
    });
});
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
/**
 * Вывод ошибок
 */
(function(window) {
    if(window.ErrorAlert)
        return;
    window.ErrorAlert = (function() {
        var alert = "<div class='alert alert-danger alert-dismissable alert-popup'>"+
                "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>"+
                "<div class='alert-popup__content'>%content%</div>"+
            "</div>",
            bottom = 20;
        return {
            show: function(error) {
                var err = $(alert.replace("%content%", error));
                err.find(".close").on("click", function() {
                    err.alert('close');
                });
                //"margin-bottom": (bottom+err.outerHeight())+"px"
                err.css({bottom: bottom+"px"});
                $('body').append(err);
                bottom += err.outerHeight();
                setTimeout(function() {
                    err.addClass("alert-popup_show");
                    //err.css({"margin-bottom": 0});
                }, 50);
                setTimeout(function() {
                    err.alert('close');
                }, 5000);
                err.on('close.bs.alert', function () {
                    var height = err.outerHeight();
                    bottom -= height;
                    $(".alert-popup_show").each(function(i, item) {
                        var $item = $(item),
                            bot = parseInt($item.css("bottom"));
                        $item.css({"bottom": bot - height + "px"});
                    });
                    if (bottom < 20) {
                        bottom = 20;
                    }
                });
            }
        };
    })();
})(window);

(function(window) {
    if(window.FileManager)
        return;
    window.FileManager = function(selector, fileInput, progressSize) {
        var FM = $(selector),
            input = $(fileInput),
            $container = FM.find(".file-manager__container"),
            $progressSize = $(progressSize),
            _this = null,
            MAX_FILE_SIZE = 5*1024*1024,
            tplFileItem = "<li class='file-manager__item color-100' data-name='%name%'>" +
                "<div class='file-manager__file'>" +
                    "<i class='fa fa-file'></i>" +
                    "<span class='file-manager__item-name'>" +
                        "<span class='file-manager__item-name-wrapper' title='%name%'>%short-name%</span>" +
                    "</span>" +
                    "<div class='file-manager__controls pull-right'>" +
                        "<span class='file-manager__delete'><i class='fa fa-close'></i></span>" +
                        "<span class='file-manager__rename'><i class='fa fa-pencil'></i></span>" +
                        "<span class='file-manager__play'><i class='fa fa-play'></i></span>" +
                    "</div>" +
                "</div>" +
                "<div class='file-manager__file-progress color-200'></div>"+
            "</li>";
        return {
            init: function() {
                _this = this;
                // drag and drop add
                FM.on("dragover", _this.dragOverHandler);
                FM.on("dragleave", _this.dragLeaveHandler);
                FM.on("drop", _this.dropHandler);
                // local add
                input.on("change", _this.inputChangeHandler);
                // fill file container
                _this.fileFill();
                // eval total disk size
                _this.evalSize();
                return _this;
            },
            evalSize: function() {
                $.get("/files/spacesize", function(data) {
                    MAX_FILE_SIZE = data.maxfilesize;
                    $progressSize.css({width: 100 * data.size / data.total + "%"});
                    var mb = 1024 * 1024;
                    $progressSize.next().text((data.size/mb).toFixed(2) + " / " + (data.total/mb).toFixed(2) + " Мб");
                });
            },
            dragOverHandler: function(event) {
                event = event || window.event;
                (event.preventDefault ? event.preventDefault() : event.returnValue = false);
                event.stopPropagation();
                console.log("over");
            },
            dragLeaveHandler: function(event) {
                event = event || window.event;
                (event.preventDefault ? event.preventDefault() : event.returnValue = false);
                event.stopPropagation();
                console.log("leave");
            },
            dropHandler: function(event) {
                event = (event.originalEvent ? event.originalEvent : window.event);
                (event.preventDefault ? event.preventDefault() : event.returnValue = false);
                event.stopPropagation();
                try {
                    _this.fileUpload(event.dataTransfer.files[0]);
                } catch(e) {
                    window.ErrorAlert.show(e.message);
                }
            },
            inputChangeHandler: function() {
                try {
                    _this.fileUpload(this.files[0]);
                } catch(e) {
                    window.ErrorAlert.show(e.message);
                }
            },
            fileUpload: function(file) {
                if (!(file instanceof File)) {
                    throw new TypeError("Wrong file");
                }
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error("Файл не должен превышать 5 Мб");
                }
                var xhr = new XMLHttpRequest();
                var item = _this.fileRender({name: file.name}),
                    itemProgress = item.find(".file-manager__file-progress");
                xhr.onload = xhr.onerror = function(data) {
                    try {
                        var result = JSON.parse(this.responseText),
                            className = "error";
                        if (this.status == 200) {
                            className = "success";
                            _this.evalSize();
                        } else {
                            if (!result.success) {
                                window.ErrorAlert.show(result.error);
                            }
                        }
                        item.addClass(className);
                        setTimeout(function() {
                            item.removeClass(className);
                            itemProgress.remove();
                            item.append("<div class='file-manager__file-progress color-200'></div>");
                        }, 1000);
                    } catch(e) {}

                };
                // обработчик для закачки
                xhr.upload.onprogress = function(event) {
                    itemProgress.css({width: 100 * event.loaded / event.total + "%"});
                };

                xhr.open("POST", "files/upload", true);
                xhr.setRequestHeader('X-FILE-NAME', encodeURIComponent(file.name));
                xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
                xhr.send(file);
            },
            fileFill: function() {
                $.get("/files", function(data) {
                    if (data.files) {
                        data.files.forEach(function(file) {
                            _this.fileRender({name: file});
                        });
                    }
                });
            },
            fileRender: function(data) {
                var tpl = tplFileItem,
                    fileName = data.name;
                if(data.name.length > 40) {
                    fileName = data.name.substr(0, 20);
                    fileName += "...";
                    fileName += data.name.substr(-17);
                }
                tpl = tpl.replace(/%short-name%/g, fileName);
                tpl = tpl.replace(/%name%/g, data.name);
                var fileItem = $(tpl);
                fileItem.find(".file-manager__delete").on('click', _this.deleteHandler);
                fileItem.find(".file-manager__rename").on('click', _this.renameHandler);
                fileItem.find(".file-manager__play").on('click', _this.playHandler);
                $container.append(fileItem);
                return fileItem;
            },
            deleteHandler: function() {
                var item = $(this).closest(".file-manager__item");
                $.post("/files/delete/"+encodeURIComponent(item.data('name')), function(data) {
                    if (data.success === true) {
                        item.remove();
                        _this.evalSize();
                    }
                });
            },
            renameHandler: function() {
                var item = $(this).closest(".file-manager__item"),
                    newName = prompt("Введите новое имя");
                if (newName) {
                    $.post("/files/rename/"+encodeURIComponent(item.data('name'))+"/"+encodeURIComponent(newName), function(data) {
                        if (data.success === true) {
                            item.data("name", newName);
                            var shortName = newName;
                            if(shortName.length > 40) {
                                shortName = newName.substr(0, 20);
                                shortName += "...";
                                shortName += newName.substr(-17);
                            }
                            item.find(".file-manager__item-name-wrapper").attr('title', newName).text(shortName);
                        }
                    });
                }
            },
            playHandler: function() {
                console.log($(this).closest(".file-manager__item").data("name"));
                // todo play
            }
        };
    };
})(window);