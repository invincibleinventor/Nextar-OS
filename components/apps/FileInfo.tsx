'use client';
import React, { useState } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { getFileIcon, filesystemitem, humanizeMime } from '../data';
import { useWindows } from '../WindowContext';
import Image from 'next/image';
import FilePicker from '../ui/FilePicker';
import { useIsClay } from '../hooks/useIsClay';
import { glassPanel, glassCard, glassInput } from '../hooks/useClayStyles';

interface FileInfoProps {
    fileId?: string;
    item?: filesystemitem;
}

export default function FileInfo({ fileId, item }: FileInfoProps) {
    const { files, renameItem } = useFileSystem();
    const { activewindow } = useWindows();
    const clay = useIsClay();

    const [localItem, setLocalItem] = useState<filesystemitem | undefined>(item || files.find(f => f.id === fileId));
    const [showPicker, setShowPicker] = useState(!localItem);

    React.useEffect(() => {
        if (!localItem) setShowPicker(true);
    }, [localItem]);

    React.useEffect(() => {
        if (localItem) {
            const fresh = files.find(f => f.id === localItem.id);
            if (fresh) setLocalItem(fresh);
        }
    }, [files, localItem]);

    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(localItem?.name || '');

    if (!localItem && !showPicker) {
        return (
            <div className={`flex flex-col items-center justify-center h-full gap-4 ${clay ? 'font-sans bg-[--bg-base]' : ''}`}>
                <span className="text-[--text-muted]">No file selected.</span>
                <button onClick={() => setShowPicker(true)} className={`px-5 py-2.5 text-white text-xs ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`} style={{ background: 'var(--accent-color)' }}>Select File</button>
            </div>
        );
    }

    const { name, size, date, mimetype, icon, parent, id } = localItem || {} as any;

    const handleRename = () => {
        if (newName.trim() && localItem) {
            renameItem(localItem.id, newName);
            setIsRenaming(false);
        }
    };

    return (
        <div className={`flex flex-col w-full h-full text-[--text-color] text-xs ${clay ? 'font-sans bg-[--bg-base]' : 'bg-[--bg-base] font-mono'}`}>
            <div
                className={`flex flex-col items-center p-6 ${clay ? 'border-b border-[--glass-border]' : 'border-b border-[--border-color] bg-surface'}`}
            >
                <div className="w-16 h-16 relative mb-4">
                    {localItem ? getFileIcon(mimetype, name, icon, id, localItem.content || localItem.link) : null}
                </div>

                {isRenaming ? (
                    <input
                        className={`text-center font-bold text-[13px] px-2 py-1 outline-none w-3/4 text-[--text-color] ${clay ? 'rounded-[12px] border border-[--glass-border]' : 'bg-surface border border-accent'}`}
                        style={clay ? glassInput : undefined}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                        autoFocus
                    />
                ) : (
                    <h1
                        className="text-[13px] font-bold text-center select-text cursor-text"
                        onClick={() => {
                            if (localItem && !localItem.isSystem) {
                                setIsRenaming(true);
                                setNewName(name);
                            }
                        }}
                    >
                        {name || 'Unknown'} {name && mimetype ? displayExtension(name, mimetype) : ''}
                    </h1>
                )}
                <span className="text-[10px] text-[--text-muted] mt-1">{date}</span>
            </div>

            <div
                className={`flex flex-col p-4 gap-2 ${clay ? 'm-3 rounded-[16px]' : ''}`}
                style={clay ? glassCard : undefined}
            >
                <h2 className={`font-bold text-[--text-muted] text-[11px] mb-1 ${clay ? 'uppercase tracking-wide' : ''}`}>General:</h2>
                <div className="grid grid-cols-[60px_1fr] gap-y-1">
                    <span className="text-[--text-muted] text-right pr-2">Kind:</span>
                    <span>{mimetype ? humanizeMime(mimetype) : 'Unknown'}</span>

                    <span className="text-[--text-muted] text-right pr-2">Size:</span>
                    <span>{size || '--'}</span>

                    <span className="text-[--text-muted] text-right pr-2">Where:</span>
                    <span className="truncate">{parent} (ID)</span>

                    <span className="text-[--text-muted] text-right pr-2">Original:</span>
                    <span className="truncate select-all">{localItem?.link || 'Local'}</span>
                </div>
            </div>

            <div className="flex-1"></div>

            {showPicker && (
                <FilePicker
                    mode="open"
                    onSelect={(file) => {
                        if (file) setLocalItem(file);
                        setShowPicker(false);
                    }}
                    onCancel={() => {
                        setShowPicker(false);
                    }}
                />
            )}
        </div>
    );
}

function displayExtension(name: string, mime: string) {
    if (mime === 'inode/directory') return '';
    return '';
}


