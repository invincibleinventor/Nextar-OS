import type { HintConfig, HintLevel } from '../types/lab';

export interface HintState {
    questionId: string;
    unlockedLevel: number;  // highest unlocked hint level (0 = none)
    totalCost: number;      // total points deducted
}

export class HintSystem {
    private configs: HintConfig[];
    private state = new Map<string, HintState>();
    private onChange?: (states: HintState[]) => void;

    constructor(configs: HintConfig[], onChange?: (states: HintState[]) => void) {
        this.configs = configs;
        this.onChange = onChange;
        for (const cfg of configs) {
            this.state.set(cfg.questionId, { questionId: cfg.questionId, unlockedLevel: 0, totalCost: 0 });
        }
    }

    getUnlockedHints(questionId: string): HintLevel[] {
        const cfg = this.configs.find(c => c.questionId === questionId);
        const st = this.state.get(questionId);
        if (!cfg || !st) return [];
        return cfg.hints.filter(h => h.level <= st.unlockedLevel).sort((a, b) => a.level - b.level);
    }

    getNextHint(questionId: string): HintLevel | null {
        const cfg = this.configs.find(c => c.questionId === questionId);
        const st = this.state.get(questionId);
        if (!cfg || !st) return null;
        const next = cfg.hints.find(h => h.level === st.unlockedLevel + 1);
        return next || null;
    }

    unlockNextHint(questionId: string): { hint: HintLevel; cost: number } | null {
        const next = this.getNextHint(questionId);
        const st = this.state.get(questionId);
        if (!next || !st) return null;

        st.unlockedLevel = next.level;
        st.totalCost += next.pointCost;
        this.emit();

        return { hint: next, cost: next.pointCost };
    }

    getTotalDeductions(): number {
        let total = 0;
        for (const st of this.state.values()) total += st.totalCost;
        return total;
    }

    getAllStates(): HintState[] {
        return Array.from(this.state.values());
    }

    getState(questionId: string): HintState | undefined {
        return this.state.get(questionId);
    }

    isFullyRevealed(questionId: string): boolean {
        const cfg = this.configs.find(c => c.questionId === questionId);
        const st = this.state.get(questionId);
        if (!cfg || !st) return false;
        return st.unlockedLevel >= Math.max(...cfg.hints.map(h => h.level));
    }

    serialize(): string {
        return JSON.stringify(Array.from(this.state.entries()));
    }

    restore(data: string) {
        try {
            const entries: [string, HintState][] = JSON.parse(data);
            for (const [k, v] of entries) {
                if (this.state.has(k)) this.state.set(k, v);
            }
            this.emit();
        } catch { }
    }

    private emit() {
        this.onChange?.(this.getAllStates());
    }
}
