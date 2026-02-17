'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    IoSchoolOutline, IoRocketOutline, IoCloudUploadOutline,
    IoCloudDownloadOutline, IoSearchOutline, IoTimeOutline,
    IoPlayOutline, IoCreateOutline, IoDocumentTextOutline,
    IoTrashOutline, IoCodeSlashOutline, IoGlobeOutline,
    IoServerOutline, IoLayersOutline, IoFlaskOutline,
    IoShieldCheckmarkOutline, IoAddOutline, IoCheckmarkCircleOutline,
} from 'react-icons/io5';
import type { LabTemplate } from '../../types/lab';
import type { CapsuleManifest } from '../../types/capsule';
import { templates as hackathonTemplates } from '../../utils/templates';
import { listCapsules, importCapsule, exportCapsule, deleteCapsule } from '../../lib/capsules';
import { useProjects } from '../ProjectContext';
import { useWindows } from '../WindowContext';
import { useNotifications } from '../NotificationContext';

const LAB_TEMPLATES: LabTemplate[] = [
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
        tags: ['python', 'basics', 'data-structures'], author: 'NextarOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'web-fundamentals', name: 'Web Fundamentals', description: 'HTML, CSS, and JavaScript basics.',
        category: 'web', difficulty: 'beginner', estimatedMinutes: 45, language: 'html',
        instructions: '# Web Fundamentals Lab\n\nBuild a simple todo list app.\n\n1. Create the HTML structure\n2. Style with CSS\n3. Add JavaScript interactivity',
        files: [
            { path: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Todo List</h1>\n  <div id="app"></div>\n  <script src="app.js"></script>\n</body>\n</html>' },
            { path: 'style.css', content: 'body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }' },
            { path: 'app.js', content: '' },
        ],
        tags: ['html', 'css', 'javascript', 'web'], author: 'NextarOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'data-analysis', name: 'Data Analysis with Python', description: 'Pandas, matplotlib, and data wrangling.',
        category: 'data-science', difficulty: 'intermediate', estimatedMinutes: 60, language: 'python',
        instructions: '# Data Analysis Lab\n\nAnalyze a dataset using pandas.\n\n1. Load and explore the data\n2. Clean missing values\n3. Create visualizations\n4. Compute summary statistics',
        files: [
            { path: 'analysis.py', content: 'import pandas as pd\n\n' },
            { path: 'data.csv', content: 'name,age,score,grade\nAlice,20,85,B\nBob,21,,A\nCharlie,19,72,C\nDiana,,91,A\nEve,22,68,D\n', readonly: true },
        ],
        tags: ['python', 'pandas', 'data-science'], author: 'NextarOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'api-development', name: 'API Development', description: 'Build REST endpoints with Flask or Express.',
        category: 'web', difficulty: 'intermediate', estimatedMinutes: 45, language: 'python',
        instructions: '# API Development Lab\n\nBuild a simple REST API.\n\n1. Create a GET endpoint that returns all items\n2. Create a POST endpoint that adds an item\n3. Create a DELETE endpoint that removes an item\n4. Add input validation',
        files: [
            { path: 'app.py', content: 'from flask import Flask, jsonify, request\n\napp = Flask(__name__)\nitems = []\n\n@app.route("/api/items", methods=["GET"])\ndef get_items():\n    pass\n\n@app.route("/api/items", methods=["POST"])\ndef add_item():\n    pass\n\n@app.route("/api/items/<int:item_id>", methods=["DELETE"])\ndef delete_item(item_id):\n    pass\n\nif __name__ == "__main__":\n    app.run(debug=True, port=5000)\n' },
            { path: 'test_api.py', content: 'import json\nfrom app import app\n\ndef test_get_items():\n    client = app.test_client()\n    resp = client.get("/api/items")\n    assert resp.status_code == 200\n    assert isinstance(resp.get_json(), list)\n\ndef test_add_item():\n    client = app.test_client()\n    resp = client.post("/api/items", json={"name": "test"})\n    assert resp.status_code == 201\n', readonly: true },
        ],
        rubric: [
            { id: 'r1', description: 'GET /api/items returns list', points: 25, autoGrade: { command: 'python -c "from app import app; c=app.test_client(); r=c.get(\'/api/items\'); assert r.status_code==200; print(\'PASS\')"', expectedPattern: 'PASS' } },
            { id: 'r2', description: 'POST /api/items creates item', points: 25, autoGrade: { command: 'python -c "from app import app; c=app.test_client(); r=c.post(\'/api/items\',json={\'name\':\'t\'}); assert r.status_code==201; print(\'PASS\')"', expectedPattern: 'PASS' } },
            { id: 'r3', description: 'DELETE /api/items/:id removes item', points: 25 },
            { id: 'r4', description: 'Input validation implemented', points: 25 },
        ],
        tags: ['python', 'flask', 'api', 'rest'], author: 'NextarOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'database-fundamentals', name: 'Database Fundamentals', description: 'SQLite queries with test assertions.',
        category: 'data-science', difficulty: 'beginner', estimatedMinutes: 40, language: 'python',
        instructions: '# Database Fundamentals Lab\n\n1. Create a users table\n2. Insert sample records\n3. Write SELECT queries with WHERE, ORDER BY, GROUP BY\n4. Write JOIN queries across two tables',
        files: [
            { path: 'queries.py', content: 'import sqlite3\n\ndef setup_db():\n    conn = sqlite3.connect(":memory:")\n    cursor = conn.cursor()\n    return conn, cursor\n\ndef create_tables(cursor):\n    pass\n\ndef insert_users(cursor):\n    pass\n\ndef get_users_by_age(cursor, min_age):\n    pass\n\ndef get_user_count_by_city(cursor):\n    pass\n' },
            { path: 'test_queries.py', content: 'from queries import *\n\ndef test_create_tables():\n    conn, cursor = setup_db()\n    create_tables(cursor)\n    cursor.execute("SELECT name FROM sqlite_master WHERE type=\'table\'")\n    tables = [r[0] for r in cursor.fetchall()]\n    assert "users" in tables\n', readonly: true },
        ],
        rubric: [
            { id: 'r1', description: 'Tables created correctly', points: 25 },
            { id: 'r2', description: 'Data inserted correctly', points: 25 },
            { id: 'r3', description: 'SELECT queries work', points: 25 },
            { id: 'r4', description: 'JOIN queries work', points: 25 },
        ],
        tags: ['python', 'sqlite', 'database', 'sql'], author: 'NextarOS', createdAt: new Date().toISOString(),
    },
    {
        id: 'algorithm-challenge', name: 'Algorithm Challenge', description: 'Classic algorithm problems with test runner.',
        category: 'programming', difficulty: 'advanced', estimatedMinutes: 60, language: 'python',
        instructions: '# Algorithm Challenge Lab\n\n1. Implement merge sort\n2. Solve the two-sum problem\n3. Find the longest common subsequence\n4. Implement a basic LRU cache',
        files: [
            { path: 'solutions.py', content: 'def merge_sort(arr):\n    pass\n\ndef two_sum(nums, target):\n    pass\n\ndef longest_common_subsequence(s1, s2):\n    pass\n\nclass LRUCache:\n    def __init__(self, capacity):\n        pass\n\n    def get(self, key):\n        pass\n\n    def put(self, key, value):\n        pass\n' },
            { path: 'test_solutions.py', content: 'from solutions import *\n\ndef test_merge_sort():\n    assert merge_sort([3, 1, 4, 1, 5]) == [1, 1, 3, 4, 5]\n    assert merge_sort([]) == []\n\ndef test_two_sum():\n    result = two_sum([2, 7, 11, 15], 9)\n    assert sorted(result) == [0, 1]\n\ndef test_lcs():\n    assert longest_common_subsequence("abcde", "ace") == 3\n\ndef test_lru_cache():\n    cache = LRUCache(2)\n    cache.put(1, 1)\n    cache.put(2, 2)\n    assert cache.get(1) == 1\n    cache.put(3, 3)\n    assert cache.get(2) == -1\n', readonly: true },
        ],
        rubric: [
            { id: 'r1', description: 'Merge sort works', points: 25, autoGrade: { command: 'python -c "from solutions import merge_sort; assert merge_sort([3,1,4,1,5])==[1,1,3,4,5]; print(\'PASS\')"', expectedPattern: 'PASS' } },
            { id: 'r2', description: 'Two-sum works', points: 25, autoGrade: { command: 'python -c "from solutions import two_sum; assert sorted(two_sum([2,7,11,15],9))==[0,1]; print(\'PASS\')"', expectedPattern: 'PASS' } },
            { id: 'r3', description: 'LCS works', points: 25 },
            { id: 'r4', description: 'LRU cache works', points: 25 },
        ],
        tags: ['python', 'algorithms', 'leetcode', 'sorting'], author: 'NextarOS', createdAt: new Date().toISOString(),
    },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: 'bg-pastel-green/20 text-pastel-green',
    intermediate: 'bg-pastel-yellow/20 text-pastel-yellow',
    advanced: 'bg-pastel-peach/20 text-pastel-peach',
    expert: 'bg-pastel-red/20 text-pastel-red',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    fullstack: IoLayersOutline,
    frontend: IoCodeSlashOutline,
    api: IoServerOutline,
    static: IoGlobeOutline,
    programming: IoCodeSlashOutline,
    web: IoGlobeOutline,
    'data-science': IoFlaskOutline,
    systems: IoServerOutline,
    security: IoShieldCheckmarkOutline,
    custom: IoDocumentTextOutline,
};

