const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    email: {type: String, unique:true},
    token: {type: String, required: true},
    createdAt: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Token', tokenSchema);