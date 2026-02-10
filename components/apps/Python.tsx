'use client';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { VscFiles, VscSearch, VscReplace, VscSettingsGear, VscClose, VscTerminal, VscRunAll, VscNewFile, VscNewFolder, VscRefresh, VscSave, VscChevronDown, VscChevronRight, VscTrash, VscEdit, VscGoToFile, VscCaseSensitive, VscRegex, VscWholeWord, VscPlay } from "react-icons/vsc";
import { IoLogoPython as IoPython } from "react-icons/io";
import { IoDocumentTextOutline, IoTrashOutline, IoRocketOutline } from "react-icons/io5";
import dynamic from 'next/dynamic';

import { useDevice } from '../DeviceContext';
import { useAuth } from '../AuthContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useTheme } from '../ThemeContext';
import { useFileSystem } from '../FileSystemContext';
import { useWindows } from '../WindowContext';
import { filesystemitem } from '../data';
import { useNotifications } from '../NotificationContext';
import { api } from '../../utils/constants';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface OpenFile {
    id: string;
    name: string;
    content: string;
    language: string;
    modified: boolean;
}

interface SearchResult {
    fileId: string;
    fileName: string;
    line: number;
    content: string;
}

const languageMap: Record<string, string> = {
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescriptreact',
    'jsx': 'javascriptreact',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'md': 'markdown',
    'txt': 'plaintext',
    'go': 'go',
    'rs': 'rust',
    'cpp': 'cpp',
    'c': 'c',
    'java': 'java',
    'rb': 'ruby',
    'php': 'php',
    'sh': 'shell',
};

