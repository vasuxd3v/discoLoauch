// Load environment variables first
const dotenv = require("dotenv");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

// Try to load from different possible .env locations
try {
  // Try project root .env.local first
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

  // If the required variables aren't set, try .env
  if (!process.env.DISCORD_BOT_TOKEN) {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  }

  console.log("Environment loaded. Starting Discord bot...");
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

// Create a new Discord client with intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize components
require("./utils/database")(client);
require("./handlers/eventHandler")(client);
require("./handlers/commandHandler")(client);

// Login to Discord
client
  .login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log("Bot logged in successfully"))
  .catch((err) => {
    console.error("Failed to login:", err);
    process.exit(1);
  });
