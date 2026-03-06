const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

// new user registration (POST)
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');

        const user = req.body; // { name, email, photoURL }
        const query = { email: user.email };

        // check if user already exists
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
            return res.send({ message: 'User already exists', insertedId: null });
        }

        // NEW USER CREATION
        const newUser = {
            uid: user.uid,
            name: user.name || "Anonymous",
            email: user.email,
            photoURL: user.photoURL || "",
            bloodGroup: "",
            district: "",
            upazila: "",
            phone: "",
            role: 'user',
            status: 'active',
            createdAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error saving user", error: error.message });
    }
});

// all users fetching (GET)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');

        const result = await usersCollection.find().toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error fetching users", error: error.message });
    }
});
//  user fetching by uid (GET)
router.get('/:uid', async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');
        const uid = req.params.uid;
        const result = await usersCollection.findOne({ uid: uid });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error fetching user", error: error.message });
    }
});

// user to donor profile update (PATCH)
router.patch('/:uid', async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');
        const uid = req.params.uid;
        const updatedData = req.body;

        const filter = { uid: uid };
        const updateDoc = {
            $set: {
                bloodGroup: updatedData.bloodGroup,
                district: updatedData.district,
                upazila: updatedData.upazila,
                phone: updatedData.phone,
                // after update, the user becomes a donor
                role: 'donor',
                isDonor: true,
                status: 'active',
                totalDonations: 0, 
                donationHistory: [] 
            },
        };

        const result = await usersCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
            res.send({ success: true, message: "Donor Profile Updated!" });
        } else {
            res.status(404).send({ success: false, message: "No changes made" });
        }
    } catch (error) {
        res.status(500).send({ message: "Update failed", error: error.message });
    }
});

module.exports = router;