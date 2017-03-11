var crypto = require('crypto'),
    mongoose = require('../lib/mongoose'),
    Schema = mongoose.Schema,
    User = require('./user').User,
    fs = require('fs'),
    path = require('path'),
    config = require('../config'),
    async = require('async');
var FOLDER_PATH = __dirname+path.sep+"..";

var removeFolder = function (location, next) {
    fs.readdir(location, function (err, files) {
        async.each(files, function (file, cb) {
            file = location + '/' + file;
            fs.stat(file, function (err, stat) {
                if (err) {
                    return cb(err);
                }
                if (stat.isDirectory()) {
                    removeFolder(file, cb);
                } else {
                    fs.unlink(file, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        return cb();
                    })
                }
            })
        }, function (err) {
            if (err) return next(err);
            fs.rmdir(location, function (err) {
                return next(err)
            })
        })
    })
};

var schema = new Schema({
    user : { type: Schema.Types.ObjectId, ref: 'User' },
    directory: {
        type: String,
        required: true,
        unique: true
    },
    spacesize: {
        type: Number,
        default: config.get("fileManager:maxSpaceSize")
    }
});
schema.virtual("folder")
    .set(function(folderName) {
        folderName = path.sep + config.get("fileManager:userDirectory") + path.sep + crypto.createHash('sha1').update(folderName).digest("hex")+path.sep;
        var folderPath = FOLDER_PATH+folderName;
        if (fs.existsSync(folderPath)) {
            this.invalidate('folder', "Folder already exists");
        } else {
            fs.mkdirSync(folderPath, 777);
            this.directory = folderName;
        }
    })
    .get(function() {
        return this.directory;
    });
schema.statics.safeRemove = function(condition, callback) {
    var UserSpace = this;
    UserSpace.findOne(condition, function(err, space) {
        if (err) return callback(err);
        var folderName = FOLDER_PATH + space.folder;
        removeFolder(folderName, function(err) {
            if (err) return callback(err);
            UserSpace.findOneAndRemove(condition, callback);
        });
    });
};
module.exports.UserSpace = mongoose.model('UserSpace', schema);