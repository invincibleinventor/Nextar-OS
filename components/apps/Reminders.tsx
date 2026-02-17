'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    IoCheckmarkCircle, IoEllipseOutline, IoFlagOutline, IoFlag,
    IoAddOutline, IoCalendarOutline, IoListOutline, IoTodayOutline,
    IoTrashOutline, IoChevronDown, IoChevronForward, IoStarOutline,
    IoStar, IoClose,
} from 'react-icons/io5';
import { useWindows } from '../WindowContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';

interface Reminder {
    id: string;
    title: string;
    notes: string;
    dueDate: string;
    priority: 'none' | 'low' | 'medium' | 'high';
    flagged: boolean;
    listId: string;
    completed: boolean;
    createdAt: number;
}

interface ReminderList {
    id: string;
    name: string;
    color: string;
}

const STORAGE_KEY = 'nextaros-reminders';
const COLORS = ['#8aadf4', '#a6da95', '#f5a97f', '#ed8796', '#8bd5ca', '#c6a0f6', '#f5bde6', '#eed49f'];
const PRIORITY_COLORS: Record<string, string> = { none: '', low: '#8aadf4', medium: '#eed49f', high: '#ed8796' };

function loadData(): { reminders: Reminder[]; lists: ReminderList[] } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { reminders: [], lists: [] };
}

function saveData(reminders: Reminder[], lists: ReminderList[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reminders, lists }));
}

function isToday(dateStr: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr), now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isOverdue(dateStr: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr); d.setHours(23, 59, 59);
    return d < new Date();
}

