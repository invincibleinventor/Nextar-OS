'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';

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
      { title: 'Clock', actionId: 'tab-clock' },
      { title: 'Stopwatch', actionId: 'tab-stopwatch' },
      { title: 'Timer', actionId: 'tab-timer' },
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

  return (
    <div className={`flex flex-col h-full bg-[--bg-base] text-[--text-color] overflow-hidden font-mono select-none ${timerDone ? 'animate-pulse' : ''}`}>
      <div className="h-[50px] flex items-center gap-1 px-4 border-b border-[--border-color] bg-surface shrink-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1 text-[13px] font-medium transition-all ${
              tab === t.key ? 'bg-accent text-[--bg-base]' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'
            }`}
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'clock' && (
          <div className="p-8 pt-10">
            <div className="max-w-[640px] mx-auto">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <circle cx="60" cy="60" r="56" fill="none" stroke="var(--border-color)" strokeWidth="1.5" />
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

                <div className="text-center mt-4">
                  <div className="text-2xl font-semibold tracking-wider">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</div>
                  <div className="text-xs text-[--text-muted] mt-1">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3">World Clocks</div>
                  <button onClick={() => setShowPicker(!showPicker)} className="text-[11px] text-accent hover:underline pr-3">{showPicker ? 'Done' : 'Edit'}</button>
                </div>

                {showPicker && (
                  <div className="bg-overlay border border-[--border-color] overflow-hidden">
                    <div className="flex flex-wrap gap-1 p-3">
                      {ZONES.map(z => (
                        <button key={z.id} onClick={() => toggleZone(z.id)}
                          className={`text-[11px] px-2 py-0.5 transition ${selected.includes(z.id) ? 'bg-accent text-[--bg-base]' : 'text-[--text-muted] hover:text-[--text-color] hover:bg-overlay'}`}
                        >{z.label}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-overlay border border-[--border-color] overflow-hidden">
                  {selectedZones.map((z, i) => (
                    <div key={z.id} className={`flex items-center justify-between px-4 py-2.5 ${i < selectedZones.length - 1 ? 'border-b border-[--border-color]' : ''}`}>
                      <span className="text-[13px] font-medium text-[--text-color]">{z.label}</span>
                      <span className="text-[13px] text-pastel-blue font-medium">{fmtShort(now, z.tz)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'stopwatch' && (
          <div className="p-8 pt-10">
            <div className="max-w-[640px] mx-auto">
              <div className="flex flex-col items-center gap-5">
                <div className="text-4xl font-semibold tracking-widest text-pastel-teal">
                  {pad(swMin)}:{pad(swSec)}<span className="text-xl opacity-60">.{pad(swMs)}</span>
                </div>
                <div className="flex gap-3">
                  {!swRunning ? (
                    <button onClick={() => { if (swElapsed === 0) { setSwStart(Date.now()); } else { setSwStart(Date.now() - swElapsed); } setSwRunning(true); }}
                      className="px-5 py-1.5 text-xs bg-pastel-green/15 text-pastel-green hover:bg-pastel-green/25 transition">Start</button>
                  ) : (
                    <>
                      <button onClick={() => setSwRunning(false)}
                        className="px-5 py-1.5 text-xs bg-pastel-red/15 text-pastel-red hover:bg-pastel-red/25 transition">Stop</button>
                      <button onClick={() => setLaps(prev => [swElapsed, ...prev])}
                        className="px-5 py-1.5 text-xs bg-overlay text-[--text-muted] hover:bg-overlay transition border border-[--border-color]">Lap</button>
                    </>
                  )}
                  {!swRunning && swElapsed > 0 && (
                    <button onClick={() => { setSwElapsed(0); setSwRunning(false); setLaps([]); }}
                      className="px-5 py-1.5 text-xs bg-overlay text-[--text-muted] hover:bg-overlay transition border border-[--border-color]">Reset</button>
                  )}
                </div>
              </div>

              {laps.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Laps</div>
                  <div className="bg-overlay border border-[--border-color] overflow-hidden">
                    {laps.map((l, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-xs ${i < laps.length - 1 ? 'border-b border-[--border-color]' : ''}`}>
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

        {tab === 'timer' && (
          <div className="p-8 pt-10">
            <div className="max-w-[640px] mx-auto">
              <div className="flex flex-col items-center gap-5">
                {!timerRunning && timerLeft === 0 ? (
                  <>
                    <div className="bg-overlay border border-[--border-color] overflow-hidden">
                      <div className="flex items-center gap-2 p-4">
                        {[
                          { label: 'h', val: tH, set: setTH, max: 23 },
                          { label: 'm', val: tM, set: setTM, max: 59 },
                          { label: 's', val: tS, set: setTS, max: 59 },
                        ].map(p => (
                          <div key={p.label} className="flex flex-col items-center gap-1">
                            <button onClick={() => p.set(Math.min(p.val + 1, p.max))} className="text-xs text-[--text-muted] hover:text-[--text-color] hover:bg-overlay px-2 py-0.5 transition">+</button>
                            <div className="text-3xl font-semibold w-14 text-center">{pad(p.val)}</div>
                            <button onClick={() => p.set(Math.max(p.val - 1, 0))} className="text-xs text-[--text-muted] hover:text-[--text-color] hover:bg-overlay px-2 py-0.5 transition">-</button>
                            <span className="text-[10px] text-[--text-muted]">{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => {
                      const total = (tH * 3600 + tM * 60 + tS) * 1000;
                      if (total <= 0) return;
                      setTimerTotal(total); setTimerLeft(total); setTimerRunning(true); setTimerDone(false);
                    }} className="px-6 py-1.5 text-xs bg-pastel-green/15 text-pastel-green hover:bg-pastel-green/25 transition">Start</button>
                  </>
                ) : (
                  <>
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-color)" strokeWidth="4" />
                        <circle cx="60" cy="60" r="54" fill="none" className="text-accent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - timerPct)}
                          style={{ transition: 'stroke-dashoffset 0.15s linear' }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-semibold tracking-wider ${timerDone ? 'text-pastel-red' : ''}`}>
                          {pad(timerMin)}:{pad(timerSec)}<span className="text-[13px] opacity-50">.{timerTenth}</span>
                        </span>
                      </div>
                    </div>
                    {timerDone && <div className="text-[13px] text-pastel-red font-medium animate-bounce">Time is up!</div>}
                    <div className="flex gap-3">
                      {timerRunning ? (
                        <button onClick={() => setTimerRunning(false)} className="px-5 py-1.5 text-xs bg-pastel-peach/15 text-pastel-peach hover:bg-pastel-peach/25 transition">Pause</button>
                      ) : (
                        <button onClick={() => { if (timerLeft > 0) { setTimerRunning(true); setTimerDone(false); } }}
                          className="px-5 py-1.5 text-xs bg-pastel-green/15 text-pastel-green hover:bg-pastel-green/25 transition">Resume</button>
                      )}
                      <button onClick={() => { setTimerRunning(false); setTimerLeft(0); setTimerTotal(0); setTimerDone(false); }}
                        className="px-5 py-1.5 text-xs bg-overlay text-[--text-muted] hover:bg-overlay transition border border-[--border-color]">Reset</button>
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
