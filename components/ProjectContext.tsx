'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ProjectFile, Snapshot, DEFAULT_LAYOUT, WorkspaceLayout } from '../types/project';
import { getTemplate } from '../utils/templates';
import {
    getAllProjects, saveProject, deleteProject as dbDeleteProject,
    getProjectFiles, saveProjectFile, saveProjectFiles, deleteProjectFile,
    getProjectSnapshots, saveSnapshot as dbSaveSnapshot, deleteSnapshot as dbDeleteSnapshot,
} from '../utils/projectDB';
import { useAuth } from './AuthContext';
import { useFileSystem } from './FileSystemContext';
import { useCheerpXSafe } from './CheerpXContext';

interface ProjectContextType {
    projects: Project[];
    currentProject: Project | null;
    currentFiles: ProjectFile[];
    snapshots: Snapshot[];
    isLoading: boolean;

    createProject: (name: string, templateId: string, description?: string) => Promise<Project>;
    createProjectFromRawFiles: (name: string, files: Record<string, string>, description?: string, stack?: string[]) => Promise<Project>;
    openProject: (id: string) => Promise<void>;
    closeProject: () => void;
    deleteProjectById: (id: string) => Promise<void>;
    updateProject: (updates: Partial<Project>) => Promise<void>;

    createFile: (path: string, content: string, isDirectory?: boolean) => Promise<ProjectFile>;
    updateFile: (fileId: string, content: string) => Promise<void>;
    deleteFileById: (fileId: string) => Promise<void>;
    renameFile: (fileId: string, newPath: string, newName: string) => Promise<void>;
    getFileByPath: (path: string) => ProjectFile | undefined;

    createSnapshot: (label?: string) => Promise<Snapshot>;
    restoreSnapshot: (snapshotId: string) => Promise<void>;
    deleteSnapshotById: (snapshotId: string) => Promise<void>;

