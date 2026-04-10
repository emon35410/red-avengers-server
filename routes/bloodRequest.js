const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const requests = await db
      .collection("blood_requests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/my-requests/:email", async (req, res) => {
  try {
    const db = getDB();
    const email = req.params.email;

    const myRequests = await db
      .collection("blood_requests")
      .find({ requesterEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: myRequests.length,
      data: myRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const db = getDB();
    const requestCollection = db.collection("blood_requests");

    const {
      recipientName,
      bloodGroup,
      phone,
      deadline,
      location,
      message,
      priority,
      status,
      requesterEmail,
    } = req.body;

    const newRequest = {
      requestId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: recipientName || "N/A",
      requesterEmail: requesterEmail || "Anonymous",
      bloodGroup: (bloodGroup || "Unknown").toUpperCase().trim(),
      phone: phone || "N/A",
      location: location || "Emergency Site",
      deadline: deadline ? new Date(deadline) : null,
      message: message || "No additional message",
      priority: priority || "Normal",
      status: status || "Pending",

      createdAt: new Date(),
    };

    const result = await requestCollection.insertOne(newRequest);

    if (result.insertedId) {
      res.status(201).json({
        success: true,
        insertedId: result.insertedId,
        data: newRequest,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/update-status/:id", async (req, res) => {
  try {
    const db = getDB();
    const { status, donorEmail, donorName } = req.body;
    const id = req.params.id;

    const bloodRequest = await db
      .collection("blood_requests")
      .findOne({ _id: new ObjectId(id) });
    if (!bloodRequest)
      return res.status(404).json({ message: "Request not found" });

    let updateDoc = {};

    // --- PHASE: ACCEPTED ---
    if (status === "Accepted") {
      updateDoc.$set = {
        status: "Accepted",
        donorEmail,
        donorName,
        tempAcceptedDate: new Date(),
      };
    }
    // --- PHASE: COMPLETED (অটোমেটিক হিস্ট্রি আপডেট সহ) ---
    else if (status === "Completed") {
      const completionDate = new Date();
      updateDoc.$set = {
        status: "Completed",
        completedAt: completionDate,
      };
      updateDoc.$unset = { tempAcceptedDate: "" };

      if (donorEmail) {
        // ডোনরের প্রোফাইলে হিস্ট্রি যোগ এবং ৩ মাসের লক সেট করা
        await db.collection("users").updateOne(
          { email: donorEmail },
          {
            $push: {
              donationHistory: {
                requestId: bloodRequest.requestId,
                recipientName: bloodRequest.recipientName,
                location: bloodRequest.location,
                date: completionDate,
                bloodGroup: bloodRequest.bloodGroup,
                id: new ObjectId(),
              },
            },
            $inc: { totalDonations: 1 },
            $set: {
              lastDonationDate: completionDate, // ফ্রন্টএন্ড লকের জন্য
              lastAcceptedDate: completionDate, // আপনার আগের লজিকের জন্য
            },
          },
        );
      }
    }
    // --- PHASE: CANCEL (আবার এভেইলএবল করা) ---
    else if (status === "Approved") {
      updateDoc.$set = { status: "Approved" };
      updateDoc.$unset = {
        tempAcceptedDate: "",
        donorEmail: "",
        donorName: "",
      };
    } else {
      updateDoc.$set = { status: status };
    }

    const result = await db
      .collection("blood_requests")
      .updateOne({ _id: new ObjectId(id) }, updateDoc);

    res
      .status(200)
      .json({ success: true, message: `Mission marked as ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
