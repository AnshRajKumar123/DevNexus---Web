import React, { createContext, useState, useContext, useEffect } from 'react';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

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

    // --- Core States ---
    const [currentUserId, setCurrentUserId] = useState(() => {
        return localStorage.getItem('devnexus_user_id') || null;
    });
    const [currentUser, setCurrentUser] = useState(null);
    const [isServerOffline, setIsServerOffline] = useState(false); // NEW: Tracks server health

    const [team, setTeam] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [events, setEvents] = useState([]);
    const [links, setLinks] = useState([]);
    const [websites, setWebsites] = useState([]);
    const [todos, setTodos] = useState([]);
    const [integrations, setIntegrations] = useState([]);

    // Hydrate user details from server
    useEffect(() => {
        if (currentUserId) {
            fetch(`${API_URL}/team`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch team data');
                    return res.json();
                })
                .then(teamList => {
                    setIsServerOffline(false);
                    const found = teamList.find(t => t._id === currentUserId);
                    if (found) {
                        setCurrentUser(found);
                        setTeam(teamList);
                    } else {
                        logout(); 
                    }
                })
                .catch(err => {
                    setIsServerOffline(true);
                    console.warn("Backend is offline or unreachable. Please ensure the server is running on port 5001.");
                });
        }
    }, [currentUserId]);

    // Fetch other collections safely (Only if server is online & user exists)
    useEffect(() => {
        if (currentUser && !isServerOffline) {
            const fetchSafe = (endpoint, setter) => {
                fetch(`${API_URL}/${endpoint}`)
                    .then(res => res.ok ? res.json() : Promise.reject(`Failed response from ${endpoint}`))
                    .then(setter)
                    .catch(() => console.warn(`Skipped fetching ${endpoint} due to connection issue.`));
            };

            fetchSafe('events', setEvents);
            fetchSafe('inquiries', setInquiries);
            fetchSafe('links', setLinks);
            fetchSafe('websites', setWebsites);
            fetchSafe(`todos/${encodeURIComponent(currentUser.name)}`, setTodos);
            fetchSafe('integrations', setIntegrations);
        }
    }, [currentUser, isServerOffline]);

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
                throw { status: response.status, message: errorData.message || 'Login failed', attempts: errorData.attempts };
            }
            
            const userData = await response.json();
            const user = userData.user || userData; 
            
            setCurrentUser(user);
            setCurrentUserId(user._id);
            localStorage.setItem('devnexus_user_id', user._id); 
            setIsServerOffline(false);
            
            return { success: true };
        } catch (error) {
            if (error instanceof TypeError) {
                setIsServerOffline(true);
                return { success: false, status: 503, message: 'Server is unreachable. Check your backend terminal.' };
            }
            return { success: false, status: error.status || 500, message: error.message, attempts: error.attempts };
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentUserId(null);
        localStorage.removeItem('devnexus_user_id');
        localStorage.removeItem('devnexus_current_user'); 
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
            return false;
        }
    };

    // --- Inquiries ---
    const addInquiry = async (inquiry) => {
        const payload = { ...inquiry, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        try {
            const res = await fetch(`${API_URL}/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { const newInq = await res.json(); setInquiries([newInq, ...inquiries]); }
        } catch (err) {}
    };
    
    const updateInquiryStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/inquiries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
            if (res.ok) setInquiries(inquiries.map(inq => (inq._id || inq.id) === id ? { ...inq, status: newStatus } : inq));
        } catch (err) {}
    };
    
    const removeInquiry = async (id) => {
        try {
            await fetch(`${API_URL}/inquiries/${id}`, { method: 'DELETE' });
            setInquiries(inquiries.filter(i => (i._id || i.id) !== id));
        } catch (err) {}
    };

    // --- Events / Calendar ---
    const addEvent = async (event) => {
        try {
            const res = await fetch(`${API_URL}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
            if (res.ok) { const newEv = await res.json(); setEvents([...events, newEv].sort((a, b) => a.time.localeCompare(b.time))); }
        } catch (err) {}
    };
    const removeEvent = async (id) => {
        try {
            await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
            setEvents(events.filter(e => (e._id || e.id) !== id));
        } catch (err) {}
    };

    // --- Team ---
    const addTeamMember = async (member) => {
        try {
            const res = await fetch(`${API_URL}/team`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) });
            if (res.ok) { const newMem = await res.json(); setTeam([...team, newMem]); }
        } catch (err) {}
    };
    const removeTeamMember = async (id) => {
        try {
            await fetch(`${API_URL}/team/${id}`, { method: 'DELETE' });
            setTeam(team.filter(t => t._id !== id));
        } catch (err) {}
    };

    // --- Quick Links ---
    const addLink = async (link) => {
        const payload = { ...link, createdBy: currentUser?.name };
        try {
            const res = await fetch(`${API_URL}/links`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newLink = await res.json();
                setLinks([...links, newLink]);
            }
        } catch (err) {}
    };
    const removeLink = async (id) => {
        try {
            await fetch(`${API_URL}/links/${id}`, { method: 'DELETE' });
            setLinks(links.filter(l => (l._id || l.id) !== id));
        } catch (err) {}
    };

    // --- Websites ---
    const addWebsite = async (website) => {
        try {
            const res = await fetch(`${API_URL}/websites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(website) });
            if (res.ok) { const newWeb = await res.json(); setWebsites([...websites, newWeb]); }
        } catch (err) {}
    };
    const updateWebsite = async (id, data) => {
        try {
            const res = await fetch(`${API_URL}/websites/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (res.ok) setWebsites(websites.map(w => (w._id || w.id) === id ? { ...data, _id: id } : w));
        } catch (err) {}
    };
    const removeWebsite = async (id) => {
        try {
            await fetch(`${API_URL}/websites/${id}`, { method: 'DELETE' });
            setWebsites(websites.filter(w => (w._id || w.id) !== id));
        } catch (err) {}
    };

    // --- Personal To-Do List ---
    const addTodo = async (todoData) => {
        const payload = { ...todoData, userId: currentUser._id, userName: currentUser.name };
        try {
            const res = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const newTodo = await res.json();
                setTodos([newTodo, ...todos]);
            }
        } catch (err) {}
    };
    const updateTodoStatus = async (id, status) => {
        try {
            const res = await fetch(`${API_URL}/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setTodos(todos.map(t => (t._id === id || t.id === id) ? { ...t, status } : t));
            }
        } catch (err) {}
    };
    const removeTodo = async (id) => {
        try {
            await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
            setTodos(todos.filter(t => (t._id || t.id) !== id));
        } catch (err) {}
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
            return false;
        }
    };

    const disconnectIntegration = async (appName) => {
        try {
            const res = await fetch(`${API_URL}/integrations/${encodeURIComponent(appName)}`, { method: 'DELETE' });
            if (res.ok) {
                setIntegrations(prev => prev.filter(i => i.appName !== appName));
            }
        } catch (err) {}
    };

    return (
        <DataContext.Provider value={{
            currentUser, login, logout, updateProfile,
            isDarkMode, toggleTheme, isServerOffline,
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