const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    registerWorker,
    getWorkers,
    updateWorkerStatus,
    deleteWorker
} = require("../controllers/workerController");

// Protected CRUD routes for Workers
router.post("/", authMiddleware, registerWorker);
router.get("/", authMiddleware, getWorkers);
router.put("/:id", authMiddleware, updateWorkerStatus);
router.delete("/:id", authMiddleware, deleteWorker);

module.exports = router;
