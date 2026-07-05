const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        // Job metrics
        const totalJobs = await prisma.jobs.count();
        const queuedJobs = await prisma.jobs.count({ where: { status: "QUEUED" } });
        const scheduledJobs = await prisma.jobs.count({ where: { status: "SCHEDULED" } });
        const runningJobs = await prisma.jobs.count({ where: { status: "RUNNING" } });
        const completedJobs = await prisma.jobs.count({ where: { status: "COMPLETED" } });
        const failedJobs = await prisma.jobs.count({ where: { status: "FAILED" } });
        const deadLetterJobs = await prisma.jobs.count({ where: { status: "DEAD_LETTER" } });

        // Worker metrics
        const offlineThreshold = new Date(Date.now() - 30 * 1000);
        const workers = await prisma.workers.findMany({
            include: {
                worker_heartbeats: {
                    orderBy: { heartbeat_time: "desc" },
                    take: 1
                }
            }
        });

        let onlineWorkersCount = 0;
        let offlineWorkersCount = 0;

        workers.forEach(w => {
            const lastHeartbeat = w.worker_heartbeats[0]?.heartbeat_time;
            if (w.status === "ONLINE" && lastHeartbeat && new Date(lastHeartbeat) >= offlineThreshold) {
                onlineWorkersCount++;
            } else {
                offlineWorkersCount++;
            }
        });

        // Queue details for visualization
        const queues = await prisma.queues.findMany({
            include: {
                projects: {
                    select: { name: true }
                },
                _count: {
                    select: {
                        jobs: {
                            where: { status: "QUEUED" }
                        }
                    }
                }
            }
        });

        const queueLoad = queues.map(q => ({
            id: q.id,
            queue_name: q.queue_name,
            project_name: q.projects?.name || "Global",
            pending_jobs: q._count.jobs,
            status: q.status
        }));

        res.json({
            success: true,
            message: "Dashboard metrics retrieved successfully",
            data: {
                jobs: {
                    total: totalJobs,
                    queued: queuedJobs,
                    scheduled: scheduledJobs,
                    running: runningJobs,
                    completed: completedJobs,
                    failed: failedJobs,
                    dead_letter: deadLetterJobs
                },
                workers: {
                    total: workers.length,
                    online: onlineWorkersCount,
                    offline: offlineWorkersCount
                },
                queue_load: queueLoad
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

module.exports = {
    getDashboardStats
};
