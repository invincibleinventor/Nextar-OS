'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useDevice } from '../DeviceContext';
import { filesystemitem } from '../data';
import { useFileSystem } from '../FileSystemContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useAuth } from '../AuthContext';
import { iselectron, terminal as nativeterminal, getsysteminfo } from '@/utils/platform';

export default function Terminal({ isFocused = true, appId = 'terminal' }: { isFocused?: boolean, appId?: string }) {
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const { user, isGuest } = useAuth();

    const username = user?.username || 'guest';
    const userhomeid = isGuest ? 'user-guest' : `user-${username}`;
    const userhomepath = isGuest ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));

    const [history, sethistory] = useState<string[]>([]);
    const [currline, setcurrline] = useState('');
    const [cwd, setcwd] = useState(iselectron ? '' : userhomeid);
    const [nativecwd, setnativecwd] = useState('');
    const [fontSize, setFontSize] = useState(13);
    const [isrunning, setisrunning] = useState(false);
    const [hostname, sethostname] = useState('nextardev');

    useEffect(() => {
        if (iselectron) {
            getsysteminfo().then(info => {
                if (info?.homedir) setnativecwd(info.homedir);
                if (info?.hostname) sethostname(info.hostname);
            });
            sethistory([
                `NextarDE Terminal • Native Shell Mode`,
                `Running real bash commands on host system`,
                ''
            ]);
        } else {
            sethistory([
                'NextarOS Terminal v1.0 (Web Demo)',
                'Type "help" for available commands.',
                ''
            ]);
        }
    }, []);

    const menuActions = useMemo(() => ({
        'clear': () => { sethistory([]); setcurrline(''); },
        'copy': () => {
            const selection = window.getSelection()?.toString();
            if (selection) navigator.clipboard.writeText(selection);
        },
        'paste': () => {
            navigator.clipboard.readText().then(text => {
                setcurrline(prev => prev + text);
                inputref.current?.focus();
            });
        },
        'select-all': () => {
            if (containerref.current) {
                const range = document.createRange();
                range.selectNodeContents(containerref.current);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        },
        'zoom-in': () => setFontSize(s => Math.min(s + 2, 24)),
        'zoom-out': () => setFontSize(s => Math.max(s - 2, 10)),
    }), []);

    const terminalMenus = useMemo(() => ({
        Edit: [
            { title: "Copy", actionId: "copy", shortcut: "⌘C" },
            { title: "Paste", actionId: "paste", shortcut: "⌘V" },
            { title: "Select All", actionId: "select-all", shortcut: "⌘A" },
            { separator: true },
            { title: "Clear Buffer", actionId: "clear", shortcut: "⌘K" }
        ],
        View: [
            { title: "Increase Font Size", actionId: "zoom-in", shortcut: "⌘+" },
            { title: "Decrease Font Size", actionId: "zoom-out", shortcut: "⌘-" }
        ]
    }), []);

    useMenuRegistration(terminalMenus, isFocused);
    useMenuAction(appId, menuActions);

    const containerref = useRef<HTMLDivElement>(null);
    const endref = useRef<HTMLDivElement>(null);
    const inputref = useRef<HTMLInputElement>(null);
    const [canedit, setcanedit] = useState(!ismobile);

    useEffect(() => {
        if (isFocused && !ismobile) {
            const timer = setTimeout(() => inputref.current?.focus(), 10);
            return () => clearTimeout(timer);
        } else {
            inputref.current?.blur();
        }
    }, [isFocused, ismobile]);

    const getPathString = (id: string): string => {
        if (id === userhomeid) return '~';
        let currentId = id;
        const path: string[] = [];
        let iterations = 0;
        while (currentId !== 'root' && currentId !== userhomeid && iterations < 20) {
            const item = files.find(i => i.id === currentId);
            if (!item) break;
            path.unshift(item.name);
            if (!item.parent) break;
            currentId = item.parent;
            iterations++;
        }
        if (currentId === userhomeid) return '~/' + path.join('/');
        return '/' + path.join('/');
    };

    const getDirectoryItems = (dirId: string) => files.filter(item => item.parent === dirId && !item.isTrash);

    const resolvePath = (pathArg: string): string | null => {
        if (!pathArg || pathArg === '.') return cwd;
        if (pathArg === '~') return userhomeid;
        let startId = cwd;
        let parts = pathArg.split('/').filter(p => p.length > 0);
        if (pathArg.startsWith('/')) {
            startId = 'root';
        } else if (pathArg.startsWith('~/')) {
            startId = userhomeid;
            parts = pathArg.slice(2).split('/').filter(p => p.length > 0);
        }
        let currentId = startId;
        for (const part of parts) {
            if (part === '..') {
                const currentItem = files.find((i: filesystemitem) => i.id === currentId);
                if (currentItem && currentItem.parent) currentId = currentItem.parent;
            } else if (part !== '.') {
                const child = files.find((i: filesystemitem) => i.parent === currentId && i.name === part);
                if (child && (child.mimetype === 'inode/directory' || child.mimetype === 'inode/directory-alias')) {
                    currentId = child.id;
                } else {
                    return null;
                }
            }
        }
        return currentId;
    };

    const resolveFile = (pathArg: string): filesystemitem | null => {
        const parts = pathArg.split('/');
        const fileName = parts.pop();
        const dirPath = parts.join('/');
        const dirId = dirPath.length > 0 ? resolvePath(dirPath) : cwd;
        if (!dirId || !fileName) return null;
        return files.find((i: filesystemitem) => i.parent === dirId && i.name === fileName) || null;
    };

    const executeNativeCommand = useCallback(async (command: string) => {
        setisrunning(true);

        if (command === 'clear') {
            sethistory([]);
            setcurrline('');
            setisrunning(false);
            return;
        }

        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];

        if (cmd === 'cd') {
            const target = parts[1] || '~';
            let newdir = target;
            if (target === '~') {
                const info = await getsysteminfo();
                newdir = info?.homedir || '/home';
            } else if (!target.startsWith('/')) {
                newdir = nativecwd + '/' + target;
            }

            const result = await nativeterminal.execute(`cd "${newdir}" && pwd`, nativecwd);
            if (result.success && result.stdout.trim()) {
                setnativecwd(result.stdout.trim());
                sethistory(prev => [...prev, '']);
            } else {
                sethistory(prev => [...prev, `cd: ${target}: No such file or directory`, '']);
            }
            setisrunning(false);
            return;
        }

        const result = await nativeterminal.execute(command, nativecwd);
        const output = result.stdout + (result.stderr ? `\n${result.stderr}` : '');

        sethistory(prev => [...prev, ...(output ? output.split('\n') : []), '']);
        setisrunning(false);
    }, [nativecwd]);

    const executeVirtualCommand = useCallback((cmd: string, args: string[]) => {
        const arg1 = args[1];
        let response = '';

        switch (cmd) {
            case 'help':
                response = 'Commands: ls, cd, cat, pwd, clear, whoami, about, skills, projects, contact';
                break;
            case 'ls':
                const targetDir = arg1 ? resolvePath(arg1) : cwd;
                if (targetDir) {
                    const items = getDirectoryItems(targetDir);
                    if (items.length === 0) {
                        response = '(empty)';
                    } else {
                        const outputItems = items.map(i => i.mimetype === 'inode/directory' ? `${i.name}/` : i.name);
                        response = 'LS_OUTPUT:' + outputItems.join('  ');
                    }
                } else {
                    response = `ls: ${arg1}: No such file or directory`;
                }
                break;
            case 'cd':
                if (!args[1]) {
                    setcwd(userhomeid);
                } else {
                    const newId = resolvePath(arg1);
                    if (newId) setcwd(newId);
                    else response = `cd: ${arg1}: No such file or directory`;
                }
                break;
            case 'pwd':
                response = getPathString(cwd).replace('~', `/Users/${userhomepath}`);
                break;
            case 'cat':
                if (!arg1) {
                    response = 'cat: missing filename';
                } else {
                    const file = resolveFile(arg1);
                    if (file) {
                        if (file.mimetype === 'inode/directory') response = `cat: ${file.name}: Is a directory`;
                        else response = file.content || file.description || '(empty)';
                    } else {
                        response = `cat: ${arg1}: No such file or directory`;
                    }
                }
                break;
            case 'about':
                response = 'Full Stack Developer with a passion for pixel-perfect interfaces and clean code.';
                break;
            case 'skills':
                response = 'React • Next.js • TypeScript • Tailwind CSS • Node.js • Python • AI/ML';
                break;
            case 'projects':
                response = 'Visit the Explorer app to browse my projects.';
                break;
            case 'contact':
                response = 'Email: invincibleinventor@gmail.com';
                break;
            case 'whoami':
                response = `${username}@nextardev`;
                break;
            case 'clear':
                sethistory([]);
                setcurrline('');
                return null;
            case '':
                return '';
            default:
                response = `zsh: command not found: ${cmd}`;
        }
        return response;
    }, [cwd, files, username, userhomeid, userhomepath]);

    const handlekey = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isrunning) {
            const cmd = currline.trim();
            const promptPath = iselectron
                ? nativecwd.replace(/^\/home\/[^/]+/, '~')
                : getPathString(cwd);
            const fullPrompt = `${username}@${hostname} ${promptPath} $ ${currline}`;

            sethistory(prev => [...prev, fullPrompt]);
            setcurrline('');

            if (iselectron) {
                await executeNativeCommand(cmd);
            } else {
                const argsRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
                const args: string[] = [];
                let match;
                while ((match = argsRegex.exec(cmd)) !== null) {
                    args.push(match[1] || match[2] || match[0]);
                }
                const command = args[0] ? args[0].toLowerCase() : '';
                const response = executeVirtualCommand(command, args);
                if (response !== null) {
                    sethistory(prev => [...prev, response, '']);
                }
            }
        }
    };

    useEffect(() => {
        if (isFocused && containerref.current) {
            containerref.current.scrollTop = containerref.current.scrollHeight;
        }
    }, [history, isFocused]);

    const renderLine = (line: string, isLsOutput: boolean = false) => {
        if (isLsOutput) {
            return line.split('  ').map((item, idx) => {
                const isDir = item.endsWith('/');
                return (
                    <span key={idx}>
                        {isDir ? <span className="text-pastel-blue font-bold">{item}</span> : <span>{item}</span>}
                        {idx < line.split('  ').length - 1 && '  '}
                    </span>
                );
            });
        }
        return <span>{line}</span>;
    };

    const promptPath = iselectron
        ? nativecwd.replace(/^\/home\/[^/]+/, '~') || '~'
        : getPathString(cwd);

    return (
        <div
            ref={containerref}
            className={`h-full w-full bg-[--bg-base] text-[--text-color] p-4 overflow-y-auto cursor-text`}
            onClick={() => {
                if (ismobile) setcanedit(true);
                inputref.current?.focus();
            }}
        >
            <div className="font-mono leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                {history.map((line, i) => (
                    <div key={i} className="min-h-[20px] whitespace-pre-wrap break-all">
                        {line.includes(`@${hostname}`) && line.includes('$') ? (
                            <span>
                                <span className="text-pastel-green">{line.split('@')[0]}</span>
                                <span className="text-[--text-color]">@</span>
                                <span className="text-pastel-blue">{hostname}</span>
                                <span className="text-[--text-color]"> {line.split(`@${hostname} `)[1]?.split(' $')[0] || ''} </span>
                                <span className="text-[--text-color]">$ </span>
                                <span className="text-[--text-color]">{line.split('$')[1] || ''}</span>
                            </span>
                        ) : (
                            <span className="text-[--text-color]">
                                {line.startsWith('LS_OUTPUT:')
                                    ? renderLine(line.replace('LS_OUTPUT:', ''), true)
                                    : renderLine(line)}
                            </span>
                        )}
                    </div>
                ))}
                <div className="flex items-center">
                    <span className="text-pastel-green">{username}</span>
                    <span className="text-[--text-color]">@</span>
                    <span className="text-pastel-blue">{hostname}</span>
                    <span className="text-[--text-color]"> {promptPath} </span>
                    <span className="text-[--text-color]">$ </span>
                    <input
                        ref={inputref}
                        className="flex-1 bg-transparent outline-none text-[--text-color] font-mono ml-2"
                        value={currline}
                        onChange={(e) => setcurrline(e.target.value)}
                        onKeyDown={handlekey}
                        spellCheck={false}
                        readOnly={(!canedit && ismobile) || isrunning}
                        autoComplete="off"
                        disabled={isrunning}
                    />
                    {isrunning && <span className="text-pastel-yellow animate-pulse ml-2">⏳</span>}
                </div>
                <div ref={endref} />
            </div>
        </div>
    );
}
