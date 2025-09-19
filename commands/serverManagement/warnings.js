const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("Show all warnings of a user")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to check warnings for")
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");

        // Fetch last 20 active warnings for the user
        const warnings = await Warning.findAll({
            where: { userId: target.id, active: true },
            order: [['id', 'DESC']],
            limit: 20
        });

        if (!warnings.length) {
            return interaction.reply({ content: `${target.tag} has no active warnings.`, ephemeral: true });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${target.tag} (${warnings.length})`)
            .setColor("Red")
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        for (const warn of warnings) {
            const unixTimestamp = Math.floor(new Date(warn.timestamp).getTime() / 1000);

            embed.addFields({
                name: `⏱ <t:${unixTimestamp}:F> | Warn ID (${warn.id})`,
                value: `${warn.reason}\nBy <@${warn.moderatorId}>`
            });
        }

        // Ephemeral = only visible to the command user
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};