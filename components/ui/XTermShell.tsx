'use client';
import React, { useEffect, useRef, useState } from 'react';
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

export default function XTermShell({
    className = '', fontSize = 13, onReady,
}: XTermShellProps) {
    const termRef = useRef<HTMLDivElement>(null);
    const fitAddonRef = useRef<any>(null);
    const termInstanceRef = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);

    const { boot, attachTerminal, runShell, bootError, networkLoginUrl } = useCheerpX();

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

            // Loading indicator
            term.writeln('\x1b[33m  Booting Linux environment...\x1b[0m');

            // Boot CheerpX
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

            // Clear loading text and ensure cursor is at home position
            term.clear();
            term.write('\x1b[H');

            // Re-fit to ensure correct dimensions after clear
            fitAddon.fit();

            // Attach console with correct fitted dimensions
            const handle = attachTerminal(
                (buf: Uint8Array) => { if (mounted) term.write(buf); },
                term.cols,
                term.rows,
            );
            detach = handle.detach;

            // Forward input
            term.onData((str: string) => handle.sendInput(str));

            // Forward resize — re-fit first, then notify CheerpX
            term.onResize((dim: { cols: number; rows: number }) => handle.resize(dim.cols, dim.rows));

            setLoaded(true);
            onReady?.();

            // Start interactive shell — blocks forever for the first terminal.
            // For additional terminals, runShell() returns immediately (shell
            // is already running as a singleton), so we send a carriage return
            // to trigger a fresh prompt display in this terminal.
            await runShell();

            // If we reach here, shell was already running from another terminal
            if (mounted) handle.sendInput('\r');
        };

        init();

        // Resize observer for fit
        const resizeObs = new ResizeObserver(() => {
            if (fitAddonRef.current) {
                try { fitAddonRef.current.fit(); } catch { /* ignore */ }
            }
        });
        if (termRef.current) resizeObs.observe(termRef.current);

        return () => {
            mounted = false;
            detach?.();
            resizeObs.disconnect();
            if (term) term.dispose();
            termInstanceRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (networkLoginUrl && termInstanceRef.current) {
            const t = termInstanceRef.current;
            t.writeln('');
            t.writeln('\x1b[33m  Network: Tailscale login required for internet access.\x1b[0m');
            t.writeln(`\x1b[36m  ${networkLoginUrl}\x1b[0m`);
            t.writeln('');
        }
    }, [networkLoginUrl]);

    return (
        <div
            ref={termRef}
            className={`w-full h-full ${className}`}
            style={{ background: '#1e2030' }}
        />
    );
}
