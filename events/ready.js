const { ActivityType } = require('discord.js');
const Guild = require('../models/guild');
const { updateEventDrivers, updateTeamMembers } = require('../utils/updateStats');
const chalk = require('chalk');
require('dotenv').config();

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(chalk.magenta.bold.underline(`Logged in as ${client.user.tag} ✅`));

        client.user.setActivity('FTS - The Future is incoming', {
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/dashund007'
        });

        let memberCountsOld = {};

        client.on('guildMemberAdd', async (member) => {
            await updateMemberCount(member.guild);
            updateTeamMembers(member.guild);
        });

        client.on('guildMemberRemove', async (member) => {
            await updateMemberCount(member.guild);
            updateTeamMembers(member.guild);
        });

        for (const guild of client.guilds.cache.values()) {
            await updateMemberCount(guild);
            await updateTeamMembers(guild);
            await updateEventDrivers(guild);
        }

        const GuildModel = require('../models/guild');
GuildModel.findOne({ where: { id: '1132332567459278878' } }).then(console.log).catch(console.error);

    }
};
