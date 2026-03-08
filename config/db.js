const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// DNS issue solution (ISP Fix)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("❌ MONGODB_URI is missing in .env!");
    process.exit(1);
}

const client = new MongoClient(uri, {
    family: 4, // Forces the driver to use IPv4
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
});

// here we will store the database connection
let db;

const connectDB = async () => {
    try {
        await client.connect();
        db = client.db("redAvengersDB"); // database name

        await db.command({ ping: 1 });
        console.log("🛡️ Red Avengers DB Connected Successfully!");
    } catch (error) {
        console.error("❌ DB Connection Error:", error);
    }
};

// This function will return the database connection when called from other files
const getDB = () => {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
};

module.exports = {
    connectDB,
    getDB,
    client
};