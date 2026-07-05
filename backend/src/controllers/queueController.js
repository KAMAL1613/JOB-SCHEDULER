const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create Queue
const createQueue = async (req, res) => {
    try {
        const { project_id, queue_name, priority, concurrency_limit, retry_policy_id } = req.body;

        if (!project_id || !queue_name) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Queue name are required",
                data: {}
            });
        }

        // Verify project exists
        const project = await prisma.projects.findUnique({
            where: { id: BigInt(project_id) }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
                data: {}
            });
        }

        // Build create data
        const data = {
            queue_name,
            project_id: BigInt(project_id),
            priority: priority ? parseInt(priority, 10) : 1,
            concurrency_limit: concurrency_limit ? parseInt(concurrency_limit, 10) : 5,
            status: "ACTIVE"
        };

        if (retry_policy_id) {
            data.retry_policy_id = BigInt(retry_policy_id);
        }

        const queue = await prisma.queues.create({
            data,
            include: {
                retry_policies: true
            }
        });

        res.status(201).json({
            success: true,
            message: "Queue created successfully",
            data: { queue }
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

// Get All Queues
const getQueues = async (req, res) => {
    try {
        const { project_id } = req.query;

        const filter = {};
        if (project_id) {
            filter.project_id = BigInt(project_id);
        }

        const queues = await prisma.queues.findMany({
            where: filter,
            include: {
                projects: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                retry_policies: true,
                _count: {
                    select: {
                        jobs: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: "Queues retrieved successfully",
            data: { queues }
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

// Update Queue (including pause/resume)
const updateQueue = async (req, res) => {
    try {
        const { queue_name, priority, concurrency_limit, status, retry_policy_id } = req.body;

        const updateData = {};
        if (queue_name !== undefined) updateData.queue_name = queue_name;
        if (priority !== undefined) updateData.priority = parseInt(priority, 10);
        if (concurrency_limit !== undefined) updateData.concurrency_limit = parseInt(concurrency_limit, 10);
        if (status !== undefined) {
            if (status !== "ACTIVE" && status !== "PAUSED") {
                return res.status(400).json({
                    success: false,
                    message: "Status must be either ACTIVE or PAUSED",
                    data: {}
                });
            }
            updateData.status = status;
        }
        if (retry_policy_id !== undefined) {
            updateData.retry_policy_id = retry_policy_id ? BigInt(retry_policy_id) : null;
        }

        const queue = await prisma.queues.update({
            where: {
                id: BigInt(req.params.id)
            },
            data: updateData,
            include: {
                retry_policies: true
            }
        });

        res.json({
            success: true,
            message: "Queue updated successfully",
            data: { queue }
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

// Delete Queue
const deleteQueue = async (req, res) => {
    try {
        await prisma.queues.delete({
            where: {
                id: BigInt(req.params.id)
            }
        });

        res.json({
            success: true,
            message: "Queue deleted successfully",
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
    createQueue,
    getQueues,
    updateQueue,
    deleteQueue
};
