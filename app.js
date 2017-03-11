var express = require('express'),
    path = require('path'),
    http = require('http'),
    config = require('./config'),
    log = require("./lib/log")(module),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    expressSession = require('express-session'),
    HttpError = require("./lib/error").HttpError,
    errorHandler = require("errorhandler"),
    sessionStore = require("./lib/sessionStore");

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
    rolling: config.get("session:rolling"),
    store: sessionStore
}));

app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));

app.use(express.static(path.join(__dirname, 'public')));
// users
require('./routes/auth')(app);
require('./routes/admin')(app);
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
    if (err.status === 401) {
        res.render("index");
    } else if (err instanceof HttpError) {
        res.sendHttpError(err)
    } else{
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

var io = require("./socket/")(server);
app.set('io', io); // Делаем объект сокета глобальным
/**
 * Video stream
 */
require('./lib/video-stream')(app.get('io'));

module.exports = app;
