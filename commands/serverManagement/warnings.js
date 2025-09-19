const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("Show the last 20 active warnings (optionally for a specific user)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Optional: Show warnings for a specific user")
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");

        // Build where clause
        const whereClause = { active: 1 }; // active = 1
        if (target) whereClause.userId = target.id;

        // Fetch last 20 active warnings
        const warnings = await Warning.findAll({
            where: whereClause,
            order: [['id', 'DESC']],
            limit: 20
        });

        if (!warnings.length) {
            return interaction.reply({
                content: target ? `${target.tag} has no active warnings.` : "No active warnings found.",
                ephemeral: true
            });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(target ? `Active warnings for ${target.tag} (${warnings.length})` : `Last 20 active warnings`)
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