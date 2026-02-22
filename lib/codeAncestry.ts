export type CodeOrigin = 'typed' | 'pasted' | 'autocomplete' | 'ai-generated' | 'unknown';

export interface AncestryRegion {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    origin: CodeOrigin;
    timestamp: number;
    typingSpeed?: number;
}

export interface AncestryTracker {
    getRegions(filePath: string): AncestryRegion[];
    getHeatMap(filePath: string): Map<number, CodeOrigin>;
    destroy(): void;
}

export function createAncestryTracker(): AncestryTracker {
    const fileRegions = new Map<string, AncestryRegion[]>();
    let lastKeystrokeTime = 0;
    let isPasting = false;
    let keystrokeBuffer: number[] = [];

    function classifyChange(text: string, _timeSinceLastKeystroke: number): CodeOrigin {
        if (isPasting) return 'pasted';

        const lines = text.split('\n');
        if (lines.length > 3) return 'pasted';
        if (text.length > 50) return 'pasted';

        if (text.length > 1 && text.length <= 50) return 'autocomplete';

        return 'typed';
    }

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

        if (!change.text) return;

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

        const regions = fileRegions.get(filePath)!;
        if (regions.length > 5000) fileRegions.set(filePath, regions.slice(-3000));
    }

    function markPaste() { isPasting = true; setTimeout(() => { isPasting = false; }, 100); }

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

    (createAncestryTracker as any)._recordChange = recordChange;
    (createAncestryTracker as any)._markPaste = markPaste;
    (createAncestryTracker as any)._markAIGenerated = markAIGenerated;

    return {
        getRegions,
        getHeatMap,
        destroy() { fileRegions.clear(); keystrokeBuffer = []; },
    };
}

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
