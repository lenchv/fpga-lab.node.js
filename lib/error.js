var path = require('path'),
    util = require('util'),
    http = require('http');

function HttpError(status, message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, HttpError);

    this.status = status;
    this.message = message || http.STATUS_CODES[status] || "Error";
}

util.inherits(HttpError, Error);

HttpError.prototype.name = 'HttpError';

module.exports.HttpError = HttpError;