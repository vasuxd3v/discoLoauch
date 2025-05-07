// Load environment variables first
const dotenv = require("dotenv");
const path = require("path");

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
}

// Start the Discord bot
require("./index.js");
