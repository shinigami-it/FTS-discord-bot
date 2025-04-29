const Guild = require('./models/guild');
const steamChannel = require('./models/steamChannel');
const steamGame = require('./models/steamGame');
const twitchStreamer = require('./models/twitchStreamer');

(async () => {
    try {
        await Guild.sync({ alter: true });
        console.log('Guild table synced');
        
        await steamChannel.sync({ alter: true });
        console.log('steamChannel table synced');
        
        await steamGame.sync({ alter: true });
        console.log('steamGame table synced');
        
        await twitchStreamer.sync({ alter: true });
        console.log('twitchStreamer table synced');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
})();
