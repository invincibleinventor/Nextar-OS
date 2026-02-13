/**
 * Skill Heat Map Analytics — Track and classify student skills based on
 * commands run, errors encountered, and time-per-task patterns.
 */

export type SkillCategory =
    | 'variables' | 'loops' | 'conditionals' | 'functions' | 'recursion'
    | 'arrays' | 'strings' | 'objects' | 'classes' | 'async-await'
    | 'error-handling' | 'dom' | 'api-calls' | 'file-io' | 'algorithms'
    | 'data-structures' | 'testing' | 'git' | 'terminal' | 'debugging';

export type SkillLevel = 'unknown' | 'weak' | 'developing' | 'proficient' | 'strong';

export interface SkillEntry {
    category: SkillCategory;
    attempts: number;
    successes: number;
    failures: number;
    totalTimeMs: number;
    level: SkillLevel;
}

export interface SkillProfile {
    studentId: string;
    updatedAt: number;
    skills: Map<SkillCategory, SkillEntry>;
    /** Strong skills sorted by confidence */
    strengths: SkillCategory[];
    /** Weak skills sorted by confidence */
    weaknesses: SkillCategory[];
}

/** Classify a terminal command into skill categories */
function classifyCommand(command: string): SkillCategory[] {
    const cmd = command.trim().toLowerCase();
    const cats: SkillCategory[] = [];

    if (/^git\s/.test(cmd)) cats.push('git');
    if (/^(ls|cd|mkdir|rm|cp|mv|cat|grep|find|chmod|chown)/.test(cmd)) cats.push('terminal');
    if (/python|pip/.test(cmd)) cats.push('functions');
    if (/node|npm|yarn/.test(cmd)) cats.push('functions');
    if (/gcc|g\+\+|make|cmake/.test(cmd)) cats.push('functions');
    if (/curl|wget|fetch/.test(cmd)) cats.push('api-calls');
    if (/test|jest|pytest|mocha/.test(cmd)) cats.push('testing');

    return cats.length ? cats : ['terminal'];
}

/** Classify a compilation/runtime error into skill categories */
function classifyError(error: string): SkillCategory[] {
    const e = error.toLowerCase();
    const cats: SkillCategory[] = [];

    if (/undefined.*variable|not defined|undeclared/.test(e)) cats.push('variables');
    if (/for.*loop|while.*loop|infinite loop|iteration/.test(e)) cats.push('loops');
    if (/syntax.*if|unexpected.*else|ternary/.test(e)) cats.push('conditionals');
    if (/not a function|missing.*argument|parameter/.test(e)) cats.push('functions');
    if (/maximum call stack|recursion/.test(e)) cats.push('recursion');
    if (/index.*out.*bound|array|length/.test(e)) cats.push('arrays');
    if (/string|substr|slice|concat/.test(e)) cats.push('strings');
    if (/property.*undefined|cannot read|null.*reference/.test(e)) cats.push('objects');
    if (/class|constructor|prototype|extends/.test(e)) cats.push('classes');
    if (/await|async|promise|then.*catch/.test(e)) cats.push('async-await');
    if (/try.*catch|throw|exception|error.*handling/.test(e)) cats.push('error-handling');
    if (/document\.|getelementby|queryselector|dom/.test(e)) cats.push('dom');
    if (/fetch|xmlhttprequest|cors|api/.test(e)) cats.push('api-calls');
    if (/file|read|write|stream|fs\./.test(e)) cats.push('file-io');

    return cats.length ? cats : ['debugging'];
}

function computeLevel(entry: SkillEntry): SkillLevel {
    if (entry.attempts === 0) return 'unknown';
    const ratio = entry.successes / entry.attempts;
    if (entry.attempts < 3) return ratio > 0.5 ? 'developing' : 'weak';
    if (ratio >= 0.8) return 'strong';
    if (ratio >= 0.6) return 'proficient';
    if (ratio >= 0.35) return 'developing';
    return 'weak';
}

export class SkillAnalyzer {
    private profile: SkillProfile;

    constructor(studentId: string) {
        this.profile = {
            studentId,
            updatedAt: Date.now(),
            skills: new Map(),
            strengths: [],
            weaknesses: [],
        };
    }

    /** Record a successful command execution */
    recordSuccess(command: string, durationMs: number) {
        const categories = classifyCommand(command);
        for (const cat of categories) {
            const entry = this.getOrCreate(cat);
            entry.attempts++;
            entry.successes++;
            entry.totalTimeMs += durationMs;
            entry.level = computeLevel(entry);
        }
        this.recompute();
    }

    /** Record a failed command/compilation */
    recordFailure(command: string, error: string, durationMs: number) {
        const cmdCats = classifyCommand(command);
        const errCats = classifyError(error);
        const allCats = [...new Set([...cmdCats, ...errCats])];
        for (const cat of allCats) {
            const entry = this.getOrCreate(cat);
            entry.attempts++;
            entry.failures++;
            entry.totalTimeMs += durationMs;
            entry.level = computeLevel(entry);
        }
        this.recompute();
    }

    /** Get the full skill profile */
    getProfile(): SkillProfile {
        return { ...this.profile, skills: new Map(this.profile.skills) };
    }

    /** Get skill entries as an array sorted by category */
    getSkillArray(): SkillEntry[] {
        return Array.from(this.profile.skills.values()).sort((a, b) => a.category.localeCompare(b.category));
    }

    /** Serialize for storage */
    serialize(): string {
        return JSON.stringify({
            ...this.profile,
            skills: Array.from(this.profile.skills.entries()),
        });
    }

    /** Restore from serialized data */
    static deserialize(data: string): SkillAnalyzer {
        const parsed = JSON.parse(data);
        const analyzer = new SkillAnalyzer(parsed.studentId);
        analyzer.profile = {
            ...parsed,
            skills: new Map(parsed.skills),
        };
        return analyzer;
    }

    private getOrCreate(cat: SkillCategory): SkillEntry {
        if (!this.profile.skills.has(cat)) {
            this.profile.skills.set(cat, {
                category: cat, attempts: 0, successes: 0, failures: 0, totalTimeMs: 0, level: 'unknown',
            });
        }
        return this.profile.skills.get(cat)!;
    }

    private recompute() {
        this.profile.updatedAt = Date.now();
        const entries = Array.from(this.profile.skills.values()).filter(e => e.attempts >= 2);
        entries.sort((a, b) => (b.successes / b.attempts) - (a.successes / a.attempts));
        this.profile.strengths = entries.filter(e => e.level === 'strong' || e.level === 'proficient').map(e => e.category);
        this.profile.weaknesses = entries.filter(e => e.level === 'weak' || e.level === 'developing').map(e => e.category);
    }
}
