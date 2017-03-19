var log = require("../lib/log")(module),
    config = require("../config"),
    cookieParser = require('cookie-parser'),
    async = require('async'),
    cookie = require('cookie'),
    sessionStore = require('../lib/sessionStore'),
    HttpError = require('../lib/error').HttpError,
    User = require('../model/user').User,
    Board = require('../model/board').Board,
    socketBoard = require('./board'),
    clients = {},
    io = null;

function loadSession(sid, callback) {
    sessionStore.load(sid, function(err, session) {
        if (arguments.length === 0) {
            return callback(null, null);
        } else {
            return callback(null, session);
        }
    });
}

function loadUser(session, callback) {
    if (!session.user_id) {
        return callback(null, null);
    }
    User.findById(session.user_id, function(err, user) {
        if (err) return callback(err);

        if(!user) {
            return callback(null, null);
        }
        callback(null, user);
    });
}

module.exports = function(server) {
    if (io !== null) {
        return io;
    }
    io = require('socket.io').listen(server);
    // Авторизация в socket.io
    io.use(function(socket, next) {
        async.waterfall([
            function(callback) {
                var handshakeData = socket.request;
                handshakeData.cookies = cookie.parse(handshakeData.headers.cookie || '');
                var sidCookie = handshakeData.cookies[config.get('session:key')];
                var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));

                loadSession(sid, callback);
            },
            function(session, callback) {
                if (!session) {
                    return callback(new HttpError(401, "Сессия не найдена"));
                }

                socket.handshake.session = session;
                loadUser(session, callback);
            },
            function(user, callback) {
                if (!user) {
                    return callback(new HttpError(403, "Необходимо авторизоваться"));
                }
                socket.handshake.user = user;
                callback(null);
            }
        ], function(err) {
            if (err) {
                return next(err);
            }
            next();
        });
    });

    io.use(function(socket, next) {
        if (!socket.handshake.user || ["A", "S"].indexOf(socket.handshake.user.get('right')) === -1) {
            return next(new HttpError(403, "В доступе отказано"));
        }
        next();
    });
    // выбор платы
    io.use(function(socket, next) {
        Board.findOne({user: socket.handshake.user._id}, function(err, board) {
            if (err) return next(new Error("Board not choosed"));
            if (board) {
                socket.handshake.board = board;
            }
            next();
        });
    });
    // обновление сессии
    io.sockets.on('sessionreload', function(sid) {
        if (clients[sid]) {
            var client = clients[sid];
            loadSession(sid, function(err, session) {
                if(err) {
                    client.emit("exception", err.message);
                    client.disconnect();
                    return;
                }

                if (!session) {
                    client.emit("exception", "Время сессии истекло");
                    client.disconnect();
                    return;
                }
                client.handshake.session = session;
            });
        }
    });
    var chooseBoardHandler = function(sid, board) {
        if (clients[sid]) {
            if (clients[sid].handshake.board) {
                clients[sid].leave(clients[sid].handshake.board.webcamsecret);
            }
            clients[sid].handshake.board = board;
        }
    };
    // событие выбора платы
    io.sockets.on("chooseboard", chooseBoardHandler);
    // выбор платы по Ид пользователя
    io.sockets.on("chooseBoarByUser", function(user_id, board) {
        async.forEachOf(clients, function(client, sessid, next) {
            if (client.handshake.user && client.handshake.user._id.equals(user_id)) {
                chooseBoardHandler(sessid, board);
                return next(new Error("return from each"));
            }
            next();
        }, function(err) {

        });
    });


    io.sockets.on('connection', function(socket) {
        // если плпта подключена, то обновляем время сессии
        if (socket.handshake.board) {
            socket.handshake.board.updateExpires();
        }
        // Проверка авторизации пользователя
        socket.use(function(package, next) {
            async.waterfall([
                function(callback) {
                    var handshakeData = socket.request;
                    handshakeData.cookies = cookie.parse(handshakeData.headers.cookie || '');
                    var sidCookie = handshakeData.cookies[config.get('session:key')];
                    var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));

                    loadSession(sid, callback);
                },
                function(session, callback) {
                    if (!session) {
                        return callback(new HttpError(401, "No session"));
                    }
                    if (session.user_id) {
                        callback();
                    } else {
                        callback(new Error("unauthorized"));
                    }
                },
                function (callback) {
                    if (socket.handshake.board) {
                        // обновляем время сессии пользователя
                        socket.handshake.board.updateExpires(callback);
                    } else {
                        callback();
                    }
                }
            ], function(err) {
                if (err) {
                    socket.disconnect();
                    return next(err);
                }
                next();
            });
        });
        if (socket.handshake.session) {
            clients[socket.handshake.session.id] = socket;
        }
        socketBoard(socket);
        /*
        socket.emit("com port", {data: "some data"});

        if (socket.handshake.user) {
            socket.emit("com port", {data: socket.handshake.user.get('name')});
        }

        socket.on("put console", function(data) {
            console.log(data);
        });
        var mousemove = {offsetX: 0, offsetY: 0};
        socket.on("mousemove", function(data) {
            console.log({
                x: mousemove.offsetX - data.offsetX,
                y: mousemove.offsetY - data.offsetY
            });
            mousemove = data;
        });
        */

        /**
         * Заносим клиента в комнату или нет, для передачи видеоданных
         */
        socket.on('video-play', function(play) {
            if (socket.handshake.board) {
                if (play === true) {
                    socket.join(socket.handshake.board.webcamsecret);
                } else {
                    socket.leave(socket.handshake.board.webcamsecret);
                }
            }
        });

        // если клиент отсоединяется, то убираем его из списка подключенных
        socket.on('disconnect', function() {
            if(this.handshake.session) {
                if (this.handshake.SerialPort && this.handshake.SerialPort.isOpen()) {
                    this.handshake.SerialPort.close();
                }
                /*if (this.handshake.board) {
                    this.handshake.board.leave(function(err) {});
                }*/
                delete clients[this.handshake.session.id];
            }

        });
    });
    return io;
};
