const { updateTeamMembers, updateEventDrivers } = require('../utils/updateStats');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            const dbGuild = await Guild.findOne({ where: { id: member.guild.id } });

            const memberCountChannelId = dbGuild.memberCountChannelId;
            const memberCountChannel = await member.guild.channels.fetch(memberCountChannelId);
            if (memberCountChannel) {
                await memberCountChannel.setName(`Members: ${member.guild.memberCount}`);
            }

            await updateTeamMembers(member.guild);
            await updateEventDrivers(member.guild);
        } catch (err) {
            console.error('Error in guildMemberRemove event handler:', err);
        }
    }
};
