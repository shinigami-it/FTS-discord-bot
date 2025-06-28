const fs = require('fs');
const path = require('path');

const responses = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils', 'eggResponse.json'), 'utf-8'));

const responseIndexes = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    for (let i = 0; i < responses.length; i++) {
      const entry = responses[i];
      const triggers = Array.isArray(entry.trigger) ? entry.trigger : [entry.trigger];

      if (triggers.some(trigger => msg.includes(trigger.toLowerCase()))) {
        const currentIndex = responseIndexes.get(i) || 0;
        const reply = entry.responses[currentIndex];
        const nextIndex = (currentIndex + 1) % entry.responses.length;
        responseIndexes.set(i, nextIndex);
        message.reply(reply);
        break;
      }
    }
  }
};
