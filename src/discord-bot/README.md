# Discord Bot

A modular Discord bot with command handling, event management, and database integration for user authorization management.

## Features

- **Modular Command System**: Commands are organized by category for better management.
- **Event-driven Architecture**: Each event is handled in its own file.
- **Database Integration**: Firebase Realtime Database integration for persistent storage.
- **Enhanced Authorization System**: Rich embeds with detailed user information.
- **Interactive Pagination**: Browse through lists of authorized users with interactive buttons.

## Setup

1. Create a `.env` file in the project root with the following variables:

```
DISCORD_BOT_TOKEN=your_discord_bot_token
BOT_OWNER_ID=your_discord_user_id
ADMIN_IDS=comma,separated,discord,user,ids
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_DATABASE_URL=your_firebase_database_url
```

2. Install dependencies:

```
npm install discord.js dotenv firebase-admin
```

3. Start the bot:

```
node src/discord-bot/bot.js
```

## Command Structure

Commands are organized by category in the `commands` directory:

- `commands/admin/`: Commands for administrators
- `commands/general/`: Commands for all users

## Adding New Commands

1. Create a new JavaScript file in the appropriate category folder
2. Use the following template:

```js
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("command_name")
    .setDescription("Command description"),

  async execute(client, interaction) {
    // Command implementation
  },
};
```

## Adding New Events

1. Create a new JavaScript file in the `events` directory
2. Use the following template:

```js
module.exports = {
  name: "eventName",
  once: false, // true if the event should only be triggered once
  async execute(client, ...args) {
    // Event implementation
  },
};
```

## Available Commands

### General Commands

- `/ping`: Check the bot's latency
- `/help`: Display help information with rich embeds

### Admin Commands

- `/authorize`: Authorize a user to use tools on the website
  - Options:
    - `user`: User to authorize (uses Discord user picker)
    - `reason`: Optional reason for authorization
- `/revoke`: Revoke a user's authorization
  - Options:
    - `user`: User to revoke (uses Discord user picker)
    - `reason`: Optional reason for revocation
- `/check`: Check if a user is authorized and show detailed information
  - Options:
    - `user`: User to check (uses Discord user picker)
- `/list`: List all authorized users with pagination
  - Options:
    - `page`: Optional page number to display

## Interactive Features

The bot includes interactive components like buttons for pagination in the `/list` command. These allow admins to browse through the list of authorized users more easily, with options to move forward, backward, or refresh the data.
