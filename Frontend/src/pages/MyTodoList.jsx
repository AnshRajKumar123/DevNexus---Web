import React, { useState } from 'react';
import { CheckCircle2, PlayCircle, Plus, Trash2, ListTodo, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/MyTodoList.css';

export default function MyTodoList() {
    const { todos = [], addTodo, updateTodoStatus, removeTodo, currentUser } = useData();

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('Medium');

    const handleCreate = (e) => {
        e.preventDefault();
        addTodo({ title, priority });
        setTitle('');
        setPriority('Medium');
        setShowModal(false);
    };

    // Safe fallback array to prevent .filter crash
    const safeTodos = todos || [];

    const pendingCount = safeTodos.filter(t => t.status === 'Pending').length;
    const progressCount = safeTodos.filter(t => t.status === 'In Progress').length;
    const completedCount = safeTodos.filter(t => t.status === 'Completed').length;

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Personal <span className="highlight-name">To-Do List</span></h1>
                    <p className="hero-subtitle">Organize your daily workflow, track progress, and conquer your goals.</p>
                </div>
                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Task
                </button>
            </header>

            {/* Stats Overview */}
            <section className="kpi-grid stagger-2">
                <div className="kpi-card-modern">
                    <div className="kpi-top">
                        <div className="kpi-icon-pill orange">Pending</div>
                    </div>
                    <div className="kpi-bottom">
                        <h2>{pendingCount}</h2>
                        <p>Tasks waiting to start</p>
                    </div>
                </div>
                <div className="kpi-card-modern">
                    <div className="kpi-top">
                        <div className="kpi-icon-pill blue">In Progress</div>
                    </div>
                    <div className="kpi-bottom">
                        <h2>{progressCount}</h2>
                        <p>Currently active tasks</p>
                    </div>
                </div>
                <div className="kpi-card-modern">
                    <div className="kpi-top">
                        <div className="kpi-icon-pill green">Completed</div>
                    </div>
                    <div className="kpi-bottom">
                        <h2>{completedCount}</h2>
                        <p>Successfully finished</p>
                    </div>
                </div>
            </section>

            <section className="dashboard-grid stagger-3">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><ListTodo size={18} className="icon-blue" /> My Workspace Tasks ({safeTodos.length})</h3>
                        </div>

                        {safeTodos.length === 0 ? (
                            <div className="empty-state">
                                <ListTodo size={48} color="#94a3b8" />
                                <h3>Your To-Do list is empty</h3>
                                <p>Add personal tasks to keep track of your daily responsibilities.</p>
                                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
                                    <Plus size={16} /> Add First Task
                                </button>
                            </div>
                        ) : (
                            <div className="todo-list-modern">
                                {safeTodos.map((todo) => {
                                    const id = todo._id || todo.id;
                                    const statusClass = todo.status ? todo.status.replace(/\s+/g, '-').toLowerCase() : 'pending';

                                    return (
                                        <div key={id} className="todo-card-item fade-in-row">
                                            <div className={`status-pill-indicator ${statusClass}`}></div>
                                            
                                            <div className="todo-main-info">
                                                <h4 className={todo.status === 'Completed' ? 'completed-text' : ''}>{todo.title}</h4>
                                                <div className="todo-meta-tags">
                                                    <span className={`priority-badge priority-${todo.priority ? todo.priority.toLowerCase() : 'medium'}`}>{todo.priority || 'Medium'} Priority</span>
                                                    <span className="meta-tag">• Created today</span>
                                                </div>
                                            </div>

                                            <div className="todo-status-col">
                                                <span className={`badge badge-${statusClass}`}>{todo.status}</span>
                                            </div>

                                            <div className="todo-actions-col">
                                                <div className="action-button-group">
                                                    {todo.status === 'Pending' && (
                                                        <button className="btn-action-start hover-pop" onClick={() => updateTodoStatus(id, 'In Progress')}>
                                                            <PlayCircle size={14} /> Start
                                                        </button>
                                                    )}
                                                    {todo.status === 'In Progress' && (
                                                        <button className="btn-action-finish hover-pop" onClick={() => updateTodoStatus(id, 'Completed')}>
                                                            <CheckCircle2 size={14} /> Finish
                                                        </button>
                                                    )}
                                                    {todo.status === 'Completed' && (
                                                        <button className="btn-action-reset hover-pop" onClick={() => updateTodoStatus(id, 'Pending')}>
                                                            Reopen
                                                        </button>
                                                    )}
                                                    <button onClick={() => removeTodo(id)} className="btn-icon-danger hover-pop" title="Delete Task">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- Add Todo Modal --- */}
            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in">
                        <div className="modal-header">
                            <h2>Create New Personal Task</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="modern-form">
                            <div className="form-group">
                                <label>Task Objective</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    className="modern-input"
                                    placeholder="e.g. Refactor API authentication middleware" 
                                    required 
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority Level</label>
                                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="modern-input" required>
                                    <option value="Low">Low Priority</option>
                                    <option value="Medium">Medium Priority</option>
                                    <option value="High">High Priority</option>
                                </select>
                            </div>
                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    <Plus size={16} /> Save Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}