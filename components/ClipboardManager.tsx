'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useIsClay } from './hooks/useIsClay';
import { glassCard, glassPanel, glassButton, glassInput } from './hooks/useClayStyles';
import { isnative, readclipboardtext, writeclipboardtext } from '@/utils/platform';
import { IoClose, IoSearch, IoClipboardOutline, IoPinOutline, IoPin, IoTrashOutline, IoCopyOutline } from 'react-icons/io5';

interface ClipboardEntry {
    id: string;
    text: string;
    timestamp: number;
    pinned: boolean;
}

const STORAGE_KEY = 'nextaros-clipboard-pinned';
const MAX_ITEMS = 50;

function loadPinned(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePinned(ids: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function loadHistory(): ClipboardEntry[] {
    try {
        const raw = localStorage.getItem('nextaros-clipboard-history');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveHistory(entries: ClipboardEntry[]) {
    localStorage.setItem('nextaros-clipboard-history', JSON.stringify(entries));
}

function formatTimestamp(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ClipboardManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const clay = useIsClay();
    const [mounted, setMounted] = useState(false);
    const [history, setHistory] = useState<ClipboardEntry[]>([]);
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const lastClipRef = useRef('');

    useEffect(() => {
        setMounted(true);
        setHistory(loadHistory());
        return () => { setMounted(false); };
    }, []);

    // Persist history changes
    useEffect(() => {
        if (mounted) saveHistory(history);
    }, [history, mounted]);

    const addEntry = useCallback((text: string) => {
        if (!text.trim() || text === lastClipRef.current) return;
        lastClipRef.current = text;
        setHistory(prev => {
            const existing = prev.find(e => e.text === text);
            if (existing) {
                // Move to top, keep pin state
                const filtered = prev.filter(e => e.text !== text);
                return [{ ...existing, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
            }
            const entry: ClipboardEntry = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text,
                timestamp: Date.now(),
                pinned: false,
            };
            return [entry, ...prev].slice(0, MAX_ITEMS);
        });
    }, []);

    // Poll clipboard
    useEffect(() => {
        if (!isOpen && !mounted) return;
        let active = true;

        const poll = async () => {
            try {
                const text = await readclipboardtext();
                if (active && text) addEntry(text);
            } catch { /* permission denied or unavailable */ }
        };

        poll(); // initial read
        const interval = setInterval(poll, 1500);
        return () => { active = false; clearInterval(interval); };
    }, [mounted, addEntry, isOpen]);

    const togglePin = useCallback((id: string) => {
        setHistory(prev => {
            const updated = prev.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e);
            savePinned(updated.filter(e => e.pinned).map(e => e.id));
            return updated;
        });
    }, []);

    const copyToClipboard = useCallback(async (entry: ClipboardEntry) => {
        await writeclipboardtext(entry.text);
        lastClipRef.current = entry.text;
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 1500);
    }, []);

    const clearAll = useCallback(() => {
        setHistory(prev => prev.filter(e => e.pinned));
    }, []);

    const removeEntry = useCallback((id: string) => {
        setHistory(prev => prev.filter(e => e.id !== id));
    }, []);

    const sortedFiltered = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = q ? history.filter(e => e.text.toLowerCase().includes(q)) : history;
        return [...filtered].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.timestamp - a.timestamp;
        });
    }, [history, search]);

    if (!mounted) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="clipboard-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`fixed inset-0 z-[699] ${clay ? '' : 'bg-black/30'}`}
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="clipboard-panel"
                        initial={clay
                            ? { opacity: 0, y: 10, scale: 0.96 }
                            : { x: '100%' }
                        }
                        animate={clay
                            ? { opacity: 1, y: 0, scale: 1 }
                            : { x: 0 }
                        }
                        exit={clay
                            ? { opacity: 0, y: 10, scale: 0.96 }
                            : { x: '100%' }
                        }
                        transition={clay
                            ? { type: 'spring', stiffness: 400, damping: 28 }
                            : { type: 'spring', stiffness: 400, damping: 40 }
                        }
                        className={`fixed z-[700] flex flex-col overflow-hidden ${clay
                            ? 'bottom-[72px] right-3 w-[360px] max-h-[70vh] rounded-[22px]'
                            : 'top-0 right-0 bottom-0 w-[380px] h-full border-l-2 border-[--border-color] bg-surface'
                        }`}
                        style={clay ? {
                            ...glassPanel,
                            background: 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 35%, transparent))',
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                        } : undefined}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`shrink-0 flex items-center justify-between ${clay ? 'px-5 pt-4 pb-2' : 'px-5 pt-12 pb-4'}`}>
                            <h3 className={`font-semibold text-[--text-color] ${clay ? 'text-[15px]' : 'text-2xl font-bold'}`}>
                                Clipboard
                            </h3>
                            <div className="flex items-center gap-2">
                                {history.some(e => !e.pinned) && (
                                    <button
                                        onClick={clearAll}
                                        className={`flex items-center gap-1 text-[--text-color] transition-all active:scale-95 ${clay
                                            ? 'px-2.5 py-1 text-[11px] font-semibold rounded-full'
                                            : 'px-3 py-1.5 text-xs font-medium hover:text-[--text-color] hover:bg-overlay'
                                        }`}
                                        style={clay ? { background: 'color-mix(in srgb, var(--bg-glass) 50%, transparent)', border: '1px solid var(--glass-border)' } : undefined}
                                    >
                                        Clear
                                    </button>
                                )}
                                {!clay && (
                                    <button onClick={onClose} className="p-1.5 hover:bg-overlay transition-colors">
                                        <IoClose size={18} className="text-[--text-muted]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search */}
                        <div className={`shrink-0 ${clay ? 'px-4 pb-2' : 'px-4 pb-3'}`}>
                            <div
                                className={`flex items-center gap-2 ${clay ? 'rounded-[12px] px-3 py-2' : 'px-3 py-2 border border-[--border-color]'}`}
                                style={clay ? glassInput : undefined}
                            >
                                <IoSearch size={14} className="text-[--text-muted] shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search clipboard..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="flex-1 bg-transparent text-[13px] text-[--text-color] placeholder:text-[--text-muted] outline-none"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="shrink-0">
                                        <IoClose size={14} className="text-[--text-muted]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div
                            className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none' }}
                        >
                            {sortedFiltered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5"
                                        style={clay
                                            ? { background: 'color-mix(in srgb, var(--bg-glass-active) 65%, transparent)', border: '1px solid var(--glass-border)' }
                                            : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }
                                        }
                                    >
                                        <IoClipboardOutline size={20} className="text-[--text-muted]" />
                                    </div>
                                    <p className={`font-medium text-[--text-color] ${clay ? 'text-[13px]' : 'text-[14px]'}`}>
                                        {search ? 'No matches' : 'Clipboard empty'}
                                    </p>
                                    <p className={`text-[--text-muted] mt-0.5 ${clay ? 'text-[11px]' : 'text-[13px]'}`}>
                                        {search ? 'Try a different search' : 'Copied text will appear here'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {sortedFiltered.map(entry => (
                                        <motion.div
                                            key={entry.id}
                                            layout
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 40 }}
                                            transition={{ duration: 0.15 }}
                                            className={`group relative cursor-pointer ${clay
                                                ? 'rounded-[14px] hover:bg-[--bg-glass-hover]'
                                                : 'border border-[--border-color] hover:bg-overlay anime-accent-left'
                                            }`}
                                            style={clay ? glassCard : undefined}
                                            onClick={() => copyToClipboard(entry)}
                                        >
                                            <div className="px-3.5 py-3">
                                                {/* Top row: timestamp + actions */}
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        {entry.pinned && (
                                                            <IoPin size={10} className="text-[--accent-color]" style={!clay ? { color: 'var(--pastel-blue)' } : undefined} />
                                                        )}
                                                        <span className="text-[10px] text-[--text-color] opacity-50">
                                                            {formatTimestamp(entry.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); togglePin(entry.id); }}
                                                            className={`p-1 transition-colors ${clay ? 'rounded-full hover:bg-[--bg-glass-active]' : 'hover:bg-overlay'}`}
                                                            title={entry.pinned ? 'Unpin' : 'Pin'}
                                                        >
                                                            {entry.pinned
                                                                ? <IoPin size={12} className="text-[--accent-color]" style={!clay ? { color: 'var(--pastel-blue)' } : undefined} />
                                                                : <IoPinOutline size={12} className="text-[--text-muted]" />
                                                            }
                                                        </button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); removeEntry(entry.id); }}
                                                            className={`p-1 transition-colors ${clay ? 'rounded-full hover:bg-[--bg-glass-active]' : 'hover:bg-overlay'}`}
                                                            title="Remove"
                                                        >
                                                            <IoTrashOutline size={12} className="text-[--text-muted]" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Preview text */}
                                                <p className="text-[12px] text-[--text-color] opacity-80 leading-snug line-clamp-2 break-all">
                                                    {entry.text}
                                                </p>

                                                {/* Copied feedback */}
                                                {copiedId === entry.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex items-center gap-1 mt-1.5"
                                                    >
                                                        <IoCopyOutline size={10} style={{ color: clay ? 'var(--accent-color)' : 'var(--pastel-green)' }} />
                                                        <span className="text-[10px] font-medium" style={{ color: clay ? 'var(--accent-color)' : 'var(--pastel-green)' }}>
                                                            Copied
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer count */}
                        {history.length > 0 && (
                            <div className={`shrink-0 text-center py-2 text-[10px] text-[--text-muted] ${clay ? 'border-t border-[--glass-border]' : 'border-t border-[--border-color]'}`}>
                                {history.length} item{history.length !== 1 ? 's' : ''} {history.filter(e => e.pinned).length > 0 && `\u00B7 ${history.filter(e => e.pinned).length} pinned`}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
