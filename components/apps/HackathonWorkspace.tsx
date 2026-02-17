'use client';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    VscFiles, VscClose, VscTerminal, VscNewFile, VscNewFolder, VscSave,
    VscChevronDown, VscChevronRight, VscTrash, VscRunAll,
    VscHistory, VscEye, VscEyeClosed, VscSplitHorizontal,
    VscRefresh, VscSaveAll, VscGitMerge, VscGitCommit, VscGitPullRequest,
    VscCloudDownload, VscSettingsGear, VscKey, VscRepo,
} from 'react-icons/vsc';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import {
    IoTimeOutline, IoRocketOutline, IoDocumentTextOutline, IoTrashOutline,
} from 'react-icons/io5';
import dynamic from 'next/dynamic';
import { useProjects } from '../ProjectContext';
import { useTheme } from '../ThemeContext';
import { useWindows } from '../WindowContext';
import { useNotifications } from '../NotificationContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { ProjectFile } from '../../types/project';
import { api } from '../../utils/constants';
import { useRuntimeSafe } from '../RuntimeContext';
import { preloadForProject } from '../../lib/runtimes/preloader';
import { CheckpointManager } from '../../lib/checkpoints';
import { SkillAnalyzer } from '../../lib/skillAnalytics';
import { getSprintTimer, SprintState } from '../../lib/sprintTimer';
import { getAncestryTracker, recordChange as ancestryRecordChange, markPaste as ancestryMarkPaste } from '../../lib/codeAncestry';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const WebContainerTerminal = dynamic(() => import('../ui/WebContainerTerminal'), { ssr: false });

const languageMap: Record<string, string> = {
    'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'tsx': 'typescriptreact',
    'jsx': 'javascriptreact', 'json': 'json', 'html': 'html', 'css': 'css',
    'md': 'markdown', 'txt': 'plaintext', 'yml': 'yaml', 'yaml': 'yaml',
    'env': 'plaintext', 'sh': 'shell', 'go': 'go', 'rs': 'rust',
    'c': 'c', 'h': 'c', 'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'hpp': 'cpp',
    'java': 'java', 'rb': 'ruby', 'php': 'php', 'pl': 'perl',
    'lua': 'lua', 'swift': 'swift', 'kt': 'kotlin', 'kts': 'kotlin',
    'r': 'r', 'R': 'r', 'hs': 'haskell', 'ex': 'elixir', 'exs': 'elixir',
    'dart': 'dart', 'sql': 'sql', 'xml': 'xml', 'toml': 'plaintext',
    'scss': 'scss', 'less': 'less', 'svelte': 'html', 'vue': 'html',
};

const fileIcons: Record<string, { label: string; color: string }> = {
    'ts': { label: 'TS', color: '#3178C6' }, 'tsx': { label: 'TX', color: '#3178C6' },
    'js': { label: 'JS', color: '#F7DF1E' }, 'jsx': { label: 'JX', color: '#61DAFB' },
    'py': { label: 'PY', color: '#3776AB' }, 'json': { label: '{}', color: '#F5A623' },
    'html': { label: 'H', color: '#E34F26' }, 'css': { label: 'C', color: '#1572B6' },
    'md': { label: 'M', color: '#888' }, 'env': { label: 'E', color: '#4CAF50' },
    'c': { label: 'C', color: '#A8B9CC' }, 'h': { label: 'H', color: '#A8B9CC' },
    'cpp': { label: 'C+', color: '#00599C' }, 'hpp': { label: 'H+', color: '#00599C' },
    'java': { label: 'JV', color: '#ED8B00' }, 'rb': { label: 'RB', color: '#CC342D' },
    'php': { label: 'PH', color: '#777BB4' }, 'pl': { label: 'PL', color: '#39457E' },
    'lua': { label: 'LU', color: '#000080' }, 'swift': { label: 'SW', color: '#FA7343' },
    'kt': { label: 'KT', color: '#7F52FF' }, 'r': { label: 'R', color: '#276DC3' },
    'hs': { label: 'HS', color: '#5D4F85' }, 'ex': { label: 'EX', color: '#6E4A7E' },
    'dart': { label: 'DA', color: '#0175C2' }, 'go': { label: 'GO', color: '#00ADD8' },
    'rs': { label: 'RS', color: '#DEA584' }, 'sh': { label: 'SH', color: '#89E051' },
    'sql': { label: 'SQ', color: '#E38C00' }, 'xml': { label: 'XM', color: '#E44D26' },
    'yml': { label: 'YM', color: '#CB171E' }, 'yaml': { label: 'YM', color: '#CB171E' },
    'toml': { label: 'TM', color: '#9C4121' }, 'scss': { label: 'SC', color: '#CD6799' },
    'vue': { label: 'VU', color: '#42b883' }, 'svelte': { label: 'SV', color: '#FF3E00' },
};

const pistonRuntimes: Record<string, { language: string; version: string }> = {
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'go': { language: 'go', version: '1.16.2' },
    'rust': { language: 'rust', version: '1.68.2' },
    'shell': { language: 'bash', version: '5.2.0' },
    'c': { language: 'c', version: '10.2.0' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' },
    'ruby': { language: 'ruby', version: '3.0.1' },
    'php': { language: 'php', version: '8.2.3' },
    'perl': { language: 'perl', version: '5.36.0' },
    'lua': { language: 'lua', version: '5.4.4' },
    'swift': { language: 'swift', version: '5.3.3' },
    'kotlin': { language: 'kotlin', version: '1.8.20' },
    'r': { language: 'r', version: '4.1.1' },
    'haskell': { language: 'haskell', version: '9.0.1' },
    'elixir': { language: 'elixir', version: '1.11.3' },
    'dart': { language: 'dart', version: '2.19.6' },
};

const runnableLanguages = new Set(Object.keys(pistonRuntimes));

function getLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return languageMap[ext] || 'plaintext';
}

function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return fileIcons[ext] || { label: 'F', color: '#888' };
}

interface OpenTab {
    fileId: string;
    path: string;
    name: string;
    modified: boolean;
}

interface TreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children: TreeNode[];
    file?: ProjectFile;
}

function buildFileTree(files: ProjectFile[]): TreeNode[] {
    const root: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    const sorted = [...files].sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.path.localeCompare(b.path);
    });

    sorted.forEach(file => {
        const node: TreeNode = {
            name: file.name, path: file.path, isDirectory: file.isDirectory,
            children: [], file,
        };
        nodeMap.set(file.path, node);
        if (file.parentPath === '/') {
            root.push(node);
        } else {
            const parent = nodeMap.get(file.parentPath);
            if (parent) parent.children.push(node);
            else root.push(node);
        }
    });

    const sortChildren = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        nodes.forEach(n => sortChildren(n.children));
    };
    sortChildren(root);
    return root;
}

const FileTreeItem: React.FC<{
    node: TreeNode;
    depth: number;
    expandedDirs: Set<string>;
    toggleDir: (path: string) => void;
    activeFile: string | null;
    onFileClick: (file: ProjectFile) => void;
    onDelete: (file: ProjectFile) => void;
    onNewFile: (parentPath: string) => void;
}> = React.memo(({ node, depth, expandedDirs, toggleDir, activeFile, onFileClick, onDelete, onNewFile }) => {
    const isExpanded = expandedDirs.has(node.path);
    const isActive = activeFile === node.path;

    return (
        <div>
            <div
                className={`flex items-center gap-1 px-2 py-[3px] cursor-pointer text-[13px] group hover:bg-overlay ${isActive ? 'bg-overlay text-[--text-color]' : 'text-[--text-muted]'}`}
                style={{ paddingLeft: `${8 + depth * 12}px` }}
                onClick={() => {
                    if (node.isDirectory) toggleDir(node.path);
                    else if (node.file) onFileClick(node.file);
                }}
            >
                {node.isDirectory ? (
                    <>
                        {isExpanded ? <VscChevronDown size={12} className="text-[--text-muted] shrink-0" /> : <VscChevronRight size={12} className="text-[--text-muted] shrink-0" />}
                        {isExpanded ? <FaFolderOpen size={12} className="text-[#dcb67a] ml-0.5 shrink-0" /> : <FaFolder size={12} className="text-[#dcb67a] ml-0.5 shrink-0" />}
                    </>
                ) : (
                    <>
                        <span className="w-3 shrink-0" />
                        <span className="text-[9px] font-bold w-4 text-center shrink-0" style={{ color: getFileIcon(node.name).color }}>
                            {getFileIcon(node.name).label}
                        </span>
                    </>
                )}
                <span className="truncate ml-1 flex-1">{node.name}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                    {node.isDirectory && (
                        <button onClick={(e) => { e.stopPropagation(); onNewFile(node.path); }} className="p-0.5 hover:bg-[--border-color]">
                            <VscNewFile size={12} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (node.file) onDelete(node.file); }} className="p-0.5 hover:bg-[--border-color] text-pastel-red">
                        <VscTrash size={12} />
                    </button>
                </div>
            </div>
            {node.isDirectory && isExpanded && node.children.map(child => (
                <FileTreeItem
                    key={child.path}
                    node={child}
                    depth={depth + 1}
                    expandedDirs={expandedDirs}
                    toggleDir={toggleDir}
                    activeFile={activeFile}
                    onFileClick={onFileClick}
                    onDelete={onDelete}
                    onNewFile={onNewFile}
                />
            ))}
        </div>
    );
});
FileTreeItem.displayName = 'FileTreeItem';

