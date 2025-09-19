const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("Show the last 20 warnings (optionally for a specific user)")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Optional: Show warnings for a specific user")
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");

        let warnings;

        if (target) {
            // Fetch last 20 active warnings for the specific user
            warnings = await Warning.findAll({
                where: { userId: target.id, active: 1 },
                order: [['id', 'DESC']],
                limit: 20
            });
            if (!warnings.length) return interaction.reply({ content: `${target.tag} has no active warnings.`, ephemeral: true });
        } else {
            // Fetch last 20 warnings from all users
            warnings = await Warning.findAll({
                order: [['id', 'DESC']],
                limit: 20
            });
            if (!warnings.length) return interaction.reply({ content: "No warnings found.", ephemeral: true });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(target ? `Warnings for ${target.tag} (${warnings.length})` : "Last 20 warnings from all users")
            .setColor("#ff0000")
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        for (const warn of warnings) {
            const unixTimestamp = Math.floor(new Date(warn.timestamp).getTime() / 1000);
            embed.addFields({
                name: `⏱ <t:${unixTimestamp}:F>`,
                value: `Warn ID (${warn.id}) - By <@${warn.moderatorId}>\nUser: <@${warn.userId}>\n\`\`\`${warn.reason}\`\`\``
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};