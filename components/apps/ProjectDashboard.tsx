'use client';
import React, { useState, useCallback, useMemo } from 'react';
import {
    IoRocketOutline, IoTimeOutline, IoTrashOutline, IoFolderOpenOutline,
    IoAddOutline, IoSearchOutline, IoGridOutline, IoCodeOutline,
    IoServerOutline, IoGlobeOutline, IoPhonePortraitOutline,
} from 'react-icons/io5';
import { VscArchive } from 'react-icons/vsc';
import { useProjects } from '../ProjectContext';
import { useWindows } from '../WindowContext';
import { useNotifications } from '../NotificationContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { templates } from '../../utils/templates';
import { ProjectTemplate } from '../../types/project';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassButton, glassInput } from '../hooks/useClayStyles';

const categoryIcons: Record<string, React.ReactNode> = {
    'frontend': <IoGlobeOutline size={14} />,
    'fullstack': <IoCodeOutline size={14} />,
    'api': <IoServerOutline size={14} />,
    'static': <IoGridOutline size={14} />,
    'mobile': <IoPhonePortraitOutline size={14} />,
};

const categoryColors: Record<string, string> = {
    'frontend': '#3b82f6',
    'fullstack': '#a855f7',
    'api': '#22c55e',
    'static': '#f59e0b',
    'mobile': '#ef4444',
};

