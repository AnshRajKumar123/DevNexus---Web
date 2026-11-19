import React, { useState, useEffect } from 'react';
import {
    CalendarX2, Users, AlertCircle, Video, CheckCircle2, Clock, Activity,
    ListTodo, Trash2, Plus, Briefcase, Lightbulb, RefreshCw, ArrowUpRight, Sparkles
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { inquiries, events, currentUser, team, todos = [], projects = [], updateTodoStatus, updateProject, removeProject } = useData();
    const [greeting, setGreeting] = useState('');
    const [motivation, setMotivation] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);

        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) {
            setGreeting('Midnight Grind');
            setMotivation('Burning the midnight oil. Great things are built in silence.');
        } else if (hour >= 5 && hour < 12) {
            setGreeting('Good Morning');
            setMotivation('Grab your coffee and let’s build something amazing today.');
        } else if (hour >= 12 && hour < 17) {
            setGreeting('Good Afternoon');
            setMotivation('Keep the momentum going, you are doing great.');
        } else if (hour >= 17 && hour < 21) {
            setGreeting('Good Evening');
            setMotivation('Winding down the day. Review your wins.');
        } else {
            setGreeting('Good Night');
            setMotivation('Rest up. Tomorrow is a new opportunity.');
        }
        return () => clearTimeout(timer);
    }, []);

    const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const shortMobileDate = `${now.getDate()} ${now.toLocaleDateString('en-US', { month: 'short' })}, ${now.toLocaleDateString('en-US', { weekday: 'short' })}`;

    const pendingTasks = inquiries.filter(i => i.status !== 'Completed').length;
    const completedTasks = inquiries.filter(i => i.status === 'Completed').length;

    const userTodos = (todos || []).filter(t => t.userName === currentUser?.name);
    const activeTodos = userTodos.filter(t => t.status !== 'Completed');
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortedTodos = [...userTodos].sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));

    const totalProjects = projects.length;
    const ongoingProjects = projects.filter(p => p.status === 'In Progress').length;

    const pendingIdeas = projects.filter(p => {
        if (p.status === 'Pending Approval') return true;
        if (p.status === 'Rejected' && (p.createdBy === currentUser?.name || currentUser?.isSupremeAdmin)) return true;
        return false;
    });

    const hasAnyActivity = inquiries.length > 0 || pendingIdeas.length > 0 || events.length > 0;

    const handleRepitch = (id) => {
        updateProject(id, { status: 'Pending Approval' });
        window.island.success('Idea re-pitched successfully! 💡');
    };

    const handleDeleteIdea = (id) => {
        if (window.confirm('Are you sure you want to permanently delete this rejected idea?')) {
            removeProject(id);
            window.island.success('Idea deleted completely.');
        }
    };

    return (
        <>
            {/* =======================================================
                MOBILE LIQUID GLASS VIEW (<= 768px ONLY)
               ======================================================= */}
            <div className="mobile-liquid-dashboard page-animate">
                {/* Top 50vh Very Dark Blue Hero with Fog Fade into Pure Black */}
                <section className="ml-hero">
                    <div className="ml-date-ruler">
                        <span className="ml-ticks" aria-hidden="true"></span>
                        <div className="ml-date-center">
                            <span className="ml-today-label">TODAY</span>
                            <span className="ml-date-val">{shortMobileDate}</span>
                        </div>
                        <span className="ml-ticks" aria-hidden="true"></span>
                    </div>

                    <div className="ml-hero-headline">
                        <h1>{greeting}</h1>
                        <h2 className="ml-hero-name">{firstName}</h2>
                        <p className="ml-hero-sub">{motivation}</p>
                    </div>

                    {/* Fog / Blur Feathering Transition at the Middle of the Screen */}
                    <div className="ml-hero-fog" aria-hidden="true"></div>
                </section>

                {/* Pure Black & White Lower Half */}
                <div className="ml-body">
                    {/* Horizontal To-Do List */}
                    <section className="ml-section">
                        <div className="ml-section-head">
                            <span className="ml-section-label">YOUR TO-DO LIST</span>
                            <Link to="/todo" className="ml-bw-link">
                                Manage <ArrowUpRight size={13} />
                            </Link>
                        </div>

                        {activeTodos.length === 0 ? (
                            <div className="ml-compact-done-box ml-liquid-surface">
                                <div className="ml-done-left">
                                    <CheckCircle2 size={18} className="ml-done-icon" />
                                    <div>
                                        <h4>All To-Dos Completed</h4>
                                        <p>You have no pending personal tasks.</p>
                                    </div>
                                </div>
                                <Link to="/todo" className="ml-bw-pill-btn">
                                    <Plus size={14} /> Add
                                </Link>
                            </div>
                        ) : (
                            <div className="ml-horizontal-scroll">
                                {sortedTodos.slice(0, 6).map((todo) => {
                                    const id = todo._id || todo.id;
                                    const isDone = todo.status === 'Completed';
                                    return (
                                        <div key={id} className={`ml-todo-card ml-liquid-surface ${isDone ? 'is-done' : ''}`}>
                                            <div className="ml-card-top">
                                                <span className="ml-card-eyebrow">{todo.priority || 'MEDIUM'} PRIORITY</span>
                                                <span className="ml-card-status">{todo.status}</span>
                                            </div>
                                            <h4 className="ml-card-title">{todo.title}</h4>
                                            <div className="ml-card-foot">
                                                {todo.status === 'Pending' && (
                                                    <button className="ml-bw-pill-btn" onClick={() => updateTodoStatus(id, 'In Progress')}>
                                                        Start Task
                                                    </button>
                                                )}
                                                {todo.status === 'In Progress' && (
                                                    <button className="ml-bw-pill-btn solid" onClick={() => updateTodoStatus(id, 'Completed')}>
                                                        Mark Done
                                                    </button>
                                                )}
                                                {isDone && (
                                                    <span className="ml-done-tag">
                                                        <CheckCircle2 size={14} /> Done
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Oversized Black & White Metrics Strip */}
                    <section className="ml-metrics-glass ml-liquid-surface">
                        <div className="ml-metric-row">
                            <div className="ml-metric-item">
                                <div className="ml-big-num">
                                    {ongoingProjects}<span className="ml-big-sub">/{totalProjects}</span>
                                </div>
                                <span className="ml-metric-unit">PROJECTS</span>
                            </div>
                            <div className="ml-metric-divider"></div>
                            <div className="ml-metric-item">
                                <div className="ml-big-num">{team.length}</div>
                                <span className="ml-metric-unit">MEMBERS</span>
                            </div>
                            <div className="ml-metric-divider"></div>
                            <div className="ml-metric-item">
                                <div className="ml-big-num">{completedTasks}</div>
                                <span className="ml-metric-unit">TASKS</span>
                            </div>
                        </div>
                        <div className="ml-metric-actions">
                            <Link to="/projects" className="ml-bw-pill-btn">
                                <Plus size={14} /> Pitch Idea
                            </Link>
                            <Link to="/inquiry" className="ml-bw-pill-btn">
                                <Activity size={14} /> {pendingTasks} Active
                            </Link>
                        </div>
                    </section>

                    {/* Smart Activity Feed */}
                    {!hasAnyActivity ? (
                        <div className="ml-compact-done-box ml-liquid-surface">
                            <div className="ml-done-left">
                                <Sparkles size={18} className="ml-done-icon" />
                                <div>
                                    <h4>Workspace All Caught Up</h4>
                                    <p>No active inquiries, pending ideas, or meetings.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="ml-activity-stack">
                            {inquiries.length > 0 && (
                                <div className="ml-glass-widget ml-liquid-surface">
                                    <div className="ml-widget-head">
                                        <h3><AlertCircle size={16} /> Team Inquiries</h3>
                                        <Link to="/inquiry" className="ml-bw-link">View All</Link>
                                    </div>
                                    <div className="ml-widget-list">
                                        {inquiries.slice(0, 3).map((inq) => (
                                            <div key={inq._id || inq.id} className="ml-list-row">
                                                <div className="ml-list-text">
                                                    <h4>{inq.title}</h4>
                                                    <span>For: {inq.assignedTo}</span>
                                                </div>
                                                <span className="ml-mini-badge">{inq.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {pendingIdeas.length > 0 && (
                                <div className="ml-glass-widget ml-liquid-surface">
                                    <div className="ml-widget-head">
                                        <h3><Lightbulb size={16} /> Idea Board</h3>
                                        <Link to="/projects" className="ml-bw-link">Pitch</Link>
                                    </div>
                                    <div className="ml-widget-list">
                                        {pendingIdeas.slice(0, 4).map((idea) => {
                                            const isRejected = idea.status === 'Rejected';
                                            const idToUse = idea._id || idea.id;
                                            const isCreator = idea.createdBy === currentUser?.name;
                                            return (
                                                <div key={idToUse} className="ml-list-row">
                                                    <div className="ml-list-text">
                                                        <h4>{idea.name}</h4>
                                                        <span>By: {idea.createdBy}</span>
                                                    </div>
                                                    <div className="ml-list-right">
                                                        <span className={`ml-mini-badge ${isRejected ? 'danger' : ''}`}>
                                                            {isRejected ? 'Rejected' : 'Review'}
                                                        </span>
                                                        {isRejected && isCreator && (
                                                            <div className="ml-inline-actions">
                                                                <button className="ml-icon-glass-btn" onClick={() => handleRepitch(idToUse)} aria-label="Repitch">
                                                                    <RefreshCw size={12} />
                                                                </button>
                                                                <button className="ml-icon-glass-btn danger" onClick={() => handleDeleteIdea(idToUse)} aria-label="Delete">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {events.length > 0 && (
                                <div className="ml-glass-widget ml-liquid-surface">
                                    <div className="ml-widget-head">
                                        <h3><Clock size={16} /> Upcoming Schedule</h3>
                                        <span className="ml-mini-badge">{events.length} Events</span>
                                    </div>
                                    <div className="ml-widget-list">
                                        {events.slice(0, 4).map((ev) => (
                                            <div key={ev._id || ev.id} className="ml-list-row">
                                                <div className="ml-time-chip">{ev.time}</div>
                                                <div className="ml-list-text">
                                                    <h4>{ev.title}</h4>
                                                    <span>{ev.type} • {ev.createdBy || 'Admin'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* =======================================================
                DESKTOP VIEW (> 768px — UNTOUCHED)
               ======================================================= */}
            <div className="dashboard-wrapper desktop-dashboard-view page-animate">
                <header className="dashboard-hero-modern stagger-1">
                    <div className="hero-text-content">
                        {isLoading ? (
                            <>
                                <div className="skeleton skeleton-text short skel-short-mb"></div>
                                <div className="skeleton skeleton-title skel-title-hero"></div>
                                <div className="skeleton skeleton-text medium"></div>
                            </>
                        ) : (
                            <>
                                <span className="hero-date">{currentDate}</span>
                                <h1 className="hero-greeting">{greeting}, <span className="highlight-name">{firstName}</span></h1>
                                <p className="hero-subtitle">{motivation}</p>
                            </>
                        )}
                    </div>
                    <div className="hero-visual-stats">
                        {isLoading ? (
                            <>
                                <div className="modern-stat-box skeleton skel-stat-box"></div>
                                <div className="modern-stat-box skeleton skel-stat-box"></div>
                            </>
                        ) : (
                            <>
                                <div className="modern-stat-box">
                                    <div className="stat-icon-wrapper blue"><CalendarX2 size={20} /></div>
                                    <div className="stat-info">
                                        <span className="stat-val">{events.length}</span>
                                        <span className="stat-lbl">Meetings Today</span>
                                    </div>
                                </div>
                                <div className="modern-stat-box">
                                    <div className="stat-icon-wrapper orange"><Activity size={20} /></div>
                                    <div className="stat-info">
                                        <span className="stat-val">{pendingTasks}</span>
                                        <span className="stat-lbl">Active Tasks</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <section className="kpi-grid stagger-2">
                    {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="kpi-card-modern skeleton skeleton-card skel-kpi-card"></div>) : (
                        <>
                            <div className="kpi-card-modern">
                                <div className="kpi-top">
                                    <div className="kpi-icon-pill dark-blue"><Briefcase size={16} /> Projects</div>
                                    <span className="trend positive">Active</span>
                                </div>
                                <div className="kpi-bottom">
                                    <h2>{ongoingProjects} <span className="kpi-total">/ {totalProjects}</span></h2>
                                    <p>Ongoing / Total Projects</p>
                                </div>
                            </div>
                            <div className="kpi-card-modern">
                                <div className="kpi-top">
                                    <div className="kpi-icon-pill blue"><Users size={16} /> Team</div>
                                    <span className="trend neutral">Active</span>
                                </div>
                                <div className="kpi-bottom">
                                    <h2>{team.length} Members</h2>
                                    <p>Currently onboarded in workspace</p>
                                </div>
                            </div>
                            <div className="kpi-card-modern">
                                <div className="kpi-top">
                                    <div className="kpi-icon-pill green"><CheckCircle2 size={16} /> Tasks</div>
                                    <span className="trend positive">All time</span>
                                </div>
                                <div className="kpi-bottom">
                                    <h2>{completedTasks}</h2>
                                    <p>Total team tasks completed</p>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                <section className="dashboard-grid">
                    <div className="grid-col">
                        <div className="premium-widget stagger-3">
                            <div className="widget-header">
                                <h3><ListTodo size={18} className="icon-blue" /> My Priority To-Do List</h3>
                                <Link to="/todo" className="text-btn">Manage All</Link>
                            </div>
                            {isLoading ? (
                                <div className="widget-feed">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="feed-item feed-item-gap">
                                            <div className="skeleton skeleton-avatar skel-avatar-sm"></div>
                                            <div className="skel-flex-1"><div className="skeleton skeleton-text medium"></div><div className="skeleton skeleton-text short"></div></div>
                                        </div>
                                    ))}
                                </div>
                            ) : sortedTodos.length === 0 ? (
                                <div className="empty-state">
                                    <ListTodo size={32} color="#94a3b8" />
                                    <p>No personal tasks added yet.</p>
                                    <Link to="/todo" className="btn-modern-primary hover-pop btn-add-task-small">
                                        <Plus size={14} /> Add Task
                                    </Link>
                                </div>
                            ) : (
                                <div className="widget-feed">
                                    {sortedTodos.slice(0, 5).map((todo) => {
                                        const id = todo._id || todo.id;
                                        const statusClass = todo.status ? todo.status.replace(/\s+/g, '-').toLowerCase() : 'pending';

                                        return (
                                            <div key={id} className="feed-item fade-in-row feed-item-between">
                                                <div className="feed-item-left">
                                                    <div className={`status-dot ${statusClass}`}></div>
                                                    <div className="feed-content">
                                                        <h4 className="feed-title text-truncate">{todo.title}</h4>
                                                        <div className="feed-meta">
                                                            <span className={`priority-badge priority-${todo.priority ? todo.priority.toLowerCase() : 'medium'}`}>{todo.priority || 'Medium'}</span>
                                                            <span className="meta-creator">• {todo.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="feed-item-right">
                                                    {todo.status === 'Pending' && <button className="btn-action-start hover-pop btn-action-small" onClick={() => updateTodoStatus(id, 'In Progress')}>Start</button>}
                                                    {todo.status === 'In Progress' && <button className="btn-action-finish hover-pop btn-action-small" onClick={() => updateTodoStatus(id, 'Completed')}>Finish</button>}
                                                    {todo.status === 'Completed' && <span className="text-success-small">Done</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="premium-widget stagger-3">
                            <div className="widget-header">
                                <h3><AlertCircle size={18} className="icon-orange" /> Recent Team Inquiries</h3>
                            </div>
                            {isLoading ? (
                                <div className="widget-feed">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i} className="feed-item"><div className="skel-flex-1"><div className="skeleton skeleton-text medium"></div><div className="skeleton skeleton-text short"></div></div></div>
                                    ))}
                                </div>
                            ) : inquiries.length === 0 ? (
                                <div className="empty-state"><Users size={32} /><p>No active tasks right now.</p></div>
                            ) : (
                                <div className="widget-feed">
                                    {inquiries.slice(0, 3).map((inq) => (
                                        <div key={inq._id || inq.id} className="feed-item fade-in-row">
                                            <div className={`status-dot ${inq.status.replace(/\s+/g, '-').toLowerCase()}`}></div>
                                            <div className="feed-content">
                                                <h4 className="feed-title">{inq.title}</h4>
                                                <div className="feed-meta"><span className="meta-assignee">For: <strong>{inq.assignedTo}</strong></span></div>
                                            </div>
                                            <span className={`badge badge-${inq.status.replace(/\s+/g, '-').toLowerCase()}`}>{inq.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid-col">
                        <div className="premium-widget stagger-4">
                            <div className="widget-header">
                                <h3><Lightbulb size={18} className="icon-orange" /> Idea Board</h3>
                                <Link to="/projects" className="text-btn">Pitch Idea</Link>
                            </div>
                            {isLoading ? (
                                <div className="schedule-feed">
                                    {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton skeleton-card skel-schedule"></div>)}
                                </div>
                            ) : pendingIdeas.length > 0 ? (
                                <div className="widget-feed">
                                    {pendingIdeas.slice(0, 4).map((idea) => {
                                        const isRejected = idea.status === 'Rejected';
                                        const idToUse = idea._id || idea.id;
                                        const isCreator = idea.createdBy === currentUser?.name;

                                        return (
                                            <div key={idToUse} className="feed-item feed-idea-item fade-in-row">
                                                <div className="feed-content idea-content">
                                                    <h4 className="feed-title">{idea.name}</h4>
                                                    <div className="feed-meta">
                                                        <span className="meta-creator">By: <strong>{idea.createdBy}</strong></span>
                                                    </div>
                                                </div>

                                                <div className="idea-actions-col">
                                                    <span className={`badge badge-${isRejected ? 'rejected' : 'pending'}`}>
                                                        {isRejected ? 'Rejected' : 'Review'}
                                                    </span>

                                                    {isRejected && isCreator && (
                                                        <div className="idea-repitch-row">
                                                            <button
                                                                className="btn-modern-primary hover-pop btn-action-small"
                                                                onClick={() => handleRepitch(idToUse)}
                                                            >
                                                                <RefreshCw size={12} className="mr-1" /> Repitch
                                                            </button>
                                                            <button
                                                                className="btn-modern-danger hover-pop btn-action-small"
                                                                onClick={() => handleDeleteIdea(idToUse)}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state"><Lightbulb size={32} color="#94a3b8" /><p>No pending ideas.</p></div>
                            )}
                        </div>

                        <div className="premium-widget stagger-4">
                            <div className="widget-header">
                                <h3><Clock size={18} className="icon-blue" /> Upcoming Schedule</h3>
                                <span className="badge-small">{events.length} Events</span>
                            </div>
                            {isLoading ? (
                                <div className="schedule-feed">
                                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card skel-schedule"></div>)}
                                </div>
                            ) : events.length > 0 ? (
                                <div className="schedule-feed">
                                    {events.slice(0, 4).map((ev) => (
                                        <div key={ev._id || ev.id} className="schedule-card fade-in-row">
                                            <div className="time-pill">{ev.time}</div>
                                            <div className="schedule-details">
                                                <h4>{ev.title}</h4>
                                                <div className="schedule-meta">
                                                    <span className="meta-type"><Video size={12} /> {ev.type}</span>
                                                    <span className="meta-creator">• By: <strong>{ev.createdBy || 'Admin'}</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state"><CalendarX2 size={32} /><p>Your schedule is clear!</p></div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}