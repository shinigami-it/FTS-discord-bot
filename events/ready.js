const { ActivityType } = require('discord.js');
const Guild = require('../models/guild');
const { updateEventDrivers, updateTeamMembers } = require('../utils/updateStats');
const chalk = require('chalk');
require('dotenv').config();
console.log(Guild); // sollte ein Sequelize Model zeigen
console.log(typeof Guild.findOne);
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

        async function updateMemberCount(guild) {
            try {
                await guild.members.fetch();
                const totalMembers = guild.members.cache.size;

                if (memberCountsOld[guild.id] !== totalMembers) {
                    memberCountsOld[guild.id] = totalMembers;
                    const guildData = await Guild.findOne({ where: { id: guild.id } });
                    if (guildData && guildData.memberCountChannelId) {
                        const memberCountChannel = await guild.channels.fetch(guildData.memberCountChannelId);
                        if (memberCountChannel) {
                            await memberCountChannel.setName(`Members: ${totalMembers}`);
                            console.log(chalk.green(`Updated member count for `) + chalk.red.bold(`${guild.name}: ${totalMembers}\n`));
                        }
                    }
                }
            } catch (error) {
                console.error(chalk.red(`Error updating member count for ${guild.name}:`, error));
            }
        }
    }
};
