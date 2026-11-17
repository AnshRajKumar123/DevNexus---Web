import React, { useState, useEffect } from 'react';
import { 
    Briefcase, Plus, Lightbulb, Rocket, Layout, Code2, Terminal, CheckCircle2, 
    X, Trash2, CalendarDays, MoreVertical, Edit3, Save 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/Projects.css';

export default function Projects() {
    const { currentUser, projects = [], addProject, updateProject, removeProject } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin;

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Web Development');
    const [status, setStatus] = useState('Planning');
    const [desc, setDesc] = useState('');
    const [techStack, setTechStack] = useState('');
    const [deadline, setDeadline] = useState('');
    
    // Local fallback state just in case Context isn't fully wired yet
    const [localProjects, setLocalProjects] = useState([]);
    const displayProjects = projects.length > 0 ? projects : localProjects;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setCategory('Web Development');
        setStatus('Planning');
        setDesc('');
        setTechStack('');
        setDeadline('');
    };

    const handleOpenAdd = () => {
        resetForm();
        if (!isMainAdmin) setStatus('Pending Approval'); // Force status for members
        setShowModal(true);
    };

    const handleOpenEdit = (proj) => {
        setEditingId(proj._id || proj.id);
        setName(proj.name);
        setCategory(proj.category);
        setStatus(proj.status);
        setDesc(proj.desc);
        setTechStack(proj.techStack ? proj.techStack.join(', ') : '');
        setDeadline(proj.deadline || '');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const payload = { 
            name, 
            category, 
            status: isMainAdmin ? status : 'Pending Approval', 
            desc, 
            techStack: techStack.split(',').map(s => s.trim()).filter(Boolean),
            deadline,
            createdBy: currentUser?.name || 'Unknown'
        };

        const saveOp = new Promise((resolve) => {
            setTimeout(() => {
                if (editingId) {
                    if (updateProject) updateProject(editingId, payload);
                    else setLocalProjects(prev => prev.map(p => (p.id === editingId ? { ...p, ...payload } : p)));
                } else {
                    if (addProject) addProject(payload);
                    else setLocalProjects(prev => [{ id: Date.now(), ...payload }, ...prev]);
                }
                resolve('done');
            }, 600);
        });

        window.island.promise(saveOp, {
            loading: isMainAdmin ? 'Saving project...' : 'Submitting idea...',
            success: isMainAdmin ? 'Project saved successfully! ✅' : 'Idea submitted for approval! 💡',
            error: 'Failed to process request.'
        });

        await saveOp;
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            if (removeProject) removeProject(id);
            else setLocalProjects(prev => prev.filter(p => p.id !== id));
            window.island.success('Project deleted successfully.');
        }
    };

    const handleApprove = (id) => {
        if (updateProject) updateProject(id, { status: 'Planning' });
        else setLocalProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'Planning' } : p)));
        window.island.success('Project idea approved! ✅');
    };

    const renderCategoryIcon = (cat) => {
        if (cat.includes('Web')) return <Layout size={18} color="#3b82f6" />;
        if (cat.includes('App') || cat.includes('Mobile')) return <Terminal size={18} color="#10b981" />;
        if (cat.includes('AI') || cat.includes('Machine')) return <Rocket size={18} color="#8b5cf6" />;
        return <Code2 size={18} color="#f59e0b" />;
    };

    const activeProjects = displayProjects.filter(p => p.status !== 'Pending Approval');
    const pendingIdeas = displayProjects.filter(p => p.status === 'Pending Approval');

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Team <span className="highlight-name">Projects</span></h1>
                    <p className="hero-subtitle">Manage ongoing builds, track development, or pitch new ideas.</p>
                </div>
                
                {isMainAdmin ? (
                    <button className="btn-modern-primary hover-pop" onClick={handleOpenAdd}>
                        <Briefcase size={18} /> Add Project
                    </button>
                ) : (
                    <button className="btn-modern-primary hover-pop" onClick={handleOpenAdd} style={{ background: '#8b5cf6' }}>
                        <Lightbulb size={18} /> Pitch Idea
                    </button>
                )}
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    
                    {/* ACTIVE PROJECTS WIDGET */}
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Rocket size={18} className="icon-blue" /> Ongoing & Active Projects ({activeProjects.length})</h3>
                        </div>

                        {isLoading ? (
                            <div className="projects-grid-modern">
                                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '220px' }}></div>)}
                            </div>
                        ) : activeProjects.length === 0 ? (
                            <div className="empty-state">
                                <Briefcase size={48} color="#94a3b8" />
                                <h3>No Active Projects</h3>
                                <p>There are currently no projects in development.</p>
                            </div>
                        ) : (
                            <div className="projects-grid-modern">
                                {activeProjects.map(proj => {
                                    const idToUse = proj._id || proj.id;
                                    const statusClass = proj.status.replace(/\s+/g, '-').toLowerCase();
                                    
                                    return (
                                        <div key={idToUse} className="project-card-modern fade-in-row">
                                            <div className="proj-card-header">
                                                <div className="proj-cat-badge">
                                                    {renderCategoryIcon(proj.category)}
                                                    <span>{proj.category}</span>
                                                </div>
                                                {isMainAdmin && (
                                                    <div className="proj-actions">
                                                        <button onClick={() => handleOpenEdit(proj)}><Edit3 size={14}/></button>
                                                        <button onClick={() => handleDelete(idToUse)} className="danger-btn"><Trash2 size={14}/></button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="proj-card-body">
                                                <h4>{proj.name}</h4>
                                                <p>{proj.desc}</p>
                                                
                                                {proj.techStack && proj.techStack.length > 0 && (
                                                    <div className="proj-tech-stack">
                                                        {proj.techStack.slice(0,3).map((tech, i) => (
                                                            <span key={i} className="tech-pill">{tech}</span>
                                                        ))}
                                                        {proj.techStack.length > 3 && <span className="tech-pill">+{proj.techStack.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="proj-card-footer">
                                                <div className={`proj-status-indicator ${statusClass}`}>
                                                    <span className="status-dot"></span>
                                                    {proj.status}
                                                </div>
                                                {proj.deadline && (
                                                    <div className="proj-deadline">
                                                        <CalendarDays size={14}/> {new Date(proj.deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* IDEA BOARD (PENDING APPROVAL) */}
                    {(pendingIdeas.length > 0 || !isMainAdmin) && (
                        <div className="premium-widget stagger-3" style={{ marginTop: '2rem' }}>
                            <div className="widget-header">
                                <h3><Lightbulb size={18} className="icon-orange" /> Idea Board (Pending Approval)</h3>
                            </div>
                            <div className="widget-feed">
                                {pendingIdeas.length === 0 ? (
                                    <p className="empty-subtext" style={{ padding: '1rem' }}>No ideas pending approval. Got a spark? Pitch it!</p>
                                ) : pendingIdeas.map(idea => {
                                    const idToUse = idea._id || idea.id;
                                    return (
                                        <div key={idToUse} className="feed-item fade-in-row" style={{ justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <span className="badge badge-pending">Review Pending</span>
                                                    <h4 className="feed-title">{idea.name}</h4>
                                                </div>
                                                <p className="feed-meta" style={{ marginBottom: '0.25rem' }}>{idea.desc}</p>
                                                <span className="meta-tag">Pitched by: <strong>{idea.createdBy}</strong> • {idea.category}</span>
                                            </div>
                                            
                                            {isMainAdmin && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn-modern-primary hover-pop" onClick={() => handleApprove(idToUse)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                                                        <CheckCircle2 size={14}/> Approve
                                                    </button>
                                                    <button className="btn-modern-danger hover-pop" onClick={() => handleDelete(idToUse)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Advanced Project Modal --- */}
            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2>{isMainAdmin ? (editingId ? 'Edit Project' : 'Create New Project') : 'Pitch Project Idea'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="modern-form">
                            <div className="form-group-row">
                                <div className="form-group flex-1">
                                    <label>Project Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="modern-input" required placeholder="e.g. Nexus Core API" />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Category / Field</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="modern-input" required>
                                        <option value="Web Development">Web Development</option>
                                        <option value="Mobile App">Mobile App</option>
                                        <option value="AI / Machine Learning">AI / Machine Learning</option>
                                        <option value="UI/UX Design">UI/UX Design</option>
                                        <option value="Internal Tooling">Internal Tooling</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group-row">
                                {isMainAdmin && (
                                    <div className="form-group flex-1">
                                        <label>Status</label>
                                        <select value={status} onChange={e => setStatus(e.target.value)} className="modern-input" required>
                                            <option value="Planning">Planning</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="On Hold">On Hold</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group flex-1">
                                    <label>Target Deadline (Optional)</label>
                                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="modern-input" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tech Stack (Comma separated)</label>
                                <input type="text" value={techStack} onChange={e => setTechStack(e.target.value)} className="modern-input" placeholder="e.g. React, Node.js, MongoDB" />
                            </div>

                            <div className="form-group">
                                <label>Description & Objectives</label>
                                <textarea rows="4" value={desc} onChange={e => setDesc(e.target.value)} className="modern-input" required placeholder="Outline the main goals of this project..."></textarea>
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    {isMainAdmin ? <Save size={16} /> : <Lightbulb size={16} />} 
                                    {isMainAdmin ? (editingId ? 'Save Changes' : 'Create Project') : 'Submit Idea'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}