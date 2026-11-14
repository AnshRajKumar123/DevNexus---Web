import React, { createContext, useState, useContext, useEffect } from 'react';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const API_URL = 'http://localhost:5001/api';

export const DataProvider = ({ children }) => {
    // --- Global Theme State ---
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('devnexus_theme') === 'dark';
    });

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('devnexus_theme', newTheme ? 'dark' : 'light');
    };

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }, [isDarkMode]);

    // --- Core States (Store only user ID / token in localStorage) ---
    const [currentUserId, setCurrentUserId] = useState(() => {
        return localStorage.getItem('devnexus_user_id') || null;
    });
    const [currentUser, setCurrentUser] = useState(null);

    const [team, setTeam] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [events, setEvents] = useState([]);
    const [links, setLinks] = useState([]);
    const [websites, setWebsites] = useState([]);
    const [todos, setTodos] = useState([]);
    const [integrations, setIntegrations] = useState([]);

    // Hydrate user details from server using stored user ID on mount or refresh
    useEffect(() => {
        if (currentUserId) {
            fetch(`${API_URL}/team`)
                .then(res => res.json())
                .then(teamList => {
                    const found = teamList.find(t => t._id === currentUserId);
                    if (found) {
                        setCurrentUser(found);
                        setTeam(teamList);
                    } else {
                        logout(); // If ID is invalid, clear session
                    }
                })
                .catch(console.error);
        }
    }, [currentUserId]);

    // Fetch other collections when currentUser is hydrated
    useEffect(() => {
        if (currentUser) {
            fetch(`${API_URL}/events`).then(res => res.json()).then(setEvents).catch(console.error);
            fetch(`${API_URL}/inquiries`).then(res => res.json()).then(setInquiries).catch(console.error);
            fetch(`${API_URL}/links`).then(res => res.json()).then(setLinks).catch(console.error);
            fetch(`${API_URL}/websites`).then(res => res.json()).then(setWebsites).catch(console.error);
            fetch(`${API_URL}/todos/${encodeURIComponent(currentUser.name)}`).then(res => res.json()).then(setTodos).catch(console.error);
            fetch(`${API_URL}/integrations`).then(res => res.json()).then(setIntegrations).catch(console.error);
        }
    }, [currentUser]);

    // --- Auth & Profile ---
    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw { status: response.status, message: errorData.message || 'Login failed' };
            }
            const userData = await response.json();
            setCurrentUser(userData);
            setCurrentUserId(userData._id);
            localStorage.setItem('devnexus_user_id', userData._id); // Store only ID token
            return { success: true };
        } catch (error) {
            return { success: false, status: error.status || 500, message: error.message };
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentUserId(null);
        localStorage.removeItem('devnexus_user_id');
        localStorage.removeItem('devnexus_current_user'); // Clean up old storage if present
    };

    const updateProfile = async (id, updatedData) => {
        try {
            const response = await fetch(`${API_URL}/team/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setCurrentUser(updatedUser);
                setTeam(team.map(t => t._id === id ? updatedUser : t));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    };

    // --- Inquiries ---
    const addInquiry = async (inquiry) => {
        const payload = { ...inquiry, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        const res = await fetch(`${API_URL}/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { const newInq = await res.json(); setInquiries([newInq, ...inquiries]); }
    };
    const updateInquiryStatus = async (id, newStatus) => {
        const res = await fetch(`${API_URL}/inquiries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        if (res.ok) setInquiries(inquiries.map(inq => (inq._id || inq.id) === id ? { ...inq, status: newStatus } : inq));
    };
    const removeInquiry = async (id) => {
        await fetch(`${API_URL}/inquiries/${id}`, { method: 'DELETE' });
        setInquiries(inquiries.filter(i => (i._id || i.id) !== id));
    };

    // --- Events / Calendar ---
    const addEvent = async (event) => {
        const res = await fetch(`${API_URL}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
        if (res.ok) { const newEv = await res.json(); setEvents([...events, newEv].sort((a, b) => a.time.localeCompare(b.time))); }
    };
    const removeEvent = async (id) => {
        await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
        setEvents(events.filter(e => (e._id || e.id) !== id));
    };

    // --- Team ---
    const addTeamMember = async (member) => {
        const res = await fetch(`${API_URL}/team`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) });
        if (res.ok) { const newMem = await res.json(); setTeam([...team, newMem]); }
    };
    const removeTeamMember = async (id) => {
        await fetch(`${API_URL}/team/${id}`, { method: 'DELETE' });
        setTeam(team.filter(t => t._id !== id));
    };

    // --- Quick Links ---
    const addLink = async (link) => {
        const payload = { ...link, createdBy: currentUser?.name };
        const res = await fetch(`${API_URL}/links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const newLink = await res.json();
            setLinks([...links, newLink]);
        }
    };
    const removeLink = async (id) => {
        await fetch(`${API_URL}/links/${id}`, { method: 'DELETE' });
        setLinks(links.filter(l => (l._id || l.id) !== id));
    };

    // --- Websites ---
    const addWebsite = async (website) => {
        const res = await fetch(`${API_URL}/websites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(website) });
        if (res.ok) { const newWeb = await res.json(); setWebsites([...websites, newWeb]); }
    };
    const updateWebsite = async (id, data) => {
        const res = await fetch(`${API_URL}/websites/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) setWebsites(websites.map(w => (w._id || w.id) === id ? { ...data, _id: id } : w));
    };
    const removeWebsite = async (id) => {
        await fetch(`${API_URL}/websites/${id}`, { method: 'DELETE' });
        setWebsites(websites.filter(w => (w._id || w.id) !== id));
    };

    // --- Personal To-Do List ---
    const addTodo = async (todoData) => {
        const payload = { ...todoData, userId: currentUser._id, userName: currentUser.name };
        const res = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const newTodo = await res.json();
            setTodos([newTodo, ...todos]);
        }
    };
    const updateTodoStatus = async (id, status) => {
        const res = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            setTodos(todos.map(t => (t._id === id || t.id === id) ? { ...t, status } : t));
        }
    };
    const removeTodo = async (id) => {
        await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
        setTodos(todos.filter(t => (t._id || t.id) !== id));
    };

    // --- Connected Apps / Integrations ---
    const connectIntegration = async (appData) => {
        const payload = { ...appData, connectedBy: currentUser?.name };
        try {
            const res = await fetch(`${API_URL}/integrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updated = await res.json();
                setIntegrations(prev => {
                    const exists = prev.find(i => i.appName === updated.appName);
                    if (exists) return prev.map(i => i.appName === updated.appName ? updated : i);
                    return [...prev, updated];
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Integration error:", error);
            return false;
        }
    };

    const disconnectIntegration = async (appName) => {
        const res = await fetch(`${API_URL}/integrations/${encodeURIComponent(appName)}`, { method: 'DELETE' });
        if (res.ok) {
            setIntegrations(prev => prev.filter(i => i.appName !== appName));
        }
    };

    return (
        <DataContext.Provider value={{
            currentUser, login, logout, updateProfile,
            isDarkMode, toggleTheme,
            inquiries, addInquiry, updateInquiryStatus, removeInquiry,
            events, addEvent, removeEvent,
            team, addTeamMember, removeTeamMember,
            links, addLink, removeLink,
            websites, addWebsite, updateWebsite, removeWebsite,
            todos, addTodo, updateTodoStatus, removeTodo,
            integrations, connectIntegration, disconnectIntegration
        }}>
            {children}
        </DataContext.Provider>
    );
};