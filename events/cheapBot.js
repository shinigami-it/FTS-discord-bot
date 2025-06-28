const fs = require('fs');
const path = require('path');

const responses = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils', 'cheapResponse.json'), 'utf-8'));

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    for (const entry of responses) {
      const triggers = Array.isArray(entry.trigger) ? entry.trigger : [entry.trigger];

      if (triggers.some(trigger => msg.includes(trigger.toLowerCase()))) {
        const randomIndex = Math.floor(Math.random() * entry.responses.length);
        const reply = entry.responses[randomIndex];

        await message.react('🇮🇱');
        await message.reply(reply);
        break;
      }
    }
  }
};
