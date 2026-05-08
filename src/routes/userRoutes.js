const express = require("express");

const router = express.Router();

const User = require("../models/User");

// GET ALL USERS
router.get("/", async (req, res) => {
  try {
    console.log("[Users] fetching users");

    const users = await User.find().select("-password");

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.log("[Users] fetch error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// SAVE FCM TOKEN
router.post("/save-fcm-token", async (req, res) => {
  try {
    console.log("[FCM] save token request:", req.body);

    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        error: "userId and fcmToken required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fcmToken,
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("[FCM] token saved successfully");

    res.json({
      success: true,
      message: "FCM token saved",
    });
  } catch (err) {
    console.log("[FCM] save token error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
