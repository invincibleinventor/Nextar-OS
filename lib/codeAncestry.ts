/**
 * Code Ancestry Tracking — Track origin of every code region.
 * Classifies code as: typed (character-by-character), pasted, auto-completed, or AI-generated.
 */

export type CodeOrigin = 'typed' | 'pasted' | 'autocomplete' | 'ai-generated' | 'unknown';

export interface AncestryRegion {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    origin: CodeOrigin;
    timestamp: number;
    /** Typing speed for 'typed' regions (chars per second) */
    typingSpeed?: number;
}

export interface AncestryTracker {
    getRegions(filePath: string): AncestryRegion[];
    getHeatMap(filePath: string): Map<number, CodeOrigin>; // line -> dominant origin
    destroy(): void;
}

/**
 * Create an ancestry tracker that hooks into Monaco editor events.
 * Call this once per editor instance.
 */
export function createAncestryTracker(): AncestryTracker {
    const fileRegions = new Map<string, AncestryRegion[]>();
    let lastKeystrokeTime = 0;
    let isPasting = false;
    let keystrokeBuffer: number[] = []; // inter-key intervals

    /** Detect if a change event looks like a paste (large text, single event) */
    function classifyChange(text: string, _timeSinceLastKeystroke: number): CodeOrigin {
        if (isPasting) return 'pasted';

        // Multi-line insert or large single-line insert = likely paste
        const lines = text.split('\n');
        if (lines.length > 3) return 'pasted';
        if (text.length > 50) return 'pasted';

        // Very fast input (< 10ms between "keystrokes") for multiple chars = autocomplete
        if (text.length > 1 && text.length <= 50) return 'autocomplete';

        return 'typed';
    }

    /** Record a content change from Monaco's onDidChangeModelContent */
    function recordChange(filePath: string, change: {
        range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
        text: string;
    }) {
        const now = performance.now();
        const timeSinceLast = now - lastKeystrokeTime;
        lastKeystrokeTime = now;

        if (timeSinceLast < 200 && timeSinceLast > 0) {
            keystrokeBuffer.push(timeSinceLast);
            if (keystrokeBuffer.length > 20) keystrokeBuffer.shift();
        }

        if (!change.text) return; // deletion

        const origin = classifyChange(change.text, timeSinceLast);
        const lines = change.text.split('\n');
        const endLine = change.range.startLineNumber + lines.length - 1;
        const endColumn = lines.length === 1
            ? change.range.startColumn + change.text.length
            : lines[lines.length - 1].length + 1;

        const region: AncestryRegion = {
            startLine: change.range.startLineNumber,
            startColumn: change.range.startColumn,
            endLine,
            endColumn,
            origin,
            timestamp: Date.now(),
            typingSpeed: origin === 'typed' && keystrokeBuffer.length > 2
                ? 1000 / (keystrokeBuffer.reduce((a, b) => a + b, 0) / keystrokeBuffer.length)
                : undefined,
        };

        if (!fileRegions.has(filePath)) fileRegions.set(filePath, []);
        fileRegions.get(filePath)!.push(region);

        // Limit stored regions per file
        const regions = fileRegions.get(filePath)!;
        if (regions.length > 5000) fileRegions.set(filePath, regions.slice(-3000));
    }

    /** Mark that a paste event is happening (call from clipboard listener) */
    function markPaste() { isPasting = true; setTimeout(() => { isPasting = false; }, 100); }

    /** Mark a region as AI-generated (call when AI inserts code) */
    function markAIGenerated(filePath: string, startLine: number, endLine: number) {
        if (!fileRegions.has(filePath)) fileRegions.set(filePath, []);
        fileRegions.get(filePath)!.push({
            startLine, startColumn: 1, endLine, endColumn: 999,
            origin: 'ai-generated', timestamp: Date.now(),
        });
    }

    function getRegions(filePath: string): AncestryRegion[] {
        return fileRegions.get(filePath) || [];
    }

    /** Get per-line heat map (most recent origin for each line) */
    function getHeatMap(filePath: string): Map<number, CodeOrigin> {
        const regions = getRegions(filePath);
        const map = new Map<number, CodeOrigin>();
        for (const r of regions) {
            for (let line = r.startLine; line <= r.endLine; line++) {
                map.set(line, r.origin);
            }
        }
        return map;
    }

    // Expose recordChange and markPaste as module-level helpers
    (createAncestryTracker as any)._recordChange = recordChange;
    (createAncestryTracker as any)._markPaste = markPaste;
    (createAncestryTracker as any)._markAIGenerated = markAIGenerated;

    return {
        getRegions,
        getHeatMap,
        destroy() { fileRegions.clear(); keystrokeBuffer = []; },
    };
}

/** Singleton tracker instance */
let tracker: AncestryTracker | null = null;
export function getAncestryTracker(): AncestryTracker {
    if (!tracker) tracker = createAncestryTracker();
    return tracker;
}

export function recordChange(filePath: string, change: any) {
    (createAncestryTracker as any)._recordChange?.(filePath, change);
}

export function markPaste() {
    (createAncestryTracker as any)._markPaste?.();
}

export function markAIGenerated(filePath: string, startLine: number, endLine: number) {
    (createAncestryTracker as any)._markAIGenerated?.(filePath, startLine, endLine);
}