    updateLayout: (layout: Partial<WorkspaceLayout>) => void;
    refreshProjects: () => Promise<void>;
    syncProjectToShared: (projectId?: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
    return ctx;
};

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
        'ts': 'text/typescript', 'tsx': 'text/typescript', 'js': 'text/javascript', 'jsx': 'text/javascript',
        'json': 'application/json', 'html': 'text/html', 'css': 'text/css', 'md': 'text/markdown',
        'py': 'text/x-python', 'txt': 'text/plain', 'env': 'text/plain', 'yml': 'text/yaml', 'yaml': 'text/yaml',
    };
    return mimeMap[ext] || 'text/plain';
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isGuest, isLoading: authLoading, user } = useAuth();
    const { files: fsFiles, createFolder: fsCreateFolder, createFile: fsCreateFile, moveToTrash: fsMoveToTrash } = useFileSystem();

    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [currentFiles, setCurrentFiles] = useState<ProjectFile[]>([]);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const persistProject = useCallback(async (project: Project) => {
        if (isGuest) return;
        await saveProject(project);
    }, [isGuest]);

    const persistDeleteProject = useCallback(async (id: string) => {
        if (isGuest) return;
        await dbDeleteProject(id);
    }, [isGuest]);

    const persistFile = useCallback(async (file: ProjectFile) => {
        if (isGuest) return;
        await saveProjectFile(file);
    }, [isGuest]);

    const persistFiles = useCallback(async (files: ProjectFile[]) => {
        if (isGuest) return;
        await saveProjectFiles(files);
    }, [isGuest]);

    const persistDeleteFile = useCallback(async (id: string) => {
        if (isGuest) return;
        await deleteProjectFile(id);
    }, [isGuest]);

    const persistSnapshot = useCallback(async (snapshot: Snapshot) => {
        if (isGuest) return;
        await dbSaveSnapshot(snapshot);
    }, [isGuest]);

    const persistDeleteSnapshot = useCallback(async (id: string) => {
        if (isGuest) return;
        await dbDeleteSnapshot(id);
    }, [isGuest]);

    const refreshProjects = useCallback(async () => {
        if (isGuest) {
            return;
        }
        try {
            const all = await getAllProjects();
            setProjects(all.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch (e) {
            console.error('Failed to load projects:', e);
        }
    }, [isGuest]);

    const projectsFolderId = useMemo(() => {
        const username = user?.username || 'guest';
        if (isGuest) return 'guest-projects';
        return `user-${username}-projects`;
    }, [isGuest, user]);

    const syncProjectToFS = useCallback(async (project: Project, projectFiles: ProjectFile[]) => {
        const folderId = await fsCreateFolder(project.name, projectsFolderId);
        if (!folderId) return;

        for (const file of projectFiles) {
            if (file.isDirectory) continue;
            await fsCreateFile(file.name, folderId, file.content);
        }
    }, [projectsFolderId, fsCreateFolder, fsCreateFile]);

    const cheerpx = useCheerpXSafe();

    const syncProjectToShared = useCallback(async (projectId?: string) => {
        if (!cheerpx?.writeSharedFile || !cheerpx?.isBooted) return;
        const targetProject = projectId
            ? projects.find(p => p.id === projectId) || currentProject
            : currentProject;
        if (!targetProject) return;
        const filesToSync = projectId
            ? currentFiles
            : currentFiles;
        const projectDir = targetProject.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const writePromises = filesToSync
            .filter(f => !f.isDirectory)
            .map(f => cheerpx.writeSharedFile(`${projectDir}/${f.path}`, f.content));
        await Promise.all(writePromises);
    }, [cheerpx, projects, currentProject, currentFiles]);


    const removeProjectFromFS = useCallback(async (projectName: string) => {
        const projectFolder = fsFiles.find(f => f.name === projectName && f.parent === projectsFolderId);
        if (projectFolder) {
            const children = fsFiles.filter(f => f.parent === projectFolder.id);
            for (const child of children) {
                await fsMoveToTrash(child.id);
            }
            await fsMoveToTrash(projectFolder.id);
        }
    }, [fsFiles, projectsFolderId, fsMoveToTrash]);

    useEffect(() => {
        if (authLoading) return;
        if (isGuest) {
            setProjects([]);
            setIsLoading(false);
            return;
        }
        refreshProjects().finally(() => setIsLoading(false));
    }, [authLoading, isGuest, refreshProjects]);

    const createProject = useCallback(async (name: string, templateId: string, description?: string): Promise<Project> => {
        const template = getTemplate(templateId);
        if (!template) throw new Error(`Template "${templateId}" not found`);

        const projectId = generateId();
        const now = Date.now();

        const project: Project = {
            id: projectId,
            name,
            templateId,
            createdAt: now,
            updatedAt: now,
            members: [],
            layoutState: { ...template.initialLayout },
            description,
            stack: template.stack,
            status: 'active',
        };

        const projectFiles: ProjectFile[] = Object.entries(template.files).map(([path, content]) => {
            const parts = path.split('/');
            const fileName = parts[parts.length - 1];
            const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';

            return {
                id: generateId(),
                projectId,
                path,
                name: fileName,
                content,
                mimeType: getMimeType(fileName),
                isDirectory: false,
                parentPath,
                createdAt: now,
                updatedAt: now,
            };
        });

        const dirs = new Set<string>();
        projectFiles.forEach(f => {
            const parts = f.path.split('/');
            for (let i = 1; i < parts.length; i++) {
                dirs.add(parts.slice(0, i).join('/'));
            }
        });

        const dirFiles: ProjectFile[] = Array.from(dirs).map(dirPath => {
            const parts = dirPath.split('/');
            return {
                id: generateId(),
                projectId,
                path: dirPath,
                name: parts[parts.length - 1],
                content: '',
                mimeType: 'directory',
                isDirectory: true,
                parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : '/',
                createdAt: now,
                updatedAt: now,
            };
        });

        await persistProject(project);
        await persistFiles([...dirFiles, ...projectFiles]);

        setCurrentProject(project);
        setCurrentFiles([...dirFiles, ...projectFiles]);
        setProjects(prev => [project, ...prev]);

        const snapshot: Snapshot = {
            id: generateId(),
            projectId,
            timestamp: now,
            files: [...dirFiles, ...projectFiles],
            layoutState: project.layoutState,
            metadata: { label: 'Initial', auto: true },
        };
        await persistSnapshot(snapshot);
        setSnapshots([snapshot]);

        await syncProjectToFS(project, projectFiles);
        syncProjectToShared(project.id).catch(() => {});

        return project;
    }, [persistProject, persistFiles, persistSnapshot, syncProjectToFS, syncProjectToShared]);

    const createProjectFromRawFiles = useCallback(async (
        name: string, files: Record<string, string>, description?: string, stack?: string[]
    ): Promise<Project> => {
        const projectId = generateId();
        const now = Date.now();
        const project: Project = {
            id: projectId, name, templateId: 'custom', createdAt: now, updatedAt: now,
            members: [], layoutState: { ...DEFAULT_LAYOUT }, description, stack: stack || [], status: 'active',
        };
        const projectFiles: ProjectFile[] = Object.entries(files).map(([path, content]) => {
            const parts = path.split('/');
            return {
                id: generateId(), projectId, path, name: parts[parts.length - 1], content,
                mimeType: getMimeType(parts[parts.length - 1]), isDirectory: false,
                parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : '/',
                createdAt: now, updatedAt: now,
            };
        });
        const dirs = new Set<string>();
        projectFiles.forEach(f => { const parts = f.path.split('/'); for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/')); });
        const dirFiles: ProjectFile[] = Array.from(dirs).map(dirPath => {
            const parts = dirPath.split('/');
            return {
                id: generateId(), projectId, path: dirPath, name: parts[parts.length - 1], content: '',
                mimeType: 'directory', isDirectory: true,
                parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : '/',
                createdAt: now, updatedAt: now,
            };
        });
        await persistProject(project);
        await persistFiles([...dirFiles, ...projectFiles]);
        setCurrentProject(project);
        setCurrentFiles([...dirFiles, ...projectFiles]);
        setProjects(prev => [project, ...prev]);
        const snapshot: Snapshot = {
            id: generateId(), projectId, timestamp: now, files: [...dirFiles, ...projectFiles],
            layoutState: project.layoutState, metadata: { label: 'Initial', auto: true },
        };
        await persistSnapshot(snapshot);
        setSnapshots([snapshot]);
        await syncProjectToFS(project, projectFiles);
        syncProjectToShared(project.id).catch(() => {});
        return project;
    }, [persistProject, persistFiles, persistSnapshot, syncProjectToFS, syncProjectToShared]);

    const openProject = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            if (isGuest) {
                const project = projects.find(p => p.id === id);
                if (project) {
                    setCurrentProject(project);
                }
                return;
            }

            const all = await getAllProjects();
            const project = all.find(p => p.id === id);
            if (!project) throw new Error('Project not found');

            const files = await getProjectFiles(id);
            const snaps = await getProjectSnapshots(id);

            setCurrentProject(project);
            setCurrentFiles(files);
            setSnapshots(snaps);
        } catch (e) {
            console.error('Failed to open project:', e);
        } finally {
            setIsLoading(false);
        }
    }, [isGuest, projects]);

    const closeProject = useCallback(() => {
        setCurrentProject(null);
        setCurrentFiles([]);
        setSnapshots([]);
    }, []);

    const deleteProjectById = useCallback(async (id: string) => {
        const project = projects.find(p => p.id === id);
        await persistDeleteProject(id);
        if (currentProject?.id === id) {
            closeProject();
        }
        setProjects(prev => prev.filter(p => p.id !== id));
        if (project) {
            await removeProjectFromFS(project.name);
        }
    }, [projects, currentProject, closeProject, persistDeleteProject, removeProjectFromFS]);

    const updateProject = useCallback(async (updates: Partial<Project>) => {
        if (!currentProject) return;
        const updated = { ...currentProject, ...updates, updatedAt: Date.now() };
        await persistProject(updated);
        setCurrentProject(updated);
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => b.updatedAt - a.updatedAt));
    }, [currentProject, persistProject]);

    const createFile = useCallback(async (path: string, content: string, isDirectory = false): Promise<ProjectFile> => {
        if (!currentProject) throw new Error('No project open');

        const parts = path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
        const now = Date.now();

        const file: ProjectFile = {
            id: generateId(),
            projectId: currentProject.id,
            path,
            name,
            content,
            mimeType: isDirectory ? 'directory' : getMimeType(name),
            isDirectory,
            parentPath,
            createdAt: now,
            updatedAt: now,
        };

        await persistFile(file);
        setCurrentFiles(prev => [...prev, file]);
        await updateProject({ updatedAt: now });
        return file;
    }, [currentProject, updateProject, persistFile]);

    const updateFile = useCallback(async (fileId: string, content: string) => {
        const file = currentFiles.find(f => f.id === fileId);
        if (!file) return;

        const updated = { ...file, content, updatedAt: Date.now() };
        await persistFile(updated);
        setCurrentFiles(prev => prev.map(f => f.id === fileId ? updated : f));
    }, [currentFiles, persistFile]);

    const deleteFileById = useCallback(async (fileId: string) => {
        const file = currentFiles.find(f => f.id === fileId);
        if (!file) return;

        const toDelete = file.isDirectory
            ? currentFiles.filter(f => f.path.startsWith(file.path + '/') || f.id === fileId)
            : [file];

        for (const f of toDelete) {
            await persistDeleteFile(f.id);
        }
        setCurrentFiles(prev => prev.filter(f => !toDelete.find(d => d.id === f.id)));
    }, [currentFiles, persistDeleteFile]);

    const renameFile = useCallback(async (fileId: string, newPath: string, newName: string) => {
        const file = currentFiles.find(f => f.id === fileId);
        if (!file) return;

        const parts = newPath.split('/');
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';

        const updated = { ...file, path: newPath, name: newName, parentPath, updatedAt: Date.now() };
        await persistFile(updated);
        setCurrentFiles(prev => prev.map(f => f.id === fileId ? updated : f));
    }, [currentFiles, persistFile]);

    const getFileByPath = useCallback((path: string): ProjectFile | undefined => {
        return currentFiles.find(f => f.path === path);
    }, [currentFiles]);

    const createSnapshot = useCallback(async (label?: string): Promise<Snapshot> => {
        if (!currentProject) throw new Error('No project open');

        const snapshot: Snapshot = {
            id: generateId(),
            projectId: currentProject.id,
            timestamp: Date.now(),
            files: [...currentFiles],
            layoutState: currentProject.layoutState,
            metadata: { label, auto: !label },
        };

        await persistSnapshot(snapshot);
        setSnapshots(prev => [snapshot, ...prev]);
        return snapshot;
    }, [currentProject, currentFiles, persistSnapshot]);

    const restoreSnapshot = useCallback(async (snapshotId: string) => {
        const snapshot = snapshots.find(s => s.id === snapshotId);
        if (!snapshot || !currentProject) return;

        if (!isGuest) {
            const existingFiles = await getProjectFiles(currentProject.id);
            for (const f of existingFiles) {
                await deleteProjectFile(f.id);
            }
            await saveProjectFiles(snapshot.files);
        }
        setCurrentFiles(snapshot.files);
        await updateProject({ layoutState: snapshot.layoutState });
    }, [snapshots, currentProject, updateProject, isGuest]);

    const deleteSnapshotById = useCallback(async (snapshotId: string) => {
        await persistDeleteSnapshot(snapshotId);
        setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
    }, [persistDeleteSnapshot]);

    const updateLayout = useCallback((layout: Partial<WorkspaceLayout>) => {
        if (!currentProject) return;
        const updated = { ...currentProject, layoutState: { ...currentProject.layoutState, ...layout }, updatedAt: Date.now() };
        setCurrentProject(updated);
        persistProject(updated);
    }, [currentProject, persistProject]);

    return (
        <ProjectContext.Provider value={{
            projects, currentProject, currentFiles, snapshots, isLoading,
            createProject, createProjectFromRawFiles, openProject, closeProject, deleteProjectById, updateProject,
            createFile, updateFile, deleteFileById, renameFile, getFileByPath,
            createSnapshot, restoreSnapshot, deleteSnapshotById,
            updateLayout, refreshProjects, syncProjectToShared,
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
