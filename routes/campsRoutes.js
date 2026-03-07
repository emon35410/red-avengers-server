const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb'); 

// new camp creation (POST)
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const campsCollection = db.collection('camps');
        const campData = req.body;

        const newCamp = {
            ...campData,
            registeredDonors: [], // inially empty array for donors
            createdAt: new Date()
        };

        const result = await campsCollection.insertOne(newCamp);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error creating camp", error: error.message });
    }
});

// camps fetching (GET)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const campsCollection = db.collection('camps');
        // latest camps first
        const result = await campsCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error fetching camps", error: error.message });
    }
});

// camp donor registration (PATCH)
router.patch('/register/:id', async (req, res) => {
    try {
        const db = getDB();
        const campsCollection = db.collection('camps');
        const campId = req.params.id;
        const donorInfo = req.body.donorInfo;

        const filter = { _id: new ObjectId(campId) };
        
        // check if donor already registered for this camp
        const existingCamp = await campsCollection.findOne({
            _id: new ObjectId(campId),
            "registeredDonors.uid": donorInfo.uid
        });

        if (existingCamp) {
            return res.send({ success: false, message: "You have already joined this camp!" });
        }

        const updateDoc = {
            $push: {
                registeredDonors: {
                    uid: donorInfo.uid,
                    name: donorInfo.name,
                    email: donorInfo.email,
                    photo: donorInfo.photo,
                    registeredAt: new Date()
                }
            }
        };

        const result = await campsCollection.updateOne(filter, updateDoc);
        res.send({ success: true, result });
    } catch (error) {
        res.status(500).send({ message: "Failed to register", error: error.message });
    }
});
module.exports = router;