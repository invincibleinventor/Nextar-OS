import React, { useState, useEffect, useRef } from 'react';
import { IoFolderOutline, IoDocumentTextOutline } from 'react-icons/io5';

interface FileModalProps {
    isOpen: boolean;
    type: 'create-folder' | 'create-file' | 'rename';
    initialValue?: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
    title?: string;
}

const FileModal: React.FC<FileModalProps> = ({ isOpen, type, initialValue = '', onConfirm, onCancel, title }) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onConfirm(inputValue.trim());
        }
    };

    const displayTitle = title || (
        type === 'create-folder' ? 'New Folder' :
            type === 'create-file' ? 'New File' : 'Rename'
    );

    return (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-[--bg-base]/80" onClick={onCancel}>
            <div
                className="w-[320px] bg-surface p-0 border border-[--border-color] overflow-hidden transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-4 py-3 border-b border-[--border-color] flex flex-col items-center">
                    <div className="font-semibold text-[15px] text-[--text-color]">{displayTitle}</div>
                    <div className="text-[12px] text-[--text-muted] mt-0.5">Enter a name for this item</div>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-accent flex items-center justify-center text-[--bg-base] p-2.5">
                            {type === 'create-folder' ? <IoFolderOutline className="w-full h-full" /> : <IoDocumentTextOutline className="w-full h-full" />}
                        </div>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        className="w-full px-3 py-1.5 bg-overlay border border-[--border-color] outline-none focus:ring-2 ring-accent/50 text-[14px] text-[--text-color] text-center"
                        placeholder="Name"
                    />

                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-1.5 bg-overlay border border-[--border-color] hover:bg-overlay font-medium text-[13px] text-[--text-color] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-1.5 bg-accent hover:bg-accent/80 text-[--bg-base] font-medium text-[13px] transition-all active:scale-95"
                        >
                            {title || (type === 'rename' ? 'Rename' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FileModal;
