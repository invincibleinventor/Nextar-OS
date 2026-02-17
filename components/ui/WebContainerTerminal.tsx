'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import '@xterm/xterm/css/xterm.css';
import { parseInstallCommand, analyzePackage, formatSize, getHealthRating } from '../../lib/dependencyRadar';

interface WebContainerTerminalProps {
    className?: string;
    fontSize?: number;
    files?: Record<string, string>;
    onServerReady?: (url: string, port: number) => void;
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

    // Use refs for callback/data props to prevent re-triggering boot on every render
    const filesRef = useRef(files);
    const onServerReadyRef = useRef(onServerReady);
    const onReadyRef = useRef(onReady);
    useEffect(() => { filesRef.current = files; }, [files]);
    useEffect(() => { onServerReadyRef.current = onServerReady; }, [onServerReady]);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    const boot = useCallback(async () => {
        if (!containerRef.current || mountedRef.current) return;
        mountedRef.current = true;

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
            const container = await wcMod.bootWebContainer();
            wcRef.current = container;

            const initialFiles = filesRef.current;
            if (initialFiles && Object.keys(initialFiles).length > 0) {
                await wcMod.mountFiles(initialFiles);
                term.writeln('\x1b[32m  Project files mounted.\x1b[0m');
            }

            container.on('server-ready', (port: number, url: string) => {
                term.writeln(`\x1b[32m  Dev server ready at ${url} (port ${port})\x1b[0m`);
                onServerReadyRef.current?.(url, port);
            });

            const shellProcess = await container.spawn('jsh', {
                terminal: { cols: term.cols, rows: term.rows },
            });
            shellRef.current = shellProcess;

            shellProcess.output.pipeTo(new WritableStream({
                write(data) { term.write(data); },
            }));

            const input = shellProcess.input.getWriter();
            let cmdBuffer = '';
            term.onData((data: string) => {
                input.write(data);
                if (data === '\r' || data === '\n') {
                    const packages = parseInstallCommand(cmdBuffer.trim());
                    if (packages.length > 0) {
                        Promise.all(packages.map(p => analyzePackage(p))).then(reports => {
                            for (const r of reports) {
                                const health = getHealthRating(r);
                                const color = health === 'good' ? '32' : health === 'warn' ? '33' : '31';
                                const size = r.bundleSize ? formatSize(r.bundleSize) : '?';
                                term.writeln(`\x1b[${color}m  [radar] ${r.name}: ${size} gzip, health: ${health}${r.deprecated ? ' (DEPRECATED)' : ''}\x1b[0m`);
                            }
                        }).catch(() => {});
                    }
                    cmdBuffer = '';
                } else if (data === '\x7f') {
                    cmdBuffer = cmdBuffer.slice(0, -1);
                } else {
                    cmdBuffer += data;
                }
            });

            term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
                shellProcess.resize?.({ cols, rows });
            });

            term.writeln('\x1b[32m  Ready.\x1b[0m');
            term.writeln('');
            onReadyRef.current?.();
        } catch (err: any) {
            term.writeln(`\x1b[31m  Failed to boot: ${err.message}\x1b[0m`);
            term.writeln('\x1b[90m  WebContainers require cross-origin isolation headers.\x1b[0m');
            term.writeln('\x1b[90m  Ensure COOP: same-origin and COEP: require-corp are set.\x1b[0m');
        }
    }, [fontSize]);

    useEffect(() => {
        boot();
        return () => {
            termRef.current?.dispose();
            mountedRef.current = false;
        };
    }, [boot]);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(() => { fitRef.current?.fit(); });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

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
