var User = require("../../model/user").User,
    UserSpace = require("../../model/userSpace").UserSpace,
    HttpError = require("../../lib/error").HttpError,
    ObjectID = require('mongodb').ObjectID;
module.exports = function(app) {
    app.get('/admin/users', function(req, res, next) {
        User.find([], function(err, users) {
            if (err) return next(err);
            if (req.xhr) {
                res.json(users);
            } else {
                req.menu['user'].select = true;
                res.render("admin/users", { menu: req.menu, users: users });
            }
        });
    });

    app.get('/admin/users/:id', function(req, res, next) {
        try {
            var id = new ObjectID(req.params.id);
        } catch (e) {
            return next(404);
        }
        User.findById(id, function(err, user) {
            if (err) return next(err);
            if (!user) {
                return next(new HttpError(404, "User not found"));
            }
            UserSpace.findOne({user: user._id}, function(err, userSpace) {
                if (err) return next(err);
                if (userSpace) {
                    res.json({
                        right: User.schema.path('right').enumValues,
                        user: user,
                        userSpace: userSpace
                    });
                } else {
                    return next(new HttpError(500, "User space not found"));
                }
            });
        });
    });

    app.post('/admin/users/:id', function(req, res, next) {
        User.updateData(req.params.id, req.body, function(err, updatedUser) {
            if(err) return next(new HttpError(403, err.message));
            UserSpace.findOne({user: updatedUser._id}, function(err, userSpace) {
                if (err) return next(new HttpError(403, err.message));
                if (userSpace) {
                    userSpace.spacesize = req.body.spacesize;
                    userSpace.save(function(err) {
                        if(err) return next(new HttpError(403, err.message));
                        updatedUser.created = updatedUser.createdFormat;
                        res.json({
                            success: true,
                            user: updatedUser,
                            userSpace: userSpace
                        });
                    });
                } else {
                    return next(new HttpError(500, "User space not found"));
                }
            });
        });
    });

    app.post('/admin/users/delete/:id', function(req, res, next) {
        try {
            var id = new ObjectID(req.params.id);
        } catch (e) {
            return next(404);
        }
        User.remove({_id: id}, function(err) {
            if (err) return next(new HttpError(403, err.message));
            UserSpace.safeRemove({user: id}, function(err, space) {
                if(err) return next(new HttpError(403, err.message));
                res.json({success: true});
            });
        });
    });
};