const TemplateCard: React.FC<{
    template: ProjectTemplate;
    onSelect: (template: ProjectTemplate) => void;
}> = ({ template, onSelect }) => {
    const clay = useIsClay();
    return (
        <div
            onClick={() => onSelect(template)}
            className={`p-4 cursor-pointer transition-all group ${clay ? 'rounded-[16px] active:scale-[0.97]' : 'border border-[--border-color] bg-overlay hover:bg-surface'}`}
            style={clay ? { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xs)' } : undefined}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{template.icon}</div>
                <div className="text-[10px] text-[--text-muted] flex items-center gap-1">
                    <span style={{ color: categoryColors[template.category] }}>{categoryIcons[template.category]}</span> {template.category}
                </div>
            </div>
            <h3 className="text-[13px] font-semibold text-[--text-color] mb-1">{template.name}</h3>
            <p className="text-[11px] text-[--text-muted] mb-3 line-clamp-2">{template.description}</p>
            <div className="flex flex-wrap gap-1">
                {template.stack.map(s => (
                    <span key={s} className={`px-1.5 py-0.5 text-[10px] text-[--text-muted] ${clay ? 'rounded-[6px] bg-[--bg-glass-active]' : 'bg-[--border-color]'}`}>{s}</span>
                ))}
            </div>
        </div>
    );
};

const ProjectCard: React.FC<{
    project: { id: string; name: string; templateId: string; updatedAt: number; stack?: string[]; status: string; description?: string };
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ project, onOpen, onDelete }) => {
    const clay = useIsClay();
    const template = templates.find(t => t.id === project.templateId);
    const timeAgo = getTimeAgo(project.updatedAt);

    return (
        <div
            className={`p-4 transition-all group ${clay ? 'rounded-[16px] active:scale-[0.97]' : 'border border-[--border-color] bg-surface hover:bg-overlay'}`}
            style={clay ? { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xs)' } : undefined}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="text-xl">{template?.icon || '📁'}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                        className={`p-1 text-pastel-red ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                        title="Delete project"
                    >
                        <IoTrashOutline size={12} />
                    </button>
                </div>
            </div>
            <h3 className="text-[13px] font-semibold text-[--text-color] mb-0.5">{project.name}</h3>
            {project.description && (
                <p className="text-[11px] text-[--text-muted] mb-2 line-clamp-1">{project.description}</p>
            )}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-[--text-muted] flex items-center gap-0.5">
                    <IoTimeOutline size={10} /> {timeAgo}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 ${clay ? 'rounded-[6px]' : ''} ${project.status === 'active' ? (clay ? 'bg-[--bg-glass-active] text-pastel-green' : 'bg-pastel-green/20 text-pastel-green') : (clay ? 'bg-[--bg-glass-active] text-[--text-muted]' : 'bg-[--border-color] text-[--text-muted]')}`}>
                    {project.status}
                </span>
            </div>
            {project.stack && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {project.stack.slice(0, 3).map(s => (
                        <span key={s} className={`px-1.5 py-0.5 text-[10px] text-[--text-muted] ${clay ? 'rounded-[6px] bg-[--bg-glass-active]' : 'bg-[--border-color]'}`}>{s}</span>
                    ))}
                </div>
            )}
            <button
                onClick={() => onOpen(project.id)}
                className={`py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition hover:opacity-90 ${clay ? 'rounded-[12px] px-5 text-white active:scale-[0.97]' : 'w-full bg-accent text-[--bg-base]'}`}
                style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
            >
                <IoFolderOpenOutline size={12} /> Open Project
            </button>
        </div>
    );
};

function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const CreateProjectDialog: React.FC<{
    template: ProjectTemplate;
    onClose: () => void;
    onCreate: (name: string, description: string) => void;
}> = ({ template, onClose, onCreate }) => {
    const clay = useIsClay();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-[999] ${clay ? 'bg-black/30 backdrop-blur-sm' : 'bg-black/60'}`} onClick={onClose}>
            <div
                className={`p-6 w-[420px] ${clay ? 'rounded-[28px]' : 'bg-surface border border-[--border-color]'}`}
                style={clay ? { background: 'var(--bg-glass)', backdropFilter: 'blur(var(--glass-blur-heavy))', WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xl)' } : undefined}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div>
                        <h2 className="text-[--text-color] font-semibold">{template.name}</h2>
                        <p className="text-xs text-[--text-muted]">{template.description}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-5">
                    <div>
                        <label className="text-[11px] text-[--text-muted] mb-1 block">Project Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="my-project"
                            className={`w-full px-3 py-2 text-[13px] text-[--text-color] outline-none ${clay ? 'rounded-[12px]' : 'bg-overlay border border-transparent focus:border-accent'}`}
                            style={clay ? glassInput : undefined}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-[11px] text-[--text-muted] mb-1 block">Description (optional)</label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What are you building?"
                            className={`w-full px-3 py-2 text-[13px] text-[--text-color] outline-none ${clay ? 'rounded-[12px]' : 'bg-overlay border border-transparent focus:border-accent'}`}
                            style={clay ? glassInput : undefined}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] text-[--text-muted]">Stack:</span>
                    {template.stack.map(s => (
                        <span key={s} className={`px-1.5 py-0.5 text-[10px] text-[--text-muted] ${clay ? 'rounded-[6px] bg-[--bg-glass-active]' : 'bg-[--border-color]'}`}>{s}</span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose}
                        className={`flex-1 py-2 text-[--text-muted] text-[13px] transition ${clay ? 'rounded-[12px] active:scale-[0.97] hover:bg-[--bg-glass-hover]' : 'bg-overlay hover:bg-[--border-color]'}`}
                        style={clay ? glassButton : undefined}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { if (name.trim()) onCreate(name.trim(), description.trim()); }}
                        disabled={!name.trim()}
                        className={`flex-1 py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium flex items-center justify-center gap-1.5 transition ${clay ? 'rounded-[12px] active:scale-[0.97] text-white' : 'bg-accent text-[--bg-base]'}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                    >
                        <IoRocketOutline size={14} /> Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ProjectDashboard({ windowId, appId = 'projectdashboard', id }: { windowId?: string; appId?: string; id?: string }) {
    const { projects, createProject, deleteProjectById, openProject, isLoading } = useProjects();
    const { addwindow, activewindow } = useWindows();
    const { addToast } = useNotifications();
    const clay = useIsClay();
    const isActiveWindow = activewindow === (id || windowId);
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [view, setView] = useState<'projects' | 'templates'>('projects');

    const filteredTemplates = templates.filter(t => {
        if (activeCategory !== 'all' && t.category !== activeCategory) return false;
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const filteredProjects = projects.filter(p => {
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleCreateProject = useCallback(async (name: string, description: string) => {
        if (!selectedTemplate) return;
        try {
            const project = await createProject(name, selectedTemplate.id, description);
            setSelectedTemplate(null);
            addToast(`Created project "${name}"`, 'success');
            addwindow({
                id: `workspace-${project.id}`,
                appname: 'Workspace',
                component: 'apps/HackathonWorkspace',
                props: { projectId: project.id },
                isminimized: false,
                ismaximized: false,
            });
        } catch (e) {
            addToast('Failed to create project', 'error');
            console.error('Failed to create project:', e);
        }
    }, [selectedTemplate, createProject, addwindow, addToast]);

    const handleOpenProject = useCallback(async (projectId: string) => {
        await openProject(projectId);
        addwindow({
            id: `workspace-${projectId}`,
            appname: 'Workspace',
            component: 'apps/HackathonWorkspace',
            props: { projectId },
            isminimized: false,
            ismaximized: false,
        });
    }, [openProject, addwindow]);

    const handleDeleteProject = useCallback(async (deleteId: string) => {
        const project = projects.find(p => p.id === deleteId);
        await deleteProjectById(deleteId);
        addToast(`Deleted project "${project?.name || 'unknown'}"`, 'success');
    }, [deleteProjectById, projects, addToast]);

    const dashboardMenus = useMemo(() => ({
        File: [
            { title: "New Project", actionId: "new-project", shortcut: "⌘N" },
        ],
        View: [
            { title: "My Projects", actionId: "view-projects", shortcut: "⌘1" },
            { title: "Templates", actionId: "view-templates", shortcut: "⌘2" },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'new-project': () => setView('templates'),
        'view-projects': () => setView('projects'),
        'view-templates': () => setView('templates'),
    }), []);

    useMenuRegistration(dashboardMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id || windowId);

    const categories = ['all', 'frontend', 'fullstack', 'api', 'static'];

    return (
        <div className={`flex flex-col h-full bg-[--bg-base] text-[--text-color] overflow-hidden ${clay ? 'font-sans' : 'font-mono'}`}>
            <div className={`px-6 pt-5 pb-4 border-b shrink-0 ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <IoRocketOutline size={22} /> Project Workspace
                        </h1>
                        <p className="text-xs text-[--text-muted] mt-0.5">Build, code, and ship</p>
                    </div>
                    <div className={`flex items-center gap-0 ${clay ? 'rounded-[12px] overflow-hidden border border-[--glass-border]' : 'border border-[--border-color]'}`} style={clay ? { background: 'var(--bg-glass)' } : undefined}>
                        <button
                            onClick={() => setView('projects')}
                            className={`px-3 py-1.5 text-xs transition ${clay ? 'rounded-[10px] active:scale-[0.97]' : ''} ${view === 'projects' ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]') : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`}
                            style={view === 'projects' && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            My Projects
                        </button>
                        <button
                            onClick={() => setView('templates')}
                            className={`px-3 py-1.5 text-xs transition ${clay ? 'rounded-[10px] active:scale-[0.97]' : ''} ${view === 'templates' ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]') : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`}
                            style={view === 'templates' && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            Templates
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={view === 'projects' ? 'Search projects...' : 'Search templates...'}
                        className={`w-full pl-9 pr-3 py-2 text-[13px] text-[--text-color] outline-none focus:border-accent placeholder:text-[--text-muted] ${clay ? 'rounded-full' : 'bg-overlay border border-transparent'}`}
                        style={clay ? { background: 'var(--bg-glass-active)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-inset)' } : undefined}
                    />
                </div>

                {view === 'templates' && (
                    <div className="flex items-center gap-1 mt-3">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1 text-[11px] transition capitalize ${clay ? 'rounded-[8px] active:scale-[0.97]' : ''} ${activeCategory === cat ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]') : (clay ? 'text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-glass-hover]' : 'bg-overlay text-[--text-muted] hover:text-[--text-color]')}`}
                                style={activeCategory === cat && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {view === 'projects' ? (
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-[--text-muted] text-[13px]">Loading projects...</div>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <VscArchive size={40} className="text-[--text-muted] mb-3 opacity-50" />
                                <div className="text-[--text-muted] mb-1">No projects yet</div>
                                <div className="text-xs text-[--text-muted] opacity-60 mb-4">Create your first project from a template</div>
                                <button
                                    onClick={() => setView('templates')}
                                    className={`px-4 py-2 text-[13px] font-medium flex items-center gap-1.5 transition hover:opacity-90 ${clay ? 'rounded-[12px] active:scale-[0.97] text-white' : 'bg-accent text-[--bg-base]'}`}
                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                >
                                    <IoAddOutline size={14} /> New Project
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[13px] text-[--text-muted]">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
                                    <button
                                        onClick={() => setView('templates')}
                                        className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition hover:opacity-90 ${clay ? 'rounded-[12px] active:scale-[0.97] text-white' : 'bg-accent text-[--bg-base]'}`}
                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                    >
                                        <IoAddOutline size={12} /> New Project
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredProjects.map(project => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            onOpen={handleOpenProject}
                                            onDelete={handleDeleteProject}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <span className="text-[13px] text-[--text-muted]">{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onSelect={setSelectedTemplate}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {selectedTemplate && (
                <CreateProjectDialog
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                    onCreate={handleCreateProject}
                />
            )}
        </div>
    );
}
