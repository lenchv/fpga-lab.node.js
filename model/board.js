var mongoose = require('../lib/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    name: { type: String },
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
    active: { type: Boolean }
});

module.exports.Board = mongoose.model('Board', schema);