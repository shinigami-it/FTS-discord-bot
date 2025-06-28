const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Guild = require('../../models/guild');

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

        } catch (error) {
            console.error('Error updating guild data:', error);
            await interaction.editReply({ content: 'An error occurred while updating guild data', ephemeral: true });
        }
    },
};
