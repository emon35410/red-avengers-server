const express = require("express");
const app = express();
const cors = require('cors');

// middlewares and routes import
const { globalErrorHandler } = require('./middlewares/errorMiddleware');
const userRoutes = require('./routes/usersRoutes');
const campRoutes = require('./routes/campsRoutes');

// standard middlewares
app.use(express.json());
app.use(cors());

// root route
app.get('/', (req, res) => {
    res.send('🛡️ Red Avengers Server is running! 🚀');
});

// api routes
app.use('/users', userRoutes);
app.use('/camps', campRoutes);

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;