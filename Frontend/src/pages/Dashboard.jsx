import React, { useState, useEffect } from 'react';
import { 
    Inbox, CalendarX2, BarChart2, Users, AlertCircle, Video, TrendingUp, CheckCircle2, Clock, Activity, ListTodo, PlayCircle, Trash2, Plus, Briefcase, Lightbulb
} from 'lucide-react';
import { useData } from '../context/DataContext'; 
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { inquiries, events, currentUser, team, todos = [], projects = [], updateTodoStatus } = useData(); 
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
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const pendingTasks = inquiries.filter(i => i.status !== 'Completed').length;
    const completedTasks = inquiries.filter(i => i.status === 'Completed').length;

    const userTodos = (todos || []).filter(t => t.userName === currentUser?.name);
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortedTodos = [...userTodos].sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));

    // Calculate Project KPIs
    const totalProjects = projects.length;
    const ongoingProjects = projects.filter(p => p.status === 'In Progress').length;
    const pendingIdeas = projects.filter(p => p.status === 'Pending Approval');

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="dashboard-hero-modern stagger-1">
                <div className="hero-text-content">
                    {isLoading ? (
                        <>
                            <div className="skeleton skeleton-text short" style={{ marginBottom: '1rem' }}></div>
                            <div className="skeleton skeleton-title" style={{ width: '350px', height: '2.5rem' }}></div>
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
                            <div className="modern-stat-box skeleton" style={{ width: '180px', height: '80px' }}></div>
                            <div className="modern-stat-box skeleton" style={{ width: '180px', height: '80px' }}></div>
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
                {isLoading ? Array.from({length: 3}).map((_,i) => <div key={i} className="kpi-card-modern skeleton skeleton-card" style={{ height: '160px' }}></div>) : (
                    <>
                        <div className="kpi-card-modern">
                            <div className="kpi-top">
                                <div className="kpi-icon-pill purple"><Briefcase size={16} /> Projects</div>
                                <span className="trend positive">Active</span>
                            </div>
                            <div className="kpi-bottom">
                                <h2>{ongoingProjects} <span style={{fontSize: '1rem', color: '#94a3b8', fontWeight: 600}}>/ {totalProjects}</span></h2>
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
                                {Array.from({length: 3}).map((_,i) => (
                                    <div key={i} className="feed-item" style={{ gap: '1rem' }}>
                                        <div className="skeleton skeleton-avatar" style={{ width:'20px', height:'20px' }}></div>
                                        <div style={{ flex: 1 }}><div className="skeleton skeleton-text medium"></div><div className="skeleton skeleton-text short"></div></div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedTodos.length === 0 ? (
                            <div className="empty-state">
                                <ListTodo size={32} color="#94a3b8" />
                                <p>No personal tasks added yet.</p>
                                <Link to="/todo" className="btn-modern-primary hover-pop" style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                    <Plus size={14} /> Add Task
                                </Link>
                            </div>
                        ) : (
                            <div className="widget-feed">
                                {sortedTodos.slice(0, 5).map((todo) => {
                                    const id = todo._id || todo.id;
                                    const statusClass = todo.status ? todo.status.replace(/\s+/g, '-').toLowerCase() : 'pending';

                                    return (
                                        <div key={id} className="feed-item fade-in-row" style={{ justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                                <div className={`status-dot ${statusClass}`}></div>
                                                <div className="feed-content" style={{ minWidth: 0 }}>
                                                    <h4 className="feed-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{todo.title}</h4>
                                                    <div className="feed-meta">
                                                        <span className={`priority-badge priority-${todo.priority ? todo.priority.toLowerCase() : 'medium'}`}>{todo.priority || 'Medium'}</span>
                                                        <span className="meta-creator">• {todo.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                                {todo.status === 'Pending' && <button className="btn-action-start hover-pop" onClick={() => updateTodoStatus(id, 'In Progress')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Start</button>}
                                                {todo.status === 'In Progress' && <button className="btn-action-finish hover-pop" onClick={() => updateTodoStatus(id, 'Completed')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Finish</button>}
                                                {todo.status === 'Completed' && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Done</span>}
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
                                {Array.from({length: 2}).map((_,i) => (
                                    <div key={i} className="feed-item"><div style={{ flex: 1 }}><div className="skeleton skeleton-text medium"></div><div className="skeleton skeleton-text short"></div></div></div>
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
                                {Array.from({length: 2}).map((_,i) => <div key={i} className="skeleton skeleton-card" style={{ height: '70px' }}></div>)}
                            </div>
                        ) : pendingIdeas.length > 0 ? (
                            <div className="widget-feed">
                                {pendingIdeas.slice(0, 4).map((idea) => (
                                    <div key={idea._id || idea.id} className="feed-item fade-in-row" style={{ alignItems: 'flex-start' }}>
                                        <div className="feed-content">
                                            <h4 className="feed-title">{idea.name}</h4>
                                            <div className="feed-meta">
                                                <span className="meta-creator">By: <strong>{idea.createdBy}</strong></span>
                                            </div>
                                        </div>
                                        <span className="badge badge-pending">Review</span>
                                    </div>
                                ))}
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
                                {Array.from({length: 3}).map((_,i) => <div key={i} className="skeleton skeleton-card" style={{ height: '70px' }}></div>)}
                            </div>
                        ) : events.length > 0 ? (
                            <div className="schedule-feed">
                                {events.slice(0, 4).map((ev) => (
                                    <div key={ev._id || ev.id} className="schedule-card fade-in-row">
                                        <div className="time-pill">{ev.time}</div>
                                        <div className="schedule-details">
                                            <h4>{ev.title}</h4>
                                            <div className="schedule-meta">
                                                <span className="meta-type"><Video size={12}/> {ev.type}</span>
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
    );
}