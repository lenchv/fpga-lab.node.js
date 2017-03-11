/**
 * Файловый менеджер
 */
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
                if (!FM.hasClass("file-manager__upload_hover")) {
                    FM.addClass("file-manager__upload_hover");
                }
            },
            dragLeaveHandler: function(event) {
                event = event || window.event;
                (event.preventDefault ? event.preventDefault() : event.returnValue = false);
                event.stopPropagation();
                FM.removeClass("file-manager__upload_hover");
            },
            dropHandler: function(event) {
                event = (event.originalEvent ? event.originalEvent : window.event);
                (event.preventDefault ? event.preventDefault() : event.returnValue = false);
                event.stopPropagation();
                FM.removeClass("file-manager__upload_hover");
                try {
                    _this.fileUpload(event.dataTransfer.files[0]);
                } catch(e) {
                    window.AlertNotice.error(e.message);
                }
            },
            inputChangeHandler: function() {
                try {
                    _this.fileUpload(this.files[0]);
                } catch(e) {
                    window.AlertNotice.error(e.message);
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
                                window.AlertNotice.error(result.error || result.message);
                            }
                        }
                        item.addClass(className);
                        setTimeout(function() {
                            item.removeClass(className);
                            itemProgress.remove();
                            if (result.success) {
                                item.append("<div class='file-manager__file-progress color-200'></div>");
                            } else {
                                item.remove();
                            }
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
                    newName = prompt("Введите новое имя [" + item.data('name') + "]");
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