export default function Reminders({ appId = 'reminders', id }: { appId?: string; id?: string }) {
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;

    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [lists, setLists] = useState<ReminderList[]>([]);
    const [selectedView, setSelectedView] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [showNewList, setShowNewList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListColor, setNewListColor] = useState(COLORS[0]);

    useEffect(() => {
        const data = loadData();
        setReminders(data.reminders);
        setLists(data.lists);
    }, []);

    useEffect(() => {
        if (reminders.length || lists.length) saveData(reminders, lists);
    }, [reminders, lists]);

    const persist = useCallback((r: Reminder[], l: ReminderList[]) => {
        setReminders(r); setLists(l); saveData(r, l);
    }, []);

    const addReminder = useCallback(() => {
        if (!newTitle.trim()) return;
        const listId = !['all', 'today', 'flagged', 'completed'].includes(selectedView) ? selectedView : '';
        const r: Reminder = {
            id: Date.now().toString(36), title: newTitle.trim(), notes: '', dueDate: '',
            priority: 'none', flagged: false, listId, completed: false, createdAt: Date.now(),
        };
        setReminders(prev => [...prev, r]);
        setNewTitle('');
    }, [newTitle, selectedView]);

    const updateReminder = useCallback((rid: string, patch: Partial<Reminder>) => {
        setReminders(prev => prev.map(r => r.id === rid ? { ...r, ...patch } : r));
    }, []);

    const deleteReminder = useCallback((rid: string) => {
        setReminders(prev => prev.filter(r => r.id !== rid));
        if (selectedId === rid) setSelectedId(null);
    }, [selectedId]);

    const addList = useCallback(() => {
        if (!newListName.trim()) return;
        setLists(prev => [...prev, { id: Date.now().toString(36), name: newListName.trim(), color: newListColor }]);
        setNewListName(''); setShowNewList(false);
    }, [newListName, newListColor]);

    const deleteList = useCallback((lid: string) => {
        setLists(prev => prev.filter(l => l.id !== lid));
        setReminders(prev => prev.map(r => r.listId === lid ? { ...r, listId: '' } : r));
        if (selectedView === lid) setSelectedView('all');
    }, [selectedView]);

    const filtered = useMemo(() => {
        switch (selectedView) {
            case 'all': return reminders.filter(r => !r.completed);
            case 'today': return reminders.filter(r => !r.completed && (isToday(r.dueDate) || isOverdue(r.dueDate)));
            case 'flagged': return reminders.filter(r => !r.completed && r.flagged);
            case 'completed': return reminders.filter(r => r.completed);
            default: return reminders.filter(r => !r.completed && r.listId === selectedView);
        }
    }, [reminders, selectedView]);

    const counts = useMemo(() => {
        const c: Record<string, number> = {
            all: reminders.filter(r => !r.completed).length,
            today: reminders.filter(r => !r.completed && (isToday(r.dueDate) || isOverdue(r.dueDate))).length,
            flagged: reminders.filter(r => !r.completed && r.flagged).length,
            completed: reminders.filter(r => r.completed).length,
        };
        lists.forEach(l => { c[l.id] = reminders.filter(r => !r.completed && r.listId === l.id).length; });
        return c;
    }, [reminders, lists]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && newTitle.trim()) { e.preventDefault(); addReminder(); }
        if (e.key === 'Delete' && selectedId) { deleteReminder(selectedId); }
        if (e.key === ' ' && selectedId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
            e.preventDefault();
            updateReminder(selectedId, { completed: !reminders.find(r => r.id === selectedId)?.completed });
        }
    }, [newTitle, selectedId, addReminder, deleteReminder, updateReminder, reminders]);

    const reminderMenus = useMemo(() => ({
        File: [
            { title: 'New Reminder', actionId: 'new-reminder', shortcut: '⌘N' },
            { title: 'New List', actionId: 'new-list', shortcut: '⇧⌘N' },
        ],
        Edit: [
            { title: 'Delete Reminder', actionId: 'delete-reminder', shortcut: '⌫' },
            { separator: true },
            { title: 'Mark Completed', actionId: 'toggle-complete', shortcut: '⌘⏎' },
            { title: 'Toggle Flag', actionId: 'toggle-flag', shortcut: '⇧⌘F' },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'new-reminder': () => document.getElementById('reminder-input')?.focus(),
        'new-list': () => setShowNewList(true),
        'delete-reminder': () => { if (selectedId) deleteReminder(selectedId); },
        'toggle-complete': () => { if (selectedId) updateReminder(selectedId, { completed: !reminders.find(r => r.id === selectedId)?.completed }); },
        'toggle-flag': () => { if (selectedId) updateReminder(selectedId, { flagged: !reminders.find(r => r.id === selectedId)?.flagged }); },
    }), [selectedId, deleteReminder, updateReminder, reminders]);

    useMenuRegistration(reminderMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id);

    const smartLists: { id: string; name: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }[] = [
        { id: 'all', name: 'All', icon: IoListOutline, color: '#8aadf4' },
        { id: 'today', name: 'Today', icon: IoTodayOutline, color: '#a6da95' },
        { id: 'flagged', name: 'Flagged', icon: IoFlag, color: '#f5a97f' },
        { id: 'completed', name: 'Completed', icon: IoCheckmarkCircle, color: '#8bd5ca' },
    ];

    const selected = reminders.find(r => r.id === selectedId);

    const viewTitle = smartLists.find(s => s.id === selectedView)?.name || lists.find(l => l.id === selectedView)?.name || 'Reminders';

    return (
        <div className="flex h-full bg-[--bg-base] text-[--text-color] font-mono text-xs overflow-hidden" tabIndex={0} onKeyDown={handleKeyDown}>
            {/* Sidebar */}
            <div className="w-[200px] shrink-0 border-r border-[--border-color] bg-surface flex flex-col overflow-hidden anime-gradient-top">
                <div className="p-3 space-y-0.5 flex-1 overflow-y-auto">
                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Smart Lists</div>
                    {smartLists.map(sl => {
                        const active = selectedView === sl.id;
                        const Icon = sl.icon;
                        return (
                            <div key={sl.id} onClick={() => setSelectedView(sl.id)}
                                className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer mx-1 transition-colors ${
                                    active ? 'bg-accent text-[--bg-base]' : 'text-[--text-color] hover:bg-overlay'
                                }`}>
                                <div className="w-5 h-5 flex items-center justify-center text-[--bg-base] shrink-0" style={{ backgroundColor: active ? 'transparent' : sl.color }}>
                                    <Icon size={12} className={active ? 'text-[--bg-base]' : ''} />
                                </div>
                                <span className="text-[13px] leading-none">{sl.name}</span>
                                {counts[sl.id] > 0 && <span className="ml-auto text-[11px] opacity-70">{counts[sl.id]}</span>}
                            </div>
                        );
                    })}
                    {lists.length > 0 && (
                        <>
                            <div className="border-t border-[--border-color] my-2" />
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">My Lists</div>
                        </>
                    )}
                    {lists.map(l => {
                        const active = selectedView === l.id;
                        return (
                            <div key={l.id} className="group flex items-center">
                                <div onClick={() => setSelectedView(l.id)}
                                    className={`flex-1 flex items-center gap-2.5 px-3 py-1.5 cursor-pointer mx-1 transition-colors ${
                                        active ? 'bg-accent text-[--bg-base]' : 'text-[--text-color] hover:bg-overlay'
                                    }`}>
                                    <div className="w-5 h-5 flex items-center justify-center text-[--bg-base] shrink-0" style={{ backgroundColor: active ? 'transparent' : l.color }}>
                                        <IoListOutline size={12} className={active ? 'text-[--bg-base]' : ''} />
                                    </div>
                                    <span className="text-[13px] leading-none flex-1 truncate">{l.name}</span>
                                    {counts[l.id] > 0 && <span className="ml-auto text-[11px] opacity-70">{counts[l.id]}</span>}
                                </div>
                                <button onClick={() => deleteList(l.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[--text-muted] hover:text-pastel-red transition-opacity"><IoClose size={12} /></button>
                            </div>
                        );
                    })}
                </div>
                <div className="p-2 border-t border-[--border-color]">
                    {showNewList ? (
                        <div className="space-y-1.5">
                            <input value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') setShowNewList(false); }}
                                placeholder="List name" autoFocus className="w-full bg-overlay border border-[--border-color] px-2 py-1 text-xs outline-none" />
                            <div className="flex gap-1 flex-wrap">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setNewListColor(c)}
                                        className={`w-4 h-4 rounded-full border-2 transition-transform ${newListColor === c ? 'border-white scale-125' : 'border-transparent'}`} style={{ background: c }} />
                                ))}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={addList} className="flex-1 bg-pastel-blue/20 text-pastel-blue px-2 py-0.5 text-[10px] hover:bg-pastel-blue/30">Add</button>
                                <button onClick={() => setShowNewList(false)} className="flex-1 bg-overlay px-2 py-0.5 text-[10px] hover:bg-overlay/80 text-[--text-muted]">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowNewList(true)} className="w-full flex items-center gap-1.5 px-2 py-1 text-[--text-muted] hover:text-[--text-color] hover:bg-overlay transition-colors">
                            <IoAddOutline size={14} /> <span>Add List</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-[50px] flex items-center justify-between px-4 border-b border-[--border-color] bg-surface shrink-0">
                    <div>
                        <span className="text-[13px] font-semibold">{viewTitle}</span>
                        <span className="text-[11px] text-[--text-muted] ml-2">{filtered.length} reminder{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-1">
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[--text-muted] gap-2">
                            <IoListOutline size={28} className="opacity-30" />
                            <span className="text-[11px]">No reminders</span>
                        </div>
                    )}
                    {filtered.map(r => {
                        const expanded = selectedId === r.id;
                        const overdue = isOverdue(r.dueDate) && !r.completed;
                        return (
                            <div key={r.id} className={`mx-1 my-0.5 border transition-colors cursor-pointer ${expanded ? 'border-[--border-color] bg-overlay' : 'border-transparent hover:bg-overlay/40'}`}
                                onClick={() => setSelectedId(expanded ? null : r.id)}>
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <button onClick={e => { e.stopPropagation(); updateReminder(r.id, { completed: !r.completed }); }}
                                        className={`shrink-0 transition-colors ${r.completed ? 'text-pastel-green' : 'text-[--text-muted] hover:text-pastel-green'}`}>
                                        {r.completed ? <IoCheckmarkCircle size={18} /> : <IoEllipseOutline size={18} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <span className={`block truncate ${r.completed ? 'line-through text-[--text-muted]' : ''}`}>{r.title}</span>
                                        {r.dueDate && <span className={`text-[10px] ${overdue ? 'text-pastel-red' : 'text-[--text-muted]'}`}>
                                            <IoCalendarOutline size={10} className="inline mr-0.5 -mt-px" />{new Date(r.dueDate).toLocaleDateString()}
                                        </span>}
                                    </div>
                                    {r.priority !== 'none' && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[r.priority] }} />}
                                    <button onClick={e => { e.stopPropagation(); updateReminder(r.id, { flagged: !r.flagged }); }}
                                        className={`shrink-0 transition-colors ${r.flagged ? 'text-pastel-peach' : 'text-[--text-muted] opacity-0 group-hover:opacity-100 hover:text-pastel-peach'}`}>
                                        {r.flagged ? <IoFlag size={14} /> : <IoFlagOutline size={14} />}
                                    </button>
                                </div>
                                {expanded && (
                                    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[--border-color]" onClick={e => e.stopPropagation()}>
                                        <input value={r.title} onChange={e => updateReminder(r.id, { title: e.target.value })}
                                            className="w-full bg-transparent border-b border-[--border-color] pb-1 text-xs outline-none font-medium" />
                                        <textarea value={r.notes} onChange={e => updateReminder(r.id, { notes: e.target.value })} placeholder="Add notes..."
                                            className="w-full bg-overlay border border-[--border-color] px-2 py-1 text-[11px] outline-none resize-none h-14" />
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <label className="flex items-center gap-1 text-[10px] text-[--text-muted]">
                                                <IoCalendarOutline size={12} />
                                                <input type="date" value={r.dueDate} onChange={e => updateReminder(r.id, { dueDate: e.target.value })}
                                                    className="bg-overlay border border-[--border-color] px-1.5 py-0.5 text-[10px] outline-none text-[--text-color]" />
                                            </label>
                                            <label className="flex items-center gap-1 text-[10px] text-[--text-muted]">
                                                Priority
                                                <select value={r.priority} onChange={e => updateReminder(r.id, { priority: e.target.value as Reminder['priority'] })}
                                                    className="bg-overlay border border-[--border-color] px-1.5 py-0.5 text-[10px] outline-none text-[--text-color]">
                                                    <option value="none">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                                                </select>
                                            </label>
                                            {lists.length > 0 && (
                                                <label className="flex items-center gap-1 text-[10px] text-[--text-muted]">
                                                    List
                                                    <select value={r.listId} onChange={e => updateReminder(r.id, { listId: e.target.value })}
                                                        className="bg-overlay border border-[--border-color] px-1.5 py-0.5 text-[10px] outline-none text-[--text-color]">
                                                        <option value="">None</option>
                                                        {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </label>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={() => deleteReminder(r.id)} className="flex items-center gap-1 text-[10px] text-pastel-red hover:text-pastel-red/80 transition-colors">
                                                <IoTrashOutline size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add Reminder */}
                {selectedView !== 'completed' && (
                    <div className="px-3 py-2 border-t border-[--border-color] shrink-0">
                        <div className="flex items-center gap-2">
                            <IoAddOutline size={16} className="text-pastel-blue shrink-0" />
                            <input id="reminder-input" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { e.preventDefault(); e.stopPropagation(); addReminder(); } }}
                                placeholder="Add a reminder..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-[--text-muted]" />
                            {newTitle.trim() && (
                                <button onClick={addReminder} className="bg-pastel-blue/20 text-pastel-blue px-2 py-0.5 text-[10px] hover:bg-pastel-blue/30 transition-colors">Add</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
