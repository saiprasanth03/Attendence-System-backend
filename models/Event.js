// const mongoose = require("mongoose");

// const eventSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },

//     type: {
//       type: String,
//       enum: ["online", "offline"],
//       required: true,
//     },

//     date: { type: Date, required: true },

//     location: String,       // for offline
//     meetingLink: String,    // for online

//     qrToken: { type: String, unique: true },

//     isActive: { type: Boolean, default: false },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     allowedRegion: {
//       type: [[Number]], // Array of [lng, lat]
//       default: []
//     }


//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Event", eventSchema);



const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    type: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },

    date: { type: Date, required: true },

    location: String,
    meetingLink: String,

    qrToken: { type: String, unique: true },

    isActive: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔥 IMPORTANT: store as [lng, lat]
    allowedRegion: {
      type: [[Number]], // [lng, lat]
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
