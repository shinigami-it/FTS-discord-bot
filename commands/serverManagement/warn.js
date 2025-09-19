const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

const FTS_ROLE = "1287721449057947669";
const FTS_TRIAL_ROLE = "1290079131807256616";
const MODERATOR_ROLE_ID = "1167925164374249543";
const MOD_CHANNEL_ID = "1150146916194193640";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Manage warnings")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Warn a user")
                .addUserOption(option => option.setName("user").setDescription("User to warn").setRequired(true))
                .addStringOption(option => option.setName("reason").setDescription("Reason for warning").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Deactivate a warning")
                .addIntegerOption(option => option.setName("warnid").setDescription("ID of warning").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("activate")
                .setDescription("Reactivate a warning")
                .addIntegerOption(option => option.setName("warnid").setDescription("ID of warning").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("Show last 20 active warnings (optionally for a user)")
                .addUserOption(option => option.setName("user").setDescription("Optional: specific user"))
        )
        .addSubcommand(sub =>
            sub.setName("list_inactive")
                .setDescription("Show last 20 inactive warnings (optionally for a user)")
                .addUserOption(option => option.setName("user").setDescription("Optional: specific user"))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "add") {
            const target = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");
            const moderator = interaction.user;
            const member = await interaction.guild.members.fetch(target.id);

            await Warning.create({ userId: target.id, moderatorId: moderator.id, reason });

            const warnings = await Warning.findAll({ where: { userId: target.id }, order: [['id', 'DESC']] });

            const hasFTS = member.roles.cache.has(FTS_ROLE);
            const hasTrial = member.roles.cache.has(FTS_TRIAL_ROLE);

            if (warnings.length >= 3) {
                if (hasFTS) {
                    await member.roles.remove(FTS_ROLE);
                    await member.roles.add(FTS_TRIAL_ROLE);
                } else if (hasTrial) {
                    const modChannel = interaction.guild.channels.cache.get(MOD_CHANNEL_ID);
                    const modRole = interaction.guild.roles.cache.get(MODERATOR_ROLE_ID);
                    if (modChannel) {
                        const modEmbed = new EmbedBuilder()
                            .setTitle(`⚠ User reached 3 warnings while in Trial role`)
                            .setColor("Orange")
                            .addFields(
                                { name: "User", value: `<@${target.id}>`, inline: true },
                                { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
                                { name: "Reason", value: reason },
                                { name: "Total Warnings", value: `${warnings.length}` }
                            )
                            .setTimestamp();
                        await modChannel.send({ content: `${modRole}`, embeds: [modEmbed] });
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`${warnings.length} Warnings (${warnings.length}/3)`)
                .setColor("Red")
                .setFooter({ text: `Requested by ${moderator.tag}` });

            for (const warn of warnings) {
                const timestamp = new Date(warn.timestamp);
                timestamp.setHours(timestamp.getHours() + 2);
                embed.addFields({
                    name: `⏱ ${timestamp.toLocaleString()} | Warn ID (${warn.id}) - By <@${warn.moderatorId}>`,
                    value: warn.reason
                });
            }

            await interaction.reply({ embeds: [embed] });

        } else if (sub === "remove" || sub === "activate") {
            const warnId = interaction.options.getInteger("warnid");
            const warn = await Warning.findByPk(warnId);
            if (!warn) return interaction.reply({ content: `Warning ID ${warnId} not found.`, ephemeral: true });

            if (sub === "remove") {
                if (!warn.active) return interaction.reply({ content: `Warning ID ${warnId} is already deactivated.`, ephemeral: true });
                await Warning.update({ active: false }, { where: { id: warnId } });
                await interaction.reply({ content: `Warning ID ${warnId} deactivated.`, ephemeral: true });
            } else {
                if (warn.active) return interaction.reply({ content: `Warning ID ${warnId} is already active.`, ephemeral: true });
                await Warning.update({ active: true }, { where: { id: warnId } });
                await interaction.reply({ content: `Warning ID ${warnId} reactivated.`, ephemeral: true });
            }

        } else if (sub === "list" || sub === "list_inactive") {
            const target = interaction.options.getUser("user");
            const activeOnly = sub === "list";

            const whereClause = { active: activeOnly ? 1 : 0 };
            if (target) whereClause.userId = target.id;

            const warnings = await Warning.findAll({
                where: whereClause,
                order: [['id', 'DESC']],
                limit: 20
            });

            if (!warnings.length) return interaction.reply({ content: "No warnings found.", ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle(target ? `${activeOnly ? 'Active' : 'Inactive'} warnings for ${target.tag}` : `Last 20 ${activeOnly ? 'active' : 'inactive'} warnings`)
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