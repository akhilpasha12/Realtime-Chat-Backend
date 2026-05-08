const User = require("../models/User");

exports.saveFCMToken = async (req, res) => {
  try {
    console.log("[FCM] save token body:", req.body);

    const { userId, fcmToken } = req.body;

    // VALIDATION
    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        error: "userId and fcmToken required",
      });
    }

    // UPDATE USER
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
};
