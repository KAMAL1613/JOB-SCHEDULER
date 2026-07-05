const { PrismaClient } = require("@prisma/client");
const os = require("os");

const prisma = new PrismaClient();
const hostname = os.hostname();
const pid = process.pid;
const workerName = `worker-${hostname}-${pid}`;

let workerId = null;
let heartbeatIntervalId = null;
let pollIntervalId = null;
let activeExecutionsCount = 0;
let isShuttingDown = false;

const logWorker = (msg) => {
    console.log(`[Worker - ${workerName}] ${msg}`);
};

// Register Worker
const register = async () => {
    try {
        const worker = await prisma.workers.create({
            data: {
                worker_name: workerName,
                host_name: hostname,
                status: "ONLINE"
            }
        });
        workerId = worker.id;
        logWorker(`Registered with database. Assigned ID: ${workerId}`);

        // Initial heartbeat
        await prisma.worker_heartbeats.create({
            data: {
                worker_id: workerId,
                heartbeat_time: new Date()
            }
        });
    } catch (err) {
        console.error("Worker registration failed:", err);
        process.exit(1);
    }
};

// Send Heartbeat
const sendHeartbeat = async () => {
    if (!workerId || isShuttingDown) return;
    try {
        await prisma.worker_heartbeats.create({
            data: {
                worker_id: workerId,
                heartbeat_time: new Date()
            }
        });

        // Update worker status based on busy status
        const status = activeExecutionsCount > 0 ? "BUSY" : "ONLINE";
        await prisma.workers.update({
            where: { id: workerId },
            data: { status }
        });
    } catch (err) {
        console.error("Heartbeat error:", err);
    }
};

// Calculate retry delay based on policy
const calculateRetryDelay = (policy, retryCount) => {
    const baseDelay = policy.initial_delay_seconds || 5;
    const multiplier = policy.backoff_multiplier ? parseFloat(policy.backoff_multiplier.toString()) : 2;

    switch (policy.retry_strategy) {
        case "LINEAR":
            return baseDelay * (retryCount + 1);
        case "EXPONENTIAL":
            return baseDelay * Math.pow(multiplier, retryCount);
        case "FIXED":
        default:
            return baseDelay;
    }
};

// Execute Job Function
const executeJob = async (job) => {
    activeExecutionsCount++;
    const startTime = new Date();
    let executionId = null;

    try {
        logWorker(`Starting job [${job.job_name}] (ID: ${job.id})`);

        // Update status to RUNNING
        await prisma.jobs.update({
            where: { id: job.id },
            data: { status: "RUNNING" }
        });

        // Create Job Execution entry
        const execution = await prisma.job_executions.create({
            data: {
                job_id: job.id,
                worker_id: workerId,
                start_time: startTime,
                execution_status: "RUNNING"
            }
        });
        executionId = execution.id;

        // Add execution log
        await prisma.job_logs.create({
            data: {
                execution_id: executionId,
                log_level: "INFO",
                message: `Job execution started on worker ${workerName}`
            }
        });

        // Parse Payload
        const payload = job.payload || {};
        const runDuration = payload.duration_ms ? parseInt(payload.duration_ms, 10) : 3000;
        const shouldFail = payload.should_fail === true || payload.should_fail === "true";

        // Add progress logs
        await prisma.job_logs.create({
            data: {
                execution_id: executionId,
                log_level: "INFO",
                message: `Task initialized. Execution duration simulated: ${runDuration}ms`
            }
        });

        // Wait to simulate work
        await new Promise((resolve) => setTimeout(resolve, runDuration / 2));

        if (shouldFail) {
            throw new Error(payload.error_message || "Simulated task failure");
        }

        await prisma.job_logs.create({
            data: {
                execution_id: executionId,
                log_level: "INFO",
                message: "Progress: 50% completed successfully."
            }
        });

        await new Promise((resolve) => setTimeout(resolve, runDuration / 2));

        // Job succeeded
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        await prisma.jobs.update({
            where: { id: job.id },
            data: { status: "COMPLETED" }
        });

        await prisma.job_executions.update({
            where: { id: executionId },
            data: {
                execution_status: "COMPLETED",
                end_time: endTime,
                duration_ms: BigInt(durationMs)
            }
        });

        await prisma.job_logs.create({
            data: {
                execution_id: executionId,
                log_level: "INFO",
                message: `Job completed successfully. Duration: ${durationMs}ms`
            }
        });

        logWorker(`Job [${job.job_name}] (ID: ${job.id}) completed successfully.`);

    } catch (err) {
        logWorker(`Job [${job.job_name}] (ID: ${job.id}) failed: ${err.message}`);
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();

        // Update Job Execution entry
        if (executionId) {
            await prisma.job_executions.update({
                where: { id: executionId },
                data: {
                    execution_status: "FAILED",
                    end_time: endTime,
                    duration_ms: BigInt(durationMs)
                }
            });

            await prisma.job_logs.create({
                data: {
                    execution_id: executionId,
                    log_level: "ERROR",
                    message: `Job failed: ${err.message}`
                }
            });
        }

        // Retry and DLQ logic
        const policy = job.queues?.retry_policies;
        const currentRetry = job.retry_count || 0;

        if (policy && currentRetry < (policy.max_retries || 0)) {
            const nextRetryNum = currentRetry + 1;
            const delaySec = calculateRetryDelay(policy, currentRetry);
            const nextRun = new Date(Date.now() + delaySec * 1000);

            // Reschedule job
            await prisma.jobs.update({
                where: { id: job.id },
                data: {
                    status: "SCHEDULED",
                    retry_count: nextRetryNum,
                    scheduled_time: nextRun
                }
            });

            // Create or update scheduled_jobs record
            await prisma.scheduled_jobs.upsert({
                where: { job_id: job.id },
                update: { next_run: nextRun },
                create: {
                    job_id: job.id,
                    next_run: nextRun
                }
            });

            if (executionId) {
                await prisma.job_logs.create({
                    data: {
                        execution_id: executionId,
                        log_level: "WARNING",
                        message: `Scheduled retry #${nextRetryNum} in ${delaySec}s (at ${nextRun.toISOString()})`
                    }
                });
            }
            logWorker(`Job rescheduled for retry #${nextRetryNum} in ${delaySec}s`);

        } else {
            // No retries left or no policy, move to DLQ
            await prisma.jobs.update({
                where: { id: job.id },
                data: { status: "DEAD_LETTER" }
            });

            await prisma.dead_letter_queue.upsert({
                where: { job_id: job.id },
                update: {
                    failure_reason: err.message,
                    moved_at: new Date()
                },
                create: {
                    job_id: job.id,
                    failure_reason: err.message,
                    moved_at: new Date()
                }
            });

            if (executionId) {
                await prisma.job_logs.create({
                    data: {
                        execution_id: executionId,
                        log_level: "ERROR",
                        message: "Retries exhausted. Job moved to Dead Letter Queue (DLQ)"
                    }
                });
            }
            logWorker(`Job moved to Dead Letter Queue.`);
        }
    } finally {
        activeExecutionsCount--;
    }
};

