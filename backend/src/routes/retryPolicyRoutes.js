const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createRetryPolicy,
    getRetryPolicies,
    getRetryPolicyById,
    updateRetryPolicy,
    deleteRetryPolicy
} = require("../controllers/retryPolicyController");

// Protected CRUD routes for Retry Policies
router.post("/", authMiddleware, createRetryPolicy);
router.get("/", authMiddleware, getRetryPolicies);
router.get("/:id", authMiddleware, getRetryPolicyById);
router.put("/:id", authMiddleware, updateRetryPolicy);
router.delete("/:id", authMiddleware, deleteRetryPolicy);

module.exports = router;
