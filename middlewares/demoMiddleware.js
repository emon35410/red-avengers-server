
const restrictDemoActions = (req, res, next) => {
  // demo user email list
  const demoEmails = [
    "admin@demo.com",
    "volunteer@demo.com",
    "donor@demo.com",
    "user@demo.com"
  ];

  /**
   * Logic: 
   * 1. Method should not be GET (i.e., POST, PUT, DELETE, PATCH)
   * 2. And the request user should be a demo user
   */
  const userEmail = req.user?.email || req.body?.email; // Auth logic অনুযায়ী চেক করবেন

  if (req.method !== "GET" && demoEmails.includes(userEmail)) {
    return res.status(403).json({
      success: false,
      message: "⚠️ Action Denied: This is a Read-Only Demo account.",
    });
  }

  next();
};

module.exports = { restrictDemoActions };