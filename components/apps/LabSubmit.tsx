import React, { useState, useEffect } from 'react';
import { useCheerpX } from '../CheerpXContext';
import {
    IoCloudUploadOutline, IoMailOutline, IoDownloadOutline,
    IoCheckmarkCircle, IoRefreshOutline, IoSchoolOutline,
    IoDocumentOutline, IoFolderOutline, IoLogInOutline,
    IoLogOutOutline, IoWarningOutline, IoTrashOutline,
} from 'react-icons/io5';
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface LabSubmitProps {
    isFocused?: boolean;
    appId?: string;
}

export default function LabSubmit({ isFocused = true }: LabSubmitProps) {
    const { listDir, compressPath, downloadFile, isBooted, resetEnvironment } = useCheerpX();
    const [files, setFiles] = useState<{ name: string, path: string, isDir: boolean, selected: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string, email: string, avatar: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isBooted) {
            loadFiles();
        } else {
            setLoading(false);
            setError("Linux environment not ready yet.");
        }
    }, [isBooted]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            const entries = await listDir('/home/user/projects');
            const visible = entries
                .filter(e => !e.name.startsWith('.'))
                .map(e => ({
                    name: e.name,
                    path: e.path,
                    isDir: e.isDirectory,
                    selected: false
                }));
            setFiles(visible);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
            setError("Failed to list project files. Make sure you created some!");
        }
    };

    const toggleFile = (path: string) => {
        setFiles(prev => prev.map(f => f.path === path ? { ...f, selected: !f.selected } : f));
    };

    const selectAll = () => {
        const allSelected = files.every(f => f.selected);
        setFiles(prev => prev.map(f => ({ ...f, selected: !allSelected })));
    };

    const handleGoogleLogin = () => {
        const width = 500;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const popup = window.open('about:blank', 'Google Login', `width=${width},height=${height},top=${top},left=${left}`);

        if (popup) {
            popup.document.write(`
                <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #1e2030; color: #cad3f5; min-height: 100vh; box-sizing: border-box;">
                    <h2>Sign in with Google</h2>
                    <p style="color: #6e738d;">Continue to HackathOS Lab Submit</p>
                    <div style="margin: 20px auto; max-width: 300px; border: 1px solid #363a4f; padding: 16px; border-radius: 8px; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#8aadf4'" onmouseout="this.style.borderColor='#363a4f'" onclick="window.opener.postMessage('google-login-success', '*'); window.close();">
                        <strong>Student Account</strong><br>
                        <span style="color: #6e738d;">student@university.edu</span>
                    </div>
                </div>
            `);

            const handler = (e: MessageEvent) => {
                if (e.data === 'google-login-success') {
                    setUser({
                        name: 'Student User',
                        email: 'student@university.edu',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
                    });
                    window.removeEventListener('message', handler);
                }
            };
            window.addEventListener('message', handler);
        }
    };

    const handleDownloadZip = async () => {
        const selected = files.filter(f => f.selected);
        if (selected.length === 0) return;

        setSubmitting(true);
        try {
            const zipName = `submission_${Date.now()}.zip`;
            const zipPath = `/tmp/${zipName}`;

            if (selected.length === 1) {
                await compressPath(selected[0].path, zipPath);
            } else {
                await compressPath('/home/user/projects', zipPath);
            }

            await downloadFile(zipPath);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
            setError("Failed to create zip package.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClassroomParam = () => {
        if (!user) {
            alert("Please sign in first");
            return;
        }
        window.open('https://classroom.google.com', '_blank');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent("Lab Submission: Project 1");
        const body = encodeURIComponent("Attached is my submission for the project.\n\nSent from HackathOS.");
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const selectedCount = files.filter(f => f.selected).length;
    const hasSelection = selectedCount > 0;

    return (
        <div className="h-full w-full bg-[--bg-base] text-[--text-color] flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-[--bg-surface] border-b border-[--border-color] flex items-center justify-between px-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-pastel-peach p-2 rounded-lg">
                        <IoSchoolOutline size={18} className="text-[--bg-base]" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight">Lab Submission</h1>
                        <p className="text-[10px] text-[--text-muted]">Classroom Integration</p>
                    </div>
                </div>

                {user ? (
                    <div className="flex items-center gap-2 bg-[--bg-overlay] pr-3 pl-1 py-1 rounded-full">
                        <img src={user.avatar} className="w-7 h-7 rounded-full" alt="Avatar" />
                        <span className="text-xs font-medium">{user.name}</span>
                        <button onClick={() => setUser(null)} className="text-pastel-red hover:opacity-80 ml-1">
                            <IoLogOutOutline size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleGoogleLogin}
                        className="flex items-center gap-2 bg-[--bg-overlay] border border-[--border-color] hover:border-pastel-blue px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                        <FaGoogle className="text-pastel-red" size={12} />
                        Sign in with Google
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* File Selection Sidebar */}
                <div className="w-full md:w-72 border-r border-[--border-color] flex flex-col bg-[--bg-surface] shrink-0">
                    <div className="p-3 border-b border-[--border-color] flex justify-between items-center">
                        <h2 className="font-semibold text-[10px] uppercase tracking-wider text-[--text-muted]">Project Files</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={selectAll} className="text-pastel-blue hover:opacity-80 text-[10px] px-1.5 py-0.5 rounded hover:bg-[--bg-overlay]">
                                {files.every(f => f.selected) && files.length > 0 ? 'Deselect' : 'Select All'}
                            </button>
                            <button onClick={loadFiles} className="text-[--text-muted] hover:text-[--text-color] p-1 rounded hover:bg-[--bg-overlay]">
                                <IoRefreshOutline size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-[--text-muted]">
                                <FaSpinner className="animate-spin text-xl" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-2 p-6 text-center">
                                <IoWarningOutline size={24} className="text-pastel-red" />
                                <p className="text-pastel-red text-xs">{error}</p>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 p-8 text-center text-[--text-muted]">
                                <IoFolderOutline size={28} className="opacity-40" />
                                <p className="text-xs">No files found in ~/projects</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {files.map((file) => (
                                    <div
                                        key={file.path}
                                        onClick={() => toggleFile(file.path)}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                                            file.selected
                                                ? 'bg-pastel-blue/10 border border-pastel-blue/30'
                                                : 'hover:bg-[--bg-overlay] border border-transparent'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                            file.selected
                                                ? 'bg-pastel-blue border-pastel-blue'
                                                : 'border-[--border-color]'
                                        }`}>
                                            {file.selected && <IoCheckmarkCircle size={10} className="text-[--bg-base]" />}
                                        </div>
                                        {file.isDir
                                            ? <IoFolderOutline className="text-pastel-yellow shrink-0" size={14} />
                                            : <IoDocumentOutline className="text-pastel-blue shrink-0" size={14} />
                                        }
                                        <span className="truncate text-xs font-medium flex-1">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-[--bg-overlay] border-t border-[--border-color] text-[10px] text-[--text-muted]">
                        {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
                    </div>
                </div>

                {/* Actions Area */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="max-w-sm w-full space-y-5 relative z-10">
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-bold mb-1.5">Ready to Submit?</h2>
                            <p className="text-[--text-muted] text-xs">Select files and choose a submission method.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Google Classroom */}
                            <button
                                onClick={handleClassroomParam}
                                disabled={!user || !hasSelection}
                                className={`anime-card flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                                    (!user || !hasSelection)
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:border-pastel-green cursor-pointer'
                                }`}
                            >
                                <div className="bg-pastel-green/15 p-2 rounded-lg">
                                    <IoCloudUploadOutline size={18} className="text-pastel-green" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-semibold text-xs">Google Classroom</div>
                                    <div className="text-[10px] text-[--text-muted]">Open Classroom to upload</div>
                                </div>
                                <IoLogInOutline size={14} className="text-[--text-muted]" />
                            </button>

                            {/* Email */}
                            <button
                                onClick={handleEmail}
                                disabled={!hasSelection}
                                className={`anime-card flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                                    !hasSelection
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:border-pastel-blue cursor-pointer'
                                }`}
                            >
                                <div className="bg-pastel-blue/15 p-2 rounded-lg">
                                    <IoMailOutline size={18} className="text-pastel-blue" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-semibold text-xs">Email Instructor</div>
                                    <div className="text-[10px] text-[--text-muted]">Send via default mail app</div>
                                </div>
                                <IoLogInOutline size={14} className="text-[--text-muted]" />
                            </button>

                            {/* Download Zip */}
                            <button
                                onClick={handleDownloadZip}
                                disabled={!hasSelection}
                                className={`anime-card flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                                    !hasSelection
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:border-pastel-mauve cursor-pointer'
                                }`}
                            >
                                <div className="bg-pastel-mauve/15 p-2 rounded-lg">
                                    <IoDownloadOutline size={18} className="text-pastel-mauve" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-semibold text-xs">Download Zip</div>
                                    <div className="text-[10px] text-[--text-muted]">Save package locally</div>
                                </div>
                                {submitting
                                    ? <FaSpinner className="animate-spin text-[--text-muted]" size={12} />
                                    : <IoCheckmarkCircle size={14} className="text-[--text-muted]" />
                                }
                            </button>
                        </div>

                        <div className="pt-6 border-t border-[--border-color] w-full">
                            <button
                                onClick={resetEnvironment}
                                className="w-full flex items-center justify-center gap-1.5 text-[10px] text-pastel-red hover:bg-pastel-red/10 p-2 rounded-lg transition-colors"
                            >
                                <IoTrashOutline size={12} />
                                Trouble with the terminal? Reset Lab Environment
                            </button>
                        </div>
                    </div>

                    {/* Subtle background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pastel-blue/5 rounded-full blur-3xl -z-0 pointer-events-none" />
                </div>
            </div>

            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-pastel-green text-[--bg-base] px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold z-50"
                    >
                        <IoCheckmarkCircle size={14} />
                        Action Completed Successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
