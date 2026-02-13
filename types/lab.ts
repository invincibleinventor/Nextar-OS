/**
 * Lab types — Templates, configurations, rails, and grading.
 */

export interface LabTemplate {
    id: string;
    name: string;
    description: string;
    category: 'programming' | 'web' | 'data-science' | 'systems' | 'security' | 'custom';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedMinutes: number;
    language: string;
    /** Capsule ID this template is based on */
    capsuleId?: string;
    /** Inline files if no capsule */
    files?: { path: string; content: string; readonly?: boolean }[];
    /** Instructions shown to student (markdown) */
    instructions: string;
    /** Grading rubric */
    rubric?: RubricItem[];
    /** Sandbox rails */
    rails?: LabRail[];
    /** Hint configs per question */
    hints?: HintConfig[];
    /** Tags for filtering */
    tags: string[];
    /** Author info */
    author: string;
    createdAt: string;
}

export interface RubricItem {
    id: string;
    description: string;
    points: number;
    /** Auto-grade: command to run, expected output pattern */
    autoGrade?: {
        command: string;
        expectedPattern: string; // regex
        timeout?: number;       // ms
    };
}

export interface LabRail {
    id: string;
    type: 'file-access' | 'command-whitelist' | 'command-blacklist' | 'package-lock' | 'output-format' | 'time-limit';
    /** Human-readable description shown when violated */
    message: string;
    /** Rail-specific config */
    config: Record<string, any>;
    /** Severity: 'warn' shows message, 'block' prevents action */
    severity: 'warn' | 'block';
}

export interface HintConfig {
    questionId: string;
    hints: HintLevel[];
}

export interface HintLevel {
    level: number;
    text: string;
    /** Points deducted for using this hint */
    pointCost: number;
    /** Type of hint content */
    type: 'direction' | 'pseudocode' | 'code-snippet' | 'solution';
}

export interface LabSession {
    id: string;
    labId: string;
    studentId: string;
    startedAt: string;
    completedAt?: string;
    /** Current score after deductions */
    score: number;
    maxScore: number;
    /** Hints consumed */
    hintsUsed: { questionId: string; level: number; cost: number }[];
    /** Rail violations */
    violations: { railId: string; timestamp: string; action: string }[];
    /** Checkpoint IDs for this session */
    checkpointIds: string[];
    /** Environment DNA at start */
    environmentDNA: string;
    /** Current environment DNA (for tamper detection) */
    currentDNA?: string;
}

export interface LabSubmission {
    sessionId: string;
    labId: string;
    studentId: string;
    submittedAt: string;
    files: { path: string; content: string }[];
    score: number;
    maxScore: number;
    autoGradeResults: { rubricId: string; passed: boolean; output: string; points: number }[];
    hintsUsed: { questionId: string; level: number; cost: number }[];
    totalDeductions: number;
}
