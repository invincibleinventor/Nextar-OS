'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useDevice } from '../DeviceContext';
import { filesystemitem } from '../data';
import { useFileSystem } from '../FileSystemContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useAuth } from '../AuthContext';
import { iselectron, terminal as nativeterminal, getsysteminfo } from '@/utils/platform';

const DEFAULT_ZSHRC = `# NextarOS Shell Configuration (.zshrc)
# Edit this file to customize your terminal experience
# Changes apply on next terminal launch

# Prompt style: powerline | minimal | classic
PROMPT_STYLE=powerline

# Show system info banner on startup (neofetch-style)
MOTD=true

# Aliases
alias ll="ls -la"
alias ..="cd .."
alias cls="clear"
alias q="exit"

# Custom startup commands (one per line below this comment)
# echo "Hello from .zshrc!"
`;

const NEOFETCH_ART = [
    '\x1b[36m',
    '       ╔═══════════════════╗',
    '       ║                   ║',
    '       ║    ███╗   ██╗     ║',
    '       ║    ████╗  ██║     ║',
    '       ║    ██╔██╗ ██║     ║',
    '       ║    ██║╚██╗██║     ║',
    '       ║    ██║ ╚████║     ║',
    '       ║    ╚═╝  ╚═══╝     ║',
    '       ║                   ║',
    '       ╚═══════════════════╝',
    '\x1b[0m',
];

interface ZshConfig {
    promptStyle: 'powerline' | 'minimal' | 'classic';
    showMotd: boolean;
    aliases: Record<string, string>;
    startupCommands: string[];
}

function parseZshrc(content: string): ZshConfig {
    const config: ZshConfig = {
        promptStyle: 'powerline',
        showMotd: true,
        aliases: {},
        startupCommands: [],
    };

    const lines = content.split('\n');
    let pastConfig = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed === '') continue;

        const aliasMatch = trimmed.match(/^alias\s+(\w+)="(.+)"$/);
        if (aliasMatch) {
            config.aliases[aliasMatch[1]] = aliasMatch[2];
            continue;
        }

        if (trimmed.startsWith('PROMPT_STYLE=')) {
            const val = trimmed.split('=')[1]?.trim().toLowerCase();
            if (val === 'minimal' || val === 'classic' || val === 'powerline') config.promptStyle = val;
            continue;
        }

        if (trimmed.startsWith('MOTD=')) {
            config.showMotd = trimmed.split('=')[1]?.trim().toLowerCase() === 'true';
            continue;
        }

        if (trimmed.startsWith('# Custom startup commands')) {
            pastConfig = true;
            continue;
        }

        if (pastConfig && !trimmed.startsWith('#')) {
            config.startupCommands.push(trimmed);
        }
    }

    return config;
}

interface TerminalLine {
    text: string;
    type: 'output' | 'prompt' | 'info' | 'error' | 'accent' | 'muted' | 'neofetch';
}

