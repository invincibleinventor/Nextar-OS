/**
 * Sprint Timer — Pomodoro-style timer with environment checkpoint integration.
 * Fires callbacks on sprint start/end/pause so the app can auto-snapshot.
 */

export type SprintPhase = 'work' | 'break' | 'idle';

export interface SprintConfig {
    workMinutes: number;   // default 25
    breakMinutes: number;  // default 5
    longBreakMinutes: number; // default 15
    longBreakInterval: number; // every N sprints
}

export interface SprintState {
    phase: SprintPhase;
    remaining: number; // seconds
    sprint: number;    // current sprint number (1-based)
    totalElapsed: number; // total work seconds this session
}

type Listener = (state: SprintState) => void;

const DEFAULT_CONFIG: SprintConfig = {
    workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4,
};

export class SprintTimer {
    private config: SprintConfig;
    private state: SprintState;
    private interval: ReturnType<typeof setInterval> | null = null;
    private listeners = new Set<Listener>();
    private onSprintEnd?: (sprint: number) => void;
    private onSprintStart?: (sprint: number) => void;

    constructor(config?: Partial<SprintConfig>, callbacks?: { onSprintEnd?: (n: number) => void; onSprintStart?: (n: number) => void }) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = { phase: 'idle', remaining: this.config.workMinutes * 60, sprint: 1, totalElapsed: 0 };
        this.onSprintEnd = callbacks?.onSprintEnd;
        this.onSprintStart = callbacks?.onSprintStart;
    }

    subscribe(fn: Listener) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }

    private emit() { const s = { ...this.state }; this.listeners.forEach(fn => fn(s)); }

    getState(): SprintState { return { ...this.state }; }

    start() {
        if (this.interval) return;
        if (this.state.phase === 'idle') {
            this.state.phase = 'work';
            this.state.remaining = this.config.workMinutes * 60;
            this.onSprintStart?.(this.state.sprint);
        }
        this.interval = setInterval(() => this.tick(), 1000);
        this.emit();
    }

    pause() {
        if (this.interval) { clearInterval(this.interval); this.interval = null; }
        this.emit();
    }

    reset() {
        this.pause();
        this.state = { phase: 'idle', remaining: this.config.workMinutes * 60, sprint: 1, totalElapsed: 0 };
        this.emit();
    }

    skip() {
        this.pause();
        this.transition();
        this.start();
    }

    private tick() {
        if (this.state.remaining > 0) {
            this.state.remaining--;
            if (this.state.phase === 'work') this.state.totalElapsed++;
        } else {
            this.transition();
        }
        this.emit();
    }

    private transition() {
        if (this.state.phase === 'work') {
            this.onSprintEnd?.(this.state.sprint);
            const isLong = this.state.sprint % this.config.longBreakInterval === 0;
            this.state.phase = 'break';
            this.state.remaining = (isLong ? this.config.longBreakMinutes : this.config.breakMinutes) * 60;
        } else {
            this.state.sprint++;
            this.state.phase = 'work';
            this.state.remaining = this.config.workMinutes * 60;
            this.onSprintStart?.(this.state.sprint);
        }
    }

    destroy() { this.pause(); this.listeners.clear(); }
}

let singleton: SprintTimer | null = null;
export function getSprintTimer(config?: Partial<SprintConfig>, callbacks?: { onSprintEnd?: (n: number) => void; onSprintStart?: (n: number) => void }): SprintTimer {
    if (!singleton) singleton = new SprintTimer(config, callbacks);
    return singleton;
}
