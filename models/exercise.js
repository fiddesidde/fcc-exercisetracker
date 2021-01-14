const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
});

const exerciseSchema = new Schema({
    username: { type: String, required: true },
    log: { type: [logSchema] },
});

exerciseSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        delete returnedObject.__v;
    },
});

module.exports = mongoose.model('Exercise', exerciseSchema);
