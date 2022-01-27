const Discord = require('discord.js');
const client = global.client = new Discord.Client({fetchAllMembers: true});
require('discord-buttons')(client)
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
setInterval(() => {
  client.user.setPresence({ activity: { name: ayarlar.BotDurum }, status: ayarlar.BotStatus });

    let sesKanal = client.channels.cache.get(ayarlar.BotSesKanal);
    if(sesKanal) sesKanal.join().catch(err => console.error("Ses kanalına giriş başarısız!"));
}, 750);
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
 
let Tokens = ayarlar.DağıtıcıTokens;
const Bots = global.Bots = [];

Tokens.forEach(token => {
const bot = global.client = new Discord.Client({fetchAllMembers: true});
 
  bot.on("ready", () => {
  console.log(`(${bot.user.username}) adlı destekçi hesapta [${bot.guilds.cache.get(ayarlar.guildID).name}] adlı sunucuda giriş yapıldı.`);
  bot.user.setPresence({ activity: { name: ayarlar.BotDurum }, status: ayarlar.BotStatus });
  bot.Busy = false;
  bot.Uj = 0;
  Bots.push(bot);})
  bot.login(token).then(e => {}).catch(e => {console.error(`${token.substring(Math.floor(token.length / 2))} adlı bota giriş yapılırken başarısız olundu!.`)})})

  

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
 RoleData.deleteMany({}); 

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
 ChannelData.deleteMany({}); 

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
const userRoles = require('./models/UserRoles.js');
const Database = require('./models/Güvenli.js');
const { MessageButton } = require('discord-buttons');
const { MessageEmbed } = require('discord.js');

const data = Database.findOne({ guildID: ayarlar.guildID });


    var button_1 = new MessageButton()
    .setID("rolver")
    .setLabel("Rolleri Geri Ver")
    .setStyle("blurple")

    var button_2 = new MessageButton()
    .setID("yasak")
    .setLabel("Kullanıcıyı Yasakla")
    .setStyle("red")

    var button_3 = new MessageButton()
    .setID("güvenli")
    .setLabel("Güvenli Liste Ekle")
    .setStyle("green")


