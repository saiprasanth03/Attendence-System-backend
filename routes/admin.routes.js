const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get all pending users (Member + PR)
router.get("/pending", auth(["admin"]), async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["member", "pr"] },
      status: "pending"
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

// Approve user
router.put("/approve/:id", auth(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      status: "approved"
    });

    res.json("User approved");
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

module.exports = router;
