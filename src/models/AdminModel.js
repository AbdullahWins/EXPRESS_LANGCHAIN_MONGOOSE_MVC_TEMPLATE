const mongoose = require("mongoose");
const { Timekoto } = require("timekoto");

const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
  gender: String,
  fileUrl: String,
  createdAt: {
    type: Number,
    default: Timekoto(),
  },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
