import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    Layers, 
    PlayCircle, 
    Users as WorkersIcon, 
    LogOut,
    Building2
} from "lucide-react";

export default function Navbar({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    const isActive = (path) => {
        return location.pathname === path
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl text-white shadow-lg shadow-indigo-500/25">
                            <Layers className="h-5 w-5 animate-pulse" />
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
                            OrbitFlow
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            v1.0
                        </span>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center space-x-2">
                        <Link to="/" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive("/")}`}>
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link to="/organizations" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive("/organizations")}`}>
                            <Building2 className="h-4 w-4" />
                            Workspaces
                        </Link>
                        <Link to="/queues" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive("/queues")}`}>
                            <Layers className="h-4 w-4" />
                            Queues
                        </Link>
                        <Link to="/jobs" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive("/jobs")}`}>
                            <PlayCircle className="h-4 w-4" />
                            Jobs Explorer
                        </Link>
                        <Link to="/workers" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive("/workers")}`}>
                            <WorkersIcon className="h-4 w-4" />
                            Workers
                        </Link>
                    </div>

                    {/* User profile & Log Out */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-sm font-semibold text-slate-800">{user.full_name}</span>
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 capitalize font-mono">{user.role || "member"}</span>
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                        <button 
                            onClick={onLogout}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-slate-200 hover:border-rose-200"
                            title="Log Out"
                        >
                            <LogOut className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
