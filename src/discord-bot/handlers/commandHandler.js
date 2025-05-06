const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

module.exports = (client) => {
  client.commands = new Map();
  const commandsArray = [];

  // Initialize commands directory
  const commandsDir = path.join(__dirname, "..", "commands");

  // Create commands directory if it doesn't exist
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
    console.log(`Created commands directory at ${commandsDir}`);
  }

  // Get all command category folders
  const commandFolders = fs.readdirSync(commandsDir);

  // Load commands from each category folder
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsDir, folder);

    // Skip if not a directory
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);

      // Set command in collection
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
        console.log(
          `Loaded command: ${command.data.name} from ${folder}/${file}`
        );
      } else {
        console.warn(`Command at ${filePath} is missing required properties`);
      }
    }
  }

  // Register slash commands with Discord API
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN
  );

  client.registerCommands = async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(Routes.applicationCommands(client.user.id), {
        body: commandsArray,
      });

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("Error refreshing commands:", error);
    }
  };

  console.log(
    `Loaded ${commandsArray.length} commands from ${commandFolders.length} categories`
  );

  return client;
};
