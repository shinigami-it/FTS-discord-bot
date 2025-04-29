const { checkSteamNews } = require('../utils/steamNews');
const SteamChannel = require('../models/steamChannel');

async function checkNewsPeriodically(client) {
    const steamChannels = await SteamChannel.findAll();

    for (const steamChannel of steamChannels) {
        const guild = client.guilds.cache.get(steamChannel.guildId);

        if (!guild) {
            console.log(`Guild with ID ${steamChannel.guildId} not found in cache.`);
            continue;
        }

        const channel = guild.channels.cache.get(steamChannel.channelId); 

        if (channel) {
            await checkSteamNews(steamChannel, channel);
        } else {
            console.log(`Channel with ID ${steamChannel.channelId} not found in guild ${steamChannel.guildId}`);
        }
    }
}

module.exports = { checkNewsPeriodically };
