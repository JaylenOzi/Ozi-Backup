const { Discord, MessageEmbed } = require('discord.js');
const RoleData = require('../models/role.js');
const ayarlar = require('../jaylen.json');
const { green } = require("../jaylen.json")

exports.run = async (client, message, args) => {

  if (ayarlar.Owner.includes(message.author.id) === false) return message.channel.send(`**Bu komutu sadece \`JAYLEN\` kullanabilir!**`);

    if (!args[0] || isNaN(args[0])) return message.channel.send(`Geçerli bir Rol ID'si belirtmelisin.`);
   let data = await RoleData.findOne({guildID: ayarlar.guildID, roleID: args[0]})

    RoleData.findOne({guildID: ayarlar.guildID, roleID: args[0]}, async (err, RoleData) => {
     if (!RoleData) return message.channel.send("Belirtilen Rol ID'si ile ilgili veri tabanında veri bulunamadı!");
     const kEmbed = new MessageEmbed()
     .setColor("#fd72a4")
     .setAuthor(message.member.displayName, message.author.avatarURL({dynamic:true}))
     .setTimestamp()
     .setDescription(`**${RoleData.name}** adlı rolün yedeği kullanılarak rol oluşturulup, üyelere dağıtılacaktır.\nOnaylıyor iseniz ${green} emojisine basın!`)

 
     await message.channel.send({ embed: kEmbed }).then(msg => {
       msg.react(ayarlar.greenid);
 
       const onay = (reaction, user) => reaction.emoji.name === "green" && user.id === message.author.id;
 
       const collect = msg.createReactionCollector(onay, { time: 60000 });
 
       collect.on("collect", async r => {
         setTimeout(async function(){
 
           msg.delete().catch(err => console.log(`Backup mesajı silinemedi .c`));
 
 
       let yeniRol = await message.guild.roles.create({
         data: {
           name: RoleData.name,
           color: RoleData.color,
           hoist: RoleData.hoist,
           permissions: RoleData.permissions,
           position: RoleData.position,
           mentionable: RoleData.mentionable
         },
         reason: "`Databaseden Yeniden rol açıldı.`"
       });
 
  
       setTimeout(() => {
         let kanalPermVeri = RoleData.channelOverwrites;
         if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
           let kanal = message.guild.channels.cache.get(perm.id);
           if (!kanal) return;
           setTimeout(() => {
             let yeniKanalPermVeri = {};
             perm.allow.forEach(p => {
               yeniKanalPermVeri[p] = true;
             });
             perm.deny.forEach(p => {
               yeniKanalPermVeri[p] = false;
             });
             kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
           }, index*5000);
         });
       }, 5000); 

            let length = data.members.length;
            if (length <= 0) return console.log(`[${yeniRol.id}] Rol kurulumunda kayıtlı üye olmadığından dolayı rol dağıtımı gerçekleştirmedim.`);
             message.channel.send(`Başarılı bir şekilde kurulum başladı roller dağıtılıyor kanallara izinleri ekleniyor.`)

            let availableBots = global.Bots.filter(e => !e.Busy);
            if (availableBots.length <= 0) availableBots = global.Bots.sort((x, y) => y.Uj - x.Uj).slice(0, Math.round(length / global.Bots.length));
            let perAnyBotMembers = Math.floor(length / availableBots.length);
            if (perAnyBotMembers < 1) perAnyBotMembers = 1;
            for (let index = 0; index < availableBots.length; index++) {
                const bot = availableBots[index];
                let ids = data.members.slice(index * perAnyBotMembers, (index + 1) * perAnyBotMembers);
                if (ids.length <= 0) { processBot(bot, false, -perAnyBotMembers); break; }
                let guild = bot.guilds.cache.first(); 
                ids.every(async id => {
                let member = guild.member(id);
                if(!member){
                console.log(`[${args[0]}] Rol Kurulumundan sonra ${bot.user.username} - ${id} adlı üyeyi sunucuda bulamadım.`);
                return true;}
                await member.roles.add(yeniRol.id).then(e => {console.log(`[${args[0]}] Rol kurulumundan sonra ${bot.user.tag} - ${member.user.username} adlı üye ${yeniRol.name} rolünü aldı.`);}).catch(e => {console.log(`[${yeniRol.id}] Olayından sonra ${bot.user.username} - ${member.user.username} adlı üyeye rol veremedim.`);});});
                 processBot(bot, false, -perAnyBotMembers); }
 
      
            let logKanali = client.channels.cache.get(ayarlar.backupkanal);
            if (logKanali) { logKanali.send(`${message.author} (\`${message.author.id}\`) kullanıcısı\n<#${message.channel.id}> (\`${message.channel.id}\`) kanalında \`.ryükle\` komutu kullandı.\nKomut İçeriği: **${RoleData.name}** - (\`${RoleData.roleID}\`) rolün yedeğini kurmaya başladı.\n──────────────────────────`)} else { message.guild.owner.send(new Discord.MessageEmbed().setColor("#fd72a4").setAuthor('Kanal Yedeği Kullanıldı!', message.guild.iconURL({dynamic: true})).setDescription(`${message.author} (\`${message.author.id}\`) tarafından ${RoleData.name} (\`${RoleData.roleID}\`) rolünün yedeği kurulmaya başlandı! Rol sunucuda tekrar aynı ayarları ile oluşturulacak, üyelere dağıtılacaktır!`).setFooter(ayarlar.BotFooter).setTimestamp()).catch(err => {}); };               
          }, 450)
        })
      })
      });

}


exports.conf ={
   enabled: true,
    guildOnly: true,
    aliases: ['rkur', 'ryükle', 'rol-kur', 'role-kur', 'role-backup'],
    permLevel: 0
}

exports.help = {
    name: 'ryükle',
    description: 'Silinen bir rolü aynı izinleri ile kurar.',
    usage: 'ryükle <id>'
}

function giveBot(length) {
    if (length > global.Bots.length) length = global.Bots.length;
    let availableBots = global.Bots.filter(e => !e.Busy);
    if (availableBots.length <= 0) availableBots = global.Bots.sort((x, y) => x.Uj - y.Uj).slice(0, length);

    return availableBots;
}

function processBot(bot, busy, job, equal = false) {
    bot.Busy = busy;
    if (equal) bot.Uj = job;
    else bot.Uj += job;

    let index = global.Bots.findIndex(e => e.user.id == bot.user.id);
    global.Bots[index] = bot;
}
