const admin = require("firebase-admin");

// Firebase Admin SDK Initialize
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    // Firebase token verification
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // decoded token for user info (e.g., uid, email)
    req.user = decodedToken; 
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(403).json({ success: false, message: "Forbidden: Invalid or expired token" });
  }
};

module.exports = { verifyToken };