const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const userRoutes = require('./routes/usersRoutes');
// অন্য রাউটগুলো পরে একইভাবে অ্যাড করবেন
const donorRoutes = require('./routes/donorRoutes'); 

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
connectDB();

// API Routes
app.use('/api/users', userRoutes);
// app.use('/api/donors', donorRoutes);

app.get('/', (req, res) => {
    res.send('🛡️ Red Avengers Server Running 🔥');
});

// Error Handling
const { globalErrorHandler } = require('./middlewares/errorMiddleware');
app.use(globalErrorHandler);

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});