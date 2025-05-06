const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { isAdmin } = require("../../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("revoke")
    .setDescription("Revoke a user's authorization to use tools on the website")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user to revoke access from")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for revoking access")
        .setRequired(false)
    ),

  async execute(client, interaction) {
    // Check if the command user is admin
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    // Get user and reason from options
    const targetUser = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    try {
      // Check if user was authorized first
      const wasAuthorized = await client.database.checkUserAuthorization(
        targetUser.id
      );

      // Revoke the user in the database
      await client.database.revokeUser(targetUser.id);

      // Create rich embed response
      const revokeEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("🚫 User Access Revoked")
        .setDescription(`User has been revoked from using website tools`)
        .addFields(
          {
            name: "User",
            value: `${targetUser.tag} (${targetUser.id})`,
            inline: false,
          },
          {
            name: "Revoked By",
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: false,
          },
          {
            name: "Previous Status",
            value: wasAuthorized ? "Authorized" : "Not Authorized",
            inline: true,
          },
          { name: "Reason", value: reason, inline: false },
          { name: "Timestamp", value: new Date().toISOString(), inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: "User Authorization System" })
        .setTimestamp();

      return interaction.reply({
        embeds: [revokeEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(`Error in revoke command:`, error);

      // Create error embed
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Revocation Error")
        .setDescription(`Failed to revoke user ${targetUser.tag}`)
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