export default function Terminal({ isFocused = true, appId = 'terminal' }: { isFocused?: boolean, appId?: string }) {
    const { ismobile } = useDevice();
    const { files, createFile, updateFileContent } = useFileSystem();
    const { user, isGuest } = useAuth();

    const username = user?.username || 'guest';
    const userhomeid = isGuest ? 'user-guest' : `user-${username}`;
    const userhomepath = isGuest ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));

    const MAX_HISTORY_LINES = 5000;
    const MAX_CMD_HISTORY = 500;

    const [history, sethistory] = useState<TerminalLine[]>([]);
    const [currline, setcurrline] = useState('');
    const [cwd, setcwd] = useState(iselectron ? '' : userhomeid);
    const [nativecwd, setnativecwd] = useState('');
    const [fontSize, setFontSize] = useState(13);
    const [isrunning, setisrunning] = useState(false);
    const [hostname, sethostname] = useState('nextardev');
    const [cmdhistory, setcmdhistory] = useState<string[]>([]);
    const [historyindex, sethistoryindex] = useState(-1);
    const [zshconfig, setzshconfig] = useState<ZshConfig>({ promptStyle: 'powerline', showMotd: true, aliases: {}, startupCommands: [] });
    const [initialized, setinitialized] = useState(false);

    const appendHistory = useCallback((newLines: TerminalLine[]) => {
        sethistory(prev => {
            const combined = [...prev, ...newLines];
            return combined.length > MAX_HISTORY_LINES ? combined.slice(combined.length - MAX_HISTORY_LINES) : combined;
        });
    }, [MAX_HISTORY_LINES]);

    const containerref = useRef<HTMLDivElement>(null);
    const endref = useRef<HTMLDivElement>(null);
    const inputref = useRef<HTMLInputElement>(null);
    const [canedit, setcanedit] = useState(!ismobile);

    // Load .zshrc from filesystem
    useEffect(() => {
        if (initialized || iselectron) return;

        const zshrcFile = files.find(f => f.name === '.zshrc' && f.parent === userhomeid);

        if (zshrcFile) {
            const config = parseZshrc(zshrcFile.content || '');
            setzshconfig(config);
            buildWelcome(config);
        } else if (!isGuest) {
            // Create default .zshrc for non-guest users
            createFile('.zshrc', userhomeid, DEFAULT_ZSHRC).then(() => {
                const config = parseZshrc(DEFAULT_ZSHRC);
                setzshconfig(config);
                buildWelcome(config);
            }).catch(() => {
                buildWelcome({ promptStyle: 'powerline', showMotd: true, aliases: {}, startupCommands: [] });
            });
        } else {
            buildWelcome({ promptStyle: 'powerline', showMotd: true, aliases: {}, startupCommands: [] });
        }
        setinitialized(true);
    }, [files, userhomeid, isGuest, initialized]);

    const buildWelcome = useCallback((config: ZshConfig) => {
        const lines: TerminalLine[] = [];

        if (config.showMotd) {
            // Neofetch-style banner
            const sysInfo = [
                '',
                `  \u2588 OS      NextarOS v2.0`,
                `  \u2588 Shell   zsh 5.9`,
                `  \u2588 User    ${username}@${hostname}`,
                `  \u2588 Term    NextarOS Terminal`,
                `  \u2588 Theme   ${document?.documentElement?.classList?.contains('dark') ? 'Dark' : 'Light'}`,
                `  \u2588 Uptime  just now`,
                '',
                `  \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588`,
                '',
            ];

            NEOFETCH_ART.forEach(l => lines.push({ text: l.replace(/\x1b\[[0-9;]*m/g, ''), type: 'neofetch' }));
            sysInfo.forEach(l => lines.push({ text: l, type: 'info' }));
        } else {
            lines.push({ text: 'NextarOS Terminal v2.0', type: 'info' });
            lines.push({ text: 'Type "help" for available commands.', type: 'muted' });
            lines.push({ text: '', type: 'output' });
        }

        // Execute startup commands
        if (config.startupCommands.length > 0) {
            config.startupCommands.forEach(cmd => {
                lines.push({ text: `> ${cmd}`, type: 'muted' });
            });
            lines.push({ text: '', type: 'output' });
        }

        sethistory(lines);
    }, [username, hostname]);

    // Electron init
    useEffect(() => {
        if (!iselectron) return;
        getsysteminfo().then(info => {
            if (info?.homedir) setnativecwd(info.homedir);
            if (info?.hostname) sethostname(info.hostname);
        });
        sethistory([
            { text: 'NextarDE Terminal \u2022 Native Shell Mode', type: 'info' },
            { text: 'Running real bash commands on host system', type: 'muted' },
            { text: '', type: 'output' }
        ]);
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
            { title: "Copy", actionId: "copy", shortcut: "\u2318C" },
            { title: "Paste", actionId: "paste", shortcut: "\u2318V" },
            { title: "Select All", actionId: "select-all", shortcut: "\u2318A" },
            { separator: true },
            { title: "Clear Buffer", actionId: "clear", shortcut: "\u2318K" }
        ],
        View: [
            { title: "Increase Font Size", actionId: "zoom-in", shortcut: "\u2318+" },
            { title: "Decrease Font Size", actionId: "zoom-out", shortcut: "\u2318-" }
        ]
    }), []);

    useMenuRegistration(terminalMenus, isFocused);
    useMenuAction(appId, menuActions);

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
                appendHistory([{ text: '', type: 'output' }]);
            } else {
                appendHistory([{ text: `cd: ${target}: No such file or directory`, type: 'error' }, { text: '', type: 'output' }]);
            }
            setisrunning(false);
            return;
        }

        const result = await nativeterminal.execute(command, nativecwd);
        const output = result.stdout + (result.stderr ? `\n${result.stderr}` : '');
        const outputLines: TerminalLine[] = output ? output.split('\n').map(l => ({ text: l, type: result.stderr && l ? 'error' as const : 'output' as const })) : [];
        outputLines.push({ text: '', type: 'output' });
        appendHistory(outputLines);
        setisrunning(false);
    }, [nativecwd]);

    const executeVirtualCommand = useCallback((cmd: string, args: string[]): TerminalLine[] | null => {
        const arg1 = args[1];

        // Check aliases
        const resolvedCmd = zshconfig.aliases[cmd] || cmd;
        if (resolvedCmd !== cmd) {
            const aliasArgs = resolvedCmd.split(/\s+/);
            return executeVirtualCommand(aliasArgs[0], [...aliasArgs, ...args.slice(1)]);
        }

        switch (cmd) {
            case 'help':
                return [
                    { text: '', type: 'output' },
                    { text: '  Available Commands:', type: 'accent' },
                    { text: '  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', type: 'muted' },
                    { text: '  ls [path]          List directory contents', type: 'output' },
                    { text: '  cd <path>          Change directory', type: 'output' },
                    { text: '  cat <file>         Display file contents', type: 'output' },
                    { text: '  pwd                Print working directory', type: 'output' },
                    { text: '  whoami             Current user info', type: 'output' },
                    { text: '  clear              Clear terminal', type: 'output' },
                    { text: '  neofetch           System information', type: 'output' },
                    { text: '  echo <text>        Print text', type: 'output' },
                    { text: '  date               Current date/time', type: 'output' },
                    { text: '  uptime             Session uptime', type: 'output' },
                    { text: '  history            Command history', type: 'output' },
                    { text: '  about              About the developer', type: 'output' },
                    { text: '  skills             Technical skills', type: 'output' },
                    { text: '  projects           Browse projects', type: 'output' },
                    { text: '  contact            Contact info', type: 'output' },
                    { text: '', type: 'output' },
                    { text: `  \u2588 Aliases: ${Object.keys(zshconfig.aliases).join(', ') || 'none'}`, type: 'muted' },
                    { text: `  \u2588 Config: ~/.zshrc (${isGuest ? 'read-only' : 'editable'})`, type: 'muted' },
                    { text: '', type: 'output' },
                ];
            case 'neofetch': {
                const lines: TerminalLine[] = [];
                NEOFETCH_ART.forEach(l => lines.push({ text: l.replace(/\x1b\[[0-9;]*m/g, ''), type: 'neofetch' }));
                lines.push({ text: '', type: 'output' });
                lines.push({ text: `  \u2588 OS      NextarOS v2.0`, type: 'info' });
                lines.push({ text: `  \u2588 Shell   zsh 5.9`, type: 'info' });
                lines.push({ text: `  \u2588 User    ${username}@${hostname}`, type: 'info' });
                lines.push({ text: `  \u2588 Theme   ${document?.documentElement?.classList?.contains('dark') ? 'Dark' : 'Light'}`, type: 'info' });
                lines.push({ text: `  \u2588 Term    NextarOS Terminal`, type: 'info' });
                lines.push({ text: '', type: 'output' });
                lines.push({ text: `  \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588`, type: 'accent' });
                lines.push({ text: '', type: 'output' });
                return lines;
            }
            case 'ls': {
                const targetDir = arg1 ? resolvePath(arg1) : cwd;
                if (targetDir) {
                    const items = getDirectoryItems(targetDir);
                    if (items.length === 0) {
                        return [{ text: '(empty)', type: 'muted' }, { text: '', type: 'output' }];
                    }
                    const lines: TerminalLine[] = [{ text: '', type: 'output' }];
                    items.forEach(i => {
                        const isDir = i.mimetype === 'inode/directory';
                        const icon = isDir ? '\ud83d\udcc1' : '\ud83d\udcc4';
                        lines.push({ text: `  ${icon} ${i.name}${isDir ? '/' : ''}`, type: isDir ? 'accent' : 'output' });
                    });
                    lines.push({ text: `  \u2500\u2500\u2500 ${items.length} item${items.length !== 1 ? 's' : ''}`, type: 'muted' });
                    lines.push({ text: '', type: 'output' });
                    return lines;
                }
                return [{ text: `ls: ${arg1}: No such file or directory`, type: 'error' }, { text: '', type: 'output' }];
            }
            case 'cd':
                if (!args[1]) {
                    setcwd(userhomeid);
                } else {
                    const newId = resolvePath(arg1);
                    if (newId) setcwd(newId);
                    else return [{ text: `cd: ${arg1}: No such file or directory`, type: 'error' }, { text: '', type: 'output' }];
                }
                return [{ text: '', type: 'output' }];
            case 'pwd':
                return [{ text: getPathString(cwd).replace('~', `/Users/${userhomepath}`), type: 'output' }, { text: '', type: 'output' }];
            case 'cat':
                if (!arg1) return [{ text: 'cat: missing filename', type: 'error' }, { text: '', type: 'output' }];
                const file = resolveFile(arg1);
                if (file) {
                    if (file.mimetype === 'inode/directory') return [{ text: `cat: ${file.name}: Is a directory`, type: 'error' }, { text: '', type: 'output' }];
                    const content = file.content || file.description || '(empty)';
                    return [...content.split('\n').map(l => ({ text: l, type: 'output' as const })), { text: '', type: 'output' as const }];
                }
                return [{ text: `cat: ${arg1}: No such file or directory`, type: 'error' }, { text: '', type: 'output' }];
            case 'echo':
                return [{ text: args.slice(1).join(' '), type: 'output' }, { text: '', type: 'output' }];
            case 'date':
                return [{ text: new Date().toString(), type: 'output' }, { text: '', type: 'output' }];
            case 'uptime':
                return [{ text: `up ${Math.floor(performance.now() / 60000)} minutes`, type: 'output' }, { text: '', type: 'output' }];
            case 'history':
                return [...cmdhistory.map((c, i) => ({ text: `  ${String(i + 1).padStart(4)} ${c}`, type: 'output' as const })), { text: '', type: 'output' }];
            case 'about':
                return [{ text: 'Full Stack Developer with a passion for pixel-perfect interfaces and clean code.', type: 'info' }, { text: '', type: 'output' }];
            case 'skills':
                return [{ text: 'React \u2022 Next.js \u2022 TypeScript \u2022 Tailwind CSS \u2022 Node.js \u2022 Python \u2022 AI/ML', type: 'info' }, { text: '', type: 'output' }];
            case 'projects':
                return [{ text: 'Visit the Explorer app to browse my projects.', type: 'info' }, { text: '', type: 'output' }];
            case 'contact':
                return [{ text: 'Email: invincibleinventor@gmail.com', type: 'info' }, { text: '', type: 'output' }];
            case 'whoami':
                return [
                    { text: '', type: 'output' },
                    { text: `  \u250c\u2500 User Info \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`, type: 'muted' },
                    { text: `  \u2502 user     ${username}`, type: 'output' },
                    { text: `  \u2502 host     ${hostname}`, type: 'output' },
                    { text: `  \u2502 shell    zsh 5.9`, type: 'output' },
                    { text: `  \u2502 home     /Users/${userhomepath}`, type: 'output' },
                    { text: `  \u2502 role     ${isGuest ? 'guest' : 'admin'}`, type: 'output' },
                    { text: `  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`, type: 'muted' },
                    { text: '', type: 'output' },
                ];
            case 'clear':
                sethistory([]);
                setcurrline('');
                return null;
            case '':
                return [{ text: '', type: 'output' }];
            case 'exit':
                return [{ text: 'Use Cmd+W to close this window.', type: 'muted' }, { text: '', type: 'output' }];
            default:
                return [{ text: `zsh: command not found: ${cmd}`, type: 'error' }, { text: '', type: 'output' }];
        }
    }, [cwd, files, username, userhomeid, userhomepath, hostname, isGuest, zshconfig, cmdhistory]);

    const formatPrompt = useCallback((path: string): TerminalLine => {
        // Just store the path - rendering handles the visual prompt
        return { text: path, type: 'prompt' };
    }, []);

    const handlekey = async (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdhistory.length > 0) {
                const newIdx = historyindex < cmdhistory.length - 1 ? historyindex + 1 : historyindex;
                sethistoryindex(newIdx);
                setcurrline(cmdhistory[cmdhistory.length - 1 - newIdx] || '');
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyindex > 0) {
                const newIdx = historyindex - 1;
                sethistoryindex(newIdx);
                setcurrline(cmdhistory[cmdhistory.length - 1 - newIdx] || '');
            } else {
                sethistoryindex(-1);
                setcurrline('');
            }
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            // Simple tab completion for filenames
            const parts = currline.split(' ');
            const partial = parts[parts.length - 1] || '';
            if (partial) {
                const dirItems = getDirectoryItems(cwd);
                const match = dirItems.find(i => i.name.toLowerCase().startsWith(partial.toLowerCase()));
                if (match) {
                    parts[parts.length - 1] = match.name + (match.mimetype === 'inode/directory' ? '/' : '');
                    setcurrline(parts.join(' '));
                }
            }
            return;
        }
        if (e.key === 'Enter' && !isrunning) {
            const cmd = currline.trim();
            const promptPath = iselectron
                ? nativecwd.replace(/^\/home\/[^/]+/, '~')
                : getPathString(cwd);

            const promptLine: TerminalLine = { text: `${promptPath}|${currline}`, type: 'prompt' };
            appendHistory([promptLine]);
            setcurrline('');

            if (cmd) {
                setcmdhistory(prev => {
                    const updated = [...prev, cmd];
                    return updated.length > MAX_CMD_HISTORY ? updated.slice(-MAX_CMD_HISTORY) : updated;
                });
                sethistoryindex(-1);
            }

            if (iselectron) {
                await executeNativeCommand(cmd);
            } else {
                const argsRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
                const argsArr: string[] = [];
                let match;
                while ((match = argsRegex.exec(cmd)) !== null) {
                    argsArr.push(match[1] || match[2] || match[0]);
                }
                const command = argsArr[0] ? argsArr[0].toLowerCase() : '';
                const response = executeVirtualCommand(command, argsArr);
                if (response !== null) {
                    appendHistory(response);
                }
            }
        }
    };

    useEffect(() => {
        if (isFocused && containerref.current) {
            containerref.current.scrollTop = containerref.current.scrollHeight;
        }
    }, [history, isFocused]);

    const promptPath = iselectron
        ? nativecwd.replace(/^\/home\/[^/]+/, '~') || '~'
        : getPathString(cwd);

    const renderPrompt = (path: string, command: string = '') => {
        if (zshconfig.promptStyle === 'powerline') {
            return (
                <span className="flex items-center flex-wrap gap-0">
                    <span className="bg-[#a6da95] text-[#1e2030] px-2 py-0 text-[11px] font-bold inline-flex items-center">{username}</span>
                    <span className="text-[#a6da95] bg-[#363a4f]">\ue0b0</span>
                    <span className="bg-[#363a4f] text-[#8aadf4] px-2 py-0 text-[11px] font-bold inline-flex items-center">{path}</span>
                    <span className="text-[#363a4f]">\ue0b0</span>
                    {command && <span className="text-[#cad3f5] ml-2">{command}</span>}
                </span>
            );
        }
        if (zshconfig.promptStyle === 'minimal') {
            return (
                <span>
                    <span className="text-[#8aadf4]">{path}</span>
                    <span className="text-[#c6a0f6]"> \u276f </span>
                    {command && <span className="text-[#cad3f5]">{command}</span>}
                </span>
            );
        }
        // classic
        return (
            <span>
                <span className="text-[#a6da95]">{username}</span>
                <span className="text-[#6e738d]">@</span>
                <span className="text-[#8aadf4]">{hostname}</span>
                <span className="text-[#6e738d]">:</span>
                <span className="text-[#c6a0f6]">{path}</span>
                <span className="text-[#cad3f5]">$ </span>
                {command && <span className="text-[#cad3f5]">{command}</span>}
            </span>
        );
    };

    const renderLine = (line: TerminalLine) => {
        if (line.type === 'prompt') {
            const [path, ...cmdParts] = line.text.split('|');
            return renderPrompt(path, cmdParts.join('|'));
        }
        const colorClass = {
            output: 'text-[#cad3f5]',
            info: 'text-[#8aadf4]',
            error: 'text-[#ed8796]',
            accent: 'text-[#c6a0f6]',
            muted: 'text-[#6e738d]',
            neofetch: 'text-[#8aadf4]',
        }[line.type] || 'text-[#cad3f5]';

        return <span className={colorClass}>{line.text}</span>;
    };

    return (
        <div
            ref={containerref}
            className="h-full w-full bg-[#1e2030] p-4 overflow-y-auto cursor-text"
            onClick={() => {
                if (ismobile) setcanedit(true);
                inputref.current?.focus();
            }}
        >
            <div className="font-mono leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                {history.map((line, i) => (
                    <div key={i} className="min-h-[20px] whitespace-pre-wrap break-all">
                        {renderLine(line)}
                    </div>
                ))}
                <div className="flex items-center flex-wrap">
                    {renderPrompt(promptPath)}
                    {zshconfig.promptStyle !== 'powerline' ? null : <span className="w-1" />}
                    <input
                        ref={inputref}
                        className="flex-1 bg-transparent outline-none text-[#cad3f5] font-mono ml-1 min-w-[100px]"
                        style={{ fontSize: `${fontSize}px` }}
                        value={currline}
                        onChange={(e) => setcurrline(e.target.value)}
                        onKeyDown={handlekey}
                        spellCheck={false}
                        readOnly={(!canedit && ismobile) || isrunning}
                        autoComplete="off"
                        disabled={isrunning}
                    />
                    {isrunning && <span className="text-[#f5a97f] animate-pulse ml-2">\u23f3</span>}
                </div>
                <div ref={endref} />
            </div>
        </div>
    );
}
