const express = require("express");
const app = express();
const cors = require('cors');

// middlewares and routes import
const { globalErrorHandler } = require('./middlewares/errorMiddleware');
const userRoutes = require('./routes/usersRoutes');
const campRoutes = require('./routes/campsRoutes');
const paymentRoute = require('./routes/paymentRoutes');
const inventoryRoute = require('./routes/inventoryRoutes');
const requestRoutes = require('./routes/bloodRequest');


// standard middlewares
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// root route
app.get('/', (req, res) => {
    res.send('🛡️ Red Avengers Server is running! 🚀');
});

// api routes
app.use('/users', userRoutes);
app.use('/camps', campRoutes);
app.use('/payments', paymentRoute);
app.use('/inventory', inventoryRoute);
app.use('/blood-request', requestRoutes);

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;