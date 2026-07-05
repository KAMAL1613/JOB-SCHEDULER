import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { KeyRound, Mail, Layers, Loader2, User, ArrowRight } from "lucide-react";

export default function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await api.post("/auth/register", {
                full_name: fullName,
                email,
                password
            });
            if (res.success) {
                setSuccess("Account created successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setError(res.message || "Registration failed");
            }
        } catch (err) {
            setError(err.message || "Registration failed. Please check details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 text-slate-800">
            <div className="max-w-md w-full space-y-8 bg-white border border-slate-200/80 p-8 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -z-10"></div>

                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
                        <Layers className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Get started with your distributed scheduling cluster
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-255 text-rose-600 text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-255 text-emerald-600 text-sm px-4 py-3 rounded-xl">
                        {success}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5 ml-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <User className="h-5 w-5" />
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-505 block mb-1.5 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <Mail className="h-5 w-5" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-505 block mb-1.5 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <KeyRound className="h-5 w-5" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-950 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    Create Workspace
                                    <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-slate-505 pt-2 border-t border-slate-200">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
