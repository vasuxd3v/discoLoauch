const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config();

// Get Firebase admin instance
const getAdminDb = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return admin.database();
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Auto-reply configuration
const autoReplies = new Map();

// Register slash commands
const commands = [
  {
    name: "authorize",
    description: "Authorize a user to use tools on the website",
    options: [
      {
        name: "user_id",
        description: "Discord user ID to authorize",
        type: 3, // STRING type
        required: true,
      },
    ],
  },
  {
    name: "revoke",
    description: "Revoke a user's authorization to use tools on the website",
    options: [
      {
        name: "user_id",
        description: "Discord user ID to revoke",
        type: 3, // STRING type
        required: true,
      },
    ],
  },
  {
    name: "check",
    description: "Check if a user is authorized to use tools on the website",
    options: [
      {
        name: "user_id",
        description: "Discord user ID to check",
        type: 3, // STRING type
        required: true,
      },
    ],
  },
  {
    name: "auto_reply",
    description: "Configure auto-reply for direct messages",
    options: [
      {
        name: "action",
        description: "Action to perform",
        type: 3, // STRING type
        required: true,
        choices: [
          { name: "enable", value: "enable" },
          { name: "disable", value: "disable" },
          { name: "status", value: "status" },
        ],
      },
      {
        name: "message",
        description: "Auto-reply message (only needed for enable)",
        type: 3, // STRING type
        required: false,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

// Register commands when bot starts
client.once("ready", async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
    console.log(`Bot is online as ${client.user.tag}!`);

    // Load active auto-replies from Firebase
    const db = getAdminDb();
    const snapshot = await db.ref("autoReplies").once("value");
    const savedReplies = snapshot.val() || {};

    // Restore auto-replies from DB
    Object.entries(savedReplies).forEach(([userId, message]) => {
      if (message) {
        autoReplies.set(userId, message);
        console.log(`Loaded auto-reply for user ${userId}`);
      }
    });
  } catch (error) {
    console.error(error);
  }
});

// Check if user is admin
function isAdmin(userId) {
  // Check if the user is the bot owner or in the admin list
  const botOwnerId = process.env.BOT_OWNER_ID;
  const adminIds = (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim());

  return userId === botOwnerId || adminIds.includes(userId);
}

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  // Handle auto_reply command - available to any user for their own messages
  if (commandName === "auto_reply") {
    const action = options.getString("action");
    const userId = interaction.user.id;

    try {
      const db = getAdminDb();

      switch (action) {
        case "enable":
          const message = options.getString("message");
          if (!message) {
            return interaction.reply({
              content: "You must provide a message for auto-reply.",
              ephemeral: true,
            });
          }

          // Save to memory and Firebase
          autoReplies.set(userId, message);
          await db.ref(`autoReplies/${userId}`).set(message);

          return interaction.reply({
            content: `✅ Auto-reply has been enabled. When users DM you, they will receive: "${message}"`,
            ephemeral: true,
          });

        case "disable":
          // Remove from memory and Firebase
          autoReplies.delete(userId);
          await db.ref(`autoReplies/${userId}`).remove();

          return interaction.reply({
            content: "🚫 Auto-reply has been disabled.",
            ephemeral: true,
          });

        case "status":
          const currentMessage = autoReplies.get(userId);

          return interaction.reply({
            content: currentMessage
              ? `✅ Auto-reply is currently enabled with message: "${currentMessage}"`
              : "❌ Auto-reply is currently disabled.",
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error(`Error in auto_reply command:`, error);
      return interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true,
      });
    }
  }

  // Only allow authorized users to use admin commands
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  // Get the user ID from the command options
  const userId = options.getString("user_id");

  try {
    // Get Firebase admin instance
    const db = getAdminDb();

    // Handle different commands
    switch (commandName) {
      case "authorize":
        // Update user's authorization status in Firebase to true
        await db.ref(`users/${userId}/authorized`).set(true);

        return interaction.reply({
          content: `✅ User ${userId} has been **authorized** to use tools on the website.`,
          ephemeral: true,
        });

      case "revoke":
        // Update user's authorization status in Firebase to false
        await db.ref(`users/${userId}/authorized`).set(false);

        return interaction.reply({
          content: `🚫 User ${userId} has been **revoked** from using tools on the website.`,
          ephemeral: true,
        });

      case "check":
        // Check user's current authorization status
        const snapshot = await db
          .ref(`users/${userId}/authorized`)
          .once("value");
        const isAuthorized = snapshot.val() === true;

        return interaction.reply({
          content: isAuthorized
            ? `✅ User ${userId} is currently **authorized** to use tools.`
            : `❌ User ${userId} is **not authorized** to use tools.`,
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error(`Error in ${commandName} command:`, error);

    return interaction.reply({
      content: `An error occurred while processing your request: ${error.message}`,
      ephemeral: true,
    });
  }
});

// Handle direct messages for auto-reply
client.on("messageCreate", async (message) => {
  // Ignore messages from bots (including self)
  if (message.author.bot) return;

  // Only process direct messages
  if (!message.channel.isDM()) return;

  // Check if the recipient has an auto-reply set up
  const recipientId = message.channel.recipient?.id;
  if (!recipientId) return;

  const autoReplyMessage = autoReplies.get(recipientId);
  if (autoReplyMessage) {
    try {
      // Send the auto-reply
      await message.reply(autoReplyMessage);
      console.log(
        `Sent auto-reply to ${message.author.tag} on behalf of ${recipientId}`
      );

      // Log the auto-reply in Firebase
      const db = getAdminDb();
      await db.ref(`autoReplies/${recipientId}/logs/${Date.now()}`).set({
        sender: message.author.id,
        senderTag: message.author.tag,
        content: message.content,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error sending auto-reply:", error);
    }
  }
});

// Log into Discord
client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = client;
