'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    IoCheckmarkCircle, IoEllipseOutline, IoFlagOutline, IoFlag,
    IoAddOutline, IoCalendarOutline, IoListOutline, IoTodayOutline,
    IoTrashOutline, IoChevronDown, IoChevronForward, IoStarOutline,
    IoStar, IoClose,
} from 'react-icons/io5';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassSidebar, glassCard, glassInput, glassButton } from '../hooks/useClayStyles';
import { AnimatePresence, motion } from 'framer-motion';
import { LuPlus, LuTrash2, LuSquareCheck, LuFlag } from 'react-icons/lu';

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
    const clay = useIsClay();
    const { ismobile } = useDevice();
    const [mobileView, setMobileView] = useState<'sidebar' | 'list'>('sidebar');

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
            { title: 'New Reminder', actionId: 'new-reminder', shortcut: '⌘N', icon: <LuPlus size={14} /> },
            { title: 'New List', actionId: 'new-list', shortcut: '⇧⌘N', icon: <LuPlus size={14} /> },
        ],
        Edit: [
            { title: 'Delete Reminder', actionId: 'delete-reminder', shortcut: '⌫', icon: <LuTrash2 size={14} /> },
            { separator: true },
            { title: 'Mark Completed', actionId: 'toggle-complete', shortcut: '⌘⏎', icon: <LuSquareCheck size={14} /> },
            { title: 'Toggle Flag', actionId: 'toggle-flag', shortcut: '⇧⌘F', icon: <LuFlag size={14} /> },
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

    if (ismobile) {
        return (
            <div className={`flex flex-col h-full ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'} text-[--text-color] text-xs overflow-hidden`} tabIndex={0}>
                <AnimatePresence mode="wait" initial={false}>
                    {mobileView === 'sidebar' ? (
                        <motion.div key="sidebar" className="flex flex-col h-full"
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.15 }}>
                            {/* Header */}
                            <div className={`h-[48px] flex items-center px-4 shrink-0 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                <span className="text-[16px] font-semibold text-[--text-color]">Reminders</span>
                            </div>
                            {/* Smart lists + custom lists */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                                <div className={`uppercase font-bold text-[--text-muted] pl-3 mb-2 ${clay ? 'text-[11px] tracking-wide' : 'text-[11px]'}`}>Smart Lists</div>
                                {smartLists.map(sl => {
                                    const Icon = sl.icon;
                                    return (
                                        <div key={sl.id} onClick={() => { setSelectedView(sl.id); setMobileView('list'); }}
                                            className={`flex items-center gap-3 px-3 py-3 cursor-pointer mx-1 transition-all ${clay ? 'rounded-[14px] active:scale-[0.98] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                            <div className={`flex items-center justify-center shrink-0 ${clay ? 'w-8 h-8 rounded-[10px]' : 'w-7 h-7'}`}
                                                style={{ backgroundColor: sl.color }}>
                                                <Icon size={16} className="text-white" />
                                            </div>
                                            <span className={`flex-1 ${clay ? 'text-[15px] font-medium' : 'text-[14px]'} text-[--text-color]`}>{sl.name}</span>
                                            {counts[sl.id] > 0 && <span className="text-[13px] text-[--text-muted]">{counts[sl.id]}</span>}
                                            <IoChevronForward size={14} className="text-[--text-muted]" />
                                        </div>
                                    );
                                })}
                                {lists.length > 0 && (
                                    <>
                                        <div className={`my-3 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`} />
                                        <div className={`uppercase font-bold text-[--text-muted] pl-3 mb-2 ${clay ? 'text-[11px] tracking-wide' : 'text-[11px]'}`}>My Lists</div>
                                    </>
                                )}
                                {lists.map(l => (
                                    <div key={l.id} onClick={() => { setSelectedView(l.id); setMobileView('list'); }}
                                        className={`flex items-center gap-3 px-3 py-3 cursor-pointer mx-1 transition-all ${clay ? 'rounded-[14px] active:scale-[0.98] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                        <div className={`flex items-center justify-center shrink-0 ${clay ? 'w-8 h-8 rounded-[10px]' : 'w-7 h-7'}`}
                                            style={{ backgroundColor: l.color }}>
                                            <IoListOutline size={16} className="text-white" />
                                        </div>
                                        <span className={`flex-1 truncate ${clay ? 'text-[15px] font-medium' : 'text-[14px]'} text-[--text-color]`}>{l.name}</span>
                                        {counts[l.id] > 0 && <span className="text-[13px] text-[--text-muted]">{counts[l.id]}</span>}
                                        <IoChevronForward size={14} className="text-[--text-muted]" />
                                    </div>
                                ))}
                            </div>
                            {/* Add list button */}
                            <div className={`p-3 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                                <button onClick={() => setShowNewList(true)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-[--text-muted] transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}>
                                    <IoAddOutline size={16} /> <span className="text-[13px]">Add List</span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="list" className="flex flex-col h-full"
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.15 }}>
                            {/* Header with back */}
                            <div className={`h-[48px] flex items-center px-3 gap-2 shrink-0 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                <button onClick={() => setMobileView('sidebar')} className="text-accent text-[14px] flex items-center gap-0.5">
                                    <IoChevronDown size={16} className="rotate-90" /> Back
                                </button>
                                <span className="flex-1 text-center text-[15px] font-semibold text-[--text-color] -ml-8">{viewTitle}</span>
                            </div>
                            {/* Reminder list */}
                            <div className="flex-1 overflow-y-auto px-2 py-1">
                                {filtered.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted] gap-2">
                                        <IoListOutline size={40} className="text-[--text-muted]" style={{ opacity: 0.3 }} />
                                        <span className="text-[14px] font-medium text-[--text-color]">No Reminders</span>
                                    </div>
                                )}
                                {filtered.map(r => {
                                    const expanded = selectedId === r.id;
                                    const overdue = isOverdue(r.dueDate) && !r.completed;
                                    return (
                                        <div key={r.id}
                                            className={`mx-1 my-0.5 transition-all cursor-pointer ${clay ? 'rounded-[14px]' : ''} ${
                                                expanded ? (clay ? 'rounded-[16px] mb-1' : 'border border-[--border-color] bg-overlay')
                                                    : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay/40')
                                            }`}
                                            style={expanded && clay ? { ...glassCard, borderRadius: '16px' } : undefined}
                                            onClick={() => setSelectedId(expanded ? null : r.id)}>
                                            <div className="flex items-center gap-3 px-3 py-3">
                                                <button onClick={e => { e.stopPropagation(); updateReminder(r.id, { completed: !r.completed }); }}
                                                    className={`shrink-0 ${r.completed ? 'text-pastel-green' : 'text-[--text-muted]'}`}>
                                                    {r.completed ? <IoCheckmarkCircle size={22} /> : <IoEllipseOutline size={22} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`block text-[14px] ${r.completed ? 'line-through text-[--text-muted]' : 'text-[--text-color]'}`}>{r.title}</span>
                                                    {r.dueDate && <span className={`text-[11px] ${overdue ? 'text-pastel-red' : 'text-[--text-muted]'}`}>
                                                        <IoCalendarOutline size={11} className="inline mr-0.5 -mt-px" />{new Date(r.dueDate).toLocaleDateString()}
                                                    </span>}
                                                </div>
                                                {r.flagged && <IoFlag size={16} className="text-pastel-peach shrink-0" />}
                                            </div>
                                            {expanded && (
                                                <div className={`px-3 pb-3 pt-1 space-y-2 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`} onClick={e => e.stopPropagation()}>
                                                    <textarea value={r.notes} onChange={e => updateReminder(r.id, { notes: e.target.value })} placeholder="Add notes..."
                                                        className={`w-full px-3 py-2 text-[13px] outline-none resize-none h-16 text-[--text-color] placeholder:text-[--text-muted] ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color]'}`}
                                                        style={clay ? glassInput : undefined} />
                                                    <div className="flex justify-end">
                                                        <button onClick={() => deleteReminder(r.id)}
                                                            className="flex items-center gap-1 text-[12px] text-pastel-red px-2 py-1 rounded-[8px]">
                                                            <IoTrashOutline size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Add reminder */}
                            {selectedView !== 'completed' && (
                                <div className={`px-3 py-2.5 shrink-0 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                                    <div className={`flex items-center gap-2 ${clay ? 'px-3 py-2 rounded-[14px]' : ''}`}
                                        style={clay ? glassInput : undefined}>
                                        <IoAddOutline size={18} className="shrink-0" style={{ color: 'var(--accent-color)' }} />
                                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { e.preventDefault(); addReminder(); } }}
                                            placeholder="Add a reminder..." className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[--text-muted] text-[--text-color]"
                                            style={{ fontSize: '16px' }} />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={`flex h-full ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'} text-[--text-color] text-xs overflow-hidden`} tabIndex={0} onKeyDown={handleKeyDown}>
            {/* Sidebar */}
            <div className={`${clay ? 'w-[230px]' : 'w-[200px]'} shrink-0 flex flex-col overflow-hidden ${clay ? '' : 'border-r border-[--border-color] bg-surface anime-gradient-top'}`}
                style={clay ? glassSidebar : undefined}>
                <div className="p-3 space-y-0.5 flex-1 overflow-y-auto">
                    <div className={`uppercase font-bold text-[--text-muted] pl-3 mb-2 ${clay ? 'text-[11px] tracking-wide' : 'text-[11px] font-semibold'}`}>Smart Lists</div>
                    {smartLists.map(sl => {
                        const active = selectedView === sl.id;
                        const Icon = sl.icon;
                        return (
                            <div key={sl.id} onClick={() => setSelectedView(sl.id)}
                                className={`flex items-center gap-3 px-3 cursor-pointer mx-1 transition-all ${clay ? 'py-2.5 rounded-[12px] active:scale-[0.98]' : 'py-1.5 gap-2.5'} ${
                                    active
                                        ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]')
                                        : (clay ? 'text-[--text-color] hover:bg-[--bg-glass-hover]' : 'text-[--text-color] hover:bg-overlay')
                                }`}
                                style={active && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                <div className={`flex items-center justify-center shrink-0 ${clay ? 'w-6 h-6 rounded-[7px]' : 'w-5 h-5'}`}
                                    style={{ backgroundColor: active && clay ? 'rgba(255,255,255,0.25)' : active ? 'transparent' : sl.color }}>
                                    <Icon size={clay ? 14 : 12} className={active ? (clay ? 'text-white' : 'text-[--bg-base]') : 'text-white'} />
                                </div>
                                <span className={`leading-none ${clay ? 'text-[14px] font-medium' : 'text-[13px]'}`}>{sl.name}</span>
                                {counts[sl.id] > 0 && <span className={`ml-auto text-[11px] ${active && clay ? 'text-white/70' : 'text-[--text-muted]'}`}>{counts[sl.id]}</span>}
                            </div>
                        );
                    })}
                    {lists.length > 0 && (
                        <>
                            <div className={`my-2 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`} />
                            <div className={`uppercase font-bold text-[--text-muted] pl-3 mb-2 ${clay ? 'text-[11px] tracking-wide' : 'text-[11px] font-semibold'}`}>My Lists</div>
                        </>
                    )}
                    {lists.map(l => {
                        const active = selectedView === l.id;
                        return (
                            <div key={l.id} className="group flex items-center">
                                <div onClick={() => setSelectedView(l.id)}
                                    className={`flex-1 flex items-center gap-3 px-3 cursor-pointer mx-1 transition-all ${clay ? 'py-2.5 rounded-[12px] active:scale-[0.98]' : 'py-1.5 gap-2.5'} ${
                                        active
                                            ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]')
                                            : (clay ? 'text-[--text-color] hover:bg-[--bg-glass-hover]' : 'text-[--text-color] hover:bg-overlay')
                                    }`}
                                    style={active && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                >
                                    <div className={`flex items-center justify-center shrink-0 ${clay ? 'w-6 h-6 rounded-[7px]' : 'w-5 h-5'}`}
                                        style={{ backgroundColor: active && clay ? 'rgba(255,255,255,0.25)' : active ? 'transparent' : l.color }}>
                                        <IoListOutline size={clay ? 14 : 12} className={active ? (clay ? 'text-white' : 'text-[--bg-base]') : 'text-white'} />
                                    </div>
                                    <span className={`flex-1 truncate leading-none ${clay ? 'text-[14px] font-medium' : 'text-[13px]'}`}>{l.name}</span>
                                    {counts[l.id] > 0 && <span className={`ml-auto text-[11px] ${active && clay ? 'text-white/70' : 'text-[--text-muted]'}`}>{counts[l.id]}</span>}
                                </div>
                                <button onClick={() => deleteList(l.id)} className={`opacity-0 group-hover:opacity-100 p-1 text-[--text-muted] hover:text-pastel-red transition-opacity ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : ''}`}><IoClose size={12} /></button>
                            </div>
                        );
                    })}
                </div>
                <div className={`p-2 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                    {showNewList ? (
                        <div className="space-y-1.5 p-1">
                            <input value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') setShowNewList(false); }}
                                placeholder="List name" autoFocus
                                className={`w-full px-2.5 py-1.5 text-xs outline-none text-[--text-color] placeholder:text-[--text-muted] ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color]'}`}
                                style={clay ? glassInput : undefined} />
                            <div className="flex gap-1 flex-wrap">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setNewListColor(c)}
                                        className={`w-4 h-4 rounded-full border-2 transition-transform ${newListColor === c ? 'scale-125' : ''}`}
                                        style={{ background: c, borderColor: newListColor === c ? 'var(--text-color)' : 'transparent' }} />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={addList}
                                    className={`px-4 py-1.5 text-[11px] font-medium text-white transition-all ${clay ? 'rounded-[12px] active:scale-[0.97] hover:opacity-90' : ''}`}
                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}>
                                    Add
                                </button>
                                <button onClick={() => setShowNewList(false)}
                                    className={`px-4 py-1.5 text-[11px] text-[--text-muted] transition-colors ${clay ? 'rounded-[12px] active:scale-[0.97] hover:bg-[--bg-glass-hover]' : 'bg-overlay hover:opacity-80'}`}
                                    style={clay ? glassButton : undefined}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowNewList(true)}
                            className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[--text-muted] hover:text-[--text-color] transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}>
                            <IoAddOutline size={14} /> <span className={clay ? 'text-[13px]' : ''}>Add List</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 flex flex-col overflow-hidden ${clay ? 'bg-[--bg-base]' : ''}`}>
                <div className={`h-[50px] flex items-center justify-between px-4 shrink-0 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color] bg-surface'}`}>
                    <div>
                        <span className="text-[13px] font-semibold text-[--text-color]">{viewTitle}</span>
                        <span className="text-[11px] text-[--text-muted] ml-2">{filtered.length} reminder{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto px-2 py-1 ${clay ? 'px-3 py-2' : ''}`}>
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[--text-muted] gap-2">
                            <IoListOutline size={48} className={clay ? 'text-[--text-muted]' : ''} style={clay ? undefined : { opacity: 0.3 }} />
                            <span className="text-[13px] font-medium text-[--text-color]">No Reminders</span>
                            <span className="text-[12px] text-[--text-muted]">Add a reminder below to get started.</span>
                        </div>
                    )}
                    {filtered.map(r => {
                        const expanded = selectedId === r.id;
                        const overdue = isOverdue(r.dueDate) && !r.completed;
                        return (
                            <div key={r.id}
                                className={`mx-1 my-0.5 transition-all cursor-pointer ${clay ? 'rounded-[12px]' : ''} ${
                                    expanded
                                        ? (clay ? 'rounded-[16px] mb-1' : 'border border-[--border-color] bg-overlay')
                                        : (clay ? 'hover:bg-[--bg-glass-hover]' : 'border border-transparent hover:bg-overlay/40')
                                }`}
                                style={expanded && clay ? { ...glassCard, borderRadius: '16px' } : undefined}
                                onClick={() => setSelectedId(expanded ? null : r.id)}>
                                <div className={`flex items-center gap-2 px-3 ${clay ? 'py-2.5' : 'py-2'}`}>
                                    <button onClick={e => { e.stopPropagation(); updateReminder(r.id, { completed: !r.completed }); }}
                                        className={`shrink-0 transition-colors ${clay ? 'active:scale-[0.97]' : ''} ${r.completed ? 'text-pastel-green' : 'text-[--text-muted] hover:text-pastel-green'}`}>
                                        {r.completed ? <IoCheckmarkCircle size={18} /> : <IoEllipseOutline size={18} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <span className={`block truncate text-[13px] ${r.completed ? 'line-through text-[--text-muted]' : 'text-[--text-color]'}`}>{r.title}</span>
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
                                    <div className={`px-3 pb-3 pt-1 space-y-2 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`} onClick={e => e.stopPropagation()}>
                                        <input value={r.title} onChange={e => updateReminder(r.id, { title: e.target.value })}
                                            className={`w-full bg-transparent pb-1 text-xs outline-none font-medium text-[--text-color] ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`} />
                                        <textarea value={r.notes} onChange={e => updateReminder(r.id, { notes: e.target.value })} placeholder="Add notes..."
                                            className={`w-full px-2.5 py-1.5 text-[11px] outline-none resize-none h-14 text-[--text-color] placeholder:text-[--text-muted] ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color]'}`}
                                            style={clay ? glassInput : undefined} />
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <label className="flex items-center gap-1 text-[10px] text-[--text-muted]">
                                                <IoCalendarOutline size={12} />
                                                <input type="date" value={r.dueDate} onChange={e => updateReminder(r.id, { dueDate: e.target.value })}
                                                    className={`px-1.5 py-0.5 text-[10px] outline-none text-[--text-color] ${clay ? 'rounded-[8px]' : 'bg-overlay border border-[--border-color]'}`}
                                                    style={clay ? glassInput : undefined} />
                                            </label>
                                            <label className="flex items-center gap-1 text-[10px] text-[--text-muted]">
                                                Priority
                                                <select value={r.priority} onChange={e => updateReminder(r.id, { priority: e.target.value as Reminder['priority'] })}
                                                    className={`px-1.5 py-0.5 text-[10px] outline-none text-[--text-color] ${clay ? 'rounded-[8px]' : 'bg-overlay border border-[--border-color]'}`}
                                                    style={clay ? glassInput : undefined}>
                                                    <option value="none">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                                                </select>
                                            </label>
                                            {lists.length > 0 && (
                                                <label className="flex items-center gap-1 text-[10px] text-[--text-muted]">
                                                    List
                                                    <select value={r.listId} onChange={e => updateReminder(r.id, { listId: e.target.value })}
                                                        className={`px-1.5 py-0.5 text-[10px] outline-none text-[--text-color] ${clay ? 'rounded-[8px]' : 'bg-overlay border border-[--border-color]'}`}
                                                        style={clay ? glassInput : undefined}>
                                                        <option value="">None</option>
                                                        {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </label>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={() => deleteReminder(r.id)}
                                                className={`flex items-center gap-1 text-[10px] text-pastel-red hover:opacity-80 transition-colors ${clay ? 'rounded-[8px] px-2 py-1 active:scale-[0.97] hover:bg-[--bg-glass-hover]' : ''}`}>
                                                <IoTrashOutline size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {selectedView !== 'completed' && (
                    <div className={`px-3 py-2 shrink-0 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                        <div className={`flex items-center gap-2 ${clay ? 'px-2 py-1.5 rounded-[12px]' : ''}`}
                            style={clay ? glassInput : undefined}>
                            <IoAddOutline size={16} className="shrink-0" style={{ color: 'var(--accent-color)' }} />
                            <input id="reminder-input" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { e.preventDefault(); e.stopPropagation(); addReminder(); } }}
                                placeholder="Add a reminder..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-[--text-muted] text-[--text-color]" />
                            {newTitle.trim() && (
                                <button onClick={addReminder}
                                    className={`px-3 py-1 text-[11px] font-medium text-white transition-all ${clay ? 'rounded-[12px] active:scale-[0.97] hover:opacity-90' : ''}`}
                                    style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}>
                                    Add
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
