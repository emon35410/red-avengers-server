const express = require("express");
const app = express();
const cors = require("cors");

// middlewares and routes import
const { globalErrorHandler } = require("./middlewares/errorMiddleware");
const { verifyToken } = require("./middlewares/authMiddleware"); 
const { restrictDemoActions } = require("./middlewares/demoMiddleware"); 

const userRoutes = require("./routes/usersRoutes");
const campRoutes = require("./routes/campsRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const inventoryRoute = require("./routes/inventoryRoutes");
const requestRoutes = require("./routes/bloodRequest");
const aiRoutes = require("./routes/ai");

// standard middlewares
app.use(express.json());

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL,
    "https://red-avengers.vercel.app",
  ].filter(Boolean),
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 1. Root route (Public)
app.get("/", (req, res) => {
  res.send("🛡️ Red Avengers Server is running! 🚀");
});

// 2. AI Route 
app.use("/ai", aiRoutes);


// 3. Protected API routes
app.use("/users", userRoutes);
app.use("/camps", campRoutes);
app.use("/payments", paymentRoute);
app.use("/inventory", inventoryRoute);
app.use("/blood-request", requestRoutes);

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;