const pistonRuntimes: Record<string, { language: string; version: string }> = {
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'go': { language: 'go', version: '1.16.2' },
    'rust': { language: 'rust', version: '1.68.2' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' },
    'ruby': { language: 'ruby', version: '3.0.1' },
    'php': { language: 'php', version: '8.2.3' },
    'shell': { language: 'bash', version: '5.2.0' },
};

const runnableLanguages = new Set(Object.keys(pistonRuntimes));

const fileIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    'py': { icon: <IoPython size={14} />, color: '#3776AB' },
    'js': { icon: <span className="text-[10px] font-bold">JS</span>, color: '#F7DF1E' },
    'ts': { icon: <span className="text-[10px] font-bold">TS</span>, color: '#3178C6' },
    'tsx': { icon: <span className="text-[10px] font-bold">TX</span>, color: '#3178C6' },
    'jsx': { icon: <span className="text-[10px] font-bold">JX</span>, color: '#61DAFB' },
    'json': { icon: <span className="text-[10px] font-bold">{'{}'}</span>, color: '#F5A623' },
    'html': { icon: <span className="text-[10px] font-bold">H</span>, color: '#E34F26' },
    'css': { icon: <span className="text-[10px] font-bold">#</span>, color: '#1572B6' },
    'md': { icon: <span className="text-[10px] font-bold">M\u2193</span>, color: '#083FA1' },
    'go': { icon: <span className="text-[10px] font-bold">Go</span>, color: '#00ADD8' },
    'rs': { icon: <span className="text-[10px] font-bold">Rs</span>, color: '#DEA584' },
    'cpp': { icon: <span className="text-[10px] font-bold">C+</span>, color: '#00599C' },
    'c': { icon: <span className="text-[10px] font-bold">C</span>, color: '#A8B9CC' },
    'java': { icon: <span className="text-[10px] font-bold">Jv</span>, color: '#ED8B00' },
    'rb': { icon: <span className="text-[10px] font-bold">Rb</span>, color: '#CC342D' },
    'php': { icon: <span className="text-[10px] font-bold">Php</span>, color: '#777BB4' },
    'sh': { icon: <span className="text-[10px] font-bold">$</span>, color: '#4EAA25' },
};

export default function CodeEditor({ isFocused = true, appId = 'python', id }: { isFocused?: boolean, appId?: string, id?: string }) {
    const { ismobile } = useDevice();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { files, createFile, createFolder, updateFileContent, renameItem, deleteItem, currentUserDocsId } = useFileSystem();
    const { addwindow, activewindow } = useWindows();
    const { addToast } = useNotifications();
    const editorRef = useRef<any>(null);

    const username = user?.username || 'Guest';
    const projectsId = useMemo(() => {
        const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));
        const userFolder = files.find(f => f.name === homeDir && f.parent?.includes('user'));
        if (userFolder) {
            const projectsFolder = files.find(f => f.name === 'Projects' && f.parent === userFolder.id);
            return projectsFolder?.id || currentUserDocsId;
        }
        return currentUserDocsId;
    }, [files, username, currentUserDocsId]);

    const [activepanel, setactivepanel] = useState<'files' | 'search' | null>(ismobile ? null : 'files');
    const [mobilefilepanel, setmobilefilepanel] = useState(false);
    const [openfiles, setopenfiles] = useState<OpenFile[]>([
        { id: 'welcome', name: 'Welcome.md', content: '# Code Editor\n\n## Keyboard Shortcuts\n- `Cmd/Ctrl + S` - Save file\n- `Cmd/Ctrl + N` - New file\n- `Cmd/Ctrl + F` - Find in file\n- `Cmd/Ctrl + H` - Find and replace\n\n## Supported Languages\nPython, JavaScript, TypeScript, HTML, CSS, JSON, Markdown\n\n## Running Code\nClick "Run" to execute Python or JavaScript files.', language: 'markdown', modified: false }
    ]);
    const [activefile, setactivefile] = useState<string>('welcome');
    const [isrunning, setisrunning] = useState(false);
    const [expandedfolders, setexpandedfolders] = useState<Set<string>>(new Set([projectsId]));
    const [showpanel, setshowpanel] = useState(false);
    const [searchquery, setsearchquery] = useState('');
    const [replacequery, setreplacequery] = useState('');
    const [searchresults, setsearchresults] = useState<SearchResult[]>([]);
    const [shownewfiledialog, setshownewfiledialog] = useState(false);
    const [showrenamedialog, setshowrenamedialog] = useState(false);
    const [newfilename, setnewfilename] = useState('');
    const [newfileisfolder, setnewfileisfolder] = useState(false);
    const [currentparentid, setcurrentparentid] = useState<string>(projectsId);
    const [selectedfileforcontext, setselectedfileforcontext] = useState<filesystemitem | null>(null);
    const [cursorposition, setcursorposition] = useState({ line: 1, col: 1 });
    const [showfindreplace, setshowfindreplace] = useState(false);
    const [findquery, setfindquery] = useState('');
    const [replacevalue, setreplacevalue] = useState('');
    const [casesensitive, setcasesensitive] = useState(false);
    const [useregex, setuseregex] = useState(false);
    const [wholeword, setwholeword] = useState(false);
    const [contextmenupos, setcontextmenupos] = useState<{ x: number; y: number } | null>(null);

    const projectFiles = useMemo(() => {
        const getChildren = (parentId: string): filesystemitem[] => {
            return files.filter(f => f.parent === parentId && !f.isTrash)
                .sort((a, b) => {
                    if (a.mimetype === 'inode/directory' && b.mimetype !== 'inode/directory') return -1;
                    if (a.mimetype !== 'inode/directory' && b.mimetype === 'inode/directory') return 1;
                    return a.name.localeCompare(b.name);
                });
        };
        return getChildren;
    }, [files]);

    const getLanguage = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        return languageMap[ext] || 'plaintext';
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const iconInfo = fileIcons[ext];
        if (iconInfo) {
            return <span style={{ color: iconInfo.color }}>{iconInfo.icon}</span>;
        }
        return <IoDocumentTextOutline size={14} className="text-[--text-muted]" />;
    };

    const openFile = useCallback((file: filesystemitem) => {
        if (file.mimetype === 'inode/directory') {
            setexpandedfolders(prev => {
                const next = new Set(prev);
                if (next.has(file.id)) next.delete(file.id);
                else next.add(file.id);
                return next;
            });
            return;
        }

        const existing = openfiles.find(f => f.id === file.id);
        if (existing) {
            setactivefile(file.id);
            return;
        }

        const newFile: OpenFile = {
            id: file.id,
            name: file.name,
            content: file.content || '',
            language: getLanguage(file.name),
            modified: false
        };
        setopenfiles(prev => [...prev, newFile]);
        setactivefile(file.id);
    }, [openfiles]);

    const closeFile = useCallback((fileId: string) => {
        setopenfiles(prev => {
            const idx = prev.findIndex(f => f.id === fileId);
            const filtered = prev.filter(f => f.id !== fileId);
            if (activefile === fileId && filtered.length > 0) {
                const newIdx = Math.min(idx, filtered.length - 1);
                setactivefile(filtered[newIdx].id);
            }
            return filtered;
        });
    }, [activefile]);

    const currentFile = openfiles.find(f => f.id === activefile);

    const breadcrumb = useMemo(() => {
        if (!currentFile || currentFile.id === 'welcome') return ['Welcome.md'];
        const path: string[] = [currentFile.name];
        let parentId = files.find(f => f.id === currentFile.id)?.parent;
        while (parentId) {
            const parent = files.find(f => f.id === parentId);
            if (!parent) break;
            path.unshift(parent.name);
            parentId = parent.parent;
        }
        return path;
    }, [currentFile, files]);

    const wordCount = useMemo(() => {
        if (!currentFile) return 0;
        return currentFile.content.split(/\s+/).filter(Boolean).length;
    }, [currentFile]);

    const updateCode = useCallback((value: string | undefined) => {
        if (!value) return;
        setopenfiles(prev => prev.map(f =>
            f.id === activefile ? { ...f, content: value, modified: true } : f
        ));
    }, [activefile]);

    const saveFile = useCallback(async () => {
        const file = openfiles.find(f => f.id === activefile);
        if (!file || file.id === 'welcome') return;

        await updateFileContent(file.id, file.content);
        setopenfiles(prev => prev.map(f =>
            f.id === activefile ? { ...f, modified: false } : f
        ));
        addToast(`Saved ${file.name}`, 'success');
    }, [activefile, openfiles, updateFileContent, addToast]);

    const createNewFile = useCallback(async () => {
        if (!newfilename.trim()) return;

        const name = newfilename.trim();
        if (newfileisfolder) {
            await createFolder(name, currentparentid);
        } else {
            await createFile(name, currentparentid, '');
        }

        setnewfilename('');
        setshownewfiledialog(false);
        addToast(`Created ${newfileisfolder ? 'folder' : 'file'}: ${name}`, 'success');
    }, [newfilename, newfileisfolder, currentparentid, createFile, createFolder, addToast]);

    const handleRenameFile = useCallback(async () => {
        if (!selectedfileforcontext || !newfilename.trim()) return;

        await renameItem(selectedfileforcontext.id, newfilename.trim());
        setopenfiles(prev => prev.map(f =>
            f.id === selectedfileforcontext.id ? { ...f, name: newfilename.trim(), language: getLanguage(newfilename.trim()) } : f
        ));
        setnewfilename('');
        setshowrenamedialog(false);
        setselectedfileforcontext(null);
        addToast(`Renamed to ${newfilename.trim()}`, 'success');
    }, [selectedfileforcontext, newfilename, renameItem, addToast]);

    const handleDeleteFile = useCallback(async (file: filesystemitem) => {
        closeFile(file.id);
        await deleteItem(file.id);
        addToast(`Deleted ${file.name}`, 'success');
    }, [deleteItem, closeFile, addToast]);

    const showInExplorer = useCallback((file: filesystemitem) => {
        addwindow({
            componentname: 'apps/Explorer',
            appname: 'Explorer',
            icon: '/explorer.png',
            additionaldata: { path: file.parent, highlight: file.id }
        });
    }, [addwindow]);

    const performSearch = useCallback(() => {
        if (!searchquery.trim()) {
            setsearchresults([]);
            return;
        }

        const results: SearchResult[] = [];
        const query = searchquery.toLowerCase();

        const searchInFolder = (parentId: string) => {
            const children = files.filter(f => f.parent === parentId && !f.isTrash);
            for (const file of children) {
                if (file.mimetype === 'inode/directory') {
                    searchInFolder(file.id);
                } else if (file.content) {
                    const lines = file.content.split('\n');
                    lines.forEach((line, idx) => {
                        if (line.toLowerCase().includes(query)) {
                            results.push({
                                fileId: file.id,
                                fileName: file.name,
                                line: idx + 1,
                                content: line.trim().slice(0, 80)
                            });
                        }
                    });
                }
            }
        };

        searchInFolder(projectsId);
        setsearchresults(results);
    }, [searchquery, files, projectsId]);

    useEffect(() => {
        if (searchquery) {
            const timer = setTimeout(performSearch, 300);
            return () => clearTimeout(timer);
        } else {
            setsearchresults([]);
        }
    }, [searchquery, performSearch]);

    const findInEditor = useCallback(() => {
        if (!editorRef.current || !findquery) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const searchStr = findquery;
        if (useregex) {
            try {
                new RegExp(searchStr);
            } catch {
                return;
            }
        }

        editor.getAction('actions.find').run();
    }, [findquery, useregex]);

    const replaceInEditor = useCallback(() => {
        if (!editorRef.current || !findquery) return;
        const editor = editorRef.current;

        const content = editor.getValue();
        let newContent: string;

        if (useregex) {
            try {
                const flags = casesensitive ? 'g' : 'gi';
                const regex = new RegExp(findquery, flags);
                newContent = content.replace(regex, replacevalue);
            } catch {
                return;
            }
        } else {
            if (casesensitive) {
                newContent = content.split(findquery).join(replacevalue);
            } else {
                const regex = new RegExp(findquery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                newContent = content.replace(regex, replacevalue);
            }
        }

        editor.setValue(newContent);
        updateCode(newContent);
    }, [findquery, replacevalue, casesensitive, useregex, updateCode]);

    const outputRef = useRef<HTMLPreElement>(null);
    const [outputlines, setoutputlines] = useState<{ text: string; type: 'stdout' | 'stderr' | 'info' }[]>([]);
    const [panelHeight, setPanelHeight] = useState(160);
    const panelDragRef = useRef<{ startY: number; startHeight: number } | null>(null);

    const appendOutput = useCallback((text: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') => {
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setoutputlines(prev => [...prev, { text: `[${ts}] ${text}`, type }]);
    }, []);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [outputlines]);

    const handlePanelDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        panelDragRef.current = { startY: e.clientY, startHeight: panelHeight };
        const onMove = (ev: MouseEvent) => {
            if (!panelDragRef.current) return;
            const delta = panelDragRef.current.startY - ev.clientY;
            setPanelHeight(Math.max(80, Math.min(400, panelDragRef.current.startHeight + delta)));
        };
        const onUp = () => {
            panelDragRef.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [panelHeight]);

    const runcode = useCallback(async () => {
        const file = openfiles.find(f => f.id === activefile);
        if (!file) return;

        const runtime = pistonRuntimes[file.language];
        if (!runtime) {
            appendOutput(`Language "${file.language}" is not supported for execution.`, 'stderr');
            appendOutput(`Supported: ${Object.keys(pistonRuntimes).join(', ')}`, 'info');
            setshowpanel(true);
            return;
        }

        setisrunning(true);
        setshowpanel(true);
        setoutputlines([]);
        appendOutput(`Running ${file.name} (${runtime.language} ${runtime.version})...`, 'info');

        try {
            const response = await fetch(api.pistonExecuteUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: runtime.language,
                    version: runtime.version,
                    files: [{ content: file.content }]
                })
            });
            const data = await response.json();
            if (data.run) {
                if (data.run.stdout) {
                    data.run.stdout.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stdout'));
                }
                if (data.run.stderr) {
                    data.run.stderr.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stderr'));
                }
                if (!data.run.stdout && !data.run.stderr) {
                    if (data.run.output) {
                        data.run.output.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stdout'));
                    } else {
                        appendOutput(`Exited with code ${data.run.code ?? 0}`, 'info');
                    }
                }
            } else {
                appendOutput('Failed to execute', 'stderr');
            }
        } catch {
            appendOutput('Network request failed', 'stderr');
        } finally {
            setisrunning(false);
        }
    }, [activefile, openfiles, appendOutput]);

    const formatCode = useCallback(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const file = openfiles.find(f => f.id === activefile);
        if (!file) return;

        if (file.language === 'json') {
            try {
                const formatted = JSON.stringify(JSON.parse(editor.getValue()), null, 2);
                editor.setValue(formatted);
                updateCode(formatted);
                addToast('Formatted JSON', 'success');
            } catch {
                addToast('Invalid JSON', 'error');
            }
            return;
        }

        editor.getAction('editor.action.formatDocument')?.run();
    }, [activefile, openfiles, updateCode, addToast]);

    const runAsApp = useCallback(() => {
        const file = openfiles.find(f => f.id === activefile);
        if (!file) return;

        const isJsx = file.language === 'javascriptreact' || file.name.endsWith('.jsx');
        const isTsx = file.language === 'typescriptreact' || file.name.endsWith('.tsx');
        const isJs = file.language === 'javascript' || file.name.endsWith('.js');

        if (!isJsx && !isTsx && !isJs) {
            addToast('Only .jsx, .tsx, or .js files can run as apps', 'error');
            return;
        }

        const appname = file.name.replace(/\.(jsx|tsx|js)$/, '');

        addwindow({
            id: `userapp-${appname}-${Date.now()}`,
            appname: appname,
            title: appname,
            component: 'DynamicAppRunner',
            icon: '/python.png',
            props: {
                code: file.content,
                appname: appname,
                appicon: '🚀',
                fileid: file.id
            }
        });

        addToast(`Launched ${appname}`, 'success');
    }, [activefile, openfiles, addwindow, addToast]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFocused) return;

            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveFile();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setshownewfiledialog(true);
                setnewfileisfolder(false);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                setshowfindreplace(true);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
                e.preventDefault();
                setshowfindreplace(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocused, saveFile]);

    const handleEditorMount = (editor: any) => {
        editorRef.current = editor;
        editor.onDidChangeCursorPosition((e: any) => {
            setcursorposition({ line: e.position.lineNumber, col: e.position.column });
        });
    };

    const handleContextMenu = (e: React.MouseEvent, file: filesystemitem) => {
        e.preventDefault();
        e.stopPropagation();
        setselectedfileforcontext(file);
        setcontextmenupos({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        const handleClick = () => setcontextmenupos(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const menuActions = useMemo(() => ({
        'new-file': () => { setshownewfiledialog(true); setnewfileisfolder(false); },
        'save': saveFile,
        'run-code': runcode,
    }), [runcode, saveFile]);

    useMenuAction(appId, menuActions, id);

    useEffect(() => {
        if (!id || !ismobile) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== id) return;
            if (shownewfiledialog) { e.preventDefault(); setshownewfiledialog(false); }
            else if (showrenamedialog) { e.preventDefault(); setshowrenamedialog(false); setselectedfileforcontext(null); }
            else if (mobilefilepanel) { e.preventDefault(); setmobilefilepanel(false); }
            else if (showfindreplace) { e.preventDefault(); setshowfindreplace(false); }
            else if (showpanel) { e.preventDefault(); setshowpanel(false); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [id, ismobile, activewindow, shownewfiledialog, showrenamedialog, mobilefilepanel, showfindreplace, showpanel]);

    const renderFileTree = (parentId: string, depth: number = 0) => {
        const children = projectFiles(parentId);
        return children.map(file => {
            const isFolder = file.mimetype === 'inode/directory';
            const isExpanded = expandedfolders.has(file.id);
            const isActive = activefile === file.id;
            const isModified = openfiles.find(f => f.id === file.id)?.modified;

            return (
                <div key={file.id}>
                    <div
                        onClick={() => openFile(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        className={`flex items-center gap-1.5 py-[3px] px-2 cursor-pointer text-[13px] hover:bg-overlay group ${isActive ? 'bg-overlay' : ''}`}
                        style={{ paddingLeft: `${depth * 12 + 10}px` }}
                    >
                        {isFolder ? (
                            <>
                                {isExpanded ? <VscChevronDown size={14} className="text-[--text-muted] shrink-0" /> : <VscChevronRight size={14} className="text-[--text-muted] shrink-0" />}
                                {isExpanded ? <FaFolderOpen size={14} className="text-[#dcb67a] shrink-0" /> : <FaFolder size={14} className="text-[#dcb67a] shrink-0" />}
                            </>
                        ) : (
                            <>
                                <span className="w-3.5 shrink-0" />
                                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                    {getFileIcon(file.name)}
                                </div>
                            </>
                        )}
                        <span className={`truncate flex-1 ${isActive ? 'text-[--text-color]' : 'text-[--text-muted]'}`}>
                            {isModified && <span className="text-[--text-color]">● </span>}
                            {file.name}
                        </span>
                    </div>
                    {isFolder && isExpanded && renderFileTree(file.id, depth + 1)}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-[--bg-base] text-[--text-color] font-mono text-sm select-none">
            <div className='w-full h-[50px] flex flex-row items-center content-center relative'><h1 className="w-max mx-auto top-0 bottom-0 left-0 right-0 text-center">Code Editor</h1></div>
            <div className="flex flex-1 min-h-0">
                {!ismobile && (
                    <div className="w-12 bg-surface flex flex-col items-center py-1 shrink-0 border-r border-[--border-color]">
                        <button onClick={() => setactivepanel(activepanel === 'files' ? null : 'files')} className={`p-2.5 mb-0.5 ${activepanel === 'files' ? 'text-[--text-color] border-l-2 border-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color]'}`} title="Explorer">
                            <VscFiles size={22} />
                        </button>
                        <button onClick={() => setactivepanel(activepanel === 'search' ? null : 'search')} className={`p-2.5 mb-0.5 ${activepanel === 'search' ? 'text-[--text-color] border-l-2 border-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color]'}`} title="Search">
                            <VscSearch size={22} />
                        </button>
                        <div className="flex-1" />
                        <button className="p-2.5 text-[--text-muted] hover:text-[--text-color]" title="Settings">
                            <VscSettingsGear size={20} />
                        </button>
                    </div>
                )}

                {activepanel && !ismobile && (
                    <div className="w-60 bg-surface flex flex-col shrink-0 border-r border-[--border-color]">
                        {activepanel === 'files' && (
                            <>
                                <div className="h-9 flex items-center justify-between px-4 text-[11px] uppercase tracking-wide text-[--text-muted] font-medium">
                                    <span>Explorer</span>
                                    <div className="flex items-center gap-0.5">
                                        <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(false); setcurrentparentid(projectsId); }} className="p-1 hover:bg-overlay" title="New File">
                                            <VscNewFile size={14} />
                                        </button>
                                        <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(true); setcurrentparentid(projectsId); }} className="p-1 hover:bg-overlay" title="New Folder">
                                            <VscNewFolder size={14} />
                                        </button>
                                        <button className="p-1 hover:bg-overlay" title="Refresh">
                                            <VscRefresh size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto text-[13px]">
                                    <div className="flex items-center gap-1 px-2 py-1.5 text-[--text-muted] text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-overlay">
                                        <VscChevronDown size={14} />
                                        <span>Projects</span>
                                    </div>
                                    {renderFileTree(projectsId)}
                                </div>
                            </>
                        )}
                        {activepanel === 'search' && (
                            <>
                                <div className="h-9 flex items-center px-4 text-[11px] uppercase tracking-wide text-[--text-muted] font-medium">Search</div>
                                <div className="px-3 mb-2">
                                    <input
                                        type="text"
                                        value={searchquery}
                                        onChange={e => setsearchquery(e.target.value)}
                                        placeholder="Search files"
                                        className="w-full bg-overlay border border-transparent focus:border-accent px-2 py-1.5 text-sm outline-none text-[--text-color] placeholder-[--text-muted]"
                                    />
                                </div>
                                <div className="flex-1 overflow-auto px-2">
                                    {searchresults.length === 0 && searchquery && (
                                        <div className="text-[--text-muted] text-xs px-2 py-4 text-center">No results</div>
                                    )}
                                    {searchresults.map((result, i) => (
                                        <div
                                            key={`${result.fileId}-${result.line}-${i}`}
                                            onClick={() => {
                                                const file = files.find(f => f.id === result.fileId);
                                                if (file) openFile(file);
                                            }}
                                            className="px-2 py-1.5 hover:bg-overlay cursor-pointer text-xs"
                                        >
                                            <div className="flex items-center gap-1 text-[--text-color]">
                                                {getFileIcon(result.fileName)}
                                                <span className="font-medium">{result.fileName}</span>
                                                <span className="text-[--text-muted]">:{result.line}</span>
                                            </div>
                                            <div className="text-[--text-muted] truncate mt-0.5">{result.content}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <div className={`h-9 bg-surface flex items-center overflow-x-auto shrink-0`}>
                        {openfiles.map(file => (
                            <div
                                key={file.id}
                                onClick={() => setactivefile(file.id)}
                                className={`flex items-center gap-2 px-3 h-full border-r border-[--border-color] cursor-pointer shrink-0 min-w-0 group ${activefile === file.id ? 'bg-[--bg-base]' : 'bg-surface hover:bg-overlay'}`}
                            >
                                <div className="shrink-0">{getFileIcon(file.name)}</div>
                                <span className="text-[13px] text-[--text-muted] truncate max-w-[100px]">
                                    {file.modified && <span className="text-[--text-color]">● </span>}
                                    {file.name}
                                </span>
                                {file.id !== 'welcome' && (
                                    <VscClose
                                        size={16}
                                        className="text-[--text-muted] hover:text-[--text-color] shrink-0 hover:bg-overlay"
                                        onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
                                    />
                                )}
                            </div>
                        ))}
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 px-2 shrink-0">
                            <button onClick={() => setshowfindreplace(!showfindreplace)} className={`p-1.5 ${showfindreplace ? 'text-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`} title="Find & Replace (Cmd+F)">
                                <VscReplace size={14} />
                            </button>
                            <button onClick={formatCode} className="p-1.5 text-[--text-muted] hover:text-[--text-color] hover:bg-overlay" title="Format Document (Shift+Alt+F)">
                                <VscSettingsGear size={14} />
                            </button>
                            <button onClick={saveFile} disabled={!currentFile?.modified} className={`flex items-center gap-1 px-2 py-1 text-xs ${currentFile?.modified ? 'text-[--text-color] hover:bg-overlay' : 'text-[--text-muted]'}`} title="Save (Cmd+S)">
                                <VscSave size={14} />
                            </button>
                            <button onClick={runcode} disabled={isrunning || !currentFile || !runnableLanguages.has(currentFile.language)} className={`flex items-center gap-1 px-2 py-1 text-xs ${isrunning || !currentFile || !runnableLanguages.has(currentFile.language) ? 'text-[--text-muted]' : 'text-pastel-green hover:bg-overlay'}`} title="Run Code">
                                <VscRunAll size={16} />
                                Run
                            </button>
                            {(currentFile?.language === 'javascriptreact' || currentFile?.language === 'typescriptreact' || currentFile?.name.endsWith('.jsx') || currentFile?.name.endsWith('.tsx') || currentFile?.name.endsWith('.js')) && (
                                <button onClick={runAsApp} className="flex items-center gap-1 px-2 py-1 text-xs text-[#c6a0f6] hover:bg-overlay" title="Run as App (opens new window)">
                                    <IoRocketOutline size={14} />
                                    App
                                </button>
                            )}
                            <button onClick={() => setshowpanel(!showpanel)} className={`p-1.5 ${showpanel ? 'text-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`} title="Terminal">
                                <VscTerminal size={16} />
                            </button>
                        </div>
                    </div>

                    {showfindreplace && (
                        <div className="bg-surface px-3 py-2 flex items-center gap-2 border-b border-[--border-color] flex-wrap">
                            <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={findquery}
                                    onChange={e => setfindquery(e.target.value)}
                                    placeholder="Find"
                                    className="flex-1 bg-overlay border border-transparent focus:border-accent px-2 py-1 text-sm outline-none text-[--text-color]"
                                    autoFocus
                                />
                                <button onClick={() => setcasesensitive(!casesensitive)} className={`p-1 ${casesensitive ? 'bg-accent text-[--text-color]' : 'text-[--text-muted] hover:text-[--text-color]'}`} title="Case Sensitive">
                                    <VscCaseSensitive size={16} />
                                </button>
                                <button onClick={() => setwholeword(!wholeword)} className={`p-1 ${wholeword ? 'bg-accent text-[--text-color]' : 'text-[--text-muted] hover:text-[--text-color]'}`} title="Whole Word">
                                    <VscWholeWord size={16} />
                                </button>
                                <button onClick={() => setuseregex(!useregex)} className={`p-1 ${useregex ? 'bg-accent text-[--text-color]' : 'text-[--text-muted] hover:text-[--text-color]'}`} title="Regex">
                                    <VscRegex size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={replacevalue}
                                    onChange={e => setreplacevalue(e.target.value)}
                                    placeholder="Replace"
                                    className="flex-1 bg-overlay border border-transparent focus:border-accent px-2 py-1 text-sm outline-none text-[--text-color]"
                                />
                                <button onClick={replaceInEditor} className="px-2 py-1 text-xs bg-overlay hover:bg-accent text-[--text-color]">Replace All</button>
                            </div>
                            <button onClick={() => setshowfindreplace(false)} className="p-1 text-[--text-muted] hover:text-[--text-color] hover:bg-overlay">
                                <VscClose size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Breadcrumb */}
                        {!ismobile && currentFile && (
                            <div className="h-6 flex items-center px-3 bg-[--bg-base] border-b border-[--border-color] text-[11px] text-[--text-muted] gap-1 shrink-0 overflow-hidden">
                                {breadcrumb.map((seg, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <VscChevronRight size={10} className="shrink-0 opacity-50" />}
                                        <span className={i === breadcrumb.length - 1 ? 'text-[--text-color] truncate' : 'truncate'}>{seg}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        <div className={showpanel ? 'flex-1 min-h-0' : 'flex-1'}>
                            {currentFile && (
                                <MonacoEditor
                                    height="100%"
                                    language={currentFile.language}
                                    value={currentFile.content}
                                    onChange={updateCode}
                                    onMount={handleEditorMount}
                                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                    options={{
                                        minimap: { enabled: !ismobile && (currentFile.content.split('\n').length > 50) },
                                        fontSize: ismobile ? 12 : 13,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        padding: { top: 8, bottom: 8 },
                                        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                                        fontLigatures: true,
                                        renderLineHighlight: 'all',
                                        cursorBlinking: 'smooth',
                                        cursorSmoothCaretAnimation: 'on',
                                        smoothScrolling: true,
                                        bracketPairColorization: { enabled: true },
                                        guides: { bracketPairs: true, indentation: true },
                                        wordWrap: 'on',
                                        tabSize: 4,
                                    }}
                                />
                            )}
                        </div>

                        {showpanel && (
                            <div className="flex flex-col shrink-0" style={{ height: panelHeight }}>
                                {/* Drag handle */}
                                <div
                                    className="h-1 cursor-row-resize bg-[--border-color] hover:bg-accent transition-colors shrink-0"
                                    onMouseDown={handlePanelDragStart}
                                />
                                <div className="h-8 flex items-center px-4 bg-[#1a1a2e] border-b border-[#2a2a3e] gap-4 shrink-0">
                                    <button className="text-xs text-[#cad3f5] font-medium border-b-2 border-accent py-1">Output</button>
                                    <div className="flex-1" />
                                    <button onClick={() => setoutputlines([])} className="text-[#6e738d] hover:text-[#cad3f5] p-1 hover:bg-[#2a2a3e]">
                                        <IoTrashOutline size={14} />
                                    </button>
                                    <button onClick={() => setshowpanel(false)} className="text-[#6e738d] hover:text-[#cad3f5] p-1 hover:bg-[#2a2a3e]">
                                        <VscClose size={14} />
                                    </button>
                                </div>
                                <pre ref={outputRef} className="flex-1 p-3 text-xs font-mono overflow-auto whitespace-pre-wrap bg-[#1a1a2e]">
                                    {outputlines.length === 0 ? (
                                        <span className="text-[#6e738d]">Run your code to see output here...</span>
                                    ) : (
                                        outputlines.map((line, i) => (
                                            <div key={i} className={
                                                line.type === 'stderr' ? 'text-[#ed8796]' :
                                                line.type === 'info' ? 'text-[#8aadf4]' :
                                                'text-[#cad3f5]'
                                            }>{line.text}</div>
                                        ))
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`${ismobile ? 'h-16 pb-4 relative' : 'h-[22px]'} bg-accent flex items-center px-3 text-[11px] text-[--text-color] justify-between shrink-0`}>
                {ismobile ? (
                    <>
                        <button onClick={() => setmobilefilepanel(!mobilefilepanel)} className="flex items-center gap-2 px-3 py-1.5 bg-overlay">
                            <VscFiles size={16} />
                            <span className="text-sm">Files</span>
                        </button>
                        <span className={`text-xs opacity-80 ${ismobile ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>{currentFile?.name || 'No file'}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={runcode} disabled={isrunning} className="px-3 py-1.5 bg-overlay text-sm">
                                Run
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4">
                            <span className="opacity-80">Ln {cursorposition.line}, Col {cursorposition.col}</span>
                            <span className="opacity-60">{wordCount} words</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {currentFile && runnableLanguages.has(currentFile.language) && (
                                <span className="opacity-60 flex items-center gap-1"><VscPlay size={10} /> Runnable</span>
                            )}
                            <span className="opacity-80">{currentFile?.language || 'Plain Text'}</span>
                            <span className="opacity-80">UTF-8</span>
                        </div>
                    </>
                )}
            </div>

            {ismobile && mobilefilepanel && (
                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setmobilefilepanel(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-surface max-h-[70vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[--border-color]">
                            <span className="text-[--text-color] font-medium">Project Files</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(false); setcurrentparentid(projectsId); setmobilefilepanel(false); }} className="p-2 bg-overlay text-[--text-color]">
                                    <VscNewFile size={16} />
                                </button>
                                <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(true); setcurrentparentid(projectsId); setmobilefilepanel(false); }} className="p-2 bg-overlay text-[--text-color]">
                                    <VscNewFolder size={16} />
                                </button>
                                <button onClick={() => setmobilefilepanel(false)} className="p-2 bg-overlay text-[--text-color]">
                                    <VscClose size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-2 text-sm">
                            {renderFileTree(projectsId)}
                        </div>
                    </div>
                </div>
            )}

            {contextmenupos && selectedfileforcontext && (
                <div
                    className="fixed bg-surface border border-[--border-color] py-1 min-w-[180px] z-50"
                    style={{ left: contextmenupos.x, top: contextmenupos.y }}
                >
                    <button
                        onClick={() => { setshowrenamedialog(true); setnewfilename(selectedfileforcontext.name); setcontextmenupos(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[--text-color] hover:bg-overlay text-left"
                    >
                        <VscEdit size={14} /> Rename
                    </button>
                    <button
                        onClick={() => { handleDeleteFile(selectedfileforcontext); setcontextmenupos(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[--text-color] hover:bg-overlay text-left"
                    >
                        <VscTrash size={14} /> Delete
                    </button>
                    <div className="h-px bg-[--border-color] my-1" />
                    <button
                        onClick={() => { showInExplorer(selectedfileforcontext); setcontextmenupos(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[--text-color] hover:bg-overlay text-left"
                    >
                        <VscGoToFile size={14} /> Show in Explorer
                    </button>
                </div>
            )}

            {shownewfiledialog && (
                <div className="absolute inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
                    <div className="bg-surface w-80 overflow-hidden border border-[--border-color]">
                        <div className="flex items-center gap-2 p-3 bg-overlay">
                            {newfileisfolder ? <VscNewFolder size={16} /> : <VscNewFile size={16} />}
                            <span className="text-sm font-medium">New {newfileisfolder ? 'Folder' : 'File'}</span>
                        </div>
                        <div className="p-4">
                            <input
                                type="text"
                                value={newfilename}
                                onChange={e => setnewfilename(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') createNewFile();
                                    if (e.key === 'Escape') setshownewfiledialog(false);
                                }}
                                placeholder={newfileisfolder ? 'Folder name' : 'filename.js'}
                                className="w-full bg-overlay border border-transparent focus:border-accent px-3 py-2 text-sm outline-none text-[--text-color]"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 p-3 bg-[--bg-base]">
                            <button onClick={() => setshownewfiledialog(false)} className="px-4 py-1.5 text-sm hover:bg-overlay">Cancel</button>
                            <button onClick={createNewFile} className="px-4 py-1.5 text-sm bg-accent hover:opacity-90">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showrenamedialog && (
                <div className="absolute inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
                    <div className="bg-surface w-80 overflow-hidden border border-[--border-color]">
                        <div className="flex items-center gap-2 p-3 bg-overlay">
                            <VscEdit size={16} />
                            <span className="text-sm font-medium">Rename</span>
                        </div>
                        <div className="p-4">
                            <input
                                type="text"
                                value={newfilename}
                                onChange={e => setnewfilename(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleRenameFile();
                                    if (e.key === 'Escape') { setshowrenamedialog(false); setselectedfileforcontext(null); }
                                }}
                                className="w-full bg-overlay border border-transparent focus:border-accent px-3 py-2 text-sm outline-none text-[--text-color]"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 p-3 bg-[--bg-base]">
                            <button onClick={() => { setshowrenamedialog(false); setselectedfileforcontext(null); }} className="px-4 py-1.5 text-sm hover:bg-overlay">Cancel</button>
                            <button onClick={handleRenameFile} className="px-4 py-1.5 text-sm bg-accent hover:opacity-90">Rename</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
