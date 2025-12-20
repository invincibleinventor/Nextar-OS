'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useDevice } from '../DeviceContext';
import { filesystemitem } from '../data';
import { useFileSystem } from '../FileSystemContext';
import { useMenuAction } from '../hooks/useMenuAction';

interface CommandResult {
    output: string;
    newCwd?: string;
}

export default function Terminal({ isFocused = true, appId = 'terminal' }: { isFocused?: boolean, appId?: string }) {
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const [history, sethistory] = useState(['Welcome to MacOS-Next Terminal v1.0', 'Type "help" for available commands.', '']);
    const [currline, setcurrline] = useState('');
    const [cwd, setcwd] = useState('user-bala');
    const [fontSize, setFontSize] = useState(13);

    const menuActions = React.useMemo(() => ({
        'clear': () => {
            sethistory([]);
            setcurrline('');
        },
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

    useMenuAction(appId, menuActions);

    const containerref = useRef<HTMLDivElement>(null);
    const endref = useRef<HTMLDivElement>(null);
    const inputref = useRef<HTMLInputElement>(null);

    const [canedit, setcanedit] = useState(!ismobile);

    useEffect(() => {
        if (isFocused && !ismobile) {
            const timer = setTimeout(() => {
                inputref.current?.focus();
            }, 10);
            return () => clearTimeout(timer);
        } else {
            inputref.current?.blur();
        }
    }, [isFocused, ismobile]);

    const getPathString = (id: string): string => {
        if (id === 'user-bala') return '~';

        let currentId = id;
        const path: string[] = [];

        let iterations = 0;

        while (currentId !== 'root' && currentId !== 'user-bala' && iterations < 20) {
            const item = files.find(i => i.id === currentId);
            if (!item) break;

            path.unshift(item.name);
            if (!item.parent) break;
            currentId = item.parent;
            iterations++;
        }

        if (currentId === 'user-bala') return '~/' + path.join('/');
        return '/' + path.join('/');
    };

    const getDirectoryItems = (dirId: string) => {
        return files.filter(item => item.parent === dirId && !item.isTrash);
    };

    const resolvePath = (pathArg: string): string | null => {
        if (!pathArg || pathArg === '.') return cwd;
        if (pathArg === '~') return 'user-bala';

        let startId = cwd;
        let parts = pathArg.split('/').filter(p => p.length > 0);

        if (pathArg.startsWith('/')) {
            startId = 'root';
        } else if (pathArg.startsWith('~/')) {
            startId = 'user-bala';
            parts = pathArg.slice(2).split('/').filter(p => p.length > 0);
        }

        let currentId = startId;

        for (const part of parts) {
            if (part === '..') {
                const currentItem = files.find((i: filesystemitem) => i.id === currentId);
                if (currentItem && currentItem.parent) {
                    currentId = currentItem.parent;
                }
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

    const handlekey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = currline.trim();

            const argsRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
            const args: string[] = [];
            let match;

            while ((match = argsRegex.exec(cmd)) !== null) {
                args.push(match[1] || match[2] || match[0]);
            }

            const command = args[0] ? args[0].toLowerCase() : '';
            const arg1 = args[1];

            let response = '';

            const promptPath = getPathString(cwd);
            const fullPrompt = `guest@balatbr ${promptPath} $ ${currline}`;

            switch (command) {
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
                            const outputItems = items.map(i => {
                                const isDir = i.mimetype === 'inode/directory';
                                return isDir ? `<span class="text-blue-400 font-bold">${i.name}/</span>` : i.name;
                            });
                            response = outputItems.join('  ');
                        }
                    } else {
                        response = `ls: ${arg1}: No such file or directory`;
                    }
                    break;
                case 'cd':
                    if (!args[1]) {
                        setcwd('user-bala');
                    } else {
                        const newId = resolvePath(arg1);
                        if (newId) {
                            setcwd(newId);
                        } else {
                            response = `cd: ${arg1}: No such file or directory`;
                        }
                    }
                    break;
                case 'pwd':
                    response = getPathString(cwd).replace('~', '/home/guest');
                    break;
                case 'cat':
                    if (!arg1) {
                        response = 'cat: missing filename';
                    } else {
                        const file = resolveFile(arg1);
                        if (file) {
                            if (file.mimetype === 'inode/directory') {
                                response = `cat: ${file.name}: Is a directory`;
                            } else {
                                response = file.content || file.description || '(empty)';
                            }
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
                    response = 'Visit the Finder app to browse my portfolio projects.';
                    break;
                case 'contact':
                    response = 'Email: invincibleinventor@gmail.com';
                    break;
                case 'whoami':
                    response = 'guest@balatbr';
                    break;
                case 'clear':
                    sethistory([]);
                    setcurrline('');
                    return;
                case '':
                    sethistory(prev => [...prev, `guest@balatbr ${promptPath} $`, '']);
                    setcurrline('');
                    return;
                default:
                    response = `zsh: command not found: ${command}`;
            }

            sethistory(prev => [...prev, fullPrompt, response, '']);
            setcurrline('');
        }
    };

    useEffect(() => {
        if (isFocused && containerref.current) {
            containerref.current.scrollTop = containerref.current.scrollHeight;
        }
    }, [history, isFocused]);

    const renderLine = (line: string) => {
        if (line.includes('<span')) {
            return <span dangerouslySetInnerHTML={{ __html: line }} />;
        }
        return <span>{line}</span>;
    };

    return (
        <div
            ref={containerref}
            className={`h-full ${ismobile ? '' : 'pt-[50px]'} w-full bg-[#1e1e1e] text-[#cccccc] p-4 overflow-y-auto cursor-text`}
            onClick={() => {
                if (ismobile) setcanedit(true);
                inputref.current?.focus();
            }}
        >
            <div className="font-mono leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                {history.map((line, i) => (
                    <div key={i} className="min-h-[20px] whitespace-pre-wrap break-all">
                        {line.startsWith('guest@balatbr') ? (
                            <span>
                                <span className="text-[#50fa7b]">guest</span>
                                <span className="text-white">@</span>
                                <span className="text-[#8be9fd]">balatbr</span>
                                <span className="text-white"> {line.split(' ')[1]} </span>
                                <span className="text-white">$ </span>
                                <span className="text-white">{line.split('$')[1]}</span>
                            </span>
                        ) : (
                            <span className="text-[#f8f8f2]">{renderLine(line)}</span>
                        )}
                    </div>
                ))}
                <div className="flex items-center">
                    <span className="text-[#50fa7b]">guest</span>
                    <span className="text-white">@</span>
                    <span className="text-[#8be9fd]">balatbr</span>
                    <span className="text-white"> {getPathString(cwd)} </span>
                    <span className="text-white">$ </span>
                    <input
                        ref={inputref}
                        className="flex-1 bg-transparent outline-none text-[#f8f8f2] font-mono ml-2"
                        value={currline}
                        onChange={(e) => setcurrline(e.target.value)}
                        onKeyDown={handlekey}
                        spellCheck={false}
                        readOnly={!canedit && ismobile}
                        autoComplete="off"
                    />
                </div>
                <div ref={endref} />
            </div>
        </div>
    )
}

