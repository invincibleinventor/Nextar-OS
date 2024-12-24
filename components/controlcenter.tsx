/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {  useState } from 'react'
import { FaWifi, FaMoon, FaBluetoothB, FaSun } from 'react-icons/fa'
import { MdKeyboard, MdAirplay } from 'react-icons/md'
import {  BsFillVolumeUpFill, BsSunFill } from 'react-icons/bs'
import { FiBatteryCharging } from 'react-icons/fi'
import { IoPlay } from 'react-icons/io5'
import { FaTowerBroadcast } from 'react-icons/fa6'
import {  useTheme } from './ThemeContext'
import { motion } from 'framer-motion'

export default function Control(){
  
  const [brightness, setBrightness] = useState(50)
  const [volume, setVolume] = useState(100)
  const [visible,setVisible] = useState(false)
  const {theme,toggleTheme} = useTheme()
    return(
        <div className="font-sf">
          <div onClick={()=>setVisible(!visible)} className={`px-1 rounded-md py-[2px] hover:bg-white/10 ${visible?'bg-white/20':''}`}>
        <svg className="w-4 h-4   dark:text-white text-black" color="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" id="control-centre">
        <path d="M7.5 13h14a5.5 5.5 0 0 0 0-11h-14a5.5 5.5 0 0 0 0 11Zm0-9h14a3.5 3.5 0 0 1 0 7h-14a3.5 3.5 0 0 1 0-7Zm0 6A2.5 2.5 0 1 0 5 7.5 2.5 2.5 0 0 0 7.5 10Zm14 6h-14a5.5 5.5 0 0 0 0 11h14a5.5 5.5 0 0 0 0-11Zm1.434 8a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" fill="currentColor"></path>
      </svg>
      </div>
{visible &&
      <motion.div initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.5, y: -10 }}
      transition={{ type: 'spring', stiffness: 390, damping: 20 }} className="w-[360px] absolute top-10 right-2 bg-white/20 dark:bg-black/20 backdrop-blur-lg rounded-3xl shadow-2xl p-4 space-y-4 font-sans">
      <div className="grid grid-cols-2 gap-4">
        <div className='grid shadow rounded-2xl bg-white/20 dark:bg-black/10  grid-rows-3 gap-0'>
        <div className="p-3 py-2 flex space-x-2 items-center">
        <div className='p-[10px] rounded-full bg-white/20'>

          <FaWifi className="text-neutral-800 dark:text-white" size={16} />
          </div>
          <div>
          
            <p className="text-xs font-semibold  dark:text-white text-neutral-800">Wi-Fi</p>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">Bala&apos;s Wifi</p>
          </div>
        </div>
        <div className="p-3 py-2 flex space-x-2 items-center">
        <div className='p-[10px] rounded-full bg-white/20'>

          <FaBluetoothB className="text-neutral-800 dark:text-white" size={16} />
          </div>
          <div>
          
            <p className="text-xs font-semibold  dark:text-white text-neutral-800">Bluetooth</p>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">Off</p>
          </div>
        </div>
        <div className="p-3 py-2 flex space-x-2 items-center">
        <div className='p-[10px] rounded-full bg-white/20'>

          <FaTowerBroadcast className="text-neutral-800 dark:text-white" size={16} />
          </div>
          <div>
          
            <p className="text-xs font-semibold  dark:text-white text-neutral-800">AirDrop</p>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">Off</p>
          </div>
        </div>

     
      </div>
      <div className='grid grid-rows-2 gap-4'>
      <div onClick={()=>toggleTheme()} className="p-3 rounded-2xl bg-white/20 dark:bg-black/10 shadow flex space-x-2 items-center">
      <div className='p-[10px] rounded-full bg-white/20'>
      {theme == 'light' && <FaSun className='text-neutral-800 dark:text-white' size={16}></FaSun>}
      {theme  == 'dark' &&
          <FaMoon className="text-neutral-800 dark:text-white" size={16} />
      }
          </div>
          <p className="text-xs font-semibold dark:text-white text-neutral-800 capitalize">{theme}<br></br> Mode</p>
        </div>
      {/* Keyboard Brightness and AirPlay */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-white/20 dark:bg-black/10 rounded-2xl shadow flex flex-col items-center">
          <MdKeyboard size={16} className="text-neutral-800 dark:text-neutral-200" />
          <p className="text-[11px] text-neutral-800 dark:text-white text-center mt-1 mx-1">Keyboard Brightness</p>
        </div>
        <div className="p-3  bg-white/20 dark:bg-black/10 rounded-2xl shadow flex flex-col items-center">
          <MdAirplay size={16} className="text-neutral-800 dark:text-neutral-200" />
          <p className="text-[11px] text-neutral-800 dark:text-white text-center mt-1">AirPlay Display</p>
        </div>
      </div>
      </div>
</div>
<div className='p-3 shadow rounded-2xl bg-white/20 dark:bg-black/10  '>
<p className="text-xs font-medium dark:text-white text-neutral-800 mb-2">Display</p>
      <div className="relative  rounded-full flex items-center h-7">
        <div className="absolute left-0 w-6 h-6 flex items-center justify-center rounded-full bg-white  ">
          <BsSunFill size={12} className="text-neutral-500" />
        </div>

        <input
        type="range"
        min="0"
        max="100"
        value={brightness}
        onChange={(e) => (setBrightness(Number(e.target.value)))}
        className="
        w-full h-6 appearance-none rounded-full 
        [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-6
        [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent 
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md 
        

      "
      style={{
        background: `linear-gradient(to right, white ${brightness}%, rgba(255,255,255,0.2) ${brightness}%)`,
      }}
    
      />
</div>
  </div>
  <div className='p-3 shadow rounded-2xl bg-white/20 dark:bg-black/10  '>

      <div>
      <p className="text-xs font-medium dark:text-white text-neutral-800 mb-2">Sound</p>
      <div className="relative rounded-full flex items-center h-7">
        <div className="absolute left-0 w-6 h-6 flex items-center justify-center rounded-full ">
          <BsFillVolumeUpFill size={12} className="text-neutral-500" />
        </div>

        <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => (setVolume(Number(e.target.value)))}
        className="
        w-full h-6 appearance-none rounded-full 
        [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-6
        [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent 
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md 
        

      "
      style={{
        background: `linear-gradient(to right, white ${volume}%, rgba(255,255,255,0.2) ${volume}%)`,
      }}
    
      />
</div>
  </div>
  </div>
  
   
      <div className="flex items-center justify-between bg-neutral-100/10 dark:bg-black/10 rounded-2xl p-3 pr-5 shadow">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-yellow-400 rounded-lg"></div>
          <div>
            <p className="text-sm font-semibold dark:text-white text-neutral-800">Never gonna give you up!</p>
            <p className="text-xs dark:text-neutral-200 text-neutral-700">Rick Astley</p>
          </div>
        </div>
        <IoPlay size={20} className="dark:text-neutral-200 text-neutral-700" />
      </div>

      <div className="flex justify-between items-center bg-white/20 dark:bg-black/10 w-max rounded-xl p-3 py-2 shadow">
        <div className="flex items-center space-x-2">
          <FiBatteryCharging size={20} className="text-neutral-800 dark:text-white" />
          <div className='flex flex-col'>

          <p className="text-[11px] font-normal dark:text-neutral-300 text-neutral-700">Battery</p>
          <p className="text-[12px] font-semibold dark:text-neutral-200 text-neutral-800">74%</p>

          </div>
        </div>
      </div>
    </motion.div>
}
        </div>
    )
}





