import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
    Layers, 
    Plus, 
    Settings2, 
    Trash2, 
    Play, 
    Pause, 
    Loader2, 
    Check 
} from "lucide-react";

export default function Queues() {
    const [queues, setQueues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [retryPolicies, setRetryPolicies] = useState([]);

    // Queue Form States
    const [projectId, setProjectId] = useState("");
    const [queueName, setQueueName] = useState("");
    const [priority, setPriority] = useState("1");
    const [concurrencyLimit, setConcurrencyLimit] = useState("5");
    const [retryPolicyId, setRetryPolicyId] = useState("");

    // Retry Policy Form States
    const [policyName, setPolicyName] = useState("");
    const [retryStrategy, setRetryStrategy] = useState("FIXED");
    const [maxRetries, setMaxRetries] = useState("3");
    const [initialDelay, setInitialDelay] = useState("5");
    const [backoffMultiplier, setBackoffMultiplier] = useState("2.0");

    // Editing States
    const [editingQueueId, setEditingQueueId] = useState(null);
    const [editConcurrency, setEditConcurrency] = useState("5");
    const [editPriority, setEditPriority] = useState("1");

    // Loading states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const [qRes, pRes, rRes] = await Promise.all([
                api.get("/queues"),
                api.get("/projects"),
                api.get("/retry-policies")
            ]);

            if (qRes.success) setQueues(qRes.data.queues);
            if (pRes.success) {
                setProjects(pRes.data.projects);
                if (pRes.data.projects.length > 0) setProjectId(pRes.data.projects[0].id);
            }
            if (rRes.success) {
                setRetryPolicies(rRes.data.retryPolicies);
                if (rRes.data.retryPolicies.length > 0) setRetryPolicyId(rRes.data.retryPolicies[0].id);
            }
        } catch (err) {
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQueue = async (e) => {
        e.preventDefault();
        if (!projectId || !queueName) return;
        setError("");
        setSuccess("");
        try {
            const res = await api.post("/queues", {
                project_id: projectId,
                queue_name: queueName,
                priority: parseInt(priority, 10),
                concurrency_limit: parseInt(concurrencyLimit, 10),
                retry_policy_id: retryPolicyId ? retryPolicyId : undefined
            });
            if (res.success) {
                setQueueName("");
                setSuccess("Queue created successfully");
                fetchData();
            }
        } catch (err) {
            setError(err.message || "Failed to create queue");
        }
    };

    const handleCreatePolicy = async (e) => {
        e.preventDefault();
        if (!policyName) return;
        setError("");
        setSuccess("");
        try {
            const res = await api.post("/retry-policies", {
                policy_name: policyName,
                retry_strategy: retryStrategy,
                max_retries: parseInt(maxRetries, 10),
                initial_delay_seconds: parseInt(initialDelay, 10),
                backoff_multiplier: parseFloat(backoffMultiplier)
            });
            if (res.success) {
                setPolicyName("");
                setSuccess("Retry policy created successfully");
                fetchData();
            }
        } catch (err) {
            setError(err.message || "Failed to create retry policy");
        }
    };

    const toggleQueueStatus = async (queue) => {
        const nextStatus = queue.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        try {
            const res = await api.put(`/queues/${queue.id}`, { status: nextStatus });
            if (res.success) {
                fetchData();
            }
        } catch (err) {
            setError(err.message || "Failed to update status");
        }
    };

    const handleUpdateQueue = async (id) => {
        try {
            const res = await api.put(`/queues/${id}`, {
                concurrency_limit: parseInt(editConcurrency, 10),
                priority: parseInt(editPriority, 10)
            });
            if (res.success) {
                setEditingQueueId(null);
                setSuccess("Queue configuration updated");
                fetchData();
            }
        } catch (err) {
            setError(err.message || "Failed to update queue configuration");
        }
    };

    const handleDeleteQueue = async (id) => {
        if (!window.confirm("Are you sure you want to delete this queue?")) return;
        try {
            const res = await api.delete(`/queues/${id}`);
            if (res.success) {
                setSuccess("Queue deleted");
                fetchData();
            }
        } catch (err) {
            setError(err.message || "Failed to delete queue");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 min-h-[85vh] bg-slate-50">
            <div className="border-b border-slate-200 pb-6 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Queues Management
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Control active job queues, adjust concurrency limits, and manage retry strategies.
                </p>
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

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Columns - Queue list */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900">
                                <Layers className="h-5 w-5 text-indigo-500" />
                                Active Queues ({queues.length})
                            </h2>

                            {queues.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">
                                    No queues found. Create one using the form on the right.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {queues.map((q) => (
                                        <div 
                                            key={q.id}
                                            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition duration-200 shadow-sm"
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2.5">
                                                        <h3 className="font-semibold text-base text-slate-800 truncate">
                                                            {q.queue_name}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                            q.status === "ACTIVE"
                                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                                : "bg-amber-50 border-amber-100 text-amber-600"
                                                        }`}>
                                                            {q.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                                                        <span>Project: <strong className="text-slate-700">{q.projects?.name || "Global"}</strong></span>
                                                        <span>•</span>
                                                        <span>Priority: <strong className="text-slate-700">{q.priority}</strong></span>
                                                        <span>•</span>
                                                        <span>Concurrency Limit: <strong className="text-slate-700">{q.concurrency_limit}</strong></span>
                                                        {q.retry_policies && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-indigo-600 font-semibold">Policy: {q.retry_policies.policy_name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Operations */}
                                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                    <button
                                                        onClick={() => toggleQueueStatus(q)}
                                                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                                            q.status === "ACTIVE"
                                                                ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-250"
                                                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-255"
                                                        }`}
                                                    >
                                                        {q.status === "ACTIVE" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                                        {q.status === "ACTIVE" ? "Pause" : "Resume"}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => {
                                                            setEditingQueueId(q.id);
                                                            setEditConcurrency(q.concurrency_limit.toString());
                                                            setEditPriority(q.priority.toString());
                                                        }}
                                                        className="p-2 rounded-xl bg-slate-55 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                                                    >
                                                        <Settings2 className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteQueue(q.id)}
                                                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Editing Section */}
                                            {editingQueueId === q.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Concurrency Limit</label>
                                                        <input 
                                                            type="number" 
                                                            value={editConcurrency}
                                                            onChange={(e) => setEditConcurrency(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Priority</label>
                                                        <input 
                                                            type="number" 
                                                            value={editPriority}
                                                            onChange={(e) => setEditPriority(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateQueue(q.id)}
                                                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                                                        >
                                                            <Check className="h-3 w-3" /> Save
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingQueueId(null)}
                                                            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Columns - Forms */}
                    <div className="space-y-6">
                        {/* 1. Create Queue Form */}
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-base font-bold text-slate-850 mb-4 flex items-center gap-2">
                                <Plus className="h-4.5 w-4.5 text-indigo-500" />
                                Create Queue
                            </h2>
                            <form onSubmit={handleCreateQueue} className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Select Project</label>
                                    <select
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Queue Name</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. notifications-queue"
                                        value={queueName}
                                        onChange={(e) => setQueueName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Priority</label>
                                        <input 
                                            type="number"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Concurrency</label>
                                        <input 
                                            type="number"
                                            value={concurrencyLimit}
                                            onChange={(e) => setConcurrencyLimit(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Retry Policy (Optional)</label>
                                    <select
                                        value={retryPolicyId}
                                        onChange={(e) => setRetryPolicyId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">No Retry Policy</option>
                                        {retryPolicies.map(rp => (
                                            <option key={rp.id} value={rp.id}>{rp.policy_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
                                >
                                    Create Queue
                                </button>
                            </form>
                        </div>

                        {/* 2. Create Retry Policy Form */}
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-base font-bold text-slate-850 mb-4 flex items-center gap-2">
                                <Plus className="h-4.5 w-4.5 text-indigo-550" />
                                Create Retry Policy
                            </h2>
                            <form onSubmit={handleCreatePolicy} className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Policy Name</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. exponential-backoff"
                                        value={policyName}
                                        onChange={(e) => setPolicyName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-semibold mb-1 block">Strategy</label>
                                    <select
                                        value={retryStrategy}
                                        onChange={(e) => setRetryStrategy(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="FIXED">FIXED (static delay)</option>
                                        <option value="LINEAR">LINEAR (delay * retries)</option>
                                        <option value="EXPONENTIAL">EXPONENTIAL (delay * mult^retries)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Max Retries</label>
                                        <input 
                                            type="number"
                                            value={maxRetries}
                                            onChange={(e) => setMaxRetries(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Delay (sec)</label>
                                        <input 
                                            type="number"
                                            value={initialDelay}
                                            onChange={(e) => setInitialDelay(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {retryStrategy === "EXPONENTIAL" && (
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold mb-1 block">Backoff Multiplier</label>
                                        <input 
                                            type="number"
                                            step="0.1"
                                            value={backoffMultiplier}
                                            onChange={(e) => setBackoffMultiplier(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm"
                                >
                                    Create Policy
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
