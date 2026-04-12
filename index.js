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
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true
    }
});

// Socket connection logic
io.on('connection', (socket) => {
    console.log('⚡ User Connected:', socket.id);

    // ইউজার যখন জয়েন করবে, তাকে তার ইমেইল অনুযায়ী একটি রুমে জয়েন করাব
    socket.on('join_room', (email) => {
        socket.join(email);
        console.log(`👤 User with email ${email} joined room.`);
    });

    socket.on('disconnect', () => {
        console.log('❌ User Disconnected', socket.id);
    });
});

// সকেট অবজেক্টটিকে app-এ সেট করে রাখছি যাতে রাউট থেকে অ্যাক্সেস করা যায়
app.set('io', io);

connectDB().then(() => {
    // app.listen এর বদলে server.listen হবে
    server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
});