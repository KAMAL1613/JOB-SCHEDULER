import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
    Layers, 
    Cpu, 
    Activity, 
    Loader2, 
    RefreshCw, 
    TrendingUp,
    CheckCircle2,
    XCircle
} from "lucide-react";

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
        // Refresh every 5 seconds
        const intervalId = setInterval(fetchStats, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get("/dashboard/stats");
            if (res.success) {
                setStats(res.data);
            }
        } catch (err) {
            setError(err.message || "Failed to load dashboard metrics");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex justify-center items-center h-[80vh] text-slate-800 bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const { jobs = {}, workers = {}, queue_load = [] } = stats || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 min-h-[85vh] bg-slate-50">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Cluster Overview
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Live analytics of jobs processing, worker capacity, and queue throughput.
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition duration-200 shadow-sm cursor-pointer"
                    title="Refresh Data"
                >
                    <RefreshCw className="h-4.5 w-4.5" />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Jobs */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Jobs</span>
                            <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{jobs.total || 0}</h3>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                            <Layers className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Active Jobs */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Running Jobs</span>
                            <h3 className="text-2xl font-extrabold text-indigo-600 mt-2">{jobs.running || 0}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-550 border border-indigo-100 animate-pulse">
                            <Activity className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Completed Jobs */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</span>
                            <h3 className="text-2xl font-extrabold text-emerald-600 mt-2">{jobs.completed || 0}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-550 border border-emerald-100">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Failed / DLQ Jobs */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Failed / DLQ</span>
                            <h3 className="text-2xl font-extrabold text-rose-600 mt-2">
                                {(jobs.failed || 0) + (jobs.dead_letter || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-550 border border-rose-100">
                            <XCircle className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Workers and Queue Loads layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Workers Status Column */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Cpu className="h-5 w-5 text-indigo-500" />
                        Workers Capacity
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <span className="text-slate-500 text-sm">Total Instances</span>
                                <h4 className="text-xl font-bold text-slate-800 mt-1">{workers.total || 0}</h4>
                            </div>
                            <div className="flex gap-2">
                                <div className="text-center px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
                                    <div className="text-xs font-bold">{workers.online || 0}</div>
                                    <div className="text-[9px] uppercase font-bold tracking-wide">Online</div>
                                </div>
                                <div className="text-center px-3 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">
                                    <div className="text-xs font-bold">{workers.offline || 0}</div>
                                    <div className="text-[9px] uppercase font-bold tracking-wide">Offline</div>
                                </div>
                            </div>
                        </div>

                        {/* Active Worker Load Indicator */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-450">Resource Utilization</span>
                                <span className="font-semibold text-slate-600">
                                    {workers.total > 0 ? Math.round((workers.online / workers.total) * 100) : 0}% Active
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500"
                                    style={{ width: `${workers.total > 0 ? (workers.online / workers.total) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue workloads column */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                        Queue Pending Backlog
                    </h2>

                    {queue_load.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            No active queues found. Create queues to see metrics here.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {queue_load.map((q) => (
                                <div key={q.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-sm text-slate-800">{q.queue_name}</span>
                                            <span className="text-[10px] text-slate-400 block">Workspace: {q.project_name}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                            q.status === "ACTIVE" 
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                                : "bg-amber-50 border-amber-100 text-amber-600"
                                        }`}>
                                            {q.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/30">
                                            <div 
                                                className={`h-full transition-all duration-300 ${
                                                    q.status === "PAUSED" ? "bg-amber-500" : "bg-indigo-500"
                                                }`}
                                                style={{ width: `${Math.min(q.pending_jobs * 10, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                                            {q.pending_jobs} pending
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
