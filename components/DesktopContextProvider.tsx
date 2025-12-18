'use client';

import React, { useState } from 'react';
import ContextMenu from './ui/ContextMenu';
import FileModal from './ui/FileModal';
import { useFileSystem } from './FileSystemContext';

export default function DesktopContextMenu() {
    const { createFolder, createFile } = useFileSystem();
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [fileModal, setFileModal] = useState<{ isOpen: boolean, type: 'create-folder' | 'create-file', initialValue?: string }>({ isOpen: false, type: 'create-folder' });
    return null;
}
