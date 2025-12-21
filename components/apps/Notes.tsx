'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useDevice } from '../DeviceContext';
import { useAppPreferences } from '../AppPreferencesContext';
import { IoAdd, IoTrashOutline, IoSearchOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenuAction } from '../hooks/useMenuAction';

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

export default function Notes({ isFocused = true, appId = 'notes', windowId }: { isFocused?: boolean, appId?: string, windowId?: string }) {
    const { ismobile } = useDevice();
    const { getPreference, setPreference } = useAppPreferences();

    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);

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
            updatedAt: Date.now()
        };
        const newNotes = [newNote, ...notes];
        saveNotes(newNotes);
        setSelectedNote(newNote);
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

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    if (ismobile) {
        return (
            <div className="flex flex-col h-full w-full bg-[#f2f2f7] dark:bg-[#1c1c1e] text-black dark:text-white font-sf">
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
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-xl px-3 py-2">
                                    <IoSearchOutline className="text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto px-4">
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setSelectedNote(note)}
                                        className="bg-white dark:bg-[#2c2c2e] rounded-xl p-4 mb-2 active:scale-[0.98] transition-transform"
                                    >
                                        <div className="font-semibold truncate">{note.title || 'Untitled'}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <span>{formatDate(note.updatedAt)}</span>
                                            <span className="truncate">{note.content.slice(0, 50) || 'No content'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-black/5 dark:border-white/5">
                                <button
                                    onClick={createNote}
                                    className="w-full py-3 bg-accent text-white rounded-xl font-medium flex items-center justify-center gap-2"
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
                            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="text-accent font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => deleteNote(selectedNote.id)}
                                    className="text-red-500"
                                >
                                    <IoTrashOutline size={20} />
                                </button>
                            </div>
                            <div className="flex-1 p-4 flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={selectedNote.title}
                                    onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                                    placeholder="Title"
                                    className="text-2xl font-bold bg-transparent outline-none"
                                />
                                <textarea
                                    value={selectedNote.content}
                                    onChange={e => updateNote(selectedNote.id, { content: e.target.value })}
                                    placeholder="Start typing..."
                                    className="flex-1 bg-transparent outline-none resize-none text-base leading-relaxed"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] text-black dark:text-white font-sf overflow-hidden">
            <AnimatePresence mode="popLayout">
                {showSidebar && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-r border-black/10 dark:border-white/10 flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-lg shrink-0 overflow-hidden"
                    >
                        <div className="w-64 flex flex-col h-full">
                            <div className="h-[52px] border-b border-black/5 dark:border-white/5 flex items-center gap-2 draggable-region px-3 pl-20 pt-1">
                                <div className="flex-1 flex items-center gap-2 bg-black/5 dark:bg-white/10 rounded-lg px-2 py-1 transition-colors focus-within:bg-black/10 dark:focus-within:bg-white/20">
                                    <IoSearchOutline className="text-gray-400" size={14} />
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
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setSelectedNote(note)}
                                        className={`mx-2 my-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedNote?.id === note.id
                                            ? 'bg-accent text-white shadow-sm'
                                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm truncate">{note.title || 'New Note'}</div>
                                        <div className={`text-xs mt-0.5 flex gap-2 ${selectedNote?.id === note.id ? 'text-white/80' : 'text-gray-500'}`}>
                                            <span className="shrink-0">{formatDate(note.updatedAt)}</span>
                                            <span className="truncate opacity-80">{note.content.slice(0, 30) || 'No additional text'}</span>
                                        </div>
                                    </div>
                                ))}
                                {filteredNotes.length === 0 && (
                                    <div className="p-4 text-center text-gray-400 text-xs">
                                        {notes.length === 0 ? 'No notes' : 'No results'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e]">
                {selectedNote ? (
                    <>
                        <div className="h-[52px] flex items-center justify-between px-6 bg-transparent draggable-region shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className="text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M9 3V21" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                                <span className="text-xs text-gray-400 font-medium">
                                    {new Date(selectedNote.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={createNote}
                                    className="p-1.5 text-gray-400 hover:text-accent transition-colors hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                                    title="New Note"
                                >
                                    <IoAdd size={20} />
                                </button>
                                <button
                                    onClick={() => deleteNote(selectedNote.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                                    title="Delete Note"
                                >
                                    <IoTrashOutline size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto p-8 flex flex-col gap-4">
                                <input
                                    type="text"
                                    value={selectedNote.title}
                                    onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                                    placeholder="Title"
                                    className="text-3xl font-bold bg-transparent outline-none w-full placeholder-gray-300 dark:placeholder-gray-600"
                                />
                                <textarea
                                    value={selectedNote.content}
                                    onChange={e => updateNote(selectedNote.id, { content: e.target.value })}
                                    placeholder="Start typing..."
                                    className="flex-1 bg-transparent outline-none resize-none text-base leading-relaxed w-full min-h-[500px] placeholder-gray-300 dark:placeholder-gray-600"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-full h-10 border-b border-black/5 dark:border-white/5 flex items-center px-4 bg-white/60 dark:bg-black/20 draggable-region">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
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
                                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition"
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
