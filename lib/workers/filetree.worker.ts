/// <reference lib="webworker" />

/**
 * File Tree Worker — Build tree structure from flat file list off main thread.
 */

interface FileEntry { path: string; content?: string; size?: number }
interface TreeNode { name: string; path: string; isDir: boolean; children: TreeNode[]; size?: number }

function buildTree(files: FileEntry[]): TreeNode[] {
    const root: TreeNode = { name: '', path: '', isDir: true, children: [] };
    const dirMap = new Map<string, TreeNode>();
    dirMap.set('', root);

    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sorted) {
        const parts = file.path.split('/').filter(Boolean);
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const isLast = i === parts.length - 1;
            const partPath = parts.slice(0, i + 1).join('/');

            if (isLast && !file.path.endsWith('/')) {
                current.children.push({
                    name: parts[i], path: file.path, isDir: false,
                    children: [], size: file.size,
                });
            } else {
                let dir = dirMap.get(partPath);
                if (!dir) {
                    dir = { name: parts[i], path: partPath + '/', isDir: true, children: [] };
                    dirMap.set(partPath, dir);
                    current.children.push(dir);
                }
                current = dir;
            }
        }
    }

    // Sort: dirs first, then alphabetical
    const sortChildren = (node: TreeNode) => {
        node.children.sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
    };
    sortChildren(root);

    return root.children;
}

self.onmessage = (e: MessageEvent) => {
    const { id, type, files } = e.data;
    if (type === 'build') {
        const tree = buildTree(files);
        self.postMessage({ id, type: 'result', tree });
    }
};
