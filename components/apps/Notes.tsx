'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useAppPreferences } from '../AppPreferencesContext';
import { IoAdd, IoTrashOutline, IoSearchOutline, IoPin, IoListOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenuAction } from '../hooks/useMenuAction';

const NOTE_COLORS = [
    { id: 'default', label: 'Default', bg: 'transparent', dot: 'bg-[--text-muted]' },
    { id: 'yellow', label: 'Yellow', bg: 'rgba(238,212,159,0.15)', dot: 'bg-[#eed49f]' },
    { id: 'green', label: 'Green', bg: 'rgba(166,218,149,0.15)', dot: 'bg-[#a6da95]' },
    { id: 'blue', label: 'Blue', bg: 'rgba(138,173,244,0.15)', dot: 'bg-[#8aadf4]' },
    { id: 'pink', label: 'Pink', bg: 'rgba(245,189,230,0.15)', dot: 'bg-[#f5bde6]' },
    { id: 'red', label: 'Red', bg: 'rgba(237,135,150,0.15)', dot: 'bg-[#ed8796]' },
];

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    pinned?: boolean;
    color?: string;
}

function getInnerText(html: string): string {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.innerText || '';
}

function FormatToolbar({ onExecCommand, contentRef }: { onExecCommand: (cmd: string, value?: string) => void, contentRef: React.RefObject<HTMLDivElement | null> }) {
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

    const checkFormats = useCallback(() => {
        const formats = new Set<string>();
        try {
            if (document.queryCommandState('bold')) formats.add('bold');
            if (document.queryCommandState('italic')) formats.add('italic');
            if (document.queryCommandState('underline')) formats.add('underline');
            if (document.queryCommandState('insertUnorderedList')) formats.add('list');
            const block = document.queryCommandValue('formatBlock');
            if (block === 'h2') formats.add('heading');
        } catch (_) {}
        setActiveFormats(formats);
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', checkFormats);
        return () => document.removeEventListener('selectionchange', checkFormats);
    }, [checkFormats]);

    const btnClass = (key: string) =>
        `p-1 text-[11px] font-semibold transition-colors hover:bg-overlay ${activeFormats.has(key) ? 'text-accent' : 'text-[--text-muted]'}`;

    return (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[--border-color] bg-transparent select-none shrink-0">
            <button onClick={() => onExecCommand('bold')} className={btnClass('bold')} title="Bold">
                <span className="font-bold">B</span>
            </button>
            <button onClick={() => onExecCommand('italic')} className={btnClass('italic')} title="Italic">
                <span className="italic">I</span>
            </button>
            <button onClick={() => onExecCommand('underline')} className={btnClass('underline')} title="Underline">
                <span className="underline">U</span>
            </button>
            <div className="w-[1px] h-3 bg-[--border-color] mx-1" />
            <button
                onClick={() => {
                    const block = document.queryCommandValue('formatBlock');
                    if (block === 'h2') {
                        onExecCommand('formatBlock', 'p');
                    } else {
                        onExecCommand('formatBlock', 'h2');
                    }
                }}
                className={btnClass('heading')}
                title="Heading"
            >
                H
            </button>
            <button onClick={() => onExecCommand('insertUnorderedList')} className={btnClass('list')} title="Bullet List">
                <IoListOutline size={13} />
            </button>
        </div>
    );
}

