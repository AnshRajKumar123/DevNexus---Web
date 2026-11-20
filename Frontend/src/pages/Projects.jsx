import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, Lightbulb, Rocket, Layout, Code2, Terminal, CheckCircle2,
    X, Trash2, CalendarDays, Edit3, Save, Search, ExternalLink, Lock, Globe,
    MessageSquare, Send, RotateCcw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { pushNotification } from '../utils/notifications';
import '../styles/Projects.css';

export default function Projects() {
    const { currentUser, projects = [], addProject, updateProject, removeProject } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin;

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingProject, setViewingProject] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [commentInput, setCommentInput] = useState('');

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Web Development');
    const [status, setStatus] = useState('Planning');
    const [desc, setDesc] = useState('');
    const [techStack, setTechStack] = useState('');
    const [deadline, setDeadline] = useState('');
    const [liveUrl, setLiveUrl] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const [localProjects, setLocalProjects] = useState([]);
    const displayProjects = projects.length > 0 ? projects : localProjects;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Keep viewingProject in sync when projects state updates
    useEffect(() => {
        if (viewingProject) {
            const id = viewingProject._id || viewingProject.id;
            const fresh = displayProjects.find(p => (p._id || p.id) === id);
            if (fresh) setViewingProject(fresh);
        }
    }, [displayProjects]);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setCategory('Web Development');
        setStatus('Planning');
        setDesc('');
        setTechStack('');
        setDeadline('');
        setLiveUrl('');
        setIsPrivate(false);
    };

    const handleOpenAdd = () => {
        resetForm();
        if (!isMainAdmin) setStatus('Pending Approval');
        setShowModal(true);
    };

    const handleOpenEdit = (e, proj) => {
        e.stopPropagation();
        setEditingId(proj._id || proj.id);
        setName(proj.name);
        setCategory(proj.category);
        setStatus(proj.status);
        setDesc(proj.desc);
        setTechStack(proj.techStack ? proj.techStack.join(', ') : '');
        setDeadline(proj.deadline || '');
        setLiveUrl(proj.liveUrl || '');
        setIsPrivate(Boolean(proj.isPrivate));
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
            liveUrl: liveUrl.trim(),
            isPrivate: isMainAdmin ? isPrivate : false,
            createdBy: currentUser?.name || 'Unknown'
        };

        const saveOp = new Promise((resolve) => {
            setTimeout(() => {
                if (editingId) {
                    if (updateProject) updateProject(editingId, payload);
                    else setLocalProjects(prev => prev.map(p => (p.id === editingId ? { ...p, ...payload } : p)));
                } else {
                    if (addProject) addProject({ ...payload, comments: [], restartRequests: [] });
                    else setLocalProjects(prev => [{ id: Date.now(), ...payload, comments: [], restartRequests: [] }, ...prev]);

                    if (!payload.isPrivate) {
                        pushNotification({
                            type: 'project',
                            title: isMainAdmin ? `New Project: ${name}` : `New Idea Pitched: ${name}`,
                            message: desc.substring(0, 90),
                            createdBy: currentUser?.name,
                            path: '/projects'
                        });
                    }
                }
                resolve('done');
            }, 400);
        });

        window.island.promise(saveOp, {
            loading: isMainAdmin ? 'Saving project...' : 'Submitting idea...',
            success: isMainAdmin ? 'Project saved successfully! ✅' : 'Idea submitted for approval! 💡',
            error: 'Failed to process request.'
        });

        await saveOp;
        setShowModal(false);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to entirely delete this project?')) {
            if (removeProject) removeProject(id);
            else setLocalProjects(prev => prev.filter(p => p.id !== id));
            window.island.success('Project deleted completely.');
        }
    };

    const handleApprove = (id) => {
        if (updateProject) updateProject(id, { status: 'Planning' });
        else setLocalProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'Planning' } : p)));
        window.island.success('Project idea approved! ✅');
    };

    const handleReject = (id) => {
        if (window.confirm('Are you sure you want to reject this pitch?')) {
            if (updateProject) updateProject(id, { status: 'Rejected' });
            else setLocalProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'Rejected' } : p)));
            window.island.error('Project Idea Rejected ❌');
        }
    };

    // Add comment to a project
    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentInput.trim() || !viewingProject) return;

        const id = viewingProject._id || viewingProject.id;
        const newComment = {
            id: Date.now().toString(),
            author: currentUser?.name || 'Member',
            text: commentInput.trim(),
            createdAt: new Date().toISOString()
        };
        const updatedComments = [...(viewingProject.comments || []), newComment];

        if (updateProject) updateProject(id, { comments: updatedComments });
        else setLocalProjects(prev => prev.map(p => ((p._id || p.id) === id ? { ...p, comments: updatedComments } : p)));

        setViewingProject(prev => ({ ...prev, comments: updatedComments }));
        setCommentInput('');

        pushNotification({
            type: 'project',
            title: `New Comment on ${viewingProject.name}`,
            message: newComment.text.substring(0, 90),
            createdBy: currentUser?.name,
            path: '/projects'
        });
        window.island.success('Comment posted! 💬');
    };

    // Member request to restart an "On Hold" project
    const handleRequestRestart = (e, proj) => {
        if (e) e.stopPropagation();
        const id = proj._id || proj.id;
        const existing = proj.restartRequests || [];
        const userName = currentUser?.name || 'Member';

        if (existing.includes(userName)) {
            window.island.success('You already requested to restart this project.');
            return;
        }

        const updatedRequests = [...existing, userName];
        if (updateProject) updateProject(id, { restartRequests: updatedRequests });
        else setLocalProjects(prev => prev.map(p => ((p._id || p.id) === id ? { ...p, restartRequests: updatedRequests } : p)));

        if (viewingProject && (viewingProject._id || viewingProject.id) === id) {
            setViewingProject(prev => ({ ...prev, restartRequests: updatedRequests }));
        }

        pushNotification({
            type: 'project',
            title: `Restart Request: ${proj.name}`,
            message: `${userName} wants to restart this On Hold project.`,
            createdBy: userName,
            path: '/projects'
        });
        window.island.success('Restart request sent to team! 🚀');
    };

    const handleResumeNow = (e, proj) => {
        if (e) e.stopPropagation();
        const id = proj._id || proj.id;
        if (updateProject) updateProject(id, { status: 'In Progress', restartRequests: [] });
        else setLocalProjects(prev => prev.map(p => ((p._id || p.id) === id ? { ...p, status: 'In Progress', restartRequests: [] } : p)));

        if (viewingProject && (viewingProject._id || viewingProject.id) === id) {
            setViewingProject(prev => ({ ...prev, status: 'In Progress', restartRequests: [] }));
        }

        pushNotification({
            type: 'project',
            title: `Project Resumed: ${proj.name}`,
            message: `${proj.name} is now back In Progress.`,
            createdBy: currentUser?.name,
            path: '/projects'
        });
        window.island.success(`${proj.name} is back In Progress! ✅`);
    };

    const renderCategoryIcon = (cat) => {
        if (cat.includes('Web')) return <Layout size={18} color="#3b82f6" />;
        if (cat.includes('App') || cat.includes('Mobile')) return <Terminal size={18} color="#10b981" />;
        if (cat.includes('AI') || cat.includes('Machine')) return <Rocket size={18} color="#1e3a8a" />;
        return <Code2 size={18} color="#f59e0b" />;
    };

    // Hide Private projects from non-admin members
    const visibleProjects = displayProjects.filter(p => isMainAdmin || !p.isPrivate);

    const activeProjectsRaw = visibleProjects.filter(
        p => p.status !== 'Pending Approval' && p.status !== 'Rejected'
    );

    const statusTabs = [
        { key: 'All', label: 'All', count: activeProjectsRaw.length },
        { key: 'In Progress', label: 'In Progress', count: activeProjectsRaw.filter(p => p.status === 'In Progress').length },
        { key: 'Completed', label: 'Completed', count: activeProjectsRaw.filter(p => p.status === 'Completed').length },
        { key: 'On Hold', label: 'On Hold', count: activeProjectsRaw.filter(p => p.status === 'On Hold').length },
        { key: 'Planning', label: 'Planning', count: activeProjectsRaw.filter(p => p.status === 'Planning').length }
    ];

    const activeProjects = activeProjectsRaw.filter(p => {
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const pendingIdeas = displayProjects.filter(p => p.status === 'Pending Approval');

    return (
        <div className="dashboard-wrapper page-animate projects-page">
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
                    <button className="btn-modern-primary hover-pop" onClick={handleOpenAdd}>
                        <Lightbulb size={18} /> Pitch Idea
                    </button>
                )}
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col grid-span-2">
                    <div className="premium-widget">
                        <div className="widget-header widget-header-column">
                            <div className="header-top-row">
                                <h3><Rocket size={18} className="icon-blue" /> Ongoing & Active Projects ({activeProjects.length})</h3>
                            </div>
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    className="search-bar-modern"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search size={18} className="search-icon" />
                            </div>
                            <div className="proj-filter-scroll">
                                {statusTabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={`proj-filter-pill ${statusFilter === tab.key ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(tab.key)}
                                    >
                                        <span>{tab.label}</span>
                                        <span className="proj-filter-count">{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="projects-grid-modern">
                                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-card skel-project-card"></div>)}
                            </div>
                        ) : activeProjects.length === 0 ? (
                            <div className="empty-state">
                                <Briefcase size={48} color="#94a3b8" />
                                <h3>No Projects Found</h3>
                                <p>No active projects match your search criteria.</p>
                            </div>
                        ) : (
                            <div className="projects-grid-modern">
                                {activeProjects.map(proj => {
                                    const idToUse = proj._id || proj.id;
                                    const statusClass = proj.status.replace(/\s+/g, '-').toLowerCase();
                                    const restartVotes = proj.restartRequests || [];
                                    const hasRequested = restartVotes.includes(currentUser?.name);
                                    const commentCount = (proj.comments || []).length;

                                    return (
                                        <div key={idToUse} className="project-card-modern fade-in-row" onClick={() => setViewingProject(proj)}>
                                            <div className="proj-card-header">
                                                <div className="proj-cat-badge">
                                                    {renderCategoryIcon(proj.category)}
                                                    <span>{proj.category}</span>
                                                </div>
                                                <div className="proj-actions">
                                                    {isMainAdmin && proj.isPrivate && (
                                                        <span className="proj-visibility-pill private" title="Private (Supreme Admin Only)">
                                                            <Lock size={11} /> Private
                                                        </span>
                                                    )}
                                                    {isMainAdmin && (
                                                        <>
                                                            <button onClick={(e) => handleOpenEdit(e, proj)}><Edit3 size={14} /></button>
                                                            <button onClick={(e) => handleDelete(e, idToUse)} className="danger-btn"><Trash2 size={14} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="proj-card-body">
                                                <h4>{proj.name}</h4>
                                                <p>{proj.desc}</p>

                                                {proj.techStack && proj.techStack.length > 0 && (
                                                    <div className="proj-tech-stack">
                                                        {proj.techStack.slice(0, 3).map((tech, i) => (
                                                            <span key={i} className="tech-pill">{tech}</span>
                                                        ))}
                                                        {proj.techStack.length > 3 && <span className="tech-pill">+{proj.techStack.length - 3}</span>}
                                                    </div>
                                                )}

                                                {/* Live Website Link & Comment Counter Row */}
                                                <div className="proj-extra-row">
                                                    {proj.liveUrl && (
                                                        <a
                                                            href={proj.liveUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="proj-live-link-btn"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={12} /> Live Site
                                                        </a>
                                                    )}
                                                    <span className="proj-comment-count">
                                                        <MessageSquare size={12} /> {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                                                    </span>
                                                </div>

                                                {/* On Hold Restart Button for All Members */}
                                                {proj.status === 'On Hold' && (
                                                    <div className="proj-restart-bar" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className={`proj-restart-btn ${hasRequested ? 'requested' : ''}`}
                                                            onClick={(e) => handleRequestRestart(e, proj)}
                                                        >
                                                            <RotateCcw size={13} />
                                                            {hasRequested
                                                                ? `Restart Requested (${restartVotes.length})`
                                                                : `Request to Restart${restartVotes.length > 0 ? ` (${restartVotes.length})` : ''}`}
                                                        </button>
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
                                                        <CalendarDays size={14} /> {new Date(proj.deadline).toLocaleDateString()}
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
                    {(pendingIdeas.length > 0 && isMainAdmin) && (
                        <div className="premium-widget stagger-3 mt-2">
                            <div className="widget-header">
                                <h3><Lightbulb size={18} className="icon-orange" /> Idea Board (Pending Approval)</h3>
                            </div>
                            <div className="widget-feed">
                                {pendingIdeas.map(idea => {
                                    const idToUse = idea._id || idea.id;
                                    return (
                                        <div key={idToUse} className="feed-item idea-board-item fade-in-row">
                                            <div className="idea-content-area">
                                                <div className="idea-title-row">
                                                    <span className="badge badge-pending">Review Pending</span>
                                                    <h4 className="feed-title mb-0">{idea.name}</h4>
                                                </div>
                                                <p className="feed-meta mb-1">{idea.desc}</p>
                                                <span className="meta-tag">Pitched by: <strong>{idea.createdBy}</strong> • {idea.category}</span>
                                            </div>

                                            <div className="idea-action-btns">
                                                <button className="btn-modern-primary hover-pop btn-action-small" onClick={() => handleApprove(idToUse)}>
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                                <button className="btn-modern-danger hover-pop btn-action-small" onClick={() => handleReject(idToUse)}>
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* --- PROJECT DETAILS + COMMENTS + LIVE LINK + RESTART POPUP --- */}
            {viewingProject && (
                <div className="modal-overlay fade-in" onClick={() => setViewingProject(null)}>
                    <div className="modal-content pop-in project-details-modal modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header modal-header-extended">
                            <div>
                                <h2 className="modal-header-title">{viewingProject.name}</h2>
                                <span className="meta-tag modal-header-subtitle">
                                    {viewingProject.category} • Pitched by <strong>{viewingProject.createdBy}</strong>
                                    {viewingProject.isPrivate && ' • Private'}
                                </span>
                            </div>
                            <button className="modal-close" onClick={() => setViewingProject(null)}><X size={24} /></button>
                        </div>

                        <div className="project-details-grid">
                            <div className="detail-section">
                                <h4>Description & Objectives</h4>
                                <p>{viewingProject.desc}</p>
                            </div>

                            {viewingProject.liveUrl && (
                                <div className="detail-section">
                                    <h4>Live Website</h4>
                                    <a href={viewingProject.liveUrl} target="_blank" rel="noreferrer" className="btn-modern-primary proj-modal-live-btn">
                                        <ExternalLink size={15} /> Visit Live Website
                                    </a>
                                </div>
                            )}

                            {viewingProject.techStack && viewingProject.techStack.length > 0 && (
                                <div className="detail-section">
                                    <h4>Tech Stack</h4>
                                    <div className="proj-tech-stack">
                                        {viewingProject.techStack.map(t => <span key={t} className="tech-pill">{t}</span>)}
                                    </div>
                                </div>
                            )}

                            <div className="detail-row">
                                <div className="detail-box">
                                    <span className="detail-label">Current Status</span>
                                    <span className={`badge align-start badge-${viewingProject.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                        {viewingProject.status}
                                    </span>
                                </div>
                                <div className="detail-box">
                                    <span className="detail-label">Target Deadline</span>
                                    <span className="detail-value">
                                        {viewingProject.deadline ? new Date(viewingProject.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No deadline set'}
                                    </span>
                                </div>
                            </div>

                            {/* On Hold Restart Action inside Modal */}
                            {viewingProject.status === 'On Hold' && (
                                <div className="proj-modal-restart-box">
                                    <div>
                                        <h4>Project is On Hold</h4>
                                        <p>
                                            {(viewingProject.restartRequests || []).length > 0
                                                ? `${viewingProject.restartRequests.length} member(s) requested to restart: ${viewingProject.restartRequests.join(', ')}`
                                                : 'Want to get this project moving again?'}
                                        </p>
                                    </div>
                                    <div className="proj-restart-modal-btns">
                                        <button className="btn-modern-secondary" onClick={(e) => handleRequestRestart(e, viewingProject)}>
                                            <RotateCcw size={14} /> Request Restart
                                        </button>
                                        {isMainAdmin && (
                                            <button className="btn-modern-primary" onClick={(e) => handleResumeNow(e, viewingProject)}>
                                                Resume Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Project Comments Section */}
                            <div className="detail-section proj-comments-section">
                                <h4><MessageSquare size={15} style={{ display: 'inline', marginRight: '6px' }} /> Comments ({(viewingProject.comments || []).length})</h4>
                                <div className="proj-comments-list">
                                    {(viewingProject.comments || []).length === 0 ? (
                                        <p className="proj-no-comments">No comments yet. Start the discussion!</p>
                                    ) : (
                                        viewingProject.comments.map((c, idx) => (
                                            <div key={c.id || idx} className="proj-comment-item">
                                                <div className="proj-comment-head">
                                                    <strong>{c.author}</strong>
                                                    <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                                                </div>
                                                <p>{c.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form onSubmit={handleAddComment} className="proj-comment-form">
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={e => setCommentInput(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="modern-input"
                                    />
                                    <button type="submit" className="btn-modern-primary proj-comment-send">
                                        <Send size={15} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Create / Edit Project Modal --- */}
            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in modal-medium">
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
                                <label>Live Website URL (Optional)</label>
                                <input type="url" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} className="modern-input" placeholder="https://example.com" />
                            </div>

                            <div className="form-group">
                                <label>Tech Stack (Comma separated)</label>
                                <input type="text" value={techStack} onChange={e => setTechStack(e.target.value)} className="modern-input" placeholder="e.g. React, Node.js, MongoDB" />
                            </div>

                            {isMainAdmin && (
                                <div className="form-group">
                                    <label>Visibility</label>
                                    <div className="visibility-toggle-group">
                                        <button
                                            type="button"
                                            className={`vis-btn ${!isPrivate ? 'active' : ''}`}
                                            onClick={() => setIsPrivate(false)}
                                        >
                                            <Globe size={14} /> Public (All Members)
                                        </button>
                                        <button
                                            type="button"
                                            className={`vis-btn ${isPrivate ? 'active private' : ''}`}
                                            onClick={() => setIsPrivate(true)}
                                        >
                                            <Lock size={14} /> Private (Admin Only)
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Description & Objectives</label>
                                <textarea rows="4" value={desc} onChange={e => setDesc(e.target.value)} className="modern-input" required placeholder="Outline the main goals of this project..."></textarea>
                            </div>

                            <div className="modal-actions-right">
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