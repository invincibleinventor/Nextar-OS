'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassButton, insetWell, clayClasses } from '../hooks/useClayStyles';
import { LuClock, LuTimer, LuAlarmClock } from 'react-icons/lu';

const ZONES = [
  { id: 'ny', label: 'New York', tz: 'America/New_York' },
  { id: 'lon', label: 'London', tz: 'Europe/London' },
  { id: 'tok', label: 'Tokyo', tz: 'Asia/Tokyo' },
  { id: 'syd', label: 'Sydney', tz: 'Australia/Sydney' },
  { id: 'par', label: 'Paris', tz: 'Europe/Paris' },
  { id: 'dub', label: 'Dubai', tz: 'Asia/Dubai' },
  { id: 'sg', label: 'Singapore', tz: 'Asia/Singapore' },
  { id: 'la', label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { id: 'chi', label: 'Chicago', tz: 'America/Chicago' },
  { id: 'ber', label: 'Berlin', tz: 'Europe/Berlin' },
];

const LS_KEY = 'clock-world-zones';
const DEFAULT_ZONES = ['ny', 'lon', 'tok', 'syd'];

function fmtTime(d: Date, tz: string) {
  return d.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function fmtShort(d: Date, tz: string) {
  return d.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
}

function pad(n: number, d = 2) { return String(n).padStart(d, '0'); }

export default function Clock({ appId = 'clock', id }: { appId?: string; id?: string }) {
  const { activewindow } = useWindows();
  const isActive = activewindow === id;
  const clay = useIsClay();

  const [tab, setTab] = useState<'clock' | 'stopwatch' | 'timer'>('clock');
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ZONES;
    try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : DEFAULT_ZONES; } catch { return DEFAULT_ZONES; }
  });
  const [showPicker, setShowPicker] = useState(false);

  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0);
  const [swStart, setSwStart] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  const [tH, setTH] = useState(0);
  const [tM, setTM] = useState(5);
  const [tS, setTS] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!swRunning) return;
    const iv = setInterval(() => setSwElapsed(Date.now() - swStart), 16);
    return () => clearInterval(iv);
  }, [swRunning, swStart]);

  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => {
      setTimerLeft(prev => {
        if (prev <= 100) { setTimerRunning(false); setTimerDone(true); return 0; }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerDone) return;
    const t = setTimeout(() => setTimerDone(false), 3000);
    return () => clearTimeout(t);
  }, [timerDone]);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(selected)); }, [selected]);

  const toggleZone = useCallback((zId: string) => {
    setSelected(prev => prev.includes(zId) ? prev.filter(z => z !== zId) : [...prev, zId]);
  }, []);

  const menus = useMemo(() => ({
    View: [
      { title: 'Clock', actionId: 'tab-clock', icon: <LuClock size={14} /> },
      { title: 'Stopwatch', actionId: 'tab-stopwatch', icon: <LuTimer size={14} /> },
      { title: 'Timer', actionId: 'tab-timer', icon: <LuAlarmClock size={14} /> },
    ],
  }), []);

  const actions = useMemo(() => ({
    'tab-clock': () => setTab('clock'),
    'tab-stopwatch': () => setTab('stopwatch'),
    'tab-timer': () => setTab('timer'),
  }), []);

  useMenuRegistration(menus, isActive);
  useMenuAction(appId, actions, id);

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours() % 12;
  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = hr * 30 + min * 0.5;

  const swMin = Math.floor(swElapsed / 60000);
  const swSec = Math.floor((swElapsed % 60000) / 1000);
  const swMs = Math.floor((swElapsed % 1000) / 10);

  const timerPct = timerTotal > 0 ? timerLeft / timerTotal : 0;
  const timerMin = Math.floor(timerLeft / 60000);
  const timerSec = Math.floor((timerLeft % 60000) / 1000);
  const timerTenth = Math.floor((timerLeft % 1000) / 100);
  const circumference = 2 * Math.PI * 54;

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'clock', label: 'Clock' },
    { key: 'stopwatch', label: 'Stopwatch' },
    { key: 'timer', label: 'Timer' },
  ];

  const selectedZones = ZONES.filter(z => selected.includes(z.id));

  // Glass card style for inner containers (no blur — parent window already blurs)
  const cardStyle = clay ? glassCard : undefined;
  const cardClass = clay
    ? 'rounded-[16px] overflow-hidden'
    : 'bg-overlay border border-[--border-color] overflow-hidden';

  return (
    <div className={`flex flex-col h-full text-[--text-color] overflow-hidden select-none ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'} ${timerDone ? 'animate-pulse' : ''}`}>
      {/* Tab bar */}
      <div className={`h-[50px] flex items-center gap-1 px-4 shrink-0 ${clay
        ? 'border-b border-[--glass-border]'
        : 'border-b border-[--border-color] bg-surface'}`}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-[13px] font-medium transition-all ${clay
              ? `rounded-[12px] ${tab === t.key ? 'text-white' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-glass-hover]'}`
              : `${tab === t.key ? 'bg-accent text-[--bg-base]' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`}`}
            style={tab === t.key && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ===== CLOCK TAB ===== */}
        {tab === 'clock' && (
          <div className="p-8 pt-10">
            <div className="max-w-[640px] mx-auto">
              {/* Analog clock */}
              <div className="flex flex-col items-center mb-8">
                <div className={`relative w-44 h-44 ${clay ? 'p-2' : ''}`}
                  style={clay ? { boxShadow: 'var(--shadow-md)', borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--glass-border)' } : undefined}
                >
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <circle cx="60" cy="60" r="56" fill="none" stroke={clay ? 'var(--glass-border)' : 'var(--border-color)'} strokeWidth="1.5" />
                    {[...Array(12)].map((_, i) => {
                      const a = (i * 30 - 90) * (Math.PI / 180);
                      const x1 = 60 + 48 * Math.cos(a), y1 = 60 + 48 * Math.sin(a);
                      const x2 = 60 + 53 * Math.cos(a), y2 = 60 + 53 * Math.sin(a);
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />;
                    })}
                    <line x1="60" y1="60" x2="60" y2="28" stroke="var(--text-color)" strokeWidth="2.5" strokeLinecap="round"
                      transform={`rotate(${hrDeg} 60 60)`} />
                    <line x1="60" y1="60" x2="60" y2="18" stroke="var(--text-color)" strokeWidth="1.5" strokeLinecap="round"
                      transform={`rotate(${minDeg} 60 60)`} />
                    <line x1="60" y1="65" x2="60" y2="14" className="text-accent" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"
                      transform={`rotate(${secDeg} 60 60)`} />
                    <circle cx="60" cy="60" r="2" className="fill-accent" />
                  </svg>
                </div>

                <div className="text-center mt-5">
                  <div className={`font-semibold tracking-wider ${clay ? 'text-3xl' : 'text-2xl'}`}>
                    {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
                  </div>
                  <div className="text-xs text-[--text-muted] mt-1.5">
                    {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* World Clocks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className={`text-[11px] uppercase font-semibold text-[--text-muted] ${clay ? 'tracking-wide' : ''}`}>World Clocks</div>
                  <button onClick={() => setShowPicker(!showPicker)}
                    className={`text-[11px] font-medium text-accent ${clay ? 'active:scale-[0.97]' : 'hover:underline'}`}>
                    {showPicker ? 'Done' : 'Edit'}
                  </button>
                </div>

                {showPicker && (
                  <div className={cardClass} style={cardStyle}>
                    <div className="flex flex-wrap gap-1.5 p-3">
                      {ZONES.map(z => (
                        <button key={z.id} onClick={() => toggleZone(z.id)}
                          className={`text-[11px] px-2.5 py-1 transition-all ${clay ? 'rounded-[10px] active:scale-[0.97]' : ''} ${selected.includes(z.id)
                            ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]')
                            : 'text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-glass-hover]'}`}
                          style={selected.includes(z.id) && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >{z.label}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={cardClass} style={cardStyle}>
                  {selectedZones.map((z, i) => (
                    <div key={z.id} className={`flex items-center justify-between px-4 py-3 ${i < selectedZones.length - 1
                      ? clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'
                      : ''}`}>
                      <span className="text-[13px] font-medium text-[--text-color]">{z.label}</span>
                      <span className="text-[13px] text-pastel-blue font-medium">{fmtShort(now, z.tz)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STOPWATCH TAB ===== */}
        {tab === 'stopwatch' && (
          <div className="p-8 pt-10">
            <div className="max-w-[640px] mx-auto">
              <div className="flex flex-col items-center gap-6">
                {/* Stopwatch display */}
                <div className={clay ? 'px-8 py-6 rounded-[16px]' : ''}
                  style={clay ? insetWell : undefined}
                >
                  <div className={`font-semibold tracking-widest text-pastel-teal ${clay ? 'text-5xl' : 'text-4xl'}`}>
                    {pad(swMin)}:{pad(swSec)}<span className={`opacity-60 ${clay ? 'text-2xl' : 'text-xl'}`}>.{pad(swMs)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!swRunning ? (
                    <button onClick={() => { if (swElapsed === 0) { setSwStart(Date.now()); } else { setSwStart(Date.now() - swElapsed); } setSwRunning(true); }}
                      className={`px-5 py-2 text-xs font-medium transition-all ${clay ? 'rounded-[12px] active:scale-95' : ''}`}
                      style={{ background: 'color-mix(in srgb, var(--pastel-green) 15%, transparent)', color: 'var(--pastel-green)' }}
                    >Start</button>
                  ) : (
                    <>
                      <button onClick={() => setSwRunning(false)}
                        className={`px-5 py-2 text-xs font-medium transition-all ${clay ? 'rounded-[12px] active:scale-95' : ''}`}
                        style={{ background: 'color-mix(in srgb, var(--pastel-red) 15%, transparent)', color: 'var(--pastel-red)' }}
                      >Stop</button>
                      <button onClick={() => setLaps(prev => [swElapsed, ...prev])}
                        className={`px-5 py-2 text-xs font-medium text-[--text-muted] transition-all ${clay ? 'rounded-[12px] active:scale-95 hover:bg-[--bg-glass-hover]' : 'bg-overlay border border-[--border-color] hover:bg-overlay'}`}
                        style={clay ? glassButton : undefined}
                      >Lap</button>
                    </>
                  )}
                  {!swRunning && swElapsed > 0 && (
                    <button onClick={() => { setSwElapsed(0); setSwRunning(false); setLaps([]); }}
                      className={`px-5 py-2 text-xs font-medium text-[--text-muted] transition-all ${clay ? 'rounded-[12px] active:scale-95 hover:bg-[--bg-glass-hover]' : 'bg-overlay border border-[--border-color] hover:bg-overlay'}`}
                      style={clay ? glassButton : undefined}
                    >Reset</button>
                  )}
                </div>
              </div>

              {laps.length > 0 && (
                <div className="mt-8 space-y-2">
                  <div className={`text-[11px] uppercase font-semibold text-[--text-muted] px-1 mb-2 ${clay ? 'tracking-wide' : ''}`}>Laps</div>
                  <div className={cardClass} style={cardStyle}>
                    {laps.map((l, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-xs ${i < laps.length - 1
                        ? clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'
                        : ''}`}>
                        <span className="text-[13px] font-medium text-[--text-muted]">Lap {laps.length - i}</span>
                        <span className="text-[13px] text-pastel-peach font-medium">{pad(Math.floor(l / 60000))}:{pad(Math.floor((l % 60000) / 1000))}.{pad(Math.floor((l % 1000) / 10))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TIMER TAB ===== */}
        {tab === 'timer' && (
          <div className="p-8 pt-10">
            <div className="max-w-[640px] mx-auto">
              <div className="flex flex-col items-center gap-6">
                {!timerRunning && timerLeft === 0 ? (
                  <>
                    <div className={cardClass} style={cardStyle}>
                      <div className="flex items-center gap-3 p-5">
                        {[
                          { label: 'h', val: tH, set: setTH, max: 23 },
                          { label: 'm', val: tM, set: setTM, max: 59 },
                          { label: 's', val: tS, set: setTS, max: 59 },
                        ].map(p => (
                          <div key={p.label} className="flex flex-col items-center gap-1.5">
                            <button onClick={() => p.set(Math.min(p.val + 1, p.max))}
                              className={`text-xs text-[--text-muted] hover:text-[--text-color] px-2 py-1 transition ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>+</button>
                            <div className="text-3xl font-semibold w-14 text-center text-[--text-color]">{pad(p.val)}</div>
                            <button onClick={() => p.set(Math.max(p.val - 1, 0))}
                              className={`text-xs text-[--text-muted] hover:text-[--text-color] px-2 py-1 transition ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>-</button>
                            <span className="text-[10px] text-[--text-muted]">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => {
                      const total = (tH * 3600 + tM * 60 + tS) * 1000;
                      if (total <= 0) return;
                      setTimerTotal(total); setTimerLeft(total); setTimerRunning(true); setTimerDone(false);
                    }}
                      className={`px-5 py-2 text-xs font-medium transition-all ${clay ? 'rounded-[12px] active:scale-95' : ''}`}
                      style={{ background: 'color-mix(in srgb, var(--pastel-green) 15%, transparent)', color: 'var(--pastel-green)' }}
                    >Start</button>
                  </>
                ) : (
                  <>
                    <div className={`relative w-40 h-40 ${clay ? 'p-1' : ''}`}
                      style={clay ? { boxShadow: 'var(--shadow-md)', borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--glass-border)' } : undefined}
                    >
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="54" fill="none" stroke={clay ? 'var(--glass-border)' : 'var(--border-color)'} strokeWidth="4" />
                        <circle cx="60" cy="60" r="54" fill="none" className="text-accent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - timerPct)}
                          style={{ transition: 'stroke-dashoffset 0.15s linear' }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-semibold tracking-wider ${timerDone ? 'text-pastel-red' : 'text-[--text-color]'}`}>
                          {pad(timerMin)}:{pad(timerSec)}<span className="text-[13px] opacity-50">.{timerTenth}</span>
                        </span>
                      </div>
                    </div>
                    {timerDone && <div className="text-[13px] text-pastel-red font-medium animate-bounce">Time is up!</div>}
                    <div className="flex gap-3">
                      {timerRunning ? (
                        <button onClick={() => setTimerRunning(false)}
                          className={`px-5 py-2 text-xs font-medium transition-all ${clay ? 'rounded-[12px] active:scale-95' : ''}`}
                          style={{ background: 'color-mix(in srgb, var(--pastel-peach) 15%, transparent)', color: 'var(--pastel-peach)' }}
                        >Pause</button>
                      ) : (
                        <button onClick={() => { if (timerLeft > 0) { setTimerRunning(true); setTimerDone(false); } }}
                          className={`px-5 py-2 text-xs font-medium transition-all ${clay ? 'rounded-[12px] active:scale-95' : ''}`}
                          style={{ background: 'color-mix(in srgb, var(--pastel-green) 15%, transparent)', color: 'var(--pastel-green)' }}
                        >Resume</button>
                      )}
                      <button onClick={() => { setTimerRunning(false); setTimerLeft(0); setTimerTotal(0); setTimerDone(false); }}
                        className={`px-5 py-2 text-xs font-medium text-[--text-muted] transition-all ${clay ? 'rounded-[12px] active:scale-95 hover:bg-[--bg-glass-hover]' : 'bg-overlay border border-[--border-color] hover:bg-overlay'}`}
                        style={clay ? glassButton : undefined}
                      >Reset</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
