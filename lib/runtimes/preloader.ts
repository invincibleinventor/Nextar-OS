/**
 * Predictive Runtime Preloader
 *
 * Analyzes project file extensions and preloads the appropriate WASM runtime
 * in the background so that first "Run" feels instant.
 *
 * Strategy:
 * - .py files → start Pyodide download
 * - package.json / .js / .ts files → start WebContainer boot
 * - .c/.cpp/.java/.go/.rs → ensure CheerpX is ready (no preload needed for Piston)
 * - .html → no runtime needed (preview only)
 */

type PreloadTarget = 'pyodide' | 'webcontainer' | 'none';

// Track what's already been triggered
const preloadState = new Map<PreloadTarget, 'idle' | 'loading' | 'ready' | 'error'>();

// File extension → runtime mapping
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
    // C/C++/Go/Rust/Java use Piston API (no preload) or CheerpX
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

/**
 * Analyze a list of file paths/names and determine which runtime to preload
 */
export function analyzeProjectFiles(filePaths: string[]): PreloadTarget {
    const counts: Record<PreloadTarget, number> = { pyodide: 0, webcontainer: 0, none: 0 };

    // Check for package.json — strong signal for webcontainer
    if (filePaths.some(f => f.endsWith('package.json'))) {
        return 'webcontainer';
    }

    // Check for requirements.txt or setup.py — strong signal for pyodide
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

/**
 * Preload a runtime in the background. Safe to call multiple times —
 * will only trigger the load once per runtime.
 */
export async function preloadRuntime(target: PreloadTarget): Promise<void> {
    if (target === 'none') return;

    const state = preloadState.get(target);
    if (state === 'loading' || state === 'ready') return;

    preloadState.set(target, 'loading');

    try {
        switch (target) {
            case 'pyodide': {
                // Lazy import to avoid bundling
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
        console.log(`[HackathOS] Preloaded runtime: ${target}`);
    } catch (err) {
        preloadState.set(target, 'error');
        console.warn(`[HackathOS] Failed to preload runtime: ${target}`, err);
    }
}

/**
 * Convenience: analyze files and preload in one call.
 * Call this when a project is opened.
 */
export function preloadForProject(filePaths: string[]): void {
    const target = analyzeProjectFiles(filePaths);
    if (target !== 'none') {
        // Use requestIdleCallback to avoid blocking the main thread
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => preloadRuntime(target));
        } else {
            setTimeout(() => preloadRuntime(target), 1000);
        }
    }
}

/**
 * Get the current preload state for a runtime
 */
export function getPreloadState(target: PreloadTarget): string {
    return preloadState.get(target) || 'idle';
}
