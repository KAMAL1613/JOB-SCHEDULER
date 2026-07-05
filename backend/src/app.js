const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// BigInt serialization patch for JSON responses
BigInt.prototype.toJSON = function() {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
};

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Load routes
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const projectRoutes = require("./routes/projectRoutes");
const queueRoutes = require("./routes/queueRoutes");
const jobRoutes = require("./routes/jobRoutes");
const workerRoutes = require("./routes/workerRoutes");
const retryPolicyRoutes = require("./routes/retryPolicyRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Register Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/retry-policies", retryPolicyRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Home Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Distributed Job Scheduler API is Running",
        data: {}
    });
});

// Health Route
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Health status retrieved",
        data: {
            status: "UP",
            database: "Connected",
            server: "Running"
        }
    });
});

// 404 Route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
        data: {}
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        data: {}
    });
});

module.exports = app;