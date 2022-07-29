const global_config = require('../config.json')

const express = require('express')
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler')

const plutonium = require('./plutonium.js')
const xlabs = require('./xlabs.js')

const scheduler = new ToadScheduler()

let servers = {
    plutonium: {},
    xlabs: {},
}

const get_plutonium_servers = new Task('get_plutonium_servers', async () => {
    servers.plutonium = await plutonium.getServers()
})
const get_xlabs_servers = new Task('get_xlabs_servers', async () => {
    servers.xlabs = await xlabs.getServers()
})

const get_plutonium_servers_job = new SimpleIntervalJob({ seconds: 20 }, get_plutonium_servers)
scheduler.addSimpleIntervalJob(get_plutonium_servers_job)
get_plutonium_servers.execute()

const get_xlabs_servers_job = new SimpleIntervalJob({ seconds: 20 }, get_xlabs_servers)
scheduler.addSimpleIntervalJob(get_xlabs_servers_job)
get_xlabs_servers.execute()

function getServerStats(servers) {
    let countPlayers = 0
    let countBots = 0
    let maxPlayers = 0

    for (server of servers) {
        countPlayers += server.players.length
        maxPlayers += server.maxplayers
        countBots += server.bots
    }

    return {
        servers: servers,
        countPlayers,
        countBots,
        maxPlayers,
        countServers: servers.length,
    }
}

const app = express()
app.disable("x-powered-by")

app.get('/v1/servers/:platform', (req, res) => {
    try {
        let ans = getServerStats(servers[req.params.platform].servers.all)
        ans.date = servers[req.params.platform].date
        res.send(ans)
    } catch {
        res.send([])
    }
})

app.get('/v1/servers/:platform/:game', (req, res) => {
    try {
        let ans = getServerStats(servers[req.params.platform].servers[req.params.game])
        ans.date = servers[req.params.platform].date
        res.send(ans)
    } catch {
        res.send([])
    }
})

app.listen(global_config.api.port)