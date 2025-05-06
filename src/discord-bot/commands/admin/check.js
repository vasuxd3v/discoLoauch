const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { isAdmin } = require("../../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check")
    .setDescription("Check if a user is authorized to use tools on the website")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user to check authorization for")
        .setRequired(true)
    ),

  async execute(client, interaction) {
    // Check if the command user is admin
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    // Get user from options
    const targetUser = interaction.options.getUser("user");

    try {
      // Get the guild member if possible for more info
      const member = interaction.guild
        ? await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        : null;

      // Check the user's authorization in the database
      const isAuthorized = await client.database.checkUserAuthorization(
        targetUser.id
      );

      // Create rich embed response
      const checkEmbed = new EmbedBuilder()
        .setColor(isAuthorized ? Colors.Green : Colors.Red)
        .setTitle(
          `User Authorization Status: ${
            isAuthorized ? "AUTHORIZED" : "NOT AUTHORIZED"
          }`
        )
        .setDescription(`Authorization check results for user`)
        .addFields(
          {
            name: "User",
            value: `${targetUser.tag} (${targetUser.id})`,
            inline: false,
          },
          {
            name: "Status",
            value: isAuthorized ? "✅ Authorized" : "❌ Not Authorized",
            inline: true,
          },
          { name: "Checked By", value: `${interaction.user.tag}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: "User Authorization System" })
        .setTimestamp();

      // Add guild-specific information if available
      if (member) {
        const joinedAt = member.joinedAt;
        const roles =
          member.roles.cache.map((r) => r.name).join(", ") || "None";

        checkEmbed.addFields(
          {
            name: "Server Join Date",
            value: joinedAt.toLocaleString(),
            inline: true,
          },
          {
            name: "Account Created",
            value: targetUser.createdAt.toLocaleString(),
            inline: true,
          },
          { name: "Roles", value: roles.substring(0, 1024), inline: false }
        );
      }

      return interaction.reply({
        embeds: [checkEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(`Error in check command:`, error);

      // Create error embed
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Authorization Check Error")
        .setDescription(
          `Failed to check authorization for user ${targetUser.tag}`
        )
        .addFields({
          name: "Error",
          value: error.message || "Unknown error",
          inline: false,
        })
        .setFooter({ text: "User Authorization System" })
        .setTimestamp();

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  },
};
