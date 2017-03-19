var mongoose = require('../lib/mongoose'),
    Schema = mongoose.Schema,
    config = require('../config');

var schema = new Schema({
    name: { type: String },
    firmwareport: { type: String },
    comport: { type: String },
    baudRate: {
        type: Number,
        enum: [
            300,
            1200,
            2400,
            4800,
            9600,
            14400,
            19200,
            28800,
            38400,
            57600,
            115200,
            230400
        ]
    },
    webcam: { type: String },
    webcamsecret: { type: String },
    busy: { type: Boolean },
    user : { type: Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean },
    sessionTime: { type: Date }
});
/**
 * Обновляет время работы платы
 */
schema.methods.updateExpires = function(callback) {
    this.sessionTime = Date.now();
    this.save(callback);
};
/**
 * Проверяет истекла ли сессия платы или нет
 * @returns {boolean}
 */
schema.methods.isExpired = function() {
    console.log(Date.now() - this.sessionTime);
    return (Date.now() - this.sessionTime > config.get('session:cookie').maxAge);
};

schema.methods.leave = function(callback) {
    this.busy = false;
    this.user = undefined;
    this.sessionTime = undefined;
    // отсоединяем от веб сокета
    this.save(callback);
};
schema.statics.unset = function(user_id, callback) {
    this.findOne({user: user_id}, function(err, board) {
        if (err) return callback(err);
        if (board) {
            board.leave(callback);
        } else {
            callback();
        }

    });
};
schema.methods.setUser = function(user_id, callback) {
    this.user = user_id;
    this.busy = true;
    this.updateExpires(callback);
};
module.exports.Board = mongoose.model('Board', schema);