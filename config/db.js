const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

//  DNS issue solution for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI; 

// URI checking
if (!uri) {
    console.error("❌ MONGODB_URI is not defined in your .env file!");
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db("redAvengersDB");

const connectDB = async () => {
    try {
        await client.connect();
        // ping connection
        await db.command({ ping: 1 });
        console.log("🛡️ Red Avengers DB Connected Successfully!");
    } catch (error) {
        console.error("❌ DB Connection Error:", error);
    }
};

module.exports = {
    connectDB,
    usersCollection: db.collection("users"),
    donorCollection: db.collection("donor"),
    requestsCollection: db.collection("bloodRequests"),
    paymentsCollection: db.collection("payments"),
    client
};