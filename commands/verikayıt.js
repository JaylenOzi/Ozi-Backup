const Discord = require('discord.js')
const mongoose = require('mongoose');
const ayarlar = require('../jaylen.json');
const RoleData = require('../models/role.js');
const ChannelData = require('../models/Channel.js');
const { green } = require("../jaylen.json")

exports.run = async (client, message, args) => {
if (ayarlar.Owner.includes(message.author.id) === false) return message.channel.send(`**Bu komutu sadece \`Owner\` kullanabilir!**`);

if(RoleData) {await RoleData.deleteMany({});}
if(ChannelData) {await ChannelData.deleteMany({});}


let guild = client.guilds.cache.get(ayarlar.guildID);
if (guild) {
    guild.channels.cache.filter(kanal => kanal.deleted !== true).forEach(channel => {
      let permissionss = {};
      let sayi = Number(0);
      channel.permissionOverwrites.forEach((perm) => {
        let thisPermOverwrites = {};
        perm.allow.toArray().forEach(p => {
          thisPermOverwrites[p] = true;
        });
        perm.deny.toArray().forEach(p => {
          thisPermOverwrites[p] = false;
        });
        permissionss[sayi] = {permission: perm.id == null ? guild.id : perm.id, thisPermOverwrites};
        sayi++;
      });

      ChannelData.findOne({guildID: ayarlar.guildID, channelID: channel.id}, async (err, savedChannel) => {
        if (!savedChannel) {
          if(channel.type === "voice"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
              userLimit: channel.userLimit,
              bitrate: channel.bitrate
            });
            newChannelSchema.save();
          }else if(channel.type === "category"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }else {
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              nsfw: channel.nsfw,
              rateLimitPerUser: channel.rateLimitPerUser,
              type: channel.type,
              topic: channel.topic ? channel.topic : "Bu kanal Ozi Backup botu tarafından kurtarıldı!",
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }
        } else {
          if(channel.type === "voice"){
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.userLimit = channel.userLimit;
            savedChannel.bitrate = channel.bitrate;
            savedChannel.save();
          }else if(channel.type === "category"){
            savedChannel.name = channel.name;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }else {
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.nsfw = channel.nsfw;
            savedChannel.rateLimitPerUser = channel.rateLimitPerUser;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.topic = channel.topic ? channel.topic : "Bu kanal Ozi Backup botu tarafından kurtarıldı!";
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }
        };
      });
    });
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      RoleData.findOne({guildID: ayarlar.guildID, roleID: role.id}, async (err, savedRole) => {
      if (!savedRole) {
        let newRoleSchema = new RoleData({
          _id: new mongoose.Types.ObjectId(),
          guildID: ayarlar.guildID,
          roleID: role.id,
          name: role.name,
          color: role.hexColor,
          hoist: role.hoist,
          position: role.position,
          permissions: role.permissions,
          mentionable: role.mentionable,
          time: Date.now(),
          members: role.members.map(m => m.id),
          channelOverwrites: roleChannelOverwrites
        });
        newRoleSchema.save();
      } else {
        savedRole.name = role.name;
        savedRole.color = role.hexColor;
        savedRole.hoist = role.hoist;
        savedRole.position = role.position;
        savedRole.permissions = role.permissions;
        savedRole.mentionable = role.mentionable;
        savedRole.time = Date.now();
        savedRole.members = role.members.map(m => m.id);
        savedRole.channelOverwrites = roleChannelOverwrites;
        savedRole.save();
      };
    });
  });
};
message.channel.send(`Bütün kanal ve rol verileri başarı ile kayıt edildi. ${green}`)
};

exports.conf = {
   enabled: true,
    guildOnly: true,
    aliases: ['verikayıt','kayıt'],
    permLevel: 0
}

exports.help = {
    name: 'verikayıt',
    description: 'Backup Verilerinizi Kayıt Yapar',
    usage: 'verikayıt'
}
