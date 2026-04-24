const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { verifyToken } = require("../middlewares/authMiddleware");
const { restrictDemoActions } = require("../middlewares/demoMiddleware");

// get all inventory
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const bloodCollection = db.collection('blood_inventory');

        const inventory = await bloodCollection.aggregate([
            {
                $group: {
                    _id: "$bloodGroup",
                    totalBags: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// get public logs (Find) - without donor name
router.get('/logs', async (req, res) => {
    try {
        const db = getDB();
        const bloodCollection = db.collection('blood_inventory');

        // privacy: donor name and email hide
        const logs = await bloodCollection.find({}, {
            projection: { donorName: 0, donorEmail: 0 }
        }).sort({ collectionDate: -1 }).toArray();

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// new inventory add (Create)
router.post('/add', verifyToken, restrictDemoActions, async (req, res) => {
    try {
        const db = getDB();
        const bloodCollection = db.collection('blood_inventory');

        // Destructure data from frontend
        const { bloodGroup, location, donorName, donorEmail, donorPhone } = req.body;

        // Date Calculation
        const collectionDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(collectionDate.getDate() + 42); // 42 days standard expiry

        const newUnit = {
            unitId: `RA-${Math.floor(1000 + Math.random() * 9000)}`,
            bloodGroup: (bloodGroup || "Unknown").toUpperCase().trim(),
            donorName: donorName || "Anonymous Donor",
            donorEmail: donorEmail || "N/A",
            donorPhone: donorPhone || "N/A",
            volume: "450 ml",
            quality: "Verified",
            collectionDate,
            expiryDate,
            location: location || "Main Center",
            status: "Available"
        };

        const result = await bloodCollection.insertOne(newUnit);

        if (result.insertedId) {
            res.status(201).json({ success: true, data: newUnit });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;