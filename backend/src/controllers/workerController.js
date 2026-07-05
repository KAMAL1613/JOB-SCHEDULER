const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Register Worker
const registerWorker = async (req, res) => {
    try {
        const { worker_name, host_name } = req.body;

        if (!worker_name) {
            return res.status(400).json({
                success: false,
                message: "worker_name is required",
                data: {}
            });
        }

        const worker = await prisma.workers.create({
            data: {
                worker_name,
                host_name: host_name || "localhost",
                status: "ONLINE"
            }
        });

        // Add initial heartbeat
        await prisma.worker_heartbeats.create({
            data: {
                worker_id: worker.id,
                heartbeat_time: new Date()
            }
        });

        res.status(201).json({
            success: true,
            message: "Worker registered successfully",
            data: { worker }
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

// Get All Workers
const getWorkers = async (req, res) => {
    try {
        // Define offline threshold (e.g. 30 seconds since last heartbeat)
        const offlineThreshold = new Date(Date.now() - 30 * 1000);

        const workersList = await prisma.workers.findMany({
            include: {
                worker_heartbeats: {
                    orderBy: {
                        heartbeat_time: "desc"
                    },
                    take: 1
                },
                _count: {
                    select: {
                        job_executions: {
                            where: {
                                execution_status: "RUNNING"
                            }
                        }
                    }
                }
            }
        });

        // Map online/offline status dynamically based on heartbeat
        const workers = workersList.map(worker => {
            const lastHeartbeat = worker.worker_heartbeats[0]?.heartbeat_time;
            let currentStatus = worker.status;
            if (!lastHeartbeat || new Date(lastHeartbeat) < offlineThreshold) {
                currentStatus = "OFFLINE";
            }
            return {
                ...worker,
                status: currentStatus,
                last_heartbeat: lastHeartbeat || null
            };
        });

        res.json({
            success: true,
            message: "Workers retrieved successfully",
            data: { workers }
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

// Update Worker Status / Ping Heartbeat
const updateWorkerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const workerId = BigInt(req.params.id);

        const updateData = {};
        if (status) {
            if (!["ONLINE", "OFFLINE", "BUSY"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be ONLINE, OFFLINE, or BUSY",
                    data: {}
                });
            }
            updateData.status = status;
        }

        const worker = await prisma.workers.update({
            where: { id: workerId },
            data: updateData
        });

        // Record a heartbeat whenever status updates or worker pings
        await prisma.worker_heartbeats.create({
            data: {
                worker_id: workerId,
                heartbeat_time: new Date()
            }
        });

        res.json({
            success: true,
            message: "Worker heartbeat/status updated successfully",
            data: { worker }
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

// Delete Worker
const deleteWorker = async (req, res) => {
    try {
        await prisma.workers.delete({
            where: { id: BigInt(req.params.id) }
        });

        res.json({
            success: true,
            message: "Worker deleted successfully",
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
    registerWorker,
    getWorkers,
    updateWorkerStatus,
    deleteWorker
};
