/**
 * DEPRECATED: This file is kept for reference but is no longer used.
 *
 * The bot has been migrated to a more modular structure.
 * Please use bot.js as the entry point instead.
 *
 * The new structure includes:
 * - Modular command handling
 * - Event-based architecture
 * - Improved organization
 *
 * See README.md for more information.
 */

// This file is kept for reference only
console.warn("This file is deprecated. Please use bot.js instead.");

// Exit if someone tries to run this directly
if (require.main === module) {
  console.error(
    "This file is deprecated. Please use bot.js as the entry point."
  );
  process.exit(1);
}

module.exports = { deprecated: true };
