const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json("Email already registered");
    }

    const hashed = await bcrypt.hash(password, 10);

    // Only Admin auto-approved
    let status = "pending";
    if (role === "admin") {
      status = "approved";
    }

    await User.create({
      name,
      email,
      password: hashed,
      role,
      status
    });

    res.json({
      message:
        role === "admin"
          ? "Admin registered. You can login."
          : "Registered successfully. Wait for admin approval."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});




// LOGIN
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.status(401).json("Invalid credentials");

  if (user.status !== "approved") {
    return res.status(403).json("Awaiting admin approval");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, 
            role: user.role,
            name: user.name  });
});

module.exports = router;
