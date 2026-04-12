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
    const io = req.app.get("io");

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
      if (io) {
        io.emit("new_blood_request", {
          id: result.insertedId,
          type: "info",
          title: "New Emergency Mission",
          desc: `${newRequest.bloodGroup} needed for ${newRequest.recipientName} at ${newRequest.location}`,
          senderEmail: requesterEmail,
          link: "/dashboard/allrequests",
        });
      }

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
    const { status, donorEmail: donorEmailFromClient, donorName } = req.body;
    const id = req.params.id;
    const io = req.app.get("io");

    // ১. ডাটাবেস থেকে রিকোয়েস্টটি খুঁজে বের করা
    const bloodRequest = await db
      .collection("blood_requests")
      .findOne({ _id: new ObjectId(id) });

    if (!bloodRequest)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    let updateDoc = {};

    // --- PHASE: ACCEPTED ---
    if (status === "Accepted") {
      updateDoc.$set = {
        status: "Accepted",
        donorEmail: donorEmailFromClient,
        donorName: donorName,
        tempAcceptedDate: new Date(),
      };
    }
    // --- PHASE: COMPLETED (Donation History Update Logic) ---
    else if (status === "Completed") {
      const completionDate = new Date();
      updateDoc.$set = { status: "Completed", completedAt: completionDate };
      updateDoc.$unset = { tempAcceptedDate: "" };

      // ডাটাবেসে সেভ করা ডোনার ইমেইল নিন (Brave issue fix)
      const finalDonorEmail = bloodRequest.donorEmail || donorEmailFromClient;

      if (finalDonorEmail) {
        // ডোনারের হিস্ট্রি আপডেট
        await db.collection("users").updateOne(
          { email: finalDonorEmail },
          {
            $push: {
              donationHistory: {
                recipientName: bloodRequest.recipientName,
                location: bloodRequest.location,
                date: completionDate,
                bloodGroup: bloodRequest.bloodGroup,
                requestId: bloodRequest.requestId,
                id: new ObjectId(),
              },
            },
            $inc: { totalDonations: 1 },
            $set: { lastDonationDate: completionDate },
          },
        );
      }
    }
    // --- PHASE: APPROVED ---
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

    // --- REAL-TIME NOTIFICATION LOGIC ---
    if (result.modifiedCount > 0 && io) {
      // A. রিকুয়েস্টারের জন্য (সবসময় Targeted)
      const userNotif = {
        type: status === "Accepted" ? "info" : "success",
        title:
          status === "Accepted"
            ? "Donor Found!"
            : status === "Approved"
              ? "Request Live!"
              : "Donation Completed!",
        desc:
          status === "Accepted"
            ? `${donorName} accepted your request.`
            : `Your request for ${bloodRequest.recipientName} is now ${status.toLowerCase()}.`,
        link: "/dashboard/my-requests", 
      };
      io.to(bloodRequest.requesterEmail).emit("new_blood_request", userNotif);

      // B. ডোনারের জন্য (যদি Completed হয়)
      if (status === "Completed" && bloodRequest.donorEmail) {
        io.to(bloodRequest.donorEmail).emit("new_blood_request", {
          type: "success",
          title: "Mission Accomplished!",
          desc: "Thank you for your donation. Your history is updated.",
          link: "/dashboard/donation-history", // ডোনার তার হিস্ট্রি পেজে যাবে
        });
      }

      // C. অ্যাডমিন/ভলান্টিয়ারের জন্য (শুধুমাত্র Global Broadcast)
      if (status === "Accepted") {
        io.emit("new_blood_request", {
          type: "warning",
          title: "Mission Started",
          desc: `Donor ${donorName} is handling request ${bloodRequest.requestId}`,
          link: "/dashboard/allrequests", // অ্যাডমিন অল-রিকুয়েস্টে যাবে
          roleSpecific: ["admin", "volunteer"],
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
