var HttpError = require("../lib/error").HttpError;

module.exports = function(req, res, next) {
    if (!req.session.user_id) {
        return next(new HttpError(401, "Вы не авторизованы"));
    }

    next();
};