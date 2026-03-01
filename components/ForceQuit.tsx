'use client';
import React from 'react';
import { useWindows } from './WindowContext';
import { useProcess } from './ProcessContext';
import { apps } from './data';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseCircle, IoWarning } from 'react-icons/io5';
import TintedAppIcon from './ui/TintedAppIcon';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassButton } from './hooks/useClayStyles';

interface ForceQuitProps {
    isopen: boolean;
    onclose: () => void;
}

export default function ForceQuit({ isopen, onclose }: ForceQuitProps) {
    const { windows, removewindow } = useWindows();
    const { processes, kill } = useProcess();
    const clay = useIsClay();

    const handleForceQuit = (windowId: string, pid?: number) => {
        if (pid) {
            kill(pid);
        }
        removewindow(windowId);
    };

    const activewindows = windows.filter((w: any) => !w.isminimized);

    return (
        <AnimatePresence>
            {isopen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-[499] ${clay ? 'bg-black/20 backdrop-blur-sm' : ''}`}
                        style={!clay ? { background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)' } : undefined}
                        onClick={onclose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={clay ? { type: 'spring', stiffness: 400, damping: 28 } : undefined}
                        className={`fixed left-0 top-0 bottom-0 right-0 h-max mx-auto my-auto w-[380px] z-[500] overflow-hidden ${clay
                            ? 'rounded-[28px] font-sans'
                            : 'bg-surface border border-[--border-color] anime-glow font-mono'
                        }`}
                        style={clay ? {
                            ...glassPanel,
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                            boxShadow: 'var(--shadow-xl)',
                        } : undefined}
                    >
                        <div className={`p-5 ${clay ? 'pb-3' : 'border-b border-[--border-color]'}`}>
                            <h2 className="text-base font-semibold text-center text-[--text-color]">Force Quit Applications</h2>
                            <p className="text-xs text-[--text-muted] text-center mt-1">If an app doesn&apos;t respond, select it and click Force Quit</p>
                        </div>

                        {clay && <div className="h-[1px] mx-4 border-t border-[--glass-border]" />}

                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {activewindows.length === 0 ? (
                                <div className="p-8 text-center text-[--text-muted]">
                                    <IoWarning size={32} className={`mx-auto mb-2 ${clay ? 'text-[--text-muted]' : 'opacity-50'}`} />
                                    <p className="text-[13px]">No applications running</p>
                                </div>
                            ) : (
                                activewindows.map((win: any) => {
                                    const appData = apps.find(a => a.appname === win.appname);
                                    const proc = processes.find(p => p.windowId === win.id && p.state !== 'killed');
                                    const iscrashed = proc?.state === 'crashed';
                                    return (
                                        <div
                                            key={win.id}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer group transition-all ${clay
                                                ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.98]'
                                                : `hover:bg-overlay`
                                            }`}
                                            style={clay && iscrashed ? { background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' } : (!clay && iscrashed ? { background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' } : undefined)}
                                            onClick={() => handleForceQuit(win.id, proc?.pid)}
                                        >
                                            <div className="w-10 h-10 shrink-0">
                                                <TintedAppIcon
                                                    appId={appData?.id || ''}
                                                    appName={win.appname}
                                                    originalIcon={appData?.icon || '/app-default.png'}
                                                    size={40}
                                                    useFill={false}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-[13px] text-[--text-color] truncate flex items-center gap-2">
                                                    {win.appname}
                                                    {iscrashed && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 text-white ${clay ? 'rounded-full' : ''}`} style={{ background: 'var(--pastel-red)' }}>Not Responding</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-[--text-muted] truncate">
                                                    {proc ? `PID: ${proc.pid}` : 'Window'}
                                                </div>
                                            </div>
                                            <IoCloseCircle
                                                size={24}
                                                className="text-pastel-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {clay && <div className="h-[1px] mx-4 border-t border-[--glass-border]" />}

                        <div className={`p-4 flex justify-between items-center ${clay ? '' : 'border-t border-[--border-color]'}`}>
                            <span className="text-xs text-[--text-muted]">{activewindows.length} app{activewindows.length !== 1 ? 's' : ''} running</span>
                            <button
                                onClick={onclose}
                                className={`px-5 py-2 text-[13px] font-medium transition-all text-[--text-color] ${clay
                                    ? 'rounded-[12px] active:scale-[0.97]'
                                    : 'bg-overlay border border-[--border-color] hover:bg-overlay'
                                }`}
                                style={clay ? glassButton : undefined}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
