const app = require('./app');
const { connectDB } = require('./config/db');
const http = require('http'); // 👈 Add this
const { Server } = require('socket.io'); // 👈 Add this
require('dotenv').config();

const port = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'https://red-avengers.vercel.app',
        credentials: true
    }
});

// Socket connection logic
io.on('connection', (socket) => {
    console.log('⚡ User Connected:', socket.id);

    // user email room join for targeted notifications
    socket.on('join_room', (email) => {
        socket.join(email);
        console.log(`👤 User with email ${email} joined room.`);
    });

    socket.on('disconnect', () => {
        console.log('❌ User Disconnected', socket.id);
    });
});

// socket.io object set to app for access in routes
app.set('io', io);

connectDB().then(() => {
    server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
});