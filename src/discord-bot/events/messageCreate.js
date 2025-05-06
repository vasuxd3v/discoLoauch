module.exports = {
  name: "messageCreate",
  once: false,
  async execute(client, message) {
    // Ignore messages from bots (including self)
    if (message.author.bot) return;

    // This event handler is now available for other message processing
    // Add your custom message handling logic here if needed
  },
};
