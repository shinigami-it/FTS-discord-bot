module.exports = async (client) => {
    const FTS_SERVER_ID = '1132332567459278878';
    const KR_SERVER_ID = '1419991309300797444';

    const rolesServer1 = {
        FTS: '1287721449057947669',
        FTS_TRIAL: '1290079131807256616',
        KANSAI_DISPLAY: '1424114097632317450'
    };

    const rolesServer2 = {
        KANSAI: '1419991309728616505',
        KANSAI_TRIAL: '1419991309728616504',
        FTS_DISPLAY: '1424114872689365092'
    };

    async function syncMemberRoles(member) {
        try {
            if (!member) return;
            member = await member.fetch({ force: true }).catch(() => member);

            // Server 1 → Server 2
            if (member.guild.id === FTS_SERVER_ID) {
                const hasFTSorTrial = member.roles.cache.has(rolesServer1.FTS) || member.roles.cache.has(rolesServer1.FTS_TRIAL);
                const server2 = client.guilds.cache.get(KR_SERVER_ID);
                if (!server2) return;
                const member2 = await server2.members.fetch(member.id).catch(() => null);
                if (!member2) return;

                if (hasFTSorTrial) {
                    if (!member2.roles.cache.has(rolesServer2.FTS_DISPLAY))
                        await member2.roles.add(rolesServer2.FTS_DISPLAY).catch(() => {});
                } else {
                    if (member2.roles.cache.has(rolesServer2.FTS_DISPLAY))
                        await member2.roles.remove(rolesServer2.FTS_DISPLAY).catch(() => {});
                }
            }

            // Server 2 → Server 1
            if (member.guild.id === KR_SERVER_ID) {
                const hasKRorTrial = member.roles.cache.has(rolesServer2.KANSAI) || member.roles.cache.has(rolesServer2.KANSAI_TRIAL);
                const server1 = client.guilds.cache.get(FTS_SERVER_ID);
                if (!server1) return;
                const member1 = await server1.members.fetch(member.id).catch(() => null);
                if (!member1) return;

                if (hasKRorTrial) {
                    if (!member1.roles.cache.has(rolesServer1.KANSAI_DISPLAY))
                        await member1.roles.add(rolesServer1.KANSAI_DISPLAY).catch(() => {});
                } else {
                    if (member1.roles.cache.has(rolesServer1.KANSAI_DISPLAY))
                        await member1.roles.remove(rolesServer1.KANSAI_DISPLAY).catch(() => {});
                }
            }
        } catch (err) {
            console.error('Role sync error:', err);
        }
    }

    client.on('guildMemberUpdate', async (_, newMember) => {
        await syncMemberRoles(newMember);
    });

    client.on('guildMemberAdd', async (member) => {
        await syncMemberRoles(member);
    });

    // Full sync on startup
    for (const guildId of [FTS_SERVER_ID, KR_SERVER_ID]) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;
        const members = await guild.members.fetch({ force: true });
        for (const member of members.values()) {
            await syncMemberRoles(member);
        }
    }

    console.log('FTS-KR role sync initialized');
};