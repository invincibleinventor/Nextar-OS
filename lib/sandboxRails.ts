/**
 * Guided Sandbox Rails — Invisible constraints that redirect students when violated.
 * Teachers define rails; students work freely within them.
 */

import type { LabRail } from '../types/lab';

export interface RailCheckResult {
    allowed: boolean;
    railId?: string;
    message?: string;
    severity?: 'warn' | 'block';
}

type RailChecker = (action: string, context: RailContext) => RailCheckResult;

interface RailContext {
    filePath?: string;
    command?: string;
    packageName?: string;
    output?: string;
}

const checkers: Record<string, RailChecker> = {
    'file-access': (_, ctx) => {
        // config.allowedPaths: string[] — glob-like patterns
        return { allowed: true }; // base — overridden per-rail below
    },
    'command-whitelist': (_, ctx) => {
        return { allowed: true };
    },
    'command-blacklist': (_, ctx) => {
        return { allowed: true };
    },
    'package-lock': (_, ctx) => {
        return { allowed: true };
    },
    'output-format': (_, ctx) => {
        return { allowed: true };
    },
    'time-limit': (_, _ctx) => {
        return { allowed: true };
    },
};

export class SandboxRailsEngine {
    private rails: LabRail[] = [];
    private violations: { railId: string; timestamp: string; action: string; message: string }[] = [];
    private onViolation?: (result: RailCheckResult, action: string) => void;

    constructor(rails: LabRail[], onViolation?: (result: RailCheckResult, action: string) => void) {
        this.rails = rails;
        this.onViolation = onViolation;
    }

    /** Check if a file access is allowed */
    checkFileAccess(filePath: string): RailCheckResult {
        for (const rail of this.rails) {
            if (rail.type === 'file-access') {
                const allowed = rail.config.allowedPaths as string[];
                const blocked = rail.config.blockedPaths as string[] | undefined;
                if (blocked?.some(p => filePath.startsWith(p) || matchGlob(filePath, p))) {
                    return this.violation(rail, `file:${filePath}`);
                }
                if (allowed?.length && !allowed.some(p => filePath.startsWith(p) || matchGlob(filePath, p))) {
                    return this.violation(rail, `file:${filePath}`);
                }
            }
        }
        return { allowed: true };
    }

    /** Check if a command is allowed */
    checkCommand(command: string): RailCheckResult {
        const cmd = command.trim().split(/\s+/)[0];
        for (const rail of this.rails) {
            if (rail.type === 'command-whitelist') {
                const allowed = rail.config.commands as string[];
                if (allowed?.length && !allowed.includes(cmd)) {
                    return this.violation(rail, `cmd:${command}`);
                }
            }
            if (rail.type === 'command-blacklist') {
                const blocked = rail.config.commands as string[];
                if (blocked?.includes(cmd)) {
                    return this.violation(rail, `cmd:${command}`);
                }
            }
        }
        return { allowed: true };
    }

    /** Check if a package installation is allowed */
    checkPackageInstall(packageName: string): RailCheckResult {
        for (const rail of this.rails) {
            if (rail.type === 'package-lock') {
                const allowed = rail.config.allowedPackages as string[];
                if (allowed?.length && !allowed.includes(packageName)) {
                    return this.violation(rail, `pkg:${packageName}`);
                }
            }
        }
        return { allowed: true };
    }

    /** Check if output matches expected format */
    checkOutput(output: string, questionId: string): RailCheckResult {
        for (const rail of this.rails) {
            if (rail.type === 'output-format' && rail.config.questionId === questionId) {
                const pattern = new RegExp(rail.config.pattern as string);
                if (!pattern.test(output)) {
                    return this.violation(rail, `output:${questionId}`);
                }
            }
        }
        return { allowed: true };
    }

    /** Check time limit */
    checkTimeLimit(elapsedMinutes: number): RailCheckResult {
        for (const rail of this.rails) {
            if (rail.type === 'time-limit') {
                const limit = rail.config.minutes as number;
                if (elapsedMinutes > limit) {
                    return this.violation(rail, `time:${elapsedMinutes}min`);
                }
            }
        }
        return { allowed: true };
    }

    getViolations() { return [...this.violations]; }

    private violation(rail: LabRail, action: string): RailCheckResult {
        const result: RailCheckResult = {
            allowed: rail.severity !== 'block',
            railId: rail.id,
            message: rail.message,
            severity: rail.severity,
        };
        this.violations.push({ railId: rail.id, timestamp: new Date().toISOString(), action, message: rail.message });
        this.onViolation?.(result, action);
        return result;
    }
}

/** Simple glob matching (supports * and **) */
function matchGlob(path: string, pattern: string): boolean {
    const regex = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\{\{GLOBSTAR\}\}/g, '.*');
    return new RegExp(`^${regex}$`).test(path);
}
