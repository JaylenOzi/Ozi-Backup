const Discord = require('discord.js')
const ayarlar = require('../jaylen.json');
const Database = require('../models/Güvenli.js');

exports.run = async (client, message, args, prefix) => {
if (ayarlar.Owner.includes(message.author.id) === false) return message.channel.send(`**Bu komutu sadece \`Owner\` kullanabilir!**`);
  
   
  let seçenek = args[0] 
  const data = await Database.findOne({ guildID: message.guild.id });
  if(seçenek == "list" || seçenek == "liste"){  message.channel.send(`Backup Safe List: ${data && data.Safe ? `${data.Safe.map((x ,i) => `<@!${x}>`).join(',')}`: '**Veritabanında güvenli üye bulunamadı.**'}`)}
  if(!(seçenek == "list" || seçenek == "liste")){
  const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
  if (!user) return message.channel.send(`Lütfen tüm argümanları doğru giriniz!\nÖrnek Kullanım: ${ayarlar.prefix}safe {user}`)
  if (!data) {  message.channel.send(`${user} üyesi başarıyla güvenli veritabanına eklendi!`);
  new Database({guildID: message.guild.id, Safe: user.id}).save();} else {
  let Safe = data.Safe;
  if(Safe.includes(user.id)) { message.channel.send(`${user} üyesi başarıyla güvenli veritabanından çıkarıldı!`);
  Safe.remove(user.id);data.save();return} message.channel.send(`${user} üyesi başarıyla güvenli veritabanına eklendi!`); Safe.push(user.id);data.save();}}
     
    };

exports.conf = {
   enabled: true,
    guildOnly: true,
    aliases: ["safe","whitelist", "güvenli"],
    permLevel: 0
}

exports.help = {
    name: 'güvenli',
    description: 'Sekme koruması için güvenli ekleme komutu.',
    usage: 'güvenli <üye>'
}
