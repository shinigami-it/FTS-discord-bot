const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping-role')
        .setDescription('Ping users from a specific role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Select the role to ping')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You need to be an administrator to use this command.',
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('role');

        if (!role) {
            return interaction.reply({ content: 'Please select a valid role.', ephemeral: true });
        }

        const membersWithRole = role.members.map(member => member.user);
        if (membersWithRole.length === 0) {
            return interaction.reply({ content: `No members found with the role ${role.name}.`, ephemeral: true });
        }

        const mentions = membersWithRole.map(user => `<@${user.id}>`).join('\n');

        await interaction.reply({
            content: `Pinging role **${role.name}**...`,
            ephemeral: true
        });

        await interaction.channel.send({
            content: `# Role Ping: ${role}\n${mentions}`
        });
    }
};
