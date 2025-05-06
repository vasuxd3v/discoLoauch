const {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { isAdmin } = require("../../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("List all users authorized to use website tools")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number to display")
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(client, interaction) {
    // Check if the command user is admin
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    try {
      // Defer reply as this might take some time
      await interaction.deferReply({ ephemeral: true });

      // Get the page number from options (default to 1)
      const page = interaction.options.getInteger("page") || 1;
      const pageSize = 10; // Number of users per page

      // Get all authorized users from database
      const db = client.database.getDb();
      const snapshot = await db
        .ref("users")
        .orderByChild("authorized")
        .equalTo(true)
        .once("value");
      const authorizedUsers = snapshot.val() || {};

      // Convert to array for pagination
      const userIds = Object.keys(authorizedUsers);
      const totalUsers = userIds.length;
      const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

      // Validate page number
      const validPage = Math.min(totalPages, Math.max(1, page));
      const startIdx = (validPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalUsers);

      // Get current page users
      const currentPageUserIds = userIds.slice(startIdx, endIdx);

      // Create rich embed response
      const listEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("Authorized Users List")
        .setDescription(`Found ${totalUsers} authorized users`)
        .setFooter({
          text: `Page ${validPage}/${totalPages} • ${
            startIdx + 1
          }-${endIdx} of ${totalUsers} users`,
        })
        .setTimestamp();

      // If no users found
      if (totalUsers === 0) {
        listEmbed.setDescription("No authorized users found in the database.");
      } else {
        // Try to fetch Discord user info for each ID
        for (let i = 0; i < currentPageUserIds.length; i++) {
          const userId = currentPageUserIds[i];

          try {
            // Try to fetch user from Discord
            const user = await client.users.fetch(userId).catch(() => null);

            if (user) {
              // User found in Discord
              listEmbed.addFields({
                name: `${i + startIdx + 1}. ${user.tag}`,
                value: `ID: ${userId}\nName: ${
                  user.username
                }\nCreated: ${user.createdAt.toLocaleDateString()}\nAvatar: ${
                  user.avatarURL() ? "✅" : "❌"
                }`,
                inline: false,
              });
            } else {
              // User not found in Discord
              listEmbed.addFields({
                name: `${i + startIdx + 1}. Unknown User`,
                value: `ID: ${userId}\nUnable to fetch user info from Discord`,
                inline: false,
              });
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);

            // Add error info
            listEmbed.addFields({
              name: `${i + startIdx + 1}. Error fetching user`,
              value: `ID: ${userId}\nError: ${error.message}`,
              inline: false,
            });
          }
        }
      }

      // Create pagination buttons
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`list_first_${interaction.user.id}`)
          .setLabel("First")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(validPage === 1),
        new ButtonBuilder()
          .setCustomId(`list_prev_${interaction.user.id}`)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(validPage === 1),
        new ButtonBuilder()
          .setCustomId(`list_next_${interaction.user.id}`)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(validPage === totalPages),
        new ButtonBuilder()
          .setCustomId(`list_last_${interaction.user.id}`)
          .setLabel("Last")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(validPage === totalPages)
      );

      // Add refresh button
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`list_refresh_${interaction.user.id}`)
          .setLabel("Refresh")
          .setStyle(ButtonStyle.Success)
      );

      // Send embed with buttons
      return interaction.editReply({
        embeds: [listEmbed],
        components: totalPages > 1 ? [buttonRow] : [],
      });
    } catch (error) {
      console.error(`Error in list command:`, error);

      // Create error embed
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Listing Error")
        .setDescription("Failed to retrieve list of authorized users")
        .addFields({
          name: "Error",
          value: error.message || "Unknown error",
          inline: false,
        })
        .setFooter({ text: "User Authorization System" })
        .setTimestamp();

      if (interaction.deferred) {
        return interaction.editReply({ embeds: [errorEmbed] });
      } else {
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
