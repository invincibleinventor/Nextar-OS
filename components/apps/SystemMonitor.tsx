'use client';
import React, { useState, useEffect } from 'react';
import { useProcess } from '../ProcessContext';
import { useWindows } from '../WindowContext';
import { apps } from '../data';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStopCircle, IoPauseCircle, IoPlayCircle, IoRefresh } from 'react-icons/io5';
import TintedAppIcon from '../ui/TintedAppIcon';

interface SystemMonitorProps {
    isFocused: boolean;
}

export default function SystemMonitor({ isFocused }: SystemMonitorProps) {
    const { processes, suspend, resume, kill } = useProcess();
    const { windows, removewindow, updatewindow } = useWindows();
    const [selectedpid, setselectedpid] = useState<number | null>(null);
    const [stats, setstats] = useState({
        uptime: 0,
        memory: 0,
        cpu: 0
    });

    useEffect(() => {
        const starttime = Date.now();
        const interval = setInterval(() => {
            setstats({
                uptime: Math.floor((Date.now() - starttime) / 1000),
                memory: Math.min(100, 30 + processes.length * 5 + Math.random() * 10),
                cpu: Math.min(100, 5 + processes.filter(p => p.state === 'running').length * 8 + Math.random() * 5)
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [processes]);

    const formatuptime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs}h ${mins}m ${secs}s`;
    };

    const getstatuscolor = (state: string) => {
        switch (state) {
            case 'running': return 'bg-green-500';
            case 'suspended': return 'bg-yellow-500';
            case 'launching': return 'bg-blue-500';
            case 'crashed': return 'bg-red-500';
            case 'killed': return 'bg-neutral-500';
            default: return 'bg-neutral-400';
        }
    };

    const runningprocesses = processes.filter(p => p.state !== 'killed');

    const handlekillprocess = (proc: any) => {
        kill(proc.pid);
        if (proc.windowId) {
            removewindow(proc.windowId);
        }
    };

    const handlesuspendprocess = (proc: any) => {
        suspend(proc.pid);
        if (proc.windowId) {
            updatewindow(proc.windowId, { isminimized: true });
        }
    };

    const handleresumeprocess = (proc: any) => {
        resume(proc.pid);
        if (proc.windowId) {
            updatewindow(proc.windowId, { isminimized: false });
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            <div className="h-12 bg-neutral-900 border-b border-neutral-700 flex items-center px-4 shrink-0">
                <div className="flex items-center gap-2 ml-16">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">System Monitor</span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs text-neutral-400">
                    <span>Uptime: {formatuptime(stats.uptime)}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 border-b border-neutral-700">
                <div className="bg-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 mb-1">CPU Usage</div>
                    <div className="text-2xl font-bold text-green-400">{stats.cpu.toFixed(1)}%</div>
                    <div className="h-2 bg-neutral-700 rounded-full mt-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-green-500"
                            animate={{ width: `${stats.cpu}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
                <div className="bg-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 mb-1">Memory</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.memory.toFixed(1)}%</div>
                    <div className="h-2 bg-neutral-700 rounded-full mt-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            animate={{ width: `${stats.memory}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
                <div className="bg-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 mb-1">Processes</div>
                    <div className="text-2xl font-bold text-purple-400">{runningprocesses.length}</div>
                    <div className="text-xs text-neutral-500 mt-2">
                        {processes.filter(p => p.state === 'running').length} active
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-800 sticky top-0">
                        <tr className="text-left text-neutral-400 text-xs uppercase">
                            <th className="px-4 py-3 font-medium">PID</th>
                            <th className="px-4 py-3 font-medium">Process</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Started</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {runningprocesses.map((proc) => {
                                const appdata = apps.find(a => a.id === proc.appId || a.appname === proc.appId);
                                const windowdata = windows.find((w: any) => w.id === proc.windowId);
                                return (
                                    <motion.tr
                                        key={proc.pid}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className={`border-b border-neutral-800 hover:bg-neutral-800/50 cursor-pointer transition-colors ${selectedpid === proc.pid ? 'bg-accent/20' : ''}`}
                                        onClick={() => setselectedpid(proc.pid)}
                                    >
                                        <td className="px-4 py-3 font-mono text-neutral-400">{proc.pid}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {appdata && (
                                                    <div className="w-6 h-6">
                                                        <TintedAppIcon
                                                            appId={appdata.id}
                                                            appName={appdata.appname}
                                                            originalIcon={appdata.icon}
                                                            size={24}
                                                            useFill={false}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{appdata?.appname || proc.appId}</div>
                                                    {windowdata && (
                                                        <div className="text-xs text-neutral-500">{(windowdata as any).title || 'Window'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs capitalize ${getstatuscolor(proc.state)} bg-opacity-20`}>
                                                <span className={`w-2 h-2 rounded-full ${getstatuscolor(proc.state)}`} />
                                                {proc.state}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-400 text-xs">
                                            {new Date(proc.startTime).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {proc.state === 'running' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlesuspendprocess(proc); }}
                                                        className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-500 transition-colors"
                                                        title="Suspend"
                                                    >
                                                        <IoPauseCircle size={18} />
                                                    </button>
                                                )}
                                                {proc.state === 'suspended' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleresumeprocess(proc); }}
                                                        className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-500 transition-colors"
                                                        title="Resume"
                                                    >
                                                        <IoPlayCircle size={18} />
                                                    </button>
                                                )}
                                                {proc.state !== 'killed' && proc.state !== 'crashed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlekillprocess(proc); }}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"
                                                        title="Force Quit"
                                                    >
                                                        <IoStopCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>

                {runningprocesses.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
                        <IoRefresh size={32} className="mb-2 opacity-50" />
                        <p>No processes running</p>
                    </div>
                )}
            </div>

            <div className="h-8 bg-neutral-900 border-t border-neutral-700 flex items-center px-4 text-xs text-neutral-500 shrink-0">
                <span>{runningprocesses.length} process{runningprocesses.length !== 1 ? 'es' : ''}</span>
                <span className="ml-auto">NextarOS Process Manager</span>
            </div>
        </div>
    );
}
