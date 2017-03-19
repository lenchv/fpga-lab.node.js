var User = require("../../model/user").User,
    UserSpace = require("../../model/userSpace").UserSpace,
    Board = require("../../model/board").Board,
    HttpError = require("../../lib/error").HttpError,
    ObjectID = require('mongodb').ObjectID,
    extend = require('util')._extend;
module.exports = function(app) {
    // список
    app.get('/admin/board', function(req, res, next) {
        Board.find([])
            .populate('user')
            .exec(function(err, board) {
                if (err) return next(err);
                var b = [];
                if (board instanceof Array) {
                    board.forEach(function(item) {
                        var a = JSON.parse(JSON.stringify(item));
                        if (item.user) {
                            a.user = a.user.name + " (" + a.user.group + ")";
                        } else {
                            a = item;
                        }
                        b.push(a);
                    });
                }
                if (req.xhr) {
                    res.json(b);
                } else {
                    req.menu['board'].select = true;
                    res.render("admin/board", { menu: req.menu, boards: b });
                }
            });
    });
    // добавление (CREATE)
    app.post('/admin/board', function(req, res, next) {
        var board = new Board({
            name: req.body.name,
            comport: req.body.comport,
            baudRate: req.body.baudRate,
            webcam: req.body.webcam,
            webcamsecret: req.body.webcamsecret,
            active: req.body.active,
            firmwareport: req.body.firmwareport
        });
        board.save(function(err, board) {
            if (err) return next(new HttpError(500, err.message));
            res.json({
                data: board,
                success: true
            });
        });
    });
    // подробная информация (READ)
    app.get('/admin/board/:id', function(req, res, next) {
        try {
            var id = new ObjectID(req.params.id);
        } catch (e) {
            return next(404);
        }
        Board.findById(id)
            .populate('user')
            .exec(function(err, board) {
                if (err) return next(err);
                if (!board) {
                    return next(new HttpError(404, "Board not found"));
                }
                result = {data: JSON.parse(JSON.stringify(board))};
                if (result.data.user) {
                    result.data.user = result.data.user.name + " ("+result.data.user.group+")";
                }
                res.json(result);
            });
    });
    // изменение (UPDATE)
    app.post('/admin/board/:id', function(req, res, next) {
        try {
            var id = new ObjectID(req.params.id);
        } catch (e) {
            return next(404);
        }
        Board.findById(id, function(err, board) {
            if (err) return next(new HttpError(500, err.message));
            if (!board) {
                return next(new HttpError(404, "Board not found"));
            }
            board.name = req.body.name;
            board.comport = req.body.comport;
            board.baudRate = req.body.baudRate;
            board.webcam = req.body.webcam;
            board.webcamsecret = req.body.webcamsecret;
            board.active = req.body.active;
            board.firmwareport = req.body.firmwareport;
            if (req.body.busy !== "on") {
                board.busy = false;
                board.user = undefined;
                board.sessionTime = undefined;
            }
            board.save(function(err, board) {
                if (err) return next(new HttpError(500, err.message));
                res.json({
                    data: board,
                    success: true
                });
            });
        });
    });
    // удаление (DELETE)
    app.post('/admin/board/delete/:id', function(req, res, next) {
        try {
            var id = new ObjectID(req.params.id);
        } catch (e) {
            return next(404);
        }
        Board.remove({_id: id}, function(err) {
            if (err) return next(new HttpError(403, err.message));
            res.json({success: true});
        });
    });

};