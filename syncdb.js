const Guild = require('./models/guild');

(async () => {
    try {
        await Guild.sync({ alter: true });
        console.log('Guild table synced');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
})();
