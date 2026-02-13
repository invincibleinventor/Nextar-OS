'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FaWifi, FaMoon, FaSun, FaBluetoothB, FaPlane } from 'react-icons/fa'
import { BsFillVolumeUpFill, BsSunFill, BsFillGridFill, BsVolumeMuteFill } from 'react-icons/bs'
import { FiBatteryCharging, FiBattery } from 'react-icons/fi'
import { IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack, IoFlashlight, IoCamera, IoCalculator, IoStopwatch, IoExpand, IoContract, IoPower, IoRefresh } from 'react-icons/io5'
import { BiSignal5 } from "react-icons/bi";
import { useSettings } from './SettingsContext'
import { useCheerpXSafe } from './CheerpXContext'
import { useTheme } from './ThemeContext'
import { useAuth } from './AuthContext'
import { useMusic } from './MusicContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { iselectron, wifi, bluetooth, audio, brightness as brightnessapi, battery, power } from '@/utils/platform'

export default function ControlCenter({ onclose, ismobile = false, isopen = true }: { onclose?: () => void, ismobile?: boolean, isopen?: boolean }) {
  const [brightnessval, setbrightnessval] = useState(100)
  const [volumeval, setvolumeval] = useState(100)
  const [ismuted, setismuted] = useState(false)
  const [focusmode, setfocusmode] = useState(false)
  const [flashlight, setflashlight] = useState(false)
  const [isfullscreen, setisfullscreen] = useState(false)
  const { theme, toggletheme } = useTheme()
  const { reducemotion, reducetransparency } = useSettings()
  const { user, logout } = useAuth()
  const { currenttrack, isplaying, toggle, next, prev } = useMusic()

  const cheerpx = useCheerpXSafe();
  const tailscalestate = cheerpx?.networkState || 'disconnected';
  const tailscaleloginurl = cheerpx?.networkLoginUrl || null;
  const tailscaleconnect = cheerpx?.connectNetwork;

  const [wifistatus, setwifistatus] = useState({ enabled: false, connected: false, ssid: null as string | null })
  const [bluetoothstatus, setbluetoothstatus] = useState({ enabled: false, available: false })
  const [batterystatus, setbatterystatus] = useState({ percentage: 100, charging: false, available: false })
  const [brightnessavailable, setbrightnessavailable] = useState(false)

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
    const handlefullscreenchange = () => {
      setisfullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handlefullscreenchange)
    return () => document.removeEventListener('fullscreenchange', handlefullscreenchange)
  }, [])

  const togglefullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch { }
  }

  const wifienabled = iselectron ? wifistatus.enabled : tailscalestate === 'connected';
  const wificonnecting = !iselectron && (tailscalestate === 'connecting' || tailscalestate === 'login-ready');
  const wifilabel = iselectron
    ? (wifistatus.enabled ? (wifistatus.ssid || 'On') : 'Off')
    : tailscalestate === 'connected' ? 'Tailscale' : tailscalestate === 'login-ready' ? 'Login Required' : tailscalestate === 'connecting' ? 'Connecting...' : 'Off';

  const togglewifi = async () => {
    if (iselectron) {
      const newstate = !wifistatus.enabled;
      setwifistatus(prev => ({ ...prev, enabled: newstate }));
      await wifi.setenabled(newstate);
      setTimeout(fetchsystemstatus, 1000);
    } else if (tailscaleconnect) {
      if (tailscalestate === 'login-ready' && tailscaleloginurl) {
        window.open(tailscaleloginurl, '_blank');
      } else if (tailscalestate !== 'connected' && tailscalestate !== 'connecting') {
        await tailscaleconnect();
      }
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
    if (iselectron) {
      await audio.setvolume(val);
    }
  };

  const togglemute = async () => {
    const newmuted = !ismuted;
    setismuted(newmuted);
    if (iselectron) {
      await audio.setmuted(newmuted);
    }
  };

  const handlebrightness = async (val: number) => {
    setbrightnessval(val);
    if (iselectron && brightnessavailable) {
      await brightnessapi.set(val);
    }
  };

  const handlelockscreen = async () => {
    if (iselectron) {
      await power.lock();
    }
    logout();
    if (onclose) onclose();
  };

  return (
    <AnimatePresence>
      {isopen && (
        <>
          {ismobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[500]"
              onClick={onclose}
              style={{ pointerEvents: isopen ? 'auto' : 'none' }}
            />
          )}

          <motion.div
            key="control-center"
            initial={ismobile ? { y: "-100%" } : { opacity: 0, scale: 0.95, transformOrigin: "top right" }}
            animate={ismobile ? { y: "0%" } : { opacity: 1, scale: 1, transformOrigin: "top right" }}
            exit={ismobile ? { y: "-100%" } : { opacity: 0, scale: 0.95, transformOrigin: "top right" }}
            transition={{
              type: reducemotion ? "tween" : "spring",
              stiffness: reducemotion ? undefined : 300,
              damping: reducemotion ? undefined : 40,
              mass: 1,
              duration: reducemotion ? 0.2 : undefined
            }}
            className={`${ismobile
              ? `fixed inset-0 w-full h-full flex items-center justify-center pt-10`
              : `bg-surface border-2 border-[--border-color] w-[320px] fixed top-14 right-4 block anime-glow`}
                   font-mono origin-top-right  overflow-y-auto z-[500]` }
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
            style={{
              pointerEvents: isopen ? 'auto' : 'none',
              ...(ismobile ? { backgroundColor: 'var(--bg-surface)' } : {})
            }}
            drag={ismobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -100 && onclose) {
                onclose();
              }
            }}
          >
            <div className={`${ismobile ? 'w-full max-w-[340px] pointer-events-auto' : 'w-full pointer-events-auto'}`} onClick={(e) => e.stopPropagation()}>
              {ismobile ? (
                <div className="w-full px-4 space-y-4">

                  <div className="grid grid-cols-2 gap-3">

                    <div className="bg-overlay border border-[--border-color] p-3 grid grid-cols-2 grid-rows-2 gap-2 aspect-square">
                      <div className="flex items-center justify-center bg-accent aspect-square">
                        <FaPlane className="text-[--bg-base]" size={18} />
                      </div>
                      <div className="flex items-center justify-center bg-pastel-green aspect-square">
                        <BiSignal5 className="text-[--bg-base]" size={18} />
                      </div>
                      <div
                        onClick={togglewifi}
                        className={`flex items-center justify-center aspect-square cursor-pointer active:scale-95 transition-all ${wifienabled ? 'bg-pastel-blue' : wificonnecting ? 'bg-pastel-yellow' : 'bg-[--border-color]'}`}
                      >
                        <FaWifi className={wifienabled ? 'text-[--bg-base]' : wificonnecting ? 'text-[--bg-base]' : 'text-[--text-color]'} size={18} />
                      </div>
                      <div
                        onClick={togglebluetooth}
                        className={`flex items-center justify-center aspect-square cursor-pointer active:scale-95 transition-all ${bluetoothstatus.enabled ? 'bg-pastel-blue' : 'bg-[--border-color]'}`}
                      >
                        <FaBluetoothB className={bluetoothstatus.enabled ? 'text-[--bg-base]' : 'text-[--text-color]'} size={18} />
                      </div>
                    </div>

                    <div className="bg-overlay border border-[--border-color] p-3 flex flex-col justify-between aspect-square">
                      <div className='flex items-center justify-center flex-1'>
                        <div className='text-center w-full px-2 overflow-hidden'>
                          <p className="text-[--text-color] text-sm font-medium truncate">{isplaying ? currenttrack.title : 'Not Playing'}</p>
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
                        <div className="bg-[--border-color] p-3">
                          <BsFillGridFill className="text-[--text-color]" size={18} />
                        </div>
                      </div>
                      <div onClick={() => setfocusmode(!focusmode)} className={`bg-overlay border border-[--border-color] p-3 flex items-center justify-center cursor-pointer active:scale-95 transition-all ${focusmode ? 'border-pastel-mauve' : ''}`}>
                        <div className={`p-3 ${focusmode ? 'bg-pastel-mauve' : 'bg-[--border-color]'}`}>
                          <FaMoon className={focusmode ? 'text-[--bg-base]' : 'text-[--text-color]'} size={18} />
                        </div>
                      </div>
                    </div>
                    <div
                      onClick={togglefullscreen}
                      className={`bg-overlay border border-[--border-color] p-3 h-full flex items-center justify-center cursor-pointer active:scale-95 transition-all ${isfullscreen ? 'border-pastel-green' : ''}`}
                    >
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
                      <div className="bg-overlay border border-[--border-color] flex items-center justify-center transition-colors">
                        <IoStopwatch className="text-[--text-color]" size={24} />
                      </div>
                      <div className="bg-overlay border border-[--border-color] flex items-center justify-center transition-colors">
                        <IoCalculator className="text-[--text-color]" size={24} />
                      </div>
                      <div className="bg-overlay border border-[--border-color] flex items-center justify-center transition-colors">
                        <IoCamera className="text-[--text-color]" size={24} />
                      </div>
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
                    <button
                      onClick={(e) => { e.stopPropagation(); handlelockscreen(); }}
                      className="px-4 py-2 bg-pastel-red/20 text-pastel-red text-sm font-medium active:bg-pastel-red/30"
                    >
                      Lock
                    </button>
                  </div>

                </div>
              ) : (

                <div className={`p-4 space-y-4 w-full`}>

                  <div className="grid grid-cols-2 gap-4">
                    <div className='grid h-max grid-rows-3 gap-2' onPointerDown={(e) => e.stopPropagation()}>
                      <div
                        onClick={togglewifi}
                        className={`p-3 ${wifienabled ? 'bg-pastel-blue/20' : wificonnecting ? 'bg-pastel-yellow/20' : 'bg-overlay'} border border-[--border-color] flex space-x-2 items-center cursor-pointer active:scale-95 transition-all`}
                      >
                        <div className={`p-[10px] ${wifienabled ? 'bg-pastel-blue' : wificonnecting ? 'bg-pastel-yellow' : 'bg-[--border-color]'}`}>
                          <FaWifi className={wifienabled ? 'text-[--bg-base]' : wificonnecting ? 'text-[--bg-base]' : 'text-[--text-color]'} size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[--text-color]">Wi-Fi</p>
                          <p className="text-[12px] text-[--text-muted] truncate">
                            {wifilabel}
                          </p>
                        </div>
                      </div>
                      <div
                        onClick={togglebluetooth}
                        className={`p-3 ${bluetoothstatus.enabled ? 'bg-pastel-blue/20' : 'bg-overlay'} border border-[--border-color] flex space-x-2 items-center cursor-pointer active:scale-95 transition-all`}
                      >
                        <div className={`p-[10px] ${bluetoothstatus.enabled ? 'bg-pastel-blue' : 'bg-[--border-color]'}`}>
                          <FaBluetoothB className={bluetoothstatus.enabled ? 'text-[--bg-base]' : 'text-[--text-color]'} size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[--text-color]">Bluetooth</p>
                          <p className="text-[12px] text-[--text-muted] truncate">
                            {bluetoothstatus.enabled ? 'On' : 'Off'}
                          </p>
                        </div>
                      </div>
                      <div onClick={togglefullscreen} className={`p-3 ${isfullscreen ? 'bg-pastel-green/20' : 'bg-overlay'} border border-[--border-color] flex space-x-2 items-center cursor-pointer active:scale-95 transition-all`}>
                        <div className={`p-[10px] ${isfullscreen ? 'bg-pastel-green' : 'bg-[--border-color]'}`}>
                          {isfullscreen ? <IoContract className="text-[--bg-base]" size={16} /> : <IoExpand className="text-[--text-color]" size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[--text-color]">Full Screen</p>
                        </div>
                      </div>
                    </div>
                    <div className='grid grid-rows-1 gap-2' onPointerDown={(e) => e.stopPropagation()}>
                      <div className="flex flex-col justify-between bg-overlay border border-[--border-color] p-3 px-0 h-full">
                        <div className="flex flex-col px-4">
                          <div className="w-10 h-10 mr-auto bg-gradient-to-br from-pastel-pink to-pastel-mauve mb-2"></div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-[--text-color] truncate">{isplaying ? currenttrack.title : 'Not Playing'}</p>
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
                          {theme == 'light' && <FaSun className='text-[--text-color]' size={16}></FaSun>}
                          {theme == 'dark' && <FaMoon className="text-[--text-color]" size={16} />}
                        </div>
                        <p className="text-[13px] font-semibold text-[--text-color] capitalize">{theme}<br></br> Mode</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className='px-5 py-4 bg-overlay border border-[--border-color]' onPointerDown={(e) => e.stopPropagation()}>
                      <p className="text-xs font-semibold text-[--text-color] mb-2">Display</p>
                      <div className="relative flex items-center h-7">
                        <div className="absolute left-0 w-6 h-6 flex items-center justify-center">
                          <BsSunFill size={16} className="text-[--text-color]" />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={brightnessval}
                          onChange={(e) => handlebrightness(Number(e.target.value))}
                          className={`
          w-full ml-10 mr-5 h-1 appearance-none
          [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:-mt-[6px]
          [&::-webkit-slider-runnable-track]:bg-transparent
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bottom-1
          [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-pastel-red
        `}
                          style={{
                            background: `linear-gradient(to right, #ed8796 ${brightnessval}%, var(--border-color) ${brightnessval}%)`,
                          }}
                        />
                      </div>
                    </div>
                    <div className='px-5 py-4 bg-overlay border border-[--border-color]' onPointerDown={(e) => e.stopPropagation()}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[--text-color]">Sound</p>
                          <button
                            onClick={togglemute}
                            className="text-xs text-[--text-muted] hover:text-[--text-color]"
                          >
                            {ismuted ? 'Unmute' : 'Mute'}
                          </button>
                        </div>
                        <div className="relative flex items-center h-7">
                          <div className="absolute left-0 w-6 h-6 flex items-center justify-center">
                            {ismuted ? <BsVolumeMuteFill size={16} className="text-pastel-red" /> : <BsFillVolumeUpFill size={16} className="text-[--text-color]" />}
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volumeval}
                            onChange={(e) => handlevolume(Number(e.target.value))}
                            className={`
        w-full ml-10 mr-5 h-1 appearance-none
          [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:-mt-[6px]
          [&::-webkit-slider-runnable-track]:bg-transparent
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bottom-1
          [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-pastel-red
        `}
                            style={{
                              background: `linear-gradient(to right, #ed8796 ${volumeval}%, var(--border-color) ${volumeval}%)`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="flex justify-between items-center bg-overlay border border-[--border-color] w-max px-5 py-3">
                    <div className="flex items-center space-x-2">
                      {batterystatus.charging ? <FiBatteryCharging size={20} className="text-pastel-green" /> : <FiBattery size={20} className="text-[--text-color]" />}
                      <div className='flex flex-col'>
                        <p className="text-[11px] font-normal text-[--text-muted]">Battery</p>
                        <p className="text-[12px] font-semibold text-[--text-color]">
                          {batterystatus.available ? `${batterystatus.percentage}%` : 'N/A'}
                          {batterystatus.charging && <span className="text-pastel-green ml-1">⚡</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </motion.div>
        </>
      )
      }
    </AnimatePresence >
  )
}

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
      <div className={`absolute bottom-0 w-full bg-pastel-pink transition-all duration-75 ease-out`} style={{ height: `${value}%` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-between py-4 z-10 pointer-events-none">
        <div />
        <div
          className="pointer-events-auto cursor-pointer"
          onClick={(e) => { e.stopPropagation(); if (onIconClick) onIconClick(); }}
        >
          <Icon size={24} className={`transition-colors ${value > 50 ? 'text-[--bg-base]' : 'text-[--text-color]'}`} />
        </div>
      </div>
    </div>
  );
};
