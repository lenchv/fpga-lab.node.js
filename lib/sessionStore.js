var expressSession = require('express-session'),
    mongoose = require("./mongoose"),
    MongoStore = require('connect-mongo')(expressSession);

var sessionStore = new MongoStore({mongooseConnection:  mongoose.connection});

module.exports = sessionStore;