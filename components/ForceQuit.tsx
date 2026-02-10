'use client';
import React from 'react';
import { useWindows } from './WindowContext';
import { useProcess } from './ProcessContext';
import { apps } from './data';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseCircle, IoWarning } from 'react-icons/io5';
import TintedAppIcon from './ui/TintedAppIcon';

interface ForceQuitProps {
    isopen: boolean;
    onclose: () => void;
}

export default function ForceQuit({ isopen, onclose }: ForceQuitProps) {
    const { windows, removewindow } = useWindows();
    const { processes, kill } = useProcess();

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
                        className="fixed inset-0 bg-[--bg-base]/80 z-[499]"
                        onClick={onclose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-0 top-0 bottom-0 right-0 h-max mx-auto my-auto w-[380px] bg-surface border border-[--border-color] z-[500] font-mono overflow-hidden anime-glow"
                    >
                        <div className="p-4 border-b border-[--border-color]">
                            <h2 className="text-base font-semibold text-center text-[--text-color]">Force Quit Applications</h2>
                            <p className="text-xs text-[--text-muted] text-center mt-1">If an app doesn&apos;t respond, select it and click Force Quit</p>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {activewindows.length === 0 ? (
                                <div className="p-8 text-center text-[--text-muted]">
                                    <IoWarning size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No applications running</p>
                                </div>
                            ) : (
                                activewindows.map((win: any) => {
                                    const appData = apps.find(a => a.appname === win.appname);
                                    const proc = processes.find(p => p.windowId === win.id && p.state !== 'killed');
                                    const iscrashed = proc?.state === 'crashed';
                                    return (
                                        <div
                                            key={win.id}
                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-overlay cursor-pointer group transition-colors ${iscrashed ? 'bg-pastel-red/10' : ''}`}
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
                                                <div className="font-medium text-sm text-[--text-color] truncate flex items-center gap-2">
                                                    {win.appname}
                                                    {iscrashed && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-pastel-red text-[--bg-base]">Not Responding</span>
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

                        <div className="p-3 border-t border-[--border-color] flex justify-between items-center">
                            <span className="text-xs text-[--text-muted]">{activewindows.length} app{activewindows.length !== 1 ? 's' : ''} running</span>
                            <button
                                onClick={onclose}
                                className="px-4 py-1.5 text-sm font-medium bg-overlay border border-[--border-color] hover:bg-overlay transition-colors text-[--text-color]"
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
