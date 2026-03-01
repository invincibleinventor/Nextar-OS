'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { IoChevronBack, IoChevronForward, IoAddCircleOutline, IoClose, IoTrash } from "react-icons/io5";
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useAppPreferences } from '../AppPreferencesContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassButton, glassInput, glassSidebar, insetWell, clayClasses } from '../hooks/useClayStyles';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    time?: string;
    color: string;
}

const monthnames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const eventcolors = ['#8aadf4', '#a6da95', '#ed8796', '#f5a97f', '#c6a0f6', '#b7bdf8'];

export default function Calendar({ windowId }: { windowId?: string }) {
    const { ismobile } = useDevice();
    const { activewindow } = useWindows();
    const { getPreference, setPreference } = useAppPreferences();
    const clay = useIsClay();
    const today = new Date();
    const [currentmonth, setcurrentmonth] = useState(today.getMonth());
    const [currentyear, setcurrentyear] = useState(today.getFullYear());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [showmodal, setshowmodal] = useState(false);
    const [selectedday, setselectedday] = useState<number | null>(null);
    const [editingevent, seteditingevent] = useState<CalendarEvent | null>(null);
    const [neweventtitle, setneweventtitle] = useState('');
    const [neweventtime, setneweventtime] = useState('');
    const [neweventcolor, setneweventcolor] = useState(eventcolors[0]);

    useEffect(() => {
        const saved = getPreference('calendar', 'events', []);
        setEvents(saved);
    }, []);

    const saveEvents = (newEvents: CalendarEvent[]) => {
        setEvents(newEvents);
        setPreference('calendar', 'events', newEvents);
    };

    const addEvent = () => {
        if (!neweventtitle.trim() || selectedday === null) return;
        const datestr = `${currentyear}-${String(currentmonth + 1).padStart(2, '0')}-${String(selectedday).padStart(2, '0')}`;
        const newEvent: CalendarEvent = {
            id: `event-${Date.now()}`,
            title: neweventtitle.trim(),
            date: datestr,
            time: neweventtime || undefined,
            color: neweventcolor
        };
        saveEvents([...events, newEvent]);
        resetmodal();
    };

    const updateEvent = () => {
        if (!editingevent || !neweventtitle.trim()) return;
        const updated = events.map(e =>
            e.id === editingevent.id ? { ...e, title: neweventtitle.trim(), time: neweventtime || undefined, color: neweventcolor } : e
        );
        saveEvents(updated);
        resetmodal();
    };

    const deleteEvent = (id: string) => {
        saveEvents(events.filter(e => e.id !== id));
        resetmodal();
    };

    const resetmodal = () => {
        setshowmodal(false);
        setselectedday(null);
        seteditingevent(null);
        setneweventtitle('');
        setneweventtime('');
        setneweventcolor(eventcolors[0]);
    };

    const openaddmodal = (day: number) => {
        setselectedday(day);
        seteditingevent(null);
        setneweventtitle('');
        setneweventtime('');
        setneweventcolor(eventcolors[0]);
        setshowmodal(true);
    };

    const openeditmodal = (event: CalendarEvent) => {
        seteditingevent(event);
        setneweventtitle(event.title);
        setneweventtime(event.time || '');
        setneweventcolor(event.color);
        setshowmodal(true);
    };

    const geteventsforday = (day: number) => {
        const datestr = `${currentyear}-${String(currentmonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === datestr);
    };

    const getdaysinmonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getfirstdayofmonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const prevmonth = () => {
        if (currentmonth === 0) {
            setcurrentmonth(11);
            setcurrentyear(currentyear - 1);
        } else {
            setcurrentmonth(currentmonth - 1);
        }
    };

    const nextmonth = () => {
        if (currentmonth === 11) {
            setcurrentmonth(0);
            setcurrentyear(currentyear + 1);
        } else {
            setcurrentmonth(currentmonth + 1);
        }
    };

    const daysinmonth = getdaysinmonth(currentmonth, currentyear);
    const firstday = getfirstdayofmonth(currentmonth, currentyear);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstday; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysinmonth; i++) {
        days.push(i);
    }

    const istoday = (day: number | null) => {
        if (!day) return false;
        return day === today.getDate() && currentmonth === today.getMonth() && currentyear === today.getFullYear();
    };

    const gotoday = () => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); };

    const menuActions = useMemo(() => ({
        'today': gotoday,
        'prev-month': prevmonth,
        'next-month': nextmonth,
        'new-event': () => openaddmodal(today.getDate())
    }), [currentmonth, currentyear]);

    useMenuAction('calendar', menuActions, windowId);

    useEffect(() => {
        if (!windowId) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (showmodal) { e.preventDefault(); resetmodal(); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, activewindow, showmodal]);

    const EventModal = () => (
        <AnimatePresence>
            {showmodal && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-50 ${clay ? 'bg-black/30 backdrop-blur-sm' : 'bg-black/40'}`}
                        onClick={resetmodal}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[340px] z-50 p-5 ${clay
                            ? 'rounded-[28px]'
                            : 'bg-surface border border-[--border-color] shadow-pastel-lg'
                        }`}
                        style={clay ? {
                            background: 'var(--bg-glass)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur))',
                            border: '1px solid var(--glass-border)',
                            boxShadow: 'var(--shadow-xl)',
                        } : undefined}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-[15px] text-[--text-color]">{editingevent ? 'Edit Event' : 'New Event'}</h3>
                            <button onClick={resetmodal} className={`p-1.5 transition-all ${clay ? 'rounded-[10px] active:scale-90 hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                <IoClose size={18} className="text-[--text-color]" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Event title"
                            value={neweventtitle}
                            onChange={e => setneweventtitle(e.target.value)}
                            className={`w-full px-4 py-2.5 mb-3 outline-none text-[13px] text-[--text-color] placeholder:text-[--text-muted] ${clay
                                ? 'rounded-[12px]'
                                : 'bg-overlay border border-[--border-color]'
                            }`}
                            style={clay ? glassInput : undefined}
                            autoFocus
                        />
                        <input
                            type="time"
                            value={neweventtime}
                            onChange={e => setneweventtime(e.target.value)}
                            className={`w-full px-4 py-2.5 mb-3 outline-none text-[13px] text-[--text-color] ${clay
                                ? 'rounded-[12px]'
                                : 'bg-overlay border border-[--border-color]'
                            }`}
                            style={clay ? glassInput : undefined}
                        />
                        <div className={`flex gap-2.5 mb-4 ${clay ? 'px-1' : ''}`}>
                            {eventcolors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setneweventcolor(c)}
                                    className={`w-7 h-7 transition-all ${clay
                                        ? `rounded-full ${neweventcolor === c ? 'scale-110' : 'scale-100 hover:scale-105'}`
                                        : neweventcolor === c ? 'ring-2 ring-offset-2 ring-accent' : ''
                                    }`}
                                    style={{
                                        backgroundColor: c,
                                        ...(clay ? {
                                            boxShadow: neweventcolor === c ? `0 0 0 3px var(--bg-surface), 0 0 0 5px ${c}` : 'var(--shadow-xs)',
                                        } : {}),
                                    }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2.5">
                            {editingevent && (
                                <button
                                    onClick={() => deleteEvent(editingevent.id)}
                                    className={`px-4 py-2.5 text-pastel-red text-[13px] font-medium flex items-center gap-1.5 transition-all ${clay
                                        ? 'rounded-[12px] active:scale-95'
                                        : ''
                                    }`}
                                    style={clay
                                        ? { ...glassButton, background: 'color-mix(in srgb, var(--pastel-red) 10%, var(--bg-glass))' }
                                        : { background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' }}
                                >
                                    <IoTrash size={15} /> Delete
                                </button>
                            )}
                            <button
                                onClick={editingevent ? updateEvent : addEvent}
                                className={`flex-1 px-4 py-2.5 text-[13px] font-semibold transition-all ${clay
                                    ? 'rounded-[12px] active:scale-[0.97] text-white'
                                    : 'bg-accent text-[--bg-base]'
                                }`}
                                style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                {editingevent ? 'Update' : 'Add Event'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    if (ismobile) {
        return (
            <div className={`h-full w-full bg-[--bg-base] flex flex-col text-[--text-color] ${clay ? '' : 'font-mono'}`}>
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-[34px] font-bold text-[--text-color]">{monthnames[currentmonth]}</h1>
                        <span className="text-[17px] text-[--text-muted]">{currentyear}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={prevmonth} className={`p-2 ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-surface border border-[--border-color]'}`}
                            style={clay ? glassButton : undefined}
                        >
                            <IoChevronBack size={20} className="text-[--text-color]" />
                        </button>
                        <button
                            onClick={() => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); }}
                            className={`px-4 py-2 text-[15px] font-semibold ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--bg-base]'}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            Today
                        </button>
                        <button onClick={nextmonth} className={`p-2 ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-surface border border-[--border-color]'}`}
                            style={clay ? glassButton : undefined}
                        >
                            <IoChevronForward size={20} className="text-[--text-color]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-4">
                    <div className={`p-4 ${clay ? 'rounded-[16px]' : 'bg-surface border border-[--border-color]'}`}
                        style={clay ? glassCard : undefined}
                    >
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekdays.map(day => (
                                <div key={day} className="text-center text-[12px] font-semibold text-[--text-muted]">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={`aspect-square flex items-center justify-center text-[15px] font-medium ${clay ? 'rounded-[10px]' : ''} ${day === null ? '' :
                                        istoday(day)
                                            ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]')
                                            : 'hover:bg-[--bg-glass-hover] text-[--text-color]'
                                        }`}
                                    style={istoday(day) && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full w-full flex text-[--text-color] ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'}`}>
            {/* Sidebar */}
            <div className={`w-[240px] flex flex-col pt-5 ${clay
                ? ''
                : 'border-r border-[--border-color] bg-surface anime-gradient-top'
            }`}
                style={clay ? glassSidebar : undefined}
            >
                <div className="px-5 mb-6">
                    <div className={`w-full aspect-square flex flex-col items-center justify-center ${clay
                        ? 'rounded-[18px]'
                        : 'bg-overlay border border-[--border-color]'
                    }`}
                        style={clay ? glassCard : undefined}
                    >
                        <div className="text-[13px] font-semibold text-pastel-red uppercase tracking-wider mb-1">{today.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-[52px] font-light leading-none tracking-tighter text-[--text-color]">{today.getDate()}</div>
                    </div>
                </div>

                <div className="space-y-1 px-3 flex-1">
                    <div className={`px-3 py-2.5 text-[13px] font-medium flex justify-between items-center cursor-pointer text-[--text-color] ${clay
                        ? 'rounded-[12px]'
                        : 'bg-overlay'
                    }`}
                        style={clay ? insetWell : undefined}
                    >
                        <span>All Calendars</span>
                    </div>
                    <div className={`px-3 py-2.5 text-[13px] text-[--text-muted] flex items-center gap-2.5 cursor-pointer transition-all ${clay
                        ? 'rounded-[12px] hover:bg-[--bg-glass-hover]'
                        : 'hover:bg-overlay'
                    }`}>
                        <span className={`w-2.5 h-2.5 bg-accent ${clay ? 'rounded-full' : ''}`} />
                        <span>Personal</span>
                    </div>
                    <div className={`px-3 py-2.5 text-[13px] text-[--text-muted] flex items-center gap-2.5 cursor-pointer transition-all ${clay
                        ? 'rounded-[12px] hover:bg-[--bg-glass-hover]'
                        : 'hover:bg-overlay'
                    }`}>
                        <span className={`w-2.5 h-2.5 bg-pastel-green ${clay ? 'rounded-full' : ''}`} />
                        <span>Work</span>
                    </div>
                </div>

                <div className={`p-4 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                    <button
                        onClick={() => openaddmodal(today.getDate())}
                        className={`flex items-center gap-2 text-accent text-[13px] font-semibold transition-all ${clay ? 'active:scale-95' : ''}`}
                    >
                        <IoAddCircleOutline size={18} />
                        Add Event
                    </button>
                </div>
            </div>

            {/* Main area */}
            <div className={`flex-1 flex flex-col ${clay ? 'bg-[--bg-base]' : ''}`}>
                <div className={`h-[52px] shrink-0 flex items-center justify-between px-6 ${clay
                    ? 'border-b border-[--glass-border]'
                    : 'border-b border-[--border-color]'
                }`}>
                    <div className="flex items-center gap-3">
                        <button onClick={prevmonth} className={`p-1.5 text-[--text-color] transition-all ${clay ? 'rounded-[8px] active:scale-90 hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                            <IoChevronBack size={16} />
                        </button>
                        <button onClick={nextmonth} className={`p-1.5 text-[--text-color] transition-all ${clay ? 'rounded-[8px] active:scale-90 hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                            <IoChevronForward size={16} />
                        </button>
                        <span className="font-bold text-[18px] text-[--text-color] ml-1">{monthnames[currentmonth]} {currentyear}</span>
                    </div>
                    <button
                        onClick={() => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); }}
                        className={`px-4 py-1.5 text-[13px] font-semibold text-[--text-color] transition-all ${clay
                            ? 'rounded-[12px] active:scale-95'
                            : 'bg-overlay hover:bg-surface'
                        }`}
                        style={clay ? glassButton : undefined}
                    >
                        Today
                    </button>
                </div>

                <div className={`flex-1 overflow-y-auto ${clay ? 'p-5' : 'p-6'}`}>
                    <div className={`grid grid-cols-7 ${clay ? 'gap-[2px]' : 'border-l border-t border-[--border-color]'}`}>
                        {weekdays.map(day => (
                            <div key={day} className={`text-center py-2.5 text-[11px] font-semibold text-[--text-muted] uppercase tracking-wider ${clay
                                ? ''
                                : 'border-r border-b border-[--border-color] bg-overlay'
                            }`}>
                                {day}
                            </div>
                        ))}
                        {days.map((day, i) => {
                            const dayevents = day ? geteventsforday(day) : [];
                            return (
                                <div
                                    key={i}
                                    className={`min-h-[80px] p-2 transition-all ${clay
                                        ? `rounded-[10px] ${day === null ? 'opacity-30' : 'cursor-pointer hover:bg-[--bg-glass-hover]'}`
                                        : `border-r border-b border-[--border-color] ${day === null ? 'bg-overlay' : 'hover:bg-surface cursor-pointer'}`
                                    }`}
                                    onDoubleClick={() => day && openaddmodal(day)}
                                >
                                    {day && (
                                        <>
                                            <span className={`inline-flex items-center justify-center w-7 h-7 text-[13px] font-medium ${clay
                                                ? `rounded-full ${istoday(day) ? 'text-white' : 'text-[--text-color]'}`
                                                : istoday(day) ? 'bg-pastel-red text-[--bg-base]' : 'text-[--text-color]'
                                            }`}
                                                style={clay && istoday(day) ? { background: 'var(--pastel-red)', boxShadow: '0 2px 8px color-mix(in srgb, var(--pastel-red) 40%, transparent)' } : undefined}
                                            >
                                                {day}
                                            </span>
                                            <div className="mt-1 space-y-1">
                                                {dayevents.slice(0, 2).map(ev => (
                                                    <div
                                                        key={ev.id}
                                                        onClick={(e) => { e.stopPropagation(); openeditmodal(ev); }}
                                                        className={`text-[11px] px-1.5 py-0.5 truncate cursor-pointer hover:opacity-80 ${clay ? 'rounded-[6px]' : ''}`}
                                                        style={{ backgroundColor: ev.color + '20', color: ev.color }}
                                                    >
                                                        {ev.time && <span className="font-semibold">{ev.time} </span>}{ev.title}
                                                    </div>
                                                ))}
                                                {dayevents.length > 2 && (
                                                    <div className="text-[10px] text-[--text-muted]">+{dayevents.length - 2} more</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <EventModal />
        </div>
    );
}
