var crypto = require('crypto'),
    mongoose = require('../lib/mongoose'),
    Schema = mongoose.Schema,
    async = require("async"),
    util = require("util"),
    UserSpace = require("./userSpace").UserSpace,
    ObjectID = require('mongodb').ObjectID;

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

schema.virtual('createdFormat').get(function() {
    var pad = "00",
        date = "",
        d = "" + this.created.getDate(),
        m = "" + (this.created.getMonth() + 1),
        Y = "" + this.created.getFullYear(),
        h = "" + this.created.getHours(),
        i = "" + this.created.getMinutes();
    date += pad.substring(0, pad.length - d.length) + d;
    date += "." + pad.substring(0, pad.length - m.length) + m;
    date += "." + Y;

    date += " " + h + ":" + i;
    return date;
});
// фиктивное поле для отмены проверки пароля
schema.virtual('checkpassword')
    .set(function(v) {
        this._checkpassword = !!v;
    })
    .get(function() {
        return this._checkpassword;
    });

// валидация пароля по пути хешированного пароля
schema.path('hashedPassword').validate(function(v) {
    if (this._checkpassword === false) {
        return;
    }
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
                userData.checkpassword = true;
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

// обновление данных пользователя
schema.statics.updateData = function(userId, data, callback) {
    var User = this;
    async.waterfall([
        function(callback) {
            try {
                var id = new ObjectID(userId);
                return callback(null, id);
            } catch (e) {
                return callback(404);
            }
        },
        function(id, callback) {
            User.findById(id, callback);
        },
        function(user, callback) {
            user.name = data.name;
            user.group = data.group;
            user.right = data.right;

            if (data.email) {
                user.email = data.email;
            }
            if (data.password && data.confirm_password) {
                user._checkpassword = true;
                user.password = data.password;
                user.confirm_password = data.confirm_password;
            } else {
                user._checkpassword = false;
            }
            user.save(callback);
            //User.findByIdAndUpdate(id, { $set: user}, callback);
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