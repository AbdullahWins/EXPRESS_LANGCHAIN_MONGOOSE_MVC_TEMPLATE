const mongoose = require("mongoose");
const { Timekoto } = require("timekoto");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  gender: String,
  fileUrl: String,
  createdAt: {
    type: Number,
    default: Timekoto(),
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
