import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';
import type { GitCloneOptions, GitCommitOptions, GitPushOptions, GitStatusEntry, GitLogEntry } from '../../types/runtime';

// Persistent in-browser filesystem backed by IndexedDB
const fs = new LightningFS('hackathos-git');
const DEFAULT_CORS_PROXY = 'https://cors.isomorphic-git.org';

export async function gitClone(options: GitCloneOptions): Promise<void> {
    const { url, dir, depth = 1, singleBranch = true, branch, corsProxy = DEFAULT_CORS_PROXY, onProgress } = options;

    await git.clone({
        fs,
        http,
        dir,
        url,
        corsProxy,
        singleBranch,
        depth,
        ref: branch,
        onProgress: onProgress ? (progress) => {
            onProgress({
                phase: progress.phase,
                loaded: progress.loaded,
                total: progress.total,
            });
        } : undefined,
    });
}

export async function gitStatus(dir: string): Promise<GitStatusEntry[]> {
    const matrix = await git.statusMatrix({ fs, dir });
    return matrix.map(([filepath, headStatus, workdirStatus, stageStatus]) => ({
        filepath: filepath as string,
        headStatus: headStatus as number,
        workdirStatus: workdirStatus as number,
        stageStatus: stageStatus as number,
    }));
}

export async function gitAdd(dir: string, filepath: string): Promise<void> {
    await git.add({ fs, dir, filepath });
}

export async function gitAddAll(dir: string): Promise<void> {
    const status = await gitStatus(dir);
    for (const entry of status) {
        if (entry.workdirStatus !== entry.stageStatus) {
            if (entry.workdirStatus === 0) {
                await git.remove({ fs, dir, filepath: entry.filepath });
            } else {
                await git.add({ fs, dir, filepath: entry.filepath });
            }
        }
    }
}

export async function gitCommit(options: GitCommitOptions): Promise<string> {
    const { dir, message, author } = options;
    await gitAddAll(dir);
    return git.commit({
        fs,
        dir,
        message,
        author: {
            name: author.name,
            email: author.email,
        },
    });
}

export async function gitPush(options: GitPushOptions): Promise<void> {
    const { dir, token, remote = 'origin', branch } = options;
    await git.push({
        fs,
        http,
        dir,
        remote,
        ref: branch,
        corsProxy: DEFAULT_CORS_PROXY,
        onAuth: () => ({ username: token }),
    });
}

export async function gitPull(dir: string, token?: string): Promise<void> {
    await git.pull({
        fs,
        http,
        dir,
        corsProxy: DEFAULT_CORS_PROXY,
        singleBranch: true,
        onAuth: token ? () => ({ username: token }) : undefined,
        author: { name: 'HackathOS', email: 'user@hackathos.dev' },
    });
}

export async function gitLog(dir: string, depth: number = 20): Promise<GitLogEntry[]> {
    const commits = await git.log({ fs, dir, depth });
    return commits.map(c => ({
        oid: c.oid,
        message: c.commit.message,
        author: {
            name: c.commit.author.name,
            email: c.commit.author.email,
            timestamp: c.commit.author.timestamp,
        },
    }));
}

export async function gitInit(dir: string): Promise<void> {
    await git.init({ fs, dir, defaultBranch: 'main' });
}

export async function gitCurrentBranch(dir: string): Promise<string | undefined> {
    return git.currentBranch({ fs, dir }) as Promise<string | undefined>;
}

export async function gitListBranches(dir: string): Promise<string[]> {
    return git.listBranches({ fs, dir });
}

export async function gitCheckout(dir: string, branch: string): Promise<void> {
    await git.checkout({ fs, dir, ref: branch });
}

// Read a file from the git filesystem
export async function readGitFile(path: string): Promise<string> {
    const content = await fs.promises.readFile(path, 'utf8');
    return content as string;
}

// Write a file to the git filesystem
export async function writeGitFile(path: string, content: string): Promise<void> {
    // Ensure parent directory exists
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
        const dir = parts.slice(0, i).join('/');
        try {
            await fs.promises.mkdir(dir);
        } catch {
            // Directory already exists
        }
    }
    await fs.promises.writeFile(path, content, 'utf8');
}

// List files in a git directory
export async function listGitDir(dir: string): Promise<string[]> {
    try {
        const entries = await fs.promises.readdir(dir);
        return entries as string[];
    } catch {
        return [];
    }
}

// Get the lightning-fs instance for advanced operations
export function getGitFS() {
    return fs;
}
