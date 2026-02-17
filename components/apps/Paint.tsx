'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';
import {
    IoPencilOutline, IoRemoveOutline, IoSquareOutline, IoEllipseOutline,
    IoColorFillOutline, IoTextOutline, IoTrashOutline, IoDownloadOutline,
    IoArrowUndoOutline, IoArrowRedoOutline
} from 'react-icons/io5';

type Tool = 'pencil' | 'line' | 'rectangle' | 'ellipse' | 'eraser' | 'fill' | 'text';

const MAX_HISTORY = 50;

export default function Paint({ appId = 'paint', id }: { appId?: string; id?: string }) {
    const { activewindow } = useWindows();
    const isActive = activewindow === id;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);

    const [tool, setTool] = useState<Tool>('pencil');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [fillColor, setFillColor] = useState('#ffffff');
    const [brushSize, setBrushSize] = useState(3);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Drawing state kept in refs to avoid re-renders during strokes
    const isDrawing = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const undoStack = useRef<ImageData[]>([]);
    const redoStack = useRef<ImageData[]>([]);
    const snapshotBeforeShape = useRef<ImageData | null>(null);

    // --- helpers ---

    const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);
    const getOverlayCtx = useCallback(() => overlayRef.current?.getContext('2d') ?? null, []);

    const saveState = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.current.push(data);
        if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
        redoStack.current = [];
        setCanUndo(true);
        setCanRedo(false);
    }, [getCtx]);

    const restoreState = useCallback((data: ImageData) => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.putImageData(data, 0, 0);
    }, [getCtx]);

    const clearCanvas = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        saveState();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [getCtx, saveState]);

    const undo = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas || undoStack.current.length === 0) return;
        const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        redoStack.current.push(current);
        const prev = undoStack.current.pop()!;
        restoreState(prev);
        setCanUndo(undoStack.current.length > 0);
        setCanRedo(true);
    }, [getCtx, restoreState]);

    const redo = useCallback(() => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas || redoStack.current.length === 0) return;
        const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.current.push(current);
        const next = redoStack.current.pop()!;
        restoreState(next);
        setCanUndo(true);
        setCanRedo(redoStack.current.length > 0);
    }, [getCtx, restoreState]);

    const exportPNG = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'painting.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, []);

    const newCanvas = useCallback(() => {
        clearCanvas();
        undoStack.current = [];
        redoStack.current = [];
        setCanUndo(false);
        setCanRedo(false);
    }, [clearCanvas]);

    // --- flood fill ---

    const floodFill = useCallback((sx: number, sy: number, color: string) => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        saveState();

        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Parse hex color to RGBA
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const idx = (y: number, x: number) => (y * w + x) * 4;
        const startIdx = idx(sy, sx);
        const tr = data[startIdx], tg = data[startIdx + 1], tb = data[startIdx + 2], ta = data[startIdx + 3];

        // Don't fill if same color
        if (tr === r && tg === g && tb === b && ta === 255) return;

        const match = (i: number) =>
            data[i] === tr && data[i + 1] === tg && data[i + 2] === tb && data[i + 3] === ta;

        const queue: [number, number][] = [[sx, sy]];
        const visited = new Uint8Array(w * h);

        while (queue.length > 0) {
            const [cx, cy] = queue.pop()!;
            const vi = cy * w + cx;
            if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
            if (visited[vi]) continue;
            const ci = idx(cy, cx);
            if (!match(ci)) continue;

            visited[vi] = 1;
            data[ci] = r;
            data[ci + 1] = g;
            data[ci + 2] = b;
            data[ci + 3] = 255;

            queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }, [getCtx, saveState]);

    // --- text tool ---

    const handleTextTool = useCallback((x: number, y: number) => {
        const text = prompt('Enter text:');
        if (!text) return;
        const ctx = getCtx();
        if (!ctx) return;
        saveState();
        ctx.fillStyle = strokeColor;
        ctx.font = `${Math.max(brushSize * 4, 14)}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    }, [getCtx, saveState, strokeColor, brushSize]);

    // --- drawing ---

    const clearOverlay = useCallback(() => {
        const octx = getOverlayCtx();
        const overlay = overlayRef.current;
        if (!octx || !overlay) return;
        octx.clearRect(0, 0, overlay.width, overlay.height);
    }, [getOverlayCtx]);

    const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) * (canvas.width / rect.width)),
            y: Math.round((e.clientY - rect.top) * (canvas.height / rect.height)),
        };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);

        if (tool === 'fill') {
            floodFill(x, y, strokeColor);
            return;
        }

        if (tool === 'text') {
            handleTextTool(x, y);
            return;
        }

        isDrawing.current = true;
        startX.current = x;
        startY.current = y;
        lastX.current = x;
        lastY.current = y;

        // Save snapshot for shape preview
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (ctx && canvas) {
            snapshotBeforeShape.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        if (tool === 'pencil' || tool === 'eraser') {
            saveState();
            const ctx = getCtx();
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : strokeColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    }, [tool, getCanvasCoords, floodFill, handleTextTool, getCtx, saveState, strokeColor, brushSize]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        const { x, y } = getCanvasCoords(e);

        if (tool === 'pencil' || tool === 'eraser') {
            const ctx = getCtx();
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(lastX.current, lastY.current);
            ctx.lineTo(x, y);
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : strokeColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            lastX.current = x;
            lastY.current = y;
        } else {
            // Shape preview on overlay canvas
            const octx = getOverlayCtx();
            const overlay = overlayRef.current;
            if (!octx || !overlay) return;
            octx.clearRect(0, 0, overlay.width, overlay.height);
            octx.strokeStyle = strokeColor;
            octx.fillStyle = fillColor;
            octx.lineWidth = brushSize;
            octx.lineCap = 'round';
            octx.lineJoin = 'round';

            if (tool === 'line') {
                octx.beginPath();
                octx.moveTo(startX.current, startY.current);
                octx.lineTo(x, y);
                octx.stroke();
            } else if (tool === 'rectangle') {
                const w = x - startX.current;
                const h = y - startY.current;
                octx.fillRect(startX.current, startY.current, w, h);
                octx.strokeRect(startX.current, startY.current, w, h);
            } else if (tool === 'ellipse') {
                const cx = (startX.current + x) / 2;
                const cy = (startY.current + y) / 2;
                const rx = Math.abs(x - startX.current) / 2;
                const ry = Math.abs(y - startY.current) / 2;
                octx.beginPath();
                octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                octx.fill();
                octx.stroke();
            }
        }
    }, [tool, getCanvasCoords, getCtx, getOverlayCtx, strokeColor, fillColor, brushSize]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const { x, y } = getCanvasCoords(e);

        // Commit shape to main canvas
        if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
            saveState();
            // Restore to pre-shape snapshot (shouldn't have changed, but be safe)
            // Then draw the final shape on the main canvas
            const ctx = getCtx();
            if (!ctx) return;
            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = fillColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (tool === 'line') {
                ctx.beginPath();
                ctx.moveTo(startX.current, startY.current);
                ctx.lineTo(x, y);
                ctx.stroke();
            } else if (tool === 'rectangle') {
                const w = x - startX.current;
                const h = y - startY.current;
                ctx.fillRect(startX.current, startY.current, w, h);
                ctx.strokeRect(startX.current, startY.current, w, h);
            } else if (tool === 'ellipse') {
                const cx = (startX.current + x) / 2;
                const cy = (startY.current + y) / 2;
                const rx = Math.abs(x - startX.current) / 2;
                const ry = Math.abs(y - startY.current) / 2;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            clearOverlay();
        }

        snapshotBeforeShape.current = null;
    }, [tool, getCanvasCoords, getCtx, saveState, clearOverlay, strokeColor, fillColor, brushSize]);

    // --- resize handling ---

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const overlay = overlayRef.current;
        if (!container || !canvas || !overlay) return;

        const resizeCanvas = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;

            // Save current content
            let saved: ImageData | null = null;
            if (canvas.width > 0 && canvas.height > 0) {
                saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }

            canvas.width = w;
            canvas.height = h;
            overlay.width = w;
            overlay.height = h;

            // Fill white then restore content
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            if (saved) {
                ctx.putImageData(saved, 0, 0);
            }
        };

        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(container);
        resizeCanvas();

        return () => observer.disconnect();
    }, []);

    // --- keyboard shortcuts ---

    useEffect(() => {
        if (!isActive) return;
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isActive, undo, redo]);

    // --- menus ---

    const menus = useMemo(() => ({
        File: [
            { title: 'New Canvas', actionId: 'paint-new', shortcut: '\u2318N' },
            { separator: true },
            { title: 'Export as PNG', actionId: 'paint-export', shortcut: '\u2318E' },
        ],
        Edit: [
            { title: 'Undo', actionId: 'paint-undo', shortcut: '\u2318Z' },
            { title: 'Redo', actionId: 'paint-redo', shortcut: '\u21E7\u2318Z' },
            { separator: true },
            { title: 'Clear Canvas', actionId: 'paint-clear' },
        ],
        Tools: [
            { title: 'Pencil', actionId: 'paint-tool-pencil' },
            { title: 'Line', actionId: 'paint-tool-line' },
            { title: 'Rectangle', actionId: 'paint-tool-rectangle' },
            { title: 'Ellipse', actionId: 'paint-tool-ellipse' },
            { title: 'Eraser', actionId: 'paint-tool-eraser' },
            { title: 'Fill', actionId: 'paint-tool-fill' },
            { title: 'Text', actionId: 'paint-tool-text' },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'paint-new': () => newCanvas(),
        'paint-export': () => exportPNG(),
        'paint-undo': () => undo(),
        'paint-redo': () => redo(),
        'paint-clear': () => clearCanvas(),
        'paint-tool-pencil': () => setTool('pencil'),
        'paint-tool-line': () => setTool('line'),
        'paint-tool-rectangle': () => setTool('rectangle'),
        'paint-tool-ellipse': () => setTool('ellipse'),
        'paint-tool-eraser': () => setTool('eraser'),
        'paint-tool-fill': () => setTool('fill'),
        'paint-tool-text': () => setTool('text'),
    }), [newCanvas, exportPNG, undo, redo, clearCanvas]);

    useMenuRegistration(menus, isActive);
    useMenuAction(appId, menuActions, id);

    // --- tool definitions for toolbar ---

    const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
        { id: 'pencil', icon: <IoPencilOutline size={16} />, label: 'Pencil' },
        { id: 'line', icon: <IoRemoveOutline size={16} />, label: 'Line' },
        { id: 'rectangle', icon: <IoSquareOutline size={16} />, label: 'Rectangle' },
        { id: 'ellipse', icon: <IoEllipseOutline size={16} />, label: 'Ellipse' },
        { id: 'eraser', icon: <IoTrashOutline size={16} />, label: 'Eraser' },
        { id: 'fill', icon: <IoColorFillOutline size={16} />, label: 'Fill' },
        { id: 'text', icon: <IoTextOutline size={16} />, label: 'Text' },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-surface select-none">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[--border-color] bg-surface flex-shrink-0 flex-wrap">
                {/* Tool buttons */}
                <div className="flex items-center gap-0.5 mr-2">
                    {tools.map((t) => (
                        <button
                            key={t.id}
                            title={t.label}
                            onClick={() => setTool(t.id)}
                            className={`p-1.5transition-colors ${
                                tool === t.id
                                    ? 'bg-overlay text-[--text-color] shadow-sm'
                                    : 'text-[--text-muted] hover:bg-overlay hover:text-[--text-color]'
                            }`}
                        >
                            {t.icon}
                        </button>
                    ))}
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-[--border-color] mx-1" />

                {/* Stroke color */}
                <div className="flex items-center gap-1 mr-2">
                    <span className="text-[10px] text-[--text-muted] uppercase tracking-wide">Stroke</span>
                    <label className="relative w-6 h-6border border-[--border-color] cursor-pointer overflow-hidden" title="Stroke color">
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(e) => setStrokeColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="w-full h-full rounded" style={{ backgroundColor: strokeColor }} />
                    </label>
                </div>

                {/* Fill color */}
                <div className="flex items-center gap-1 mr-2">
                    <span className="text-[10px] text-[--text-muted] uppercase tracking-wide">Fill</span>
                    <label className="relative w-6 h-6border border-[--border-color] cursor-pointer overflow-hidden" title="Fill color">
                        <input
                            type="color"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="w-full h-full rounded" style={{ backgroundColor: fillColor }} />
                    </label>
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-[--border-color] mx-1" />

                {/* Brush size */}
                <div className="flex items-center gap-1.5 mr-2">
                    <span className="text-[10px] text-[--text-muted] uppercase tracking-wide">Size</span>
                    <input
                        type="range"
                        min={1}
                        max={50}
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-20 h-1 accent-[--text-color] cursor-pointer"
                        title={`${brushSize}px`}
                    />
                    <span className="text-[10px] text-[--text-muted] w-6 text-right tabular-nums">{brushSize}px</span>
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-[--border-color] mx-1" />

                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5 mr-2">
                    <button
                        title="Undo"
                        onClick={undo}
                        disabled={!canUndo}
                        className={`p-1.5transition-colors ${
                            canUndo
                                ? 'text-[--text-muted] hover:bg-overlay hover:text-[--text-color]'
                                : 'text-[--text-muted] opacity-30 cursor-not-allowed'
                        }`}
                    >
                        <IoArrowUndoOutline size={16} />
                    </button>
                    <button
                        title="Redo"
                        onClick={redo}
                        disabled={!canRedo}
                        className={`p-1.5transition-colors ${
                            canRedo
                                ? 'text-[--text-muted] hover:bg-overlay hover:text-[--text-color]'
                                : 'text-[--text-muted] opacity-30 cursor-not-allowed'
                        }`}
                    >
                        <IoArrowRedoOutline size={16} />
                    </button>
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-[--border-color] mx-1" />

                {/* Export */}
                <button
                    title="Export as PNG"
                    onClick={exportPNG}
                    className="p-1.5text-[--text-muted] hover:bg-overlay hover:text-[--text-color] transition-colors"
                >
                    <IoDownloadOutline size={16} />
                </button>
            </div>

            {/* Canvas area */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: 'crosshair' }}>
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        if (isDrawing.current) {
                            isDrawing.current = false;
                            clearOverlay();
                            snapshotBeforeShape.current = null;
                        }
                    }}
                />
                <canvas
                    ref={overlayRef}
                    className="absolute inset-0 pointer-events-none"
                />
            </div>
        </div>
    );
}
