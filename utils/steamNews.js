const axios = require('axios');
const SteamGame = require('../models/steamGame');
const SteamChannel = require('../models/steamChannel');
const he = require('he');
const dotenv = require('dotenv');
dotenv.config();

function removeHtmlAndBbcodes(str) {
    str = str.replace(/<[^>]*>/g, '');
    str = str.replace(/\[\/?([a-zA-Z0-9]+)(=[^\]]*)?\]/g, '');
    str = str.replace(/\{STEAM_CLAN_IMAGE\}\/\d+\/[a-f0-9]+\.png/g, '');
    return str;
}

function extractSteamImageLinks(str) {
    const regex = /\{STEAM_CLAN_IMAGE\}\/([a-zA-Z0-9]+\/[a-zA-Z0-9]+\.jpg)/g;
    return str.replace(regex, (match, p1) => {
        return `https://steamcommunity.com/sharedfiles/filedetails/?id=${p1}`;
    });
}

async function checkSteamNews(steamChannel, channel) {
    const steamGames = await SteamGame.findAll({ where: { guildId: steamChannel.guildId } });

    if (!steamGames || steamGames.length === 0) return;

    const steamApiKey = process.env.STEAM_API_KEY;

    for (const steamGame of steamGames) {
        const appId = steamGame.appId;
        const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&key=${steamApiKey}`;
        
        try {
            const response = await axios.get(url);
            const newsItems = response.data.appnews.newsitems;

            if (!newsItems || newsItems.length === 0) continue;

            const latestNews = newsItems[0];
            let cleanDescription = removeHtmlAndBbcodes(latestNews.contents);

            cleanDescription = extractSteamImageLinks(cleanDescription);

            cleanDescription = he.decode(cleanDescription);

            if (latestNews.gid === steamGame.lastNewsId) continue;

            const gameUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
            const gameResponse = await axios.get(gameUrl);
            const gameName = gameResponse.data[appId].data.name;

            await channel.send({
                embeds: [{
                    title: latestNews.title,
                    url: latestNews.url,
                    description: cleanDescription,
                    color: 0x6400ff,
                    timestamp: new Date(latestNews.date * 1000),
                    footer: { text: 'Yuki' },
                    image: {
                        url: `https://shared.fastly.steamstatic.com//store_item_assets/steam/apps/${appId}/header.jpg`
                    },
                    author: {
                        name: gameName,
                        url: "https://www.yukisama.de"
                    }
                }]
            });

            await SteamGame.update({ lastNewsId: latestNews.gid }, {
                where: { appId: steamGame.appId }
            });
        } catch (error) {
            console.error(`Error checking Steam news for appId ${appId}:`, error);
        }
    }
}

module.exports = { checkSteamNews };
