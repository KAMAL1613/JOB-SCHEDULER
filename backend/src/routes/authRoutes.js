const express = require("express");

const router = express.Router();

const {
    register,
    login
} = require("../controllers/authController");

// Register User
router.get("/register", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Use POST /api/auth/register to create a new account"
    });
});
router.post("/register", register);

// Login User
router.get("/login", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Use POST /api/auth/login to sign in"
    });
});
router.post("/login", login);

module.exports = router;