export default function Notes({ isFocused = true, appId = 'notes', windowId }: { isFocused?: boolean, appId?: string, windowId?: string }) {
    const { ismobile } = useDevice();
    const { activewindow } = useWindows();
    const { getPreference, setPreference } = useAppPreferences();

    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);

    const contentRef = useRef<HTMLDivElement>(null);
    const mobileContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = getPreference('notes', 'notes', []);
        setNotes(saved);
        if (saved.length > 0) {
            setSelectedNote(prev => prev || saved[0]);
        }
    }, [getPreference]);

    const saveNotes = (newNotes: Note[]) => {
        setNotes(newNotes);
        setPreference('notes', 'notes', newNotes);
    };

    const createNote = () => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title: 'New Note',
            content: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
            color: 'default',
        };
        const newNotes = [newNote, ...notes];
        saveNotes(newNotes);
        setSelectedNote(newNote);
    };

    const togglePin = (id: string) => {
        updateNote(id, { pinned: !notes.find(n => n.id === id)?.pinned });
    };

    const setNoteColor = (id: string, color: string) => {
        updateNote(id, { color });
    };

    const updateNote = (id: string, updates: Partial<Note>) => {
        const newNotes = notes.map(n =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        );
        saveNotes(newNotes);
        if (selectedNote?.id === id) {
            setSelectedNote({ ...selectedNote, ...updates, updatedAt: Date.now() });
        }
    };

    const deleteNote = (id: string) => {
        const newNotes = notes.filter(n => n.id !== id);
        saveNotes(newNotes);
        if (selectedNote?.id === id) {
            setSelectedNote(newNotes[0] || null);
        }
    };

    // Sync contentEditable div when selected note changes (desktop)
    useEffect(() => {
        if (contentRef.current && selectedNote) {
            if (contentRef.current.innerHTML !== selectedNote.content) {
                contentRef.current.innerHTML = selectedNote.content;
            }
        } else if (contentRef.current && !selectedNote) {
            contentRef.current.innerHTML = '';
        }
    }, [selectedNote?.id]);

    // Sync contentEditable div when selected note changes (mobile)
    useEffect(() => {
        if (mobileContentRef.current && selectedNote) {
            if (mobileContentRef.current.innerHTML !== selectedNote.content) {
                mobileContentRef.current.innerHTML = selectedNote.content;
            }
        } else if (mobileContentRef.current && !selectedNote) {
            mobileContentRef.current.innerHTML = '';
        }
    }, [selectedNote?.id]);

    const handleContentInput = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current && selectedNote) {
            const html = ref.current.innerHTML;
            updateNote(selectedNote.id, { content: html });
        }
    }, [selectedNote?.id, notes]);

    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        // Update content after command
        const ref = ismobile ? mobileContentRef : contentRef;
        if (ref.current && selectedNote) {
            const html = ref.current.innerHTML;
            updateNote(selectedNote.id, { content: html });
        }
        if (ref.current) ref.current.focus();
    }, [selectedNote?.id, ismobile, notes]);

    useEffect(() => {
        if (!windowId || !ismobile) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (selectedNote && !showSidebar) { e.preventDefault(); setShowSidebar(true); setSelectedNote(null); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, ismobile, activewindow, selectedNote, showSidebar]);

    const menuActions = useMemo(() => ({
        'new-note': () => {
            const newNote: Note = {
                id: `note-${Date.now()}`,
                title: 'New Note',
                content: '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            setNotes(prev => {
                const newNotes = [newNote, ...prev];
                setPreference('notes', 'notes', newNotes);
                return newNotes;
            });
            setSelectedNote(newNote);
        },
        'delete-note': () => {
            if (!selectedNote) return;
            setNotes(prev => {
                const newNotes = prev.filter(n => n.id !== selectedNote.id);
                setPreference('notes', 'notes', newNotes);
                setSelectedNote(newNotes[0] || null);
                return newNotes;
            });
        }
    }), [selectedNote, setPreference]);

    useMenuAction('notes', menuActions, windowId);

    const filteredNotes = notes
        .filter(n =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getInnerText(n.content).toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.updatedAt - a.updatedAt;
        });

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0].contentRect.width < 500) {
                setShowSidebar(false);
            } else {
                setShowSidebar(true);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const getPreviewText = (content: string) => {
        return getInnerText(content);
    };

    if (ismobile) {
        return (
            <div className="flex flex-col h-full w-full bg-[--bg-base] text-[--text-color] font-mono">
                <AnimatePresence mode="wait">
                    {!selectedNote ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            <div className="p-4 pb-2">
                                <h1 className="text-3xl font-bold mb-3">Notes</h1>
                                <div className="flex items-center gap-2 bg-overlay border border-[--border-color] px-3 py-2">
                                    <IoSearchOutline className="text-[--text-muted]" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-[13px] text-[--text-color]"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto px-4">
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setSelectedNote(note)}
                                        className="bg-surface p-4 mb-2 active:scale-[0.98] transition-transform"
                                    >
                                        <div className="font-semibold truncate">{note.title || 'Untitled'}</div>
                                        <div className="text-xs text-[--text-muted] mt-1 flex items-center gap-2">
                                            <span>{formatDate(note.updatedAt)}</span>
                                            <span className="truncate">{getPreviewText(note.content).slice(0, 50) || 'No content'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-[--border-color]">
                                <button
                                    onClick={createNote}
                                    className="w-full py-3 bg-accent text-[--bg-base] font-medium flex items-center justify-center gap-2"
                                >
                                    <IoAdd size={20} />
                                    New Note
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="flex flex-col h-full"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-[--border-color]">
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="text-accent font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => deleteNote(selectedNote.id)}
                                    className="text-pastel-red"
                                >
                                    <IoTrashOutline size={20} />
                                </button>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="px-4 pt-4 pb-2">
                                    <input
                                        type="text"
                                        value={selectedNote.title}
                                        onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                                        placeholder="Title"
                                        className="text-2xl font-bold bg-transparent outline-none w-full"
                                    />
                                </div>
                                <FormatToolbar onExecCommand={execCommand} contentRef={mobileContentRef} />
                                <div className="flex-1 overflow-y-auto px-4 py-2">
                                    <div
                                        ref={mobileContentRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={() => handleContentInput(mobileContentRef)}
                                        className="outline-none text-base leading-relaxed min-h-[300px] w-full rich-text-editor"
                                        data-placeholder="Start typing..."
                                        style={{ minHeight: '300px' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex h-full w-full bg-[--bg-base] text-[--text-color] font-mono overflow-hidden">
            <AnimatePresence mode="popLayout">
                {showSidebar && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-r border-[--border-color] flex flex-col bg-surface shrink-0 overflow-hidden anime-gradient-top"
                    >
                        <div className="w-64 flex flex-col h-full">
                            <div className="h-[52px] border-b border-[--border-color] flex items-center gap-2 draggable-region px-3 pt-1">
                                <div className="flex-1 flex items-center gap-2 bg-overlay border border-[--border-color] px-2 py-1 transition-colors anime-focus">
                                    <IoSearchOutline className="text-[--text-muted]" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-xs w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto bg-transparent">
                                {filteredNotes.map(note => {
                                    const noteColor = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                                    return (
                                        <div
                                            key={note.id}
                                            onClick={() => setSelectedNote(note)}
                                            className={`mx-2 my-1 px-3 py-2.5 cursor-pointer transition-all ${selectedNote?.id === note.id
                                                ? 'bg-accent text-[--bg-base]'
                                                : 'hover:bg-overlay'
                                                }`}
                                            style={selectedNote?.id !== note.id && note.color && note.color !== 'default' ? { background: noteColor.bg } : {}}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {note.pinned && <IoPin size={11} className="shrink-0 opacity-60" />}
                                                {note.color && note.color !== 'default' && <span className={`w-2 h-2 rounded-full shrink-0 ${noteColor.dot}`} />}
                                                <span className="font-semibold text-[13px] truncate">{note.title || 'New Note'}</span>
                                            </div>
                                            <div className={`text-xs mt-0.5 flex gap-2 ${selectedNote?.id === note.id ? 'text-[--bg-base]/80' : 'text-[--text-muted]'}`}>
                                                <span className="shrink-0">{formatDate(note.updatedAt)}</span>
                                                <span className="truncate opacity-80">{getPreviewText(note.content).slice(0, 30) || 'No additional text'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredNotes.length === 0 && (
                                    <div className="p-4 text-center text-[--text-muted] text-xs">
                                        {notes.length === 0 ? 'No notes' : 'No results'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 bg-[--bg-base]">
                {selectedNote ? (
                    <>
                        <div className="h-[52px] flex items-center justify-between px-6 bg-transparent draggable-region shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className="text-[--text-muted] hover:text-[--text-color] transition-colors p-1 hover:bg-overlay"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M9 3V21" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                                <span className="text-xs text-[--text-muted] font-medium">
                                    {new Date(selectedNote.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5 mr-1">
                                    {NOTE_COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setNoteColor(selectedNote.id, c.id)}
                                            className={`w-4 h-4 rounded-full ${c.dot} ${selectedNote.color === c.id || (!selectedNote.color && c.id === 'default') ? 'ring-1 ring-accent ring-offset-1 ring-offset-[--bg-base]' : ''} hover:opacity-80 transition-all`}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => togglePin(selectedNote.id)}
                                    className={`p-1.5 transition-colors hover:bg-overlay ${selectedNote.pinned ? 'text-accent' : 'text-[--text-muted] hover:text-accent'}`}
                                    title={selectedNote.pinned ? 'Unpin' : 'Pin'}
                                >
                                    <IoPin size={16} />
                                </button>
                                <button
                                    onClick={createNote}
                                    className="p-1.5 text-[--text-muted] hover:text-accent transition-colors hover:bg-overlay"
                                    title="New Note"
                                >
                                    <IoAdd size={20} />
                                </button>
                                <button
                                    onClick={() => deleteNote(selectedNote.id)}
                                    className="p-1.5 text-[--text-muted] hover:text-pastel-red transition-colors hover:bg-overlay"
                                    title="Delete Note"
                                >
                                    <IoTrashOutline size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto px-8 pt-8 pb-4 flex flex-col gap-4">
                                <input
                                    type="text"
                                    value={selectedNote.title}
                                    onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                                    placeholder="Title"
                                    className="text-3xl font-bold bg-transparent outline-none w-full placeholder-[--text-muted] text-[--text-color]"
                                />
                            </div>
                            <div className="max-w-3xl mx-auto px-8">
                                <FormatToolbar onExecCommand={execCommand} contentRef={contentRef} />
                            </div>
                            <div className="max-w-3xl mx-auto px-8 pb-8">
                                <div
                                    ref={contentRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={() => handleContentInput(contentRef)}
                                    className="outline-none text-[13px] leading-relaxed w-full min-h-[500px] py-4 rich-text-editor text-[--text-color]"
                                    data-placeholder="Start typing..."
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[--text-muted]">
                        <div className="w-full h-10 border-b border-[--border-color] flex items-center px-4 bg-surface draggable-region">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="text-[--text-muted] hover:text-[--text-color] transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M9 3V21" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="text-lg mb-4 opacity-50">No Note Selected</div>
                            <button
                                onClick={createNote}
                                className="px-4 py-2 bg-accent text-[--bg-base] text-[13px] font-medium hover:bg-accent/90 transition"
                            >
                                Create New Note
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
