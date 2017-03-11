var HttpError = require("../lib/error").HttpError,
    checkAuth = require('../middleware/checkAuth'),
    haveAccess = require('../middleware/haveAccess');
module.exports = function(app) {
  app.use("/admin", checkAuth, haveAccess('A'), function(req, res, next) {
    req.menu = {
        "user" : {name: "Пользователи", link: "/admin/users", select: false},
        "board": {name: "Плата", link: "/admin/board", select: false},
        "item1": {name: "Item #1", link: "#1", select: false},
        "item2": {name: "Item #2", link: "#3", select: false},
        "item3": {name: "Item #3", link: "#3", select: false},
        "item4": {name: "Item #4", link: "#3", select: false},
        "item5": {name: "Item #5", link: "#3", select: false},
        "item6": {name: "Item #6", link: "#3", select: false},
        "item7": {name: "Item #7", link: "#3", select: false},
        "item8": {name: "Item #8", link: "#3", select: false}
    };
    next();
  });

  app.get("/admin", function(req, res, next) {
    res.render("admin/index", { menu: req.menu });
  });

  require("./admin/users")(app);
  require("./admin/board")(app);
};