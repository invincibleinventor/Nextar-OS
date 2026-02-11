'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { IoAddOutline, IoTrashOutline, IoCreateOutline, IoCheckmarkCircle, IoEllipseOutline } from 'react-icons/io5';
import { useProjects } from '../ProjectContext';
import { useNotifications } from '../NotificationContext';
import { useWindows } from '../WindowContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'backlog' | 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    linkedFile?: string;
    createdAt: number;
}

const STORAGE_PREFIX = 'hackathon-board-';

const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: '#6b7280' },
    { id: 'todo', label: 'To Do', color: '#3b82f6' },
    { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'done', label: 'Done', color: '#22c55e' },
];

const priorityStyles: Record<string, string> = {
    'low': 'bg-[--border-color] text-[--text-muted]',
    'medium': 'bg-pastel-peach/20 text-pastel-peach',
    'high': 'bg-pastel-red/20 text-pastel-red',
};

// --- Task Card ---
const TaskCard: React.FC<{
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, status: Task['status']) => void;
}> = ({ task, onEdit, onDelete, onMove }) => {
    const nextStatus = (): Task['status'] | null => {
        const order: Task['status'][] = ['backlog', 'todo', 'in_progress', 'done'];
        const idx = order.indexOf(task.status);
        return idx < order.length - 1 ? order[idx + 1] : null;
    };

    const next = nextStatus();

    return (
        <div className="bg-surface border border-[--border-color] p-3 group hover:bg-overlay transition cursor-default">
            <div className="flex items-start justify-between mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 ${priorityStyles[task.priority]}`}>
                    {task.priority}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => onEdit(task)} className="p-0.5 hover:bg-overlay">
                        <IoCreateOutline size={12} className="text-[--text-muted]" />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-0.5 hover:bg-overlay">
                        <IoTrashOutline size={12} className="text-pastel-red" />
                    </button>
                </div>
            </div>
            <h4 className="text-xs font-medium text-[--text-color] mb-1">{task.title}</h4>
            {task.description && (
                <p className="text-[11px] text-[--text-muted] mb-2 line-clamp-2">{task.description}</p>
            )}
            {task.linkedFile && (
                <div className="text-[10px] text-accent mb-2 truncate">{task.linkedFile}</div>
            )}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-[--text-muted] opacity-60">
                    {new Date(task.createdAt).toLocaleDateString()}
                </span>
                {next && (
                    <button
                        onClick={() => onMove(task.id, next)}
                        className="text-[10px] px-1.5 py-0.5 bg-overlay hover:bg-[--border-color] text-[--text-muted] hover:text-[--text-color] transition"
                    >
                        Move &rarr;
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Add/Edit Task Dialog ---
const TaskDialog: React.FC<{
    task?: Task;
    onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ task, onSave, onClose }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [status, setStatus] = useState<Task['status']>(task?.status || 'todo');
    const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
    const [linkedFile, setLinkedFile] = useState(task?.linkedFile || '');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]" onClick={onClose}>
            <div className="bg-surface border border-[--border-color] p-5 w-[380px]" onClick={e => e.stopPropagation()}>
                <h3 className="text-sm font-semibold text-[--text-color] mb-4">{task ? 'Edit Task' : 'New Task'}</h3>

                <div className="space-y-3 mb-4">
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Task title"
                        className="w-full bg-overlay border border-transparent px-3 py-2 text-sm text-[--text-color] outline-none focus:border-accent"
                        autoFocus
                    />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full bg-overlay border border-transparent px-3 py-2 text-sm text-[--text-color] outline-none focus:border-accent resize-none h-20"
                    />
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-[--text-muted] mb-1 block">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as Task['status'])}
                                className="w-full bg-overlay border border-[--border-color] px-2 py-1.5 text-xs text-[--text-color] outline-none"
                            >
                                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-[--text-muted] mb-1 block">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as Task['priority'])}
                                className="w-full bg-overlay border border-[--border-color] px-2 py-1.5 text-xs text-[--text-color] outline-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <input
                        value={linkedFile}
                        onChange={e => setLinkedFile(e.target.value)}
                        placeholder="Link to file (optional path)"
                        className="w-full bg-overlay border border-transparent px-3 py-2 text-xs text-[--text-color] outline-none focus:border-accent"
                    />
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 bg-overlay hover:bg-[--border-color] text-[--text-muted] text-sm transition">Cancel</button>
                    <button
                        onClick={() => { if (title.trim()) onSave({ id: task?.id, title: title.trim(), description, status, priority, linkedFile: linkedFile || undefined }); }}
                        disabled={!title.trim()}
                        className="flex-1 py-2 bg-accent hover:opacity-90 disabled:opacity-50 text-[--bg-base] text-sm font-medium transition"
                    >
                        {task ? 'Save' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// === MAIN IDEA BOARD ===
export default function IdeaBoard({ windowId, appId = 'ideaboard', id }: { windowId?: string; appId?: string; id?: string }) {
    const { currentProject } = useProjects();
    const { addToast } = useNotifications();
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === (id || windowId);
    const storageKey = currentProject ? `${STORAGE_PREFIX}${currentProject.id}` : null;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    const [showDialog, setShowDialog] = useState(false);

    // Load tasks from localStorage
    useEffect(() => {
        if (!storageKey) return;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) setTasks(JSON.parse(stored));
        } catch { /* ignore */ }
    }, [storageKey]);

    // Save tasks to localStorage
    useEffect(() => {
        if (!storageKey) return;
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    }, [tasks, storageKey]);

    const addOrUpdateTask = useCallback((data: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
        if (data.id) {
            setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...data } as Task : t));
            addToast('Task updated', 'success');
        } else {
            const newTask: Task = {
                ...data,
                id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                createdAt: Date.now(),
            };
            setTasks(prev => [...prev, newTask]);
            addToast(`Added task "${data.title}"`, 'success');
        }
        setShowDialog(false);
        setEditingTask(undefined);
    }, [addToast]);

    const deleteTask = useCallback((deleteId: string) => {
        setTasks(prev => prev.filter(t => t.id !== deleteId));
        addToast('Task deleted', 'success');
    }, [addToast]);

    const moveTask = useCallback((moveId: string, newStatus: Task['status']) => {
        setTasks(prev => prev.map(t => t.id === moveId ? { ...t, status: newStatus } : t));
    }, []);

    const boardMenus = useMemo(() => ({
        File: [
            { title: "New Task", actionId: "new-task", shortcut: "⌘N" },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'new-task': () => { setEditingTask(undefined); setShowDialog(true); },
    }), []);

    useMenuRegistration(boardMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id || windowId);

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-full bg-[--bg-base] text-[--text-color] font-mono">
                <div className="text-center space-y-2">
                    <IoCheckmarkCircle size={32} className="mx-auto text-[--text-muted] opacity-50" />
                    <div className="text-sm text-[--text-muted]">Open a project to use the Idea Board</div>
                </div>
            </div>
        );
    }

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    return (
        <div className="flex flex-col h-full bg-[--bg-base] text-[--text-color] overflow-hidden font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[--border-color] shrink-0">
                <div>
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <IoCheckmarkCircle size={16} className="text-accent" />
                        Idea Board — {currentProject.name}
                    </h2>
                    {totalTasks > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-overlay overflow-hidden">
                                <div className="h-full bg-pastel-green transition-all" style={{ width: `${(doneTasks / totalTasks) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-[--text-muted]">{doneTasks}/{totalTasks} done</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => { setEditingTask(undefined); setShowDialog(true); }}
                    className="px-3 py-1.5 bg-accent text-[--bg-base] text-xs font-medium flex items-center gap-1 transition hover:opacity-90"
                >
                    <IoAddOutline size={12} /> Add Task
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 flex overflow-x-auto p-4 gap-3">
                {columns.map(col => {
                    const colTasks = tasks.filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className="flex-1 min-w-[220px] flex flex-col">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2" style={{ backgroundColor: col.color }} />
                                    <span className="text-xs font-medium text-[--text-muted]">{col.label}</span>
                                    <span className="text-[10px] text-[--text-muted] bg-overlay px-1.5">{colTasks.length}</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto">
                                {colTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEdit={(t) => { setEditingTask(t); setShowDialog(true); }}
                                        onDelete={deleteTask}
                                        onMove={moveTask}
                                    />
                                ))}
                                {colTasks.length === 0 && (
                                    <div className="border border-dashed border-[--border-color] p-4 text-center text-[11px] text-[--text-muted] opacity-60">
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Task Dialog */}
            {showDialog && (
                <TaskDialog
                    task={editingTask}
                    onSave={addOrUpdateTask}
                    onClose={() => { setShowDialog(false); setEditingTask(undefined); }}
                />
            )}
        </div>
    );
}
