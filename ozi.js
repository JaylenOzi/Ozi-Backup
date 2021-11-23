const Discord = require('discord.js');
const client = global.client = new Discord.Client({fetchAllMembers: true});
const ayarlar = require('./jaylen.json');
const fs = require('fs');
const mongoose = require('mongoose');
const request = require('request');
const ChannelData = require('./models/Channel.js');
const RoleData = require('./models/role.js');

mongoose.connect(ayarlar.MongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on("open", async() => {
console.log("Mongo Bağlandı.")
})

client.on('ready', async () => {
  client.user.setPresence({ activity: { name: ayarlar.BotDurum }, status: ayarlar.BotStatus });

    let sesKanal = client.channels.cache.get(ayarlar.BotSesKanal);
    if(sesKanal) sesKanal.join().catch(err => console.error("Ses kanalına giriş başarısız!"));

})

client.login(ayarlar.Token).then(ozi => console.log(`${client.user.username} İsmi ile giriş yapıldı! Database Online`)).catch(err => console.log("Database Botunuz giriş yapamadı!"));

client.on('voiceStateUpdate', async (___, newState) => {
  if (
  newState.member.user.bot &&
  newState.channelID &&
  newState.member.user.id == client.user.id &&
  !newState.selfDeaf
     ) {
  newState.setSelfDeaf(true);
     }
     });

////////////////////////////////////////////////////////////////////////////////////////////////////

client.on("ready", () => {
  const log = message => {
    console.log(`[OZİ KOMUT] - ${message}`)
  };
  
  console.log(`Database Komutlar Yüklendi!`)
  client.commands = new Discord.Collection();
  client.aliases = new Discord.Collection();
  
    fs.readdir("./commands/", (err, files) => {
      if (err) console.error(err);
      log(`${files.length} komut yüklenecek.`);
      files.forEach(f => {
        let props = require(`./commands/${f}`);
        log(`Yüklenen komut: ${props.help.name}`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
          client.aliases.set(alias, props.help.name);
        });
      });
    });
  
  client.elevation = message => {
    if (!message.guild) return;
    let permlvl = 0;
    if (ayarlar.Owner.includes(message.author.id)) permlvl = 5;
    return permlvl;
  };
})

client.on("message", async (message) => {
  let client = message.client;
  let Prefix = ayarlar.Prefix;
  if (message.author.bot) return;
  if (!message.content.startsWith(Prefix)) return;
  let command = message.content.split(' ')[0].slice(Prefix.length);
  let params = message.content.split(' ').slice(1);
  let perms = client.elevation(message);
  let cmd;
  if (client.commands.has(command)) {
    cmd = client.commands.get(command);
  } else if (client.aliases.has(command)) {
    cmd = client.commands.get(client.aliases.get(command));
  }
  if (cmd) {
    if (perms < cmd.conf.permLevel) return;
    cmd.run(client, message, params, perms);
  }
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
setInterval(() => {
client.channels.cache.get(ayarlar.backupkanal).send(`Sunucu rolleri güvenlik amaçlı veri tabanına yedeklendi!`)
client.channels.cache.get(ayarlar.backupkanal).send(`Sunucu kanalları güvenlik amaçlı veri tabanına yedeklendi!`)
 rolebackup();
 kanalbackup();
}, 7200000);

function rolebackup (guildID) {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (!guild) return;

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

function kanalbackup() {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (!guild) return;
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
      })

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
              topic: channel.topic ? channel.topic : "Bu kanal Ozi Backup botu tarafından geri yüklendi.",
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
            savedChannel.topic = channel.topic ? channel.topic : "Bu kanal Ozi Backup botu tarafından geri yüklendi.";
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }
        };
      });
    });
  };
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

client.on("roleDelete", role => {
  client.channels.cache.get(ayarlar.backupkanal).send("Silinen Rol ID: `" + role.id + "`");
  client.channels.cache.get(ayarlar.backupkanal).send("Silinen Rol İsim: `" + role.name + "`");
});

client.on("channelDelete", channel => {
  client.channels.cache.get(ayarlar.backupkanal).send("Silinen Kanal ID: `" + channel.id + "`");
  client.channels.cache.get(ayarlar.backupkanal).send("Silinen Kanal İsim: `" + channel.name + "`");
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
