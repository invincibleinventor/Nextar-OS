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
                className="w-[300px] bg-white dark:bg-[#252526] rounded-xl shadow-2xl p-4 border border-black/10 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center font-semibold mb-4 text-black dark:text-white">{displayTitle}</div>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-100 dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-2 ring-blue-500 mb-4 text-black dark:text-white"
                        placeholder="Enter name..."
                    />
                    <div className="flex justify-end gap-2 text-[13px]">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-black dark:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                        >
                            {type === 'rename' ? 'Rename' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FileModal;
