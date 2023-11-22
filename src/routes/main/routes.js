const express = require("express");
const router = express.Router();

// Import routes
const adminRoutes = require("../adminRoutes");
const userRoutes = require("../userRoutes");
const aiRoutes = require("../aiRoutes");
const chatRoutes = require("../chatRoutes");

// Routes
router.use(adminRoutes);
router.use(userRoutes);
router.use(aiRoutes);
router.use(chatRoutes);

module.exports = router;
