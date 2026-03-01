'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FaWifi, FaMoon, FaSun, FaBluetoothB } from 'react-icons/fa'
import { BsFillVolumeUpFill, BsSunFill, BsVolumeMuteFill } from 'react-icons/bs'
import { FiBatteryCharging, FiBattery } from 'react-icons/fi'
import { IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack, IoContract, IoPower, IoSettingsSharp, IoExpand } from 'react-icons/io5'
import { MdAirplanemodeActive } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi2'
import { useSettings } from './SettingsContext'
import { useCheerpXSafe } from './CheerpXContext'
import { useTheme } from './ThemeContext'
import { useAuth } from './AuthContext'
import { useMusic } from './MusicContext'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import Image from 'next/image'
import { iselectron, wifi, bluetooth, audio, brightness as brightnessapi, battery, power } from '@/utils/platform'
import { useIsClay } from './hooks/useIsClay'
import { useWindows } from './WindowContext'

/* ─────────────────────────────────────────────
   Control Center — Main Component
   ───────────────────────────────────────────── */

export default function ControlCenter({ onclose, ismobile = false, isopen = true }: { onclose?: () => void, ismobile?: boolean, isopen?: boolean }) {
  const [brightnessval, setbrightnessval] = useState(100)
  const [volumeval, setvolumeval] = useState(100)
  const [ismuted, setismuted] = useState(false)
  const [isfullscreen, setisfullscreen] = useState(false)
  const { theme, toggletheme } = useTheme()
  const { reducemotion } = useSettings()
  const { user, logout } = useAuth()
  const { currenttrack, isplaying, toggle, next, prev } = useMusic()
  const clay = useIsClay()
  const { addwindow } = useWindows()

  const cheerpx = useCheerpXSafe();
  const tailscalestate = cheerpx?.networkState || 'disconnected';
  const tailscaleloginurl = cheerpx?.networkLoginUrl || null;
  const tailscaleconnect = cheerpx?.connectNetwork;

  const [wifistatus, setwifistatus] = useState({ enabled: false, connected: false, ssid: null as string | null })
  const [bluetoothstatus, setbluetoothstatus] = useState({ enabled: false, available: false })
  const [batterystatus, setbatterystatus] = useState({ percentage: 100, charging: false, available: false })
  const [brightnessavailable, setbrightnessavailable] = useState(false)
  const [airplanemode, setairplanemode] = useState(false)

  const fetchsystemstatus = useCallback(async () => {
    if (!iselectron) return;
    try {
      const wifidata = await wifi.getstatus();
      setwifistatus(wifidata);
      const btdata = await bluetooth.getstatus();
      setbluetoothstatus(btdata);
      const audiodata = await audio.getvolume();
      setvolumeval(audiodata.volume);
      setismuted(audiodata.muted);
      const brightnessdata = await brightnessapi.get();
      if (brightnessdata.available) {
        setbrightnessval(brightnessdata.brightness);
        setbrightnessavailable(true);
      }
      const batterydata = await battery.getstatus();
      setbatterystatus(batterydata);
    } catch (e) { }
  }, []);

  useEffect(() => {
    if (isopen) {
      fetchsystemstatus();
      const interval = setInterval(fetchsystemstatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isopen, fetchsystemstatus]);

  useEffect(() => {
    const handlefullscreenchange = () => setisfullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handlefullscreenchange);
    return () => document.removeEventListener('fullscreenchange', handlefullscreenchange);
  }, [])

  const togglefullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { }
  }

  const wifienabled = iselectron ? wifistatus.enabled : tailscalestate === 'connected';
  const wificonnecting = !iselectron && (tailscalestate === 'connecting' || tailscalestate === 'login-ready');
  const wifilabel = iselectron
    ? (wifistatus.enabled ? (wifistatus.ssid || 'Connected') : 'Off')
    : tailscalestate === 'connected' ? 'Tailscale' : tailscalestate === 'login-ready' ? 'Login' : tailscalestate === 'connecting' ? 'Connecting...' : 'Off';

  const togglewifi = async () => {
    if (iselectron) {
      const newstate = !wifistatus.enabled;
      setwifistatus(prev => ({ ...prev, enabled: newstate }));
      await wifi.setenabled(newstate);
      setTimeout(fetchsystemstatus, 1000);
    } else if (tailscaleconnect) {
      if (tailscalestate === 'login-ready' && tailscaleloginurl) window.open(tailscaleloginurl, '_blank');
      else if (tailscalestate !== 'connected' && tailscalestate !== 'connecting') await tailscaleconnect();
    }
  };

  const togglebluetooth = async () => {
    if (!iselectron) return;
    const newstate = !bluetoothstatus.enabled;
    setbluetoothstatus(prev => ({ ...prev, enabled: newstate }));
    await bluetooth.setenabled(newstate);
    setTimeout(fetchsystemstatus, 1000);
  };

  const handlevolume = async (val: number) => {
    setvolumeval(val);
    if (iselectron) await audio.setvolume(val);
  };

  const togglemute = async () => {
    const newmuted = !ismuted;
    setismuted(newmuted);
    if (iselectron) await audio.setmuted(newmuted);
  };

  const handlebrightness = async (val: number) => {
    setbrightnessval(val);
    if (iselectron && brightnessavailable) await brightnessapi.set(val);
  };

  const handlelockscreen = async () => {
    if (iselectron) await power.lock();
    logout();
    if (onclose) onclose();
  };

  const openSettings = () => {
    addwindow({ id: `settings-${Date.now()}`, appname: 'Settings', component: 'apps/Settings', props: {}, isminimized: false, ismaximized: false });
    if (onclose) onclose();
  };

  /* ─── Clay mode tile helper ─── */
  const tileStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
      : { background: 'var(--bg-glass-active)' };

  /* ─── Desktop effects toggle ─── */
  const [desktopeffects, setdesktopeffects] = useState(true);
  const toggledesktopeffects = () => {
    setdesktopeffects(prev => !prev);
    window.dispatchEvent(new Event('toggle-desktop-effects'));
  };

  /* ─── Mobile drag controls (notification drawer pattern) ─── */
  const dragControls = useDragControls();
  const contentscrollref = useRef<HTMLDivElement>(null);
  const handlecontentpointerdown = useCallback((e: React.PointerEvent) => {
    const el = contentscrollref.current;
    if (el && el.scrollTop <= 0) {
      dragControls.start(e);
    }
  }, [dragControls]);

  /* ─── Render inner content ─── */
  const content = clay ? (
    /* ═══════════════════════════════════════════
       CLAY MODE — Redesigned Neo-Glass Control Center
       ═══════════════════════════════════════════ */
    <div
      className={`${ismobile ? 'w-full max-w-[380px] pointer-events-auto' : 'w-full'} p-4 flex flex-col gap-3`}
      onClick={(e) => e.stopPropagation()}
    >

      {/* ── 1. User row ── */}
      <div className="flex items-center gap-3 px-0.5">
        <div className="w-[34px] h-[34px] rounded-full overflow-hidden shrink-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Image src={user?.avatar || '/pfp.png'} alt="User" width={34} height={34} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold text-[--text-color] truncate block">
            {user?.name || 'Guest'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); openSettings(); }}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[--text-muted] hover:text-[--text-color] transition-all active:scale-[0.93]"
          style={{ background: 'var(--bg-glass-active)' }}
        >
          <IoSettingsSharp size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handlelockscreen(); }}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[--text-muted] hover:text-[--text-color] transition-all active:scale-[0.93]"
          style={{ background: 'var(--bg-glass-active)' }}
        >
          <IoPower size={13} />
        </button>
      </div>

      {/* ── 2. Connectivity tiles (2x2) ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* WiFi */}
        <button
          onClick={togglewifi}
          className="rounded-[16px] p-3 flex items-center gap-3 transition-all active:scale-[0.96] cursor-pointer select-none text-left"
          style={wifienabled
            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
            : { background: 'var(--bg-glass-active)' }
          }
        >
          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${wifienabled ? 'bg-white/20' : ''}`}
            style={!wifienabled ? { background: 'var(--bg-glass)' } : undefined}
          >
            <FaWifi size={14} className={wifienabled ? 'text-white' : 'text-[--text-muted]'} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold leading-tight ${wifienabled ? 'text-white' : 'text-[--text-color]'}`}>WiFi</p>
            <p className={`text-[10px] leading-tight mt-0.5 truncate ${wifienabled ? 'text-white/70' : 'text-[--text-muted]'}`}>
              {wificonnecting ? 'Connecting...' : wifilabel}
            </p>
          </div>
        </button>

        {/* Bluetooth */}
        <button
          onClick={togglebluetooth}
          className="rounded-[16px] p-3 flex items-center gap-3 transition-all active:scale-[0.96] cursor-pointer select-none text-left"
          style={bluetoothstatus.enabled
            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
            : { background: 'var(--bg-glass-active)' }
          }
        >
          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${bluetoothstatus.enabled ? 'bg-white/20' : ''}`}
            style={!bluetoothstatus.enabled ? { background: 'var(--bg-glass)' } : undefined}
          >
            <FaBluetoothB size={14} className={bluetoothstatus.enabled ? 'text-white' : 'text-[--text-muted]'} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold leading-tight ${bluetoothstatus.enabled ? 'text-white' : 'text-[--text-color]'}`}>Bluetooth</p>
            <p className={`text-[10px] leading-tight mt-0.5 ${bluetoothstatus.enabled ? 'text-white/70' : 'text-[--text-muted]'}`}>
              {bluetoothstatus.enabled ? 'On' : 'Off'}
            </p>
          </div>
        </button>

        {/* Dark Mode */}
        <button
          onClick={() => toggletheme()}
          className="rounded-[16px] p-3 flex items-center gap-3 transition-all active:scale-[0.96] cursor-pointer select-none text-left"
          style={theme === 'dark'
            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
            : { background: 'var(--bg-glass-active)' }
          }
        >
          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-white/20' : ''}`}
            style={theme !== 'dark' ? { background: 'var(--bg-glass)' } : undefined}
          >
            {theme === 'dark' ? <FaMoon size={14} className="text-white" /> : <FaSun size={14} className="text-[--text-muted]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold leading-tight ${theme === 'dark' ? 'text-white' : 'text-[--text-color]'}`}>Dark Mode</p>
            <p className={`text-[10px] leading-tight mt-0.5 ${theme === 'dark' ? 'text-white/70' : 'text-[--text-muted]'}`}>
              {theme === 'dark' ? 'On' : 'Off'}
            </p>
          </div>
        </button>

        {/* Fullscreen */}
        <button
          onClick={togglefullscreen}
          className="rounded-[16px] p-3 flex items-center gap-3 transition-all active:scale-[0.96] cursor-pointer select-none text-left"
          style={isfullscreen
            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
            : { background: 'var(--bg-glass-active)' }
          }
        >
          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${isfullscreen ? 'bg-white/20' : ''}`}
            style={!isfullscreen ? { background: 'var(--bg-glass)' } : undefined}
          >
            {isfullscreen ? <IoContract size={14} className="text-white" /> : <IoExpand size={14} className="text-[--text-muted]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold leading-tight ${isfullscreen ? 'text-white' : 'text-[--text-color]'}`}>Fullscreen</p>
            <p className={`text-[10px] leading-tight mt-0.5 ${isfullscreen ? 'text-white/70' : 'text-[--text-muted]'}`}>
              {isfullscreen ? 'On' : 'Off'}
            </p>
          </div>
        </button>
      </div>

      {/* ── Airplane Mode + Desktop Effects row ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setairplanemode(!airplanemode)}
          className="rounded-[16px] p-3 flex items-center gap-3 transition-all active:scale-[0.96] cursor-pointer select-none text-left"
          style={airplanemode
            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
            : { background: 'var(--bg-glass-active)' }
          }
        >
          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${airplanemode ? 'bg-white/20' : ''}`}
            style={!airplanemode ? { background: 'var(--bg-glass)' } : undefined}
          >
            <MdAirplanemodeActive size={14} className={airplanemode ? 'text-white' : 'text-[--text-muted]'} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold leading-tight ${airplanemode ? 'text-white' : 'text-[--text-color]'}`}>Airplane</p>
            <p className={`text-[10px] leading-tight mt-0.5 ${airplanemode ? 'text-white/70' : 'text-[--text-muted]'}`}>
              {airplanemode ? 'On' : 'Off'}
            </p>
          </div>
        </button>

        <button
          onClick={toggledesktopeffects}
          className="rounded-[16px] p-3 flex items-center gap-3 transition-all active:scale-[0.96] cursor-pointer select-none text-left"
          style={desktopeffects
            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
            : { background: 'var(--bg-glass-active)' }
          }
        >
          <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${desktopeffects ? 'bg-white/20' : ''}`}
            style={!desktopeffects ? { background: 'var(--bg-glass)' } : undefined}
          >
            <HiSparkles size={14} className={desktopeffects ? 'text-white' : 'text-[--text-muted]'} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold leading-tight ${desktopeffects ? 'text-white' : 'text-[--text-color]'}`}>Effects</p>
            <p className={`text-[10px] leading-tight mt-0.5 ${desktopeffects ? 'text-white/70' : 'text-[--text-muted]'}`}>
              {desktopeffects ? 'Petals' : 'Off'}
            </p>
          </div>
        </button>
      </div>

      {/* ── 3. Display & Sound sliders ── */}
      <div className="rounded-[16px] p-3.5 flex flex-col gap-4" style={{ background: 'var(--bg-glass-active)' }} onPointerDown={(e) => e.stopPropagation()}>
        {/* Brightness */}
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-glass)', boxShadow: 'var(--shadow-xs)' }}
          >
            <BsSunFill size={13} className="text-[--text-muted]" />
          </div>
          <div className="flex-1 relative flex items-center">
            <div className="w-full h-[8px] rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
              <div className="h-full rounded-full transition-all duration-100" style={{ width: `${brightnessval}%`, background: 'var(--accent-gradient)' }} />
            </div>
            <input
              type="range" min="0" max="100" value={brightnessval}
              onChange={(e) => handlebrightness(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[10px] font-bold text-[--text-muted] w-[30px] text-right tabular-nums">{brightnessval}%</span>
        </div>
        {/* Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglemute}
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-all active:scale-[0.93]"
            style={{ background: ismuted ? 'color-mix(in srgb, var(--pastel-red) 20%, var(--bg-glass))' : 'var(--bg-glass)', boxShadow: 'var(--shadow-xs)' }}
          >
            {ismuted
              ? <BsVolumeMuteFill size={13} style={{ color: 'var(--pastel-red)' }} />
              : <BsFillVolumeUpFill size={13} className="text-[--text-muted]" />
            }
          </button>
          <div className="flex-1 relative flex items-center">
            <div className="w-full h-[8px] rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
              <div className="h-full rounded-full transition-all duration-100" style={{
                width: `${ismuted ? 0 : volumeval}%`,
                background: ismuted ? 'var(--pastel-red)' : 'var(--accent-gradient)',
              }} />
            </div>
            <input
              type="range" min="0" max="100" value={ismuted ? 0 : volumeval}
              onChange={(e) => handlevolume(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[10px] font-bold text-[--text-muted] w-[30px] text-right tabular-nums">{ismuted ? '0%' : `${volumeval}%`}</span>
        </div>
      </div>

      {/* ── 4. Now Playing ── */}
      <div
        className="rounded-[16px] overflow-hidden"
        style={{ background: 'var(--bg-glass-active)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Album art banner */}
        <div className="relative h-[56px] overflow-hidden" style={{
          background: currenttrack.cover ? undefined : 'linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 60%, var(--bg-glass)))',
        }}>
          {currenttrack.cover && (
            <Image src={currenttrack.cover} alt="" fill className="object-cover" style={{ filter: 'blur(16px) saturate(1.4)', transform: 'scale(1.3)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, var(--bg-glass-active))' }} />
          {/* Progress bar at bottom of banner */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--bg-glass)' }}>
            <div className="h-full transition-all duration-300" style={{
              width: isplaying ? '60%' : '0%',
              background: 'var(--accent-color)',
            }} />
          </div>
        </div>
        <div className="px-3.5 pb-3 pt-1 flex items-center gap-3">
          <div className="shrink-0 -mt-5 relative">
            <div
              className="w-[44px] h-[44px] rounded-[10px] overflow-hidden"
              style={{ boxShadow: '0 4px 12px -2px rgba(0,0,0,0.2)', border: '2px solid var(--bg-glass-active)' }}
            >
              {currenttrack.cover ? (
                <Image src={currenttrack.cover} alt="" width={44} height={44} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
                  <IoPlay className="text-white/60" size={16} />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[--text-color] truncate leading-tight">
              {currenttrack.title || 'Not Playing'}
            </p>
            <p className="text-[10px] text-[--text-muted] leading-tight mt-0.5">
              {currenttrack.artist || (isplaying ? 'Now Playing' : 'Paused')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prev} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[--text-muted] hover:text-[--text-color] transition-all active:scale-[0.93]">
              <IoPlaySkipBack size={12} />
            </button>
            <button
              onClick={toggle}
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 transition-all active:scale-[0.93]"
              style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}
            >
              {isplaying ? <IoPause size={14} className="text-white" /> : <IoPlay size={14} className="text-white ml-0.5" />}
            </button>
            <button onClick={next} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[--text-muted] hover:text-[--text-color] transition-all active:scale-[0.93]">
              <IoPlaySkipForward size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Battery (only if available) ── */}
      {batterystatus.available && (
        <div className="rounded-[16px] p-3 flex items-center gap-3" style={{
          background: 'var(--bg-glass-active)',
        }}>
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
            style={{
              background: batterystatus.percentage > 20
                ? 'color-mix(in srgb, var(--pastel-green) 25%, var(--bg-glass))'
                : 'color-mix(in srgb, var(--pastel-red) 25%, var(--bg-glass))',
            }}
          >
            {batterystatus.charging
              ? <FiBatteryCharging size={14} style={{ color: batterystatus.percentage > 20 ? 'var(--pastel-green)' : 'var(--pastel-red)' }} />
              : <FiBattery size={14} style={{ color: batterystatus.percentage > 20 ? 'var(--pastel-green)' : 'var(--pastel-red)' }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-[--text-color]">Battery</span>
              <span className="text-[11px] font-semibold text-[--text-muted] tabular-nums">
                {batterystatus.percentage}%{batterystatus.charging ? ' · Charging' : ''}
              </span>
            </div>
            <div className="w-full h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${batterystatus.percentage}%`,
                  background: batterystatus.percentage > 20 ? 'var(--pastel-green)' : 'var(--pastel-red)',
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  ) : (
    /* ═══════════════════════════════════════════
       CLASSIC MODE — kept minimal
       ═══════════════════════════════════════════ */
    <div
      className={`${ismobile ? 'w-full max-w-[360px] pointer-events-auto' : 'w-full'} p-4 flex flex-col gap-3`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* User row */}
      <div className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
        <div className="w-[36px] h-[36px] rounded-full overflow-hidden shrink-0" style={{ border: '1px solid var(--border-color)' }}>
          <Image src={user?.avatar || '/pfp.png'} alt="User" width={36} height={36} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[--text-color] truncate">{user?.name || 'Guest'}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); handlelockscreen(); }} className="text-[11px] font-medium text-[--text-muted] hover:text-[--text-color] px-3 py-1.5 rounded-[8px] transition-all active:scale-[0.97]" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          Logout
        </button>
        <button onClick={(e) => { e.stopPropagation(); handlelockscreen(); }} className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] text-[--text-muted] hover:text-[--text-color] transition-all active:scale-[0.97]" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          <IoPower size={13} />
        </button>
      </div>

      {/* Connectivity grid */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={togglewifi} className="w-full text-left rounded-[14px] p-3 transition-all active:scale-[0.97] cursor-pointer select-none" style={wifienabled ? { background: 'var(--pastel-blue)', border: '1px solid transparent' } : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0" style={wifienabled ? { background: 'rgba(255,255,255,0.25)' } : { background: 'var(--bg-overlay)' }}>
              <FaWifi size={13} className={wifienabled ? 'text-white' : 'text-[--text-color]'} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[12px] font-semibold leading-tight ${wifienabled ? 'text-white' : 'text-[--text-color]'}`}>Internet</p>
              <p className={`text-[10px] truncate leading-tight mt-0.5 ${wifienabled ? 'text-white/70' : 'text-[--text-muted]'}`}>{wifilabel}</p>
            </div>
          </div>
        </button>
        <button onClick={togglebluetooth} className="w-full text-left rounded-[14px] p-3 transition-all active:scale-[0.97] cursor-pointer select-none" style={bluetoothstatus.enabled ? { background: 'var(--pastel-blue)', border: '1px solid transparent' } : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0" style={bluetoothstatus.enabled ? { background: 'rgba(255,255,255,0.25)' } : { background: 'var(--bg-overlay)' }}>
              <FaBluetoothB size={13} className={bluetoothstatus.enabled ? 'text-white' : 'text-[--text-color]'} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[12px] font-semibold leading-tight ${bluetoothstatus.enabled ? 'text-white' : 'text-[--text-color]'}`}>Bluetooth</p>
              <p className={`text-[10px] truncate leading-tight mt-0.5 ${bluetoothstatus.enabled ? 'text-white/70' : 'text-[--text-muted]'}`}>{bluetoothstatus.enabled ? 'On' : 'Off'}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Quick toggles */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={togglefullscreen} className="w-full text-left rounded-[14px] p-2.5 transition-all active:scale-[0.97] cursor-pointer select-none" style={isfullscreen ? { background: 'var(--pastel-blue)', border: '1px solid transparent' } : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0" style={isfullscreen ? { background: 'rgba(255,255,255,0.25)' } : { background: 'var(--bg-overlay)' }}>
              {isfullscreen ? <IoContract size={18} className="text-white" /> : <IoExpand size={18} className="text-[--text-color]" />}
            </div>
            <span className={`text-[10px] font-semibold leading-tight ${isfullscreen ? 'text-white/80' : 'text-[--text-muted]'}`}>Fullscreen</span>
          </div>
        </button>
        <button onClick={() => toggletheme()} className="w-full text-left rounded-[14px] p-2.5 transition-all active:scale-[0.97] cursor-pointer select-none" style={theme === 'dark' ? { background: 'var(--pastel-blue)', border: '1px solid transparent' } : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0" style={theme === 'dark' ? { background: 'rgba(255,255,255,0.25)' } : { background: 'var(--bg-overlay)' }}>
              {theme === 'dark' ? <FaMoon size={16} className="text-white" /> : <FaSun size={16} className="text-[--text-color]" />}
            </div>
            <span className={`text-[10px] font-semibold leading-tight ${theme === 'dark' ? 'text-white/80' : 'text-[--text-muted]'}`}>Dark Mode</span>
          </div>
        </button>
        <button onClick={togglefullscreen} className="w-full text-left rounded-[14px] p-2.5 transition-all active:scale-[0.97] cursor-pointer select-none" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--bg-overlay)' }}>
              <MdAirplanemodeActive size={18} className="text-[--text-color]" />
            </div>
            <span className="text-[10px] font-semibold leading-tight text-[--text-muted]">Airplane</span>
          </div>
        </button>
      </div>

      {/* Now Playing */}
      <div className="rounded-[14px] p-3 transition-all duration-200" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-[10px] shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--pastel-pink), var(--pastel-mauve))', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.12)' }}>
            {currenttrack.cover ? (
              <Image src={currenttrack.cover} alt="" width={50} height={50} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><IoPlay className="text-white/60" size={20} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-[6px] h-[6px] rounded-full inline-block" style={isplaying ? { background: 'var(--pastel-green)' } : { background: 'var(--text-muted)' }} />
              <span className="text-[10px] font-bold tracking-wide" style={isplaying ? { color: 'var(--pastel-green)' } : { color: 'var(--text-muted)' }}>{isplaying ? 'Now Playing' : 'Not Playing'}</span>
            </div>
            <p className="text-[12px] font-semibold text-[--text-color] truncate">{currenttrack.title || 'No Track'}</p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={prev} className="text-[--text-muted] hover:text-[--text-color] transition-colors active:scale-[0.97]"><IoPlaySkipBack size={14} /></button>
              <button onClick={toggle} className="transition-all active:scale-[0.97]">{isplaying ? <IoPause size={18} className="text-[--text-color]" /> : <IoPlay size={18} className="text-[--text-color]" />}</button>
              <button onClick={next} className="text-[--text-muted] hover:text-[--text-color] transition-colors active:scale-[0.97]"><IoPlaySkipForward size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[14px] p-3 transition-all duration-200" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }} onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2.5">
            <BsSunFill size={13} className="text-pastel-yellow" />
            <span className="text-[10px] font-semibold text-[--text-muted]">{brightnessval}%</span>
          </div>
          <input type="range" min="0" max="100" value={brightnessval} onChange={(e) => handlebrightness(Number(e.target.value))} className="w-full appearance-none cursor-pointer h-[5px] rounded-full" style={{ background: `linear-gradient(to right, var(--accent-color) ${brightnessval}%, var(--bg-overlay) ${brightnessval}%)` }} />
        </div>
        <div className="rounded-[14px] p-3 transition-all duration-200" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }} onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2.5">
            <button onClick={togglemute} className="transition-colors active:scale-[0.97]">
              {ismuted ? <BsVolumeMuteFill size={13} style={{ color: 'var(--pastel-red)' }} /> : <BsFillVolumeUpFill size={13} className="text-[--text-color]" />}
            </button>
            <span className="text-[10px] font-semibold text-[--text-muted]">{ismuted ? 'Muted' : `${volumeval}%`}</span>
          </div>
          <input type="range" min="0" max="100" value={ismuted ? 0 : volumeval} onChange={(e) => handlevolume(Number(e.target.value))} className="w-full appearance-none cursor-pointer h-[5px] rounded-full" style={{ background: ismuted ? `linear-gradient(to right, var(--pastel-red) 0%, var(--bg-overlay) 0%)` : `linear-gradient(to right, var(--accent-color) ${volumeval}%, var(--bg-overlay) ${volumeval}%)` }} />
        </div>
      </div>

      {/* Battery */}
      <div className="rounded-[14px] p-3 relative overflow-hidden transition-all duration-200" style={{ background: batterystatus.percentage > 20 ? 'var(--pastel-green)' : 'var(--pastel-red)', border: '1px solid transparent' }}>
        <div className="relative z-[1] flex items-center justify-between">
          <div>
            <p className="text-[22px] font-bold text-white leading-tight">{batterystatus.available ? `${batterystatus.percentage}%` : 'N/A'}</p>
            <p className="text-[10px] font-semibold text-white/70">{batterystatus.charging ? 'Charging' : 'Battery'}</p>
          </div>
          <div className="flex items-center gap-2">
            {batterystatus.charging ? <FiBatteryCharging size={22} className="text-white/50" /> : <FiBattery size={22} className="text-white/50" />}
          </div>
        </div>
      </div>

      {/* Customize */}
      <button onClick={openSettings} className="w-full flex items-center gap-2.5 p-3 cursor-pointer active:scale-[0.97] transition-all duration-200 rounded-[14px]" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}>
        <IoSettingsSharp size={14} className="text-[--text-muted]" />
        <span className="text-[12px] font-medium text-[--text-color]">Customize</span>
      </button>
    </div>
  );

  /* ─── Outer shell — Animated panel ─── */
  return (
    <AnimatePresence>
      {isopen && (
        <>
          {/* Backdrop for mobile — dismisses on click */}
          {ismobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ zIndex: 499 }}
              className={`fixed inset-0 ${clay ? 'bg-black/20 backdrop-blur-sm' : 'bg-black'}`}
              onClick={onclose}
              onPointerDown={(e) => dragControls.start(e)}
            />
          )}

          <motion.div
            key="control-center"
            initial={ismobile
              ? { y: "-100%" }
              : { opacity: 0, scale: 0.95, transformOrigin: "bottom right" }
            }
            animate={ismobile
              ? { y: 0 }
              : { opacity: 1, scale: 1, transformOrigin: "bottom right" }
            }
            exit={ismobile
              ? { y: "-100%" }
              : { opacity: 0, scale: 0.95, transformOrigin: "bottom right" }
            }
            transition={{
              type: reducemotion ? "tween" : "spring",
              stiffness: 300,
              damping: 40,
              mass: 1,
              duration: reducemotion ? 0.2 : undefined,
            }}
            className={`${
              ismobile
                ? 'fixed top-0 left-0 right-0 z-[500] flex flex-col w-full pointer-events-auto'
                : 'w-[340px] block rounded-[24px]'
            } origin-bottom-right overflow-x-hidden z-[500]`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            style={{
              pointerEvents: isopen ? 'auto' : 'none',
              maxHeight: ismobile ? '85vh' : 'calc(100vh - 80px)',
              ...(ismobile ? {} : { overflowY: 'auto' }),
              ...(clay ? {
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(var(--glass-blur-heavy))',
                WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                border: ismobile ? 'none' : '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                ...(ismobile ? { borderRadius: '0 0 28px 28px' } : {}),
              } : ismobile ? {
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '0 0 28px 28px',
              } : {
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }),
            }}
            drag={ismobile ? "y" : false}
            dragControls={ismobile ? dragControls : undefined}
            dragListener={ismobile ? false : undefined}
            dragConstraints={{ top: -1000, bottom: 0 }}
            dragElastic={0.05}
            onDragEnd={(_, info) => {
              if ((info.offset.y < -100 || info.velocity.y < -500) && onclose) onclose();
            }}
          >
            {/* Drag handle for mobile */}
            {ismobile && (
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-[36px] h-[4px] rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
              </div>
            )}
            <div
              ref={contentscrollref}
              onPointerDown={ismobile ? handlecontentpointerdown : undefined}
              className={ismobile ? 'flex-1 min-h-0 overflow-y-auto' : ''}
              style={ismobile ? { touchAction: 'pan-y', overscrollBehavior: 'contain' } : undefined}
            >
              {content}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
