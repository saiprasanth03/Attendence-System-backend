const router = require("express").Router();
const Event = require("../models/Event");
const auth = require("../middleware/auth");
const crypto = require("crypto");


// =============================
// CREATE EVENT (Admin)
// =============================
router.post("/create", auth(["admin"]), async (req, res) => {
  try {
    const {
      title,
      type,
      date,
      location,
      meetingLink,
      allowedRegion
    } = req.body;

    if (!title || !type || !date) {
      return res.status(400).json("Required fields missing");
    }

    const qrToken = crypto.randomBytes(16).toString("hex");

    // Only one active event at a time
    await Event.updateMany({}, { isActive: false });

    const event = await Event.create({
      title,
      type,
      date,
      location,
      meetingLink,

      // ✅ DO NOT FLIP
      allowedRegion: type === "offline"
        ? allowedRegion
        : [],

      qrToken,
      createdBy: req.user.id,
      isActive: true
    });

    res.json(event);

  } catch (err) {
    console.error("CREATE EVENT ERROR:", err);
    res.status(500).json("Server error");
  }
});


// =============================
// GET CURRENT ACTIVE EVENT
// =============================
router.get("/active", auth(["admin", "member", "pr"]), async (req, res) => {
  try {
    const event = await Event.findOne({ isActive: true })
      .sort({ createdAt: -1 });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});


// =============================
// GET ALL EVENTS
// =============================
router.get("/all", auth(["admin", "pr"]), async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});


// =============================
// ACTIVATE EVENT
// =============================
router.put("/activate/:id", auth(["admin"]), async (req, res) => {
  try {
    await Event.updateMany({}, { isActive: false });

    await Event.findByIdAndUpdate(req.params.id, {
      isActive: true
    });

    res.json("Event activated");
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});


// =============================
// UPDATE LOCATION (Admin)
// =============================
router.put("/update-location/:id", auth(["admin"]), async (req, res) => {
  try {
    const { allowedRegion } = req.body;

    if (!allowedRegion || allowedRegion.length === 0) {
      return res.status(400).json("Region required");
    }

    // ✅ DO NOT FLIP
    await Event.findByIdAndUpdate(req.params.id, {
      allowedRegion
    });

    res.json("Location updated");

  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});


// =============================
// DELETE EVENT
// =============================
router.delete("/:id", auth(["admin"]), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json("Event deleted");
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});


// =============================
// GET SINGLE EVENT
// =============================
router.get("/:id", auth(["admin", "pr"]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

module.exports = router;


// =============================
// DISABLE EVENT (Admin)
// =============================
router.put("/disable/:id", auth(["admin"]), async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, {
      isActive: false,
    });

    res.json("Event disabled successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});
