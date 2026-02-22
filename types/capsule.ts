export interface CapsuleManifest {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    environmentDNA: string;
    runtime: {
        os?: 'debian' | 'alpine';
        packages?: string[];
        pythonPackages?: string[];
        nodePackages?: string[];
    };
    files: CapsuleFile[];
    labConfig?: LabCapsuleConfig;
    signature?: string;
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CapsuleFile {
    path: string;
    content: string;
    encoding: 'utf8' | 'base64';
    readonly: boolean;
    hidden: boolean;
    templateVars?: string[];
}

export interface LabCapsuleConfig {
    timeLimit: number;
    allowedCommands?: string[];
    blockedPaths?: string[];
    expectedOutputs?: { testId: string; command: string; expected: string; points: number }[];
    hints?: { questionId: string; hints: { level: number; text: string; pointCost: number }[] }[];
    proctoring?: {
        enabled: boolean;
        clipboardIsolation: boolean;
        tabSwitchLogging: boolean;
        biometrics: boolean;
        integrityChecks: boolean;
    };
}

export interface CapsuleExport {
    magic: 'NEXTAROS_CAPSULE_V1';
    manifest: CapsuleManifest;
    payload: string;
}
