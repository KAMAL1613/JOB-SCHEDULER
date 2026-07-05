const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createJob,
    getJobs,
    updateJobStatus,
    retryFailedJob,
    deleteJob
} = require("../controllers/jobController");

// Protected CRUD routes for Jobs
router.post("/", authMiddleware, createJob);
router.get("/", authMiddleware, getJobs);
router.put("/:id/status", authMiddleware, updateJobStatus);
router.post("/:id/retry", authMiddleware, retryFailedJob);
router.delete("/:id", authMiddleware, deleteJob);

module.exports = router;
