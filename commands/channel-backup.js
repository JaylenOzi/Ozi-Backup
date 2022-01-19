const { Discord, MessageEmbed } = require('discord.js');
const ChannelData = require('../models/Channel.js');
const ayarlar = require('../jaylen.json');
const { green } = require("../jaylen.json")

exports.run = async (client, message, args) => {

  if (ayarlar.Owner.includes(message.author.id) === false) return message.channel.send(`**Bu komutu sadece \`JAYLEN\` kullanabilir!**`);

    if (!args[0] || isNaN(args[0])) return message.channel.send(`Geçerli bir Kanal ID'si belirtmelisin.`);
  
    ChannelData.findOne({guildID: ayarlar.guildID, channelID: args[0]}, async (err, channelData) => {
      if (!channelData) return message.channel.send("Belirtilen Kanal ID'si ile ilgili veri tabanında veri bulunamadı!");
      const kEmbed = new MessageEmbed()
      .setColor("#fd72a4")
      .setAuthor(message.member.displayName, message.author.avatarURL({dynamic:true}))
      .setTimestamp()
      .setDescription(`**${channelData.name}** isimli kanalın yedeği kullanılarak kanal oluşturulup, rol izinleri uygulanıcaktır.\nOnaylıyor iseniz ${green} emojisine basın!`)
  
      await message.channel.send({ embed: kEmbed }).then(msg => {
        msg.react(ayarlar.greenid);
  
        const onay = (reaction, user) => reaction.emoji.name === "green" && user.id === message.author.id;
  
        const collect = msg.createReactionCollector(onay, { time: 60000 });
  
        collect.on("collect", async r => {
          setTimeout(async function(){
  
            msg.delete().catch(err => console.log(`Backup mesajı silinemedi.`));
  
            message.guild.channels.create(channelData.name, {type: channelData.type}).then(channel => {
              if(channel.type === "voice"){
                channel.setBitrate(channelData.bitrate);
                channel.setUserLimit(channelData.userLimit);
                channel.setParent(channelData.parentID);
                channel.setPosition(channelData.position);
  
                if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                  for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                    channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                  };
                };
  
              }else if(channel.type === "category"){
              channel.setPosition(channelData.position);
                if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                  for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                    channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                  };
                };
              }else {
                channel.setRateLimitPerUser(channelData.setRateLimitPerUser);
                channel.setTopic(channelData.topic);
                channel.setParent(channelData.parentID);
                channel.setPosition(channelData.position);
  
                if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                  for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                    channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                  };
                };
  
              };
            });

              let logKanali = client.channels.cache.get(ayarlar.backupkanal);
              if (logKanali) { logKanali.send(`${message.author} (\`${message.author.id}\`) kullanıcısı\n<#${message.channel.id}> (\`${message.channel.id}\`) kanalında \`.kyükle\` komutu kullandı.\nKomut İçeriği: **${channelData.name}** - (\`${channelData.channelID}\`) kanalının yedeğini kurmaya başladı.\n──────────────────────────`)} else { message.guild.owner.send(new Discord.MessageEmbed().setColor("#fd72a4").setAuthor('Kanal Yedeği Kullanıldı!', message.guild.iconURL({dynamic: true})).setDescription(`${message.author} (\`${message.author.id}\`) tarafından ${channelData.name} (\`${channelData.channelID}\`) kanalının yedeği kurulmaya başlandı! Kanal sunucuda tekrar aynı ayarları ile oluşturuluyor, rol izinleri ekleniyor.`).setFooter(ayarlar.BotFooter).setTimestamp()).catch(err => {}); };            
            }, 450)
          })
        })
        });
    
}


exports.conf ={
   enabled: true,
    guildOnly: true,
    aliases: ['kkur', 'kyükle', 'kanal-kur', 'channel-kur', 'channel-backup'],
    permLevel: 0
}

exports.help = {
    name: 'kyükle',
    description: 'Silinen bir kanalı aynı izinleri ile kurar.',
    usage: 'kyükle <id>'
}
