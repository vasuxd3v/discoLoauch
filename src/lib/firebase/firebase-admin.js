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
