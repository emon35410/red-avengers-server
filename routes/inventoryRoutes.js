const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');

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
router.post('/add', async (req, res) => {
    try {
        const db = getDB();
        const bloodCollection = db.collection('blood_inventory');
        const { bloodGroup, location } = req.body;

        const collectionDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(collectionDate.getDate() + 42); // ৪২ দিন মেয়াদ

        const newUnit = {
            unitId: `RA-${Math.floor(1000 + Math.random() * 9000)}`,
            bloodGroup: bloodGroup.toUpperCase().trim(),
            volume: "450 ml",
            quality: "Lab Verified",
            collectionDate,
            expiryDate,
            location: location || "Main Center",
            status: "Available"
        };

        const result = await bloodCollection.insertOne(newUnit);
        res.status(201).json({ success: true, data: newUnit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;