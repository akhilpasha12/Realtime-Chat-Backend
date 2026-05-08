const admin = require("firebase-admin");

const serviceAccount = require("./realtime-chat-1136e-firebase-adminsdk-fbsvc-f7e357748e.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("[Firebase] initialized");
}

module.exports = admin;
