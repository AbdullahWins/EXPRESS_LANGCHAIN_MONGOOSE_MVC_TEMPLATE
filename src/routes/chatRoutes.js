const router = require("express").Router();

const {
  getAllChats,
  getOneChat,
  getChatsByUser,
  getLastChatsByUser,
  addOneChat,
  deleteOneChatByChatId,
} = require("../controllers/chatController");
const { authorizeUserOrAdmin } = require("../middlewares/AuthorizeUserOrAdmin");

router.get("/chats/all", authorizeUserOrAdmin, getAllChats);
router.get("/chats/find/:id", authorizeUserOrAdmin, getOneChat);
router.get("/chats/users/:userId", authorizeUserOrAdmin, getChatsByUser);
router.get("/chats/last/:userId", authorizeUserOrAdmin, getLastChatsByUser);
router.post("/chats/add", authorizeUserOrAdmin, addOneChat);
router.delete("/chats/delete", authorizeUserOrAdmin, deleteOneChatByChatId);

module.exports = router;
