'use client';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    VscFiles, VscClose, VscTerminal, VscNewFile, VscNewFolder, VscSave,
    VscChevronDown, VscChevronRight, VscTrash, VscRunAll,
    VscHistory, VscEye, VscEyeClosed, VscSplitHorizontal,
    VscRefresh, VscSaveAll, VscGitMerge, VscGitCommit, VscGitPullRequest,
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
import { useCheerpX } from '../CheerpXContext';
import { useRuntimeSafe } from '../RuntimeContext';
import { preloadForProject } from '../../lib/runtimes/preloader';
import { CheckpointManager } from '../../lib/checkpoints';
import { SkillAnalyzer } from '../../lib/skillAnalytics';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const WebContainerTerminal = dynamic(() => import('../ui/WebContainerTerminal'), { ssr: false });

const languageMap: Record<string, string> = {
    'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'tsx': 'typescriptreact',
    'jsx': 'javascriptreact', 'json': 'json', 'html': 'html', 'css': 'css',
    'md': 'markdown', 'txt': 'plaintext', 'yml': 'yaml', 'yaml': 'yaml',
    'env': 'plaintext', 'sh': 'shell', 'go': 'go', 'rs': 'rust',
};

const fileIcons: Record<string, { label: string; color: string }> = {
    'ts': { label: 'TS', color: '#3178C6' }, 'tsx': { label: 'TX', color: '#3178C6' },
    'js': { label: 'JS', color: '#F7DF1E' }, 'jsx': { label: 'JX', color: '#61DAFB' },
    'py': { label: 'PY', color: '#3776AB' }, 'json': { label: '{}', color: '#F5A623' },
    'html': { label: 'H', color: '#E34F26' }, 'css': { label: 'C', color: '#1572B6' },
    'md': { label: 'M', color: '#888' }, 'env': { label: 'E', color: '#4CAF50' },
};

const pistonRuntimes: Record<string, { language: string; version: string }> = {
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' },
    'typescript': { language: 'typescript', version: '5.0.3' },
    'go': { language: 'go', version: '1.16.2' },
    'rust': { language: 'rust', version: '1.68.2' },
    'shell': { language: 'bash', version: '5.2.0' },
};

const runnableLanguages = new Set([...Object.keys(pistonRuntimes), 'c', 'cpp', 'java', 'ruby', 'php']);

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

// --- File Tree Item (OPT: wrapped in React.memo to prevent full tree re-renders) ---
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

// --- Terminal Panel ---
const XTermShell = dynamic(() => import('../ui/XTermShell'), { ssr: false });

const TerminalPanel: React.FC<{
    mode: 'linux' | 'node';
    files?: Record<string, string>;
    onServerReady?: (url: string, port: number) => void;
}> = ({ mode, files, onServerReady }) => {
    if (mode === 'node') {
        return <WebContainerTerminal fontSize={12} files={files} onServerReady={onServerReady} />;
    }
    return <XTermShell fontSize={12} />;
};
TerminalPanel.displayName = 'TerminalPanel';

// --- Snapshot Panel ---
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

