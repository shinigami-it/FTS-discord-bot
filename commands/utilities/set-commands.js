const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Guild = require('../../models/guild');
const SteamChannel = require('../../models/steamChannel');
const SteamGame = require('../../models/steamGame');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Set server configurations')
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Set the welcome role and channel for this guild')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to give new members upon joining')
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the welcome message in')
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rules-channel')
                .setDescription('Set the rules channel for this guild')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to set as the rules channel')
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('streamer')
                .setDescription('Set the streamer settings for this guild')
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('Name of the streamer')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the streaming message in')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to ping in the streaming message')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('embed-color')
                        .setDescription('Embed color (default: #6400ff)')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('steam-news')
                .setDescription('Set Steam news settings for this guild')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send Steam news')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('game-ids')
                        .setDescription('Comma separated list of Steam game IDs')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const { options, member, guild } = interaction;

            if (!guild || !guild.available) {
                return interaction.editReply({ content: 'Guild not available', ephemeral: true });
            }

            if (guild.ownerId !== member.id) {
                return interaction.editReply({ content: 'Only the server owner can use this command', ephemeral: true });
            }

            let guildData = await Guild.findOne({ where: { id: guild.id } });

            if (!guildData) {
                guildData = new Guild({ id: guild.id });
            }

            const subcommand = options.getSubcommand();

            if (subcommand === 'welcome') {
                const role = options.getRole('role');
                const channel = options.getChannel('channel');

                guildData.welcomeRoleId = role ? role.id : null;
                guildData.welcomeChannelId = channel ? channel.id : null;

                await guildData.save();
                return interaction.editReply({ content: `Welcome role set to ${role} and welcome channel set to ${channel}`, ephemeral: true });
            }

            if (subcommand === 'rules-channel') {
                const channel = options.getChannel('channel');
                guildData.rulesId = channel ? channel.id : null;
                await guildData.save();
                return interaction.editReply({ content: `Rules channel set to ${channel}`, ephemeral: true });
            }

            if (subcommand === 'steam-news') {
                const channel = options.getChannel('channel');
                const gameIds = options.getString('game-ids').split(',').map(id => id.trim());

                let steamChannel = await SteamChannel.findOne({ where: { guildId: guild.id } });

                if (!steamChannel) {
                    steamChannel = new SteamChannel({
                        guildId: guild.id,
                        channelId: channel.id,
                    });
                } else {
                    steamChannel.channelId = channel.id;
                }

                const steamGames = await Promise.all(gameIds.map(async (gameId) => {
                    let steamGame = await SteamGame.findOne({ where: { appId: gameId, guildId: guild.id } });
                    if (!steamGame) {
                        steamGame = new SteamGame({
                            appId: gameId,
                            guildId: guild.id,
                        });
                    }
                    return steamGame.save();
                }));

                await steamChannel.save();
                await interaction.editReply({ content: `Steam news channel set to ${channel} and game IDs updated`, ephemeral: true });
            }

        } catch (error) {
            console.error('Error updating guild data:', error);
            await interaction.editReply({ content: 'An error occurred while updating guild data', ephemeral: true });
        }
    },
};
