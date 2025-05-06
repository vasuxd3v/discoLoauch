module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);

    // Register all slash commands
    await client.registerCommands();

    // Set custom activity status
    client.user.setActivity("with authorization systems", { type: "PLAYING" });

    console.log(
      `Bot is now ready and serving in ${client.guilds.cache.size} servers!`
    );

    // Log server information
    const guilds = client.guilds.cache;
    console.log(`Connected to ${guilds.size} servers:`);

    guilds.forEach((guild) => {
      console.log(
        `- ${guild.name} (ID: ${guild.id}, Members: ${guild.memberCount})`
      );
    });
  },
};
