var HttpError = require("../lib/error").HttpError;
/**
 * Проверяет доступ пользователя
 * @param right
 * @returns {Function}
 */
module.exports = function (right) {
    return function (req, res, next) {
        if (!req.user) {
            return next(new HttpError(403));
        }
        if (right instanceof Array) {
            if (right.indexOf(req.user.get('right')) === -1) {
                return next(new HttpError(403));
            }
        } else if (req.user.get('right') !== right) {
            return next(new HttpError(403));
        }
        next();
    };
};