// Poll Queues and Claim Job
const pollAndExecute = async () => {
    if (isShuttingDown || !workerId) return;

    try {
        // 1. Get all active (unpaused) queues
        const activeQueues = await prisma.queues.findMany({
            where: { status: "ACTIVE" },
            include: {
                _count: {
                    select: {
                        jobs: {
                            where: { status: "RUNNING" }
                        }
                    }
                }
            }
        });

        // 2. Filter queues that have not reached concurrency limit
        const eligibleQueueIds = activeQueues
            .filter(q => q._count.jobs < (q.concurrency_limit || 5))
            .map(q => q.id);

        if (eligibleQueueIds.length === 0) {
            return;
        }

        // 3. Atomically claim a single job using transaction and SELECT FOR UPDATE SKIP LOCKED
        const claimedJob = await prisma.$transaction(async (tx) => {
            // Find a QUEUED job from the eligible queues, sorted by priority (desc) and creation time
            const idsList = eligibleQueueIds.map(id => id.toString()).join(",");
            
            const jobsToClaim = await tx.$queryRawUnsafe(`
                SELECT id FROM jobs 
                WHERE status = 'QUEUED' AND queue_id IN (${idsList})
                ORDER BY priority DESC, created_at ASC 
                LIMIT 1 
                FOR UPDATE SKIP LOCKED
            `);

            if (!jobsToClaim || jobsToClaim.length === 0) return null;

            const jobId = jobsToClaim[0].id;

            // Transition status to CLAIMED immediately
            const updatedJob = await tx.jobs.update({
                where: { id: jobId },
                data: { status: "CLAIMED" },
                include: {
                    queues: {
                        include: {
                            retry_policies: true
                        }
                    }
                }
            });

            return updatedJob;
        });

        if (claimedJob) {
            // Run execution asynchronously to keep polling
            executeJob(claimedJob);
        }

    } catch (err) {
        console.error("Polling error:", err);
    }
};

// Graceful Shutdown
const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logWorker("Shutting down gracefully...");

    clearInterval(heartbeatIntervalId);
    clearInterval(pollIntervalId);

    // Wait for active executions to finish
    while (activeExecutionsCount > 0) {
        logWorker(`Waiting for ${activeExecutionsCount} active execution(s) to finish...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Set status to OFFLINE
    if (workerId) {
        try {
            await prisma.workers.update({
                where: { id: workerId },
                data: { status: "OFFLINE" }
            });
            logWorker("Status updated to OFFLINE.");
        } catch (err) {
            console.error("Shutdown status update failed:", err);
        }
    }

    logWorker("Shutdown complete. Exiting.");
    process.exit(0);
};

// Start Worker
const start = async () => {
    await register();

    // Heartbeat every 10 seconds
    heartbeatIntervalId = setInterval(sendHeartbeat, 10 * 1000);

    // Poll every 2 seconds
    pollIntervalId = setInterval(pollAndExecute, 2000);

    logWorker("Worker polling started.");

    // Handle process signals
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};

start();
