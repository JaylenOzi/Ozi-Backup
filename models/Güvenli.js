const mongoose = require('mongoose');

const Güvenli = new mongoose.Schema({
    guildID: { type: String, default: "" },
    Safe: Array,
});

module.exports = mongoose.model("Güvenli", Güvenli);
