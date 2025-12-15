import React, { useState, useRef } from 'react'
import { FaWifi, FaMoon, FaSun, FaBluetoothB, FaPlane } from 'react-icons/fa'
import { BsFillVolumeUpFill, BsSunFill, BsFillGridFill } from 'react-icons/bs'
import { FiBatteryCharging, FiCast } from 'react-icons/fi'
import { IoPlay, IoFlashlight, IoCamera, IoCalculator, IoStopwatch } from 'react-icons/io5'
import { BiSignal5 } from "react-icons/bi";
import { FaTowerBroadcast } from 'react-icons/fa6'
import { usesettings } from './SettingsContext'
import { usetheme } from './ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function ControlCenter({ onclose, ismobile = false, isopen = true }: { onclose?: () => void, ismobile?: boolean, isopen?: boolean }) {
  const [brightness, setbrightness] = useState(100)
  const [volume, setvolume] = useState(100)
  const { theme, toggletheme } = usetheme()
  const { reducemotion, reducetransparency } = usesettings()

  return (
    <AnimatePresence>
      {isopen && (
        <motion.div
          key="control-center"
          initial={ismobile ? { y: "-100%" } : { opacity: 0, scale: 0.9, transformOrigin: "top right" }}
          animate={ismobile ? { y: "0%" } : { opacity: 1, scale: 1, transformOrigin: "top right" }}
          exit={ismobile ? { y: "-100%" } : { opacity: 0, scale: 0.9, transformOrigin: "top right" }}
          transition={{
            type: reducemotion ? "tween" : "spring",
            stiffness: reducemotion ? undefined : 250,
            damping: reducemotion ? undefined : 25,
            duration: reducemotion ? 0.2 : undefined
          }}
          className={`${ismobile
            ? `fixed inset-0 w-full h-full rounded-none flex items-start justify-center pt-10 ${reducetransparency ? 'bg-neutral-900' : 'backdrop-blur-2xl bg-white/70 dark:bg-black/60'}`
            : `${reducetransparency ? 'bg-[#e5e5e5] dark:bg-[#1a1a1a] border-opacity-50' : 'backdrop-blur-2xl bg-white/10 dark:bg-black/10'} w-[320px] fixed top-14 right-4 rounded-2xl border border-white/20 block`} 
                 font-sans origin-top-right  shadow-2xl overflow-y-auto z-[9999]`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          drag={ismobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -100 && onclose) {
              onclose();
            }
          }}
        >
          {ismobile ? (
            <div className="w-full max-w-[340px] px-4 space-y-4">

              <div className="grid grid-cols-2 gap-3">


                <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] p-3 grid grid-cols-2 grid-rows-2 gap-2 aspect-square shadow-lg">
                  <div className="flex items-center justify-center bg-blue-500 rounded-full aspect-square">
                    <FaPlane className="text-white" size={18} />
                  </div>
                  <div className="flex items-center justify-center bg-green-500 rounded-full aspect-square">
                    <BiSignal5 className="text-white" size={18} />
                  </div>
                  <div className="flex items-center justify-center bg-blue-500 rounded-full aspect-square">
                    <FaWifi className="text-white" size={18} />
                  </div>
                  <div className="flex items-center justify-center bg-blue-500 rounded-full aspect-square">
                    <FaBluetoothB className="text-white" size={18} />
                  </div>
                </div>


                <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] p-3 flex flex-col justify-between aspect-square shadow-lg">
                  <div className='flex items-center justify-center flex-1'>
                    <div className='text-center'>
                      <p className="text-white text-sm font-medium">Not Playing</p>
                      <p className="text-neutral-400 text-[10px]">Music</p>
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-6 text-white pb-1">
                    <IoPlay className="opacity-50" size={24} />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] aspect-square flex items-center justify-center shadow-lg">
                    <div className="bg-neutral-700/50 p-3 rounded-full">
                      <BsFillGridFill className="text-white" size={18} />
                    </div>
                  </div>
                  <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] aspect-square flex items-center justify-center shadow-lg">
                    <div className="bg-neutral-700/50 p-3 rounded-full">
                      <FaMoon className="text-white" size={18} />
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] h-full flex items-center justify-center shadow-lg">
                  <div className='flex flex-col items-center gap-1 text-white'>
                    <FiCast size={20} />
                    <span className='text-[10px]'>Screen Mirroring</span>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">

                <div className="grid grid-cols-2 gap-3 h-36" onPointerDown={(e) => e.stopPropagation()}>
                  <CCSlider value={brightness} onchange={setbrightness} icon={BsSunFill} />
                  <CCSlider value={volume} onchange={setvolume} icon={BsFillVolumeUpFill} />
                </div>


                <div className="grid grid-cols-2 grid-rows-2 gap-3 h-36">
                  <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-lg active:bg-white/20 transition-colors">
                    <IoFlashlight className="text-white" size={24} />
                  </div>
                  <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-lg active:bg-white/20 transition-colors">
                    <IoStopwatch className="text-white" size={24} />
                  </div>
                  <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-lg active:bg-white/20 transition-colors">
                    <IoCalculator className="text-white" size={24} />
                  </div>
                  <div className="bg-neutral-800/80 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-lg active:bg-white/20 transition-colors">
                    <IoCamera className="text-white" size={24} />
                  </div>
                </div>
              </div>


              <div onClick={toggletheme} className="bg-neutral-800/80 backdrop-blur-xl rounded-[24px] p-4 flex items-center justify-center shadow-lg active:bg-white/20 transition-colors gap-3 cursor-pointer">
                {theme == 'light' ? <FaSun className='text-white' size={20} /> : <FaMoon className="text-white" size={20} />}
                <span className="text-white font-medium">Switch Theme</span>
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

        </motion.div>
      )}
    </AnimatePresence>
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
      className={`relative w-full h-36 bg-neutral-800/80 backdrop-blur-xl rounded-[20px] overflow-hidden flex flex-col justify-end shadow-lg cursor-ns-resize touch-none ${isdragging ? 'scale-[0.98]' : ''} transition-transform`}
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
