const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Manage user warnings")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Add a warning to a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to warn")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for the warning")
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName("deactivate")
                .setDescription("Deactivate a specific warning")
                .addIntegerOption(option =>
                    option.setName("warnid")
                        .setDescription("ID of the warning to deactivate")
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName("activate")
                .setDescription("Activate a specific warning")
                .addIntegerOption(option =>
                    option.setName("warnid")
                        .setDescription("ID of the warning to activate")
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("List warnings")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Optional: Show warnings for a specific user")
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName("inactive")
                        .setDescription("Show only deactivated warnings")
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "add") {
            const target = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");
            const moderator = interaction.user;

            await Warning.create({
                userId: target.id,
                moderatorId: moderator.id,
                reason: reason
            });

            const embed = new EmbedBuilder()
                .setTitle(`Warning Added`)
                .setColor("Green")
                .addFields(
                    { name: "User", value: `<@${target.id}>`, inline: true },
                    { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
                    { name: "Reason", value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === "deactivate" || subcommand === "activate") {
            const warnId = interaction.options.getInteger("warnid");
            const warn = await Warning.findByPk(warnId);
            if (!warn) return interaction.reply({ content: `Warning ID ${warnId} not found.`, ephemeral: true });

            const newActive = subcommand === "activate";
            if (warn.active === newActive) return interaction.reply({ content: `Warning ID ${warnId} is already ${newActive ? "active" : "deactivated"}.`, ephemeral: true });

            await Warning.update({ active: newActive }, { where: { id: warnId } });

            const embed = new EmbedBuilder()
                .setTitle(`Warning ${newActive ? "Activated" : "Deactivated"}`)
                .setColor(newActive ? "Green" : "Red")
                .addFields(
                    { name: "Warn ID", value: `${warn.id}`, inline: true },
                    { name: "User", value: `<@${warn.userId}>`, inline: true },
                    { name: newActive ? "Activated by" : "Deactivated by", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Reason", value: warn.reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === "list") {
            const target = interaction.options.getUser("user");
            const inactive = interaction.options.getBoolean("inactive") ?? false;

            let where = { active: !inactive };
            if (target) where.userId = target.id;

            const warnings = await Warning.findAll({
                where,
                order: [['id', 'DESC']],
                limit: 20
            });

            if (!warnings.length) return interaction.reply({ content: "No warnings found.", ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle(target ? `Warnings for ${target.tag} (${warnings.length})` : `Last 20 ${inactive ? "inactive" : "active"} warnings`)
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
    }
};