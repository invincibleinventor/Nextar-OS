import React, { useState, useRef } from 'react'
import { FaWifi, FaMoon, FaSun, FaBluetoothB, FaPlane } from 'react-icons/fa'
import { BsFillVolumeUpFill, BsSunFill, BsFillGridFill } from 'react-icons/bs'
import { FiBatteryCharging, FiCast } from 'react-icons/fi'
import { IoPlay, IoFlashlight, IoCamera, IoCalculator, IoStopwatch } from 'react-icons/io5'
import { BiSignal5 } from "react-icons/bi";
import { FaTowerBroadcast } from 'react-icons/fa6'
import { useSettings } from './SettingsContext'
import { useTheme } from './ThemeContext'
import { useAuth } from './AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function ControlCenter({ onclose, ismobile = false, isopen = true }: { onclose?: () => void, ismobile?: boolean, isopen?: boolean }) {
  const [brightness, setbrightness] = useState(100)
  const [volume, setvolume] = useState(100)
  const [focusmode, setfocusmode] = useState(false)
  const [flashlight, setflashlight] = useState(false)
  const { theme, toggletheme } = useTheme()
  const { reducemotion, reducetransparency } = useSettings()
  const { user, logout } = useAuth()

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
              className={`fixed inset-0 z-[9999] ${reducetransparency ? 'bg-neutral-100/80 dark:bg-neutral-900/80' : 'dark:bg-black/40 bg-white/40 backdrop-blur-sm'}`}
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
              ? `fixed inset-0 w-full h-full rounded-none flex items-center justify-center pt-10`
              : `${reducetransparency ? 'bg-[#e5e5e5] dark:bg-[#1a1a1a] border-opacity-50' : 'backdrop-blur-lg bg-white/40 dark:bg-black/40'} w-[320px] fixed top-14 right-4 rounded-xl border border-white/20 block`} 
                   font-sans origin-top-right  overflow-y-auto z-[9999]` }
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
            style={{ pointerEvents: isopen ? 'auto' : 'none' }}
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


                    <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-3xl p-3 grid grid-cols-2 grid-rows-2 gap-2 aspect-square border border-neutral-300 dark:border-neutral-700">
                      <div className="flex items-center justify-center bg-accent rounded-full aspect-square">
                        <FaPlane className="text-white" size={18} />
                      </div>
                      <div className="flex items-center justify-center bg-green-500 rounded-full aspect-square">
                        <BiSignal5 className="text-white" size={18} />
                      </div>
                      <div className="flex items-center justify-center bg-accent rounded-full aspect-square">
                        <FaWifi className="text-white" size={18} />
                      </div>
                      <div className="flex items-center justify-center bg-accent rounded-full aspect-square">
                        <FaBluetoothB className="text-white" size={18} />
                      </div>
                    </div>


                    <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-3xl p-3 flex flex-col justify-between aspect-square border border-neutral-300 dark:border-neutral-700">
                      <div className='flex items-center justify-center flex-1'>
                        <div className='text-center'>
                          <p className="text-neutral-800 dark:text-white text-sm font-medium">Not Playing</p>
                          <p className="text-neutral-700 dark:text-neutral-400 text-[10px]">Music</p>
                        </div>
                      </div>
                      <div className="flex justify-center items-center gap-6 text-neutral-800 dark:text-neutral-200 pb-1">
                        <IoPlay className="opacity-50" size={24} />
                      </div>
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-3xl p-3 flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                        <div className="bg-neutral-700/50 p-3 rounded-full">
                          <BsFillGridFill className="text-white" size={18} />
                        </div>
                      </div>
                      <div onClick={() => setfocusmode(!focusmode)} className={`dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-3xl p-3 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 cursor-pointer active:scale-95 transition-all ${focusmode ? 'ring-2 ring-purple-500' : ''}`}>
                        <div className={`p-3 rounded-full ${focusmode ? 'bg-purple-500' : 'bg-neutral-700/50'}`}>
                          <FaMoon className="text-white" size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-3xl p-3 h-full flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                      <div className='flex flex-col items-center gap-1 text-neutral-800 dark:text-white'>
                        <BsFillGridFill size={20} />
                        <span className='text-[10px]'>Full Screen</span>
                      </div>
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-3">

                    <div className="grid grid-cols-2 gap-3 h-36" onPointerDown={(e) => e.stopPropagation()}>
                      <CCSlider value={brightness} onchange={setbrightness} icon={BsSunFill} />
                      <CCSlider value={volume} onchange={setvolume} icon={BsFillVolumeUpFill} />
                    </div>


                    <div className="grid grid-cols-2 grid-rows-2 gap-3 h-36">
                      <div onClick={() => setflashlight(!flashlight)} className={`dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-neutral-300 dark:border-neutral-700 active:scale-95 transition-all cursor-pointer ${flashlight ? 'bg-yellow-400/20 ring-2 ring-yellow-400' : 'active:bg-white/20'}`}>
                        <IoFlashlight className={`${flashlight ? 'text-yellow-400' : 'text-neutral-800 dark:text-white'}`} size={24} />
                      </div>
                      <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-[20px] flex items-center justify-center border border-neutral-300 dark:border-neutral-700 active:bg-white/20 transition-colors">
                        <IoStopwatch className="text-neutral-800 dark:text-white" size={24} />
                      </div>
                      <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-[20px] flex items-center justify-center border border-neutral-300 dark:border-neutral-700 active:bg-white/20 transition-colors">
                        <IoCalculator className="text-neutral-800 dark:text-white" size={24} />
                      </div>
                      <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-md rounded-[20px] flex items-center justify-center border border-neutral-300 dark:border-neutral-700 active:bg-white/20 transition-colors">
                        <IoCamera className="text-neutral-800 dark:text-white" size={24} />
                      </div>
                    </div>
                  </div>

                  <div onClick={toggletheme} className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-xl rounded-[24px] p-4 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 active:bg-white/20 transition-colors gap-3 cursor-pointer">
                    {theme == 'light' ? <FaSun className='text-neutral-800 dark:text-white' size={20} /> : <FaMoon className="text-white" size={20} />}
                    <span className="text-neutral-800 dark:text-white font-medium">Switch Theme</span>
                  </div>

                  <div className="dark:bg-neutral-800/20 bg-neutral-400/20 backdrop-blur-xl rounded-[24px] p-4 flex items-center border border-neutral-300 dark:border-neutral-700 gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                      <Image src={user?.avatar || '/pfp.png'} alt="User" width={48} height={48} className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-neutral-800 dark:text-white font-semibold truncate">{user?.name || 'Guest'}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs">@{user?.username || 'guest'}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); logout(); if (onclose) onclose(); }}
                      className="px-4 py-2 bg-red-500/20 text-red-500 rounded-full text-sm font-medium active:bg-red-500/30"
                    >
                      Lock
                    </button>
                  </div>

                </div>
              ) : (

                <div className={`p-4 space-y-4 w-full`}>

                  <div className="grid grid-cols-2 gap-4">
                    <div className='grid h-max grid-rows-3 gap-2' onPointerDown={(e) => e.stopPropagation()}>
                      <div className="p-3 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full flex space-x-2 items-center shadow-sm">
                        <div className='p-[10px] rounded-full bg-white/50 dark:bg-white/10'>
                          <FaWifi className="text-black dark:text-white" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black dark:text-white">Wi-Fi</p>
                          <p className="text-[12px] text-black/60 dark:text-white/60 truncate">Connect</p>
                        </div>
                      </div>
                      <div className="p-3 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full flex space-x-2 items-center shadow-sm">
                        <div className='p-[10px] rounded-full bg-white/50 dark:bg-white/10'>
                          <FaBluetoothB className="text-black dark:text-white" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black dark:text-white">Bluetooth</p>
                          <p className="text-[12px] text-black/60 dark:text-white/60 truncate">Off</p>
                        </div>
                      </div>
                      <div className="p-3 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full flex space-x-2 items-center shadow-sm">
                        <div className='p-[10px] rounded-full bg-white/50 dark:bg-white/10'>
                          <FaTowerBroadcast className="text-black dark:text-white" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-black dark:text-white">AirDrop</p>
                          <p className="text-[12px] text-black/60 dark:text-white/60 truncate">Off</p>
                        </div>
                      </div>
                    </div>
                    <div className='grid grid-rows-1 gap-2' onPointerDown={(e) => e.stopPropagation()}>
                      <div className="flex flex-col justify-between bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-3 px-0 shadow-sm h-full">
                        <div className="flex flex-col px-4">
                          <div className="w-10 h-10 mr-auto bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg ring-1 ring-white/10 mb-2"></div>
                          <div>
                            <p className="text-sm font-semibold text-black dark:text-white">Not Playing</p>
                            <p className="text-[11px] text-black/60 dark:text-white/60">Music</p>
                          </div>
                        </div>
                        <div className="flex px-4 items-center space-x-4 justify-end mt-1">
                          <IoPlay size={24} className="text-black dark:text-white opacity-80" />
                        </div>
                      </div>
                      <div onClick={() => toggletheme()} className="p-3 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full flex space-x-2 items-center cursor-pointer shadow-sm h-min self-end">
                        <div className='p-[10px] rounded-full bg-white/50 dark:bg-white/10'>
                          {theme == 'light' && <FaSun className='text-black dark:text-white' size={16}></FaSun>}
                          {theme == 'dark' && <FaMoon className="text-black dark:text-white" size={16} />}
                        </div>
                        <p className="text-[13px] font-semibold text-black dark:text-white capitalize">{theme}<br></br> Mode</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className='px-5 py-4 backdrop-blur-xl rounded-[22px] border border-white/20 dark:border-white/5 bg-white/40 dark:bg-neutral-800/40 shadow-sm' onPointerDown={(e) => e.stopPropagation()}>
                      <p className="text-xs font-semibold text-black dark:text-white mb-2">Display</p>
                      <div className="relative rounded-full flex items-center h-7">
                        <div className="absolute left-0 w-6 h-6 flex items-center justify-center rounded-full">
                          <BsSunFill size={16} className="text-black dark:text-white" />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={brightness}
                          onChange={(e) => (setbrightness(Number(e.target.value)))}
                          className={`
          w-full ml-10 mr-5 h-1 appearance-none rounded-full 
          [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:-mt-[6px]
          [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent 
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bottom-1
          [&::-webkit-slider-thumb]:rounded-full  [&::-webkit-slider-thumb]:shadow-md 
          ${theme === 'light' ? '[&::-webkit-slider-thumb]:bg-neutral-800' : '[&::-webkit-slider-thumb]:bg-white'}
        `}
                          style={{
                            background: `linear-gradient(to right, ${theme === 'light' ? '#262626' : 'white'} ${brightness}%, ${theme === 'light' ? 'rgba(38,38,38,0.2)' : 'rgba(255,255,255,0.2)'} ${brightness}%)`,
                          }}
                        />
                      </div>
                    </div>
                    <div className='px-5 py-4 backdrop-blur-xl rounded-[22px] border border-white/20 dark:border-white/5 bg-white/40 dark:bg-neutral-800/40 shadow-sm' onPointerDown={(e) => e.stopPropagation()}>
                      <div>
                        <p className="text-xs font-semibold text-black dark:text-white mb-2">Sound</p>
                        <div className="relative rounded-full flex items-center h-7">
                          <div className="absolute left-0 w-6 h-6 flex items-center justify-center rounded-full ">
                            <BsFillVolumeUpFill size={16} className="text-black dark:text-white" />
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => (setvolume(Number(e.target.value)))}
                            className={`
        w-full ml-10 mr-5 h-1 appearance-none rounded-full 
          [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:-mt-[6px]
          [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent 
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bottom-1
          [&::-webkit-slider-thumb]:rounded-full  [&::-webkit-slider-thumb]:shadow-md 
          ${theme === 'light' ? '[&::-webkit-slider-thumb]:bg-neutral-800' : '[&::-webkit-slider-thumb]:bg-white'}
        `}
                            style={{
                              background: `linear-gradient(to right, ${theme === 'light' ? '#262626' : 'white'} ${volume}%, ${theme === 'light' ? 'rgba(38,38,38,0.2)' : 'rgba(255,255,255,0.2)'} ${volume}%)`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="flex justify-between items-center bg-white/40 dark:bg-neutral-800/40 border border-white/20 dark:border-white/5 w-max rounded-full px-5 py-3 filter backdrop-blur-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <FiBatteryCharging size={20} className="text-black dark:text-white" />
                      <div className='flex flex-col'>

                        <p className="text-[11px] font-normal text-black dark:text-white/80">Battery</p>
                        <p className="text-[12px] font-semibold text-black dark:text-white">74%</p>

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

const CCSlider = ({ value, onchange, icon: Icon }: any) => {
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
      className={`relative w-full h-36 bg-neutral-800/80 backdrop-blur-xl rounded-[20px] overflow-hidden flex flex-col justify-end cursor-ns-resize touch-none ${isdragging ? 'scale-[0.98]' : ''} transition-transform`}
      onPointerDown={handlepointerdown}
      onPointerMove={handlepointermove}
      onPointerUp={handlepointerup}
      onPointerCancel={handlepointerup}
    >
      <div className={`absolute bottom-0 w-full bg-white transition-all duration-75 ease-out`} style={{ height: `${value}%` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-between py-4 z-10 pointer-events-none">
        <div />
        <Icon size={24} className={`transition-colors ${value > 50 ? 'text-neutral-800' : 'text-white'}`} />
      </div>
    </div>
  );
};
