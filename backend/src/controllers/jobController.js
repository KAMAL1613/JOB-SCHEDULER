const { PrismaClient } = require("@prisma/client");
const cronParser = require("cron-parser");
const prisma = new PrismaClient();

// Helper to calculate scheduled time
const getScheduledTime = (delaySeconds, specificTime) => {
    if (specificTime) {
        return new Date(specificTime);
    }
    if (delaySeconds) {
        return new Date(Date.now() + parseInt(delaySeconds, 10) * 1000);
    }
    return new Date(); // Immediate
};

// Create Job (Supports Immediate, Delayed, Scheduled, Cron, and Batch)
const createJob = async (req, res) => {
    try {
        const {
            queue_id,
            job_name,
            payload,
            priority,
            delay_seconds,
            scheduled_time,
            cron_expression,
            batch_jobs // Array of jobs for batch creation
        } = req.body;

        // Batch Job Creation
        if (batch_jobs && Array.isArray(batch_jobs)) {
            const createdJobs = [];
            for (const item of batch_jobs) {
                const qId = item.queue_id || queue_id;
                if (!qId || !item.job_name) {
                    continue; // Skip invalid batch items
                }

                const schedTime = getScheduledTime(item.delay_seconds, item.scheduled_time);
                const initStatus = (item.delay_seconds || item.scheduled_time || item.cron_expression) ? "SCHEDULED" : "QUEUED";

                const newJob = await prisma.jobs.create({
                    data: {
                        queue_id: BigInt(qId),
                        job_name: item.job_name,
                        payload: item.payload || {},
                        priority: item.priority ? parseInt(item.priority, 10) : 1,
                        scheduled_time: schedTime,
                        status: initStatus
                    }
                });

                if (item.cron_expression) {
                    try {
                        const interval = cronParser.parseExpression(item.cron_expression);
                        const nextRun = interval.next().toDate();

                        await prisma.scheduled_jobs.create({
                            data: {
                                job_id: newJob.id,
                                cron_expression: item.cron_expression,
                                next_run: nextRun
                            }
                        });
                    } catch (cronErr) {
                        console.error("Batch cron parse error:", cronErr);
                    }
                }

                createdJobs.push(newJob);
            }

            return res.status(201).json({
                success: true,
                message: `${createdJobs.length} Batch jobs created successfully`,
                data: { jobs: createdJobs }
            });
        }

        // Single Job Creation
        if (!queue_id || !job_name) {
            return res.status(400).json({
                success: false,
                message: "queue_id and job_name are required",
                data: {}
            });
        }

        // Verify queue exists
        const queueObj = await prisma.queues.findUnique({
            where: { id: BigInt(queue_id) }
        });

        if (!queueObj) {
            return res.status(404).json({
                success: false,
                message: "Queue not found",
                data: {}
            });
        }

        const schedTime = getScheduledTime(delay_seconds, scheduled_time);
        
        // If it's a cron job or scheduled/delayed, mark as SCHEDULED, else QUEUED
        let initialStatus = "QUEUED";
        if (delay_seconds || scheduled_time || cron_expression) {
            initialStatus = "SCHEDULED";
        }

        const job = await prisma.jobs.create({
            data: {
                queue_id: BigInt(queue_id),
                job_name,
                payload: payload || {},
                priority: priority ? parseInt(priority, 10) : 1,
                scheduled_time: schedTime,
                status: initialStatus
            }
        });

        // If it is a recurring cron job, insert into scheduled_jobs
        if (cron_expression) {
            try {
                const interval = cronParser.parseExpression(cron_expression);
                const nextRun = interval.next().toDate();

                await prisma.scheduled_jobs.create({
                    data: {
                        job_id: job.id,
                        cron_expression,
                        next_run: nextRun
                    }
                });

                // Update scheduled time to next run time
                await prisma.jobs.update({
                    where: { id: job.id },
                    data: { scheduled_time: nextRun }
                });
            } catch (cronErr) {
                // Delete job if cron format is invalid
                await prisma.jobs.delete({ where: { id: job.id } });
                return res.status(400).json({
                    success: false,
                    message: "Invalid cron expression: " + cronErr.message,
                    data: {}
                });
            }
        }

        res.status(201).json({
            success: true,
            message: "Job created successfully",
            data: { job }
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

// Get All Jobs (with pagination, status & queue filter, and search)
const getJobs = async (req, res) => {
    try {
        const { queue_id, status, search, page = 1, limit = 20 } = req.query;

        const where = {};
        if (queue_id) {
            where.queue_id = BigInt(queue_id);
        }
        if (status) {
            where.status = status;
        }
        if (search) {
            where.job_name = {
                contains: search,
                mode: "insensitive"
            };
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const totalJobs = await prisma.jobs.count({ where });

        const jobs = await prisma.jobs.findMany({
            where,
            include: {
                queues: {
                    select: {
                        id: true,
                        queue_name: true
                    }
                },
                scheduled_jobs: true,
                dead_letter_queue: true,
                job_executions: {
                    orderBy: {
                        start_time: "desc"
                    },
                    take: 5,
                    include: {
                        job_logs: {
                            orderBy: {
                                created_at: "asc"
                            }
                        }
                    }
                }
            },
            orderBy: [
                { priority: "desc" },
                { created_at: "desc" }
            ],
            skip: offset,
            take: parseInt(limit, 10)
        });

        res.json({
            success: true,
            message: "Jobs retrieved successfully",
            data: {
                jobs,
                pagination: {
                    total: totalJobs,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    pages: Math.ceil(totalJobs / parseInt(limit, 10))
                }
            }
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

// Update Job Status
const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
                data: {}
            });
        }

        const job = await prisma.jobs.update({
            where: { id: BigInt(req.params.id) },
            data: { status }
        });

        res.json({
            success: true,
            message: "Job status updated successfully",
            data: { job }
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

// Manually Retry Failed/Dead Letter Job
const retryFailedJob = async (req, res) => {
    try {
        const jobId = BigInt(req.params.id);

        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            include: { dead_letter_queue: true }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
                data: {}
            });
        }

        // Clean from Dead Letter Queue if it exists there
        if (job.dead_letter_queue) {
            await prisma.dead_letter_queue.delete({
                where: { job_id: jobId }
            });
        }

        // Reset job status to QUEUED and reset retry_count
        const updatedJob = await prisma.jobs.update({
            where: { id: jobId },
            data: {
                status: "QUEUED",
                retry_count: 0,
                scheduled_time: new Date()
            }
        });

        res.json({
            success: true,
            message: "Job rescheduled for execution successfully",
            data: { job: updatedJob }
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

// Delete Job
const deleteJob = async (req, res) => {
    try {
        await prisma.jobs.delete({
            where: { id: BigInt(req.params.id) }
        });

        res.json({
            success: true,
            message: "Job deleted successfully",
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
    createJob,
    getJobs,
    updateJobStatus,
    retryFailedJob,
    deleteJob
};
