'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { IoSaveOutline, IoText, IoSearchOutline, IoClose, IoFolderOpenOutline, IoPlay, IoStop } from 'react-icons/io5';
import { useAuth } from '../AuthContext';
import ContextMenu from '../ui/ContextMenu';
import FilePicker from '../ui/FilePicker';
import { filesystemitem } from '../data';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';


interface TextEditProps {
    id?: string;
    content?: string;
    title?: string;
    isFocused: boolean;
    appId?: string;
}

export default function TextEdit({ id, content: initialContent, title, isFocused, appId = 'textedit' }: TextEditProps) {
    const { updateFileContent, files, createFile } = useFileSystem();
    const [content, setContent] = useState(initialContent || '');
    const [isSaved, setIsSaved] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');

    const [currentFileId, setCurrentFileId] = useState<string | undefined>(id);

    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [pickerMode, setPickerMode] = useState<'open' | 'save'>('open');

    const { user } = useAuth();
    const username = user?.username || 'Guest';
    const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));
    const [currentPath, setCurrentPath] = useState<string[]>(['System', 'Users', homeDir, 'Projects']);



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

    const handleInput = useCallback(() => {
        if (contentRef.current) {
            setContent(contentRef.current.innerHTML);
            setIsSaved(false);
        }
    }, []);

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
        <div className="flex flex-col w-full h-full bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-xl text-black dark:text-white font-sans text-sm relative" onContextMenu={handleContextMenu}>
            <div className="h-[50px] flex items-center px-4 pl-[80px] bg-[#f5f5f5]/50 dark:bg-[#2d2d2d]/50 border-b border-gray-200 dark:border-white/10 select-none gap-2 draggable-area backdrop-blur-md">
                <button onClick={handleOpen} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded" title="Open">
                    <IoFolderOpenOutline />
                </button>
                <button onClick={handleSave} disabled={files.find(f => f.id === currentFileId)?.isReadOnly} className={`p-1 rounded ${files.find(f => f.id === currentFileId)?.isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} title="Save">
                    <IoSaveOutline />
                </button>
                <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/20 mx-1"></div>
                <button onClick={() => execCmd('bold')} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded font-bold" title="Bold">B</button>
                <button onClick={() => execCmd('italic')} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded italic" title="Italic">I</button>
                <button onClick={() => execCmd('underline')} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded underline" title="Underline">U</button>
                <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/20 mx-1"></div>
                <button onClick={() => execCmd('justifyLeft')} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">Left</button>
                <button onClick={() => execCmd('justifyCenter')} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">Center</button>

                <div className="flex-1"></div>
                {files.find(f => f.id === currentFileId)?.isReadOnly && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Locked
                    </div>
                )}
                <span className="text-xs text-gray-500">{isSaved ? 'Saved' : 'Unsaved'}</span>
            </div>

            {showFindReplace && (
                <div className="absolute top-10 right-0 left-0 bg-[#f0f0f0] dark:bg-[#333] border-b border-gray-300 dark:border-black/20 p-2 flex gap-2 items-center z-10 animate-in slide-in-from-top-2">
                    <IoSearchOutline />
                    <input
                        className="bg-white dark:bg-black/20 px-2 py-1 rounded text-xs outline-none border border-transparent focus:border-blue-500"
                        placeholder="Find..."
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                    />
                    <input
                        className="bg-white dark:bg-black/20 px-2 py-1 rounded text-xs outline-none border border-transparent focus:border-blue-500"
                        placeholder="Replace with..."
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                    />
                    <button onClick={handleFindReplace} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Replace All</button>
                    <button onClick={() => setShowFindReplace(false)} className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"><IoClose /></button>
                </div>
            )}

            <div
                ref={contentRef}
                className="flex-1 w-full h-full p-6 outline-none overflow-y-auto rich-text-editor bg-transparent"
                contentEditable={!files.find(f => f.id === currentFileId)?.isReadOnly}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                suppressContentEditableWarning={true}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            />

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
