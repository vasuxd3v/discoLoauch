import admin from "firebase-admin";

// Check if Firebase admin has been initialized
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return admin;
};

const getAdminDb = () => {
  const adminInstance = initializeFirebaseAdmin();
  return adminInstance.database();
};

export { initializeFirebaseAdmin, getAdminDb };

/**
 * Save tool process data in Firebase (server-side)
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool (auto-dm-reply, auto-messager, etc.)
 * @param {string} processId - Process ID
 * @param {Object} processData - Process data
 */
export const saveToolProcessAdmin = async (
  userId,
  toolType,
  processId,
  processData
) => {
  try {
    const db = getAdminDb();
    await db.ref(`toolProcesses/${userId}/${toolType}`).set({
      processId,
      ...processData,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error saving ${toolType} process (admin):`, error);
    return false;
  }
};

/**
 * Get user's tool process (server-side)
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool
 */
export const getUserToolProcessAdmin = async (userId, toolType) => {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .ref(`toolProcesses/${userId}/${toolType}`)
      .once("value");
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error(`Error getting ${toolType} process (admin):`, error);
    return null;
  }
};

/**
 * Update tool process stats (server-side)
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool
 * @param {Object} stats - Stats to update
 */
export const updateToolProcessStatsAdmin = async (userId, toolType, stats) => {
  try {
    const db = getAdminDb();
    await db.ref(`toolProcesses/${userId}/${toolType}`).update({
      ...stats,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating ${toolType} stats (admin):`, error);
    return false;
  }
};

/**
 * Remove a tool process (server-side)
 * @param {string} userId - User ID
 * @param {string} toolType - Type of tool
 */
export const removeToolProcessAdmin = async (userId, toolType) => {
  try {
    const db = getAdminDb();
    await db.ref(`toolProcesses/${userId}/${toolType}`).remove();
    return true;
  } catch (error) {
    console.error(`Error removing ${toolType} process (admin):`, error);
    return false;
  }
};
