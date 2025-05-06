const { formatError } = require("../utils/helpers");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(client, interaction) {
    // Handle button interactions
    if (interaction.isButton()) {
      await handleButtonInteraction(client, interaction);
      return;
    }

    // Only handle slash commands
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    // Command doesn't exist
    if (!command) {
      console.warn(`Command ${interaction.commandName} not found.`);
      return;
    }

    try {
      // Execute the command
      await command.execute(client, interaction);
    } catch (error) {
      console.error(
        `Error executing command ${interaction.commandName}:`,
        error
      );

      // Reply to the user with an error message
      const errorReply = {
        content: `There was an error executing this command: ${formatError(
          error
        )}`,
        ephemeral: true,
      };

      // If the interaction has already been replied to, follow up instead
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    }
  },
};

/**
 * Handle button interactions
 * @param {Client} client - Discord client
 * @param {ButtonInteraction} interaction - Button interaction
 */
async function handleButtonInteraction(client, interaction) {
  const { customId } = interaction;

  // Check if this is a list command pagination button
  if (customId.startsWith("list_")) {
    const parts = customId.split("_");
    const action = parts[1]; // first, prev, next, last, refresh
    const userId = parts[2]; // the user ID that can use this button

    // Only the user who ran the command can use these buttons
    if (interaction.user.id !== userId) {
      return interaction.reply({
        content:
          "You cannot use these buttons as you didn't run the original command.",
        ephemeral: true,
      });
    }

    try {
      // Get the current embed to extract information
      const message = interaction.message;
      const embed = message.embeds[0];

      // Extract page information from footer
      const footerText = embed.footer.text;
      const pageInfo = footerText.match(/Page (\d+)\/(\d+)/);

      if (!pageInfo) {
        return interaction.reply({
          content: "Could not determine page information.",
          ephemeral: true,
        });
      }

      const currentPage = parseInt(pageInfo[1]);
      const totalPages = parseInt(pageInfo[2]);

      // Determine which page to show
      let newPage = currentPage;

      switch (action) {
        case "first":
          newPage = 1;
          break;
        case "prev":
          newPage = Math.max(1, currentPage - 1);
          break;
        case "next":
          newPage = Math.min(totalPages, currentPage + 1);
          break;
        case "last":
          newPage = totalPages;
          break;
        case "refresh":
          // Keep the same page but refresh data
          break;
      }

      // Defer update
      await interaction.deferUpdate();

      // Get the list command
      const listCommand = client.commands.get("list");

      if (!listCommand) {
        return interaction.editReply({
          content: "Could not find the list command to handle pagination.",
          components: [],
        });
      }

      // Create a fake interaction options object
      const options = {
        getInteger: (name) => (name === "page" ? newPage : null),
      };

      // Create a fake interaction for the list command
      const fakeInteraction = {
        ...interaction,
        options,
        // Override necessary methods
        deferReply: async () => Promise.resolve(),
        editReply: async (data) => interaction.editReply(data),
      };

      // Execute the list command with the new page
      await listCommand.execute(client, fakeInteraction);
    } catch (error) {
      console.error(`Error handling button interaction:`, error);
      await interaction.reply({
        content: `Error processing button: ${formatError(error)}`,
        ephemeral: true,
      });
    }
  }
}
