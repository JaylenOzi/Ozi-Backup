const mongoose = require('mongoose');

const channel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,
    channelID: String,
    name: String,
    parentID: String,
    position: Number,
    permissionOverwrites: Array,
    nsfw: Boolean,
    rateLimitPerUser: Number,
    type: String,
    topic: String,
    time: Number,
    userLimit: Number,
    bitrate: Number,
});

module.exports = mongoose.model('Channel', channel);