import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, Plus, Video, MapPin, Clock, Users, X, CalendarDays } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/Calendar.css';

export default function Calendar() {
    const { events, addEvent, currentUser } = useData();

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('Google Meet');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        addEvent({ title, date, time, type, createdBy: currentUser?.name || 'Unknown User' });
        setTitle('');
        setDate('');
        setTime('');
        setType('Google Meet');
        setShowModal(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Team <span className="highlight-name">Schedule</span></h1>
                    <p className="hero-subtitle">Organize meetings, sync company timelines, and track deadlines.</p>
                </div>
                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Schedule Event
                </button>
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><CalendarDays size={18} className="icon-blue" /> Scheduled Events ({events.length})</h3>
                        </div>

                        {isLoading ? (
                            <div className="calendar-list-modern">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="calendar-card-item">
                                        <div className="skeleton skeleton-btn" style={{ width: '100px', height: '50px' }}></div>
                                        <div className="calendar-main-info">
                                            <div className="skeleton skeleton-text medium"></div>
                                            <div className="skeleton skeleton-text short"></div>
                                        </div>
                                        <div className="calendar-attendees-col">
                                            <div className="skeleton skeleton-btn" style={{ width: '120px', height: '25px', borderRadius: '99px' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : events.length === 0 ? (
                            <div className="empty-state">
                                <CalendarDays size={48} color="#94a3b8" />
                                <h3>No Events Scheduled</h3>
                                <p>Your upcoming team meetings and deadlines will appear here.</p>
                                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
                                    <Plus size={16} /> Schedule First Event
                                </button>
                            </div>
                        ) : (
                            <div className="calendar-list-modern">
                                {events.map((ev) => (
                                    <div key={ev._id || ev.id} className="calendar-card-item fade-in-row">
                                        <div className="calendar-time-pill">
                                            <Clock size={14} />
                                            <span>{ev.time}</span>
                                            <span className="cal-date-sub">{formatDate(ev.date)}</span>
                                        </div>
                                        
                                        <div className="calendar-main-info">
                                            <h4>{ev.title}</h4>
                                            <div className="calendar-meta-tags">
                                                <span className={`event-type-badge-modern ${ev.type === 'In Person' ? 'type-physical' : 'type-virtual'}`}>
                                                    {ev.type === 'In Person' ? <MapPin size={12}/> : <Video size={12}/>} {ev.type}
                                                </span>
                                                <span className="meta-tag">• Scheduled by: <strong>{ev.createdBy || 'Admin'}</strong></span>
                                            </div>
                                        </div>

                                        <div className="calendar-attendees-col">
                                            <span className="attendees-pill"><Users size={12}/> All Team Members</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- Modern Modal --- */}
            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in">
                        <div className="modal-header">
                            <h2>Schedule New Event</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="form-group">
                                <label>Event Title</label>
                                <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="modern-input" required placeholder="e.g. Q4 Strategy Planning" />
                            </div>
                            
                            <div className="form-group-row">
                                <div className="form-group flex-1">
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="modern-input" required />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Time</label>
                                    <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="modern-input" required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Event Location / Type</label>
                                <select value={type} onChange={e=>setType(e.target.value)} className="modern-input" required>
                                    <option value="Google Meet">Google Meet</option>
                                    <option value="Zoom">Zoom</option>
                                    <option value="In Person">In Person (Office)</option>
                                </select>
                            </div>

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    <Plus size={16} /> Save Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}