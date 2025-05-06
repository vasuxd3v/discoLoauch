const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  // Initialize events directory
  const eventsDir = path.join(__dirname, "..", "events");

  // Create events directory if it doesn't exist
  if (!fs.existsSync(eventsDir)) {
    fs.mkdirSync(eventsDir, { recursive: true });
    console.log(`Created events directory at ${eventsDir}`);
  }

  // Load all event files
  const eventFiles = fs
    .readdirSync(eventsDir)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsDir, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }

    console.log(`Loaded event: ${event.name}`);
  }

  console.log(`Loaded ${eventFiles.length} events`);

  return client;
};