client.on("presenceUpdate", async (eski, yeni) => {

const ozicik = Object.keys(yeni.user.presence.clientStatus);
  const embed = new MessageEmbed();
  let kanal = client.channels.cache.get(ayarlar.backupkanal)
  const roller = yeni.member.roles.cache.filter((e) => e.editable && e.name !== "@everyone" && [8, 4, 2, 16, 32, 268435456, 536870912, 134217728, 128].some((a) => e.permissions.has(a)));
  if (!yeni.user.bot && yeni.guild.id === ayarlar.guildID && [8, 4, 2, 16, 32, 268435456, 536870912, 134217728, 128].some((e) => yeni.member.permissions.has(e)) ) {
    const sunucu = client.guilds.cache.get(ayarlar.guildID);
    if (sunucu.ownerID === yeni.user.id) return;
    //if(["",""].some === yeni.user.id) return;
    
    let xd = await Database.findOne({guildID: ayarlar.guildID})
    if(xd.Safe.includes(yeni.user.id)) return;
    

    if (ozicik.find(e => e === "web")) {
      await userRoles.findOneAndUpdate({ guildID: ayarlar.guildID, userID: yeni.user.id }, { $set: { roles: roller.map((e) => e.id) } }, { upsert: true });
      await yeni.member.roles.remove(roller.map((e) => e.id), "Tarayıcıdan Giriş Yapıldığı İçin Rolleri Alındı.");

      let ozi = new MessageEmbed()
     .setDescription(`Şüpheli Kullanıcı Web Tarayıcısında Rol Sekmesine Giriş Yaptı
**Şüpheli:** ${yeni.user.toString()} - \`(${yeni.user.id})\`
**Sonuç:** Şüphelinin Yetki İçeren Rolleri Alındı.
\n**Rollerin Listesi:** \n${roller.map((e) => `<@&${e.id}>`).join("\n")}`)
.setThumbnail(yeni.user.displayAvatarURL({ dynamic: true, size: 2048 }))
.setAuthor(yeni.member.displayName, yeni.user.avatarURL({ dynamic: true })).setFooter(ayarlar.BotFooter, client.guilds.cache.get(ayarlar.guildID).iconURL({ dynamic: true })).setTimestamp().setColor(yeni.member.displayHexColor)

 let msg = kanal.send({ buttons : [ button_1, button_2, button_3 ], embed: ozi}) 


 client.on("clickButton", async (button) => {
await button.think();

if(button.id === "rolver") {
if(button.clicker.member.id !== sunucu.ownerID) return;
 
let ozir = new MessageEmbed()
.setDescription(`Şüpheli Kullanıcıya Rolleri Geri Verildi
**Şüpheli:** ${yeni.user.toString()} - \`(${yeni.user.id})\`
**Sonuç:** Şüphelinin Yetki İçeren Rolleri Geri Verildi.
\n**Rollerin Listesi:** \n${roller.map((e) => `<@&${e.id}>`).join("\n")}`)
.setThumbnail(yeni.user.displayAvatarURL({ dynamic: true, size: 2048 }))
.setAuthor(yeni.member.displayName, yeni.user.avatarURL({ dynamic: true })).setFooter(ayarlar.BotFooter, client.guilds.cache.get(ayarlar.guildID).iconURL({ dynamic: true })).setTimestamp().setColor(yeni.member.displayHexColor)
kanal.send({components: null, embed: ozir}); 

    const veri = await userRoles.findOne({ guildID: ayarlar.guildID, userID: yeni.user.id });
    if (!veri) return;
    if (veri.roles || veri.roles.length) {
      await veri.roles.map(e => yeni.member.roles.add(e, "Tarayıcıdan giriş yaptığı için alınan yetkileri geri verildi").then(async () => {
        await userRoles.findOneAndDelete({ guildID: ayarlar.guildID, userID: yeni.user.id });
      }).catch(() => {}));
    }
}

if(button.id === "yasak") {
if(button.clicker.member.id !== sunucu.ownerID) return;
 
  let oziy = new MessageEmbed()
  .setDescription(`${yeni.user.toString()} kullanıcısının tarayıcıdan giriş yaptığı için sunucudan yasaklandı!`)
  .setThumbnail(yeni.user.displayAvatarURL({ dynamic: true, size: 2048 }))
  .setAuthor(yeni.member.displayName, yeni.user.avatarURL({ dynamic: true })).setFooter(ayarlar.BotFooter, client.guilds.cache.get(ayarlar.guildID).iconURL({ dynamic: true })).setTimestamp().setColor(yeni.member.displayHexColor)
  kanal.send({components: null, embed: oziy}); 
  

button.guild.members.ban(yeni.user.id, { reason: `Tarayıcıdan giriş yapmak | Yetkili: ${button.clicker.member.user.tag}` , days:1}).catch(() => {});
}




if(button.id === "güvenli") {
if(button.clicker.member.id !== sunucu.ownerID) return;
 
let ozig = new MessageEmbed()
.setDescription(`${yeni.user.toString()} kullanıcısının tarayıcıdan giriş yaptığı için alınan yetkileri geri verildi ve sekme koruması için güvenli listeye eklendi! \n\n**Geri Verilen Rollerin Listesi:** \n${roller.map((e) => `<@&${e.id}>`).join("\n")}`)
.setThumbnail(yeni.user.displayAvatarURL({ dynamic: true, size: 2048 }))
.setAuthor(yeni.member.displayName, yeni.user.avatarURL({ dynamic: true })).setFooter(ayarlar.BotFooter, client.guilds.cache.get(ayarlar.guildID).iconURL({ dynamic: true })).setTimestamp().setColor(yeni.member.displayHexColor)
kanal.send({components: null, embed: ozig}); 

const veri = await userRoles.findOne({ guildID: ayarlar.guildID, userID: yeni.user.id });
if (!veri) return;
if (veri.roles || veri.roles.length) {
  await veri.roles.map(e => yeni.member.roles.add(e, "Tarayıcıdan giriş yaptığı için alınan yetkileri geri verildi").then(async () => {
    await userRoles.findOneAndDelete({ guildID: ayarlar.guildID, userID: yeni.user.id });
  }).catch(() => {}));
}

await Database.findOneAndUpdate({ guildID:ayarlar.guildID }, { $push: { Safe: yeni.user.id } }, { upsert: true });
}

})
    } 
  }
  if (!ozicik.find(e => e === "web")) {
    const veri = await userRoles.findOne({ guildID: ayarlar.guildID, userID: yeni.user.id });
    if (!veri) return;
    if (veri.roles || veri.roles.length) {
      await veri.roles.map(e => yeni.member.roles.add(e, "Tarayıcıdan Çıkış Yapıldığı İçin Rolleri Geri Verildi.").then(async () => {
        await userRoles.findOneAndDelete({ guildID: ayarlar.guildID, userID: yeni.user.id });
        if (kanal) kanal.send(embed.setDescription(`${yeni.user.toString()} tarayıcıdan çıkış yaptığı için yetkileri verildi! \n\n**Rollerin Listesi:** \n${veri.roles.map((e) => `<@&${e}>`).join("\n")}`).setAuthor(yeni.member.displayName, yeni.user.avatarURL({ dynamic: true })).setFooter(ayarlar.BotFooter, client.guilds.cache.get(ayarlar.guildID).iconURL({ dynamic: true })).setTimestamp().setColor(yeni.member.displayHexColor));
      }).catch(() => {}));
    }
  }
  if (ozicik.find(e => e === "mobile")) {
    const veri = await userRoles.findOne({ guildID: ayarlar.guildID, userID: yeni.user.id });
    if (!veri) return;
    await veri.roles.map(e => yeni.member.roles.add(e, "Platformunu değiştirdiği için yetkili rolleri geri verindi :)"));
       await userRoles.findOneAndDelete({ guildID: ayarlar.guildID, userID: yeni.user.id });
       if (kanal) kanal.send(embed.setDescription(`${yeni.user.toString()} üyesi tarayıcıdan çıktığı için bütün yetkili rolleri geri verildi. :)`));
   }
 if (ozicik.find(e => e === "desktop")) {
  const veri = await userRoles.findOne({ guildID: ayarlar.guildID, userID: yeni.user.id });
  if (!veri) return;
  await veri.roles.map(e => yeni.member.roles.add(e, "Platformunu değiştirdiği için yetkili rolleri geri verindi :)"));
     await userRoles.findOneAndDelete({ guildID: ayarlar.guildID, userID: yeni.user.id });
      if (kanal) kanal.send(embed.setDescription(`${yeni.user.toString()} üyesi tarayıcıdan çıktığı için bütün yetkili rolleri geri verildi. :)`));
   } else {
    const veri = await userRoles.findOne({ guildID: ayarlar.guildID, userID: yeni.user.id });
    if (!veri) return;
   if (kanal) kanal.send(embed.setDescription(`${yeni.user.toString()} üyesi tarayıcıda çevrimdışı moduna geçtiği için yetkilerini geri vermedim. :)`));
 }

});
///////////////////////////////////////////////////////////////////////////////////////////////
