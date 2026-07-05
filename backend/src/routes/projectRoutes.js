const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require("../controllers/projectController");

// Protected CRUD routes for Projects
router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, getProjectById);
router.put("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);

module.exports = router;
