var crypto = require('crypto'),
    mongoose = require('../lib/mongoose'),
    Schema = mongoose.Schema,
    async = require("async"),
    util = require("util");
// Схема таблицы пользователей
var schema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        validate: {
            validator: function(v) {
                return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v);
            },
            message: 'Email {VALUE} не верный'
        }
    },
    name: {
        type: String
    },
    group: {
        type: String
    },
    right: {
        type: String,
        enum: [
            'A', // Admin
            'G', // Guest
            'S' // Student
        ],
        default: 'G'
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});
// шифрование пароля
schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};
// виртуальное поле пароля
schema.virtual('password')
    .set(function (password) {
        this._plainPassword = password;
        this.salt = Math.random()*Date.now() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () { return this._plainPassword; });
// вирутальное поле подтверждения пароля
schema.virtual('confirm_password')
    .set(function(value) {
        this._confirmPassword = value;
    })
    .get(function() { return this._confirmPassword });
// валидация пароля по пути хешированного пароля
schema.path('hashedPassword').validate(function(v) {
    if (this._plainPassword || this._confirmPassword) {
        if (!/^[a-zA-Z0-9\@\!\#\$\%\.\_\-]{6,}$/.test(this._plainPassword)) {
            this.invalidate('password', 'Пароль должен соответствовать шаблону [a-zA-Z0-9@!#$%\._-]{6,}');
        }
        if (this._plainPassword !== this._confirmPassword) {
            this.invalidate('confirm_password', 'Пароли должны совпадать');
        }
    } else {
        if (!this._plainPassword) {
            this.invalidate('password', 'Обязателен');
        }
    }
}, null);
// проверка пароля
schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};
// регистрация пользователя
schema.statics.register = function(userData, callback) {
    var User = this;

    async.waterfall([
        function(callback) {
            User.findOne({email: userData.email}, callback);
        },
        function(user, callback) {
            if (user) {
                return callback(new AuthError({errors: {email: "Пользователь с таким email уже существует"}}));
            } else {
                var newUser = new User(userData);
                var error = newUser.validateSync();
                if (error) {
                    var arError = {errors: {}};
                    for (var key in error.errors) {
                        arError.errors[key] = error.errors[key].message;
                    }
                    return callback(new AuthError(arError));
                }
            }
            console.log(newUser.salt);
            newUser.save(callback);
        }
    ], callback);
};

// авторизация пользователя
schema.statics.auth = function(email, password, callback) {
    var User = this;

    async.waterfall([
        function(callback) {
            User.findOne({email: email}, callback);
        },
        function(user, callback) {
            if (user) {
                console.log(user.salt);

                if (user.checkPassword(password)) {
                    return callback(null, user);
                } else {
                    return callback(new AuthError({errors: {password: "Не верно указан пароль"}}));
                }
            } else {
                return callback(new AuthError({errors: {email: "Пользователь с таким email не зарегистрирован"}}));
            }
        }
    ], callback);
};

module.exports.User = mongoose.model('User', schema);

function AuthError(message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);
    this.message = message;
}
util.inherits(AuthError, Error);
AuthError.prototype.name = 'AuthError';
module.exports.AuthError = AuthError;