const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn_remove")
        .setDescription("Deactivate a specific warning from a user")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption(option =>
            option.setName("warnid")
                .setDescription("ID of the warning to deactivate")
                .setRequired(true)),

    async execute(interaction) {
        const warnId = interaction.options.getInteger("warnid");

        // Find warning
        const warn = await Warning.findByPk(warnId);
        if (!warn) return interaction.reply({ content: `Warning ID ${warnId} not found.`, ephemeral: true });
        if (!warn.active) return interaction.reply({ content: `Warning ID ${warnId} is already deactivated.`, ephemeral: true });

        // Deactivate warning
        await Warning.update({ active: false }, { where: { id: warnId } });

        const embed = new EmbedBuilder()
            .setTitle(`Warning Deactivated`)
            .setColor("Green")
            .addFields(
                { name: "Warn ID", value: `${warn.id}`, inline: true },
                { name: "User", value: `<@${warn.userId}>`, inline: true },
                { name: "Deactivated by", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Reason", value: warn.reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};