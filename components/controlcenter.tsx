'use client'

import { useState } from 'react'
import { FaWifi, FaMoon, FaSun } from 'react-icons/fa'
import { BsFillVolumeUpFill, BsSunFill } from 'react-icons/bs'
import { FiBatteryCharging } from 'react-icons/fi'
import { IoPlay, IoWifi, IoBatteryFull } from 'react-icons/io5'
import { BiSignal5 } from "react-icons/bi";
import { FaBluetoothB, FaTowerBroadcast } from 'react-icons/fa6'
import { useTheme } from './ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useDevice } from './DeviceContext'

interface ControlProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Control({ isOpen, onClose }: ControlProps) {

  const [brightness, setbrightness] = useState(50)
  const [volume, setvolume] = useState(100)
  const [visible, setvisible] = useState(false)
  const { theme, toggletheme } = useTheme()
  const { ismobile } = useDevice()

  const effectivevisible = isOpen !== undefined ? isOpen : visible;
  const handletoggle = () => {
    if (onClose) onClose();
    else setvisible(!visible);
  }

  const ControlCenterStatusBar = () => {
    const now = new Date();
    const timestr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

    return (
      <div className="absolute top-0 dark:text-white text-black left-0 right-0 h-11 flex items-center justify-between px-6 pointer-events-none">
        <div className="text-[15px] font-semibold  drop-shadow-md pl-6">
          {timestr}
        </div>
        <div className="flex items-center gap-2 pr-6">
          <BiSignal5 className=" drop-shadow-md" size={18} />
          <IoWifi className=" drop-shadow-md" size={18} />
          <div className="flex items-center">
            <span className="text-[12px] font-medium mr-1">100%</span>
            <IoBatteryFull className=" drop-shadow-md" size={24} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sf ">
      {!ismobile && (
        <div onClick={() => setvisible(!visible)} className={`px-1 rounded-md py-[2px] hover:bg-white/10 ${visible ? 'bg-white/20' : ''}`}>
          <svg className="w-4 h-4   dark:text-white text-black" color="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" id="control-centre">
            <path d="M7.5 13h14a5.5 5.5 0 0 0 0-11h-14a5.5 5.5 0 0 0 0 11Zm0-9h14a3.5 3.5 0 0 1 0 7h-14a3.5 3.5 0 0 1 0-7Zm0 6A2.5 2.5 0 1 0 5 7.5 2.5 2.5 0 0 0 7.5 10Zm14 6h-14a5.5 5.5 0 0 0 0 11h14a5.5 5.5 0 0 0 0-11Zm1.434 8a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" fill="currentColor"></path>
          </svg>
        </div>
      )}
      <AnimatePresence>
        {effectivevisible &&
          <div className="fixed inset-0 z-[10000]" onClick={handletoggle}>
            <motion.div
              initial={ismobile ? { y: "-100%" } : { opacity: 0, scale: 0.9, transformOrigin: "top right" }}
              animate={ismobile ? { y: "0%" } : { opacity: 1, scale: 1, transformOrigin: "top right" }}
              exit={ismobile ? { y: "-100%" } : { opacity: 0, scale: 0.9, transformOrigin: "top right" }}
              transition={{ type: "spring", stiffness: 250, damping: 25 }}
              className={`${ismobile
                ? 'backdrop-blur-md  fixed inset-0 w-auto h-auto rounded-none flex items-center justify-center bg-white/40 dark:bg-black/40'
                : 'backdrop-blur-3xl w-[360px] absolute top-10 right-2 rounded-3xl border border-white/20 block bg-white/10 dark:bg-black/10'} 
                 font-sans origin-top-right shadow-2xl overflow-y-auto`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              drag={ismobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -100 && onClose) {
                  onClose();
                }
              }}
            >
              {ismobile && <ControlCenterStatusBar />}

              <div className={`p-4 space-y-4 w-full ${ismobile ? 'pt-12 max-w-sm' : ''}`}>

                <div className="grid grid-cols-2 gap-4">
                  <div className='grid   grid-rows-3 gap-2' onPointerDown={(e) => e.stopPropagation()}>
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
                  <div className='grid grid-rows-1 gap-4' onPointerDown={(e) => e.stopPropagation()}>

                    <div className="flex flex-col justify-between bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-3 px-0 shadow-sm">
                      <div className="flex flex-col px-4">
                        <div className="w-12 h-12 mr-auto bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg ring-1 ring-white/10"></div>
                        <div className='my-2'>
                          <p className="text-sm font-semibold text-black dark:text-white">Not Playing</p>
                          <p className="text-[11px] text-black/60 dark:text-white/60">Music</p>
                        </div>
                      </div>
                      <div className="flex px-4 items-center space-x-4">
                        <IoPlay size={24} className="text-black dark:text-white opacity-80" />
                      </div>
                    </div>
                    <div onClick={() => toggletheme()} className="p-3 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full flex space-x-2 items-center cursor-pointer shadow-sm">
                      <div className='p-[10px] rounded-full bg-white/50 dark:bg-white/10'>
                        {theme == 'light' && <FaSun className='text-black dark:text-white' size={16}></FaSun>}
                        {theme == 'dark' &&
                          <FaMoon className="text-black dark:text-white" size={16} />
                        }
                      </div>
                      <p className="text-[13px] font-semibold text-black dark:text-white capitalize">{theme}<br></br> Mode</p>
                    </div>

                  </div>
                </div>


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

            </motion.div>
          </div>
        }
      </AnimatePresence>
    </div>
  )
}
