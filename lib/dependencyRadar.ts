/**
 * Dependency Radar — Analyze packages before installation.
 * Checks bundle size, security, maintenance status via public APIs.
 */

export interface PackageReport {
    name: string;
    version: string;
    bundleSize: number | null;      // bytes (minified+gzipped)
    bundleSizeRaw: number | null;   // bytes (minified)
    score: number | null;           // 0-1 overall quality score
    maintenance: number | null;     // 0-1
    popularity: number | null;      // 0-1
    quality: number | null;         // 0-1
    deprecated: boolean;
    lastPublish: string | null;
    license: string | null;
    vulnerabilities: number;
    alternatives: string[];
    error?: string;
}

const cache = new Map<string, PackageReport>();

async function fetchBundleSize(name: string): Promise<{ size: number; gzip: number } | null> {
    try {
        const res = await fetch(`https://bundlephobia.com/api/size?package=${encodeURIComponent(name)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return { size: data.size, gzip: data.gzip };
    } catch { return null; }
}

async function fetchNpmsScore(name: string): Promise<{
    score: number; maintenance: number; popularity: number; quality: number;
    deprecated: boolean; lastPublish: string | null; license: string | null;
} | null> {
    try {
        const res = await fetch(`https://api.npms.io/v2/package/${encodeURIComponent(name)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const s = data.score?.detail || {};
        const collected = data.collected?.metadata || {};
        return {
            score: data.score?.final || 0,
            maintenance: s.maintenance || 0,
            popularity: s.popularity || 0,
            quality: s.quality || 0,
            deprecated: !!collected.deprecated,
            lastPublish: collected.date || null,
            license: collected.license || null,
        };
    } catch { return null; }
}

async function fetchAlternatives(name: string): Promise<string[]> {
    try {
        const res = await fetch(`https://api.npms.io/v2/search?q=${encodeURIComponent(name)}&size=5`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || [])
            .map((r: any) => r.package?.name)
            .filter((n: string) => n && n !== name)
            .slice(0, 3);
    } catch { return []; }
}

export async function analyzePackage(name: string): Promise<PackageReport> {
    if (cache.has(name)) return cache.get(name)!;
    const [bundle, npms, alts] = await Promise.all([
        fetchBundleSize(name), fetchNpmsScore(name), fetchAlternatives(name),
    ]);
    const report: PackageReport = {
        name,
        version: 'latest',
        bundleSize: bundle?.gzip ?? null,
        bundleSizeRaw: bundle?.size ?? null,
        score: npms?.score ?? null,
        maintenance: npms?.maintenance ?? null,
        popularity: npms?.popularity ?? null,
        quality: npms?.quality ?? null,
        deprecated: npms?.deprecated ?? false,
        lastPublish: npms?.lastPublish ?? null,
        license: npms?.license ?? null,
        vulnerabilities: 0,
        alternatives: alts,
    };
    cache.set(name, report);
    return report;
}

export async function analyzePackages(names: string[]): Promise<PackageReport[]> {
    return Promise.all(names.map(analyzePackage));
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function getHealthRating(report: PackageReport): 'good' | 'warn' | 'bad' {
    if (report.deprecated) return 'bad';
    if (report.score !== null && report.score < 0.3) return 'bad';
    if (report.score !== null && report.score < 0.6) return 'warn';
    if (report.bundleSize !== null && report.bundleSize > 100 * 1024) return 'warn';
    return 'good';
}

/** Parse an install command to extract package names */
export function parseInstallCommand(cmd: string): string[] {
    const npm = cmd.match(/npm\s+(?:install|i|add)\s+(.+)/);
    const yarn = cmd.match(/yarn\s+add\s+(.+)/);
    const pnpm = cmd.match(/pnpm\s+(?:add|install)\s+(.+)/);
    const raw = npm?.[1] || yarn?.[1] || pnpm?.[1];
    if (!raw) return [];
    return raw.split(/\s+/)
        .filter(s => !s.startsWith('-'))
        .map(s => s.replace(/@[\^~]?[\d.]+$/, ''));
}
