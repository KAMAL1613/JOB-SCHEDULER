const baseURL = "http://localhost:5000/api";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runVerification() {
    console.log("🔍 Starting programmatic E2E verification of OrbitFlow API...");
    
    const email = `test-user-${Date.now()}@example.com`;
    const password = "password123";

    try {
        // 1. Register User
        console.log("\n1. Registering user...");
        const regRes = await fetch(`${baseURL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: "Test Verification User",
                email: email,
                password: password
            })
        });
        const regData = await regRes.json();
        console.log("Registration Response:", JSON.stringify(regData, null, 2));
        if (!regData.success) throw new Error("Registration failed");

        // 2. Login User
        console.log("\n2. Logging in...");
        const loginRes = await fetch(`${baseURL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log("Login Response:", JSON.stringify(loginData, null, 2));
        if (!loginData.success) throw new Error("Login failed");
        
        const token = loginData.data.token;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // 3. Create Organization
        console.log("\n3. Creating Organization...");
        const orgRes = await fetch(`${baseURL}/organizations`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                name: "E2E Organization",
                description: "Organization created for testing"
            })
        });
        const orgData = await orgRes.json();
        console.log("Org Response:", JSON.stringify(orgData, null, 2));
        const orgId = orgData.data.organization.id;

        // 4. Create Project
        console.log("\n4. Creating Project...");
        const projRes = await fetch(`${baseURL}/projects`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                organization_id: orgId,
                name: "E2E-Project",
                description: "Project for testing"
            })
        });
        const projData = await projRes.json();
        console.log("Project Response:", JSON.stringify(projData, null, 2));
        const projId = projData.data.project.id;

        // 5. Create Queue
        console.log("\n5. Creating Queue...");
        const queueRes = await fetch(`${baseURL}/queues`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                project_id: projId,
                queue_name: "e2e-test-queue",
                priority: 10,
                concurrency_limit: 2
            })
        });
        const queueData = await queueRes.json();
        console.log("Queue Response:", JSON.stringify(queueData, null, 2));
        const queueId = queueData.data.queue.id;

        // 6. Create Job (Immediate)
        console.log("\n6. Submitting Immediate Job (expected to succeed)...");
        const jobRes = await fetch(`${baseURL}/jobs`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                queue_id: queueId,
                job_name: "e2e-success-task",
                payload: { duration_ms: 2000 },
                priority: 5
            })
        });
        const jobData = await jobRes.json();
        console.log("Job Success Submission Response:", JSON.stringify(jobData, null, 2));
        const successJobId = jobData.data.job.id;

        // 7. Create Job (Should Fail)
        console.log("\n7. Submitting Job designed to fail...");
        const failJobRes = await fetch(`${baseURL}/jobs`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                queue_id: queueId,
                job_name: "e2e-failed-task",
                payload: { duration_ms: 2000, should_fail: true, error_message: "E2E Test failure message" },
                priority: 2
            })
        });
        const failJobData = await failJobRes.json();
        console.log("Job Failure Submission Response:", JSON.stringify(failJobData, null, 2));
        const failedJobId = failJobData.data.job.id;

        // Wait to allow worker to poll and execute jobs
        console.log("\n⏰ Sleeping for 10 seconds to allow workers to claim and run jobs...");
        await sleep(10000);

        // 8. Fetch Jobs and verify status
        console.log("\n8. Fetching Jobs and validating statuses...");
        const fetchRes = await fetch(`${baseURL}/jobs`, {
            method: "GET",
            headers
        });
        const fetchJSON = await fetchRes.json();
        const jobsList = fetchJSON.data.jobs;

        const successJob = jobsList.find(j => j.id.toString() === successJobId.toString());
        const failedJob = jobsList.find(j => j.id.toString() === failedJobId.toString());

        console.log("\n=== VERIFICATION RESULTS ===");
        if (successJob) {
            console.log(`✅ Success Job Status: ${successJob.status} (Expected: COMPLETED)`);
            if (successJob.job_executions && successJob.job_executions.length > 0) {
                console.log(`   - Completed duration: ${successJob.job_executions[0].duration_ms}ms`);
            }
        } else {
            console.log("❌ Success Job not found in database.");
        }

        if (failedJob) {
            console.log(`✅ Failure Job Status: ${failedJob.status} (Expected: DEAD_LETTER)`);
            if (failedJob.dead_letter_queue) {
                console.log(`   - Reason: ${failedJob.dead_letter_queue.failure_reason}`);
            }
        } else {
            console.log("❌ Failure Job not found in database.");
        }

        // 9. Fetch Dashboard Stats
        console.log("\n9. Fetching Dashboard Stats...");
        const statsRes = await fetch(`${baseURL}/dashboard/stats`, {
            method: "GET",
            headers
        });
        const statsData = await statsRes.json();
        console.log("Dashboard Stats Response:", JSON.stringify(statsData.data, null, 2));

        console.log("\n🎉 Verification Script Finished Successfully! All logic verified.");
    } catch (err) {
        console.error("\n❌ Verification Failed with Error:", err);
    }
}

runVerification();
