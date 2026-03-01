import React, { useState, useEffect, useRef } from 'react';
import { IoFolderOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { useIsClay } from '../hooks/useIsClay';
import { glassPanel, glassInput, glassButton } from '../hooks/useClayStyles';

interface FileModalProps {
    isOpen: boolean;
    type: 'create-folder' | 'create-file' | 'rename';
    initialValue?: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
    title?: string;
}

const FileModal: React.FC<FileModalProps> = ({ isOpen, type, initialValue = '', onConfirm, onCancel, title }) => {
    const clay = useIsClay();
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
                className={`w-[320px] ${clay ? '' : 'bg-surface'} p-0 border ${clay ? 'border-[--glass-border] rounded-[16px]' : 'border-[--border-color]'} overflow-hidden transform transition-all scale-100`}
                style={clay ? glassPanel : undefined}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-4 py-3 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'} flex flex-col items-center`}>
                    <div className="font-semibold text-[15px] text-[--text-color]">{displayTitle}</div>
                    <div className="text-[12px] text-[--text-muted] mt-0.5">Enter a name for this item</div>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex items-center justify-center mb-4">
                        <div
                            className={`w-12 h-12 flex items-center justify-center text-white p-2.5 ${clay ? 'rounded-[12px]' : 'bg-accent text-[--bg-base]'}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            {type === 'create-folder' ? <IoFolderOutline className="w-full h-full" /> : <IoDocumentTextOutline className="w-full h-full" />}
                        </div>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        className={`w-full px-3 py-1.5 ${clay ? '' : 'bg-overlay'} border ${clay ? 'border-[--glass-border] rounded-[10px]' : 'border-[--border-color]'} outline-none focus:ring-2 ring-accent/50 text-[14px] text-[--text-color] text-center`}
                        style={clay ? glassInput : undefined}
                        placeholder="Name"
                    />

                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className={`flex-1 py-1.5 ${clay ? '' : 'bg-overlay'} border ${clay ? 'border-[--glass-border] rounded-[10px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'border-[--border-color] hover:bg-overlay'} font-medium text-[13px] text-[--text-color] transition-colors`}
                            style={clay ? glassButton : undefined}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 py-1.5 font-medium text-[13px] transition-all active:scale-[0.97] ${clay ? 'rounded-[10px] text-white hover:opacity-90' : 'bg-accent text-[--bg-base] hover:opacity-80'}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
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
