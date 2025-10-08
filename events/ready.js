const { ActivityType, ChannelType } = require('discord.js');
const Guild = require('../models/guild');
const { updateEventDrivers, updateTeamMembers } = require('../utils/updateStats');
const chalk = require('chalk');
const { Op } = require("sequelize");
const Warning = require("../models/warning");
require('dotenv').config();
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        /*const filePath = path.join(__dirname, '../utils/FTS_KR_roleSync.js');

        if (fs.existsSync(filePath)) {
            try {
                require(filePath)(client);
                console.log('FTS_KR_roleSync.js loaded');
            } catch (err) {
                console.error('Failed to load FTS_KR_roleSync.js', err);
            }
        }*/

        console.log(chalk.magenta.bold.underline(`Logged in as ${client.user.tag} ✅`));

        client.user.setActivity('Fujiwara Tofu Shop', {
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/dashund007'
        });

        let memberCountsOld = {};

        client.on('guildMemberAdd', async (member) => {
            if (!member.guild) return;
            await updateMemberCount(member.guild);
            updateTeamMembers(member.guild);
        });

        client.on('guildMemberRemove', async (member) => {
            if (!member.guild) return;
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
                        const memberCountChannel = await guild.channels.fetch(guildData.memberCountChannelId).catch(()=>null);
                        if (memberCountChannel && memberCountChannel.type === ChannelType.GuildVoice) {
                            await memberCountChannel.setName(`Members: ${totalMembers}`);
                            console.log(chalk.green(`Updated member count for `) + chalk.red.bold(`${guild.name}: ${totalMembers}\n`));
                        }
                    }
                }
            } catch (error) {
                console.error(chalk.red(`Error updating member count for ${guild.name}:`), error);
            }
        }

        setInterval(async () => {
            const now = new Date();
            const expiredWarnings = await Warning.findAll({
                where: {
                    active: true,
                    expiresAt: { [Op.lte]: now }
                }
            });

            for (const warn of expiredWarnings) {
                await warn.update({
                    active: false,
                    deactivationReason: "Expired (1 month)"
                });

                const MOD_CHANNEL_ID = "1150146916194193640"; 
                const channel = await client.channels.fetch(MOD_CHANNEL_ID).catch(()=>null);
                if (channel) {
                    await channel.send({
                        content: `⚠️ Warning **${warn.id}** for <@${warn.userId}> expired automatically (1 month).`
                    });
                }

                console.log(chalk.yellow(`⏱ Warning ${warn.id} expired and was deactivated.`));
            }
        }, 60 * 60 * 1000);
    }
};