'use client';

/**
 * NextarOS Backend Companion API Spec
 *
 * GET  /api/health            → { ok: true, capabilities: string[] }
 * GET  /api/system/info       → { cpu, memory, disk, network, hostname, os }
 *
 * GET  /api/fs/read?path=     → { content: string }
 * POST /api/fs/write          → { path, content } → { ok: true }
 * GET  /api/fs/list?path=     → { items: [{ name, type, size, modified }] }
 * DELETE /api/fs/delete        → { path } → { ok: true }
 *
 * WS   /api/shell             → WebSocket: bidirectional terminal I/O
 *
 * GET  /api/docker/containers → [{ id, name, status, image }]
 * POST /api/docker/exec       → { containerId, command } → { output }
 *
 * POST /api/auth/login        → { username, password } → { token }
 * GET  /api/auth/session      → { user, expires }
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

interface HostContextType {
    isHostAvailable: boolean;
    hostUrl: string | null;
    capabilities: string[];
    isChecking: boolean;
}

const HostContext = createContext<HostContextType | undefined>(undefined);

const HEALTH_TIMEOUT = 3000;
const RETRY_INTERVAL = 30000;

export function HostProvider({ children }: { children: React.ReactNode }) {
    const [isHostAvailable, setIsHostAvailable] = useState(false);
    const [hostUrl, setHostUrl] = useState<string | null>(null);
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(true);
    const checkedRef = useRef(false);

    const checkHealth = useCallback(async (isInitial = false) => {
        if (typeof window === 'undefined') return;
        if (isInitial) setIsChecking(true);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

            const res = await fetch(`${window.location.origin}/api/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (data.ok) {
                    setIsHostAvailable(true);
                    setHostUrl(window.location.origin);
                    setCapabilities(data.capabilities || []);
                } else {
                    setIsHostAvailable(false);
                    setHostUrl(null);
                    setCapabilities([]);
                }
            } else {
                setIsHostAvailable(false);
                setHostUrl(null);
                setCapabilities([]);
            }
        } catch {
            setIsHostAvailable(false);
            setHostUrl(null);
            setCapabilities([]);
        } finally {
            if (isInitial) setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        checkHealth(true);

        const interval = setInterval(() => checkHealth(false), RETRY_INTERVAL);
        return () => clearInterval(interval);
    }, [checkHealth]);

    return (
        <HostContext.Provider value={{ isHostAvailable, hostUrl, capabilities, isChecking }}>
            {children}
        </HostContext.Provider>
    );
}

export function useHost() {
    const context = useContext(HostContext);
    if (!context) throw new Error('useHost must be used within a HostProvider');
    return context;
}
