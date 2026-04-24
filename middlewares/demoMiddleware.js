const restrictDemoActions = (req, res, next) => {
  // ডেমো ইউজারদের ইমেইল লিস্ট
  const demoEmails = [
    "admin@demo.com",
    "volunteer@demo.com",
    "donor@demo.com",
    "user@demo.com"
  ];

  // req.user আসে আপনার verifyToken মিডলওয়্যার থেকে
  const userEmail = req.user?.email;

  // যদি রিকোয়েস্ট GET না হয় (অর্থাৎ POST, PATCH, DELETE) এবং ইউজার যদি ডেমো হয়
  if (req.method !== "GET" && demoEmails.includes(userEmail)) {
    return res.status(403).json({
      success: false,
      message: "⚠️ Action Denied: This is a Read-Only Demo account.",
    });
  }

  next();
};

module.exports = { restrictDemoActions };