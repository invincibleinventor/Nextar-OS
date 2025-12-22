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
};

const fileIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    'py': { icon: <IoPython size={14} />, color: '#3776AB' },
    'js': { icon: <span className="text-[10px] font-bold">JS</span>, color: '#F7DF1E' },
    'ts': { icon: <span className="text-[10px] font-bold">TS</span>, color: '#3178C6' },
    'tsx': { icon: <span className="text-[10px] font-bold">TX</span>, color: '#3178C6' },
    'jsx': { icon: <span className="text-[10px] font-bold">JX</span>, color: '#61DAFB' },
    'json': { icon: <span className="text-[10px] font-bold">{'{}'}</span>, color: '#F5A623' },
    'html': { icon: <span className="text-[10px] font-bold">H</span>, color: '#E34F26' },
    'css': { icon: <span className="text-[10px] font-bold">#</span>, color: '#1572B6' },
    'md': { icon: <span className="text-[10px] font-bold">M↓</span>, color: '#083FA1' },
};

export default function CodeEditor({ isFocused = true, appId = 'python', id }: { isFocused?: boolean, appId?: string, id?: string }) {
    const { ismobile } = useDevice();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { files, createFile, createFolder, updateFileContent, renameItem, deleteItem, currentUserDocsId } = useFileSystem();
    const { addwindow } = useWindows();
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
    const [output, setoutput] = useState('');
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
        return <IoDocumentTextOutline size={14} className="text-gray-400" />;
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

    const runcode = useCallback(async () => {
        const file = openfiles.find(f => f.id === activefile);
        if (!file) return;

        const isPython = file.language === 'python';
        const isJs = file.language === 'javascript';

        if (!isPython && !isJs) {
            setoutput('Only Python and JavaScript files can be executed.\nNote: TypeScript files must be saved as .js\n');
            setshowpanel(true);
            return;
        }

        setisrunning(true);
        setshowpanel(true);
        setoutput('Running...\n');

        try {
            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: isPython ? 'python' : 'javascript',
                    version: isPython ? '3.10.0' : '18.15.0',
                    files: [{ content: file.content }]
                })
            });
            const data = await response.json();
            if (data.run) {
                setoutput(data.run.output || (data.run.stderr ? `Error: ${data.run.stderr}` : 'Program exited with code 0'));
            } else {
                setoutput('Error: Failed to execute');
            }
        } catch {
            setoutput('Error: Network request failed');
        } finally {
            setisrunning(false);
        }
    }, [activefile, openfiles]);

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
                        className={`flex items-center gap-1.5 py-[3px] px-2 cursor-pointer text-[13px] hover:bg-[#2a2d2e] group ${isActive ? 'bg-[#37373d]' : ''}`}
                        style={{ paddingLeft: `${depth * 12 + 10}px` }}
                    >
                        {isFolder ? (
                            <>
                                {isExpanded ? <VscChevronDown size={14} className="text-gray-400 shrink-0" /> : <VscChevronRight size={14} className="text-gray-400 shrink-0" />}
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
                        <span className={`truncate flex-1 ${isActive ? 'text-white' : 'text-[#cccccc]'}`}>
                            {isModified && <span className="text-white">● </span>}
                            {file.name}
                        </span>
                    </div>
                    {isFolder && isExpanded && renderFileTree(file.id, depth + 1)}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white font-sans text-sm select-none">
            <div className='w-full h-[50px] flex flex-row items-center content-center relative'><h1 className="w-max mx-auto top-0 bottom-0 left-0 right-0 text-center">Code Editor</h1></div>
            <div className="flex flex-1 min-h-0">
                {!ismobile && (
                    <div className="w-12 bg-[#333333] flex flex-col items-center py-1 shrink-0 border-r border-[#252526] pt-8">
                        <button onClick={() => setactivepanel(activepanel === 'files' ? null : 'files')} className={`p-2.5 mb-0.5 rounded-md ${activepanel === 'files' ? 'text-white border-l-2 border-white bg-[#252526]' : 'text-gray-500 hover:text-gray-300'}`} title="Explorer">
                            <VscFiles size={22} />
                        </button>
                        <button onClick={() => setactivepanel(activepanel === 'search' ? null : 'search')} className={`p-2.5 mb-0.5 rounded-md ${activepanel === 'search' ? 'text-white border-l-2 border-white bg-[#252526]' : 'text-gray-500 hover:text-gray-300'}`} title="Search">
                            <VscSearch size={22} />
                        </button>
                        <div className="flex-1" />
                        <button className="p-2.5 rounded-md text-gray-500 hover:text-gray-300" title="Settings">
                            <VscSettingsGear size={20} />
                        </button>
                    </div>
                )}

                {activepanel && !ismobile && (
                    <div className="w-60 bg-[#252526] flex flex-col shrink-0 border-r border-[#1e1e1e]">
                        {activepanel === 'files' && (
                            <>
                                <div className="h-9 flex items-center justify-between px-4 text-[11px] uppercase tracking-wide text-[#bbbbbb] font-medium">
                                    <span>Explorer</span>
                                    <div className="flex items-center gap-0.5">
                                        <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(false); setcurrentparentid(projectsId); }} className="p-1 rounded hover:bg-[#3c3c3c]" title="New File">
                                            <VscNewFile size={14} />
                                        </button>
                                        <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(true); setcurrentparentid(projectsId); }} className="p-1 rounded hover:bg-[#3c3c3c]" title="New Folder">
                                            <VscNewFolder size={14} />
                                        </button>
                                        <button className="p-1 rounded hover:bg-[#3c3c3c]" title="Refresh">
                                            <VscRefresh size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto text-[13px]">
                                    <div className="flex items-center gap-1 px-2 py-1.5 text-[#bbbbbb] text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#2a2d2e]">
                                        <VscChevronDown size={14} />
                                        <span>Projects</span>
                                    </div>
                                    {renderFileTree(projectsId)}
                                </div>
                            </>
                        )}
                        {activepanel === 'search' && (
                            <>
                                <div className="h-9 flex items-center px-4 text-[11px] uppercase tracking-wide text-[#bbbbbb] font-medium">Search</div>
                                <div className="px-3 mb-2">
                                    <input
                                        type="text"
                                        value={searchquery}
                                        onChange={e => setsearchquery(e.target.value)}
                                        placeholder="Search files"
                                        className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-2 py-1.5 text-sm outline-none text-white placeholder-gray-500"
                                    />
                                </div>
                                <div className="flex-1 overflow-auto px-2">
                                    {searchresults.length === 0 && searchquery && (
                                        <div className="text-gray-500 text-xs px-2 py-4 text-center">No results</div>
                                    )}
                                    {searchresults.map((result, i) => (
                                        <div
                                            key={`${result.fileId}-${result.line}-${i}`}
                                            onClick={() => {
                                                const file = files.find(f => f.id === result.fileId);
                                                if (file) openFile(file);
                                            }}
                                            className="px-2 py-1.5 hover:bg-[#2a2d2e] cursor-pointer rounded text-xs"
                                        >
                                            <div className="flex items-center gap-1 text-[#cccccc]">
                                                {getFileIcon(result.fileName)}
                                                <span className="font-medium">{result.fileName}</span>
                                                <span className="text-gray-500">:{result.line}</span>
                                            </div>
                                            <div className="text-gray-400 truncate mt-0.5">{result.content}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                    <div className={`h-9 bg-[#252526] flex items-center overflow-x-auto shrink-0`}>
                        {openfiles.map(file => (
                            <div
                                key={file.id}
                                onClick={() => setactivefile(file.id)}
                                className={`flex items-center gap-2 px-3 h-full border-r border-[#1e1e1e] cursor-pointer shrink-0 min-w-0 group ${activefile === file.id ? 'bg-[#1e1e1e]' : 'bg-[#2d2d2d] hover:bg-[#2a2d2e]'}`}
                            >
                                <div className="shrink-0">{getFileIcon(file.name)}</div>
                                <span className="text-[13px] text-[#cccccc] truncate max-w-[100px]">
                                    {file.modified && <span className="text-white">● </span>}
                                    {file.name}
                                </span>
                                {file.id !== 'welcome' && (
                                    <VscClose
                                        size={16}
                                        className="text-gray-500 hover:text-white shrink-0 hover:bg-[#3c3c3c] rounded"
                                        onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
                                    />
                                )}
                            </div>
                        ))}
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 px-2 shrink-0">
                            <button onClick={() => setshowfindreplace(!showfindreplace)} className={`p-1.5 rounded ${showfindreplace ? 'text-white bg-[#3c3c3c]' : 'text-gray-400 hover:text-white hover:bg-[#3c3c3c]'}`} title="Find & Replace (Cmd+F)">
                                <VscReplace size={14} />
                            </button>
                            <button onClick={saveFile} disabled={!currentFile?.modified} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${currentFile?.modified ? 'text-white hover:bg-[#3c3c3c]' : 'text-gray-600'}`} title="Save (Cmd+S)">
                                <VscSave size={14} />
                            </button>
                            <button onClick={runcode} disabled={isrunning} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isrunning ? 'text-gray-500' : 'text-green-400 hover:bg-[#3c3c3c]'}`} title="Run Code">
                                <VscRunAll size={16} />
                                Run
                            </button>
                            {(currentFile?.language === 'javascriptreact' || currentFile?.language === 'typescriptreact' || currentFile?.name.endsWith('.jsx') || currentFile?.name.endsWith('.tsx') || currentFile?.name.endsWith('.js')) && (
                                <button onClick={runAsApp} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-purple-400 hover:bg-[#3c3c3c]" title="Run as App (opens new window)">
                                    <IoRocketOutline size={14} />
                                    App
                                </button>
                            )}
                            <button onClick={() => setshowpanel(!showpanel)} className={`p-1.5 rounded ${showpanel ? 'text-white bg-[#3c3c3c]' : 'text-gray-400 hover:text-white hover:bg-[#3c3c3c]'}`} title="Terminal">
                                <VscTerminal size={16} />
                            </button>
                        </div>
                    </div>

                    {showfindreplace && (
                        <div className="bg-[#252526] px-3 py-2 flex items-center gap-2 border-b border-[#1e1e1e] flex-wrap">
                            <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={findquery}
                                    onChange={e => setfindquery(e.target.value)}
                                    placeholder="Find"
                                    className="flex-1 bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-2 py-1 text-sm outline-none text-white"
                                    autoFocus
                                />
                                <button onClick={() => setcasesensitive(!casesensitive)} className={`p-1 rounded ${casesensitive ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`} title="Case Sensitive">
                                    <VscCaseSensitive size={16} />
                                </button>
                                <button onClick={() => setwholeword(!wholeword)} className={`p-1 rounded ${wholeword ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`} title="Whole Word">
                                    <VscWholeWord size={16} />
                                </button>
                                <button onClick={() => setuseregex(!useregex)} className={`p-1 rounded ${useregex ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`} title="Regex">
                                    <VscRegex size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={replacevalue}
                                    onChange={e => setreplacevalue(e.target.value)}
                                    placeholder="Replace"
                                    className="flex-1 bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-2 py-1 text-sm outline-none text-white"
                                />
                                <button onClick={replaceInEditor} className="px-2 py-1 text-xs rounded bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white">Replace All</button>
                            </div>
                            <button onClick={() => setshowfindreplace(false)} className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#3c3c3c]">
                                <VscClose size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col min-h-0">
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
                            <div className="h-40 border-t border-[#1e1e1e] bg-[#1e1e1e] flex flex-col shrink-0">
                                <div className="h-8 flex items-center px-4 bg-[#252526] border-b border-[#1e1e1e] gap-4">
                                    <button className="text-xs text-white font-medium border-b-2 border-[#007acc] py-1">Output</button>
                                    <div className="flex-1" />
                                    <button onClick={() => setoutput('')} className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#3c3c3c]">
                                        <IoTrashOutline size={14} />
                                    </button>
                                    <button onClick={() => setshowpanel(false)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#3c3c3c]">
                                        <VscClose size={14} />
                                    </button>
                                </div>
                                <pre className="flex-1 p-3 text-xs font-mono text-[#cccccc] overflow-auto whitespace-pre-wrap">
                                    {output || <span className="text-gray-600">Run your code to see output here...</span>}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`${ismobile ? 'h-16 pb-4 relative' : 'h-[22px]'} bg-[#007acc] flex items-center px-3 text-[11px] text-white justify-between shrink-0`}>
                {ismobile ? (
                    <>
                        <button onClick={() => setmobilefilepanel(!mobilefilepanel)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                            <VscFiles size={16} />
                            <span className="text-sm">Files</span>
                        </button>
                        <span className={`text-xs opacity-80 ${ismobile ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>{currentFile?.name || 'No file'}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={runcode} disabled={isrunning} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                                Run
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4">
                            <span className="opacity-80">Ln {cursorposition.line}, Col {cursorposition.col}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="opacity-80">{currentFile?.language || 'Plain Text'}</span>
                            <span className="opacity-80">UTF-8</span>
                        </div>
                    </>
                )}
            </div>

            {ismobile && mobilefilepanel && (
                <div className="fixed inset-0 z-[9999] bg-black/50" onClick={() => setmobilefilepanel(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-[#252526] rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#1e1e1e]">
                            <span className="text-white font-medium">Project Files</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(false); setcurrentparentid(projectsId); setmobilefilepanel(false); }} className="p-2 rounded-lg bg-[#3c3c3c] text-white">
                                    <VscNewFile size={16} />
                                </button>
                                <button onClick={() => { setshownewfiledialog(true); setnewfileisfolder(true); setcurrentparentid(projectsId); setmobilefilepanel(false); }} className="p-2 rounded-lg bg-[#3c3c3c] text-white">
                                    <VscNewFolder size={16} />
                                </button>
                                <button onClick={() => setmobilefilepanel(false)} className="p-2 rounded-lg bg-[#3c3c3c] text-white">
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
                    className="fixed bg-[#252526] border border-[#454545] rounded-lg shadow-xl py-1 min-w-[180px] z-[9999]"
                    style={{ left: contextmenupos.x, top: contextmenupos.y }}
                >
                    <button
                        onClick={() => { setshowrenamedialog(true); setnewfilename(selectedfileforcontext.name); setcontextmenupos(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
                    >
                        <VscEdit size={14} /> Rename
                    </button>
                    <button
                        onClick={() => { handleDeleteFile(selectedfileforcontext); setcontextmenupos(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
                    >
                        <VscTrash size={14} /> Delete
                    </button>
                    <div className="h-px bg-[#454545] my-1" />
                    <button
                        onClick={() => { showInExplorer(selectedfileforcontext); setcontextmenupos(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#094771] text-left"
                    >
                        <VscGoToFile size={14} /> Show in Explorer
                    </button>
                </div>
            )}

            {shownewfiledialog && (
                <div className="absolute inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
                    <div className="bg-[#252526] rounded-lg shadow-xl w-80 overflow-hidden border border-[#454545]">
                        <div className="flex items-center gap-2 p-3 bg-[#3c3c3c]">
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
                                className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-3 py-2 text-sm outline-none text-white"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 p-3 bg-[#1e1e1e]">
                            <button onClick={() => setshownewfiledialog(false)} className="px-4 py-1.5 text-sm rounded hover:bg-[#3c3c3c]">Cancel</button>
                            <button onClick={createNewFile} className="px-4 py-1.5 text-sm bg-[#007acc] rounded hover:bg-[#0066b8]">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showrenamedialog && (
                <div className="absolute inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
                    <div className="bg-[#252526] rounded-lg shadow-xl w-80 overflow-hidden border border-[#454545]">
                        <div className="flex items-center gap-2 p-3 bg-[#3c3c3c]">
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
                                className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-3 py-2 text-sm outline-none text-white"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 p-3 bg-[#1e1e1e]">
                            <button onClick={() => { setshowrenamedialog(false); setselectedfileforcontext(null); }} className="px-4 py-1.5 text-sm rounded hover:bg-[#3c3c3c]">Cancel</button>
                            <button onClick={handleRenameFile} className="px-4 py-1.5 text-sm bg-[#007acc] rounded hover:bg-[#0066b8]">Rename</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
