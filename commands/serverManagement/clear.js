const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { execute } = require("./warn");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Cleans messages from a channel.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addSubcommand((sub) =>
			sub
				.setName("number_of_messages")
				.setDescription("Number of messages to delete.")
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
				.setDescription("Filter by user messages.")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("How many messages to delete")
						.setMinValue(1)
						.setMaxValue(100)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("filter_by_role")
				.setDescription("Filter by role messages.")
				.addIntegerOption((option) =>
					option
						.setName("amount")
						.setDescription("How many messages to delete")
						.setMinValue(1)
						.setMaxValue(100)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("filter_by_bots")
				.setDescription("Filter by bots messages.")
				.addIntegerOption((option) =>
					option
						.setName("amount")
						.setDescription("How many messages to delete")
						.setMinValue(1)
						.setMaxValue(100)
				)
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "number_of_messages") {
			console.log("subcommand: number_of_messages");
		} else if (subcommand === "filter_by_user") {
			console.log("subcommand: filter_by_user");
		} else if (subcommand === "filter_by_role") {
			console.log("subcommand: filter_by_role");
		} else if (subcommand === "filter_by_bots") {
			console.log("subcommand: filter_by_bots");
		}
	},
};
