import React, { useState, useEffect, useRef } from 'react';

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
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onCancel}>
            <div
                className="w-[320px] bg-[#f5f5f7]/90 dark:bg-[#2c2c2e]/90 backdrop-blur-xl rounded-xl shadow-2xl p-0 border border-black/5 dark:border-white/10 overflow-hidden transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex flex-col items-center">
                    <div className="font-semibold text-[15px] text-black dark:text-white">{displayTitle}</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">Enter a name for this item</div>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg text-white text-2xl">
                            {type === 'create-folder' ? '📂' : '📄'}
                        </div>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 ring-blue-500/50 text-[14px] text-black dark:text-white text-center shadow-inner"
                        placeholder="Name"
                    />

                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-1.5 rounded-lg bg-gray-200/80 dark:bg-gray-600/50 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-[13px] text-black dark:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-1.5 rounded-lg bg-accent hover:bg-[#0071eb] text-white font-medium text-[13px] shadow-sm transition-all active:scale-95"
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
