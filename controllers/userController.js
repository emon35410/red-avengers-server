const { usersCollection } = require('../config/db');

// post user data to db
const saveUser = async (req, res) => {
    try {
        const user = req.body;
        const query = { email: user.email };
        
        // checking if user already exists
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
            return res.send({ message: 'User already exists', insertedId: null });
        }

        const result = await usersCollection.insertOne({
            ...user,
            role: 'user', // default role
            status: 'active',
            createdAt: new Date()
        });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error saving user" });
    }
};

// get all users from db
const getAllUsers = async (req, res) => {
    try {
        const result = await usersCollection.find().toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error fetching users" });
    }
};

module.exports = { saveUser, getAllUsers };