const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../../models/warning");

// --- CONFIG CONSTANTS ---
const FTS_ROLE_ID = "1287721449057947669";
const FTS_TRIAL_ROLE_ID = "1290079131807256616";
const MODERATOR_ROLE_ID = "1167925164374249543";
const MOD_CHANNEL_ID = "1150146916194193640";
// ------------------------

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
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName("permanent")
                        .setDescription("Should this warning never expire?")
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName("deactivate")
                .setDescription("Deactivate a specific warning")
                .addIntegerOption(option =>
                    option.setName("warnid")
                        .setDescription("ID of the warning to deactivate")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for deactivating the warning")
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
        const guildId = interaction.guild.id;

        if (subcommand === "add") {
            const target = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");
            const permanent = interaction.options.getBoolean("permanent") ?? false;
            const moderator = interaction.user;
            const member = await interaction.guild.members.fetch(target.id);

            const now = new Date();
            const expires = permanent ? null : new Date(now.getTime() + 30*24*60*60*1000); // +30 Tage

            await Warning.create({
                guildId,
                userId: target.id,
                moderatorId: moderator.id,
                reason: reason,
                active: true,
                timestamp: now,
                expiresAt: expires
            });

            // Fetch active warnings for FTS role logic
            const activeWarnings = await Warning.findAll({
                where: { guildId, userId: target.id, active: true },
                order: [['id', 'DESC']]
            });

            // Handle FTS roles if needed
            const hasFTS = member.roles.cache.has(FTS_ROLE_ID);
            const hasTrial = member.roles.cache.has(FTS_TRIAL_ROLE_ID);

            if (activeWarnings.length >= 3) {
                if (hasFTS) {
                    await member.roles.remove(FTS_ROLE_ID);
                    await member.roles.add(FTS_TRIAL_ROLE_ID);
                } else if (hasTrial) {
                    const modChannel = interaction.guild.channels.cache.get(MOD_CHANNEL_ID);
                    const modRole = interaction.guild.roles.cache.get(MODERATOR_ROLE_ID);
                    if (modChannel) {
                        const modEmbed = new EmbedBuilder()
                            .setTitle("⚠ User reached 3 warnings while in Trial role")
                            .setColor("Orange")
                            .addFields(
                                { name: "User", value: `<@${target.id}>`, inline: true },
                                { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
                                { name: "Total Active Warnings", value: `${activeWarnings.length}` }
                            )
                            .setTimestamp();
                        await modChannel.send({ content: `${modRole}`, embeds: [modEmbed] });
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`Warning Added`)
                .setColor("Green")
                .addFields(
                    { name: "User", value: `<@${target.id}>`, inline: true },
                    { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
                    { name: "Reason", value: reason },
                    { name: "Timestamp", value: `<t:${Math.floor(now.getTime()/1000)}:F>` },
                    { name: "Expires", value: permanent ? "❌ Permanent" : `<t:${Math.floor(expires.getTime()/1000)}:F>` }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === "deactivate") {
            const warnId = interaction.options.getInteger("warnid");
            const reason = interaction.options.getString("reason");
                
            const warn = await Warning.findOne({ where: { id: warnId, guildId } });
            if (!warn) return interaction.reply({ content: `Warning ID ${warnId} not found in this server.`, ephemeral: true });
                
            if (!warn.active) {
                return interaction.reply({ content: `Warning ID ${warnId} is already deactivated.`, ephemeral: true });
            }
        
            await Warning.update(
                { active: false, deactivationReason: reason },
                { where: { id: warnId, guildId } }
            );
        
            const embed = new EmbedBuilder()
                .setTitle(`Warning Deactivated`)
                .setColor("Red")
                .addFields(
                    { name: "Warn ID", value: `${warn.id}`, inline: true },
                    { name: "User", value: `<@${warn.userId}>`, inline: true },
                    { name: "Deactivated by", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Original Reason", value: warn.reason },
                    { name: "Deactivation Reason", value: reason }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};