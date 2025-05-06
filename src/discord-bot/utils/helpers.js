/**
 * Collection of helper utility functions for the Discord bot
 */

/**
 * Check if a user is an admin of the bot
 * @param {string} userId - Discord user ID to check
 * @returns {boolean} - Whether the user is an admin
 */
function isAdmin(userId) {
  // Check if the user is the bot owner or in the admin list
  const botOwnerId = process.env.BOT_OWNER_ID;
  const adminIds = (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim());

  return userId === botOwnerId || adminIds.includes(userId);
}

/**
 * Format error messages for consistent handling
 * @param {Error} error - The error object
 * @returns {string} - Formatted error message
 */
function formatError(error) {
  return `Error: ${error.message || "Unknown error occurred"}`;
}

module.exports = {
  isAdmin,
  formatError,
};
