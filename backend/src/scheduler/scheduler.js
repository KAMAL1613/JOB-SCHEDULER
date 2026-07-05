const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const cronParser = require("cron-parser");

const prisma = new PrismaClient();

console.log("⏰ Scheduler service starting...");

// Check scheduled_jobs every minute
const checkScheduledJobs = async () => {
    console.log("⏰ Checking for due scheduled jobs...");
    try {
        const now = new Date();
        const dueJobs = await prisma.scheduled_jobs.findMany({
            where: {
                next_run: {
                    lte: now
                }
            },
            include: {
                jobs: true
            }
        });

        console.log(`⏰ Found ${dueJobs.length} due scheduled jobs.`);

        for (const scheduledJob of dueJobs) {
            const job = scheduledJob.jobs;
            if (!job) {
                // Delete orphaned schedule
                await prisma.scheduled_jobs.delete({ where: { id: scheduledJob.id } });
                continue;
            }

            // Move job to QUEUED state
            await prisma.jobs.update({
                where: { id: job.id },
                data: {
                    status: "QUEUED",
                    scheduled_time: now
                }
            });

            console.log(`🚀 Job [${job.job_name}] (ID: ${job.id}) enqueued for execution.`);

            if (scheduledJob.cron_expression) {
                // Calculate next run time
                try {
                    const interval = cronParser.parseExpression(scheduledJob.cron_expression);
                    const nextRun = interval.next().toDate();

                    await prisma.scheduled_jobs.update({
                        where: { id: scheduledJob.id },
                        data: {
                            next_run: nextRun
                        }
                    });
                    console.log(`⏰ Updated next_run for cron job [${job.job_name}] to ${nextRun}`);
                } catch (cronErr) {
                    console.error(`Error calculating next run for job [${job.job_name}]:`, cronErr);
                    await prisma.scheduled_jobs.delete({ where: { id: scheduledJob.id } });
                }
            } else {
                // One-time delayed job, remove schedule entry
                await prisma.scheduled_jobs.delete({
                    where: { id: scheduledJob.id }
                });
                console.log(`⏰ Removed one-time schedule entry for job [${job.job_name}]`);
            }
        }
    } catch (err) {
        console.error("Scheduler run error:", err);
    }
};

// Schedule it to run every minute
cron.schedule("* * * * *", checkScheduledJobs);

// Also run immediately on startup
checkScheduledJobs();
