const Guild = require('./models/guild');
const Warning = require('./models/warning');

(async () => {
    try {
        await Guild.sync({ alter: true });
        console.log('Guild table synced');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
    
    try {
        await Warning.sync({ alter: true });
        console.log('Warning table synced');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
})();
