const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Cleans messages from a channel.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addSubcommand((sub) =>
			sub
				.setName("number_of_messages")
				.setDescription("Delete a specific number of messages.")
				.addIntegerOption((option) =>
					option
						.setName("amount")
						.setDescription("How many messages to delete")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("filter_by_user")
				.setDescription("Delete messages from a specific user.")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Which user's messages to delete")
						.setRequired(true)
				)
				.addIntegerOption((option) =>
					option
						.setName("amount")
						.setDescription("How many recent messages to scan")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("filter_by_role")
				.setDescription("Delete messages from members with a specific role.")
				.addRoleOption((option) =>
					option
						.setName("role")
						.setDescription("Which role to target")
						.setRequired(true)
				)
				.addIntegerOption((option) =>
					option
						.setName("amount")
						.setDescription("How many recent messages to scan")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("filter_by_bots")
				.setDescription("Delete messages sent by bots.")
				.addIntegerOption((option) =>
					option
						.setName("amount")
						.setDescription("How many recent messages to scan")
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100)
				)
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const channel = interaction.channel;

		if (!channel.isTextBased()) {
			return interaction.reply({ content: "❌ This command only works in text channels.", ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		// Step 1: Send status message
		const statusMessage = await channel.send("⏳ Deleting messages...");

		let deletedCount = 0;

		if (subcommand === "number_of_messages") {
			const amount = interaction.options.getInteger("amount");
			const deleted = await channel.bulkDelete(amount, true);
			deletedCount = deleted.size;
		}

		else if (subcommand === "filter_by_user") {
			const user = interaction.options.getUser("user");
			const amount = interaction.options.getInteger("amount");
			const messages = await channel.messages.fetch({ limit: amount });
			const filtered = messages.filter(m => m.author.id === user.id);
			const deleted = await channel.bulkDelete(filtered, true);
			deletedCount = deleted.size;
		}

		else if (subcommand === "filter_by_role") {
			const role = interaction.options.getRole("role");
			const amount = interaction.options.getInteger("amount");
			const messages = await channel.messages.fetch({ limit: amount });
			const filtered = messages.filter(m => m.member && m.member.roles.cache.has(role.id));
			const deleted = await channel.bulkDelete(filtered, true);
			deletedCount = deleted.size;
		}

		else if (subcommand === "filter_by_bots") {
			const amount = interaction.options.getInteger("amount");
			const messages = await channel.messages.fetch({ limit: amount });
			const filtered = messages.filter(m => m.author.bot);
			const deleted = await channel.bulkDelete(filtered, true);
			deletedCount = deleted.size;
		}

		// Step 2: Update the status message
		let text;
		if (deletedCount === 0) {
			text = "⚠️ No messages could be deleted.";
		} else if (deletedCount === 1) {
			text = "🧹 1 message has been deleted.";
		} else {
			text = `🧹 ${deletedCount} messages have been deleted.`;
		}

		await statusMessage.edit(text);

		// Step 3: Delete the status message after 2 seconds
		setTimeout(() => {
			statusMessage.delete().catch(() => {});
		}, 2000);

		await interaction.editReply({ content: "✅ Finished!", ephemeral: true });
	},
};