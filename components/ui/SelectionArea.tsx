import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SelectionAreaProps {
    onSelectionChange?: (rect: DOMRect | null) => void;
    onSelectionEnd?: (rect: DOMRect | null) => void;
    containerRef: React.RefObject<HTMLElement>;
    enabled?: boolean;
    zIndex?: number;
}

export const SelectionArea: React.FC<SelectionAreaProps> = ({ onSelectionChange, onSelectionEnd, containerRef, enabled = true, zIndex = 50 }) => {
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number, y: number } | null>(null);
    const isSelectingRef = useRef(false);
    const startPointRef = useRef<{ x: number, y: number } | null>(null);
    const containerRectRef = useRef<DOMRect | null>(null);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (!enabled || !containerRef.current) return;
        if (e.button !== 0) return;

        const target = e.target as HTMLElement;
        const container = containerRef.current;

        if (!container.contains(target)) return;

        const targetWindow = target.closest('.window');
        const containerWindow = container.closest('.window');

        if (targetWindow && targetWindow !== containerWindow) {
            return;
        }

        if (targetWindow && !containerWindow) {
            return;
        }

        if (target !== container && target.closest('[data-no-selection], button, .toolbar, .sidebar, .draggable-area, .window-button, .window-controls, input, textarea, select, a, [contenteditable]')) {
            return;
        }

        e.preventDefault();

        const containerRect = container.getBoundingClientRect();
        containerRectRef.current = containerRect;

        const relX = e.clientX - containerRect.left;
        const relY = e.clientY - containerRect.top;

        startPointRef.current = { x: relX, y: relY };
        setStartPoint({ x: relX, y: relY });
        setCurrentPoint({ x: relX, y: relY });
        isSelectingRef.current = true;
    }, [enabled, containerRef]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isSelectingRef.current || !containerRef.current || !startPointRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        const relX = Math.max(0, Math.min(containerRect.width, e.clientX - containerRect.left));
        const relY = Math.max(0, Math.min(containerRect.height, e.clientY - containerRect.top));

        setCurrentPoint({ x: relX, y: relY });

        const localRect = calculateRect(startPointRef.current, { x: relX, y: relY });

        const screenRect = new DOMRect(
            containerRect.left + localRect.x,
            containerRect.top + localRect.y,
            localRect.width,
            localRect.height
        );

        onSelectionChange?.(screenRect);
    }, [containerRef, onSelectionChange]);

    const handleMouseUp = useCallback(() => {
        if (!isSelectingRef.current || !startPointRef.current) return;

        isSelectingRef.current = false;

        if (startPointRef.current && currentPoint && containerRectRef.current) {
            const localRect = calculateRect(startPointRef.current, currentPoint);
            const containerRect = containerRectRef.current;

            const screenRect = new DOMRect(
                containerRect.left + localRect.x,
                containerRect.top + localRect.y,
                localRect.width,
                localRect.height
            );

            onSelectionEnd?.(screenRect);
        }

        startPointRef.current = null;
        containerRectRef.current = null;
        setStartPoint(null);
        setCurrentPoint(null);
        onSelectionChange?.(null);
    }, [onSelectionChange, onSelectionEnd, currentPoint]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown, true);
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
        };
    }, [enabled, handleMouseDown, handleMouseMove, handleMouseUp]);

    if (!startPoint || !currentPoint) return null;

    const rect = calculateRect(startPoint, currentPoint);

    if (rect.width < 5 && rect.height < 5) return null;

    return (
        <div
            className="absolute bg-blue-500/20 border border-blue-500/50 pointer-events-none"
            style={{
                top: rect.y,
                left: rect.x,
                width: rect.width,
                height: rect.height,
                zIndex: zIndex,
            }}
        />
    );
};

function calculateRect(p1: { x: number, y: number }, p2: { x: number, y: number }): DOMRect {
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const width = Math.abs(p1.x - p2.x);
    const height = Math.abs(p1.y - p2.y);
    return new DOMRect(x, y, width, height);
}
