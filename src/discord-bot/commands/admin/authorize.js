const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { isAdmin } = require("../../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("authorize")
    .setDescription("Authorize a user to use tools on the website")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Discord user to authorize")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for authorization")
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

    // Get user and optional reason from options
    const targetUser = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    try {
      // Authorize the user in the database
      await client.database.authorizeUser(targetUser.id);

      // Create rich embed response
      const authorizeEmbed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle("✅ User Authorized")
        .setDescription(`User has been authorized to use website tools`)
        .addFields(
          {
            name: "User",
            value: `${targetUser.tag} (${targetUser.id})`,
            inline: false,
          },
          {
            name: "Authorized By",
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: false,
          },
          { name: "Reason", value: reason, inline: false },
          { name: "Timestamp", value: new Date().toISOString(), inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: "User Authorization System" })
        .setTimestamp();

      return interaction.reply({
        embeds: [authorizeEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(`Error in authorize command:`, error);

      // Create error embed
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Authorization Error")
        .setDescription(`Failed to authorize user ${targetUser.tag}`)
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
