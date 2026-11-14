import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Inquiry from './pages/Inquiry';
import ConnectedApps from './pages/ConnectedApps';
import QuickLinks from './pages/QuickLinks';
import Calendar from './pages/Calendar';
import LiveWebsite from './pages/LiveWebsite';
import Profile from './pages/Profile';
import MyTodoList from './pages/MyTodoList';
import ChatHub from './pages/ChatHub.jsx';
import { useData } from './context/DataContext'; 

export default function App() {
    const { currentUser } = useData();

    if (!currentUser) {
        return <Login />;
    }

    return (
        <Router>
            <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
                <Sidebar />
                <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <main className="main-content" style={{ flex: 1, padding: '0' }}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/todo" element={<MyTodoList />} />
                            <Route path="/website" element={<LiveWebsite />} />
                            <Route path="/team" element={<Team />} />
                            <Route path="/inquiry" element={<Inquiry />} />
                            <Route path="/links" element={<QuickLinks />} />
                            <Route path="/apps" element={<ConnectedApps />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/chat" element={<ChatHub />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
}