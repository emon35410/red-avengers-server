const app = require('./app'); // app.js থেকে নিয়ে আসা
const { connectDB } = require('./config/db');
require('dotenv').config();

const port = process.env.PORT || 5000;

// DB কানেক্ট করে সার্ভার স্টার্ট করা
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
});