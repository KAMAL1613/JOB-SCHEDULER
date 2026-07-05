import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
    PlayCircle, 
    Search, 
    Filter, 
    RefreshCcw, 
    Trash2, 
    Plus, 
    Terminal, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Clock, 
    Loader2, 
    ShieldAlert
} from "lucide-react";

export default function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [queues, setQueues] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    // Filter and Search
    const [statusFilter, setStatusFilter] = useState("");
    const [queueFilter, setQueueFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    // Create Job states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newJobQueueId, setNewJobQueueId] = useState("");
    const [newJobName, setNewJobName] = useState("");
    const [newJobPayload, setNewJobPayload] = useState('{"duration_ms": 3000}');
    const [newJobPriority, setNewJobPriority] = useState("1");
    const [jobType, setJobType] = useState("immediate"); // immediate, delayed, scheduled, cron, batch
    
    // Type specific fields
    const [delaySeconds, setDelaySeconds] = useState("10");
    const [scheduledTime, setScheduledTime] = useState("");
    const [cronExpression, setCronExpression] = useState("*/5 * * * *");
    const [batchCount, setBatchCount] = useState("3");

    // Details Modal / Selected Job
    const [selectedJobId, setSelectedJobId] = useState(null);

    // Loading & messaging states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchQueues();
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [statusFilter, queueFilter, page]);

    const fetchQueues = async () => {
        try {
            const res = await api.get("/queues");
            if (res.success) {
                setQueues(res.data.queues);
                if (res.data.queues.length > 0) {
                    setNewJobQueueId(res.data.queues[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch queues:", err);
        }
    };

    const fetchJobs = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get(
                `/jobs?page=${page}&limit=10&status=${statusFilter}&queue_id=${queueFilter}&search=${searchQuery}`
            );
            if (res.success) {
                setJobs(res.data.jobs);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            setError(err.message || "Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchJobs();
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        if (!newJobQueueId || (!newJobName && jobType !== "batch")) return;
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            let payloadObj = {};
            try {
                payloadObj = JSON.parse(newJobPayload);
            } catch (pErr) {
                setError("Payload must be valid JSON");
                setSubmitting(false);
                return;
            }

            let requestBody = {
                queue_id: newJobQueueId,
                job_name: newJobName,
                payload: payloadObj,
                priority: parseInt(newJobPriority, 10)
            };

            // Modify body based on job type
            if (jobType === "delayed") {
                requestBody.delay_seconds = parseInt(delaySeconds, 10);
            } else if (jobType === "scheduled") {
                if (!scheduledTime) {
                    setError("Scheduled time is required");
                    setSubmitting(false);
                    return;
                }
                requestBody.scheduled_time = new Date(scheduledTime).toISOString();
            } else if (jobType === "cron") {
                if (!cronExpression) {
                    setError("Cron expression is required");
                    setSubmitting(false);
                    return;
                }
                requestBody.cron_expression = cronExpression;
            } else if (jobType === "batch") {
                const count = parseInt(batchCount, 10) || 2;
                const batchJobs = [];
                for (let i = 1; i <= count; i++) {
                    batchJobs.push({
                        job_name: `${newJobName || "Batch-Job"}-${i}`,
                        payload: payloadObj,
                        priority: parseInt(newJobPriority, 10)
                    });
                }
                requestBody = {
                    queue_id: newJobQueueId,
                    batch_jobs: batchJobs
                };
            }

            const res = await api.post("/jobs", requestBody);
            if (res.success) {
                setSuccess(res.message || "Job submitted successfully");
                setNewJobName("");
                setShowCreateForm(false);
                setPage(1);
                fetchJobs();
            }
        } catch (err) {
            setError(err.message || "Failed to submit job");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = async (id) => {
        setError("");
        setSuccess("");
        try {
            const res = await api.post(`/jobs/${id}/retry`);
            if (res.success) {
                setSuccess("Job successfully rescheduled for retry");
                fetchJobs();
            }
        } catch (err) {
            setError(err.message || "Failed to retry job");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job record?")) return;
        try {
            const res = await api.delete(`/jobs/${id}`);
            if (res.success) {
                setSuccess("Job deleted successfully");
                fetchJobs();
            }
        } catch (err) {
            setError(err.message || "Failed to delete job");
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case "COMPLETED":
                return "bg-emerald-50 border-emerald-150 text-emerald-600";
            case "FAILED":
                return "bg-rose-50 border-rose-150 text-rose-600";
            case "DEAD_LETTER":
                return "bg-purple-50 border-purple-150 text-purple-600";
            case "RUNNING":
                return "bg-indigo-50 border-indigo-150 text-indigo-600 animate-pulse";
            case "CLAIMED":
                return "bg-blue-50 border-blue-150 text-blue-600";
            case "SCHEDULED":
                return "bg-amber-50 border-amber-150 text-amber-600";
            case "QUEUED":
            default:
                return "bg-slate-100 border-slate-200 text-slate-600";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "COMPLETED":
                return <CheckCircle2 className="h-4 w-4" />;
            case "FAILED":
                return <XCircle className="h-4 w-4" />;
            case "DEAD_LETTER":
                return <AlertCircle className="h-4 w-4" />;
            case "RUNNING":
                return <Loader2 className="h-4 w-4 animate-spin" />;
            case "SCHEDULED":
                return <Clock className="h-4 w-4" />;
            case "QUEUED":
            default:
                return <PlayCircle className="h-4 w-4" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 min-h-[85vh] bg-slate-50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Jobs Explorer
                    </h1>
                    <p className="text-slate-550 text-sm mt-1">
                        Track, inspect, and troubleshoot background jobs across your workers.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10"
                >
                    <Plus className="h-4.5 w-4.5" />
                    {showCreateForm ? "Cancel Submit" : "Submit New Job"}
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl mb-6 text-sm">
                    {success}
                </div>
            )}

            {/* Create Job Form Section */}
            {showCreateForm && (
                <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl mb-8 shadow-sm max-w-3xl">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PlayCircle className="h-5 w-5 text-indigo-500" />
                        Submit Background Job
                    </h2>
                    <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-semibold mb-1 block">Target Job Queue</label>
                                <select
                                    value={newJobQueueId}
                                    onChange={(e) => setNewJobQueueId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                >
                                    {queues.map(q => (
                                        <option key={q.id} value={q.id}>{q.queue_name} (Priority: {q.priority})</option>
                                    ))}
                                </select>
                            </div>

                            {jobType !== "batch" && (
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Job Name</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. generate-pdf-report"
                                        value={newJobName}
                                        onChange={(e) => setNewJobName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            {jobType === "batch" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Batch Prefix Name</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="e.g. bulk-email"
                                            value={newJobName}
                                            onChange={(e) => setNewJobName(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Number of Jobs</label>
                                        <input 
                                            type="number"
                                            value={batchCount}
                                            onChange={(e) => setBatchCount(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Job Type</label>
                                    <select
                                        value={jobType}
                                        onChange={(e) => setJobType(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="immediate">Immediate</option>
                                        <option value="delayed">Delayed</option>
                                        <option value="scheduled">Scheduled Date</option>
                                        <option value="cron">Recurring (Cron)</option>
                                        <option value="batch">Batch Jobs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Priority Level</label>
                                    <input 
                                        type="number"
                                        value={newJobPriority}
                                        onChange={(e) => setNewJobPriority(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Job Type Fields */}
                            {jobType === "delayed" && (
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Delay Duration (seconds)</label>
                                    <input 
                                        type="number"
                                        value={delaySeconds}
                                        onChange={(e) => setDelaySeconds(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            {jobType === "scheduled" && (
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Target Scheduled Time</label>
                                    <input 
                                        type="datetime-local"
                                        required
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            {jobType === "cron" && (
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Cron Expression</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. */5 * * * *"
                                        value={cronExpression}
                                        onChange={(e) => setCronExpression(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Format: min hour day month day-of-week</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-semibold mb-1 block">Job Payload (JSON)</label>
                                <textarea
                                    rows="8"
                                    value={newJobPayload}
                                    onChange={(e) => setNewJobPayload(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                                />
                                <span className="text-[10px] text-slate-400 block mt-1">
                                    💡 Tip: Add <code>&quot;should_fail&quot;: true</code> to test retries and Dead Letter Queue.
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Background Job"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter controls */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl mb-6 shadow-sm">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs text-slate-500 font-semibold mb-1.5 block">Search Job Name</label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Filter by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none"
                            />
                            <Search className="h-4 w-4 text-slate-450 absolute left-3 top-2.5" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-505 font-semibold mb-1.5 block">Job Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                        >
                            <option value="">All Statuses</option>
                            <option value="QUEUED">QUEUED</option>
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="CLAIMED">CLAIMED</option>
                            <option value="RUNNING">RUNNING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="FAILED">FAILED</option>
                            <option value="DEAD_LETTER">DEAD LETTER</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-505 font-semibold mb-1.5 block">Queue</label>
                        <select
                            value={queueFilter}
                            onChange={(e) => {
                                setQueueFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                        >
                            <option value="">All Queues</option>
                            {queues.map(q => (
                                <option key={q.id} value={q.id}>{q.queue_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Filter className="h-3.5 w-3.5" /> Search Jobs
                        </button>
                    </div>
                </form>
            </div>

            {/* Jobs Table */}
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                    No jobs found matching the search criteria.
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Job Info</th>
                                    <th className="px-6 py-4">Queue</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Retries</th>
                                    <th className="px-6 py-4">Scheduled For</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-transparent">
                                {jobs.map((job) => (
                                    <React.Fragment key={job.id}>
                                        <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 text-sm">{job.job_name}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {job.id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{job.queues?.queue_name || "N/A"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyles(job.status)}`}>
                                                    {getStatusIcon(job.status)}
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">{job.priority}</td>
                                            <td className="px-6 py-4 text-xs">{job.retry_count}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                                {job.scheduled_time ? new Date(job.scheduled_time).toLocaleString() : "Immediate"}
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {(job.status === "FAILED" || job.status === "DEAD_LETTER") && (
                                                        <button
                                                            onClick={() => handleRetry(job.id)}
                                                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition"
                                                            title="Retry Job"
                                                        >
                                                            <RefreshCcw className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(job.id)}
                                                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                                                        title="Delete Job Record"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Details / Logs view */}
                                        {selectedJobId === job.id && (
                                            <tr>
                                                <td colSpan="7" className="bg-slate-50 px-8 py-5 border-t border-slate-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500">
                                                        <div>
                                                            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">Payload Data</h4>
                                                            <pre className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] overflow-auto max-h-40 text-slate-800 shadow-inner">
                                                                {JSON.stringify(job.payload, null, 2)}
                                                            </pre>

                                                            {job.dead_letter_queue && (
                                                                <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-600">
                                                                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                                                                        <ShieldAlert className="h-4 w-4" /> Dead Letter Entry
                                                                    </div>
                                                                    <p className="font-mono text-[11px]">{job.dead_letter_queue.failure_reason}</p>
                                                                    <span className="text-[10px] text-slate-400 block mt-1">Moved at: {new Date(job.dead_letter_queue.moved_at).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                                                                <Terminal className="h-3.5 w-3.5" /> Recent Execution Logs
                                                            </h4>
                                                            {job.job_executions.length === 0 ? (
                                                                <p className="text-slate-400 italic">No executions have run yet.</p>
                                                            ) : (
                                                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                                                    {job.job_executions.map((exec) => (
                                                                        <div key={exec.id} className="border-l-2 border-slate-300 pl-3">
                                                                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-450 mb-1">
                                                                                <span>Worker #{exec.worker_id}</span>
                                                                                <span className="font-mono text-slate-500">
                                                                                    {exec.duration_ms ? `${exec.duration_ms}ms` : "Running..."}
                                                                                </span>
                                                                            </div>
                                                                            <div className="font-mono bg-white p-2 rounded border border-slate-200 space-y-1 text-slate-800 shadow-inner">
                                                                                {exec.job_logs.length === 0 ? (
                                                                                    <div className="text-slate-400 text-[10px] italic">No logs recorded.</div>
                                                                                ) : (
                                                                                    exec.job_logs.map(l => (
                                                                                        <div key={l.id} className="text-[10px] flex gap-1.5">
                                                                                            <span className="text-slate-400 font-mono">[{new Date(l.created_at).toLocaleTimeString()}]</span>
                                                                                            <span className={l.log_level === "ERROR" ? "text-rose-600 font-semibold" : l.log_level === "WARNING" ? "text-amber-600" : "text-slate-650"}>
                                                                                                {l.message}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-205 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Showing page {pagination.page} of {pagination.pages} (Total: {pagination.total} jobs)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="py-1 px-3 bg-white hover:bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200 disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                    className="py-1 px-3 bg-white hover:bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200 disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
