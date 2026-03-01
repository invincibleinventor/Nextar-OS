'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { IoSaveOutline, IoSearchOutline, IoClose, IoFolderOpenOutline, IoListOutline, IoCodeOutline, IoEyeOutline, IoDownloadOutline, IoPrintOutline } from 'react-icons/io5';

function parseMarkdown(md: string): string {
    let html = md;
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m: string, _l: string, code: string) => {
        const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre style="background:var(--bg-overlay);padding:12px;overflow-x:auto;border:1px solid var(--border-color);margin:8px 0"><code>${escaped.trimEnd()}</code></pre>`;
    });
    html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr style="border:none;border-top:1px solid var(--border-color);margin:16px 0">');
    html = html.replace(/^######\s+(.+)$/gm, '<h6 style="font-size:11px;font-weight:600;margin:12px 0 4px">$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 style="font-size:12px;font-weight:600;margin:12px 0 4px">$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4 style="font-size:13px;font-weight:600;margin:14px 0 4px">$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 style="font-size:15px;font-weight:600;margin:16px 0 6px">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 style="font-size:18px;font-weight:600;margin:18px 0 6px">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:20px 0 8px">$1</h1>');
    html = html.replace(/^(?:[-*+])\s+(.+)$/gm, '<li style="margin-left:20px;list-style:disc">$1</li>');
    html = html.replace(/((?:<li style="margin-left:20px;list-style:disc">.*<\/li>\n?)+)/g, '<ul style="margin:8px 0">$1</ul>');
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin-left:20px;list-style:decimal">$1</li>');
    html = html.replace(/((?:<li style="margin-left:20px;list-style:decimal">.*<\/li>\n?)+)/g, '<ol style="margin:8px 0">$1</ol>');
    html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-overlay);padding:1px 4px;font-family:monospace;font-size:12px">$1</code>');
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent);text-decoration:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote style="border-left:3px solid var(--border-color);padding-left:12px;margin:8px 0;color:var(--text-muted)">$1</blockquote>');
    html = html.replace(/\n{2,}/g, '</p><p style="margin:8px 0">');
    html = html.replace(/\n/g, '<br>');
    html = '<p style="margin:8px 0">' + html + '</p>';
    html = html.replace(/<p style="margin:8px 0"><\/p>/g, '');
    return html;
}
import { useAuth } from '../AuthContext';
import ContextMenu from '../ui/ContextMenu';
import FilePicker from '../ui/FilePicker';
import { filesystemitem } from '../data';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassInput } from '../hooks/useClayStyles';


interface TextEditProps {
    id?: string;
    content?: string;
    title?: string;
    isFocused: boolean;
    appId?: string;
}

export default function TextEdit({ id, content: initialContent, title, isFocused, appId = 'textedit' }: TextEditProps) {
    const clay = useIsClay();
    const { updateFileContent, files, createFile } = useFileSystem();
    const [content, setContent] = useState(initialContent || '');
    const [isSaved, setIsSaved] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');

    const [currentFileId, setCurrentFileId] = useState<string | undefined>(id);

    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [pickerMode, setPickerMode] = useState<'open' | 'save'>('open');
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    const { user } = useAuth();
    const username = user?.username || 'Guest';
    const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));
    const [currentPath, setCurrentPath] = useState<string[]>(['Disk Drive', 'Users', homeDir, 'Projects']);



    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;

    const textEditMenus = useMemo(() => ({
        File: [
            { title: "New", actionId: "new-file", shortcut: "⌘N" },
            { title: "Open...", actionId: "open", shortcut: "⌘O" },
            { separator: true },
            { title: "Save", actionId: "save", shortcut: "⌘S" },
            { separator: true },
            { title: "Close Window", actionId: "close-window", shortcut: "⌘W" }
        ],
        Edit: [
            { title: "Undo", actionId: "undo", shortcut: "⌘Z" },
            { title: "Redo", actionId: "redo", shortcut: "⇧⌘Z" },
            { separator: true },
            { title: "Cut", actionId: "cut", shortcut: "⌘X" },
            { title: "Copy", actionId: "copy", shortcut: "⌘C" },
            { title: "Paste", actionId: "paste", shortcut: "⌘V" },
            { title: "Delete", actionId: "delete" },
            { separator: true },
            { title: "Select All", actionId: "select-all", shortcut: "⌘A" },
            { separator: true },
            { title: "Find...", actionId: "find", shortcut: "⌘F" }
        ],
        Format: [
            { title: "Bold", actionId: "format-bold", shortcut: "⌘B" },
            { title: "Italic", actionId: "format-italic", shortcut: "⌘I" },
            { title: "Underline", actionId: "format-underline", shortcut: "⌘U" },
            { separator: true },
            { title: "Align Left", actionId: "align-left" },
            { title: "Center", actionId: "align-center" },
            { title: "Align Right", actionId: "align-right" }
        ]
    }), []);

    useMenuRegistration(textEditMenus, isActiveWindow);



    useEffect(() => {
        if (!id) {
            setPickerMode('open');
            setShowPicker(true);
        }
    }, [id]);

    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== initialContent && initialContent !== undefined) {
            if (initialContent === '') contentRef.current.innerHTML = '';
            else if (contentRef.current.innerHTML === '') contentRef.current.innerHTML = initialContent;
        }
    }, [initialContent]);

    const updateCounts = useCallback(() => {
        if (contentRef.current) {
            const text = contentRef.current.innerText || '';
            const trimmed = text.trim();
            setCharCount(trimmed.length);
            setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
        }
    }, []);

    const handleInput = useCallback(() => {
        if (contentRef.current) {
            setContent(contentRef.current.innerHTML);
            setIsSaved(false);
            updateCounts();
        }
    }, [updateCounts]);

    const handleSave = useCallback(async () => {
        if (currentFileId && contentRef.current) {
            await updateFileContent(currentFileId, contentRef.current.innerHTML);
            setIsSaved(true);
        } else {
            setPickerMode('save');
            setShowPicker(true);
        }
    }, [currentFileId, updateFileContent]);

    const handleOpen = () => {
        setPickerMode('open');
        setShowPicker(true);
    }

    const handleFileSelect = async (item: filesystemitem | null, saveName?: string) => {
        if (pickerMode === 'open' && item) {
            setContent(item.content || '');
            if (contentRef.current) contentRef.current.innerHTML = item.content || '';
            setCurrentFileId(item.id);
            setIsSaved(true);
        } else if (pickerMode === 'save' && saveName) {
            const parentId = item ? item.id : 'root';
            const newId = await createFile(saveName, parentId, contentRef.current?.innerHTML || '');
            setCurrentFileId(newId);
            setIsSaved(true);
        }
        setShowPicker(false);
    };

    const execCmd = useCallback((command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        handleInput();
        if (contentRef.current) contentRef.current.focus();
    }, [handleInput]);

    const handleExportPDF = useCallback(() => {
        const contentEl = showPreview ? previewRef.current : contentRef.current;
        if (!contentEl) return;
        const printStyle = document.createElement('style');
        printStyle.id = 'textedit-print-style';
        printStyle.textContent = `@media print { body > *:not(#textedit-print-container) { display: none !important; } #textedit-print-container { display: block !important; position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; background: white !important; color: black !important; padding: 40px !important; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; z-index: 999999; overflow: visible !important; } }`;
        document.head.appendChild(printStyle);
        const printContainer = document.createElement('div');
        printContainer.id = 'textedit-print-container';
        printContainer.innerHTML = contentEl.innerHTML;
        document.body.appendChild(printContainer);
        window.print();
        document.head.removeChild(printStyle);
        document.body.removeChild(printContainer);
    }, [showPreview]);

    const handleExportHTML = useCallback(() => {
        const contentEl = showPreview ? previewRef.current : contentRef.current;
        if (!contentEl) return;
        const currentFile = files.find(f => f.id === currentFileId);
        const fileName = currentFile?.name?.replace(/\.[^.]+$/, '') || 'document';
        const htmlContent = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>${fileName}</title>\n<style>\nbody { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }\npre { background: #f4f4f4; padding: 12px; overflow-x: auto; border: 1px solid #ddd; }\ncode { background: #f4f4f4; padding: 1px 4px; font-family: monospace; font-size: 12px; }\n</style>\n</head>\n<body>\n${contentEl.innerHTML}\n</body>\n</html>`;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [showPreview, files, currentFileId]);

    const previewHTML = useMemo(() => {
        if (!showPreview) return '';
        if (typeof document === 'undefined') return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const plainText = tempDiv.innerText || tempDiv.textContent || '';
        return parseMarkdown(plainText);
    }, [showPreview, content]);

    const menuActions = useMemo(() => ({
        'new-file': () => {
            setContent('');
            setCurrentFileId(undefined);
            setIsSaved(true);
            if (contentRef.current) contentRef.current.innerHTML = '';
        },
        'open': () => {
            setPickerMode('open');
            setShowPicker(true);
        },
        'save': () => handleSave(),
        'undo': () => execCmd('undo'),
        'redo': () => execCmd('redo'),
        'cut': () => execCmd('cut'),
        'copy': () => execCmd('copy'),
        'paste': () => {
            navigator.clipboard.readText().then(text => execCmd('insertText', text));
        },
        'delete': () => execCmd('delete'),
        'select-all': () => execCmd('selectAll'),
        'find': () => setShowFindReplace(true),
        'format-bold': () => execCmd('bold'),
        'format-italic': () => execCmd('italic'),
        'format-underline': () => execCmd('underline'),
        'align-left': () => execCmd('justifyLeft'),
        'align-center': () => execCmd('justifyCenter'),
        'align-right': () => execCmd('justifyRight'),
    }), [currentFileId, handleSave, execCmd]);

    useMenuAction(appId, menuActions, id);

    useEffect(() => {
        if (!id) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== id) return;
            if (showPicker) { e.preventDefault(); setShowPicker(false); }
            else if (showFindReplace) { e.preventDefault(); setShowFindReplace(false); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [id, activewindow, showPicker, showFindReplace]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            handleOpen();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            e.preventDefault();
            setShowFindReplace(true);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleFindReplace = () => {
        if (!findText) return;
        if (contentRef.current) {
            const regex = new RegExp(findText, 'g');
            contentRef.current.innerHTML = contentRef.current.innerHTML.replace(regex, replaceText);
            handleInput();
        }
    };

    return (
        <div className={`flex flex-col w-full h-full ${clay ? 'bg-[--bg-base] font-sans' : 'bg-[--bg-base] font-mono'} text-[--text-color] text-[13px] relative`} onContextMenu={handleContextMenu}>
            <div className={`h-[40px] flex items-center px-3 ${clay ? 'border-b border-[--glass-border]' : 'bg-surface border-b border-[--border-color]'} select-none gap-1.5 draggable-area`}>
                <button onClick={handleOpen} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Open">
                    <IoFolderOpenOutline />
                </button>
                <button onClick={handleSave} disabled={files.find(f => f.id === currentFileId)?.isReadOnly} className={`p-1.5 ${files.find(f => f.id === currentFileId)?.isReadOnly ? 'opacity-50 cursor-not-allowed' : clay ? 'hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} ${clay ? 'rounded-[8px]' : ''} transition-colors`} title="Save">
                    <IoSaveOutline />
                </button>
                <div className={`w-[1px] h-4 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'} mx-1`}></div>
                <button onClick={() => execCmd('bold')} className={`p-1.5 font-bold ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Bold">B</button>
                <button onClick={() => execCmd('italic')} className={`p-1.5 italic ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Italic">I</button>
                <button onClick={() => execCmd('underline')} className={`p-1.5 underline ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Underline">U</button>
                <div className={`w-[1px] h-4 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'} mx-1`}></div>
                <button onClick={() => execCmd('justifyLeft')} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`}>Left</button>
                <button onClick={() => execCmd('justifyCenter')} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`}>Center</button>
                <div className={`w-[1px] h-4 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'} mx-1`}></div>
                <select
                    onChange={(e) => { if (e.target.value === 'p') execCmd('formatBlock', 'p'); else execCmd('formatBlock', e.target.value); }}
                    className={`text-xs px-1.5 py-0.5 outline-none text-[--text-color] ${clay ? 'rounded-[8px] border border-[--glass-border]' : 'bg-overlay border border-[--border-color]'}`}
                    style={clay ? glassInput : undefined}
                    defaultValue="p"
                >
                    <option value="p">Body</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                </select>
                <button onClick={() => execCmd('insertUnorderedList')} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Bullet List"><IoListOutline size={14} /></button>
                <button onClick={() => execCmd('insertOrderedList')} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Numbered List"><IoCodeOutline size={14} /></button>
                <div className={`w-[1px] h-4 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'} mx-1`}></div>
                <button onClick={() => setShowPreview(!showPreview)} className={`p-1.5 ${clay ? 'rounded-[8px] active:scale-[0.97]' : ''} ${showPreview ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]') : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay')} transition-colors`} style={showPreview && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined} title={showPreview ? 'Edit Mode' : 'Markdown Preview'}><IoEyeOutline size={14} /></button>
                <button onClick={handleExportPDF} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Export as PDF"><IoPrintOutline size={14} /></button>
                <button onClick={handleExportHTML} className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} transition-colors`} title="Export as HTML"><IoDownloadOutline size={14} /></button>
                <div className="flex-1"></div>
                {files.find(f => f.id === currentFileId)?.isReadOnly && (
                    <div className="flex items-center gap-1 text-xs text-[--text-muted] mr-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Locked
                    </div>
                )}
                {showPreview && <span className="text-[11px] text-[--text-muted] mr-1">Preview</span>}
                <span className="text-xs text-[--text-muted]">{wordCount} words · {charCount} chars</span>
                <span className="text-xs text-[--text-muted]">{isSaved ? 'Saved' : 'Unsaved'}</span>
            </div>

            {showFindReplace && (
                <div className={`absolute top-10 right-0 left-0 ${clay ? 'border-b border-[--glass-border]' : 'bg-surface border-b border-[--border-color]'} p-2 flex gap-2 items-center z-10 animate-in slide-in-from-top-2`} style={clay ? { background: 'var(--bg-glass)' } : undefined}>
                    <IoSearchOutline />
                    <input
                        className={`px-2 py-1 text-xs outline-none ${clay ? 'rounded-[12px] border border-[--glass-border]' : 'bg-overlay border border-transparent focus:border-accent'}`}
                        style={clay ? glassInput : undefined}
                        placeholder="Find..."
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                    />
                    <input
                        className={`px-2 py-1 text-xs outline-none ${clay ? 'rounded-[12px] border border-[--glass-border]' : 'bg-overlay border border-transparent focus:border-accent'}`}
                        style={clay ? glassInput : undefined}
                        placeholder="Replace with..."
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                    />
                    <button onClick={handleFindReplace} className={`px-3 py-1 text-xs text-white ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`} style={{ background: 'var(--accent-color)' }}>Replace All</button>
                    <button onClick={() => setShowFindReplace(false)} className={`ml-auto p-1 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}><IoClose /></button>
                </div>
            )}

            {showPreview ? (
                <div
                    ref={previewRef}
                    className={`flex-1 w-full h-full p-6 overflow-y-auto ${clay ? 'bg-[--bg-base]' : 'bg-transparent'}`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                />
            ) : (
                <div
                    ref={contentRef}
                    className={`flex-1 w-full h-full p-6 outline-none overflow-y-auto rich-text-editor ${clay ? 'bg-[--bg-base]' : 'bg-transparent'}`}
                    contentEditable={!files.find(f => f.id === currentFileId)?.isReadOnly}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    suppressContentEditableWarning={true}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                />
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={[
                        { label: 'Cut', action: () => execCmd('cut') },
                        { label: 'Copy', action: () => execCmd('copy') },
                        {
                            label: 'Paste', action: () => {
                                navigator.clipboard.readText().then(text => execCmd('insertText', text));
                            }
                        },
                        { separator: true },
                        { label: 'Select All', action: () => execCmd('selectAll') },
                        { separator: true },
                        { label: 'Find & Replace', action: () => setShowFindReplace(true) },
                    ]}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {showPicker && (
                <FilePicker
                    mode={pickerMode}
                    onSelect={handleFileSelect}
                    onCancel={() => {
                        setShowPicker(false);
                    }}
                    acceptedMimeTypes={['text/plain', 'text/html', 'text/markdown', 'application/json', 'application/javascript', 'text/css']}
                />
            )}
        </div>
    );
}
