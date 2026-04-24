const restrictDemoActions = (req, res, next) => {
  const demoEmails = [
    "admin@demo.com",
    "volunteer@demo.com",
    "donor@demo.com",
    "user@demo.com",
  ];

  // ১. যদি মেথড GET হয়, তবে নিচের কোনো চেকিং করারই দরকার নেই
  if (req.method === "GET") {
    return next();
  }

  // ২. শুধুমাত্র POST, PATCH, DELETE এর জন্য ইমেইল চেক হবে
  const userEmail = req.user?.email;

  if (demoEmails.includes(userEmail)) {
    return res.status(403).json({
      success: false,
      message: "⚠️ Action Denied: This is a Read-Only Demo account.",
    });
  }

  next();
};
module.exports = { restrictDemoActions };
