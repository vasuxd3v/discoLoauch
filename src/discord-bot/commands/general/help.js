const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Display information about available commands"),

  async execute(client, interaction) {
    const userId = interaction.user.id;
    const isAdminUser = isAdmin(userId);

    // Create help embed
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Bot Commands")
      .setDescription("Here are the commands you can use:")
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    // General commands (available to everyone)
    helpEmbed.addFields({
      name: "📋 General Commands",
      value: `
        </ping:0> - Check the bot's latency
        </help:0> - Display this help message
      `,
    });

    // Admin commands (only shown to admins)
    if (isAdminUser) {
      helpEmbed.addFields({
        name: "🔐 Admin Commands",
        value: `
          </authorize:0> - Authorize a user to use website tools
          </revoke:0> - Revoke a user's authorization to use tools
          </check:0> - Check if a user is authorized to use tools
          </list:0> - List all authorized users with pagination
        `,
      });

      // Add detailed admin command descriptions
      helpEmbed.addFields({
        name: "📘 Admin Command Details",
        value: `
          **Authorize Command**
          Grants a user access to use special tools on the website.
          Uses rich embeds to display detailed information.
          You can include an optional reason for the authorization.
          
          **Revoke Command**
          Removes a user's access to website tools.
          Includes details about the revocation process and history.
          
          **Check Command**
          Displays detailed information about a user's authorization status.
          Shows Discord user info, server join date, and roles when available.
          
          **List Command**
          Shows all users who are currently authorized.
          Supports pagination for browsing through many users.
          Each page displays detailed information about each user.
        `,
      });
    }

    return interaction.reply({
      embeds: [helpEmbed],
      ephemeral: true,
    });
  },
};
