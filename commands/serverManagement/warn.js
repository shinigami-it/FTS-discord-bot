const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warning = require("../models/warning");

const FTS_ROLE = "1287721449057947669";
const FTS_TRIAL_ROLE = "1290079131807256616";
const MODERATOR_ROLE_ID = "1167925164374249543";
const MOD_CHANNEL_ID = "1150146916194193640";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a user")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to warn")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the warning")
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        const moderator = interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        // Save the warning
        await Warning.create({
            userId: target.id,
            moderatorId: moderator.id,
            reason: reason
        });

        // Fetch all warnings for this user
        const warnings = await Warning.findAll({
            where: { userId: target.id },
            order: [['id', 'DESC']]
        });

        // Check roles
        const hasFTS = member.roles.cache.has(FTS_ROLE);
        const hasTrial = member.roles.cache.has(FTS_TRIAL_ROLE);

        if (warnings.length >= 3) {
            if (hasFTS) {
                await member.roles.remove(FTS_ROLE);
                await member.roles.add(FTS_TRIAL_ROLE);
            } else if (hasTrial) {
                // Send mod notification to specific channel
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

        // Create embed for the command reply
        const embed = new EmbedBuilder()
            .setTitle(`${warnings.length} Warnings (${warnings.length}/3)`)
            .setColor("Red")
            .setFooter({ text: `Requested by ${moderator.tag}` });

        for (const warn of warnings) {
            embed.addFields({
                name: `⏱ ${warn.timestamp.toLocaleString()} | Warn ID (${warn.id}) - By <@${warn.moderatorId}>`,
                value: warn.reason
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};