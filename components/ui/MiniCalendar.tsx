'use client';
import React from 'react';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard } from '../hooks/useClayStyles';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniCalendar() {
    const clay = useIsClay();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className={`select-none ${clay ? 'p-2' : ''}`}>
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                    <div key={d} className={`text-center text-[10px] font-bold text-[--text-muted] py-1 ${clay ? 'opacity-60' : ''}`}>
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {cells.map((day, i) => (
                    <div key={i} className="flex items-center justify-center py-[3px]">
                        {day !== null ? (
                            <div
                                className={`w-[26px] h-[26px] flex items-center justify-center text-[12px] font-semibold rounded-full transition-all ${
                                    day === today
                                        ? 'bg-accent text-[--bg-base] font-bold'
                                        : clay
                                            ? 'text-[--text-color] hover:bg-[--bg-glass-hover]'
                                            : 'text-[--text-color]'
                                }`}
                            >
                                {day}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
