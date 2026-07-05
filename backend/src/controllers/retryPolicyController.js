const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create Retry Policy
const createRetryPolicy = async (req, res) => {
    try {
        const { policy_name, retry_strategy, max_retries, initial_delay_seconds, backoff_multiplier } = req.body;

        if (!policy_name || !retry_strategy || max_retries === undefined || initial_delay_seconds === undefined) {
            return res.status(400).json({
                success: false,
                message: "policy_name, retry_strategy, max_retries, and initial_delay_seconds are required",
                data: {}
            });
        }

        if (!["FIXED", "LINEAR", "EXPONENTIAL"].includes(retry_strategy)) {
            return res.status(400).json({
                success: false,
                message: "retry_strategy must be FIXED, LINEAR, or EXPONENTIAL",
                data: {}
            });
        }

        const retryPolicy = await prisma.retry_policies.create({
            data: {
                policy_name,
                retry_strategy,
                max_retries: parseInt(max_retries, 10),
                initial_delay_seconds: parseInt(initial_delay_seconds, 10),
                backoff_multiplier: backoff_multiplier ? parseFloat(backoff_multiplier) : null
            }
        });

        res.status(201).json({
            success: true,
            message: "Retry Policy created successfully",
            data: { retryPolicy }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Get All Retry Policies
const getRetryPolicies = async (req, res) => {
    try {
        const retryPolicies = await prisma.retry_policies.findMany();

        res.json({
            success: true,
            message: "Retry Policies retrieved successfully",
            data: { retryPolicies }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Get Retry Policy By ID
const getRetryPolicyById = async (req, res) => {
    try {
        const retryPolicy = await prisma.retry_policies.findUnique({
            where: { id: BigInt(req.params.id) }
        });

        if (!retryPolicy) {
            return res.status(404).json({
                success: false,
                message: "Retry Policy not found",
                data: {}
            });
        }

        res.json({
            success: true,
            message: "Retry Policy retrieved successfully",
            data: { retryPolicy }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Update Retry Policy
const updateRetryPolicy = async (req, res) => {
    try {
        const { policy_name, retry_strategy, max_retries, initial_delay_seconds, backoff_multiplier } = req.body;

        const updateData = {};
        if (policy_name !== undefined) updateData.policy_name = policy_name;
        if (retry_strategy !== undefined) {
            if (!["FIXED", "LINEAR", "EXPONENTIAL"].includes(retry_strategy)) {
                return res.status(400).json({
                    success: false,
                    message: "retry_strategy must be FIXED, LINEAR, or EXPONENTIAL",
                    data: {}
                });
            }
            updateData.retry_strategy = retry_strategy;
        }
        if (max_retries !== undefined) updateData.max_retries = parseInt(max_retries, 10);
        if (initial_delay_seconds !== undefined) updateData.initial_delay_seconds = parseInt(initial_delay_seconds, 10);
        if (backoff_multiplier !== undefined) updateData.backoff_multiplier = backoff_multiplier ? parseFloat(backoff_multiplier) : null;

        const retryPolicy = await prisma.retry_policies.update({
            where: { id: BigInt(req.params.id) },
            data: updateData
        });

        res.json({
            success: true,
            message: "Retry Policy updated successfully",
            data: { retryPolicy }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Delete Retry Policy
const deleteRetryPolicy = async (req, res) => {
    try {
        await prisma.retry_policies.delete({
            where: { id: BigInt(req.params.id) }
        });

        res.json({
            success: true,
            message: "Retry Policy deleted successfully",
            data: {}
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

module.exports = {
    createRetryPolicy,
    getRetryPolicies,
    getRetryPolicyById,
    updateRetryPolicy,
    deleteRetryPolicy
};
