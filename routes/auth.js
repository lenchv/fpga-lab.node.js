var User = require("../model/user").User,
    AuthError = require("../model/user").AuthError,
    HttpError = require("../lib/error").HttpError;
module.exports = function (app) {
    var successLoginCallback = function(req, res, next) {
        return function(err, user) {
            if(err) {
                if (err instanceof AuthError) {
                    return next(new HttpError(403, err.message));
                } else {
                    return next(err);
                }
            }
            req.session.user_id = user._id;
            res.json({success: true});
        }
    };

    app.post("/auth/login", function(req, res, next) {
        var email = req.body.email,
            password = req.body.password;
        User.auth(email, password, successLoginCallback(req,res, next));
    });

    app.post("/auth/logout", function(req, res, next) {
        req.session.destroy();
        if (req.xhr) {
            res.json({url: "/"});
        } else {
            res.redirect('/');
        }
    });

    app.post("/auth/register", function(req, res, next) {
        var userData = {
            email: req.body.email,
            name: req.body.name,
            group: req.body.group,
            password: req.body.password,
            confirm_password: req.body.confirm_password
        };
        User.register(userData, successLoginCallback(req,res, next));


        /*
        User.find({email: userData.email}, function(err, user) {
            if (err) return next(err);
            if (user.length > 0) {
                return next(new HttpError(403, {errors: {email: "Пользователь с таким email уже существует"}}));
            } else {
                var newUser = new User(req.body);
                var error = newUser.validateSync();
                if (error) {
                    var arError = {errors: {}};
                    for (var key in error.errors) {
                        arError.errors[key] = error.errors[key].message;
                    }
                    return next(new HttpError(403, arError));
                }
                newUser.save(function (err, user) {
                    if (err) return next(err);
                    res.json({success: true});
                });
            }
        });
        */
    });
};