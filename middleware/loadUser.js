var User = require('../model/user').User;

module.exports = function(req, res, next) {
    req.user = res.locals.user = null;
    if (!req.session.user_id) return next();

    User.findById(req.session.user_id, function(err, user) {
        if (err) return next(err);

        req.user = res.locals.user = user;
        next();
    });
};