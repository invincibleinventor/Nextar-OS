'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCheerpX } from '../CheerpXContext';
import {
    IoDesktopOutline, IoTerminalOutline, IoPlayOutline,
    IoHourglassOutline, IoRocketOutline,
} from 'react-icons/io5';
import { FaSpinner } from 'react-icons/fa';

export default function LinuxDisplay() {
    const { kmsCanvasRef, isXorgRunning, startXorg, launchGuiApp, isBooted, boot } = useCheerpX();
    const containerRef = useRef<HTMLDivElement>(null);
    const localCanvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setloading] = useState(false);
    const [appcmd, setappcmd] = useState('');
    const [status, setstatus] = useState('');

    useEffect(() => {
        if (!isBooted) {
            boot().catch(() => { });
        }
    }, [isBooted, boot]);

    useEffect(() => {
        if (kmsCanvasRef.current && localCanvasRef.current && containerRef.current) {
            const source = kmsCanvasRef.current;
            const dest = localCanvasRef.current;
            const ctx = dest.getContext('2d');
            if (!ctx) return;

            let animframe: number;
            const draw = () => {
                dest.width = containerRef.current?.clientWidth || 1024;
                dest.height = containerRef.current?.clientHeight ? containerRef.current.clientHeight - 80 : 768;
                ctx.drawImage(source, 0, 0, dest.width, dest.height);
                animframe = requestAnimationFrame(draw);
            };
            draw();
            return () => cancelAnimationFrame(animframe);
        }
    }, [kmsCanvasRef, isXorgRunning]);

    const handlestartxorg = useCallback(async () => {
        setloading(true);
        setstatus('Installing Xorg (this may take a few minutes on first run)...');
        try {
            await startXorg();
            setstatus('Xorg is running');
        } catch {
            setstatus('Failed to start Xorg');
        }
        setloading(false);
    }, [startXorg]);

    const handlelaunchapp = useCallback(async () => {
        if (!appcmd.trim()) return;
        setstatus(`Launching ${appcmd}...`);
        await launchGuiApp(appcmd.trim());
        setstatus(`${appcmd} launched`);
        setappcmd('');
    }, [appcmd, launchGuiApp]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col bg-[--bg-base] text-[--text-color] font-sans overflow-hidden"
        >
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[--bg-surface] border-b border-[--border-color] shrink-0">
                {!isXorgRunning ? (
                    <button
                        onClick={handlestartxorg}
                        disabled={loading || !isBooted}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-pastel-green text-[--bg-base] font-semibold text-xs transition-all ${
                            loading ? 'opacity-60 cursor-wait' : 'hover:opacity-90 cursor-pointer'
                        }`}
                    >
                        {loading ? (
                            <FaSpinner className="animate-spin" size={11} />
                        ) : (
                            <IoPlayOutline size={12} />
                        )}
                        {loading ? 'Starting...' : 'Start X Server'}
                    </button>
                ) : (
                    <>
                        <input
                            type="text"
                            value={appcmd}
                            onChange={e => setappcmd(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlelaunchapp()}
                            placeholder="Command (e.g. xterm, xeyes)"
                            className="flex-1 px-2.5 py-1.5 rounded-md bg-[--bg-overlay] text-[--text-color] border border-[--border-color] text-xs outline-none focus:border-pastel-blue transition-colors placeholder:text-[--text-muted]"
                        />
                        <button
                            onClick={handlelaunchapp}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-pastel-blue text-[--bg-base] font-semibold text-xs hover:opacity-90 cursor-pointer transition-opacity"
                        >
                            <IoRocketOutline size={12} />
                            Launch
                        </button>
                    </>
                )}
                {status && (
                    <span className="text-[11px] text-[--text-muted] ml-auto truncate max-w-[200px]">
                        {status}
                    </span>
                )}
            </div>

            {/* Canvas / Placeholder Area */}
            <div className="flex-1 relative overflow-hidden">
                {!isXorgRunning && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[--text-muted]">
                        <div className="bg-[--bg-surface] p-4 rounded-2xl border border-[--border-color]">
                            <IoDesktopOutline size={36} className="opacity-50" />
                        </div>
                        <p className="text-sm font-medium">Click &quot;Start X Server&quot; to enable GUI applications</p>
                        <p className="text-[11px] max-w-[400px] text-center leading-relaxed">
                            This will install and start Xorg inside the Linux VM.
                            Once running, type a command like{' '}
                            <code className="text-pastel-blue font-mono">xterm</code> or{' '}
                            <code className="text-pastel-blue font-mono">xeyes</code>{' '}
                            to launch GUI apps.
                        </p>
                    </div>
                )}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-pastel-yellow">
                        <div className="text-center flex flex-col items-center gap-2">
                            <IoHourglassOutline size={28} className="animate-pulse" />
                            <p className="text-sm">{status || 'Setting up display...'}</p>
                        </div>
                    </div>
                )}
                <canvas
                    ref={localCanvasRef}
                    className={`w-full h-full ${isXorgRunning ? 'block' : 'hidden'}`}
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        </div>
    );
}
