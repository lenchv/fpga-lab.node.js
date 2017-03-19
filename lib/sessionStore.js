var expressSession = require('express-session'),
    mongoose = require("./mongoose"),
    MongoStore = require('connect-mongo')(expressSession),
    config = require("../config");

var sessionStore = new MongoStore({
    mongooseConnection:  mongoose.connection,
    ttl: config.get("session:cookie").maxAge
});
module.exports = sessionStore;