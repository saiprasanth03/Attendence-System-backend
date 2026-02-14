const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["admin", "pr", "member"],
    default: "member"
  },
  status: {
    type: String,
    enum: ["pending", "approved"],
    default: "pending" // Everyone pending by default
  }
});

module.exports = mongoose.model("User", userSchema);
