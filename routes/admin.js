var HttpError = require("../lib/error").HttpError,
    checkAuth = require('../middleware/checkAuth'),
    haveAccess = require('../middleware/haveAccess');
module.exports = function(app) {
  app.use("/admin", checkAuth, haveAccess('A'), function(req, res, next) {
    req.menu = {
        "user" : {name: "Пользователи", link: "/admin/users", select: false},
        "board": {name: "Плата", link: "/admin/board", select: false}
    };
    next();
  });

  app.get("/admin", function(req, res, next) {
    res.render("admin/index", { menu: req.menu });
  });

  require("./admin/users")(app);
  require("./admin/board")(app);
};