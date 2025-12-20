'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { IoChevronBack, IoChevronForward, IoAddCircleOutline, IoClose, IoTrash } from "react-icons/io5";
import { useDevice } from '../DeviceContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useAppPreferences } from '../AppPreferencesContext';
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
const eventcolors = ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5856D6'];

export default function Calendar({ windowId }: { windowId?: string }) {
    const { ismobile } = useDevice();
    const { getPreference, setPreference } = useAppPreferences();
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

    const EventModal = () => (
        <AnimatePresence>
            {showmodal && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50"
                        onClick={resetmodal}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[320px] bg-white dark:bg-[#2a2a2a] rounded-xl shadow-2xl z-50 p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">{editingevent ? 'Edit Event' : 'New Event'}</h3>
                            <button onClick={resetmodal} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                                <IoClose size={20} />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Event title"
                            value={neweventtitle}
                            onChange={e => setneweventtitle(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-white/10 rounded-lg mb-3 outline-none text-sm"
                            autoFocus
                        />
                        <input
                            type="time"
                            value={neweventtime}
                            onChange={e => setneweventtime(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-white/10 rounded-lg mb-3 outline-none text-sm"
                        />
                        <div className="flex gap-2 mb-4">
                            {eventcolors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setneweventcolor(c)}
                                    className={`w-6 h-6 rounded-full ${neweventcolor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {editingevent && (
                                <button
                                    onClick={() => deleteEvent(editingevent.id)}
                                    className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium flex items-center gap-1"
                                >
                                    <IoTrash size={16} /> Delete
                                </button>
                            )}
                            <button
                                onClick={editingevent ? updateEvent : addEvent}
                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
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
            <div className="h-full w-full bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col font-sf text-black dark:text-white">
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-[34px] font-bold">{monthnames[currentmonth]}</h1>
                        <span className="text-[17px] text-gray-500">{currentyear}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={prevmonth} className="p-2 rounded-full bg-white dark:bg-[#2c2c2e]">
                            <IoChevronBack size={20} className="text-accent" />
                        </button>
                        <button
                            onClick={() => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); }}
                            className="px-4 py-2 rounded-xl bg-accent text-white text-[15px] font-semibold"
                        >
                            Today
                        </button>
                        <button onClick={nextmonth} className="p-2 rounded-full bg-white dark:bg-[#2c2c2e]">
                            <IoChevronForward size={20} className="text-accent" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-4">
                    <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 shadow-sm">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekdays.map(day => (
                                <div key={day} className="text-center text-[12px] font-semibold text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={`aspect-square flex items-center justify-center rounded-full text-[15px] font-medium ${day === null ? '' :
                                        istoday(day) ? 'bg-accent text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'
                                        }`}
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
        <div className="h-full w-full bg-white dark:bg-[#1e1e1e] flex font-sf text-black dark:text-white">
            <div className="w-[240px] border-r border-black/5 dark:border-white/5 bg-neutral-100/80 dark:bg-[#2d2d2d]/80 backdrop-blur-2xl flex flex-col pt-[54px]">
                <div className="px-4 mb-6">
                    <div className="w-full aspect-square bg-white dark:bg-[#363636] rounded-xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col items-center justify-center mb-4">
                        <div className="text-[14px] font-semibold text-[#FF3B30] uppercase mb-1">{today.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-[48px] font-light leading-none tracking-tighter">{today.getDate()}</div>
                    </div>
                </div>

                <div className="space-y-1 px-2 flex-1">
                    <div className="px-3 py-2 bg-black/5 dark:bg-white/10 rounded-lg text-[13px] font-medium flex justify-between items-center cursor-pointer">
                        <span>All Calendars</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex items-center gap-2 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        <span>Personal</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex items-center gap-2 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
                        <span>Work</span>
                    </div>
                </div>

                <div className="p-4 border-t border-black/5 dark:border-white/5">
                    <button
                        onClick={() => openaddmodal(today.getDate())}
                        className="flex items-center gap-2 text-accent text-[13px] font-medium"
                    >
                        <IoAddCircleOutline size={18} />
                        Add Event
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="h-[52px] shrink-0 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={prevmonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                            <IoChevronBack size={18} />
                        </button>
                        <button onClick={nextmonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                            <IoChevronForward size={18} />
                        </button>
                        <span className="font-bold text-[18px]">{monthnames[currentmonth]} {currentyear}</span>
                    </div>
                    <button
                        onClick={() => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); }}
                        className="px-3 py-1 text-[13px] font-medium bg-black/5 dark:bg-white/10 rounded-lg hover:bg-black/10 dark:hover:bg-white/15"
                    >
                        Today
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-7 border-l border-t border-black/10 dark:border-white/10">
                        {weekdays.map(day => (
                            <div key={day} className="text-center py-2 text-[12px] font-semibold text-gray-500 border-r border-b border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#252525]">
                                {day}
                            </div>
                        ))}
                        {days.map((day, i) => {
                            const dayevents = day ? geteventsforday(day) : [];
                            return (
                                <div
                                    key={i}
                                    className={`min-h-[80px] p-2 border-r border-b border-black/10 dark:border-white/10 ${day === null ? 'bg-gray-50 dark:bg-[#252525]' : 'hover:bg-gray-50 dark:hover:bg-[#252525] cursor-pointer'
                                        }`}
                                    onDoubleClick={() => day && openaddmodal(day)}
                                >
                                    {day && (
                                        <>
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-medium ${istoday(day) ? 'bg-accent text-white' : ''
                                                }`}>
                                                {day}
                                            </span>
                                            <div className="mt-1 space-y-1">
                                                {dayevents.slice(0, 2).map(ev => (
                                                    <div
                                                        key={ev.id}
                                                        onClick={(e) => { e.stopPropagation(); openeditmodal(ev); }}
                                                        className="text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                                                        style={{ backgroundColor: ev.color + '20', color: ev.color }}
                                                    >
                                                        {ev.time && <span className="font-semibold">{ev.time} </span>}{ev.title}
                                                    </div>
                                                ))}
                                                {dayevents.length > 2 && (
                                                    <div className="text-[10px] text-gray-500">+{dayevents.length - 2} more</div>
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
