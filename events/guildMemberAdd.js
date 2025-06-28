const Guild = require('../models/guild');
const { updateEventDrivers, updateTeamMembers } = require('../utils/updateStats');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            const dbGuild = await Guild.findOne({ where: { id: member.guild.id } });

            if (dbGuild.welcomeRoleId) {
                const welcomeRole = await member.guild.roles.fetch(dbGuild.welcomeRoleId);
                await member.roles.add(welcomeRole);
            }

            const rulesChannel = await member.guild.channels.fetch(dbGuild.rulesId);
            if (dbGuild.welcomeChannelId) {
                const welcomeChannel = await member.guild.channels.fetch(dbGuild.welcomeChannelId);
                await welcomeChannel.send(`${member.user}, welcome to ${member.guild.name}! Please read our rules under ${rulesChannel}`);
            }

            const memberCountChannelId = dbGuild.memberCountChannelId;
            const memberCountChannel = await member.guild.channels.fetch(memberCountChannelId);
            if (memberCountChannel) {
                await memberCountChannel.setName(`Members: ${member.guild.memberCount}`);
            }

            await updateEventDrivers(member.guild);
            await updateTeamMembers(member.guild);
        } catch (err) {
            console.error('Error in guildMemberAdd event handler:', err);
        }
    }
};
