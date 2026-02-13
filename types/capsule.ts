/**
 * Environment Capsule — Serializable snapshot of a complete lab/project environment.
 */

export interface CapsuleManifest {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    /** SHA-256 hash of the environment state at creation */
    environmentDNA: string;
    /** Runtime requirements */
    runtime: {
        os?: 'debian' | 'alpine';
        packages?: string[];         // apt packages
        pythonPackages?: string[];    // pip packages
        nodePackages?: string[];      // npm packages
    };
    /** Files included in the capsule */
    files: CapsuleFile[];
    /** Lab configuration (if this capsule is for a lab) */
    labConfig?: LabCapsuleConfig;
    /** Signature for tamper verification */
    signature?: string;
    /** Tags for marketplace discovery */
    tags?: string[];
    /** Difficulty level */
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CapsuleFile {
    path: string;
    content: string;          // base64-encoded for binary, raw for text
    encoding: 'utf8' | 'base64';
    readonly: boolean;
    hidden: boolean;
    /** Template variable placeholders e.g. {{STUDENT_NAME}} */
    templateVars?: string[];
}

export interface LabCapsuleConfig {
    /** Time limit in minutes (0 = unlimited) */
    timeLimit: number;
    /** Allowed commands (empty = all allowed) */
    allowedCommands?: string[];
    /** Blocked file paths */
    blockedPaths?: string[];
    /** Expected output for auto-grading */
    expectedOutputs?: { testId: string; command: string; expected: string; points: number }[];
    /** Hint configurations */
    hints?: { questionId: string; hints: { level: number; text: string; pointCost: number }[] }[];
    /** Proctoring settings */
    proctoring?: {
        enabled: boolean;
        clipboardIsolation: boolean;
        tabSwitchLogging: boolean;
        biometrics: boolean;
        integrityChecks: boolean;
    };
}

export interface CapsuleExport {
    magic: 'HACKOS_CAPSULE_V1';
    manifest: CapsuleManifest;
    /** Compressed payload (base64 of gzipped JSON of file contents) */
    payload: string;
}
