const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Cleans messages from a channel.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption((option) =>
			option
				.setName("number_of_messages")
				.setDescription("Number of messages to delete.")
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100)
		)
		.addUserOption((option) =>
			option
				.setName("filter_by_user")
				.setDescription("Delete messages from a specific user.")
		)
		.addRoleOption((option) =>
			option
				.setName("filter_by_role")
				.setDescription("Delete messages from members with a specific role.")
		)
		.addBooleanOption((option) =>
			option
				.setName("filter_by_bots")
				.setDescription("Delete messages sent by bots.")
		),

	async execute(interaction) {
		const channel = interaction.channel;

		if (!channel.isTextBased()) {
			return interaction.reply({
				content: "❌ This command only works in text channels.",
				ephemeral: true,
			});
		}

		await interaction.deferReply({ ephemeral: true });

		const amount = interaction.options.getInteger("number_of_messages");
		const user = interaction.options.getUser("filter_by_user");
		const role = interaction.options.getRole("filter_by_role");
		const botsOnly = interaction.options.getBoolean("filter_by_bots");

		const statusMessage = await channel.send("⏳ Deleting messages...");

		let messages = await channel.messages.fetch({ limit: amount });

		if (user) messages = messages.filter((m) => m.author.id === user.id);
		if (role) messages = messages.filter((m) => m.member && m.member.roles.cache.has(role.id));
		if (botsOnly) messages = messages.filter((m) => m.author.bot);

		const deleted = await channel.bulkDelete(messages, true);
		const deletedCount = deleted.size;

		let text;
		if (deletedCount === 0) text = "⚠️ No messages could be deleted.";
		else if (deletedCount === 1) text = "🧹 1 message has been deleted.";
		else text = `🧹 ${deletedCount} messages have been deleted.`;

		await statusMessage.edit(text);

		setTimeout(() => statusMessage.delete().catch(() => {}), 2000);

		await interaction.editReply({ content: "✅ Finished!", ephemeral: true });
	},
};