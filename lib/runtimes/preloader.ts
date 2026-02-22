type PreloadTarget = 'pyodide' | 'webcontainer' | 'none';

const preloadState = new Map<PreloadTarget, 'idle' | 'loading' | 'ready' | 'error'>();

const EXTENSION_RUNTIME_MAP: Record<string, PreloadTarget> = {
    '.py': 'pyodide',
    '.pyw': 'pyodide',
    '.ipynb': 'pyodide',
    '.js': 'webcontainer',
    '.jsx': 'webcontainer',
    '.ts': 'webcontainer',
    '.tsx': 'webcontainer',
    '.mjs': 'webcontainer',
    '.cjs': 'webcontainer',
    '.vue': 'webcontainer',
    '.svelte': 'webcontainer',
    '.c': 'none',
    '.cpp': 'none',
    '.h': 'none',
    '.java': 'none',
    '.go': 'none',
    '.rs': 'none',
    '.rb': 'none',
    '.php': 'none',
    '.html': 'none',
    '.css': 'none',
    '.md': 'none',
};

export function analyzeProjectFiles(filePaths: string[]): PreloadTarget {
    const counts: Record<PreloadTarget, number> = { pyodide: 0, webcontainer: 0, none: 0 };

    if (filePaths.some(f => f.endsWith('package.json'))) {
        return 'webcontainer';
    }

    if (filePaths.some(f => f.endsWith('requirements.txt') || f.endsWith('setup.py') || f.endsWith('pyproject.toml'))) {
        return 'pyodide';
    }

    for (const filePath of filePaths) {
        const ext = '.' + filePath.split('.').pop()?.toLowerCase();
        const target = EXTENSION_RUNTIME_MAP[ext];
        if (target) counts[target]++;
    }

    if (counts.webcontainer > counts.pyodide) return 'webcontainer';
    if (counts.pyodide > 0) return 'pyodide';
    return 'none';
}

export async function preloadRuntime(target: PreloadTarget): Promise<void> {
    if (target === 'none') return;

    const state = preloadState.get(target);
    if (state === 'loading' || state === 'ready') return;

    preloadState.set(target, 'loading');

    try {
        switch (target) {
            case 'pyodide': {
                const mod = await import('./pyodide');
                await mod.bootPyodide();
                break;
            }
            case 'webcontainer': {
                const mod = await import('./webcontainer');
                await mod.bootWebContainer();
                break;
            }
        }
        preloadState.set(target, 'ready');
        console.log(`[NextarOS] Preloaded runtime: ${target}`);
    } catch (err) {
        preloadState.set(target, 'error');
        console.warn(`[NextarOS] Failed to preload runtime: ${target}`, err);
    }
}

export function preloadForProject(filePaths: string[]): void {
    const target = analyzeProjectFiles(filePaths);
    if (target !== 'none') {
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => preloadRuntime(target));
        } else {
            setTimeout(() => preloadRuntime(target), 1000);
        }
    }
}

export function getPreloadState(target: PreloadTarget): string {
    return preloadState.get(target) || 'idle';
}
