'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuPlus, LuX, LuGrid2X2 } from 'react-icons/lu';
import { tauriAPI } from '@/utils/tauri-bridge';
import { isnative } from '@/utils/platform';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassCard, glassButton } from './hooks/useClayStyles';

// ── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceData {
    current: number;
    count: number;
    names: string[];
}

interface WorkspaceContextValue {
    workspaces: WorkspaceData;
    switchWorkspace: (index: number) => Promise<void>;
    createWorkspace: (name?: string) => Promise<void>;
    removeWorkspace: (index: number) => Promise<void>;
    overviewVisible: boolean;
    setOverviewVisible: (visible: boolean) => void;
}

const defaultWorkspaces: WorkspaceData = {
    current: 0,
    count: 1,
    names: ['Desktop 1'],
};

// ── Context ──────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue>({
    workspaces: defaultWorkspaces,
    switchWorkspace: async () => {},
    createWorkspace: async () => {},
    removeWorkspace: async () => {},
    overviewVisible: false,
    setOverviewVisible: () => {},
});

export function useWorkspaces() {
    return useContext(WorkspaceContext);
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<WorkspaceData>(defaultWorkspaces);
    const [overviewVisible, setOverviewVisible] = useState(false);

    const fetchWorkspaces = useCallback(async () => {
        if (!isnative) return;
        try {
            const result = await tauriAPI.workspaces.list();
            if (result && typeof result.current === 'number') {
                setWorkspaces({
                    current: result.current,
                    count: result.count || 1,
                    names: result.names || Array.from({ length: result.count || 1 }, (_, i) => `Desktop ${i + 1}`),
                });
            }
        } catch {
            // Native API unavailable — keep defaults
        }
    }, []);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const switchWorkspace = useCallback(async (index: number) => {
        if (isnative) {
            try {
                await tauriAPI.workspaces.switch(index);
            } catch { /* fallback below */ }
        }
        setWorkspaces(prev => ({ ...prev, current: index }));
    }, []);

    const createWorkspace = useCallback(async (name?: string) => {
        if (isnative) {
            try {
                await tauriAPI.workspaces.create(name);
                await fetchWorkspaces();
                return;
            } catch { /* fallback below */ }
        }
        setWorkspaces(prev => ({
            current: prev.current,
            count: prev.count + 1,
            names: [...prev.names, name || `Desktop ${prev.count + 1}`],
        }));
    }, [fetchWorkspaces]);

    const removeWorkspace = useCallback(async (index: number) => {
        if (isnative) {
            try {
                await tauriAPI.workspaces.remove(index);
                await fetchWorkspaces();
                return;
            } catch { /* fallback below */ }
        }
        setWorkspaces(prev => {
            if (prev.count <= 1) return prev;
            const newNames = prev.names.filter((_, i) => i !== index);
            const newCurrent = prev.current >= newNames.length ? newNames.length - 1 : prev.current;
            return { current: newCurrent, count: newNames.length, names: newNames };
        });
    }, [fetchWorkspaces]);

    // Keyboard shortcut: Super+Tab or Ctrl+Alt+Up to toggle overview
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ctrl+Alt+ArrowUp or Meta+Tab toggles overview
            if ((e.ctrlKey && e.altKey && e.key === 'ArrowUp') || (e.metaKey && e.key === 'Tab')) {
                e.preventDefault();
                setOverviewVisible(prev => !prev);
            }
            // Ctrl+Alt+ArrowLeft / ArrowRight to switch workspaces
            if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                setWorkspaces(prev => {
                    const next = Math.max(0, prev.current - 1);
                    if (next !== prev.current) switchWorkspace(next);
                    return prev;
                });
            }
            if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                setWorkspaces(prev => {
                    const next = Math.min(prev.count - 1, prev.current + 1);
                    if (next !== prev.current) switchWorkspace(next);
                    return prev;
                });
            }
            // Escape closes overview
            if (e.key === 'Escape' && overviewVisible) {
                setOverviewVisible(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [overviewVisible, switchWorkspace]);

    return (
        <WorkspaceContext.Provider value={{ workspaces, switchWorkspace, createWorkspace, removeWorkspace, overviewVisible, setOverviewVisible }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

// ── WorkspaceSwitcherUI (compact strip for the panel/dock) ───────────────────

export function WorkspaceSwitcherUI() {
    const { workspaces, switchWorkspace, createWorkspace } = useWorkspaces();
    const clay = useIsClay();

    return (
        <div className="flex items-center gap-1 px-1">
            {Array.from({ length: workspaces.count }).map((_, i) => {
                const isActive = workspaces.current === i;
                return (
                    <button
                        key={i}
                        onClick={() => switchWorkspace(i)}
                        title={workspaces.names[i] || `Desktop ${i + 1}`}
                        className={`
                            relative h-[18px] min-w-[24px] rounded-[5px] text-[9px] font-semibold
                            transition-all duration-200 cursor-pointer select-none
                            ${clay
                                ? isActive
                                    ? 'text-[--text-color]'
                                    : 'text-[--text-muted] hover:text-[--text-color]'
                                : isActive
                                    ? 'bg-pastel-lavender/25 text-pastel-lavender border border-pastel-lavender/40'
                                    : 'bg-white/5 text-[--text-muted] hover:bg-white/10 hover:text-[--text-color] border border-transparent'
                            }
                        `}
                        style={clay ? (isActive
                            ? { ...glassButton, background: 'color-mix(in srgb, var(--accent-source) 20%, var(--bg-glass))' }
                            : { ...glassButton, background: 'var(--bg-glass)', opacity: 0.6 }
                        ) : undefined}
                    >
                        {i + 1}
                    </button>
                );
            })}
            {workspaces.count < 9 && (
                <button
                    onClick={() => createWorkspace()}
                    title="Add workspace"
                    className={`
                        h-[18px] w-[18px] flex items-center justify-center rounded-[5px]
                        transition-all duration-200 cursor-pointer
                        ${clay
                            ? 'text-[--text-muted] hover:text-[--text-color]'
                            : 'text-[--text-muted] hover:text-[--text-color] hover:bg-white/10'
                        }
                    `}
                    style={clay ? { ...glassButton, background: 'transparent', border: '1px dashed var(--glass-border)' } : undefined}
                >
                    <LuPlus size={10} />
                </button>
            )}
        </div>
    );
}

// ── WorkspaceOverview (full-screen overlay) ──────────────────────────────────

export function WorkspaceOverview() {
    const { workspaces, switchWorkspace, createWorkspace, removeWorkspace, overviewVisible, setOverviewVisible } = useWorkspaces();
    const clay = useIsClay();
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSwitch = useCallback((index: number) => {
        switchWorkspace(index);
        setOverviewVisible(false);
    }, [switchWorkspace, setOverviewVisible]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === containerRef.current) {
            setOverviewVisible(false);
        }
    }, [setOverviewVisible]);

    // Grid layout: up to 3 columns
    const cols = workspaces.count <= 2 ? workspaces.count : workspaces.count <= 4 ? 2 : 3;

    return (
        <AnimatePresence>
            {overviewVisible && (
                <motion.div
                    ref={containerRef}
                    className="fixed inset-0 z-[900] flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={handleBackdropClick}
                    style={{
                        background: clay
                            ? 'color-mix(in srgb, var(--bg-base) 70%, transparent)'
                            : 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Header */}
                    <motion.div
                        className="mb-8 text-center"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ delay: 0.05, duration: 0.2 }}
                    >
                        <h2 className={`text-lg font-semibold ${clay ? 'text-[--text-color]' : 'text-white'}`}>
                            Workspaces
                        </h2>
                        <p className={`text-xs mt-1 ${clay ? 'text-[--text-muted]' : 'text-white/50'}`}>
                            Click a workspace to switch, or press Escape to close
                        </p>
                    </motion.div>

                    {/* Workspace Grid */}
                    <motion.div
                        className="grid gap-5"
                        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ delay: 0.08, duration: 0.25 }}
                    >
                        {Array.from({ length: workspaces.count }).map((_, i) => {
                            const isActive = workspaces.current === i;
                            const name = workspaces.names[i] || `Desktop ${i + 1}`;

                            return (
                                <motion.div
                                    key={i}
                                    className="relative group cursor-pointer"
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSwitch(i)}
                                >
                                    {/* Workspace thumbnail */}
                                    <div
                                        className={`
                                            w-[220px] h-[140px] rounded-[14px] overflow-hidden
                                            flex items-center justify-center transition-all duration-200
                                            ${clay
                                                ? isActive
                                                    ? 'ring-2 ring-[--accent-source]'
                                                    : 'ring-1 ring-[--glass-border] hover:ring-[--accent-source]/50'
                                                : isActive
                                                    ? 'ring-2 ring-pastel-lavender'
                                                    : 'ring-1 ring-white/10 hover:ring-pastel-lavender/50'
                                            }
                                        `}
                                        style={clay ? {
                                            ...glassCard,
                                            background: isActive
                                                ? 'color-mix(in srgb, var(--accent-source) 12%, var(--bg-glass))'
                                                : 'var(--bg-glass)',
                                        } : {
                                            background: isActive
                                                ? 'rgba(255, 255, 255, 0.08)'
                                                : 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                        }}
                                    >
                                        {/* Miniature desktop preview placeholder */}
                                        <div className="flex flex-col items-center gap-2">
                                            <LuGrid2X2
                                                size={28}
                                                className={clay
                                                    ? (isActive ? 'text-[--accent-source]' : 'text-[--text-muted]')
                                                    : (isActive ? 'text-pastel-lavender' : 'text-white/20')
                                                }
                                            />
                                            {isActive && (
                                                <span className={`text-[10px] font-medium ${clay ? 'text-[--accent-source]' : 'text-pastel-lavender'}`}>
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Label + Remove */}
                                    <div className="flex items-center justify-between mt-2 px-1">
                                        <span className={`text-xs font-medium ${clay ? 'text-[--text-color]' : 'text-white/80'}`}>
                                            {name}
                                        </span>
                                        {workspaces.count > 1 && !isActive && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeWorkspace(i); }}
                                                className={`
                                                    opacity-0 group-hover:opacity-100 transition-opacity
                                                    p-0.5 rounded-full
                                                    ${clay
                                                        ? 'text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-glass-hover]'
                                                        : 'text-white/30 hover:text-white/80 hover:bg-white/10'
                                                    }
                                                `}
                                                title={`Remove ${name}`}
                                            >
                                                <LuX size={12} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Add workspace card */}
                        {workspaces.count < 9 && (
                            <motion.div
                                className="relative cursor-pointer"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => createWorkspace()}
                            >
                                <div
                                    className={`
                                        w-[220px] h-[140px] rounded-[14px] overflow-hidden
                                        flex items-center justify-center transition-all duration-200
                                        ${clay
                                            ? 'hover:bg-[--bg-glass-hover]'
                                            : 'hover:bg-white/5'
                                        }
                                    `}
                                    style={clay ? {
                                        background: 'transparent',
                                        border: '2px dashed var(--glass-border)',
                                    } : {
                                        background: 'transparent',
                                        border: '2px dashed rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <LuPlus
                                            size={24}
                                            className={clay ? 'text-[--text-muted]' : 'text-white/20'}
                                        />
                                        <span className={`text-xs ${clay ? 'text-[--text-muted]' : 'text-white/30'}`}>
                                            New Workspace
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Footer hint */}
                    <motion.div
                        className={`mt-8 text-[11px] ${clay ? 'text-[--text-muted]' : 'text-white/30'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        Ctrl+Alt+Left/Right to switch  |  Ctrl+Alt+Up to toggle overview
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
