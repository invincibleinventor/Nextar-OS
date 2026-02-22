export interface LabTemplate {
    id: string;
    name: string;
    description: string;
    category: 'programming' | 'web' | 'data-science' | 'systems' | 'security' | 'custom';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedMinutes: number;
    language: string;
    capsuleId?: string;
    files?: { path: string; content: string; readonly?: boolean }[];
    instructions: string;
    rubric?: RubricItem[];
    rails?: LabRail[];
    hints?: HintConfig[];
    tags: string[];
    author: string;
    createdAt: string;
}

export interface RubricItem {
    id: string;
    description: string;
    points: number;
    autoGrade?: {
        command: string;
        expectedPattern: string;
        timeout?: number;
    };
}

export interface LabRail {
    id: string;
    type: 'file-access' | 'command-whitelist' | 'command-blacklist' | 'package-lock' | 'output-format' | 'time-limit';
    message: string;
    config: Record<string, any>;
    severity: 'warn' | 'block';
}

export interface HintConfig {
    questionId: string;
    hints: HintLevel[];
}

export interface HintLevel {
    level: number;
    text: string;
    pointCost: number;
    type: 'direction' | 'pseudocode' | 'code-snippet' | 'solution';
}

export interface LabSession {
    id: string;
    labId: string;
    studentId: string;
    startedAt: string;
    completedAt?: string;
    score: number;
    maxScore: number;
    hintsUsed: { questionId: string; level: number; cost: number }[];
    violations: { railId: string; timestamp: string; action: string }[];
    checkpointIds: string[];
    environmentDNA: string;
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
