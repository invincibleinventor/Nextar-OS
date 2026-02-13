'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import '@xterm/xterm/css/xterm.css';

interface WebContainerTerminalProps {
    className?: string;
    fontSize?: number;
    /** Project files to mount (flat map: path → content) */
    files?: Record<string, string>;
    /** Called when dev server is ready with its URL */
    onServerReady?: (url: string, port: number) => void;
    /** Called when terminal is ready */
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

export default function WebContainerTerminal({ className = '', fontSize = 12, files, onServerReady, onReady }: WebContainerTerminalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<any>(null);
    const fitRef = useRef<any>(null);
    const wcRef = useRef<any>(null);
    const shellRef = useRef<any>(null);
    const mountedRef = useRef(false);

    const boot = useCallback(async () => {
        if (!containerRef.current || mountedRef.current) return;
        mountedRef.current = true;

        // Dynamic imports to avoid SSR issues
        const [{ Terminal }, { FitAddon }, wcMod] = await Promise.all([
            import('@xterm/xterm'),
            import('@xterm/addon-fit'),
            import('../../lib/runtimes/webcontainer'),
        ]);

        const term = new Terminal({
            theme: XTERM_THEME,
            fontSize,
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
            cursorBlink: true,
            convertEol: true,
            allowProposedApi: true,
        });

        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(containerRef.current!);
        fit.fit();

        termRef.current = term;
        fitRef.current = fit;

        term.writeln('\x1b[36m  WebContainer Terminal\x1b[0m');
        term.writeln('\x1b[90m  Node.js environment — npm, node, npx available\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[33m  Booting WebContainer...\x1b[0m');

        try {
            // Boot WebContainer
            const container = await wcMod.bootWebContainer();
            wcRef.current = container;

            // Mount project files if provided
            if (files && Object.keys(files).length > 0) {
                await wcMod.mountFiles(files);
                term.writeln('\x1b[32m  Project files mounted.\x1b[0m');
            }

            // Listen for dev server
            if (onServerReady) {
                container.on('server-ready', (port: number, url: string) => {
                    term.writeln(`\x1b[32m  Dev server ready at ${url} (port ${port})\x1b[0m`);
                    onServerReady(url, port);
                });
            }

            // Spawn jsh (JavaScript Shell) - interactive shell for WebContainers
            const shellProcess = await container.spawn('jsh', {
                terminal: { cols: term.cols, rows: term.rows },
            });
            shellRef.current = shellProcess;

            // Pipe shell output to xterm
            shellProcess.output.pipeTo(new WritableStream({
                write(data) { term.write(data); },
            }));

            // Pipe xterm input to shell
            const input = shellProcess.input.getWriter();
            term.onData((data: string) => { input.write(data); });

            // Handle resize
            term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
                shellProcess.resize?.({ cols, rows });
            });

            term.writeln('\x1b[32m  Ready.\x1b[0m');
            term.writeln('');
            onReady?.();
        } catch (err: any) {
            term.writeln(`\x1b[31m  Failed to boot: ${err.message}\x1b[0m`);
            term.writeln('\x1b[90m  WebContainers require cross-origin isolation headers.\x1b[0m');
            term.writeln('\x1b[90m  Ensure COOP: same-origin and COEP: require-corp are set.\x1b[0m');
        }
    }, [fontSize, files, onServerReady, onReady]);

    useEffect(() => {
        boot();
        return () => {
            termRef.current?.dispose();
            mountedRef.current = false;
        };
    }, [boot]);

    // Handle container resize
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(() => { fitRef.current?.fit(); });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Remount files when they change
    useEffect(() => {
        if (!wcRef.current || !files || !mountedRef.current) return;
        import('../../lib/runtimes/webcontainer').then(mod => {
            mod.mountFiles(files).catch(() => {});
        });
    }, [files]);

    return (
        <div ref={containerRef} className={`w-full h-full bg-[#1e2030] ${className}`} />
    );
}
