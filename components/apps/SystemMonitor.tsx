'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useProcess } from '../ProcessContext';
import { useWindows } from '../WindowContext';
import { apps } from '../data';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStopCircle, IoPauseCircle, IoPlayCircle, IoRefresh, IoSkull, IoDesktop } from 'react-icons/io5';
import TintedAppIcon from '../ui/TintedAppIcon';
import { iselectron, processes as systemprocesses, getsysteminfo } from '@/utils/platform';

interface SystemProcess {
    pid: number;
    user?: string;
    cpu: number;
    mem: number;
    command: string;
}

interface SystemMonitorProps {
    isFocused: boolean;
}

export default function SystemMonitor({ isFocused }: SystemMonitorProps) {
    const { processes: internalprocesses, suspend, resume, kill } = useProcess();
    const { windows, removewindow, updatewindow } = useWindows();
    const [selectedpid, setselectedpid] = useState<number | null>(null);
    const [viewmode, setviewmode] = useState<'internal' | 'system'>('internal');
    const [systemprocs, setsystemprocs] = useState<SystemProcess[]>([]);
    const [loading, setloading] = useState(false);
    const [stats, setstats] = useState({
        uptime: 0,
        memory: 0,
        memtotal: 0,
        memfree: 0,
        cpu: 0,
        cpucount: 0,
        hostname: ''
    });

    const fetchsystemdata = useCallback(async () => {
        if (!iselectron) return;

        setloading(true);
        try {
            const procsdata = await systemprocesses.list();
            if (procsdata.success && procsdata.processes) {
                setsystemprocs(procsdata.processes.slice(0, 50));
            }

            const sysinfo = await getsysteminfo();
            if (sysinfo) {
                setstats(prev => ({
                    ...prev,
                    memtotal: Math.round(sysinfo.totalmem / 1024 / 1024 / 1024 * 10) / 10,
                    memfree: Math.round(sysinfo.freemem / 1024 / 1024 / 1024 * 10) / 10,
                    memory: Math.round((1 - sysinfo.freemem / sysinfo.totalmem) * 100),
                    cpucount: sysinfo.cpus?.length || 0,
                    uptime: sysinfo.uptime || 0,
                    hostname: sysinfo.hostname || '',
                    cpu: sysinfo.loadavg?.[0] ? Math.min(100, sysinfo.loadavg[0] * 100 / (sysinfo.cpus?.length || 1)) : 0
                }));
            }
        } catch (e) { }
        setloading(false);
    }, []);

    useEffect(() => {
        if (viewmode === 'system' && iselectron) {
            fetchsystemdata();
            const interval = setInterval(fetchsystemdata, 3000);
            return () => clearInterval(interval);
        }
    }, [viewmode, fetchsystemdata]);

    useEffect(() => {
        if (viewmode === 'internal') {
            const starttime = Date.now();
            const interval = setInterval(() => {
                setstats(prev => ({
                    ...prev,
                    uptime: Math.floor((Date.now() - starttime) / 1000),
                    memory: Math.min(100, 30 + internalprocesses.length * 5 + Math.random() * 10),
                    cpu: Math.min(100, 5 + internalprocesses.filter(p => p.state === 'running').length * 8 + Math.random() * 5)
                }));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [internalprocesses, viewmode]);

    const formatuptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hrs = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hrs}h ${mins}m`;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m ${seconds % 60}s`;
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

    const runningprocesses = internalprocesses.filter(p => p.state !== 'killed');

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

    const killsystemprocess = async (pid: number, force: boolean = false) => {
        if (!iselectron) return;
        await systemprocesses.kill(pid, force);
        setTimeout(fetchsystemdata, 500);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            <div className="h-12 bg-neutral-900 border-b border-neutral-700 flex items-center px-4 shrink-0">
                <div className="flex items-center gap-2 ml-16">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">System Monitor</span>
                    {stats.hostname && <span className="text-xs text-neutral-500">• {stats.hostname}</span>}
                </div>
                <div className="ml-auto flex items-center gap-4">
                    {iselectron && (
                        <div className="flex bg-neutral-800 rounded-lg p-0.5">
                            <button
                                onClick={() => setviewmode('internal')}
                                className={`px-3 py-1 rounded-md text-xs transition-colors ${viewmode === 'internal' ? 'bg-accent text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <IoDesktop className="inline mr-1" size={12} />
                                NextarDE
                            </button>
                            <button
                                onClick={() => setviewmode('system')}
                                className={`px-3 py-1 rounded-md text-xs transition-colors ${viewmode === 'system' ? 'bg-accent text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <IoSkull className="inline mr-1" size={12} />
                                Host System
                            </button>
                        </div>
                    )}
                    <span className="text-xs text-neutral-400">Uptime: {formatuptime(stats.uptime)}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 border-b border-neutral-700">
                <div className="bg-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 mb-1">CPU {viewmode === 'system' && `(${stats.cpucount} cores)`}</div>
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
                    <div className="text-xs text-neutral-400 mb-1">
                        Memory {viewmode === 'system' && stats.memtotal > 0 && `(${stats.memtotal}GB)`}
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{stats.memory.toFixed(1)}%</div>
                    <div className="h-2 bg-neutral-700 rounded-full mt-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            animate={{ width: `${stats.memory}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    {viewmode === 'system' && stats.memfree > 0 && (
                        <div className="text-[10px] text-neutral-500 mt-1">{stats.memfree}GB free</div>
                    )}
                </div>
                <div className="bg-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 mb-1">Processes</div>
                    <div className="text-2xl font-bold text-purple-400">
                        {viewmode === 'system' ? systemprocs.length : runningprocesses.length}
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                        {viewmode === 'system' ? 'Host processes' : `${internalprocesses.filter(p => p.state === 'running').length} active`}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {viewmode === 'internal' ? (
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
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-800 sticky top-0">
                            <tr className="text-left text-neutral-400 text-xs uppercase">
                                <th className="px-4 py-3 font-medium">PID</th>
                                <th className="px-4 py-3 font-medium">Command</th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">CPU %</th>
                                <th className="px-4 py-3 font-medium">MEM %</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && systemprocs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-neutral-500">
                                        <IoRefresh size={24} className="animate-spin mx-auto mb-2" />
                                        Loading processes...
                                    </td>
                                </tr>
                            ) : (
                                systemprocs.map((proc) => (
                                    <tr
                                        key={proc.pid}
                                        className={`border-b border-neutral-800 hover:bg-neutral-800/50 cursor-pointer transition-colors ${selectedpid === proc.pid ? 'bg-accent/20' : ''}`}
                                        onClick={() => setselectedpid(proc.pid)}
                                    >
                                        <td className="px-4 py-2 font-mono text-neutral-400">{proc.pid}</td>
                                        <td className="px-4 py-2 max-w-[300px] truncate" title={proc.command}>
                                            {proc.command}
                                        </td>
                                        <td className="px-4 py-2 text-neutral-400 text-xs">{proc.user || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={proc.cpu > 50 ? 'text-red-400' : proc.cpu > 20 ? 'text-yellow-400' : 'text-green-400'}>
                                                {proc.cpu?.toFixed(1) || '0.0'}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={proc.mem > 50 ? 'text-red-400' : proc.mem > 20 ? 'text-yellow-400' : 'text-blue-400'}>
                                                {proc.mem?.toFixed(1) || '0.0'}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); killsystemprocess(proc.pid, false); }}
                                                    className="px-2 py-1 text-xs rounded hover:bg-yellow-500/20 text-yellow-500 transition-colors"
                                                    title="Terminate (SIGTERM)"
                                                >
                                                    Stop
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); killsystemprocess(proc.pid, true); }}
                                                    className="px-2 py-1 text-xs rounded hover:bg-red-500/20 text-red-500 transition-colors"
                                                    title="Kill (SIGKILL)"
                                                >
                                                    Kill
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                {viewmode === 'internal' && runningprocesses.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
                        <IoRefresh size={32} className="mb-2 opacity-50" />
                        <p>No processes running</p>
                    </div>
                )}
            </div>

            <div className="h-8 bg-neutral-900 border-t border-neutral-700 flex items-center px-4 text-xs text-neutral-500 shrink-0">
                <span>
                    {viewmode === 'system'
                        ? `${systemprocs.length} host processes`
                        : `${runningprocesses.length} NextarDE process${runningprocesses.length !== 1 ? 'es' : ''}`
                    }
                </span>
                {viewmode === 'system' && (
                    <button
                        onClick={fetchsystemdata}
                        className="ml-2 text-neutral-400 hover:text-white"
                        disabled={loading}
                    >
                        <IoRefresh size={12} className={loading ? 'animate-spin' : ''} />
                    </button>
                )}
                <span className="ml-auto">NextarDE System Monitor</span>
            </div>
        </div>
    );
}
