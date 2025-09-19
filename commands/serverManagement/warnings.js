const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("Show warnings")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to check warnings for")
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName("all")
                .setDescription("Show the last 20 warnings from all users")
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const showAll = interaction.options.getBoolean("all");

        let warnings;

        if (showAll) {
            // Fetch last 20 warnings from all users
            warnings = await Warning.findAll({
                order: [['id', 'DESC']],
                limit: 20
            });
            if (!warnings.length) return interaction.reply({ content: "No warnings found.", ephemeral: true });
        } else if (target) {
            // Fetch last 20 active warnings for the specific user
            warnings = await Warning.findAll({
                where: { userId: target.id, active: true },
                order: [['id', 'DESC']],
                limit: 20
            });
            if (!warnings.length) return interaction.reply({ content: `${target.tag} has no active warnings.`, ephemeral: true });
        } else {
            return interaction.reply({ content: "Please specify a user or set all to true.", ephemeral: true });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(showAll ? `Last 20 warnings from all users` : `Warnings for ${target.tag} (${warnings.length})`)
            .setColor("Red")
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        for (const warn of warnings) {
            const unixTimestamp = Math.floor(new Date(warn.timestamp).getTime() / 1000);
            embed.addFields({
                name: `⏱ <t:${unixTimestamp}:F> | Warn ID (${warn.id})`,
                value: `${warn.reason}\nBy <@${warn.moderatorId}>${!showAll ? "" : ` | User: <@${warn.userId}>`}`
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};