// --- Hackathon Timer ---
const HackathonTimer: React.FC = () => {
    const [endTime, setEndTime] = useState<number | null>(null);
    const [remaining, setRemaining] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const [hours, setHours] = useState('24');

    useEffect(() => {
        if (!endTime) return;
        const interval = setInterval(() => {
            const diff = endTime - Date.now();
            if (diff <= 0) { setRemaining('TIME UP!'); clearInterval(interval); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    if (!endTime && !showSetup) {
        return (
            <button onClick={() => setShowSetup(true)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[--text-muted] hover:text-[--text-color] hover:bg-overlay" title="Set hackathon timer">
                <IoTimeOutline size={12} /> Timer
            </button>
        );
    }

    if (showSetup) {
        return (
            <div className="flex items-center gap-1">
                <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-10 bg-overlay border border-transparent focus:border-accent px-1 py-0.5 text-[10px] text-[--text-color] text-center outline-none" placeholder="hrs" />
                <span className="text-[10px] text-[--text-muted]">hrs</span>
                <button onClick={() => { setEndTime(Date.now() + parseInt(hours) * 3600000); setShowSetup(false); }} className="px-1.5 py-0.5 bg-pastel-green text-[--bg-base] text-[10px] hover:opacity-90">Start</button>
                <button onClick={() => setShowSetup(false)} className="text-[10px] text-[--text-muted] hover:text-[--text-color]">Cancel</button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-overlay">
            <IoTimeOutline size={12} className={remaining === 'TIME UP!' ? 'text-pastel-red animate-pulse' : 'text-pastel-peach'} />
            <span className={`text-xs font-mono font-bold ${remaining === 'TIME UP!' ? 'text-pastel-red animate-pulse' : 'text-pastel-peach'}`}>{remaining}</span>
            <button onClick={() => { setEndTime(null); setRemaining(''); }} className="text-[--text-muted] hover:text-[--text-color]"><VscClose size={10} /></button>
        </div>
    );
};

// === MAIN WORKSPACE COMPONENT ===
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
    const [terminalOpen, setTerminalOpen] = useState(true);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [terminalMode, setTerminalMode] = useState<'linux' | 'node'>('linux');
    const [snapshotPanelOpen, setSnapshotPanelOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileParent, setNewFileParent] = useState<string | null>(null);
    const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
    const [isRunning, setIsRunning] = useState(false);
    const [outputLines, setOutputLines] = useState<{ text: string; type: 'stdout' | 'stderr' | 'info' }[]>([]);
    const [outputOpen, setOutputOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [gitPanelOpen, setGitPanelOpen] = useState(false);
    const [commitMsg, setCommitMsg] = useState('');
    const [gitChanges, setGitChanges] = useState<{ filepath: string; status: string }[]>([]);
    const [gitBranch, setGitBranch] = useState<string>('');
    const [gitLoading, setGitLoading] = useState(false);

    const editorRef = useRef<any>(null);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
    const outputContainerRef = useRef<HTMLDivElement>(null);
    const [outputScrollTop, setOutputScrollTop] = useState(0);

    const { isBooted, writeProjectFile, writeLinuxFile, mkdirLinux, removeLinux, captureCommand, readFile, batchReadFiles } = useCheerpX();
    const runtime = useRuntimeSafe();

    // --- Micro-Checkpoints (Coding DVR) ---
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

    // --- Skill Analytics ---
    const skillAnalyzer = useRef<SkillAnalyzer | null>(null);
    useEffect(() => {
        if (!currentProject) return;
        skillAnalyzer.current = new SkillAnalyzer(currentProject.id);
    }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Resolve a virtual FS path to an absolute Linux path under the project dir.
    // file.path may or may not start with '/' depending on depth, so normalize it.
    const linuxPath = useCallback((filePath: string) => {
        if (!currentProject) return '';
        const projDir = `/home/user/projects/${currentProject.name.replace(/\s+/g, '_')}`;
        const normalized = filePath.startsWith('/') ? filePath : `/${filePath}`;
        return `${projDir}${normalized}`;
    }, [currentProject]);

    // --- Git operations ---
    const gitDir = currentProject ? `/projects/${currentProject.name.replace(/\s+/g, '_')}` : '';

    const refreshGitStatus = useCallback(async () => {
        if (!runtime?.git || !gitDir) return;
        try {
            const branch = await runtime.git.currentBranch(gitDir);
            setGitBranch(branch || 'main');
            const entries = await runtime.git.status(gitDir);
            const changed = entries
                .filter(e => e.headStatus !== 1 || e.workdirStatus !== 1 || e.stageStatus !== 1)
                .map(e => ({
                    filepath: e.filepath,
                    status: e.headStatus === 0 ? 'new' : e.workdirStatus === 2 ? 'modified' : e.workdirStatus === 0 ? 'deleted' : 'unknown',
                }));
            setGitChanges(changed);
        } catch {
            // Not a git repo yet — that's fine
            setGitChanges([]);
            setGitBranch('');
        }
    }, [runtime, gitDir]);

    useEffect(() => {
        if (gitPanelOpen) refreshGitStatus();
    }, [gitPanelOpen, refreshGitStatus]);

    const handleGitInit = useCallback(async () => {
        if (!runtime?.git || !gitDir) return;
        setGitLoading(true);
        try {
            await runtime.git.init(gitDir);
            // Write project files to git FS
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
            // Sync current files to git FS before commit
            for (const f of currentFiles) {
                if (!f.isDirectory) {
                    const { writeGitFile } = await import('../../lib/runtimes/git');
                    await writeGitFile(`${gitDir}/${f.path}`, f.content);
                }
            }
            const oid = await runtime.git.commit({ dir: gitDir, message: commitMsg, author: { name: 'HackathOS User', email: 'user@hackathos.dev' } });
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
            await runtime.git.push({ dir: gitDir, token: '' });
            addToast('Pushed to remote', 'success');
        } catch (err: any) {
            addToast('Push failed: ' + err.message, 'error');
        }
        setGitLoading(false);
    }, [runtime, gitDir, addToast]);

    useEffect(() => {
        if (projectId && (!currentProject || currentProject.id !== projectId)) {
            openProject(projectId);
        }
    }, [projectId, currentProject, openProject]);

    // Sync project files to Linux filesystem so terminal can access them.
    // DataDevice (/projects) is flat — doesn't support subdirectories.
    // We write to /home/user/projects/<name>/ on the ext2 filesystem instead.
    const syncedRef = useRef(false);
    useEffect(() => {
        if (!isBooted || !currentProject || syncedRef.current) return;
        syncedRef.current = true;
        const syncFiles = async () => {
            for (const file of currentFiles) {
                if (file.isDirectory) continue;
                try {
                    await writeLinuxFile(linuxPath(file.path), file.content);
                } catch { /* ignore sync errors */ }
            }
        };
        syncFiles();
    }, [isBooted, currentProject, currentFiles, writeLinuxFile, linuxPath]);

    const fileTree = useMemo(() => buildFileTree(currentFiles), [currentFiles]);

    useEffect(() => {
        const rootDirs = currentFiles.filter(f => f.isDirectory && f.parentPath === '/').map(f => f.path);
        setExpandedDirs(new Set(rootDirs));
    }, [currentFiles]);

    // Predictive preloading: analyze project files and preload the appropriate runtime
    useEffect(() => {
        if (currentFiles.length > 0) {
            preloadForProject(currentFiles.map(f => f.path));
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

    // Reverse sync: pull changes from Linux FS back into the virtual FS.
    // Handles files created/edited/deleted in the terminal.
    const [isSyncing, setIsSyncing] = useState(false);
    const syncFromLinux = useCallback(async () => {
        if (!currentProject || !isBooted || isSyncing) return;
        setIsSyncing(true);
        try {
            const projDir = `/home/user/projects/${currentProject.name.replace(/\s+/g, '_')}`;
            const norm = (p: string) => (p.startsWith('/') ? p : `/${p}`);

            // List dirs and files in one shot
            const raw = await captureCommand(
                `cd '${projDir}' 2>/dev/null && find . -mindepth 1 -type d | sed 's/^/D:/' && find . -mindepth 1 -type f | sed 's/^/F:/'`
            );

            const lines = (raw || '').trim().split('\n').filter(l => l.startsWith('D:') || l.startsWith('F:'));

            // Convert ./path → virtual FS path (root items have no leading /)
            const toVP = (dotRel: string) => {
                const rel = dotRel.slice(1); // ./foo → /foo
                const parts = rel.split('/').filter(Boolean);
                return parts.length === 1 ? parts[0] : rel;
            };

            // Track all paths found in Linux FS (normalized)
            const linuxPaths = new Set<string>();

            // Process directories first (sorted by depth so parents come first)
            const dirs = lines.filter(l => l.startsWith('D:')).map(l => l.slice(2))
                .sort((a, b) => a.split('/').length - b.split('/').length);
            for (const d of dirs) {
                const vp = toVP(d);
                linuxPaths.add(norm(vp));
                if (!currentFiles.some(f => norm(f.path) === norm(vp) && f.isDirectory)) {
                    await createFile(vp, '', true);
                }
            }

            // OPT: Batch read ALL files in one shell command (kills N+1 pattern)
            const files = lines.filter(l => l.startsWith('F:')).map(l => l.slice(2));
            const filePaths = files.map(f => `${projDir}${f.slice(1)}`);
            const fileContentsMap = filePaths.length > 0
                ? await batchReadFiles(filePaths)
                : new Map<string, string>();

            for (let idx = 0; idx < files.length; idx++) {
                const f = files[idx];
                const vp = toVP(f);
                linuxPaths.add(norm(vp));
                const content = fileContentsMap.get(filePaths[idx]) ?? '';
                const existing = currentFiles.find(ef => norm(ef.path) === norm(vp) && !ef.isDirectory);
                if (!existing) {
                    await createFile(vp, content, false);
                } else if (content !== existing.content) {
                    await updateFile(existing.id, content);
                    if (openTabs.some(t => t.fileId === existing.id)) {
                        setFileContents(prev => new Map(prev).set(existing.id, content));
                    }
                }
            }

            // Delete files from virtual FS that no longer exist in Linux FS
            for (const vf of currentFiles) {
                if (!linuxPaths.has(norm(vf.path))) {
                    await deleteFileById(vf.id);
                    const tab = openTabs.find(t => t.fileId === vf.id);
                    if (tab) closeTab(vf.id);
                }
            }

            addToast('Synced from terminal', 'success');
        } catch {
            addToast('Sync failed', 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [currentProject, isBooted, isSyncing, captureCommand, readFile, batchReadFiles, currentFiles, createFile, updateFile, deleteFileById, openTabs, closeTab, addToast]);

    const handleEditorChange = useCallback((value: string | undefined, fileId: string) => {
        if (value === undefined) return;
        setFileContents(prev => new Map(prev).set(fileId, value));
        setOpenTabs(prev => prev.map(t => t.fileId === fileId ? { ...t, modified: true } : t));
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(async () => {
            await updateFile(fileId, value);
            // Also sync to Linux filesystem so terminal sees updated files
            const tab = openTabs.find(t => t.fileId === fileId);
            if (tab && currentProject && isBooted) {
                writeLinuxFile(linuxPath(tab.path), value).catch(() => {});
            }
            setOpenTabs(prev => prev.map(t => t.fileId === fileId ? { ...t, modified: false } : t));
        }, 2000);
    }, [updateFile, openTabs, writeLinuxFile, currentProject, isBooted, linuxPath]);

    const saveCurrentFile = useCallback(async () => {
        if (!activeTab) return;
        const content = fileContents.get(activeTab);
        if (content !== undefined) {
            await updateFile(activeTab, content);
            // Sync to Linux filesystem
            const tab = openTabs.find(t => t.fileId === activeTab);
            if (tab && currentProject && isBooted) {
                writeLinuxFile(linuxPath(tab.path), content).catch(() => {});
            }
            setOpenTabs(prev => prev.map(t => t.fileId === activeTab ? { ...t, modified: false } : t));
            addToast(`Saved ${tab?.name || 'file'}`, 'success');
        }
    }, [activeTab, fileContents, updateFile, openTabs, addToast, currentProject, isBooted, writeLinuxFile, linuxPath]);

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
        // Sync to Linux filesystem so terminal sees the new file/folder
        if (currentProject && isBooted) {
            if (isDir) {
                mkdirLinux(linuxPath(cleanPath)).catch(() => {});
            } else {
                writeLinuxFile(linuxPath(cleanPath), '').catch(() => {});
            }
        }
        setNewFileName('');
        setNewFileParent(null);
        addToast(`Created ${isDir ? 'folder' : 'file'}: ${cleanName}`, 'success');
        if (!isDir) {
            const file = currentFiles.find(f => f.path === cleanPath);
            if (file) openFile(file);
        }
    }, [newFileName, newFileParent, createFile, currentFiles, openFile, addToast, isBooted, mkdirLinux, writeLinuxFile, linuxPath]);

    const handleDeleteFile = useCallback(async (file: ProjectFile) => {
        await deleteFileById(file.id);
        if (openTabs.find(t => t.fileId === file.id)) closeTab(file.id);
        // Remove from Linux filesystem too
        if (currentProject && isBooted) {
            removeLinux(linuxPath(file.path)).catch(() => {});
        }
        addToast(`Deleted ${file.name}`, 'success');
    }, [deleteFileById, openTabs, closeTab, addToast, isBooted, removeLinux, linuxPath]);

    // Auto-scroll output
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

    // Gather all companion files matching the same language family for multi-file execution
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
                // Use the latest content from editor if open, otherwise from project state
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
        setOutputOpen(true);
        setOutputLines([]);

        const execStart = performance.now();

        // Try RuntimeContext first (supports Pyodide, WebContainers, Piston)
        if (runtime) {
            appendOutput(`Running ${tab.name} via ${runtime.resolveRuntime(lang)}...`, 'info');
            try {
                const result = await runtime.execute({ language: lang, code: content, files: companions });
                if (result.stdout) result.stdout.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stdout'));
                if (result.stderr) result.stderr.split('\n').filter((l: string) => l).forEach((line: string) => appendOutput(line, 'stderr'));
                if (!result.stdout && !result.stderr) {
                    appendOutput(`Exited with code ${result.exitCode} (${result.durationMs?.toFixed(0)}ms)`, 'info');
                }
                // Track skills
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

        // Fallback: direct Piston API (when RuntimeContext not available)
        const pistonRuntime = pistonRuntimes[lang];
        if (!pistonRuntime) {
            appendOutput(`Language "${lang}" is not supported for execution.`, 'stderr');
            appendOutput(`Supported: ${Object.keys(pistonRuntimes).join(', ')}`, 'info');
            setOutputOpen(true);
            setIsRunning(false);
            return;
        }
        appendOutput(`Running ${tab.name} (${pistonRuntime.language} ${pistonRuntime.version})...`, 'info');

        try {
            // Build files array: active file first, then companions
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

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveCurrentFile(); }
            if ((e.metaKey || e.ctrlKey) && e.key === '`') { e.preventDefault(); setTerminalOpen(p => !p); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); setSidebarOpen(p => !p); }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') { e.preventDefault(); setFocusMode(p => !p); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [saveCurrentFile]);

    // Menu registration
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
        'toggle-terminal': () => setTerminalOpen(p => !p),
        'toggle-output': () => setOutputOpen(p => !p),
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
                    <div className="text-sm text-[--text-muted]">Open a project from the Project Dashboard</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[--bg-base] text-[--text-muted] text-xs overflow-hidden relative font-mono">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-2 py-1 bg-surface border-b border-[--border-color] shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => setSidebarOpen(p => !p)} className={`p-1 hover:bg-overlay ${sidebarOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Toggle sidebar (Cmd+B)">
                        <VscFiles size={14} />
                    </button>
                    <button onClick={() => setGitPanelOpen(p => !p)} className={`p-1 hover:bg-overlay ${gitPanelOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Git panel">
                        <VscGitMerge size={14} />
                    </button>
                    <span className="text-[--text-color] font-medium">{currentProject.name}</span>
                    {currentProject.stack && (
                        <div className="flex items-center gap-1 ml-2">
                            {currentProject.stack.slice(0, 3).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-overlay text-[10px] text-[--text-muted]">{s}</span>
                            ))}
                        </div>
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
                    <button onClick={() => setTerminalOpen(p => !p)} className={`p-1 hover:bg-overlay ${terminalOpen ? 'text-[--text-color]' : 'text-[--text-muted]'}`} title="Toggle terminal (Cmd+`)">
                        <VscTerminal size={14} />
                    </button>
                    <button onClick={() => setFocusMode(p => !p)} className={`p-1 hover:bg-overlay ${focusMode ? 'text-pastel-peach' : 'text-[--text-muted]'}`} title="Focus mode (Cmd+Shift+F)">
                        <VscSplitHorizontal size={14} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                {sidebarOpen && !focusMode && (
                    <div className="w-56 bg-surface border-r border-[--border-color] flex flex-col shrink-0">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[--border-color]">
                            <span className="text-[10px] uppercase tracking-wider text-[--text-muted] font-medium">Explorer</span>
                            <div className="flex items-center gap-0.5">
                                <button onClick={() => handleNewFile('/')} className="p-0.5 hover:bg-overlay" title="New file"><VscNewFile size={12} /></button>
                                <button onClick={() => { setNewFileParent('/'); setNewFileName(''); }} className="p-0.5 hover:bg-overlay" title="New folder"><VscNewFolder size={12} /></button>
                                <button onClick={syncFromLinux} disabled={isSyncing} className={`p-0.5 hover:bg-overlay ${isSyncing ? 'animate-spin text-accent' : ''}`} title="Sync from terminal"><VscRefresh size={12} /></button>
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

                {/* Git Panel */}
                {gitPanelOpen && !focusMode && (
                    <div className="w-56 bg-surface border-r border-[--border-color] flex flex-col shrink-0">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-[--border-color]">
                            <span className="text-[10px] uppercase tracking-wider text-[--text-muted] font-medium flex items-center gap-1">
                                <VscGitMerge size={10} /> Source Control
                                {gitBranch && <span className="text-pastel-blue normal-case tracking-normal">({gitBranch})</span>}
                            </span>
                            <button onClick={() => setGitPanelOpen(false)} className="p-0.5 hover:bg-overlay">
                                <VscClose size={12} className="text-[--text-muted]" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {!gitBranch && (
                                <div className="px-2 py-3 text-center">
                                    <p className="text-[10px] text-[--text-muted] mb-2">No git repository</p>
                                    <button onClick={handleGitInit} disabled={gitLoading}
                                        className="w-full py-1 text-[10px] rounded bg-pastel-blue text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                        {gitLoading ? 'Initializing...' : 'Initialize Repository'}
                                    </button>
                                </div>
                            )}
                            {gitBranch && (
                                <>
                                    <div className="px-2 py-2 border-b border-[--border-color]">
                                        <div className="flex items-center gap-1 mb-2">
                                            <VscGitCommit size={11} className="text-pastel-green" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Commit</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={commitMsg}
                                            onChange={e => setCommitMsg(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleGitCommit(); }}
                                            placeholder="Commit message..."
                                            className="w-full bg-[--bg-base] border border-[--border-color] rounded px-2 py-1 text-[10px] text-[--text-color] outline-none focus:border-pastel-blue placeholder:text-[--text-muted] mb-1.5"
                                        />
                                        <button onClick={handleGitCommit} disabled={gitLoading || !commitMsg.trim()}
                                            className="w-full py-1 text-[10px] rounded bg-pastel-green text-[--bg-base] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                            {gitLoading ? 'Committing...' : 'Commit All'}
                                        </button>
                                    </div>
                                    <div className="px-2 py-2 border-b border-[--border-color]">
                                        <div className="flex items-center gap-1 mb-1.5">
                                            <VscGitPullRequest size={11} className="text-pastel-blue" />
                                            <span className="text-[10px] font-medium text-[--text-color]">Actions</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={handleGitPull} disabled={gitLoading}
                                                className="flex items-center gap-1.5 px-2 py-1 text-[10px] rounded hover:bg-overlay text-[--text-muted] hover:text-[--text-color] disabled:opacity-50 transition-colors">
                                                <VscRefresh size={10} /> Pull
                                            </button>
                                            <button onClick={handleGitPush} disabled={gitLoading}
                                                className="flex items-center gap-1.5 px-2 py-1 text-[10px] rounded hover:bg-overlay text-[--text-muted] hover:text-[--text-color] disabled:opacity-50 transition-colors">
                                                <VscGitPullRequest size={10} /> Push
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-2 py-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] text-[--text-muted] font-medium">Changes</span>
                                            <button onClick={refreshGitStatus} className="p-0.5 hover:bg-overlay rounded">
                                                <VscRefresh size={10} className="text-[--text-muted]" />
                                            </button>
                                        </div>
                                        {gitChanges.length === 0 ? (
                                            <div className="text-[10px] text-[--text-muted] opacity-60 text-center py-3">
                                                No changes detected
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {gitChanges.map(c => (
                                                    <div key={c.filepath} className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] rounded hover:bg-overlay">
                                                        <span className={`font-bold ${c.status === 'new' ? 'text-pastel-green' : c.status === 'deleted' ? 'text-pastel-red' : 'text-pastel-yellow'}`}>
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
                        </div>
                    </div>
                )}

                {/* Editor Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
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
                                <button onClick={() => setOutputOpen(!outputOpen)} className={`p-1 ${outputOpen ? 'text-[--text-color] bg-overlay' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`} title="Output Panel">
                                    <VscTerminal size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Editor + Preview */}
                    <div className="flex flex-1 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            {activeTab && activeFileContent !== undefined ? (
                                <MonacoEditor
                                    height="100%"
                                    language={getLanguage(activeFileName)}
                                    value={activeFileContent}
                                    path={activeTab}
                                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                    onChange={(value) => handleEditorChange(value, activeTab)}
                                    onMount={(editor) => { editorRef.current = editor; }}
                                    options={{
                                        fontSize: 13,
                                        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                                        fontLigatures: true,
                                        minimap: { enabled: false },
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
                                        <div className="text-sm">Open a file to start editing</div>
                                        <div className="text-[10px] opacity-60">Click a file in the sidebar</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview Panel — supports WebContainer dev server URL, static HTML blob, or manual URL */}
                        {previewOpen && (
                            <div className="w-96 border-l border-[--border-color] bg-[--bg-base] flex flex-col shrink-0">
                                <div className="flex items-center justify-between px-2 py-1 bg-surface border-b border-[--border-color]">
                                    <span className="text-[10px] text-[--text-muted] truncate flex-1">
                                        {previewUrl ? `Preview — ${previewUrl}` : 'Preview'}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        {/* Preview current HTML file as blob */}
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

                    {/* Bottom Panels: Terminal + Output share a fixed container to prevent overflow */}
                    {(terminalOpen || outputOpen) && !focusMode && (
                        <div className="flex flex-col border-t border-[--border-color] shrink-0" style={{ height: terminalOpen && outputOpen ? '50%' : '40%', maxHeight: '50%', minHeight: 120 }}>
                            {/* Terminal */}
                            {terminalOpen && (
                                <div className={`flex flex-col ${outputOpen ? 'flex-1 min-h-0 border-b border-[--border-color]' : 'flex-1 min-h-0'}`}>
                                    <div className="flex items-center justify-between px-2 py-1 bg-surface border-b border-[--border-color] shrink-0">
                                        <div className="flex items-center gap-1">
                                            <VscTerminal size={11} className="text-[--text-muted]" />
                                            <button
                                                onClick={() => setTerminalMode('linux')}
                                                className={`px-1.5 py-0.5 text-[10px] rounded ${terminalMode === 'linux' ? 'bg-overlay text-[--text-color]' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                            >Linux</button>
                                            <button
                                                onClick={() => setTerminalMode('node')}
                                                className={`px-1.5 py-0.5 text-[10px] rounded ${terminalMode === 'node' ? 'bg-overlay text-pastel-green' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                            >Node</button>
                                        </div>
                                        <button onClick={() => setTerminalOpen(false)} className="p-0.5 hover:bg-overlay">
                                            <VscClose size={12} className="text-[--text-muted]" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <TerminalPanel
                                            mode={terminalMode}
                                            files={terminalMode === 'node' ? Object.fromEntries(
                                                currentFiles.filter(f => !f.isDirectory).map(f => [f.path, f.content])
                                            ) : undefined}
                                            onServerReady={(url) => { setPreviewUrl(url); setPreviewOpen(true); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Output Panel */}
                            {outputOpen && (
                                <div className={`flex flex-col ${terminalOpen ? 'flex-1 min-h-0' : 'flex-1 min-h-0'}`}>
                                    <div className="h-7 flex items-center px-3 bg-surface border-b border-[--border-color] gap-4 shrink-0">
                                        <button className="text-[10px] text-[--text-color] font-medium border-b border-accent py-0.5">Output</button>
                                        <div className="flex-1" />
                                        <button onClick={() => setOutputLines([])} className="text-[--text-muted] hover:text-[--text-color] p-0.5 hover:bg-overlay">
                                            <IoTrashOutline size={12} />
                                        </button>
                                        <button onClick={() => setOutputOpen(false)} className="text-[--text-muted] hover:text-[--text-color] p-0.5 hover:bg-overlay">
                                            <VscClose size={12} />
                                        </button>
                                    </div>
                                    {(() => {
                                        const OUTPUT_LINE_HEIGHT = 16;
                                        const OUTPUT_BUFFER = 10;
                                        return (
                                            <div
                                                ref={outputContainerRef}
                                                className="flex-1 min-h-0 overflow-auto bg-[--bg-base]"
                                                onScroll={(e) => setOutputScrollTop((e.target as HTMLDivElement).scrollTop)}
                                            >
                                                {outputLines.length === 0 ? (
                                                    <div className="p-3 text-xs font-mono text-[--text-muted] opacity-50">
                                                        Run your code to see output here...
                                                    </div>
                                                ) : (() => {
                                                    const containerHeight = outputContainerRef.current?.clientHeight || 300;
                                                    const totalHeight = outputLines.length * OUTPUT_LINE_HEIGHT;
                                                    const startIdx = Math.max(0, Math.floor(outputScrollTop / OUTPUT_LINE_HEIGHT) - OUTPUT_BUFFER);
                                                    const endIdx = Math.min(outputLines.length, Math.ceil((outputScrollTop + containerHeight) / OUTPUT_LINE_HEIGHT) + OUTPUT_BUFFER);
                                                    const visibleLines = outputLines.slice(startIdx, endIdx);

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
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Snapshot Panel */}
                {snapshotPanelOpen && <SnapshotPanel onClose={() => setSnapshotPanelOpen(false)} />}
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-2 py-0.5 bg-accent text-[--bg-base] shrink-0">
                <div className="flex items-center gap-2 text-[10px]">
                    <span>{currentProject.status}</span>
                    <span>{currentFiles.filter(f => !f.isDirectory).length} files</span>
                    {activeFileName && <span>{getLanguage(activeFileName)}</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span>UTF-8</span>
                    <span>Spaces: 2</span>
                </div>
            </div>
        </div>
    );
}
