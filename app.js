var express = require('express'),
    path = require('path'),
    http = require('http'),
    config = require('./config'),
    log = require("./lib/log")(module),
    mongoose = require("./lib/mongoose"),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    expressSession = require('express-session'),
    MongoStore = require('connect-mongo')(expressSession),
    HttpError = require("./lib/error").HttpError,
    errorHandler = require("errorhandler");

var app = express();
app.set('port', config.get('port'));
app.set('NODE_ENV', 'development');
// view engine setup
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') == 'development') {
    app.use(logger('dev'));
} else {
    app.use(logger('default'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
    secret: config.get("session:secret"),
    key: config.get("session:key"),
    cookie: config.get("session:cookie"),
    resave: config.get("session:resave"),
    saveUninitialized: config.get("session:saveUninitialized"),
    store: new MongoStore({mongooseConnection:  mongoose.connection})
}));

app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));

app.use(express.static(path.join(__dirname, 'public')));
// users
require('./routes/users')(app);
require('./routes/auth')(app);
require('./routes/files')(app);

app.get('/', function (req, res, next) {
    res.render("index");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
    if (typeof err == "number") {
        err = new HttpError(err);
    }

    if (err instanceof HttpError) {
        res.sendHttpError(err)
    } else {
        if (req.app.get('env') === 'development') {
            errorHandler()(err, req,res, next);
        } else {
            log.error(err);
            err = new HttpError(500);
            res.sendHttpError(err);
        }

    }
});
var server = http.createServer(app).listen(config.get('port'), function () {
    log.info("Express server listening on port " + config.get('port'));
});

var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket) {
    socket.emit("com port", {data: "some data"});
    socket.on("put console", function(data) {
        console.log(data);
    });
    socket.on("mousemove", function(data) {
        console.log(data);
    });
});
app.set('io', io); // Делаем объект сокета глобальным

/**
 * Video stream
 */
require('./lib/video-stream')(app.get('io'), config.get("video:server"));

module.exports = app;
