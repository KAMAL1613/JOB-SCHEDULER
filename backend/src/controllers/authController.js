const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// Register
const register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await prisma.users.findUnique({
            where: {
                email: email
            }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                full_name,
                email,
                password_hash: hashedPassword
            }
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: Number(user.id),
                    full_name: user.full_name,
                    email: user.email
                }
            }
        });

    } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
        message: error.message
    });
}
};

// Login
const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await prisma.users.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            {
                id: Number(user.id),
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login Successful",
            data: {
                token,
                user: {
                    id: Number(user.id),
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
        message: error.message
    });
}
};

module.exports = {
    register,
    login
};