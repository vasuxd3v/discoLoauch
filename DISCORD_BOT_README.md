# Discord Authorization Bot

This Discord bot allows you to manage user authorization for your website tools using slash commands.

## Available Commands

- `/authorize user_id:<id>` - Grant authorization to a user
- `/revoke user_id:<id>` - Remove authorization from a user
- `/check user_id:<id>` - Check if a user is currently authorized

## Setup

1. **Create a Discord Bot**:

   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" tab and click "Add Bot"
   - Under "Privileged Gateway Intents", enable:
     - Server Members Intent
     - Message Content Intent
   - Save changes

2. **Get Bot Token**:

   - In the Bot tab, click "Reset Token" to get your bot token
   - Copy the token for the next step

3. **Configure Environment Variables**:

   - Add the following variables to your `.env.local` file in your project root:

     ```
     # Discord Bot Configuration
     DISCORD_BOT_TOKEN=your_bot_token_here
     BOT_OWNER_ID=your_discord_id_here
     ADMIN_IDS=additional_admin_id1,additional_admin_id2

     # Firebase Configuration
     FIREBASE_PROJECT_ID=your_firebase_project_id
     FIREBASE_CLIENT_EMAIL=your_firebase_client_email
     FIREBASE_PRIVATE_KEY="your_firebase_private_key_with_quotes"
     FIREBASE_DATABASE_URL=https://discoloaunch-default-rtdb.asia-southeast1.firebasedatabase.app
     ```

   - Make sure to replace the values with your actual credentials
   - `BOT_OWNER_ID` is required and will always have admin access
   - `ADMIN_IDS` is optional and allows you to specify additional Discord IDs that can use admin commands

4. **Invite Bot to Your Server**:
   - Go to OAuth2 > URL Generator
   - Select "bot" and "applications.commands" scopes
   - For bot permissions, select:
     - Read Messages/View Channels
     - Send Messages
     - Use Slash Commands
   - Copy the generated URL and open it in your browser
   - Select your server and authorize the bot

## Usage

1. **Start the Bot**:

   ```
   npm run bot
   ```

2. **Manage User Authorization**:

   - **Authorize a User**: `/authorize user_id:123456789012345678`
   - **Revoke Authorization**: `/revoke user_id:123456789012345678`
   - **Check Authorization Status**: `/check user_id:123456789012345678`
   - Only the bot owner and users listed in ADMIN_IDS can use these commands

3. **How It Works**:
   - When you authorize a user, the bot sets `authorized: true` in their Firebase record
   - When you revoke a user, the bot sets `authorized: false` in their Firebase record
   - The website checks this authorization status before allowing access to tools
   - Unauthorized users will see a message that they need authorization

## Firebase Data Structure

The bot updates the user's authorization status in Firebase at this path:

```
users/{discord_user_id}/authorized = true|false
```

## Troubleshooting

### Import Error

If you encounter the "Cannot use import statement outside a module" error, the bot has been fixed to use CommonJS syntax for imports. Make sure you're running the latest version of the code.

### Bot Not Starting

If the bot is not starting:

1. Check that you have all required environment variables in your `.env.local` file
2. Ensure your Firebase credentials are correct
3. Verify that your Discord bot token is valid
4. Run the bot with `NODE_ENV=development npm run bot` for more detailed logs

### Bot Not Responding

If the bot is not responding:

1. Check that the bot is online in your Discord server
2. Verify your environment variables are set correctly
3. Check the console for any error messages
4. Make sure the bot has the necessary permissions in your Discord server

### Authorization Issues

If users can't access tools after authorization:

1. Check that the user has logged in through Discord OAuth
2. Verify the authorization was set correctly in Firebase
3. Try logging out and back in to refresh the session
