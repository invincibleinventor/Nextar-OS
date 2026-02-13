'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useCheerpX } from '../CheerpXContext';

interface XTermShellProps {
    className?: string;
    fontSize?: number;
    onReady?: () => void;
}

const XTERM_THEME = {
    background: '#1e2030',
    foreground: '#cad3f5',
    cursor: '#f5a97f',
    cursorAccent: '#1e2030',
    selectionBackground: '#363a4f',
    selectionForeground: '#cad3f5',
    black: '#1e2030',
    red: '#ed8796',
    green: '#a6da95',
    yellow: '#eed49f',
    blue: '#8aadf4',
    magenta: '#c6a0f6',
    cyan: '#8bd5ca',
    white: '#cad3f5',
    brightBlack: '#6e738d',
    brightRed: '#ed8796',
    brightGreen: '#a6da95',
    brightYellow: '#eed49f',
    brightBlue: '#8aadf4',
    brightMagenta: '#c6a0f6',
    brightCyan: '#8bd5ca',
    brightWhite: '#cad3f5',
};

function NetworkBadge() {
    const { networkLoginUrl, networkState, connectNetwork } = useCheerpX();

    if (networkState === 'disconnected') {
        return (
            <button
                onClick={connectNetwork}
                className="px-2 py-0.5 text-[10px] rounded bg-[--bg-overlay] text-pastel-teal hover:bg-[--border-color] transition-colors border border-[--border-color]"
            >
                Connect to Internet
            </button>
        );
    }
    if (networkState === 'connecting') {
        return (
            <span className="px-2 py-0.5 text-[10px] rounded bg-[--bg-overlay] text-pastel-yellow border border-[--border-color]">
                Connecting...
            </span>
        );
    }
    if (networkState === 'login-ready') {
        return (
            <button
                onClick={() => networkLoginUrl && window.open(networkLoginUrl, '_blank')}
                className="px-2 py-0.5 text-[10px] rounded bg-[--bg-overlay] text-pastel-yellow hover:bg-[--border-color] transition-colors border border-[--border-color] animate-pulse"
            >
                Open Tailscale Login
            </button>
        );
    }
    if (networkState === 'connected') {
        return (
            <span className="px-2 py-0.5 text-[10px] rounded bg-[--bg-overlay] text-pastel-green border border-[--border-color]">
                Online
            </span>
        );
    }
    return null;
}

