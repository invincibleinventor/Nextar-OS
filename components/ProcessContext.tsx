'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Process, ProcessState } from '../types/permissions';
import { useAuth } from './AuthContext';

interface ProcessContextType {
    processes: Process[]
    spawn: (appId: string, windowId: string) => number
    suspend: (pid: number) => void
    resume: (pid: number) => void
    kill: (pid: number) => void
    crash: (pid: number, error: string) => void
    getByWindow: (windowId: string) => Process | undefined
    getByApp: (appId: string) => Process[]
    getByPid: (pid: number) => Process | undefined
    updateState: (pid: number, state: ProcessState) => void
    getRunningCount: () => number
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

export const ProcessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [processes, setprocesses] = useState<Process[]>([]);
    const pidcounter = useRef(1000);
    const { user } = useAuth();

    const spawn = useCallback((appId: string, windowId: string): number => {
        const pid = pidcounter.current++;
        const now = Date.now();

        const newprocess: Process = {
            pid,
            appId,
            userId: user?.username || 'guest',
            state: 'launching',
            startTime: now,
            lastActiveTime: now,
            windowId
        };

        setprocesses(prev => [...prev, newprocess]);

        setTimeout(() => {
            setprocesses(prev =>
                prev.map(p => p.pid === pid ? { ...p, state: 'running' as ProcessState } : p)
            );
        }, 100);

        return pid;
    }, [user]);

    const suspend = useCallback((pid: number) => {
        setprocesses(prev => prev.map(p =>
            p.pid === pid ? { ...p, state: 'suspended' as ProcessState, lastActiveTime: Date.now() } : p
        ));
    }, []);

    const resume = useCallback((pid: number) => {
        setprocesses(prev => prev.map(p =>
            p.pid === pid ? { ...p, state: 'running' as ProcessState, lastActiveTime: Date.now() } : p
        ));
    }, []);

    const kill = useCallback((pid: number) => {
        setprocesses(prev => prev.filter(p => p.pid !== pid));
    }, []);

    const crash = useCallback((pid: number, error: string) => {
        setprocesses(prev => prev.map(p =>
            p.pid === pid ? { ...p, state: 'crashed' as ProcessState, crashError: error, lastActiveTime: Date.now() } : p
        ));
    }, []);

    const getByWindow = useCallback((windowId: string): Process | undefined => {
        return processes.find(p => p.windowId === windowId);
    }, [processes]);

    const getByApp = useCallback((appId: string): Process[] => {
        return processes.filter(p => p.appId === appId);
    }, [processes]);

    const getByPid = useCallback((pid: number): Process | undefined => {
        return processes.find(p => p.pid === pid);
    }, [processes]);

    const updateState = useCallback((pid: number, state: ProcessState) => {
        setprocesses(prev => prev.map(p =>
            p.pid === pid ? { ...p, state, lastActiveTime: Date.now() } : p
        ));
    }, []);

    const getRunningCount = useCallback((): number => {
        return processes.filter(p => p.state === 'running' || p.state === 'suspended').length;
    }, [processes]);

    return (
        <ProcessContext.Provider value={{
            processes,
            spawn,
            suspend,
            resume,
            kill,
            crash,
            getByWindow,
            getByApp,
            getByPid,
            updateState,
            getRunningCount
        }}>
            {children}
        </ProcessContext.Provider>
    );
};

export const useProcess = () => {
    const context = useContext(ProcessContext);
    if (context === undefined) {
        throw new Error('useProcess must be used within a ProcessProvider');
    }
    return context;
};
