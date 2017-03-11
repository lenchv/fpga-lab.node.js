var User = require("../../model/user").User,
    UserSpace = require("../../model/userSpace").UserSpace,
    Board = require("../../model/board").Board,
    HttpError = require("../../lib/error").HttpError,
    ObjectID = require('mongodb').ObjectID;
module.exports = function(app) {
    // список
    app.get('/admin/board', function(req, res, next) {
        Board.find([], function(err, board) {
            if (err) return next(err);
            if (req.xhr) {
                res.json(board);
            } else {
                req.menu['board'].select = true;
                res.render("admin/board", { menu: req.menu, boards: board });
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
            active: req.body.active
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
        Board.findById(id, function(err, board) {
            if (err) return next(err);
            if (!board) {
                return next(new HttpError(404, "Board not found"));
            }
            res.json({ data: board });
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