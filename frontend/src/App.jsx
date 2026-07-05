import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Queues from "./pages/Queues";
import Jobs from "./pages/Jobs";
import Workers from "./pages/Workers";

export default function App() {
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        }
        setCheckingAuth(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium font-sans">
                Initializing cluster console...
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
                <Navbar user={user} onLogout={handleLogout} />
                <main className="flex-grow">
                    <Routes>
                        <Route 
                            path="/login" 
                            element={!user ? <Login onLoginSuccess={setUser} /> : <Navigate to="/" />} 
                        />
                        <Route 
                            path="/register" 
                            element={!user ? <Register /> : <Navigate to="/" />} 
                        />
                        <Route 
                            path="/" 
                            element={user ? <Dashboard /> : <Navigate to="/login" />} 
                        />
                        <Route 
                            path="/organizations" 
                            element={user ? <Organizations /> : <Navigate to="/login" />} 
                        />
                        <Route 
                            path="/queues" 
                            element={user ? <Queues /> : <Navigate to="/login" />} 
                        />
                        <Route 
                            path="/jobs" 
                            element={user ? <Jobs /> : <Navigate to="/login" />} 
                        />
                        <Route 
                            path="/workers" 
                            element={user ? <Workers /> : <Navigate to="/login" />} 
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}
