const mongoose = require('mongoose');

const Güvenli = new mongoose.Schema({
    guildID: { type: String, default: "" },
    Safe: {type: Array, default: ""}, 
});

module.exports = mongoose.model("Güvenli", Güvenli);
