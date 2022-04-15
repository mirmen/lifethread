
const  { Client, Intents, MessageButton, MessageActionRow } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const fs = require('fs');
config = {
    token: "ВАШ ТОКЕН",
    prefix: "!",
    adminID: "АДМИН АЙДИ",
    channelID: "КАНАЛ ДЛЯ ВЕТОК"
};

var channels = require("./channels.json"); 

client.on('ready', () => {
console.log(`Logged in as ${client.user.tag}!`);
checkFor12Hours();
});

function checkFor12Hours() {
channels.list.forEach(async (channel) => {
const thread = await client.channels.fetch(channel);
if (thread == undefined) {
    channels.list = channels.list.filter(e => e !== channel);
    
    fs.writeFile('channels.json', JSON.stringify(channels), (err) => {
        if (err) throw err;
        channels = require("./channels.json");
    });
} else {
    if (thread.isThread()) {
        if (thread.name.includes("[Обсуждение]") && thread.archived) {
            thread.setArchived(false);
        } else if (thread.name.includes("[Архив]") && !thread.archived) {
            thread.setArchived(true);
        }
    }
}
});
setTimeout(checkFor12Hours, 1000 * 60 * 60 * 12);
}

client.on('messageCreate', async (message) => {
if (message.channel.id == config.channelID && !message.author.bot) {
message.startThread({ 
    name: `[Обсуждение] ${message.content.length < 85 ? message.content : message.content.substring(0, 85) + "..."}`
}).then((thread) => {
    channels.list.push(thread.id);
    fs.writeFile('channels.json', JSON.stringify(channels), (err) => {
        if (err) throw err;
        channels = require("./channels.json");
    });
});
}

if (!message.content.startsWith(config.prefix)) return;

const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
const command = args.shift();


if (message.channel.type.includes("THREAD")) {
if (message.channel.name.includes("[Обсуждение]") || message.channel.name.includes("[Архив]")) {
    if (command == "admin") {
        const button1 = new MessageButton()
            .setLabel("Архив")
            .setStyle("PRIMARY")
            .setCustomId("archive");
        const buttons = new MessageActionRow();
        buttons.addComponents(button1);
        var owner = false;

        if (message.guild.members.cache.get(message.author.id).permissions.has("ADMINISTRATOR")) {
            const button2 = new MessageButton()
                .setLabel("Удалить")
                .setStyle("DANGER")
                .setCustomId("delete");
            buttons.addComponents(button2);
            owner = true;
        }
        if (owner || message.author.id == user.id) {
            var menu = await message.channel.send({
                content: `${message.author}`,
                components: [buttons]
            });
            var user = await message.channel.fetchOwner();

            const filter = (i) =>
                (i.customId === "delete" || i.customId === "archive") 
                && 
                (i.user.id === user.id || i.member.permissions.has("ADMINISTRATOR"));

            const collector = await menu.createMessageComponentCollector( {filter, time: 1000 * 120});

            collector.on("collect", async (i) => {
                if (i.customId == "delete") {
                    collector.stop();
                    i.reply({ content: `Обсуждение готовится к удалению...` });

                    setTimeout(() => {
                        channels.list = channels.list.filter(e => e !== message.channel.id);
                        
                        fs.writeFile('channels.json', JSON.stringify(channels), (err) => {
                            if (err) throw err;
                            channels = require("./channels.json");
                        });
                        message.channel.delete();
                    }, 1000 * 20);

                } else if (i.customId == "archive") {
                    collector.stop();
                    i.reply({ content: `Обсуждение - архивирование...` });
                    message.channel.setName(message.channel.name.replace("[Обсуждение]", "[Архив]"))
                    setTimeout(() => {
                        message.channel.setArchived(true)
                    }, 1000 * 20);
                } else {
                    i.defer();
                }
            });
            
            collector.on("end", () => {
                menu.delete();
                message.delete();
            });

        } else {
            message.delete();
        }
    }
}
}
});

client.login(config.token);
