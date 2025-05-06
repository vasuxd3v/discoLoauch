"use client";

import { database } from "./firebase";
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push,
} from "firebase/database";

/**
 * Save Discord user data to Firebase Realtime Database
 * @param {string} userId - Discord user ID
 * @param {Object} userData - User data including username, avatar, etc.
 */
export const saveUserData = async (userId, userData) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      ...userData,
      lastLogin: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error saving user data:", error);
    return false;
  }
};

/**
 * Get Discord user data from Firebase
 * @param {string} userId - Discord user ID
 */
export const getUserData = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Save Discord server data for a user
 * @param {string} userId - Discord user ID
 * @param {Array} servers - List of Discord servers
 */
export const saveUserServers = async (userId, servers) => {
  try {
    const serversRef = ref(database, `users/${userId}/servers`);
    await set(serversRef, servers);
    return true;
  } catch (error) {
    console.error("Error saving user servers:", error);
    return false;
  }
};

/**
 * Update user's active status in a specific server
 * @param {string} userId - Discord user ID
 * @param {string} serverId - Discord server ID
 * @param {boolean} active - Whether the user is active in the server
 */
export const updateServerActivity = async (userId, serverId, active) => {
  try {
    const activityRef = ref(database, `serverActivity/${serverId}/${userId}`);
    await set(activityRef, {
      active,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error updating server activity:", error);
    return false;
  }
};

/**
 * Listen for changes to a specific user's data
 * @param {string} userId - Discord user ID
 * @param {Function} callback - Function to call when data changes
 */
export const subscribeToUserData = (userId, callback) => {
  const userRef = ref(database, `users/${userId}`);
  onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });

  // Return function to unsubscribe
  return () => off(userRef);
};

/**
 * Save a tool process to Firebase
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool (auto-dm-reply, auto-messager, etc.)
 * @param {string} processId - Process ID
 * @param {Object} processData - Process data
 */
export const saveToolProcess = async (
  userId,
  toolType,
  processId,
  processData
) => {
  try {
    const processRef = ref(database, `toolProcesses/${userId}/${toolType}`);
    await set(processRef, {
      processId,
      ...processData,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error saving ${toolType} process:`, error);
    return false;
  }
};

/**
 * Get active tool process for a user
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool (auto-dm-reply, auto-messager, etc.)
 */
export const getUserToolProcess = async (userId, toolType) => {
  try {
    const processRef = ref(database, `toolProcesses/${userId}/${toolType}`);
    const snapshot = await get(processRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error(`Error getting ${toolType} process:`, error);
    return null;
  }
};

/**
 * Update tool process stats (like messages sent)
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool
 * @param {Object} stats - Stats to update
 */
export const updateToolProcessStats = async (userId, toolType, stats) => {
  try {
    const processRef = ref(database, `toolProcesses/${userId}/${toolType}`);
    await update(processRef, {
      ...stats,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating ${toolType} stats:`, error);
    return false;
  }
};

/**
 * Delete a tool process from Firebase
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool
 */
export const removeToolProcess = async (userId, toolType) => {
  try {
    const processRef = ref(database, `toolProcesses/${userId}/${toolType}`);
    await remove(processRef);
    return true;
  } catch (error) {
    console.error(`Error removing ${toolType} process:`, error);
    return false;
  }
};
