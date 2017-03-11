var config = require("../config"),
    HttpError = require("../lib/error").HttpError,
    fs = require('fs'),
    path = require('path'),
    UserSpace = require("../model/userSpace").UserSpace,
    getFolderSize = require('get-folder-size'),
    checkAuth = require('../middleware/checkAuth'),
    haveAccess = require('../middleware/haveAccess'),
    urldecode = require('urldecode');

module.exports = function(app) {
    var setUserSpace = function(req, res, next) {
        UserSpace.findOne({user: req.user._id}, function(err, space) {
            if (err) return next(err);
            if (!space)
                return next(new HttpError(500, "Директория пользователя не найдена"));
            space.fullPath = __dirname + path.sep+".." + space.get('folder');
            req.userSpace = space;
            next();
        });
    };
    app.use("/files", checkAuth, haveAccess(["S", "A"]), setUserSpace);
    /**
     * Заугрзука файлов
     */
    app.post("/files/upload", function(req, res, next) {
        // формируем имя файла, и путь к директории пользователя
        var fileName = req.userSpace.fullPath+urldecode(req.get("X-FILE-NAME"));
        // если файл существует, то ошибка
        if (fs.existsSync(fileName)) {
            res.status(403)
                .json({error: "Файл с таким именем уже существует", success: false});
        } else {
            var length = parseInt(req.get('content-length'));
            // определяем размер директории пользователя
            getFolderSize(req.userSpace.fullPath, function(err, size) {
                if (err) return next(err);
                if (length > config.get("fileManager:maxFileSize")) {
                    res.status(403)
                     .json({error: "Файл не должен превышать 5 Мб", success: false});
                } else if ((size + length) > req.userSpace.spacesize) {
                    res.status(403)
                        .json({error: "Дисковое пространство заполнено, удалите не используемые файлы", success: false});
                } else {
                    var fileStream = fs.createWriteStream(fileName);
                    req.pipe(fileStream);
                    res.json({success: true, name: urldecode(req.get("X-FILE-NAME"))});
                }
            });
        }
    });
    /**
     * Получает список файлов
     */
    app.get("/files", function(req, res, next) {
        fs.readdir(req.userSpace.fullPath,function(err, filesName){
            if (err) return next(new HttpError(500, err));

            res.json({"files": filesName});
        });
    });
    /**
     * Возвращает размер дискового пространства
     */
    app.get("/files/spacesize", function(req, res, next) {
        getFolderSize(req.userSpace.fullPath, function(err, size) {
            if (err) return next(new HttpError(500, err));
            res.send({"size": size, "total": req.userSpace.spacesize, "maxfilesize": config.get("fileManager:maxFileSize")});
        });
    });
    /**
     * Удаляет файл
     */
    app.post("/files/delete/:fileName", function(req, res, next) {
        fs.unlink(req.userSpace.fullPath + req.params.fileName, function(err) {
            res.json({"success": !err, error: err});
        });
    });
    /**
     * Переименовывает файл
     */
    app.post("/files/rename/:oldName/:newName", function(req, res, next) {
        fs.rename(
            req.userSpace.fullPath + req.params.oldName,
            req.userSpace.fullPath + req.params.newName,
            function(err) {
                res.json({"success": !err, error: err});
            }
        );
    });
};