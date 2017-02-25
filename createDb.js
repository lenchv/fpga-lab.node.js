var mongoose = require("./lib/mongoose"),
    async = require('async');

async.series([
    open,
    dropDatabase,
    createUser,
    close
], function (err, results) {
    console.log(err);
    console.log(results);
});

function open(callback) {
    mongoose.connection.on('open', callback);
}

function dropDatabase(callback) {
    var db = mongoose.connection.db;
    db.dropDatabase(callback);
}

function createUser(callback) {
    var User = require('./model/user').User;

    var users = [
        {name: 'Вася', email: "lenchvov@rarus.kiev.ua", password: 'qwerty1234'},
        {name: 'Петя', email: "lenv@rarus.kiev.ua",password: 'qwerty1234'},
        {name: 'Админ', email: "admin@host.com", password: 'qwerty1234'}
    ];
    async.each(users, function (userData, callback) {
        var user = new User(userData);
        user.save(callback);
    }, callback);
}

function close(callback) {
    mongoose.disconnect(callback);
}


