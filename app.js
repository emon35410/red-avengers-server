const express = require("express");
const app = express();
const cors = require("cors");

// middlewares and routes import
const { globalErrorHandler } = require("./middlewares/errorMiddleware");
const userRoutes = require("./routes/usersRoutes");
const campRoutes = require("./routes/campsRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const inventoryRoute = require("./routes/inventoryRoutes");
const requestRoutes = require("./routes/bloodRequest");
const aiRoutes = require("./routes/ai");

// standard middlewares
app.use(express.json());

// CORS Configuration - Fixed for local and production
const corsOptions = {
  origin: [
    "http://localhost:5173", // React local development
    process.env.CLIENT_URL,
    "https://red-avengers.vercel.app", // Production URL
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

// root route
app.get("/", (req, res) => {
  res.send("🛡️ Red Avengers Server is running! 🚀");
});

// api routes
app.use("/users", userRoutes);
app.use("/camps", campRoutes);
app.use("/payments", paymentRoute);
app.use("/inventory", inventoryRoute);
app.use("/blood-request", requestRoutes);
app.use("/ai", aiRoutes);

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
