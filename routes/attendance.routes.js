const router = require("express").Router();
const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const auth = require("../middleware/auth");

// =====================================
// HELPER: POINT IN POLYGON (lng, lat)
// =====================================
function isPointInsidePolygon(point, polygon) {
  const [x, y] = point; // x = lng, y = lat
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

// =====================================
// MARK ATTENDANCE
// =====================================
router.post("/mark", auth(["member"]), async (req, res) => {
  try {
    const { qrToken, latitude, longitude } = req.body;

    if (!qrToken) {
      return res.status(400).json("QR token missing");
    }

    if (latitude == null || longitude == null) {
      return res.status(400).json("Location required");
    }

    const parts = qrToken.split("-");
    if (parts.length !== 2) {
      return res.status(400).json("Invalid QR format");
    }

    const eventId = parts[0];
    const scannedWindow = parseInt(parts[1]);

    const foundEvent = await Event.findById(eventId);

    if (!foundEvent) {
      return res.status(400).json("Event not found");
    }

    if (!foundEvent.isActive) {
      return res.status(400).json("Event not active");
    }

    // =============================
    // QR TIME VALIDATION
    // =============================
    const currentWindow = Math.floor(Date.now() / 50000);

    if (
      scannedWindow !== currentWindow &&
      scannedWindow !== currentWindow - 1
    ) {
      return res.status(400).json("QR expired");
    }

    // =============================
    // LOCATION VALIDATION (ONLY ONCE)
    // =============================
    if (foundEvent.type === "offline") {
      if (!foundEvent.allowedRegion || foundEvent.allowedRegion.length === 0) {
        return res.status(400).json("Event location not configured");
      }

      const isInside = isPointInsidePolygon(
        [Number(longitude), Number(latitude)],
        foundEvent.allowedRegion
      );

      if (!isInside) {
        return res.status(403).json("You are outside allowed region");
      }
    }

    // =============================
    // CREATE ATTENDANCE
    // =============================
    await Attendance.create({
      userId: req.user.id,
      eventId: foundEvent._id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      ipAddress: req.ip,
    });

    return res.json("Attendance marked successfully");

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json("Attendance already marked");
    }

    console.error("MARK ATTENDANCE ERROR:", err);
    return res.status(500).json("Server error");
  }
});



// =====================================
// GET ALL ATTENDANCE (Admin / PR)
// =====================================
router.get("/all", auth(["admin", "pr"]), async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("userId", "name email role")
      .populate("eventId", "title date")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

// =====================================
// GET EVENT-WISE ATTENDANCE
// =====================================
router.get("/event/:eventId", auth(["admin", "pr"]), async (req, res) => {
  try {
    const records = await Attendance.find({
      eventId: req.params.eventId,
    })
      .populate("userId", "name email role")
      .populate("eventId", "title date")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

// =====================================
// GET MY ATTENDANCE (Member)
// =====================================
router.get("/my", auth(["member"]), async (req, res) => {
  try {
    const records = await Attendance.find({
      userId: req.user.id,
    })
      .populate("eventId", "title date")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

module.exports = router;


const ExcelJS = require("exceljs");

// =====================================
// EXPORT EVENT ATTENDANCE TO EXCEL
// =====================================
router.get("/export/:eventId", auth(["admin", "pr"]), async (req, res) => {
  try {
    const records = await Attendance.find({
      eventId: req.params.eventId,
    })
      .populate("userId", "name email role")
      .populate("eventId", "title date");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Role", key: "role", width: 15 },
      { header: "Location", key: "location", width: 40 },
      { header: "Date", key: "date", width: 25 },
    ];

    records.forEach((record) => {
      worksheet.addRow({
        name: record.userId?.name,
        email: record.userId?.email,
        role: record.userId?.role,
        location: record.address,
        date: new Date(record.createdAt).toLocaleString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json("Export failed");
  }
});
