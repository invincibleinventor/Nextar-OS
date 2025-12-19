import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SelectionAreaProps {
    onSelectionChange?: (rect: DOMRect | null) => void;
    onSelectionEnd?: (rect: DOMRect | null) => void;
    containerRef: React.RefObject<HTMLElement>;
    enabled?: boolean;
}

export const SelectionArea: React.FC<SelectionAreaProps> = ({ onSelectionChange, onSelectionEnd, containerRef, enabled = true }) => {
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number, y: number } | null>(null);
    const isSelectingRef = useRef(false);
    const startPointRef = useRef<{ x: number, y: number } | null>(null);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (!enabled || !containerRef.current) return;

        const target = e.target as HTMLElement;
        if (
            target.closest('button') ||
            target.closest('.clickable-item') ||
            target.closest('.finder-item') ||
            target.closest('.desktop-item') ||
            target.closest('[data-no-selection]') ||
            target.closest('.toolbar') ||
            target.closest('.sidebar') ||
            target.closest('.window') ||
            target.closest('.draggable-area') ||
            target.closest('[data-window-id]')
        ) return;

        const container = containerRef.current;
        if (!container.contains(target)) return;

        const containerRect = container.getBoundingClientRect();
        const relX = e.clientX - containerRect.left + container.scrollLeft;
        const relY = e.clientY - containerRect.top + container.scrollTop;

        startPointRef.current = { x: relX, y: relY };
        setStartPoint({ x: relX, y: relY });
        setCurrentPoint({ x: relX, y: relY });
        isSelectingRef.current = true;
    }, [enabled, containerRef]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isSelectingRef.current || !containerRef.current || !startPointRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const relX = e.clientX - containerRect.left + container.scrollLeft;
        const relY = e.clientY - containerRect.top + container.scrollTop;

        setCurrentPoint({ x: relX, y: relY });

        const rect = calculateRect(startPointRef.current, { x: relX, y: relY });
        onSelectionChange?.(rect);
    }, [containerRef, onSelectionChange]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!isSelectingRef.current || !containerRef.current || !startPointRef.current) return;

        isSelectingRef.current = false;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const relX = e.clientX - containerRect.left + container.scrollLeft;
        const relY = e.clientY - containerRect.top + container.scrollTop;

        const rect = calculateRect(startPointRef.current, { x: relX, y: relY });
        onSelectionEnd?.(rect);

        startPointRef.current = null;
        setStartPoint(null);
        setCurrentPoint(null);
        onSelectionChange?.(null);
    }, [containerRef, onSelectionChange, onSelectionEnd]);

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
            className="absolute z-[50] bg-blue-500/20 border border-blue-500/50 pointer-events-none"
            style={{
                top: rect.y,
                left: rect.x,
                width: rect.width,
                height: rect.height,
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
