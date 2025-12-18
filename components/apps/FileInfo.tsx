import React, { useState } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { getFileIcon, filesystemitem, humanizeMime } from '../data';
import { useWindows } from '../WindowContext';
import Image from 'next/image';
import FilePicker from '../ui/FilePicker';

interface FileInfoProps {
    fileId?: string; 
    item?: filesystemitem;
}

export default function FileInfo({ fileId, item }: FileInfoProps) {
    const { files, renameItem } = useFileSystem();
    const { activewindow } = useWindows();

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
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <span className="text-gray-500">No file selected.</span>
                <button onClick={() => setShowPicker(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md text-xs">Select File</button>
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
        <div className="flex flex-col w-full h-full bg-[#f6f6f6] dark:bg-[#252526] text-black dark:text-white font-sf text-xs">
            <div className="flex flex-col items-center p-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e]">
                <div className="w-16 h-16 relative mb-4">
                    {localItem ? getFileIcon(mimetype, name, icon) : null}
                </div>

                {isRenaming ? (
                    <input
                        className="text-center font-bold text-sm bg-white dark:bg-black border border-blue-500 rounded px-1 outline-none w-3/4"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                        autoFocus
                    />
                ) : (
                    <h1
                        className="text-sm font-bold text-center select-text cursor-text"
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
                <span className="text-[10px] text-gray-500 mt-1">{date}</span>
            </div>

            <div className="flex flex-col p-4 gap-2">
                <h2 className="font-bold text-gray-500 text-[11px] mb-1">General:</h2>
                <div className="grid grid-cols-[60px_1fr] gap-y-1">
                    <span className="text-gray-500 text-right pr-2">Kind:</span>
                    <span>{mimetype ? humanizeMime(mimetype) : 'Unknown'}</span>

                    <span className="text-gray-500 text-right pr-2">Size:</span>
                    <span>{size || '--'}</span>

                    <span className="text-gray-500 text-right pr-2">Where:</span>
                    <span className="truncate">{parent} (ID)</span>

                    <span className="text-gray-500 text-right pr-2">Original:</span>
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