function TmuxSessionBar({ termhandleref, loaded }: { termhandleref: React.RefObject<any>, loaded: boolean }) {
    const [sessions, setsessions] = useState<string[]>(['main']);
    const [activesession, setactivesession] = useState(0);

    const sendtmuxkey = useCallback((cmd: string) => {
        const handle = termhandleref.current;
        if (!handle?.sendInput) return;
        handle.sendInput('\x02');
        setTimeout(() => {
            handle.sendInput(cmd);
        }, 50);
    }, [termhandleref]);

    const addsession = useCallback(() => {
        const name = `s${sessions.length}`;
        setsessions(prev => [...prev, name]);
        setactivesession(sessions.length);
        sendtmuxkey('c');
    }, [sessions, sendtmuxkey]);

    const switchsession = useCallback((index: number) => {
        if (index === activesession) return;
        setactivesession(index);
        sendtmuxkey(String(index));
    }, [activesession, sendtmuxkey]);

    if (!loaded) return null;

    return (
        <div className="flex items-center gap-1 px-2 py-1 bg-[--bg-surface] border-b border-[--border-color] text-[11px] font-mono">
            {sessions.map((name, i) => (
                <button
                    key={i}
                    onClick={() => switchsession(i)}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer border-none ${
                        i === activesession
                            ? 'bg-[--bg-overlay] text-[--text-color]'
                            : 'bg-transparent text-[--text-muted] hover:text-[--text-color]'
                    }`}
                >
                    {i + 1}: {name}
                </button>
            ))}
            <button
                onClick={addsession}
                className="px-1.5 py-0.5 rounded bg-transparent text-pastel-teal border border-[--border-color] cursor-pointer text-[11px] hover:bg-[--bg-overlay] transition-colors"
            >
                +
            </button>
        </div>
    );
}

export default function XTermShell({
    className = '', fontSize = 13, onReady,
}: XTermShellProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<HTMLDivElement>(null);
    const fitAddonRef = useRef<any>(null);
    const termInstanceRef = useRef<any>(null);
    const termHandleRef = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);

    const { boot, attachTerminal, runShell, bootError, networkLoginUrl, networkState } = useCheerpX();

    useEffect(() => {
        let mounted = true;
        let term: any = null;
        let detach: (() => void) | null = null;

        const init = async () => {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            const { WebLinksAddon } = await import('@xterm/addon-web-links');

            if (!mounted || !termRef.current) return;

            term = new Terminal({
                theme: XTERM_THEME,
                fontSize,
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                cursorBlink: true,
                cursorStyle: 'block',
                scrollback: 10000,
                allowProposedApi: true,
                convertEol: true,
            });

            termInstanceRef.current = term;

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.loadAddon(new WebLinksAddon());
            term.open(termRef.current);
            fitAddon.fit();
            fitAddonRef.current = fitAddon;

            term.writeln('\x1b[33m  Booting Linux environment...\x1b[0m');

            try {
                await boot(term.cols, term.rows);
            } catch (err: any) {
                if (!mounted) return;
                const msg = err?.message || String(err) || bootError || 'Unknown error';
                term.writeln('');
                term.writeln(`\x1b[31m  Boot failed: ${msg}\x1b[0m`);
                term.writeln('\x1b[90m  Your browser needs SharedArrayBuffer support.\x1b[0m');
                term.writeln('\x1b[90m  Try reloading — the service worker needs one page load.\x1b[0m');
                return;
            }

            if (!mounted) return;

            term.clear();
            term.write('\x1b[H');

            fitAddon.fit();

            const handle = attachTerminal(
                (buf: Uint8Array) => { if (mounted) term.write(buf); },
                term.cols,
                term.rows,
            );
            detach = handle.detach;
            termHandleRef.current = handle;

            term.onData((str: string) => handle.sendInput(str));
            term.onResize((dim: { cols: number; rows: number }) => handle.resize(dim.cols, dim.rows));

            setLoaded(true);
            onReady?.();

            await runShell();

            if (mounted) handle.sendInput('\r');
        };

        init();

        const resizeObs = new ResizeObserver(() => {
            if (fitAddonRef.current) {
                try { fitAddonRef.current.fit(); } catch { }
            }
        });
        if (wrapperRef.current) resizeObs.observe(wrapperRef.current);

        return () => {
            mounted = false;
            detach?.();
            resizeObs.disconnect();
            if (term) term.dispose();
            termInstanceRef.current = null;
            termHandleRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (networkLoginUrl && termInstanceRef.current && loaded) {
            const t = termInstanceRef.current;
            t.writeln('');
            t.writeln('\x1b[33m  Network: Tailscale login required for internet access.\x1b[0m');
            t.writeln('\x1b[33m  A login page has been opened in a new tab.\x1b[0m');
            t.writeln('\x1b[33m  If it didn\'t open, click the URL below (free account):\x1b[0m');
            t.writeln(`\x1b[4;36m  ${networkLoginUrl}\x1b[0m`);
            t.writeln('');
            console.log('[HackathOS] Tailscale login URL:', networkLoginUrl);
            window.open(networkLoginUrl, '_blank');
        }
    }, [networkLoginUrl, loaded]);

    useEffect(() => {
        if (networkState === 'connected' && termInstanceRef.current && loaded) {
            const t = termInstanceRef.current;
            t.writeln('');
            t.writeln('\x1b[32m  Network connected! You can now use apt, curl, pip, etc.\x1b[0m');
            t.writeln('');
        }
    }, [networkState, loaded]);

    return (
        <div
            ref={wrapperRef}
            className={`w-full h-full bg-[--bg-surface] relative flex flex-col ${className}`}
        >
            <TmuxSessionBar termhandleref={termHandleRef} loaded={loaded} />

            <div
                ref={termRef}
                className="flex-1 min-h-0"
            />
            {loaded && (
                <div className="absolute top-[30px] right-2 z-10 pointer-events-auto">
                    <NetworkBadge />
                </div>
            )}
        </div>
    );
}
