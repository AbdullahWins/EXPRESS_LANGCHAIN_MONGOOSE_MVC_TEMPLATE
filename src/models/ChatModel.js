const mongoose = require("mongoose");
const { Timekoto } = require("timekoto");

const chatSchema = new mongoose.Schema({
  userId: String,
  moduleName: String,
  chatId: Number,
  message: String,
  moduleName: String,
  sentBy: String,
  createdAt: {
    type: Number,
    default: Timekoto(),
  },
});
const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
