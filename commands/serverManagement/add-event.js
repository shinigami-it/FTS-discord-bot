const mysql = require('mysql2/promise');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { URL } = require('url');
const { DateTime } = require('luxon');

function parseMysqlUrl(urlString) {
  const url = new URL(urlString);
  return {
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
  };
}

const ALLOWED_ROLE_IDS = ['1167925164374249543', '1167925244032462858'];

function hasPermission(interaction) {
  const isOwner = interaction.user.id === process.env.BOT_OWNER;
  const hasAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  const hasRole = ALLOWED_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
  return isOwner || hasAdmin || hasRole;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-event')
    .setDescription('Add an event')
    .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Description').setRequired(true))
    .addStringOption(o => o.setName('start_timestamp').setDescription('Start time <t:xxx:F>').setRequired(true))
    .addStringOption(o => o.setName('end_timestamp').setDescription('End time <t:xxx:F>').setRequired(true))
    .addChannelOption(o => o.setName('location').setDescription('Voice channel').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');

    if (title.length > 50) {
      return interaction.reply({ content: 'Title too long (max 50 characters).', ephemeral: true });
    }

    if (description.length > 300) {
      return interaction.reply({ content: 'Description too long (max 300 characters).', ephemeral: true });
    }

    const startInput = interaction.options.getString('start_timestamp');
    const endInput = interaction.options.getString('end_timestamp');
    const location = interaction.options.getChannel('location');

    const startMatch = startInput.match(/<t:(\d+):[a-zA-Z]>/);
    const endMatch = endInput.match(/<t:(\d+):[a-zA-Z]>/);
    if (!startMatch || !endMatch) {
      return interaction.reply({ content: 'Invalid timestamp format. Use e.g. <t:1755367200:F>', ephemeral: true });
    }

    const startTimestamp = parseInt(startMatch[1]) * 1000;
    const endTimestamp = parseInt(endMatch[1]) * 1000;

    const start = DateTime.fromMillis(startTimestamp, { zone: 'Europe/Berlin' });
    const end = DateTime.fromMillis(endTimestamp, { zone: 'Europe/Berlin' });

    const date = start.toISODate();
    const timestart = start.toFormat('HH:mm');
    const timeend = end.toFormat('HH:mm');

    const config = parseMysqlUrl(process.env.MYSQL_URL_WEBSITE);
    const conn = await mysql.createConnection(config);
    await conn.execute(
      'INSERT INTO calendar (title, description, date, timestart, timeend) VALUES (?, ?, ?, ?, ?)',
      [title, description, date, timestart, timeend]
    );
    await conn.end();

    await interaction.guild.scheduledEvents.create({
      name: title,
      scheduledStartTime: start.toJSDate(),
      scheduledEndTime: end.toJSDate(),
      privacyLevel: 2,
      entityType: 2,
      entityMetadata: { location: location.id },
      description: description,
      channel: location
    });

    await interaction.reply(`Event **${title}** created for <t:${Math.floor(startTimestamp / 1000)}:F>`);
  }
};