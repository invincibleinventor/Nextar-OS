'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWindows } from '@/components/WindowContext';
import Window from '@/components/Window';
import { apps } from '@/components/app'
import { useDevice } from '../components/DeviceContext';
import Panel from '@/components/panel';
import Dock from '@/components/Dock';
import BootScreen from '@/components/BootScreen';
import LockScreen from '@/components/LockScreen';
import MobileHomeScreen from '@/components/MobileHomeScreen';
import Control from '@/components/controlcenter';
import RecentApps from '@/components/RecentApps';
import { IoWifi, IoBatteryFull } from "react-icons/io5";
import { motion } from 'framer-motion';
import { BiSignal5 } from "react-icons/bi";

import NotificationCenter from '@/components/NotificationCenter';
import { useNotifications } from '@/components/NotificationContext';
import MacOSNotifications from '@/components/MacOSNotifications';

const Page = () => {
  const { windows, addwindow, setwindows } = useWindows();
  const { osstate, ismobile } = useDevice();
  const { } = useNotifications();
  const [showcontrolcenter, setshowcontrolcenter] = useState(false);
  const [shownotificationcenter, setshownotificationcenter] = useState(false);
  const [showrecentapps, setshowrecentapps] = useState(false);
  const [issystemgestureactive, setissystemgestureactive] = useState(false);


  const openOldPortfolio = () => {
    const safariapp = apps.find((app) => app.id === 'safari');
    if (!safariapp) return;

    addwindow({
      id: `safari-oldportfolio-${Date.now()}`,
      appname: 'Old Portfolio',
      title: 'Old Portfolio',
      component: safariapp.componentname,
      icon: '/code.png',
      isminimized: false,
      ismaximized: false,
      position: { top: 50, left: 50 },
      size: { width: 1024, height: 768 },
      props: { initialurl: 'https://baladev.vercel.app' }
    });
  };

  const hasLaunchedWelcome = React.useRef(false);

  useEffect(() => {
    if (osstate === 'unlocked' && !hasLaunchedWelcome.current) {
      const welcomeapp = apps.find(a => a.id === 'welcome');
      if (welcomeapp) {
        addwindow({
          id: 'welcome',
          appname: 'Welcome',
          title: 'Welcome',
          component: 'Welcome',
          icon: '/info.png',
          isminimized: false,
          ismaximized: false,
          position: { top: 100, left: 100 },
          size: { width: 800, height: 600 },
          props: {}
        });
        hasLaunchedWelcome.current = true;
      }
    }
  }, [osstate, addwindow]);

  const StatusBar = () => {
    const now = new Date();
    const timestr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

    return (
      <motion.div
        className="absolute top-0 left-0 right-0 h-11 z-[9999] flex items-center justify-between px-6 cursor-pointer bg-transparent backdrop-blur-md"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 50) {
            if (info.point.x < window.innerWidth / 2) {
              setshownotificationcenter(true);
            } else {
              setshowcontrolcenter(true);
            }
          }
        }}
      >
        <div className="text-[15px] dark:text-white text-black font-semibold drop-shadow-md pl-6">
          {timestr}
        </div>
        <div className="flex dark:text-white text-black items-center gap-2 pr-6">
          <BiSignal5 className=" drop-shadow-md" size={18} />
          <IoWifi className=" drop-shadow-md" size={18} />
          <div className="flex items-center">
            <span className="text-[12px] font-medium  mr-1">100%</span>
            <IoBatteryFull className="drop-shadow-md" size={24} />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <BootScreen />
      <LockScreen />

      <div
        className={`relative w-full h-full transition-all duration-500 ease-out
                    ${osstate === 'unlocked'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-[0.98] pointer-events-none'}`}
      >
        {!ismobile && (
          <>
            <Panel ontogglenotifications={() => setshownotificationcenter(prev => !prev)} />
            <main
              className="absolute inset-0 pt-6 pb-16"
              onClick={() => {
                if (shownotificationcenter) setshownotificationcenter(false);
              }}
            >
              <div className='p-4 py-10 flex flex-col items-end content-end '>
                <button onClick={(e) => { e.stopPropagation(); openOldPortfolio(); }} className="p-2 flex hover:bg-neutral-400/20 rounded-2xl hover:backdrop-blur-lg hover:filter px-4 flex-col items-center content-center text-white">
                  <Image className='w-16 h-16 shadow-sm drop-shadow-lg' src="/code.png" width={64} height={64} alt="Old Portfolio"></Image>
                  <span className='text-xs font-semibold text-white mt-1.5 drop-shadow-md'>Old Portfolio</span>
                </button>
                {windows.map((window: any) => (
                  <div key={window.id} onClick={(e) => e.stopPropagation()}>
                    <Window {...window} />
                  </div>
                ))}
              </div>
            </main>
            <Dock />
          </>
        )}

        {ismobile && (
          <div className="relative w-full h-full">

            <div className={`absolute top-0 right-0 z-[60] ${showrecentapps ? 'invisible' : 'visible'}`}>
              <Control isopen={showcontrolcenter} onclose={() => setshowcontrolcenter(false)} ismobile={true} />
            </div>

            <div className={`absolute top-0 left-0 z-[60] w-full h-full pointer-events-none ${showrecentapps ? 'invisible' : 'visible'}`}>
              <NotificationCenter isopen={shownotificationcenter} onclose={() => setshownotificationcenter(false)} />
            </div>

            {!showcontrolcenter && !shownotificationcenter && <StatusBar />}

            <main className="absolute inset-0 pt-11 pb-1">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 z-10">
                  <MobileHomeScreen isoverlayopen={showrecentapps || showcontrolcenter || shownotificationcenter} />
                </div>
              </div>
            </main>

            {windows.length > 0 && (
              <div className="absolute inset-0 z-40 pointer-events-none">
                <div className="w-full h-full pointer-events-none">
                  {windows.map((window: any) => (
                    <Window
                      key={window.id}
                      {...window}
                      shouldblur={!showcontrolcenter && !showrecentapps}
                      issystemgestureactive={issystemgestureactive}
                    />
                  ))}
                </div>
              </div>
            )}

            <RecentApps isopen={showrecentapps} onclose={() => setshowrecentapps(false)} />

            <div className={`absolute bottom-0 left-0 right-0 h-10 flex items-end justify-center z-[9999] ${(shownotificationcenter || showcontrolcenter) ? 'pointer-events-none' : 'pointer-events-auto'}`}>
              <motion.div
                className="w-[140px] h-[5px] bg-white/80 rounded-full mb-[12px] cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-md"
                whileTap={{ scale: 0.95 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragStart={() => setissystemgestureactive(true)}
                onPointerUp={() => setissystemgestureactive(false)}
                onPointerCancel={() => setissystemgestureactive(false)}
                onDragEnd={(_, info) => {
                  setissystemgestureactive(false);
                  const { offset, velocity } = info;
                  const isflick = velocity.y < -500;
                  const isdragup = offset.y < -40;

                  if (showrecentapps) {
                    if (isflick || (offset.y < -30)) {
                      setshowrecentapps(false);
                      setwindows(windows.map((w: any) => ({ ...w, isminimized: true })));
                    }
                  } else if (showcontrolcenter) {
                    if (isdragup || isflick) setshowcontrolcenter(false);
                  } else if (shownotificationcenter) {
                    if (isdragup || isflick) setshownotificationcenter(false);
                  } else {
                    if (isdragup) {
                      if (isflick) {
                        setwindows(windows.map((w: any) => ({ ...w, isminimized: true })));
                      } else {
                        setshowrecentapps(true);
                      }
                    }
                  }
                }}
                onClick={() => {
                  setissystemgestureactive(false);
                  if (showrecentapps) {
                    setshowrecentapps(false);
                    setwindows(windows.map((w: any) => ({ ...w, isminimized: true })));
                  } else if (showcontrolcenter) {
                    setshowcontrolcenter(false);
                  } else if (shownotificationcenter) {
                    setshownotificationcenter(false);
                  } else {
                    setwindows(windows.map((w: any) => ({ ...w, isminimized: true })));
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
      <MacOSNotifications isopen={shownotificationcenter} onclose={() => setshownotificationcenter(false)} />
    </>
  );
};

export default Page;
