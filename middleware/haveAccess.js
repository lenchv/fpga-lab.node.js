var HttpError = require("../lib/error").HttpError;

module.exports = function (right) {
    return function (req, res, next) {
        if (!req.user || req.user.get('right') !== right) {
            return next(new HttpError(403));
        }
        next();
    };
};