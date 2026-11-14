import React, { useState } from 'react';
import { FileQuestion, Plus, X, MessageSquarePlus, PlayCircle, CheckCircle2, AlertCircle, User, Layers } from 'lucide-react';
import { useData } from '../context/DataContext'; 
import '../styles/Inquiry.css';

export default function Inquiry() {
    const { inquiries, addInquiry, updateInquiryStatus, team, currentUser } = useData(); 

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [assignedTo, setAssignedTo] = useState('All Members');

    const handleSubmit = (e) => {
        e.preventDefault();
        addInquiry({ 
            title, 
            description: desc, 
            assignedTo,
            reportedBy: currentUser?.name 
        });
        setTitle('');
        setDesc('');
        setAssignedTo('All Members');
        setShowModal(false);
    };

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Task & <span className="highlight-name">Inquiries</span></h1>
                    <p className="hero-subtitle">Assign, track, and manage team objectives and reported issues.</p>
                </div>
                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Assign Task
                </button>
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Layers size={18} className="icon-orange" /> Active Tasks & Issues ({inquiries.length})</h3>
                        </div>

                        {inquiries.length === 0 ? (
                            <div className="empty-state">
                                <FileQuestion size={48} color="#94a3b8" />
                                <h3>No pending tasks or inquiries</h3>
                                <p>When you assign a task or report an issue, it will appear here.</p>
                                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
                                    <Plus size={16} /> Assign First Task
                                </button>
                            </div>
                        ) : (
                            <div className="inquiry-list-modern">
                                {inquiries.map((inq) => {
                                    const canManageTask = 
                                        inq.assignedTo === currentUser?.name || 
                                        inq.assignedTo === 'All Members' || 
                                        currentUser?.isSupremeAdmin;

                                    const statusClass = inq.status ? inq.status.replace(/\s+/g, '-').toLowerCase() : 'pending';

                                    return (
                                        <div key={inq._id || inq.id} className="inquiry-card-item fade-in-row">
                                            <div className={`status-pill-indicator ${statusClass}`}></div>
                                            
                                            <div className="inquiry-main-info">
                                                <h4>{inq.title}</h4>
                                                <p>{inq.description}</p>
                                                <div className="inquiry-meta-tags">
                                                    <span className="meta-tag"><User size={12}/> {inq.assignedTo}</span>
                                                    <span className="meta-tag">• Created by: {inq.reportedBy || 'Admin'}</span>
                                                </div>
                                            </div>

                                            <div className="inquiry-status-col">
                                                <span className={`badge badge-${statusClass}`}>{inq.status}</span>
                                            </div>

                                            <div className="inquiry-actions-col">
                                                {canManageTask ? (
                                                    <div className="action-button-group">
                                                        {inq.status === 'Pending' && (
                                                            <button className="btn-action-start hover-pop" onClick={() => updateInquiryStatus(inq._id || inq.id, 'In Progress')}>
                                                                <PlayCircle size={14} /> Start
                                                            </button>
                                                        )}
                                                        {inq.status === 'In Progress' && (
                                                            <button className="btn-action-finish hover-pop" onClick={() => updateInquiryStatus(inq._id || inq.id, 'Completed')}>
                                                                <CheckCircle2 size={14} /> Finish
                                                            </button>
                                                        )}
                                                        {inq.status === 'Completed' && (
                                                            <span className="done-text">Completed</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="restricted-text">
                                                        {inq.status === 'Completed' ? 'Done' : 'Restricted'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
                            <h2>Assign New Task</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="modern-form">
                            <div className="form-group">
                                <label>Task / Issue Title</label>
                                <input 
                                  type="text" 
                                  value={title} 
                                  onChange={(e) => setTitle(e.target.value)} 
                                  className="modern-input"
                                  placeholder="e.g. Update Hero Section" required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="modern-input" required>
                                    <option value="All Members">All Members</option>
                                    {team.map(member => (
                                        <option key={member._id || member.id} value={member.name}>{member.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Task Details</label>
                                <textarea 
                                  rows="4" 
                                  value={desc} 
                                  onChange={(e) => setDesc(e.target.value)} 
                                  className="modern-input"
                                  placeholder="Provide full instructions..." required
                                ></textarea>
                            </div>
                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    <MessageSquarePlus size={16} /> Assign Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}