import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
    Cpu, 
    Trash2, 
    Activity, 
    RefreshCw, 
    Clock, 
    Server, 
    Loader2 
} from "lucide-react";

export default function Workers() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchWorkers();
        // Refresh every 10 seconds automatically
        const intervalId = setInterval(fetchWorkers, 10000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await api.get("/workers");
            if (res.success) {
                setWorkers(res.data.workers);
            }
        } catch (err) {
            setError(err.message || "Failed to load workers");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWorker = async (id) => {
        if (!window.confirm("Are you sure you want to remove this worker registration?")) return;
        try {
            const res = await api.delete(`/workers/${id}`);
            if (res.success) {
                fetchWorkers();
            }
        } catch (err) {
            setError(err.message || "Failed to delete worker");
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "ONLINE":
                return "bg-emerald-50 border-emerald-100 text-emerald-600";
            case "BUSY":
                return "bg-indigo-50 border-indigo-100 text-indigo-650";
            case "OFFLINE":
            default:
                return "bg-rose-50 border-rose-100 text-rose-600";
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 min-h-[85vh] bg-slate-50">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Workers Status
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Monitor registered scheduler instances, health pings, and active load counts.
                    </p>
                </div>
                <button
                    onClick={fetchWorkers}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-650 hover:text-slate-900 transition duration-200 cursor-pointer shadow-sm"
                    title="Refresh Status"
                >
                    <RefreshCw className="h-4.5 w-4.5" />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : workers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                    No active or registered workers found. Start a worker via <code>node src/workers/worker.js</code>.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((w) => (
                        <div 
                            key={w.id}
                            className="bg-white border border-slate-200 p-6 rounded-2xl relative overflow-hidden shadow-sm hover:border-slate-300 transition duration-200"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-indigo-500 shadow-inner">
                                    <Cpu className="h-6 w-6" />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(w.status)}`}>
                                    {w.status}
                                </span>
                            </div>

                            <h3 className="font-semibold text-base text-slate-800 truncate" title={w.worker_name}>
                                {w.worker_name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                                <Server className="h-3.5 w-3.5 text-slate-400" /> Host: {w.host_name}
                            </p>

                            <div className="h-px bg-slate-100 my-4"></div>

                            <div className="space-y-2 text-xs text-slate-600">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-450">Active Executions:</span>
                                    <span className="font-semibold text-slate-800">{w._count?.job_executions || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-450 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Started:</span>
                                    <span className="font-mono text-slate-500">
                                        {new Date(w.started_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-455 flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Last Heartbeat:</span>
                                    <span className="font-mono text-indigo-600 font-bold">
                                        {w.last_heartbeat ? new Date(w.last_heartbeat).toLocaleTimeString() : "Never"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    onClick={() => handleDeleteWorker(w.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Unregister Worker"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
