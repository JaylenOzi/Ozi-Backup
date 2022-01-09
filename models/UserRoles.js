const mongoose = require('mongoose');

const UserRoles = new mongoose.Schema({
    guildID: String, 
    userID: String, 
    roles: Array
});

module.exports = mongoose.model('UserRoles', UserRoles);
