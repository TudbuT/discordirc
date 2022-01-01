const ip =      process.env.IP
const port =    process.env.PORT | 6667
const token =   process.env.TOKEN
const nick =    process.env.NICK



const Discord = require('discord.js')
const { Client } = Discord
const IRC = require('irc').Client

const client = new Client({
    intents: [
        "GUILD_WEBHOOKS",
        "GUILD_MESSAGES",
        "GUILDS"        ,
    ],
})

client.login(token)
setTimeout(() => {
    client.guilds.cache.forEach(it => it.channels.fetch())
}, 5000);

const irc = new IRC(ip, nick)

irc.on('message', async function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message)
    let channel = client.channels.cache.find(channel => ('#' + channel.name.toLowerCase()) === to)
    if (channel && channel.type === 'GUILD_TEXT') {
        if (!channel.webhook) {
            channel.webhook = 0
        }
        let hooks = (await channel.fetchWebhooks()).map(hook => hook)
        if (hooks.length === 0) {
            hooks = [ await channel.createWebhook('IRC'), await channel.createWebhook('IRC'), await channel.createWebhook('IRC'), await channel.createWebhook('IRC') ]
        }
        let hook = hooks[++channel.webhook % hooks.length]
        hook.send({
            username: from,
            content: message,
        })
    }
})

client.on('messageCreate', async function (message) {
    if (message.webhookId)
        return
    if (message.channel.type === 'GUILD_TEXT') {
        irc.join('#' + message.channel.name)
        irc.say('#' + message.channel.name, message.content) 
    }
})

process.on('SIGINT', async function () {
    irc.send('QUIT', 'QUIT')
    setTimeout(process.exit, 500)
})