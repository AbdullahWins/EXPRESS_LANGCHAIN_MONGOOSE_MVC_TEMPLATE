// Controllers/chatController.js

const { ObjectId } = require("mongodb");
const { Timekoto } = require("timekoto");
const Chat = require("../models/ChatModel");
const AccessValidator = require("../services/validators/AccessValidator");

//get all chat using mongoose
const getAllChats = async (req, res) => {
  try {
    //validate user authority from middleware
    const user = req?.user;
    if (user?.role !== "admin") {
      return res.status(401).send({
        message: "This user does not have access to perform this operation!",
      });
    } else {
      console.log("User is accessing the API!");
    }
    //perform query on database
    const chats = await Chat.find();
    if (chats?.length === 0) {
      return res.send([]);
    }
    console.log(`Found ${chats.length} chats`);
    return res.send(chats);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

//get single chat using mongoose
const getOneChat = async (req, res) => {
  try {
    const chatId = req?.params?.id;
    //object id validation
    if (!ObjectId.isValid(chatId)) {
      console.log("Invalid ObjectId:", chatId);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //perform query on database
    const chat = await Chat.findOne({
      _id: chatId,
    });

    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }

    //validate user authority from middleware
    const user = req.user;
    const userId = chat?.userId;
    const hasAccess = AccessValidator(user, userId);
    if (!hasAccess) {
      return res.status(401).send({
        message: "This user does not have access to perform this operation!",
      });
    }

    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    } else {
      console.log(chat);
      return res.send(chat);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server error" });
  }
};

//get chat By user using mongoose
const getChatsByUser = async (req, res) => {
  try {
    const userId = req?.params?.userId;
    //object id validation
    if (!ObjectId.isValid(userId)) {
      console.log("Invalid ObjectId:", userId);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //validate user authority from middleware
    const user = req.user;
    const hasAccess = AccessValidator(user, userId);
    if (!hasAccess) {
      return res.status(401).send({
        message: "This user does not have access to perform this operation!",
      });
    }

    //to perform single filter
    const filter = { userId: userId };

    //perform query on database
    const chatDetails = await Chat.find(filter).exec();
    if (!chatDetails) {
      res.status(404).send({ message: "Chat not found on this type" });
    } else {
      return res.send(chatDetails);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

//get latest message chat by user using mongoose
const getLastChatsByUser = async (req, res) => {
  try {
    const userId = req?.params?.userId;
    //object id validation
    if (!ObjectId.isValid(userId)) {
      console.log("Invalid ObjectId:", userId);
      return res.status(400).send({ message: "Invalid ObjectId" });
    }

    //to perform single filter
    const filter = { userId: userId };

    //validate user authority from middleware
    const user = req.user;
    const hasAccess = AccessValidator(user, userId);
    if (!hasAccess) {
      return res.status(401).send({
        message: "This user does not have access to perform this operation!",
      });
    }

    //perform query on database
    const chatDetails = await Chat.find(filter).sort({ sentAt: -1 }).limit(1);
    if (!chatDetails) {
      return res.status(404).send({ message: "Chat not found on this type" });
    }
    console.log(chatDetails);
    return res.send(chatDetails);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
};

//add new chat using mongoose
const addOneChat = async (req, res) => {
  try {
    const { userId, moduleName, chatId, message, sentBy } = JSON.parse(
      req?.body?.data
    );
    if (!userId || !moduleName || !chatId || !message || !sentBy) {
      res.status(400).send({ message: "Missing required fields" });
    }
    const newChat = {
      userId,
      moduleName,
      chatId,
      message,
      sentBy,
      sentAt: Timekoto(),
    };

    //validate user authority from middleware
    const user = req.user;
    const hasAccess = AccessValidator(user, userId);
    console.log(hasAccess);
    if (!hasAccess) {
      return res.status(401).send({
        message: "This user does not have access to perform this operation!",
      });
    }
    //add new chat
    const result = await Chat.create(newChat);
    if (result.insertedCount === 0) {
      console.log("Failed to add chat");
      return res.status(500).send({ message: "Failed to add chat" });
    }
    console.log("Added a new chat", newChat);
    return res.status(201).send({ ...newChat, _id: result._id });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res
      .status(500)
      .send({ message: "Failed to add a message to the chat!" });
  }
};

//delete one chat
const deleteOneChatByChatId = async (req, res) => {
  try {
    const { userId, moduleName, chatId } = JSON.parse(req?.body?.data);
    console.log(userId);

    //validate user authority from middleware
    const user = req.user;
    const hasAccess = AccessValidator(user, userId);
    if (!hasAccess) {
      return res.status(401).send({
        message: "This user does not have access to perform this operation!",
      });
    }

    //to perform multiple filters at once
    const filter = {
      userId: userId,
      moduleName: moduleName,
      chatId: chatId,
    };

    const result = await Chat.deleteMany(filter);

    console.log(filter);

    if (result?.deletedCount === 0) {
      console.log("No chat found with this id:", chatId);
      return res.send({ message: "No chat found with this id!" });
    } else {
      console.log("Chat deleted with Id:", chatId);
      return res.status(200).send({
        message: `Chat deleted including ${result?.deletedCount} messages!`,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Failed to delete chat" });
  }
};

module.exports = {
  getAllChats,
  getOneChat,
  getChatsByUser,
  getLastChatsByUser,
  addOneChat,
  deleteOneChatByChatId,
};
