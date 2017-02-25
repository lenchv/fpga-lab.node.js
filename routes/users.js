var User = require("../model/user").User,
    HttpError = require("../lib/error").HttpError,
    ObjectID = require('mongodb').ObjectID,
    checkAuth = require('../middleware/checkAuth');
module.exports = function(app) {
  app.get('/users', checkAuth, function(req, res, next) {
    User.find([], function(err, users) {
      if (err) return next(err);
      res.json(users);
    });
  });

  app.get('/users/:id', checkAuth, function(req, res, next) {
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
      res.json(user);
    });
  });
};