const TerminalPanel: React.FC<{
    files?: Record<string, string>;
    onServerReady?: (url: string, port: number) => void;
}> = ({ files, onServerReady }) => {
    return <WebContainerTerminal fontSize={12} files={files} onServerReady={onServerReady} />;
};
TerminalPanel.displayName = 'TerminalPanel';

const SnapshotPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { snapshots, createSnapshot, restoreSnapshot, deleteSnapshotById } = useProjects();
    const { addToast } = useNotifications();
    const [label, setLabel] = useState('');

    return (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-surface border-l border-[--border-color] z-50 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[--border-color]">
                <span className="text-xs font-medium text-[--text-color] flex items-center gap-1.5">
                    <VscHistory size={14} /> Snapshots
                </span>
                <button onClick={onClose} className="p-1 hover:bg-overlay"><VscClose size={14} /></button>
            </div>
            <div className="p-2 border-b border-[--border-color]">
                <div className="flex gap-1">
                    <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Snapshot label..."
                        className="flex-1 bg-overlay border border-transparent focus:border-accent px-2 py-1 text-xs text-[--text-color] outline-none"
                    />
                    <button
                        onClick={async () => {
                            await createSnapshot(label || undefined);
                            setLabel('');
                            addToast('Snapshot created', 'success');
                        }}
                        className="px-2 py-1 bg-accent text-[--bg-base] text-xs hover:opacity-90"
                    >
                        <VscSaveAll size={12} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {snapshots.length === 0 && (
                    <div className="p-3 text-xs text-[--text-muted] text-center">No snapshots yet</div>
                )}
                {snapshots.map(snap => (
                    <div key={snap.id} className="flex items-center justify-between px-3 py-2 border-b border-[--border-color] hover:bg-overlay group">
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-[--text-color] truncate">{snap.metadata.label || 'Auto-save'}</div>
                            <div className="text-[10px] text-[--text-muted]">{new Date(snap.timestamp).toLocaleString()}</div>
                            <div className="text-[10px] text-[--text-muted]">{snap.files.filter(f => !f.isDirectory).length} files</div>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1">
                            <button onClick={() => { restoreSnapshot(snap.id); addToast('Snapshot restored', 'success'); }} className="p-1 hover:bg-overlay text-accent" title="Restore">
                                <VscRefresh size={12} />
                            </button>
                            <button onClick={() => { deleteSnapshotById(snap.id); addToast('Snapshot deleted', 'success'); }} className="p-1 hover:bg-overlay text-pastel-red" title="Delete">
                                <VscTrash size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HackathonTimer: React.FC = () => {
    const [state, setState] = useState<SprintState | null>(null);
    const [showSetup, setShowSetup] = useState(false);
    const [minutes, setMinutes] = useState('25');
    const timerRef = useRef(getSprintTimer());

    useEffect(() => {
        const unsub = timerRef.current.subscribe(setState);
        return () => { unsub(); };
    }, []);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!state || state.phase === 'idle') {
        if (showSetup) {
            return (
                <div className="flex items-center gap-1">
                    <input value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-10 bg-overlay border border-transparent focus:border-accent px-1 py-0.5 text-[10px] text-[--text-color] text-center outline-none" placeholder="min" />
                    <span className="text-[10px] text-[--text-muted]">min</span>
                    <button onClick={() => { timerRef.current = getSprintTimer({ workMinutes: parseInt(minutes) || 25 }); timerRef.current.subscribe(setState); timerRef.current.start(); setShowSetup(false); }} className="px-1.5 py-0.5 bg-pastel-green text-[--bg-base] text-[10px] hover:opacity-90">Start</button>
                    <button onClick={() => setShowSetup(false)} className="text-[10px] text-[--text-muted] hover:text-[--text-color]">Cancel</button>
                </div>
            );
        }
        return (
            <button onClick={() => setShowSetup(true)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[--text-muted] hover:text-[--text-color] hover:bg-overlay" title="Sprint timer">
                <IoTimeOutline size={12} /> Sprint
            </button>
        );
    }

    const isBreak = state.phase === 'break';
    const isLow = state.remaining <= 60;

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-overlay">
            <IoTimeOutline size={12} className={isLow ? 'text-pastel-red animate-pulse' : isBreak ? 'text-pastel-green' : 'text-pastel-peach'} />
            <span className={`text-[10px] font-mono font-bold ${isLow ? 'text-pastel-red' : isBreak ? 'text-pastel-green' : 'text-pastel-peach'}`}>
                {isBreak ? 'BREAK ' : `#${state.sprint} `}{formatTime(state.remaining)}
            </span>
            <button onClick={() => timerRef.current.skip()} className="text-[--text-muted] hover:text-[--text-color] text-[10px]">Skip</button>
            <button onClick={() => timerRef.current.reset()} className="text-[--text-muted] hover:text-[--text-color]"><VscClose size={10} /></button>
        </div>
    );
};

export default function HackathonWorkspace({ windowId, projectId, appId = 'hackathonworkspace', id }: { windowId?: string; projectId?: string; appId?: string; id?: string }) {
    const { currentProject, currentFiles, openProject, updateFile, createFile, deleteFileById, createSnapshot } = useProjects();
    const { theme } = useTheme();
    const { activewindow, addwindow } = useWindows();
    const { addToast } = useNotifications();
    const isActiveWindow = activewindow === (id || windowId);

    const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
    const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'output' | 'problems'>('terminal');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [snapshotPanelOpen, setSnapshotPanelOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileParent, setNewFileParent] = useState<string | null>(null);
    const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
    const [isRunning, setIsRunning] = useState(false);
    const [outputLines, setOutputLines] = useState<{ text: string; type: 'stdout' | 'stderr' | 'info' }[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [gitPanelOpen, setGitPanelOpen] = useState(false);
    const [commitMsg, setCommitMsg] = useState('');
    const [gitChanges, setGitChanges] = useState<{ filepath: string; status: string }[]>([]);
    const [gitBranch, setGitBranch] = useState<string>('');
    const [gitLoading, setGitLoading] = useState(false);
    const [gitView, setGitView] = useState<'changes' | 'log' | 'settings'>('changes');
    const [gitLogEntries, setGitLogEntries] = useState<{ oid: string; message: string; author: { name: string; email: string; timestamp: number } }[]>([]);
    const [gitBranches, setGitBranches] = useState<string[]>([]);
    const [gitRemoteUrl, setGitRemoteUrl] = useState('');
    const [gitToken, setGitToken] = useState('');
    const [gitTokenSaved, setGitTokenSaved] = useState(false);
    const [gitCloneUrl, setGitCloneUrl] = useState('');
    const [gitShowToken, setGitShowToken] = useState(false);
    const [gitRemotes, setGitRemotes] = useState<{ remote: string; url: string }[]>([]);
    const [detectedFramework, setDetectedFramework] = useState<string | null>(null);
    const [hasPackageJson, setHasPackageJson] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
    const [splitMode, setSplitMode] = useState<'horizontal' | 'vertical' | null>(null);
    const [splitFileId, setSplitFileId] = useState<string | null>(null);
    const [minimapEnabled, setMinimapEnabled] = useState(false);
    const [outputFilter, setOutputFilter] = useState('');

    const editorRef = useRef<any>(null);
    const splitEditorRef = useRef<any>(null);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const outputContainerRef = useRef<HTMLDivElement>(null);
    const [outputScrollTop, setOutputScrollTop] = useState(0);

    const runtime = useRuntimeSafe();

    const checkpointMgr = useRef<CheckpointManager | null>(null);
    useEffect(() => {
        if (!currentProject) return;
        const mgr = new CheckpointManager(currentProject.id, async () =>
            currentFiles.filter(f => !f.isDirectory).map(f => ({ path: f.path, content: f.content }))
        );
        mgr.startAutoCheckpoint(30);
        checkpointMgr.current = mgr;
        return () => { mgr.stopAutoCheckpoint(); mgr.destroy(); };
    }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const skillAnalyzer = useRef<SkillAnalyzer | null>(null);
    useEffect(() => {
        if (!currentProject) return;
        skillAnalyzer.current = new SkillAnalyzer(currentProject.id);
    }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const gitDir = currentProject ? `/projects/${currentProject.name.replace(/\s+/g, '_')}` : '';

    const refreshGitStatus = useCallback(async () => {
        if (!runtime?.git || !gitDir) return;
        try {
            const [branch, entries, logEntries, branches, remotes] = await Promise.all([
                runtime.git.currentBranch(gitDir).catch(() => undefined),
                runtime.git.status(gitDir).catch(() => []),
                runtime.git.log(gitDir, 30).catch(() => []),
                runtime.git.listBranches(gitDir).catch(() => []),
                (async () => {
                    const { gitListRemotes } = await import('../../lib/runtimes/git');
                    return gitListRemotes(gitDir).catch(() => []);
                })(),
            ]);
            setGitBranch(branch || 'main');
            const changed = entries
                .filter((e: any) => e.headStatus !== 1 || e.workdirStatus !== 1 || e.stageStatus !== 1)
                .map((e: any) => ({
                    filepath: e.filepath,
                    status: e.headStatus === 0 ? 'new' : e.workdirStatus === 2 ? 'modified' : e.workdirStatus === 0 ? 'deleted' : 'unknown',
                }));
            setGitChanges(changed);
            setGitLogEntries(logEntries);
            setGitBranches(branches);
            setGitRemotes(remotes);
            if (remotes.length > 0 && !gitRemoteUrl) {
                setGitRemoteUrl(remotes[0].url);
            }
        } catch {
            setGitChanges([]);
            setGitBranch('');
            setGitLogEntries([]);
            setGitBranches([]);
            setGitRemotes([]);
        }
    }, [runtime, gitDir, gitRemoteUrl]);

    useEffect(() => {
        if (gitPanelOpen) refreshGitStatus();
    }, [gitPanelOpen, refreshGitStatus]);

    const handleGitInit = useCallback(async () => {
        if (!runtime?.git || !gitDir) return;
        setGitLoading(true);
        try {
            await runtime.git.init(gitDir);
            for (const f of currentFiles) {
                if (!f.isDirectory) {
                    const { writeGitFile } = await import('../../lib/runtimes/git');
                    await writeGitFile(`${gitDir}/${f.path}`, f.content);
                }
            }
            await refreshGitStatus();
            addToast('Git repository initialized', 'success');
        } catch (err: any) {
            addToast('Git init failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, currentFiles, refreshGitStatus, addToast]);

    const handleGitCommit = useCallback(async () => {
        if (!runtime?.git || !gitDir || !commitMsg.trim()) return;
        setGitLoading(true);
        try {
            for (const f of currentFiles) {
                if (!f.isDirectory) {
                    const { writeGitFile } = await import('../../lib/runtimes/git');
                    await writeGitFile(`${gitDir}/${f.path}`, f.content);
                }
            }
            const oid = await runtime.git.commit({ dir: gitDir, message: commitMsg, author: { name: 'NextarOS User', email: 'user@nextaros.dev' } });
            setCommitMsg('');
            await refreshGitStatus();
            addToast('Committed: ' + oid.slice(0, 7), 'success');
        } catch (err: any) {
            addToast('Commit failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, commitMsg, currentFiles, refreshGitStatus, addToast]);

    const handleGitPull = useCallback(async () => {
        if (!runtime?.git || !gitDir) return;
        setGitLoading(true);
        try {
            await runtime.git.pull(gitDir);
            await refreshGitStatus();
            addToast('Pulled — up to date', 'success');
        } catch (err: any) {
            addToast('Pull failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, refreshGitStatus, addToast]);

    const handleGitPush = useCallback(async () => {
        if (!runtime?.git || !gitDir) return;
        setGitLoading(true);
        try {
            await runtime.git.push({ dir: gitDir, token: gitToken });
            addToast('Pushed to remote', 'success');
        } catch (err: any) {
            addToast('Push failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, gitToken, addToast]);

    const handleSetRemote = useCallback(async (url: string) => {
        if (!runtime?.git || !gitDir || !url.trim()) return;
        setGitLoading(true);
        try {
            const { gitAddRemote, gitRemoveRemote, gitListRemotes } = await import('../../lib/runtimes/git');
            const existing = await gitListRemotes(gitDir);
            const origin = existing.find(r => r.remote === 'origin');
            if (origin) {
                await gitRemoveRemote(gitDir, 'origin');
            }
            await gitAddRemote(gitDir, 'origin', url);
            setGitRemoteUrl(url);
            await refreshGitStatus();
            addToast('Remote origin set', 'success');
        } catch (err: any) {
            addToast('Set remote failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, refreshGitStatus, addToast]);

    const handleGitClone = useCallback(async () => {
        if (!runtime?.git || !gitCloneUrl.trim()) return;
        setGitLoading(true);
        try {
            const repoName = gitCloneUrl.split('/').pop()?.replace('.git', '') || 'cloned-repo';
            const cloneDir = `/projects/${repoName}`;
            await runtime.git.clone({ url: gitCloneUrl, dir: cloneDir, depth: 10, corsProxy: 'https://cors.isomorphic-git.org' });
            const { listGitDir, readGitFile } = await import('../../lib/runtimes/git');

            const importFiles = async (dir: string, prefix: string): Promise<{ path: string; content: string; isDir: boolean }[]> => {
                const entries = await listGitDir(dir);
                const results: { path: string; content: string; isDir: boolean }[] = [];
                for (const entry of entries) {
                    if (entry === '.git') continue;
                    const fullPath = `${dir}/${entry}`;
                    const relPath = prefix ? `${prefix}/${entry}` : entry;
                    try {
                        const content = await readGitFile(fullPath);
                        results.push({ path: relPath, content, isDir: false });
                    } catch {
                        results.push({ path: relPath, content: '', isDir: true });
                        const subEntries = await importFiles(fullPath, relPath);
                        results.push(...subEntries);
                    }
                }
                return results;
            };

            const files = await importFiles(cloneDir, '');
            for (const f of files) {
                if (f.isDir) {
                    await createFile(f.path, '', true);
                } else {
                    await createFile(f.path, f.content, false);
                }
            }
            setGitCloneUrl('');
            await refreshGitStatus();
            addToast(`Cloned ${repoName} (${files.filter(f => !f.isDir).length} files)`, 'success');
        } catch (err: any) {
            addToast('Clone failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitCloneUrl, createFile, refreshGitStatus, addToast]);

    const handleGitCheckout = useCallback(async (branch: string) => {
        if (!runtime?.git || !gitDir) return;
        setGitLoading(true);
        try {
            const { gitCheckout } = await import('../../lib/runtimes/git');
            await gitCheckout(gitDir, branch);
            await refreshGitStatus();
            addToast(`Switched to ${branch}`, 'success');
        } catch (err: any) {
            addToast('Checkout failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, refreshGitStatus, addToast]);

    const handleSaveToken = useCallback(async () => {
        if (!gitToken.trim()) return;
        try {
            const { encryptAndStore } = await import('../../utils/secureStorage');
            await encryptAndStore('git-pat', gitToken);
            setGitTokenSaved(true);
            addToast('Token saved securely', 'success');
        } catch (err: any) {
            addToast('Failed to save token: ' + err.message, 'error');
        }
    }, [gitToken, addToast]);

    useEffect(() => {
        (async () => {
            try {
                const { retrieveAndDecrypt } = await import('../../utils/secureStorage');
                const saved = await retrieveAndDecrypt('git-pat');
                if (saved) {
                    setGitToken(saved);
                    setGitTokenSaved(true);
                }
            } catch {
            }
        })();
    }, []);

    useEffect(() => {
        if (projectId && (!currentProject || currentProject.id !== projectId)) {
            openProject(projectId);
        }
    }, [projectId, currentProject, openProject]);

    const fileTree = useMemo(() => buildFileTree(currentFiles), [currentFiles]);

    useEffect(() => {
        const rootDirs = currentFiles.filter(f => f.isDirectory && f.parentPath === '/').map(f => f.path);
        setExpandedDirs(new Set(rootDirs));
    }, [currentFiles]);

    useEffect(() => {
        if (currentFiles.length > 0) {
            preloadForProject(currentFiles.map(f => f.path));
        }
    }, [currentFiles]);

    useEffect(() => {
        const pkgFile = currentFiles.find(f => f.name === 'package.json' && !f.isDirectory);
        setHasPackageJson(!!pkgFile);
        if (!pkgFile) { setDetectedFramework(null); return; }
        try {
            const pkg = JSON.parse(pkgFile.content);
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (allDeps['next']) setDetectedFramework('Next.js');
            else if (allDeps['@remix-run/react']) setDetectedFramework('Remix');
            else if (allDeps['nuxt']) setDetectedFramework('Nuxt');
            else if (allDeps['svelte'] || allDeps['@sveltejs/kit']) setDetectedFramework('Svelte');
            else if (allDeps['vue']) setDetectedFramework('Vue');
            else if (allDeps['react']) setDetectedFramework('React');
            else if (allDeps['express']) setDetectedFramework('Express');
            else if (allDeps['fastify']) setDetectedFramework('Fastify');
            else if (allDeps['hono']) setDetectedFramework('Hono');
            else if (allDeps['vite']) setDetectedFramework('Vite');
            else setDetectedFramework(null);
        } catch {
            setDetectedFramework(null);
        }
    }, [currentFiles]);

    const toggleDir = useCallback((path: string) => {
        setExpandedDirs(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path); else next.add(path);
            return next;
        });
    }, []);

    const openFile = useCallback((file: ProjectFile) => {
        if (file.isDirectory) return;
        const existing = openTabs.find(t => t.fileId === file.id);
        if (!existing) {
            setOpenTabs(prev => [...prev, { fileId: file.id, path: file.path, name: file.name, modified: false }]);
        }
        setActiveTab(file.id);
        if (!fileContents.has(file.id)) {
            setFileContents(prev => new Map(prev).set(file.id, file.content));
        }
    }, [openTabs, fileContents]);

    const closeTab = useCallback((fileId: string) => {
        setOpenTabs(prev => {
            const filtered = prev.filter(t => t.fileId !== fileId);
            if (activeTab === fileId) {
                setActiveTab(filtered.length > 0 ? filtered[filtered.length - 1].fileId : null);
            }
            return filtered;
        });
        setFileContents(prev => { const next = new Map(prev); next.delete(fileId); return next; });
    }, [activeTab]);

    const handleEditorChange = useCallback((value: string | undefined, fileId: string) => {
        if (value === undefined) return;
        setFileContents(prev => new Map(prev).set(fileId, value));
        setOpenTabs(prev => prev.map(t => t.fileId === fileId ? { ...t, modified: true } : t));
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(async () => {
            await updateFile(fileId, value);
            setOpenTabs(prev => prev.map(t => t.fileId === fileId ? { ...t, modified: false } : t));
        }, 2000);
    }, [updateFile]);

    const saveCurrentFile = useCallback(async () => {
        if (!activeTab) return;
        const content = fileContents.get(activeTab);
        if (content !== undefined) {
            await updateFile(activeTab, content);
            setOpenTabs(prev => prev.map(t => t.fileId === activeTab ? { ...t, modified: false } : t));
            const tab = openTabs.find(t => t.fileId === activeTab);
            addToast(`Saved ${tab?.name || 'file'}`, 'success');
        }
    }, [activeTab, fileContents, updateFile, openTabs, addToast]);

    const handleNewFile = useCallback(async (parentPath: string) => {
        setNewFileParent(parentPath);
        setNewFileName('');
    }, []);

    const confirmNewFile = useCallback(async () => {
        if (!newFileName || !newFileParent) return;
        const path = newFileParent === '/' ? newFileName : `${newFileParent}/${newFileName}`;
        const isDir = newFileName.endsWith('/');
        const cleanName = isDir ? newFileName.slice(0, -1) : newFileName;
        const cleanPath = isDir ? path.slice(0, -1) : path;
        await createFile(cleanPath, '', isDir);
        setNewFileName('');
        setNewFileParent(null);
        addToast(`Created ${isDir ? 'folder' : 'file'}: ${cleanName}`, 'success');
        if (!isDir) {
            const file = currentFiles.find(f => f.path === cleanPath);
            if (file) openFile(file);
        }
    }, [newFileName, newFileParent, createFile, currentFiles, openFile, addToast]);

    const handleDeleteFile = useCallback(async (file: ProjectFile) => {
        await deleteFileById(file.id);
        if (openTabs.find(t => t.fileId === file.id)) closeTab(file.id);
        addToast(`Deleted ${file.name}`, 'success');
    }, [deleteFileById, openTabs, closeTab, addToast]);

    useEffect(() => {
        if (outputContainerRef.current) {
            outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
        }
    }, [outputLines]);

    const appendOutput = useCallback((text: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') => {
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setOutputLines(prev => [...prev, { text: `[${ts}] ${text}`, type }]);
    }, []);

    const gatherCompanionFiles = useCallback((activeFileId: string, lang: string): Record<string, string> => {
        const langFamily: Record<string, string[]> = {
            'python': ['py'],
            'javascript': ['js', 'mjs'],
            'typescript': ['ts'],
            'typescriptreact': ['tsx'],
            'javascriptreact': ['jsx'],
        };
        const exts = langFamily[lang] || [];
        const companions: Record<string, string> = {};
        for (const f of currentFiles) {
            if (f.isDirectory || f.id === activeFileId) continue;
            const ext = f.name.split('.').pop()?.toLowerCase() || '';
            if (exts.includes(ext)) {
                const content = fileContents.get(f.id) ?? f.content;
                companions[f.name] = content;
            }
        }
        return companions;
    }, [currentFiles, fileContents]);

    const runCode = useCallback(async () => {
        if (!activeTab) return;
        const tab = openTabs.find(t => t.fileId === activeTab);
        const content = fileContents.get(activeTab);
        if (!tab || content === undefined) return;

        const lang = getLanguage(tab.name);
        const companions = gatherCompanionFiles(activeTab, lang);

        setIsRunning(true);
        setBottomPanelOpen(true);
        setBottomPanelTab('output');
        setOutputLines([]);

        const execStart = performance.now();

        if (runtime) {
            appendOutput(`Running ${tab.name} via ${runtime.resolveRuntime(lang)}...`, 'info');
            try {
                const result = await runtime.execute({ language: lang, code: content, files: companions });
                if (result.stdout) result.stdout.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stdout'));
                if (result.stderr) result.stderr.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stderr'));
                if (!result.stdout && !result.stderr) {
                    appendOutput(`Exited with code ${result.exitCode} (${result.durationMs?.toFixed(0)}ms)`, 'info');
                }
                const dur = performance.now() - execStart;
                if (result.exitCode === 0) skillAnalyzer.current?.recordSuccess(`run:${lang}`, dur);
                else skillAnalyzer.current?.recordFailure(`run:${lang}`, result.stderr || 'non-zero exit', dur);
            } catch (err: any) {
                appendOutput(err.message || 'Execution failed', 'stderr');
                skillAnalyzer.current?.recordFailure(`run:${lang}`, err.message, performance.now() - execStart);
            } finally {
                setIsRunning(false);
            }
            return;
        }

        const pistonRuntime = pistonRuntimes[lang];
        if (!pistonRuntime) {
            appendOutput(`Language "${lang}" is not supported for execution.`, 'stderr');
            appendOutput(`Supported: ${Object.keys(pistonRuntimes).join(', ')}`, 'info');
            setBottomPanelOpen(true);
            setBottomPanelTab('output');
            setIsRunning(false);
            return;
        }
        appendOutput(`Running ${tab.name} (${pistonRuntime.language} ${pistonRuntime.version})...`, 'info');

        try {
            const pistonFiles: { name?: string; content: string }[] = [{ name: tab.name, content }];
            for (const [name, code] of Object.entries(companions)) {
                pistonFiles.push({ name, content: code });
            }

            const response = await fetch(api.pistonExecuteUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: pistonRuntime.language, version: pistonRuntime.version, files: pistonFiles })
            });
            const data = await response.json();
            const dur = performance.now() - execStart;
            if (data.run) {
                if (data.run.stdout) data.run.stdout.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stdout'));
                if (data.run.stderr) data.run.stderr.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stderr'));
                if (!data.run.stdout && !data.run.stderr) {
                    if (data.run.output) data.run.output.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stdout'));
                    else appendOutput(`Exited with code ${data.run.code ?? 0}`, 'info');
                }
                const code = data.run.code ?? 0;
                if (code === 0) skillAnalyzer.current?.recordSuccess(`run:${lang}`, dur);
                else skillAnalyzer.current?.recordFailure(`run:${lang}`, data.run.stderr || '', dur);
            } else {
                appendOutput('Failed to execute', 'stderr');
                skillAnalyzer.current?.recordFailure(`run:${lang}`, 'Failed to execute', dur);
            }
        } catch {
            appendOutput('Network request failed', 'stderr');
            skillAnalyzer.current?.recordFailure(`run:${lang}`, 'Network error', performance.now() - execStart);
        } finally {
            setIsRunning(false);
        }
    }, [activeTab, openTabs, fileContents, appendOutput, runtime, gatherCompanionFiles]);

    const openInSplit = useCallback((file: ProjectFile) => {
        if (file.isDirectory) return;
        setSplitFileId(file.id);
        if (!fileContents.has(file.id)) {
            setFileContents(prev => new Map(prev).set(file.id, file.content));
        }
        if (!splitMode) setSplitMode('vertical');
    }, [fileContents, splitMode]);

    const runAsApp = useCallback(() => {
        if (!activeTab) return;
        const tab = openTabs.find(t => t.fileId === activeTab);
        const content = fileContents.get(activeTab);
        if (!tab || content === undefined) return;

        const lang = getLanguage(tab.name);
        const isJsx = lang === 'javascriptreact' || tab.name.endsWith('.jsx');
        const isTsx = lang === 'typescriptreact' || tab.name.endsWith('.tsx');
        const isJs = lang === 'javascript' || tab.name.endsWith('.js');

        if (!isJsx && !isTsx && !isJs) {
            addToast('Only .jsx, .tsx, or .js files can run as apps', 'error');
            return;
        }

        const appname = tab.name.replace(/\.(jsx|tsx|js)$/, '');
        addwindow({
            id: `userapp-${appname}-${Date.now()}`,
            appname: appname,
            title: appname,
            component: 'DynamicAppRunner',
            icon: '/code.png',
            props: { code: content, appname: appname, appicon: '🚀', fileid: tab.fileId }
        });
        addToast(`Launched ${appname}`, 'success');
    }, [activeTab, openTabs, fileContents, addwindow, addToast]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveCurrentFile(); }
            if ((e.metaKey || e.ctrlKey) && e.key === '`') { e.preventDefault(); setBottomPanelOpen(p => !p); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); setSidebarOpen(p => !p); }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') { e.preventDefault(); setFocusMode(p => !p); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [saveCurrentFile]);

    const workspaceMenus = useMemo(() => ({
        File: [
            { title: "Save", actionId: "save-file", shortcut: "⌘S" },
            { title: "New File", actionId: "new-file", shortcut: "⌘N" },
            { separator: true },
            { title: "Create Snapshot", actionId: "create-snapshot" },
        ],
        Run: [
            { title: "Run Code", actionId: "run-code", shortcut: "⌘R" },
            { title: "Run as App", actionId: "run-as-app" },
        ],
        View: [
            { title: "Toggle Sidebar", actionId: "toggle-sidebar", shortcut: "⌘B" },
            { title: "Toggle Terminal", actionId: "toggle-terminal", shortcut: "⌘`" },
            { title: "Toggle Output", actionId: "toggle-output" },
            { title: "Toggle Preview", actionId: "toggle-preview" },
            { separator: true },
            { title: "Focus Mode", actionId: "focus-mode", shortcut: "⇧⌘F" },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'save-file': () => saveCurrentFile(),
        'new-file': () => handleNewFile('/'),
        'create-snapshot': async () => { await createSnapshot(); addToast('Snapshot created', 'success'); },
        'run-code': () => runCode(),
        'run-as-app': () => runAsApp(),
        'toggle-sidebar': () => setSidebarOpen(p => !p),
        'toggle-terminal': () => { setBottomPanelOpen(p => !p); setBottomPanelTab('terminal'); },
        'toggle-output': () => { setBottomPanelOpen(p => !p); setBottomPanelTab('output'); },
        'toggle-preview': () => setPreviewOpen(p => !p),
        'focus-mode': () => setFocusMode(p => !p),
    }), [saveCurrentFile, handleNewFile, createSnapshot, addToast, runCode, runAsApp]);

    useMenuRegistration(workspaceMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id || windowId);

    const activeFileContent = activeTab ? fileContents.get(activeTab) : undefined;
    const activeFileName = openTabs.find(t => t.fileId === activeTab)?.name || '';
    const activeFileLang = activeFileName ? getLanguage(activeFileName) : '';
    const isRunnable = runnableLanguages.has(activeFileLang);
    const isAppRunnable = ['javascriptreact', 'typescriptreact', 'javascript'].includes(activeFileLang);

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-full bg-[--bg-base] text-[--text-color] font-mono">
                <div className="text-center space-y-3">
                    <div className="text-4xl">🚀</div>
                    <div className="text-lg font-medium">No project loaded</div>
                    <div className="text-[13px] text-[--text-muted]">Open a project from the Project Dashboard</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[--bg-base] text-[--text-muted] text-xs overflow-hidden relative font-mono">
            <div className="flex items-center justify-between px-2 py-1 bg-surface border-b border-[--border-color] shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => setSidebarOpen(p => !p)} className={`p-1 hover:bg-overlay ${sidebarOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Toggle sidebar (Cmd+B)">
                        <VscFiles size={14} />
                    </button>
                    <button onClick={() => setGitPanelOpen(p => !p)} className={`p-1 hover:bg-overlay ${gitPanelOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Git panel">
                        <VscGitMerge size={14} />
                    </button>
                    <span className="text-[--text-color] font-medium">{currentProject.name}</span>
                    {detectedFramework && (
                        <span className="px-1.5 py-0.5 bg-overlay text-[10px] text-pastel-blue">{detectedFramework}</span>
                    )}
                    {currentProject.stack && !detectedFramework && (
                        <div className="flex items-center gap-1 ml-2">
                            {currentProject.stack.slice(0, 3).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-overlay text-[10px] text-[--text-muted]">{s}</span>
                            ))}
                        </div>
                    )}
                    {hasPackageJson && (
                        <button
                            onClick={() => { setBottomPanelOpen(true); setBottomPanelTab('terminal'); }}
                            className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-pastel-green hover:bg-overlay"
                            title="Open terminal to run dev server"
                        >
                            <VscRunAll size={10} /> Dev Server
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <HackathonTimer />
                    <button onClick={() => setSnapshotPanelOpen(p => !p)} className="p-1 hover:bg-overlay text-[--text-muted] hover:text-[--text-color]" title="Snapshots">
                        <VscHistory size={14} />
                    </button>
                    <button onClick={async () => { await createSnapshot(); addToast('Snapshot created', 'success'); }} className="p-1 hover:bg-overlay text-[--text-muted] hover:text-[--text-color]" title="Quick snapshot">
                        <VscSaveAll size={14} />
                    </button>
                    <button onClick={() => setPreviewOpen(p => !p)} className={`p-1 hover:bg-overlay ${previewOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Toggle preview">
                        {previewOpen ? <VscEye size={14} /> : <VscEyeClosed size={14} />}
                    </button>
                    <button onClick={() => setBottomPanelOpen(p => !p)} className={`p-1 hover:bg-overlay ${bottomPanelOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Toggle terminal (Cmd+`)">
                        <VscTerminal size={14} />
                    </button>
                    <button onClick={() => setFocusMode(p => !p)} className={`p-1 hover:bg-overlay ${focusMode ? 'text-pastel-peach' : 'text-[--text-muted]'}`} title="Focus mode (Cmd+Shift+F)">
                        <VscSplitHorizontal size={14} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {sidebarOpen && !focusMode && (
                    <div className="w-56 bg-surface border-r border-[--border-color] flex flex-col shrink-0">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[--border-color]">
                            <span className="text-[10px] uppercase tracking-wider text-[--text-muted] font-medium">Explorer</span>
                            <div className="flex items-center gap-0.5">
                                <button onClick={() => handleNewFile('/')} className="p-0.5 hover:bg-overlay" title="New file"><VscNewFile size={12} /></button>
                                <button onClick={() => { setNewFileParent('/'); setNewFileName(''); }} className="p-0.5 hover:bg-overlay" title="New folder"><VscNewFolder size={12} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto py-1">
                            {fileTree.map(node => (
                                <FileTreeItem
                                    key={node.path}
                                    node={node}
                                    depth={0}
                                    expandedDirs={expandedDirs}
                                    toggleDir={toggleDir}
                                    activeFile={activeTab ? openTabs.find(t => t.fileId === activeTab)?.path || null : null}
                                    onFileClick={openFile}
                                    onDelete={handleDeleteFile}
                                    onNewFile={handleNewFile}
                                />
                            ))}
                        </div>
                        {newFileParent !== null && (
                            <div className="px-2 py-1.5 border-t border-[--border-color]">
                                <input
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') confirmNewFile(); if (e.key === 'Escape') setNewFileParent(null); }}
                                    placeholder="filename.ext (or dir/)"
                                    className="w-full bg-overlay border border-transparent focus:border-accent px-2 py-1 text-xs text-[--text-color] outline-none"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                )}

                {gitPanelOpen && !focusMode && (
                    <div className="w-64 bg-surface border-r border-[--border-color] flex flex-col shrink-0">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[--border-color]">
                            <span className="text-[10px] uppercase tracking-wider text-[--text-muted] font-medium flex items-center gap-1">
                                <VscGitMerge size={10} /> Source Control
                                {gitBranch && <span className="text-pastel-blue normal-case tracking-normal">({gitBranch})</span>}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <button onClick={refreshGitStatus} className="p-0.5 hover:bg-overlay" title="Refresh">
                                    <VscRefresh size={10} className="text-[--text-muted]" />
                                </button>
                                <button onClick={() => setGitPanelOpen(false)} className="p-0.5 hover:bg-overlay">
                                    <VscClose size={12} className="text-[--text-muted]" />
                                </button>
                            </div>
                        </div>

                        {gitBranch && (
                            <div className="flex items-center border-b border-[--border-color] shrink-0">
                                <button
                                    onClick={() => setGitView('changes')}
                                    className={`flex-1 py-1 text-[10px] font-medium text-center ${gitView === 'changes' ? 'text-[--text-color] border-b border-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                >Changes</button>
                                <button
                                    onClick={() => setGitView('log')}
                                    className={`flex-1 py-1 text-[10px] font-medium text-center ${gitView === 'log' ? 'text-[--text-color] border-b border-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                >Log</button>
                                <button
                                    onClick={() => setGitView('settings')}
                                    className={`flex-1 py-1 text-[10px] font-medium text-center ${gitView === 'settings' ? 'text-[--text-color] border-b border-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                >Settings</button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {!gitBranch && (
                                <div className="px-2 py-3 space-y-3">
                                    <div className="text-center">
                                        <VscRepo size={20} className="mx-auto text-[--text-muted] mb-2 opacity-50" />
                                        <p className="text-[10px] text-[--text-muted] mb-2">No git repository</p>
                                        <button onClick={handleGitInit} disabled={gitLoading}
                                            className="w-full py-1 text-[10px] bg-pastel-blue text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                            {gitLoading ? 'Initializing...' : 'Initialize Repository'}
                                        </button>
                                    </div>
                                    <div className="border-t border-[--border-color] pt-3">
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <VscCloudDownload size={11} className="text-pastel-blue" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Clone Repository</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={gitCloneUrl}
                                            onChange={e => setGitCloneUrl(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleGitClone(); }}
                                            placeholder="https://github.com/user/repo.git"
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-accent placeholder:text-[--text-muted] mb-1.5"
                                        />
                                        <button onClick={handleGitClone} disabled={gitLoading || !gitCloneUrl.trim()}
                                            className="w-full py-1 text-[10px] bg-accent text-[--bg-base] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                            {gitLoading ? 'Cloning...' : 'Clone'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {gitBranch && gitView === 'changes' && (
                                <>
                                    <div className="px-2 py-2 border-b border-[--border-color]">
                                        <input
                                            type="text"
                                            value={commitMsg}
                                            onChange={e => setCommitMsg(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleGitCommit(); }}
                                            placeholder="Commit message..."
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-accent placeholder:text-[--text-muted] mb-1.5"
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={handleGitCommit} disabled={gitLoading || !commitMsg.trim()}
                                                className="flex-1 py-1 text-[10px] bg-pastel-green text-[--bg-base] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1">
                                                <VscGitCommit size={10} />
                                                {gitLoading ? 'Committing...' : 'Commit'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1.5 border-b border-[--border-color] flex gap-1">
                                        <button onClick={handleGitPull} disabled={gitLoading}
                                            className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] hover:bg-overlay text-[--text-muted] hover:text-[--text-color] disabled:opacity-50 transition-colors border border-[--border-color]">
                                            <VscRefresh size={10} /> Pull
                                        </button>
                                        <button onClick={handleGitPush} disabled={gitLoading || !gitToken}
                                            className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] hover:bg-overlay text-[--text-muted] hover:text-[--text-color] disabled:opacity-50 transition-colors border border-[--border-color]"
                                            title={!gitToken ? 'Set a PAT in Settings tab to push' : 'Push to remote'}>
                                            <VscGitPullRequest size={10} /> Push
                                        </button>
                                    </div>
                                    {gitBranches.length > 1 && (
                                        <div className="px-2 py-1.5 border-b border-[--border-color]">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-[10px] text-[--text-muted] font-medium">Branch</span>
                                            </div>
                                            <select
                                                value={gitBranch}
                                                onChange={(e) => handleGitCheckout(e.target.value)}
                                                className="w-full bg-overlay border border-[--border-color] px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-accent"
                                            >
                                                {gitBranches.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="px-2 py-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] text-[--text-muted] font-medium">
                                                Changes {gitChanges.length > 0 && <span className="text-accent">({gitChanges.length})</span>}
                                            </span>
                                        </div>
                                        {gitChanges.length === 0 ? (
                                            <div className="text-[10px] text-[--text-muted] opacity-60 text-center py-3">
                                                No changes detected
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {gitChanges.map(c => (
                                                    <div key={c.filepath} className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] hover:bg-overlay">
                                                        <span className={`font-bold w-3 text-center shrink-0 ${c.status === 'new' ? 'text-pastel-green' : c.status === 'deleted' ? 'text-pastel-red' : 'text-pastel-yellow'}`}>
                                                            {c.status === 'new' ? 'A' : c.status === 'deleted' ? 'D' : 'M'}
                                                        </span>
                                                        <span className="text-[--text-muted] truncate">{c.filepath}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {gitBranch && gitView === 'log' && (
                                <div className="flex flex-col">
                                    {gitLogEntries.length === 0 ? (
                                        <div className="text-[10px] text-[--text-muted] opacity-60 text-center py-6">
                                            No commits yet
                                        </div>
                                    ) : (
                                        gitLogEntries.map(entry => (
                                            <div key={entry.oid} className="px-2 py-1.5 border-b border-[--border-color] hover:bg-overlay">
                                                <div className="flex items-start gap-1.5">
                                                    <span className="text-pastel-blue font-mono text-[10px] shrink-0 mt-0.5">{entry.oid.slice(0, 7)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] text-[--text-color] truncate">{entry.message.split('\n')[0]}</div>
                                                        <div className="text-[9px] text-[--text-muted] mt-0.5">
                                                            {entry.author.name} · {new Date(entry.author.timestamp * 1000).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {gitBranch && gitView === 'settings' && (
                                <div className="px-2 py-2 space-y-3">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <VscGitPullRequest size={11} className="text-pastel-blue" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Remote URL</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={gitRemoteUrl}
                                            onChange={e => setGitRemoteUrl(e.target.value)}
                                            placeholder="https://github.com/user/repo.git"
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-accent placeholder:text-[--text-muted] mb-1.5"
                                        />
                                        <button onClick={() => handleSetRemote(gitRemoteUrl)} disabled={gitLoading || !gitRemoteUrl.trim()}
                                            className="w-full py-1 text-[10px] bg-accent text-[--bg-base] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                            {gitRemotes.find(r => r.remote === 'origin') ? 'Update Remote' : 'Set Remote'}
                                        </button>
                                        {gitRemotes.length > 0 && (
                                            <div className="mt-1.5">
                                                <span className="text-[9px] text-[--text-muted]">Current remotes:</span>
                                                {gitRemotes.map(r => (
                                                    <div key={r.remote} className="text-[9px] text-[--text-muted] truncate mt-0.5">
                                                        <span className="text-pastel-blue">{r.remote}</span> → {r.url}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-[--border-color] pt-3">
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <VscKey size={11} className="text-pastel-peach" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Personal Access Token</span>
                                        </div>
                                        <div className="flex gap-1 mb-1.5">
                                            <input
                                                type={gitShowToken ? 'text' : 'password'}
                                                value={gitToken}
                                                onChange={e => { setGitToken(e.target.value); setGitTokenSaved(false); }}
                                                placeholder="ghp_xxxxxxxxxxxx"
                                                className="flex-1 bg-[--bg-base] border border-[--border-color] px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-accent placeholder:text-[--text-muted] font-mono"
                                            />
                                            <button
                                                onClick={() => setGitShowToken(p => !p)}
                                                className="px-1.5 border border-[--border-color] hover:bg-overlay text-[--text-muted]"
                                                title={gitShowToken ? 'Hide token' : 'Show token'}
                                            >
                                                {gitShowToken ? <VscEyeClosed size={10} /> : <VscEye size={10} />}
                                            </button>
                                        </div>
                                        <button onClick={handleSaveToken} disabled={!gitToken.trim() || gitTokenSaved}
                                            className="w-full py-1 text-[10px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity bg-pastel-peach text-[--bg-base]">
                                            {gitTokenSaved ? 'Token Saved' : 'Save Token'}
                                        </button>
                                        <p className="text-[9px] text-[--text-muted] mt-1 opacity-70">
                                            Encrypted with AES-256-GCM and stored in IndexedDB
                                        </p>
                                    </div>

                                    <div className="border-t border-[--border-color] pt-3">
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <VscGitMerge size={11} className="text-pastel-green" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Branches</span>
                                        </div>
                                        {gitBranches.length === 0 ? (
                                            <div className="text-[10px] text-[--text-muted] opacity-60">No branches</div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {gitBranches.map(b => (
                                                    <div key={b}
                                                        onClick={() => { if (b !== gitBranch) handleGitCheckout(b); }}
                                                        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] cursor-pointer ${b === gitBranch ? 'bg-accent text-[--bg-base]' : 'text-[--text-muted] hover:bg-overlay hover:text-[--text-color]'}`}
                                                    >
                                                        <VscGitMerge size={10} />
                                                        <span className="truncate">{b}</span>
                                                        {b === gitBranch && <span className="ml-auto text-[9px]">current</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-[--border-color] pt-3">
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <VscSettingsGear size={11} className="text-[--text-muted]" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Clone</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={gitCloneUrl}
                                            onChange={e => setGitCloneUrl(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleGitClone(); }}
                                            placeholder="https://github.com/user/repo.git"
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-accent placeholder:text-[--text-muted] mb-1.5"
                                        />
                                        <button onClick={handleGitClone} disabled={gitLoading || !gitCloneUrl.trim()}
                                            className="w-full py-1 text-[10px] bg-accent text-[--bg-base] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                            {gitLoading ? 'Cloning...' : 'Clone into Project'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                    {openTabs.length > 0 && (
                        <div className="flex items-center bg-surface border-b border-[--border-color] overflow-x-auto shrink-0">
                            {openTabs.map(tab => (
                                <div
                                    key={tab.fileId}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-r border-[--border-color] min-w-0 ${activeTab === tab.fileId ? 'bg-[--bg-base] text-[--text-color]' : 'text-[--text-muted] hover:bg-overlay'}`}
                                    onClick={() => setActiveTab(tab.fileId)}
                                >
                                    <span className="text-[9px] font-bold shrink-0" style={{ color: getFileIcon(tab.name).color }}>
                                        {getFileIcon(tab.name).label}
                                    </span>
                                    <span className="truncate text-xs">
                                        {tab.modified && <span className="text-[--text-color]">● </span>}
                                        {tab.name}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); closeTab(tab.fileId); }}
                                        className="ml-1 p-0.5 hover:bg-overlay shrink-0"
                                    >
                                        <VscClose size={12} />
                                    </button>
                                </div>
                            ))}
                            <div className="flex-1" />
                            <div className="flex items-center gap-1 px-2 shrink-0">
                                <button onClick={saveCurrentFile} disabled={!openTabs.find(t => t.fileId === activeTab)?.modified} className={`flex items-center gap-1 px-2 py-1 text-xs ${openTabs.find(t => t.fileId === activeTab)?.modified ? 'text-[--text-color] hover:bg-overlay' : 'text-[--text-muted]'}`} title="Save (Cmd+S)">
                                    <VscSave size={14} />
                                </button>
                                {isRunnable && (
                                    <button onClick={runCode} disabled={isRunning} className={`flex items-center gap-1 px-2 py-1 text-xs ${isRunning ? 'text-[--text-muted]' : 'text-pastel-green hover:bg-overlay'}`} title="Run Code (Cmd+R)">
                                        <VscRunAll size={16} /> Run
                                    </button>
                                )}
                                {isAppRunnable && (
                                    <button onClick={runAsApp} className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-overlay" title="Run as App (opens new window)">
                                        <IoRocketOutline size={14} /> App
                                    </button>
                                )}
                                <button
                                    onClick={() => setMinimapEnabled(p => !p)}
                                    className={`p-1 ${minimapEnabled ? 'text-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`}
                                    title="Toggle Minimap"
                                >
                                    <VscEye size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (splitMode) { setSplitMode(null); setSplitFileId(null); }
                                        else setSplitMode('vertical');
                                    }}
                                    className={`p-1 ${splitMode ? 'text-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`}
                                    title="Split Editor"
                                >
                                    <VscSplitHorizontal size={14} />
                                </button>
                                <button onClick={() => { setBottomPanelOpen(true); setBottomPanelTab('output'); }} className={`p-1 ${bottomPanelOpen && bottomPanelTab === 'output' ? 'text-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`} title="Output Panel">
                                    <VscTerminal size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab && activeFileName && (
                        <div className="flex items-center px-2 py-0.5 bg-surface border-b border-[--border-color] shrink-0 gap-1 text-[10px]">
                            {activeFileName.split('/').length > 1 ? (
                                activeFileName.split('/').map((seg, i, arr) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-[--text-muted] opacity-40">/</span>}
                                        <span className={i === arr.length - 1 ? 'text-[--text-color] font-medium' : 'text-[--text-muted]'}>{seg}</span>
                                    </React.Fragment>
                                ))
                            ) : (
                                <span className="text-[--text-color] font-medium">{activeFileName}</span>
                            )}
                            <div className="flex-1" />
                            {detectedFramework && (
                                <span className="px-1.5 py-0.5 bg-pastel-blue/20 text-pastel-blue text-[10px]">{detectedFramework}</span>
                            )}
                            <span className="px-1.5 py-0.5 bg-overlay text-[--text-muted]">{getLanguage(activeFileName)}</span>
                        </div>
                    )}

                    <div className={`flex flex-1 overflow-hidden ${splitMode === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
                        <div className="flex-1 overflow-hidden">
                            {activeTab && activeFileContent !== undefined ? (
                                <MonacoEditor
                                    height="100%"
                                    language={getLanguage(activeFileName)}
                                    value={activeFileContent}
                                    path={activeTab}
                                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                    onChange={(value) => handleEditorChange(value, activeTab)}
                                    onMount={(editor) => {
                                        editorRef.current = editor;
                                        getAncestryTracker();
                                        editor.onDidChangeCursorPosition((e: any) => {
                                            setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
                                        });
                                        editor.onDidChangeModelContent((e: any) => {
                                            for (const change of e.changes) {
                                                if (activeTab) ancestryRecordChange(activeTab, change);
                                            }
                                        });
                                        editor.onDidPaste?.(() => ancestryMarkPaste());
                                    }}
                                    options={{
                                        fontSize: 13,
                                        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                                        fontLigatures: true,
                                        minimap: { enabled: minimapEnabled },
                                        scrollBeyondLastLine: false,
                                        lineNumbers: 'on',
                                        renderLineHighlight: 'all',
                                        cursorBlinking: 'smooth',
                                        cursorSmoothCaretAnimation: 'on',
                                        smoothScrolling: true,
                                        bracketPairColorization: { enabled: true },
                                        guides: { bracketPairs: true, indentation: true },
                                        tabSize: 2,
                                        wordWrap: 'on',
                                        automaticLayout: true,
                                        padding: { top: 8, bottom: 8 },
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-[--text-muted]">
                                    <div className="text-center space-y-2">
                                        <IoDocumentTextOutline size={32} className="mx-auto opacity-50" />
                                        <div className="text-[13px]">Open a file to start editing</div>
                                        <div className="text-[10px] opacity-60">Click a file in the sidebar</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {splitMode && (
                            <div className={`flex-1 overflow-hidden ${splitMode === 'horizontal' ? 'border-t' : 'border-l'} border-[--border-color]`}>
                                {splitFileId && fileContents.has(splitFileId) ? (
                                    <>
                                        <div className="flex items-center px-2 py-0.5 bg-surface border-b border-[--border-color] shrink-0">
                                            <select
                                                value={splitFileId}
                                                onChange={(e) => {
                                                    setSplitFileId(e.target.value);
                                                    const file = currentFiles.find(f => f.id === e.target.value);
                                                    if (file && !fileContents.has(file.id)) {
                                                        setFileContents(prev => new Map(prev).set(file.id, file.content));
                                                    }
                                                }}
                                                className="bg-transparent text-[10px] text-[--text-color] outline-none flex-1"
                                            >
                                                {currentFiles.filter(f => !f.isDirectory).map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => { setSplitMode(null); setSplitFileId(null); }} className="p-0.5 hover:bg-overlay">
                                                <VscClose size={12} className="text-[--text-muted]" />
                                            </button>
                                        </div>
                                        <MonacoEditor
                                            height="calc(100% - 24px)"
                                            language={getLanguage(currentFiles.find(f => f.id === splitFileId)?.name || '')}
                                            value={fileContents.get(splitFileId) || ''}
                                            path={`split-${splitFileId}`}
                                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                            onChange={(value) => { if (value !== undefined && splitFileId) handleEditorChange(value, splitFileId); }}
                                            onMount={(editor) => { splitEditorRef.current = editor; }}
                                            options={{
                                                fontSize: 13,
                                                fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                                                fontLigatures: true,
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                lineNumbers: 'on',
                                                renderLineHighlight: 'all',
                                                cursorBlinking: 'smooth',
                                                smoothScrolling: true,
                                                bracketPairColorization: { enabled: true },
                                                guides: { bracketPairs: true, indentation: true },
                                                tabSize: 2,
                                                wordWrap: 'on',
                                                automaticLayout: true,
                                                padding: { top: 8, bottom: 8 },
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[--text-muted]">
                                        <div className="text-center space-y-2">
                                            <VscSplitHorizontal size={24} className="mx-auto opacity-50" />
                                            <div className="text-[10px]">Select a file to open in split view</div>
                                            <select
                                                onChange={(e) => {
                                                    if (!e.target.value) return;
                                                    const file = currentFiles.find(f => f.id === e.target.value);
                                                    if (file) openInSplit(file);
                                                }}
                                                className="bg-overlay border border-[--border-color] text-[10px] text-[--text-color] outline-none px-2 py-1"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Pick a file...</option>
                                                {currentFiles.filter(f => !f.isDirectory).map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {previewOpen && (
                            <div className="w-96 border-l border-[--border-color] bg-[--bg-base] flex flex-col shrink-0">
                                <div className="flex items-center justify-between px-2 py-1 bg-surface border-b border-[--border-color]">
                                    <span className="text-[10px] text-[--text-muted] truncate flex-1">
                                        {previewUrl ? `Preview — ${previewUrl}` : 'Preview'}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        {activeFileName.endsWith('.html') && (
                                            <button
                                                onClick={() => {
                                                    const content = activeTab ? fileContents.get(activeTab) : undefined;
                                                    if (content) {
                                                        const blob = new Blob([content], { type: 'text/html' });
                                                        setPreviewUrl(URL.createObjectURL(blob));
                                                    }
                                                }}
                                                className="p-0.5 hover:bg-overlay" title="Preview current HTML"
                                            >
                                                <VscEye size={12} className="text-pastel-green" />
                                            </button>
                                        )}
                                        {previewUrl && (
                                            <button onClick={() => setPreviewUrl(previewUrl + (previewUrl.includes('?') ? '&' : '?') + '_t=' + Date.now())} className="p-0.5 hover:bg-overlay" title="Refresh">
                                                <VscRefresh size={12} className="text-[--text-muted]" />
                                            </button>
                                        )}
                                        <button onClick={() => setPreviewOpen(false)} className="p-0.5 hover:bg-overlay">
                                            <VscClose size={12} className="text-[--text-muted]" />
                                        </button>
                                    </div>
                                </div>
                                {previewUrl ? (
                                    <iframe
                                        src={previewUrl}
                                        className="flex-1 w-full border-0 bg-white"
                                        title="Live Preview"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                                    />
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-[--text-muted]">
                                        <div className="text-center space-y-3 p-4">
                                            <IoRocketOutline size={24} className="mx-auto opacity-50" />
                                            <div className="text-xs font-medium">Live Preview</div>
                                            <div className="text-[10px] opacity-60 space-y-1">
                                                <p>Open an .html file and click the preview button</p>
                                                <p>Or run a dev server in the terminal</p>
                                                <p className="text-pastel-teal">WebContainer preview auto-attaches</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {bottomPanelOpen && !focusMode && (
                        <div className="flex flex-col border-t border-[--border-color] shrink-0" style={{ height: '40%', maxHeight: '50%', minHeight: 120 }}>
                            <div className="flex items-center px-2 bg-surface border-b border-[--border-color] shrink-0 gap-0">
                                <button
                                    onClick={() => setBottomPanelTab('terminal')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${bottomPanelTab === 'terminal' ? 'text-[--text-color] border-b border-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                ><VscTerminal size={11} /> Terminal</button>
                                <button
                                    onClick={() => setBottomPanelTab('output')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${bottomPanelTab === 'output' ? 'text-[--text-color] border-b border-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                >Output {outputLines.length > 0 && <span className="text-[9px] text-accent">{outputLines.length}</span>}</button>
                                <button
                                    onClick={() => setBottomPanelTab('problems')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium transition-colors ${bottomPanelTab === 'problems' ? 'text-[--text-color] border-b border-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                >Problems {outputLines.filter(l => l.type === 'stderr').length > 0 && <span className="text-[9px] text-pastel-red">{outputLines.filter(l => l.type === 'stderr').length}</span>}</button>
                                <div className="flex-1" />
                                {bottomPanelTab === 'output' && (
                                    <>
                                        <input
                                            value={outputFilter}
                                            onChange={(e) => setOutputFilter(e.target.value)}
                                            placeholder="Filter..."
                                            className="w-24 bg-overlay border border-transparent focus:border-accent px-1.5 py-0.5 text-[10px] text-[--text-color] outline-none placeholder-[--text-muted]"
                                        />
                                        <button
                                            onClick={() => {
                                                const text = outputLines.map(l => l.text).join('\n');
                                                navigator.clipboard.writeText(text);
                                            }}
                                            className="text-[--text-muted] hover:text-[--text-color] p-0.5 hover:bg-overlay ml-1"
                                            title="Copy output"
                                        >
                                            <VscSave size={11} />
                                        </button>
                                        <button onClick={() => setOutputLines([])} className="text-[--text-muted] hover:text-[--text-color] p-0.5 hover:bg-overlay" title="Clear">
                                            <IoTrashOutline size={12} />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setBottomPanelOpen(false)} className="text-[--text-muted] hover:text-[--text-color] p-0.5 hover:bg-overlay ml-1">
                                    <VscClose size={12} />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-hidden">
                                <div className={`h-full ${bottomPanelTab === 'terminal' ? '' : 'hidden'}`}>
                                    <TerminalPanel
                                        files={Object.fromEntries(
                                            currentFiles.filter(f => !f.isDirectory).map(f => [f.path, f.content])
                                        )}
                                        onServerReady={(url) => { setPreviewUrl(url); setPreviewOpen(true); }}
                                    />
                                </div>

                                {bottomPanelTab === 'output' && (() => {
                                    const OUTPUT_LINE_HEIGHT = 16;
                                    const OUTPUT_BUFFER = 10;
                                    const filtered = outputFilter
                                        ? outputLines.filter(l => l.text.toLowerCase().includes(outputFilter.toLowerCase()))
                                        : outputLines;
                                    return (
                                        <div
                                            ref={outputContainerRef}
                                            className="h-full overflow-auto bg-[--bg-base]"
                                            onScroll={(e) => setOutputScrollTop((e.target as HTMLDivElement).scrollTop)}
                                        >
                                            {filtered.length === 0 ? (
                                                <div className="p-3 text-xs font-mono text-[--text-muted] opacity-50">
                                                    {outputFilter ? 'No matching output lines' : 'Run your code to see output here...'}
                                                </div>
                                            ) : (() => {
                                                const containerHeight = outputContainerRef.current?.clientHeight || 300;
                                                const totalHeight = filtered.length * OUTPUT_LINE_HEIGHT;
                                                const startIdx = Math.max(0, Math.floor(outputScrollTop / OUTPUT_LINE_HEIGHT) - OUTPUT_BUFFER);
                                                const endIdx = Math.min(filtered.length, Math.ceil((outputScrollTop + containerHeight) / OUTPUT_LINE_HEIGHT) + OUTPUT_BUFFER);
                                                const visibleLines = filtered.slice(startIdx, endIdx);
                                                return (
                                                    <div style={{ height: totalHeight, position: 'relative' }}>
                                                        <div
                                                            style={{ position: 'absolute', top: startIdx * OUTPUT_LINE_HEIGHT, left: 0, right: 0 }}
                                                            className="p-3 text-xs font-mono whitespace-pre-wrap"
                                                        >
                                                            {visibleLines.map((line, i) => (
                                                                <div
                                                                    key={startIdx + i}
                                                                    style={{ height: OUTPUT_LINE_HEIGHT }}
                                                                    className={
                                                                        line.type === 'stderr' ? 'text-pastel-red' :
                                                                        line.type === 'info' ? 'text-accent' :
                                                                        'text-[--text-color]'
                                                                    }
                                                                >{line.text}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}

                                {bottomPanelTab === 'problems' && (
                                    <div className="h-full overflow-auto bg-[--bg-base] p-3">
                                        <div className="text-xs font-mono">
                                            {outputLines.filter(l => l.type === 'stderr').length === 0
                                                ? <span className="text-[--text-muted] opacity-50">No problems detected</span>
                                                : outputLines.filter(l => l.type === 'stderr').map((line, i) => (
                                                    <div key={i} className="text-pastel-red py-0.5">{line.text}</div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {snapshotPanelOpen && <SnapshotPanel onClose={() => setSnapshotPanelOpen(false)} />}
            </div>

            <div className="flex items-center justify-between px-2 py-0.5 bg-accent text-[--bg-base] shrink-0">
                <div className="flex items-center gap-2 text-[10px]">
                    <span>{currentProject.status}</span>
                    {gitBranch && <span className="flex items-center gap-0.5"><VscGitMerge size={10} /> {gitBranch}</span>}
                    <span>{currentFiles.filter(f => !f.isDirectory).length} files</span>
                    {detectedFramework && <span className="font-medium">{detectedFramework}</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    {activeFileName && <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>}
                    {activeFileName && <span>{getLanguage(activeFileName)}</span>}
                    <span>UTF-8</span>
                    <span>Spaces: 2</span>
                </div>
            </div>
        </div>
    );
}
