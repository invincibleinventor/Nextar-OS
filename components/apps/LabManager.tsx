'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
    IoSchoolOutline, IoAddOutline, IoTrashOutline, IoCloudUploadOutline,
    IoCloudDownloadOutline, IoSearchOutline, IoTimeOutline, IoShieldCheckmarkOutline,
    IoPlayOutline, IoCreateOutline, IoDocumentTextOutline, IoCheckmarkCircleOutline,
} from 'react-icons/io5';
import type { LabTemplate } from '../../types/lab';
import type { CapsuleManifest } from '../../types/capsule';
import { listCapsules, importCapsule, exportCapsule, deleteCapsule } from '../../lib/capsules';
import { useProjects } from '../ProjectContext';
import { useWindows } from '../WindowContext';
import { useNotifications } from '../NotificationContext';

const BUILT_IN_TEMPLATES: LabTemplate[] = [
    {
        id: 'python-basics', name: 'Python Basics', description: 'Variables, loops, functions, and basic data structures.',
        category: 'programming', difficulty: 'beginner', estimatedMinutes: 30, language: 'python',
        instructions: '# Python Basics Lab\n\nComplete the exercises in `main.py`.\n\n1. Write a function that returns the sum of a list\n2. Implement binary search\n3. Create a class representing a student',
        files: [
            { path: 'main.py', content: '# Exercise 1: Sum of list\ndef list_sum(nums):\n    pass\n\n# Exercise 2: Binary search\ndef binary_search(arr, target):\n    pass\n\n# Exercise 3: Student class\nclass Student:\n    pass\n' },
            { path: 'test_main.py', content: 'from main import *\n\ndef test_list_sum():\n    assert list_sum([1, 2, 3]) == 6\n    assert list_sum([]) == 0\n\ndef test_binary_search():\n    assert binary_search([1, 3, 5, 7], 5) == 2\n    assert binary_search([1, 3, 5, 7], 4) == -1\n', readonly: true },
        ],
        rubric: [
            { id: 'r1', description: 'list_sum works correctly', points: 30, autoGrade: { command: 'python -c "from main import list_sum; assert list_sum([1,2,3])==6; print(\'PASS\')"', expectedPattern: 'PASS' } },
            { id: 'r2', description: 'binary_search works correctly', points: 40, autoGrade: { command: 'python -c "from main import binary_search; assert binary_search([1,3,5,7],5)==2; print(\'PASS\')"', expectedPattern: 'PASS' } },
            { id: 'r3', description: 'Student class implemented', points: 30 },
        ],
        tags: ['python', 'basics', 'data-structures'], author: 'HackathOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'web-fundamentals', name: 'Web Fundamentals', description: 'HTML, CSS, and JavaScript basics.',
        category: 'web', difficulty: 'beginner', estimatedMinutes: 45, language: 'html',
        instructions: '# Web Fundamentals Lab\n\nBuild a simple todo list app.\n\n1. Create the HTML structure\n2. Style with CSS\n3. Add JavaScript interactivity',
        files: [
            { path: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Todo List</h1>\n  <div id="app">\n    <!-- Build your todo list here -->\n  </div>\n  <script src="app.js"></script>\n</body>\n</html>' },
            { path: 'style.css', content: '/* Add your styles here */\nbody { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }' },
            { path: 'app.js', content: '// Add your JavaScript here\n' },
        ],
        tags: ['html', 'css', 'javascript', 'web'], author: 'HackathOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'data-analysis', name: 'Data Analysis with Python', description: 'Pandas, matplotlib, and data wrangling.',
        category: 'data-science', difficulty: 'intermediate', estimatedMinutes: 60, language: 'python',
        instructions: '# Data Analysis Lab\n\nAnalyze a dataset using pandas.\n\n1. Load and explore the data\n2. Clean missing values\n3. Create visualizations\n4. Compute summary statistics',
        files: [
            { path: 'analysis.py', content: 'import pandas as pd\n\n# Load data\n# df = pd.read_csv("data.csv")\n\n# Exercise 1: Explore\n\n# Exercise 2: Clean\n\n# Exercise 3: Visualize\n\n# Exercise 4: Statistics\n' },
            { path: 'data.csv', content: 'name,age,score,grade\nAlice,20,85,B\nBob,21,,A\nCharlie,19,72,C\nDiana,,91,A\nEve,22,68,D\n', readonly: true },
        ],
        tags: ['python', 'pandas', 'data-science'], author: 'HackathOS', createdAt: new Date().toISOString(),
    },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: 'bg-pastel-green/20 text-pastel-green',
    intermediate: 'bg-pastel-yellow/20 text-pastel-yellow',
    advanced: 'bg-pastel-peach/20 text-pastel-peach',
    expert: 'bg-pastel-red/20 text-pastel-red',
};

export default function LabManager() {
    const [tab, setTab] = useState<'templates' | 'capsules' | 'create'>('templates');
    const [search, setSearch] = useState('');
    const [capsules, setCapsules] = useState<CapsuleManifest[]>([]);
    const [templates] = useState<LabTemplate[]>(BUILT_IN_TEMPLATES);
    const [launching, setLaunching] = useState<string | null>(null);

    // Create template form state
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState('programming');
    const [newDifficulty, setNewDifficulty] = useState('beginner');
    const [newMinutes, setNewMinutes] = useState(30);
    const [newInstructions, setNewInstructions] = useState('');

    const { createProjectFromRawFiles } = useProjects();
    const { addwindow } = useWindows();
    const { addToast } = useNotifications();

    useEffect(() => { listCapsules().then(setCapsules).catch(() => {}); }, []);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.includes(search.toLowerCase()))
    );

    const launchTemplate = useCallback(async (t: LabTemplate) => {
        setLaunching(t.id);
        try {
            const filesMap: Record<string, string> = {};
            t.files.forEach(f => { filesMap[f.path] = f.content; });
            // Add instructions as README
            if (t.instructions) filesMap['README.md'] = t.instructions;

            const project = await createProjectFromRawFiles(
                `Lab: ${t.name}`, filesMap, t.description, [t.language]
            );
            addwindow({
                id: `workspace-${project.id}`,
                appname: 'Workspace',
                component: 'apps/HackathonWorkspace',
                props: { projectId: project.id },
                maximizeable: true,
            });
            addToast?.(`Lab launched: ${t.name}`, 'success');
        } catch (err: any) {
            addToast?.('Launch failed: ' + err.message, 'error');
        }
        setLaunching(null);
    }, [createProjectFromRawFiles, addwindow, addToast]);

    const customizeTemplate = useCallback((t: LabTemplate) => {
        setTab('create');
        setNewName(t.name + ' (Custom)');
        setNewDesc(t.description);
        setNewCategory(t.category);
        setNewDifficulty(t.difficulty);
        setNewMinutes(t.estimatedMinutes);
        setNewInstructions(t.instructions);
    }, []);

    const handleCreate = useCallback(async () => {
        if (!newName.trim()) return;
        const filesMap: Record<string, string> = {};
        if (newInstructions) filesMap['README.md'] = newInstructions;
        filesMap['main.py'] = '# Start coding here\n';

        try {
            const project = await createProjectFromRawFiles(
                `Lab: ${newName}`, filesMap, newDesc, []
            );
            addwindow({
                id: `workspace-${project.id}`,
                appname: 'Workspace',
                component: 'apps/HackathonWorkspace',
                props: { projectId: project.id },
                maximizeable: true,
            });
            addToast?.(`Lab created: ${newName}`, 'success');
            setNewName(''); setNewDesc(''); setNewInstructions('');
        } catch (err: any) {
            addToast?.('Create failed: ' + err.message, 'error');
        }
    }, [newName, newDesc, newInstructions, createProjectFromRawFiles, addwindow, addToast]);

    const handleImport = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.capsule';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                await importCapsule(file);
                setCapsules(await listCapsules());
            } catch (err: any) { addToast?.('Import failed: ' + err.message, 'error'); }
        };
        input.click();
    }, [addToast]);

    const handleExport = useCallback(async (id: string) => {
        try {
            const blob = await exportCapsule(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `capsule-${id}.json`; a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) { addToast?.('Export failed: ' + err.message, 'error'); }
    }, [addToast]);

    const handleDelete = useCallback(async (id: string) => {
        await deleteCapsule(id);
        setCapsules(await listCapsules());
    }, []);

    return (
        <div className="flex h-full bg-[--bg-base] text-[--text-color]">
            {/* Sidebar */}
            <div className="w-52 border-r border-[--border-color] bg-[--bg-surface] flex flex-col">
                <div className="p-3 border-b border-[--border-color]">
                    <div className="flex items-center gap-2 mb-3">
                        <IoSchoolOutline className="w-5 h-5 text-pastel-peach" />
                        <span className="font-semibold text-sm">Lab Manager</span>
                    </div>
                    <div className="relative">
                        <IoSearchOutline className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--text-muted]" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                            className="w-full bg-[--bg-overlay] border border-[--border-color] rounded pl-7 pr-2 py-1 text-xs" />
                    </div>
                </div>
                {[
                    { id: 'templates' as const, label: 'Templates', icon: IoDocumentTextOutline },
                    { id: 'capsules' as const, label: 'Capsules', icon: IoShieldCheckmarkOutline },
                    { id: 'create' as const, label: 'Create New', icon: IoAddOutline },
                ].map(item => (
                    <button key={item.id} onClick={() => setTab(item.id)}
                        className={`flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${tab === item.id ? 'bg-[--bg-overlay] text-[--text-color]' : 'text-[--text-muted] hover:bg-[--bg-overlay]'}`}>
                        <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                ))}
            </div>

            {/* Main */}
            <div className="flex-1 overflow-auto p-4">
                {tab === 'templates' && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold">Lab Templates</h2>
                        <p className="text-xs text-[--text-muted]">Ready-made lab environments. Click Launch to start.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredTemplates.map(t => (
                                <div key={t.id} className="anime-card border border-[--border-color] rounded-lg p-4 bg-[--bg-surface] hover:border-[--accent-color] transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-sm">{t.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[t.difficulty]}`}>
                                            {t.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[--text-muted] mb-3">{t.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-[--text-muted]">
                                        <span className="flex items-center gap-1"><IoTimeOutline className="w-3 h-3" /> {t.estimatedMinutes}min</span>
                                        <span className="uppercase font-mono text-[10px] bg-[--bg-overlay] px-1.5 py-0.5 rounded">{t.language}</span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => launchTemplate(t)}
                                            disabled={launching === t.id}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-pastel-blue text-white rounded text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
                                        >
                                            <IoPlayOutline className="w-3 h-3" /> {launching === t.id ? 'Launching...' : 'Launch'}
                                        </button>
                                        <button
                                            onClick={() => customizeTemplate(t)}
                                            className="flex items-center gap-1 px-3 py-1.5 border border-[--border-color] rounded text-xs hover:bg-[--bg-overlay] transition-colors"
                                        >
                                            <IoCreateOutline className="w-3 h-3" /> Customize
                                        </button>
                                    </div>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {t.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-[--bg-overlay] px-1.5 py-0.5 rounded">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'capsules' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Environment Capsules</h2>
                            <button onClick={handleImport}
                                className="flex items-center gap-1 px-3 py-1.5 bg-pastel-green text-white rounded text-xs hover:opacity-90 transition-opacity">
                                <IoCloudUploadOutline className="w-3 h-3" /> Import
                            </button>
                        </div>
                        {capsules.length === 0 && (
                            <div className="text-center py-12 text-[--text-muted]">
                                <IoShieldCheckmarkOutline className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No capsules yet</p>
                                <p className="text-xs">Create one from a template or import from file</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            {capsules.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 border border-[--border-color] rounded-lg bg-[--bg-surface] hover:border-[--accent-color] transition-colors">
                                    <div>
                                        <h3 className="font-medium text-sm">{c.name}</h3>
                                        <p className="text-xs text-[--text-muted]">{c.description} — {c.files.length} files</p>
                                        <p className="text-[10px] text-[--text-muted] font-mono mt-1">DNA: {c.environmentDNA.slice(0, 16)}...</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleExport(c.id)} title="Export"
                                            className="p-1.5 hover:bg-[--bg-overlay] rounded text-[--text-muted] transition-colors">
                                            <IoCloudDownloadOutline className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} title="Delete"
                                            className="p-1.5 hover:bg-[--bg-overlay] rounded text-pastel-red transition-colors">
                                            <IoTrashOutline className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'create' && (
                    <div className="space-y-3 max-w-lg">
                        <h2 className="text-lg font-semibold">Create Lab Template</h2>
                        <p className="text-xs text-[--text-muted]">Design a new lab environment from scratch.</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium block mb-1">Lab Name</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm focus:border-[--accent-color] outline-none transition-colors" placeholder="e.g., Sorting Algorithms" />
                            </div>
                            <div>
                                <label className="text-xs font-medium block mb-1">Description</label>
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                                    className="w-full bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm h-20 resize-none focus:border-[--accent-color] outline-none transition-colors" placeholder="What will students learn?" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium block mb-1">Category</label>
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                                        className="w-full bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm">
                                        <option value="programming">Programming</option><option value="web">Web</option><option value="data-science">Data Science</option><option value="systems">Systems</option><option value="security">Security</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Difficulty</label>
                                    <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}
                                        className="w-full bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm">
                                        <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium block mb-1">Time Limit (minutes, 0 = unlimited)</label>
                                <input type="number" value={newMinutes} onChange={e => setNewMinutes(+e.target.value)}
                                    className="w-full bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm focus:border-[--accent-color] outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-medium block mb-1">Instructions (Markdown)</label>
                                <textarea value={newInstructions} onChange={e => setNewInstructions(e.target.value)}
                                    className="w-full bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm h-32 resize-none font-mono focus:border-[--accent-color] outline-none transition-colors" placeholder="# Lab Title&#10;&#10;Instructions..." />
                            </div>
                            <button onClick={handleCreate} disabled={!newName.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-pastel-blue text-white rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                                <IoCheckmarkCircleOutline className="w-4 h-4" /> Create & Launch
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