type SidebarView = 'labs' | 'hackathons' | 'capsules' | 'create';

export default function TemplatesManager() {
    const [activeView, setActiveView] = useState<SidebarView>('hackathons');
    const [search, setSearch] = useState('');
    const [capsules, setCapsules] = useState<CapsuleManifest[]>([]);
    const [launching, setLaunching] = useState<string | null>(null);

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

    const filteredLabs = useMemo(() =>
        LAB_TEMPLATES.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.tags.some(tag => tag.includes(search.toLowerCase()))
        ), [search]);

    const filteredHackathons = useMemo(() =>
        hackathonTemplates.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.stack.some(s => s.toLowerCase().includes(search.toLowerCase()))
        ), [search]);

    const launchLab = useCallback(async (t: LabTemplate) => {
        setLaunching(t.id);
        try {
            const filesMap: Record<string, string> = {};
            t.files?.forEach(f => { filesMap[f.path] = f.content; });
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

    const launchHackathon = useCallback(async (templateId: string) => {
        const t = hackathonTemplates.find(h => h.id === templateId);
        if (!t) return;
        setLaunching(t.id);
        try {
            const project = await createProjectFromRawFiles(
                t.name, t.files, t.description, t.stack
            );
            addwindow({
                id: `workspace-${project.id}`,
                appname: 'Workspace',
                component: 'apps/HackathonWorkspace',
                props: { projectId: project.id },
                maximizeable: true,
            });
            addToast?.(`Project created: ${t.name}`, 'success');
        } catch (err: any) {
            addToast?.('Launch failed: ' + err.message, 'error');
        }
        setLaunching(null);
    }, [createProjectFromRawFiles, addwindow, addToast]);

    const handleCreate = useCallback(async () => {
        if (!newName.trim()) return;
        const filesMap: Record<string, string> = {};
        if (newInstructions) filesMap['README.md'] = newInstructions;
        filesMap['main.py'] = '';
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
                addToast?.('Capsule imported', 'success');
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

    const sidebarItems: { id: SidebarView; label: string; icon: React.ElementType; count?: number }[] = [
        { id: 'hackathons', label: 'Projects', icon: IoRocketOutline, count: hackathonTemplates.length },
        { id: 'labs', label: 'Labs', icon: IoSchoolOutline, count: LAB_TEMPLATES.length },
        { id: 'capsules', label: 'Capsules', icon: IoShieldCheckmarkOutline, count: capsules.length },
        { id: 'create', label: 'Create New', icon: IoAddOutline },
    ];

    return (
        <div className="flex h-full bg-[--bg-base] text-[--text-color]">
            <div className="w-52 border-r border-[--border-color] bg-surface flex flex-col anime-gradient-top">
                <div className="p-3 border-b border-[--border-color]">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 flex items-center justify-center icon-bg-peach">
                            <IoRocketOutline className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-[13px]">Templates</span>
                    </div>
                    <div className="relative">
                        <IoSearchOutline className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--text-muted]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-overlay border border-[--border-color] pl-7 pr-2 py-1 text-xs outline-none focus:border-accent transition-colors placeholder-[--text-muted] text-[--text-color]"
                        />
                    </div>
                </div>
                <div className="flex-1 py-2">
                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Categories</div>
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors ${
                                activeView === item.id
                                    ? 'bg-accent text-[--bg-base]'
                                    : 'text-[--text-color] hover:bg-overlay'
                            }`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.count !== undefined && (
                                <span className={`text-[10px] px-1 min-w-[16px] text-center ${
                                    activeView === item.id ? 'opacity-70' : 'text-[--text-muted]'
                                }`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {activeView === 'hackathons' && (
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold mb-1">Project Templates</h2>
                            <p className="text-xs text-[--text-muted]">Project scaffolds with tech stacks and boilerplate. Launch to start building.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredHackathons.map(t => {
                                const CatIcon = CATEGORY_ICONS[t.category] || IoDocumentTextOutline;
                                return (
                                    <div key={t.id} className="anime-card border border-[--border-color] p-4 bg-surface hover:border-accent transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 flex items-center justify-center bg-accent/10">
                                                    <CatIcon className="w-4 h-4 text-accent" />
                                                </div>
                                                <h3 className="font-medium text-[13px]">{t.name}</h3>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[--text-muted] mb-3 leading-relaxed">{t.description}</p>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {t.stack.map(s => (
                                                <span key={s} className="text-[10px] bg-overlay text-[--text-muted] px-1.5 py-0.5">{s}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => launchHackathon(t.id)}
                                                disabled={launching === t.id}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-[--bg-base] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                                            >
                                                <IoPlayOutline className="w-3 h-3" /> {launching === t.id ? 'Launching...' : 'Launch'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeView === 'labs' && (
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold mb-1">Lab Templates</h2>
                            <p className="text-xs text-[--text-muted]">Structured assignments with rubrics, auto-grading, and time limits.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredLabs.map(t => (
                                <div key={t.id} className="anime-card border border-[--border-color] p-4 bg-surface hover:border-accent transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-[13px]">{t.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 font-medium ${DIFFICULTY_COLORS[t.difficulty]}`}>
                                            {t.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[--text-muted] mb-3">{t.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-[--text-muted] mb-3">
                                        <span className="flex items-center gap-1"><IoTimeOutline className="w-3 h-3" /> {t.estimatedMinutes}min</span>
                                        <span className="uppercase font-mono text-[10px] bg-overlay px-1.5 py-0.5">{t.language}</span>
                                        {t.rubric && (
                                            <span className="text-[10px] text-pastel-green">{t.rubric.reduce((s, r) => s + r.points, 0)} pts</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {t.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-overlay text-[--text-muted] px-1.5 py-0.5">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => launchLab(t)}
                                            disabled={launching === t.id}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-pastel-green text-[--bg-base] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                                        >
                                            <IoPlayOutline className="w-3 h-3" /> {launching === t.id ? 'Launching...' : 'Launch'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveView('create');
                                                setNewName(t.name + ' (Custom)');
                                                setNewDesc(t.description);
                                                setNewCategory(t.category);
                                                setNewDifficulty(t.difficulty);
                                                setNewMinutes(t.estimatedMinutes);
                                                setNewInstructions(t.instructions);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 border border-[--border-color] text-xs hover:bg-overlay transition-colors"
                                        >
                                            <IoCreateOutline className="w-3 h-3" /> Customize
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeView === 'capsules' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold mb-1">Environment Capsules</h2>
                                <p className="text-xs text-[--text-muted]">Portable environment snapshots. Import or export lab configurations.</p>
                            </div>
                            <button
                                onClick={handleImport}
                                className="flex items-center gap-1 px-3 py-1.5 bg-accent text-[--bg-base] text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                                <IoCloudUploadOutline className="w-3 h-3" /> Import
                            </button>
                        </div>
                        {capsules.length === 0 ? (
                            <div className="text-center py-16 text-[--text-muted]">
                                <IoShieldCheckmarkOutline className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-[13px] font-medium mb-1">No capsules yet</p>
                                <p className="text-xs opacity-60">Create one from a template or import from file</p>
                            </div>
                        ) : (
                            <div className="bg-overlay border border-[--border-color]">
                                {capsules.map((c, i) => (
                                    <div
                                        key={c.id}
                                        className={`flex items-center justify-between p-3 hover:bg-surface transition-colors ${
                                            i < capsules.length - 1 ? 'border-b border-[--border-color]' : ''
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-[13px]">{c.name}</h3>
                                            <p className="text-xs text-[--text-muted] truncate">{c.description} — {c.files.length} files</p>
                                            <p className="text-[10px] text-[--text-muted] font-mono mt-0.5">DNA: {c.environmentDNA.slice(0, 16)}...</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0 ml-2">
                                            <button
                                                onClick={() => handleExport(c.id)}
                                                className="p-1.5 hover:bg-overlay text-[--text-muted] hover:text-[--text-color] transition-colors"
                                            >
                                                <IoCloudDownloadOutline className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="p-1.5 hover:bg-overlay text-pastel-red transition-colors"
                                            >
                                                <IoTrashOutline className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeView === 'create' && (
                    <div className="max-w-lg">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold mb-1">Create Lab Template</h2>
                            <p className="text-xs text-[--text-muted]">Design a new lab environment from scratch.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] mb-2">Details</div>
                                <div className="bg-overlay border border-[--border-color]">
                                    <div className="p-3 border-b border-[--border-color]">
                                        <label className="text-xs font-medium block mb-1">Lab Name</label>
                                        <input
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-3 py-1.5 text-[13px] focus:border-accent outline-none transition-colors placeholder-[--text-muted] text-[--text-color]"
                                            placeholder="e.g., Sorting Algorithms"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <label className="text-xs font-medium block mb-1">Description</label>
                                        <textarea
                                            value={newDesc}
                                            onChange={e => setNewDesc(e.target.value)}
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-3 py-1.5 text-[13px] h-20 resize-none focus:border-accent outline-none transition-colors placeholder-[--text-muted] text-[--text-color]"
                                            placeholder="What will students learn?"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] mb-2">Configuration</div>
                                <div className="bg-overlay border border-[--border-color]">
                                    <div className="grid grid-cols-2 border-b border-[--border-color]">
                                        <div className="p-3 border-r border-[--border-color]">
                                            <label className="text-xs font-medium block mb-1">Category</label>
                                            <select
                                                value={newCategory}
                                                onChange={e => setNewCategory(e.target.value)}
                                                className="w-full bg-[--bg-base] border border-[--border-color] px-2 py-1.5 text-[13px] outline-none text-[--text-color]"
                                            >
                                                <option value="programming">Programming</option>
                                                <option value="web">Web</option>
                                                <option value="data-science">Data Science</option>
                                                <option value="systems">Systems</option>
                                                <option value="security">Security</option>
                                            </select>
                                        </div>
                                        <div className="p-3">
                                            <label className="text-xs font-medium block mb-1">Difficulty</label>
                                            <select
                                                value={newDifficulty}
                                                onChange={e => setNewDifficulty(e.target.value)}
                                                className="w-full bg-[--bg-base] border border-[--border-color] px-2 py-1.5 text-[13px] outline-none text-[--text-color]"
                                            >
                                                <option value="beginner">Beginner</option>
                                                <option value="intermediate">Intermediate</option>
                                                <option value="advanced">Advanced</option>
                                                <option value="expert">Expert</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <label className="text-xs font-medium block mb-1">Time Limit (minutes, 0 = unlimited)</label>
                                        <input
                                            type="number"
                                            value={newMinutes}
                                            onChange={e => setNewMinutes(+e.target.value)}
                                            className="w-full bg-[--bg-base] border border-[--border-color] px-3 py-1.5 text-[13px] focus:border-accent outline-none transition-colors text-[--text-color]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] mb-2">Instructions</div>
                                <div className="bg-overlay border border-[--border-color] p-3">
                                    <textarea
                                        value={newInstructions}
                                        onChange={e => setNewInstructions(e.target.value)}
                                        className="w-full bg-[--bg-base] border border-[--border-color] px-3 py-1.5 text-[13px] h-32 resize-none font-mono focus:border-accent outline-none transition-colors placeholder-[--text-muted] text-[--text-color]"
                                        placeholder="# Lab Title&#10;&#10;Instructions in markdown..."
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!newName.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-accent text-[--bg-base] text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                <IoCheckmarkCircleOutline className="w-4 h-4" /> Create & Launch
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
