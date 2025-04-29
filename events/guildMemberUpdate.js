const { updateTeamMembers, updateEventDrivers } = require('../utils/updateStats');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            const roleIdsToWatch = ['1291101540718870558', '1287721449057947669', '1290079131807256616'];
            let hasChange = false;

            roleIdsToWatch.forEach(roleId => {
                if (oldMember.roles.cache.has(roleId) !== newMember.roles.cache.has(roleId)) {
                    hasChange = true;
                }
            });

            if (hasChange) {
                await updateEventDrivers(newMember.guild);
                await updateTeamMembers(newMember.guild);
            }
        } catch (err) {
            console.error('Error in guildMemberUpdate event handler:', err);
        }
    }
};
