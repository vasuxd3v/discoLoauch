/**
 * Discord Status Updater Service
 * Handles the rotation of Discord custom statuses at specified intervals
 */

/**
 * Updates a Discord user's custom status
 * @param {string} token - Discord user token
 * @param {string} text - Custom status text
 * @returns {Promise<boolean>} - Success status
 */
export async function updateStatus(token, text) {
  try {
    const response = await fetch(
      "https://discord.com/api/v9/users/@me/settings",
      {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          custom_status: {
            text: text,
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error updating Discord status:", error);
    return false;
  }
}

/**
 * Discord Status Rotater class
 * Manages the rotation of multiple status messages
 */
export class StatusRotater {
  constructor(token, statuses, interval) {
    this.token = token;
    this.statuses = statuses;
    this.interval = interval * 1000; // Convert seconds to milliseconds
    this.currentIndex = 0;
    this.intervalId = null;
    this.active = false;
    this.processId = null;
    this.lastUpdateTime = null;
    this.totalUpdates = 0;
  }

  /**
   * Start status rotation
   */
  start() {
    if (this.active) {
      return this.processId;
    }

    this.active = true;
    this.processId = `status-rotater-${Date.now()}`;

    // Update status immediately
    this.rotate();

    // Set up interval for further updates
    this.intervalId = setInterval(() => this.rotate(), this.interval);

    return this.processId;
  }

  /**
   * Stop status rotation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.active = false;
  }

  /**
   * Rotate to the next status
   */
  async rotate() {
    if (!this.active) return;

    const status = this.statuses[this.currentIndex % this.statuses.length];
    const success = await updateStatus(this.token, status);

    if (success) {
      this.totalUpdates++;
      this.lastUpdateTime = new Date().toISOString();
      console.log(`Status updated to: ${status}`);
    }

    this.currentIndex++;
  }

  /**
   * Get current state information
   */
  getStatus() {
    return {
      active: this.active,
      currentStatusIndex: this.currentIndex % this.statuses.length,
      currentStatus: this.statuses[this.currentIndex % this.statuses.length],
      interval: this.interval / 1000,
      lastUpdateTime: this.lastUpdateTime,
      totalUpdates: this.totalUpdates,
    };
  }
}

// Store active instances
const activeRotaters = new Map();

/**
 * Get an active status rotater by processId
 */
export function getStatusRotater(processId) {
  return activeRotaters.get(processId);
}

/**
 * Create and store a new status rotater
 */
export function createStatusRotater(token, statuses, interval) {
  const rotater = new StatusRotater(token, statuses, interval);
  const processId = rotater.start();
  activeRotaters.set(processId, rotater);
  return processId;
}

/**
 * Stop and remove a status rotater
 */
export function stopStatusRotater(processId) {
  const rotater = activeRotaters.get(processId);
  if (rotater) {
    rotater.stop();
    activeRotaters.delete(processId);
    return true;
  }
  return false;
}

/**
 * Get all active processes for a user
 */
export function getUserActiveProcesses(userId) {
  const userProcesses = [];

  for (const [processId, rotater] of activeRotaters.entries()) {
    if (rotater.userId === userId) {
      userProcesses.push({
        processId,
        status: rotater.getStatus(),
      });
    }
  }

  return userProcesses;
}
