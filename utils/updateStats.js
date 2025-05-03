const { ActivityType } = require('discord.js');
const Guild = require('../models/guild');
const chalk = require('chalk');
let FTSCountOld = 0;
let EventCountOld = 0;

module.exports = {
    updateTeamMembers: async (guild) => {
        const guildId = "1132332567459278878";
        const ftsRole = "1287721449057947669";
        const ftsTrialRole = "1290079131807256616";
        const channelId = "1353712107031625788";
        try {
            if (guild.id !== guildId) return;

            await guild.members.fetch();
            const uniqueMemberIds = new Set();

            guild.members.cache.forEach(member => {
                const hasFts = member.roles.cache.has(ftsRole);
                const hasTrial = member.roles.cache.has(ftsTrialRole);
                if (hasFts || hasTrial) uniqueMemberIds.add(member.id);
            });

            const count = uniqueMemberIds.size;

            await guild.client.user.setPresence({
                activities: [{ name: `Team Members: ${count}`, type: ActivityType.Watching }]
            });

            const channel = await guild.channels.fetch(channelId);
            if (!channel) return;

            if (count === FTSCountOld) return;
            FTSCountOld = count;


            await channel.setName(`Team Members: ${count}`);
            console.log(chalk.green(`Updated Team Members: ${count}`));

        } catch (error) {
            console.error(chalk.red.bold.underline(`Error updating Team Members for guild ${guild?.name}:`, error));
        }
    },

    updateEventDrivers: async (guild) => {
        try {
            const roleId = '1291101540718870558';
            const channelId = '1358444535998316595';

            await guild.members.fetch();
            const role = await guild.roles.fetch(roleId);
            if (!role) return;

            const count = role.members.size;
            const channel = await guild.channels.fetch(channelId);
            if (!channel) return;
            if( count===EventCountOld) return;
            else if(count !== EventCountOld){
                await channel.setName(`Event Drivers: ${count}`);
                console.log(`Updated Event Drivers channel: ${count}`);
                EventCountOld = count;
            }
        } catch (err) {
            console.error(chalk.red.bold.underline('Error in updateEventDrivers:', err));
        }
    }
};
