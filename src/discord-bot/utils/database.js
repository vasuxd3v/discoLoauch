const admin = require("firebase-admin");

module.exports = (client) => {
  client.database = {};

  // Initialize Firebase
  const initializeFirebase = () => {
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

  // Get database instance
  client.database.getDb = () => initializeFirebase();

  // Authorization-related methods
  client.database.authorizeUser = async (userId) => {
    const db = client.database.getDb();

    // Store authorization data with timestamp and additional fields
    await db.ref(`users/${userId}`).update({
      authorized: true,
      authorizedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return true;
  };

  client.database.revokeUser = async (userId) => {
    const db = client.database.getDb();

    // Update authorization status with timestamp
    await db.ref(`users/${userId}`).update({
      authorized: false,
      revokedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return true;
  };

  client.database.checkUserAuthorization = async (userId) => {
    const db = client.database.getDb();
    const snapshot = await db.ref(`users/${userId}/authorized`).once("value");
    return snapshot.val() === true;
  };

  // Advanced user methods
  client.database.getUserData = async (userId) => {
    const db = client.database.getDb();
    const snapshot = await db.ref(`users/${userId}`).once("value");
    return snapshot.val() || null;
  };

  client.database.updateUserMetadata = async (userId, metadata) => {
    const db = client.database.getDb();
    await db.ref(`users/${userId}/metadata`).update({
      ...metadata,
      updatedAt: Date.now(),
    });
    return true;
  };

  client.database.logUserAction = async (userId, action, details) => {
    const db = client.database.getDb();
    const logRef = db.ref(`users/${userId}/logs`).push();

    await logRef.set({
      action,
      details,
      timestamp: Date.now(),
    });

    return logRef.key;
  };

  return client.database;
};
