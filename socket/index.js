var log = require("../lib/log")(module),
    config = require("../config"),
    cookieParser = require('cookie-parser'),
    async = require('async'),
    cookie = require('cookie'),
    sessionStore = require('../lib/sessionStore'),
    HttpError = require('../lib/error').HttpError,
    User = require('../model/user').User,
    clients = {};

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
    var io = require('socket.io').listen(server);
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
                    return callback(new HttpError(401, "No session"));
                }

                socket.handshake.session = session;
                loadUser(session, callback);
            },
            function(user, callback) {
                if (!user) {
                    return callback(new HttpError(403, "Anonymous session may not connect"));
                }
                socket.handshake.user = user;
                callback(null);
            }
        ], function(err) {
            if (!err) {
                return next();
            }

            if (err instanceof HttpError) {
                return next(null, false);
            }

            next(err);
        });
    });
    io.use(function(socket, next) {
        if (!socket.handshake.user || ["A", "S"].indexOf(socket.handshake.user.get('right')) === -1) {
            return next(new HttpError(403));
        }
        next();
    });

    // обновление сессии
    io.sockets.on('sessionreload', function(sid) {
        if (clients[sid]) {
            var client = clients[sid];
            loadSession(sid, function(err, session) {
                if(err) {
                    client.send('error', 'server error');
                    client.disconnect();
                    return;
                }

                if (!session) {
                    client.send('logout', 'handshake unauthorized');
                    client.disconnect();
                    return;
                }
                client.handshake.session = session;
            });
        }
    });
    io.sockets.on('connection', function(socket) {
        socket.emit("com port", {data: "some data"});
        if (socket.handshake.session) {
            clients[socket.handshake.session.id] = socket;
        }
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
                y: mousemove.offsetY - data.offsetY,
            });
            mousemove = data;
        });

        socket.on('disconnect', function() {
            if(this.handshake.session) {
                delete clients[this.handshake.session.id];
            }

        });
    });
    return io;
};
