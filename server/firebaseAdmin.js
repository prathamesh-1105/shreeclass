<<<<<<< HEAD
const admin = require("firebase-admin");

const hasFirebaseEnv =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseEnv && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = hasFirebaseEnv ? admin.firestore() : null;
const auth = hasFirebaseEnv ? admin.auth() : null;
const storage = hasFirebaseEnv ? admin.storage().bucket() : null;

module.exports = { admin, db, auth, storage, hasFirebaseEnv };
=======
const admin = require("firebase-admin");

const hasFirebaseEnv =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseEnv && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = hasFirebaseEnv ? admin.firestore() : null;
const auth = hasFirebaseEnv ? admin.auth() : null;
const storage = hasFirebaseEnv ? admin.storage().bucket() : null;

module.exports = { admin, db, auth, storage, hasFirebaseEnv };
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475
