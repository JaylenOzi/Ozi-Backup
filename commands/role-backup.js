const { Discord, MessageEmbed } = require('discord.js');
const RoleData = require('../models/role.js');
const ayarlar = require('../jaylen.json');
const { green } = require("../jaylen.json")

exports.run = async (client, message, args) => {

  if (ayarlar.Owner.includes(message.author.id) === false) return message.channel.send(`**Bu komutu sadece \`JAYLEN\` kullanabilir!**`);

    if (!args[0] || isNaN(args[0])) return message.channel.send(`Geçerli bir Rol ID'si belirtmelisin.`);
  
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
 
           msg.delete().catch(err => console.log(`Backup mesajı silinemedi.`));
 
 
       let yeniRol = await message.guild.roles.create({
         data: {
           name: RoleData.name,
           color: RoleData.color,
           hoist: RoleData.hoist,
           permissions: RoleData.permissions,
           position: RoleData.position,
           mentionable: RoleData.mentionable
         },
         reason: "`Yeniden rol açıldı.`"
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
 
       let roleMembers = RoleData.members;
       roleMembers.forEach((member, index) => {
         let uye = message.guild.members.cache.get(member);
         if (!uye || uye.roles.cache.has(yeniRol.id)) return;
         setTimeout(() => {
           uye.roles.add(yeniRol.id).catch(console.error);
         }, index*3000);
       }); 
      
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