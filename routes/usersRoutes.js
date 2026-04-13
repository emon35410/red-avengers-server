const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");


// ✅ Get all donors
router.get("/all-donors", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const result = await usersCollection.find({ role: "donor" }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ✅ Get all volunteers
router.get("/all-volunteers", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const result = await usersCollection.find({ role: "volunteer" }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ✅ Get role by email
router.get("/role/:email", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const email = req.params.email;
    const user = await usersCollection.findOne({ email: email }, { projection: { role: 1, _id: 0 } });
    if (user) {
      res.send({ role: user.role });
    } else {
      res.status(404).send({ message: "User not found", role: null });
    }
  } catch (error) {
    res.status(500).send({ message: "Error fetching role", error: error.message });
  }
});

// ✅ Donation History
router.get("/donation-history/:email", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const email = req.params.email;
    const user = await usersCollection.findOne({ email: email }, { projection: { donationHistory: 1, totalDonations: 1, lastDonationDate: 1, _id: 0 } });
    if (!user) return res.status(404).send({ success: false, message: "User not found" });
    const history = user.donationHistory ? [...user.donationHistory].reverse() : [];
    res.send({ success: true, totalDonations: user.totalDonations || 0, lastDonationDate: user.lastDonationDate || null, history: history });
  } catch (error) {
    res.status(500).send({ message: "Error fetching history", error: error.message });
  }
});

// ✅ get user profile by email
router.get("/profile/:email", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const email = req.params.email;
    const result = await usersCollection.findOne({ email: email });
    if (!result) return res.status(404).send({ success: false, message: "User not found" });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching user info", error: error.message });
  }
});

// ✅ get user's blood group by email
router.get("/blood-group/:email", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const email = req.params.email;
    const user = await usersCollection.findOne({ email: email }, { projection: { bloodGroup: 1, _id: 0 } });
    if (!user) return res.status(404).send({ success: false, message: "User not found" });
    res.send({ bloodGroup: user.bloodGroup });
  } catch (error) {
    res.status(500).send({ message: "Error fetching blood group", error: error.message });
  }
});


// ✅ New user registration
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const user = req.body;
    const existingUser = await usersCollection.findOne({ email: user.email });
    if (existingUser) return res.send({ message: "User already exists", insertedId: null });

    const newUser = {
      uid: user.uid,
      name: user.name || "Anonymous",
      email: user.email,
      photoURL: user.photoURL || "",
      bloodGroup: user.bloodGroup || "",
      district: "",
      upazila: "",
      phone: "",
      role: "user",
      status: "active",
      createdAt: new Date(),
    };
    const result = await usersCollection.insertOne(newUser);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error saving user", error: error.message });
  }
});

// ✅ Update Donation History
router.patch("/add-donation-history/:email", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const { recipientName, location, date } = req.body;
    const updateDoc = {
      $push: { donationHistory: { recipientName, location, date: new Date(date), id: new ObjectId() } },
      $inc: { totalDonations: 1 },
      $set: { lastDonationDate: new Date(date) },
    };
    const result = await usersCollection.updateOne({ email: req.params.email }, updateDoc);
    res.send({ success: true, result });
  } catch (error) {
    res.status(500).send({ message: "Update failed", error: error.message });
  }
});

// ✅ Admin change Role/Status
router.patch("/admin/:id", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const { role, status } = req.body;
    const filter = { _id: new ObjectId(req.params.id) };
    const updateDoc = { $set: { ...(role && { role }), ...(status && { status }) } };
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Update failed", error: error.message });
  }
});

// ✅ Update user by email
router.patch("/update-by-email/:email", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const updatedData = req.body;
    const updateDoc = {
      $set: {
        ...(updatedData.name && { name: updatedData.name }),
        ...(updatedData.phone && { phone: updatedData.phone }),
        ...(updatedData.district && { district: updatedData.district }),
        ...(updatedData.upazila && { upazila: updatedData.upazila }),
        ...(updatedData.photoURL && { photoURL: updatedData.photoURL }),
        ...(updatedData.lastRegistrationDate && { lastRegistrationDate: updatedData.lastRegistrationDate }), // এটি দরকার ছিল
      },
    };
    const result = await usersCollection.updateOne({ email: req.params.email }, updateDoc);
    res.send({ success: true, result });
  } catch (error) {
    res.status(500).send({ message: "Update failed", error: error.message });
  }
});

// ✅ update user by uid (for donor registration)
router.patch("/:uid", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const updatedData = req.body;
    const updateDoc = {
      $set: {
        bloodGroup: updatedData.bloodGroup,
        district: updatedData.district,
        upazila: updatedData.upazila,
        phone: updatedData.phone,
        role: "donor",
        isDonor: true,
        status: "active",
        totalDonations: 0,
        donationHistory: [],
      },
    };
    const result = await usersCollection.updateOne({ uid: req.params.uid }, updateDoc);
    res.send({ success: true, result });
  } catch (error) {
    res.status(500).send({ message: "Update failed", error: error.message });
  }
});

// ---------------------------------------------------------
// 3. GENERAL & DYNAMIC ROUTES (SHEYSH E)
// ---------------------------------------------------------

// ✅ All users fetching with pagination
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const role = req.query.role || "";
    const filter = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (role && role !== "all") filter.role = role;

    const [users, total] = await Promise.all([usersCollection.find(filter).skip(skip).limit(limit).toArray(), usersCollection.countDocuments(filter)]);
    res.send({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).send({ message: "Error fetching users", error: error.message });
  }
});

// ✅ User fetching by uid (SHEYSH E RAKHTE HOBE)
router.get("/:uid", async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const result = await usersCollection.findOne({ uid: req.params.uid });
    if (!result) return res.status(404).send({ success: false, message: "User not found" });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error", error: error.message });
  }
});

module.exports = router;