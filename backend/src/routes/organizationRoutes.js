const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
} = require("../controllers/organizationController");

// Create Organization
router.post("/", authMiddleware, createOrganization);

// Get All Organizations
router.get("/", authMiddleware, getOrganizations);

// Get Organization By ID
router.get("/:id", authMiddleware, getOrganizationById);

// Update Organization
router.put("/:id", authMiddleware, updateOrganization);

// Delete Organization
router.delete("/:id", authMiddleware, deleteOrganization);

module.exports = router;