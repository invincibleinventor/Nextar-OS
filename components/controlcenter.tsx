'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FaWifi, FaMoon, FaSun, FaBluetoothB } from 'react-icons/fa'
import { BsFillVolumeUpFill, BsSunFill, BsVolumeMuteFill } from 'react-icons/bs'
import { FiBatteryCharging, FiBattery } from 'react-icons/fi'
import { IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack, IoContract, IoPower, IoSettingsSharp, IoExpand, IoFlashlight, IoCamera, IoCalculator, IoStopwatch } from 'react-icons/io5'
import { MdAirplanemodeActive } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi2'
import { FaPlane } from 'react-icons/fa'
import { BsFillGridFill } from 'react-icons/bs'
import { BiSignal5 } from 'react-icons/bi'
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
  const [focusmode, setfocusmode] = useState(false)
  const [flashlight, setflashlight] = useState(false)

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
      className={`${ismobile ? 'w-full sm:max-w-[380px] sm:mx-auto pointer-events-auto' : 'w-full'} p-4 flex flex-col gap-3`}
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
       CLASSIC MODE — Original layout
       ═══════════════════════════════════════════ */
    ismobile ? (
      <div className="w-full max-w-[340px] mx-auto pointer-events-auto px-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-overlay border border-[--border-color] p-3 grid grid-cols-2 grid-rows-2 gap-2 aspect-square">
            <div className="flex items-center justify-center bg-accent aspect-square">
              <FaPlane className="text-[--bg-base]" size={18} />
            </div>
            <div className="flex items-center justify-center bg-pastel-green aspect-square">
              <BiSignal5 className="text-[--bg-base]" size={18} />
            </div>
            <div onClick={togglewifi} className={`flex items-center justify-center aspect-square cursor-pointer active:scale-95 transition-all ${wifienabled ? 'bg-pastel-blue' : wificonnecting ? 'bg-pastel-yellow' : 'bg-[--border-color]'}`}>
              <FaWifi className={wifienabled ? 'text-[--bg-base]' : wificonnecting ? 'text-[--bg-base]' : 'text-[--text-color]'} size={18} />
            </div>
            <div onClick={togglebluetooth} className={`flex items-center justify-center aspect-square cursor-pointer active:scale-95 transition-all ${bluetoothstatus.enabled ? 'bg-pastel-blue' : 'bg-[--border-color]'}`}>
              <FaBluetoothB className={bluetoothstatus.enabled ? 'text-[--bg-base]' : 'text-[--text-color]'} size={18} />
            </div>
          </div>
          <div className="bg-overlay border border-[--border-color] p-3 flex flex-col justify-between aspect-square">
            <div className='flex items-center justify-center flex-1'>
              <div className='text-center w-full px-2 overflow-hidden'>
                <p className="text-[--text-color] text-[13px] font-medium truncate">{isplaying ? currenttrack.title : 'Not Playing'}</p>
                <p className="text-[--text-muted] text-[10px] truncate">{isplaying ? currenttrack.artist : 'Music'}</p>
              </div>
            </div>
            <div className="flex justify-center items-center gap-4 text-[--text-color] pb-1">
              <button onClick={prev} className="opacity-60 active:opacity-100"><IoPlaySkipBack size={18} /></button>
              <button onClick={toggle} className="opacity-80 active:opacity-100">{isplaying ? <IoPause size={24} /> : <IoPlay size={24} />}</button>
              <button onClick={next} className="opacity-60 active:opacity-100"><IoPlaySkipForward size={18} /></button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-overlay border border-[--border-color] p-3 flex items-center justify-center">
              <div className="bg-[--border-color] p-3"><BsFillGridFill className="text-[--text-color]" size={18} /></div>
            </div>
            <div onClick={() => setfocusmode(!focusmode)} className={`bg-overlay border border-[--border-color] p-3 flex items-center justify-center cursor-pointer active:scale-95 transition-all ${focusmode ? 'border-pastel-mauve' : ''}`}>
              <div className={`p-3 ${focusmode ? 'bg-pastel-mauve' : 'bg-[--border-color]'}`}><FaMoon className={focusmode ? 'text-[--bg-base]' : 'text-[--text-color]'} size={18} /></div>
            </div>
          </div>
          <div onClick={togglefullscreen} className={`bg-overlay border border-[--border-color] p-3 h-full flex items-center justify-center cursor-pointer active:scale-95 transition-all ${isfullscreen ? 'border-pastel-green' : ''}`}>
            <div className='flex flex-col items-center gap-1 text-[--text-color]'>
              {isfullscreen ? <IoContract size={20} /> : <IoExpand size={20} />}
              <span className='text-[10px]'>{isfullscreen ? 'Exit' : 'Full Screen'}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid grid-cols-2 gap-3 h-36" onPointerDown={(e) => e.stopPropagation()}>
            <CCSlider value={brightnessval} onchange={handlebrightness} icon={BsSunFill} />
            <CCSlider value={volumeval} onchange={handlevolume} icon={ismuted ? BsVolumeMuteFill : BsFillVolumeUpFill} onIconClick={togglemute} />
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-36">
            <div onClick={() => setflashlight(!flashlight)} className={`bg-overlay border border-[--border-color] flex items-center justify-center active:scale-95 transition-all cursor-pointer ${flashlight ? 'border-pastel-yellow' : ''}`}>
              <IoFlashlight className={`${flashlight ? 'text-pastel-yellow' : 'text-[--text-color]'}`} size={24} />
            </div>
            <div className="bg-overlay border border-[--border-color] flex items-center justify-center"><IoStopwatch className="text-[--text-color]" size={24} /></div>
            <div className="bg-overlay border border-[--border-color] flex items-center justify-center"><IoCalculator className="text-[--text-color]" size={24} /></div>
            <div className="bg-overlay border border-[--border-color] flex items-center justify-center"><IoCamera className="text-[--text-color]" size={24} /></div>
          </div>
        </div>
        <div onClick={toggletheme} className="bg-overlay border border-[--border-color] p-4 flex items-center justify-center transition-colors gap-3 cursor-pointer">
          {theme == 'light' ? <FaSun className='text-[--text-color]' size={20} /> : <FaMoon className="text-[--text-color]" size={20} />}
          <span className="text-[--text-color] font-medium">Switch Theme</span>
        </div>
        <div className="bg-overlay border border-[--border-color] p-4 flex items-center gap-3">
          <div className="w-12 h-12 overflow-hidden border-2 border-[--border-color] shrink-0">
            <Image src={user?.avatar || '/pfp.png'} alt="User" width={48} height={48} className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[--text-color] font-semibold truncate">{user?.name || 'Guest'}</div>
            <div className="text-[--text-muted] text-xs">@{user?.username || 'guest'}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handlelockscreen(); }} className="px-4 py-2 bg-pastel-red/20 text-pastel-red text-[13px] font-medium active:bg-pastel-red/30">Lock</button>
        </div>
      </div>
    ) : (
      <div className="p-4 space-y-4 w-full" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-2 gap-4">
          <div className='grid h-max grid-rows-3 gap-2' onPointerDown={(e) => e.stopPropagation()}>
            <div onClick={togglewifi} className={`p-3 ${wifienabled ? 'bg-pastel-blue/20' : wificonnecting ? 'bg-pastel-yellow/20' : 'bg-overlay'} border border-[--border-color] flex space-x-2 items-center cursor-pointer active:scale-95 transition-all`}>
              <div className={`p-[10px] ${wifienabled ? 'bg-pastel-blue' : wificonnecting ? 'bg-pastel-yellow' : 'bg-[--border-color]'}`}>
                <FaWifi className={wifienabled ? 'text-[--bg-base]' : wificonnecting ? 'text-[--bg-base]' : 'text-[--text-color]'} size={16} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[--text-color]">Wi-Fi</p>
                <p className="text-[12px] text-[--text-muted] truncate">{wifilabel}</p>
              </div>
            </div>
            <div onClick={togglebluetooth} className={`p-3 ${bluetoothstatus.enabled ? 'bg-pastel-blue/20' : 'bg-overlay'} border border-[--border-color] flex space-x-2 items-center cursor-pointer active:scale-95 transition-all`}>
              <div className={`p-[10px] ${bluetoothstatus.enabled ? 'bg-pastel-blue' : 'bg-[--border-color]'}`}>
                <FaBluetoothB className={bluetoothstatus.enabled ? 'text-[--bg-base]' : 'text-[--text-color]'} size={16} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[--text-color]">Bluetooth</p>
                <p className="text-[12px] text-[--text-muted] truncate">{bluetoothstatus.enabled ? 'On' : 'Off'}</p>
              </div>
            </div>
            <div onClick={togglefullscreen} className={`p-3 ${isfullscreen ? 'bg-pastel-green/20' : 'bg-overlay'} border border-[--border-color] flex space-x-2 items-center cursor-pointer active:scale-95 transition-all`}>
              <div className={`p-[10px] ${isfullscreen ? 'bg-pastel-green' : 'bg-[--border-color]'}`}>
                {isfullscreen ? <IoContract className="text-[--bg-base]" size={16} /> : <IoExpand className="text-[--text-color]" size={16} />}
              </div>
              <div><p className="text-[13px] font-semibold text-[--text-color]">Full Screen</p></div>
            </div>
          </div>
          <div className='grid grid-rows-1 gap-2' onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex flex-col justify-between bg-overlay border border-[--border-color] p-3 px-0 h-full">
              <div className="flex flex-col px-4">
                <div className="w-10 h-10 mr-auto bg-gradient-to-br from-pastel-pink to-pastel-mauve mb-2"></div>
                <div className="overflow-hidden">
                  <p className="text-[13px] font-semibold text-[--text-color] truncate">{isplaying ? currenttrack.title : 'Not Playing'}</p>
                  <p className="text-[11px] text-[--text-muted] truncate">{isplaying ? currenttrack.artist : 'Music'}</p>
                </div>
              </div>
              <div className="flex px-4 items-center space-x-3 justify-end mt-1">
                <button onClick={prev} className="text-[--text-color] opacity-60 hover:opacity-100"><IoPlaySkipBack size={18} /></button>
                <button onClick={toggle} className="text-[--text-color] opacity-80 hover:opacity-100">{isplaying ? <IoPause size={24} /> : <IoPlay size={24} />}</button>
                <button onClick={next} className="text-[--text-color] opacity-60 hover:opacity-100"><IoPlaySkipForward size={18} /></button>
              </div>
            </div>
            <div onClick={() => toggletheme()} className="p-3 bg-overlay border border-[--border-color] flex space-x-2 items-center cursor-pointer h-min self-end">
              <div className='p-[10px] bg-[--border-color]'>
                {theme == 'light' && <FaSun className='text-[--text-color]' size={16} />}
                {theme == 'dark' && <FaMoon className="text-[--text-color]" size={16} />}
              </div>
              <p className="text-[13px] font-semibold text-[--text-color] capitalize">{theme}<br /> Mode</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <div className='px-5 py-4 bg-overlay border border-[--border-color]' onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-[--text-color] mb-2">Display</p>
            <div className="relative flex items-center h-7">
              <div className="absolute left-0 w-6 h-6 flex items-center justify-center"><BsSunFill size={16} className="text-[--text-color]" /></div>
              <input type="range" min="0" max="100" value={brightnessval} onChange={(e) => handlebrightness(Number(e.target.value))}
                className="w-full ml-10 mr-5 h-1 appearance-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:-mt-[6px] [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bottom-1 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-pastel-red"
                style={{ background: `linear-gradient(to right, var(--pastel-red) ${brightnessval}%, var(--border-color) ${brightnessval}%)` }}
              />
            </div>
          </div>
          <div className='px-5 py-4 bg-overlay border border-[--border-color]' onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[--text-color]">Sound</p>
              <button onClick={togglemute} className="text-xs text-[--text-muted] hover:text-[--text-color]">{ismuted ? 'Unmute' : 'Mute'}</button>
            </div>
            <div className="relative flex items-center h-7">
              <div className="absolute left-0 w-6 h-6 flex items-center justify-center">
                {ismuted ? <BsVolumeMuteFill size={16} className="text-pastel-red" /> : <BsFillVolumeUpFill size={16} className="text-[--text-color]" />}
              </div>
              <input type="range" min="0" max="100" value={volumeval} onChange={(e) => handlevolume(Number(e.target.value))}
                className="w-full ml-10 mr-5 h-1 appearance-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:-mt-[6px] [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bottom-1 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-pastel-red"
                style={{ background: `linear-gradient(to right, var(--pastel-red) ${volumeval}%, var(--border-color) ${volumeval}%)` }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center bg-overlay border border-[--border-color] w-max px-5 py-3">
          <div className="flex items-center space-x-2">
            {batterystatus.charging ? <FiBatteryCharging size={20} className="text-pastel-green" /> : <FiBattery size={20} className="text-[--text-color]" />}
            <div className='flex flex-col'>
              <p className="text-[11px] font-normal text-[--text-muted]">Battery</p>
              <p className="text-[12px] font-semibold text-[--text-color]">{batterystatus.available ? `${batterystatus.percentage}%` : 'N/A'}{batterystatus.charging && <span className="text-pastel-green ml-1">⚡</span>}</p>
            </div>
          </div>
        </div>
      </div>
    )
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
                : `w-[340px] block ${clay ? 'rounded-[24px]' : ''}`
            } origin-bottom-right overflow-x-hidden z-[500]`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            style={{
              pointerEvents: isopen ? 'auto' : 'none',
              maxHeight: ismobile ? '85vh' : 'calc(100vh - 80px)',
              ...(ismobile ? {} : { overflowY: 'auto' }),
              ...(clay ? {
                background: ismobile ? 'color-mix(in srgb, var(--bg-glass) 70%, transparent)' : 'var(--bg-glass)',
                backdropFilter: 'blur(var(--glass-blur-heavy))',
                WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                border: ismobile ? 'none' : '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                ...(ismobile ? { borderRadius: '0 0 28px 28px' } : {}),
              } : ismobile ? {
                background: 'rgba(var(--bg-surface-rgb, 255,255,255), 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
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

/* ─── Vertical slider for classic mobile CC ─── */
const CCSlider = ({ value, onchange, icon: Icon, onIconClick }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isdragging, setisdragging] = useState(false);

  const handlepointerdown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setisdragging(true);
    updatevalue(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlepointermove = (e: React.PointerEvent) => {
    if (isdragging) {
      e.preventDefault();
      e.stopPropagation();
      updatevalue(e);
    }
  };

  const handlepointerup = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setisdragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const updatevalue = (e: React.PointerEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((rect.bottom - e.clientY) / rect.height) * 100));
    onchange(percentage);
  };

  return (
    <div
      ref={ref}
      className={`relative w-full h-36 bg-[--bg-base] border border-[--border-color] overflow-hidden flex flex-col justify-end cursor-ns-resize touch-none ${isdragging ? 'scale-[0.98]' : ''} transition-transform`}
      onPointerDown={handlepointerdown}
      onPointerMove={handlepointermove}
      onPointerUp={handlepointerup}
      onPointerCancel={handlepointerup}
    >
      <div className="absolute bottom-0 w-full bg-pastel-pink transition-all duration-75 ease-out" style={{ height: `${value}%` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-between py-4 z-10 pointer-events-none">
        <div />
        <div className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onIconClick) onIconClick(); }}>
          <Icon size={24} className={`transition-colors ${value > 50 ? 'text-[--bg-base]' : 'text-[--text-color]'}`} />
        </div>
      </div>
    </div>
  );
};
