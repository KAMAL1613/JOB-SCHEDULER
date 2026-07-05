import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
    Building2, 
    Plus, 
    Trash2, 
    Folder, 
    Loader2, 
    AlertTriangle 
} from "lucide-react";

export default function Organizations() {
    const [orgs, setOrgs] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState(null);
    const [projects, setProjects] = useState([]);
    
    // Form States
    const [orgName, setOrgName] = useState("");
    const [orgDesc, setOrgDesc] = useState("");
    const [projName, setProjName] = useState("");
    const [projDesc, setProjDesc] = useState("");

    // Loading states
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [creatingProj, setCreatingProj] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrgs();
    }, []);

    useEffect(() => {
        if (selectedOrgId) {
            fetchProjects(selectedOrgId);
        } else {
            setProjects([]);
        }
    }, [selectedOrgId]);

    const fetchOrgs = async () => {
        setLoadingOrgs(true);
        try {
            const res = await api.get("/organizations");
            if (res.success) {
                setOrgs(res.data.organizations);
                if (res.data.organizations.length > 0 && !selectedOrgId) {
                    setSelectedOrgId(res.data.organizations[0].id);
                }
            }
        } catch (err) {
            setError(err.message || "Failed to load organizations");
        } finally {
            setLoadingOrgs(false);
        }
    };

    const fetchProjects = async (orgId) => {
        setLoadingProjects(true);
        try {
            const res = await api.get(`/projects?organization_id=${orgId}`);
            if (res.success) {
                setProjects(res.data.projects);
            }
        } catch (err) {
            console.error("Fetch projects error:", err);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        if (!orgName) return;
        setCreatingOrg(true);
        setError("");
        try {
            const res = await api.post("/organizations", {
                name: orgName,
                description: orgDesc
            });
            if (res.success) {
                setOrgName("");
                setOrgDesc("");
                fetchOrgs();
            }
        } catch (err) {
            setError(err.message || "Failed to create organization");
        } finally {
            setCreatingOrg(false);
        }
    };

    const handleDeleteOrg = async (id) => {
        if (!window.confirm("Are you sure you want to delete this organization? All projects and queues inside will be deleted.")) return;
        try {
            const res = await api.delete(`/organizations/${id}`);
            if (res.success) {
                if (selectedOrgId === id) {
                    setSelectedOrgId(null);
                }
                fetchOrgs();
            }
        } catch (err) {
            setError(err.message || "Failed to delete organization");
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!projName || !selectedOrgId) return;
        setCreatingProj(true);
        try {
            const res = await api.post("/projects", {
                organization_id: selectedOrgId,
                name: projName,
                description: projDesc
            });
            if (res.success) {
                setProjName("");
                setProjDesc("");
                fetchProjects(selectedOrgId);
            }
        } catch (err) {
            setError(err.message || "Failed to create project");
        } finally {
            setCreatingProj(false);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project? All job queues inside will be deleted.")) return;
        try {
            const res = await api.delete(`/projects/${id}`);
            if (res.success) {
                fetchProjects(selectedOrgId);
            }
        } catch (err) {
            setError(err.message || "Failed to delete project");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-800 min-h-[85vh] bg-slate-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Workspaces & Projects
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Organize your job queues into projects and organizations.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Organizations Column */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                            <Building2 className="h-5 w-5 text-indigo-550" />
                            Organizations
                        </h2>
                    </div>

                    <form onSubmit={handleCreateOrg} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        <h3 className="text-xs font-bold text-indigo-650 uppercase tracking-wider">New Organization</h3>
                        <input
                            type="text"
                            required
                            placeholder="Org Name"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={orgDesc}
                            onChange={(e) => setOrgDesc(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={creatingOrg}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 shadow-sm"
                        >
                            {creatingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create Org
                        </button>
                    </form>

                    {loadingOrgs ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No organizations found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {orgs.map((org) => (
                                <div
                                    key={org.id}
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className={`p-4 rounded-xl border transition-all duration-200 flex justify-between items-start cursor-pointer group ${
                                        selectedOrgId === org.id
                                            ? "bg-slate-100/90 border-indigo-500/50 shadow-sm"
                                            : "bg-white border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm text-slate-800 truncate">{org.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{org.description || "No description"}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteOrg(org.id);
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Projects Column */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                            <Folder className="h-5 w-5 text-indigo-550" />
                            Projects
                        </h2>
                    </div>

                    {selectedOrgId ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Create Project Form */}
                            <div>
                                <form onSubmit={handleCreateProject} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200/60 sticky top-24">
                                    <h3 className="text-xs font-bold text-indigo-650 uppercase tracking-wider">New Project</h3>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 block mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Orbit-Pipeline"
                                            value={projName}
                                            onChange={(e) => setProjName(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 block mb-1">Description</label>
                                        <textarea
                                            placeholder="Briefly state the goal of this project"
                                            rows="3"
                                            value={projDesc}
                                            onChange={(e) => setProjDesc(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400 resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={creatingProj}
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 shadow-sm"
                                    >
                                        {creatingProj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Create Project
                                    </button>
                                </form>
                            </div>

                            {/* Projects List */}
                            <div className="space-y-3">
                                {loadingProjects ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="text-center py-12 text-slate-450 text-sm border border-dashed border-slate-200 rounded-xl">
                                        No projects found in this organization.
                                    </div>
                                ) : (
                                    projects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition flex justify-between items-start group"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="h-4.5 w-4.5 text-indigo-550" />
                                                    <h3 className="font-semibold text-sm text-slate-800 truncate">{project.name}</h3>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-3">{project.description || "No description provided."}</p>
                                                <span className="inline-block mt-3 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                    ID: {project.id}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition ml-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-slate-400">
                            Select or create an organization first.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
