const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createQueue,
    getQueues,
    updateQueue,
    deleteQueue
} = require("../controllers/queueController");

// Protected CRUD routes for Queues
router.post("/", authMiddleware, createQueue);
router.get("/", authMiddleware, getQueues);
router.put("/:id", authMiddleware, updateQueue);
router.delete("/:id", authMiddleware, deleteQueue);

module.exports = router;
