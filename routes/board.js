var Board = require("../model/board").Board,
    HttpError = require("../lib/error").HttpError,
    ObjectId = require('mongodb').ObjectID,
    checkAuth = require('../middleware/checkAuth'),
    haveAccess = require('../middleware/haveAccess');

module.exports = function(app) {
    app.use("/board", checkAuth, haveAccess(['A', 'S']));
    /**
     * Get list
     */
    app.get("/board", function(req, res, next) {
        var userId = new ObjectId(req.session.user_id);
        Board.find({active: true}, function(err, boards) {
            if(err) return next(new HttpError(500, err.message));
            var arBoards = [];
            boards.forEach(function(b) {
                if (b.isExpired() && b.busy) {
                    app.get('io').sockets._events.chooseBoarByUser(b.user, null);
                    b.leave();
                }
                arBoards.push({
                    _id: b._id,
                    name: b.name,
                    select: userId.equals(b.user),
                    busy: b.busy
                });
            });
            res.json(arBoards);
        });
    });
    /**
     * Get by id
     */
    app.get("/board/:id", function(req, res, next) {
        try {
            var id = new ObjectId(req.params.id);
        } catch (e) {
            return next(new HttpError(500, "Incorrect id"));
        }
        Board.findById(id, function(err, board) {
            if(err) return next(new HttpError(500, err.message));
            if (board) {
                res.json(board);
            } else {
                return next(new HttpError(404, "Board not found"));
            }
        });
    });
    /**
     * Unset board to user
     */
    app.post("/board/leave", function(req, res, next) {
        Board.unset(req.session.user_id, function(err) {
            if (err) {
                res.json({success: false});
            } else {
                app.get('io').sockets._events.chooseboard(req.session.id, null);
                res.json({success: true});
            }
        });
    });
    /**
     * Set board to user
     */
    app.post("/board/:id", function(req, res, next) {
        try {
            var id = new ObjectId(req.params.id);
        } catch (e) {
            return next(new HttpError(500, "Incorrect id"));
        }
        Board.findById(id, function(err, board) {
            if(err) return next(new HttpError(500, err.message));
            if (board) {
                if (board.busy) {
                    return next(new HttpError(500, "Board is busy other"));
                } else {
                    Board.unset(req.session.user_id, function(err) {
                        if (err) return;
                        board.setUser(req.session.user_id, function(err) {
                            if (err) {
                                res.json({success: false});
                            } else {
                                // устанавливаем плату для сокет ио
                                app.get('io').sockets._events.chooseboard(req.session.id, board);
                                res.json({success: true});
                            }
                        });
                    });
                }
            } else {
                return next(new HttpError(404, "Board not found"));
            }
        });
    });
};