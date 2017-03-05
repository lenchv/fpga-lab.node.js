var crypto = require('crypto'),
    mongoose = require('../lib/mongoose'),
    Schema = mongoose.Schema,
    User = require('./user').User,
    fs = require('fs'),
    path = require('path'),
    config = require('../config');

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
        var folderPath = __dirname+path.sep+".."+folderName;
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

module.exports.UserSpace = mongoose.model('UserSpace', schema);