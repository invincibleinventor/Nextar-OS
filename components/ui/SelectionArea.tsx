
import React, { useState, useEffect, useRef } from 'react';

interface SelectionAreaProps {
    onSelectionChange?: (rect: DOMRect | null) => void;
    onSelectionEnd?: (rect: DOMRect | null) => void;
    containerRef: React.RefObject<HTMLElement>;
    enabled?: boolean;
}

export const SelectionArea: React.FC<SelectionAreaProps> = ({ onSelectionChange, onSelectionEnd, containerRef, enabled = true }) => {
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number, y: number } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const container = containerRef.current;

        const handleMouseDown = (e: MouseEvent) => {
            if (e.target !== container) return;
            if (
                (e.target as HTMLElement).closest('button') ||
                (e.target as HTMLElement).closest('.clickable-item') ||
                (e.target as HTMLElement).closest('.finder-item') ||
                (e.target as HTMLElement).closest('.desktop-item')
            ) return;

            const containerRect = container.getBoundingClientRect();
            const relX = e.clientX - containerRect.left + container.scrollLeft;
            const relY = e.clientY - containerRect.top + container.scrollTop;

            setStartPoint({ x: relX, y: relY });
            setCurrentPoint({ x: relX, y: relY });
            setIsSelecting(true);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isSelecting) return;

            const containerRect = container.getBoundingClientRect();
            const relX = e.clientX - containerRect.left + container.scrollLeft;
            const relY = e.clientY - containerRect.top + container.scrollTop;

            setCurrentPoint({ x: relX, y: relY });

            if (startPoint) {
                const rect = calculateRect(startPoint, { x: relX, y: relY });
                onSelectionChange?.(rect);
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isSelecting) return;
            setIsSelecting(false);

            const containerRect = container.getBoundingClientRect();
            const relX = e.clientX - containerRect.left + container.scrollLeft;
            const relY = e.clientY - containerRect.top + container.scrollTop;

            if (startPoint) {
                const rect = calculateRect(startPoint, { x: relX, y: relY });
                onSelectionEnd?.(rect);
            }
            setStartPoint(null);
            setCurrentPoint(null);
            onSelectionChange?.(null);
        };

        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [enabled, isSelecting, startPoint, containerRef, onSelectionChange, onSelectionEnd]);

    if (!isSelecting || !startPoint || !currentPoint) return null;

    const rect = calculateRect(startPoint, currentPoint);

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
