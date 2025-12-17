'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWindows } from '@/components/WindowContext';
import Window from '@/components/Window';
import { apps, filesystem } from '@/components/data';
import { useDevice } from '@/components/DeviceContext';
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

  const openwelcome = () => {
    const welcomeapp = apps.find((app) => app.id === 'welcome');
    if (!welcomeapp) return;

    addwindow({
      id: `welcome-${Date.now()}`,
      appname: 'Welcome',
      title: 'Welcome',
      component: welcomeapp.componentname,
      icon: '/info.png',
      isminimized: false,
      ismaximized: false,
      position: { top: 50, left: 50 },
      size: { width: 900, height: 600 },
      props: {},
    });
  };

  const openoldportfolio = () => {
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

  const haslaunchedwelcome = React.useRef(false);

  useEffect(() => {
    if (osstate === 'unlocked' && !haslaunchedwelcome.current) {
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
          size: { width: 900, height: 600 },
          props: {}
        });
        haslaunchedwelcome.current = true;
      }
    }
  }, [osstate, addwindow]);

  const StatusBar = () => {
    const now = new Date();
    const timestr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

    return (
      <motion.div
        className="absolute top-0 left-0 right-0 h-11 z-[10000] flex items-center justify-between px-6 cursor-pointer bg-transparent backdrop-blur-md"
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
        className={`relative w-full h-full transition-all duration-500 ease-out bg-center bg-cover bg-no-repeat bg-[url('/bg.jpg')] dark:bg-[url('/bg-dark.jpg')]
                    ${osstate === 'unlocked'
            ? 'opacity-100 scale-100'
            : osstate === 'booting' ? 'opacity-0 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none'}`}
      >
        {!ismobile && (
          <>
            <Panel ontogglenotifications={() => setshownotificationcenter(prev => !prev)} />
            <main
              id="desktop-main"
              className="absolute inset-0 pt-6 pb-16"
              onClick={() => {
                if (shownotificationcenter) setshownotificationcenter(false);
              }}
            >
              <div className='p-4 pt-10 space-y-4 flex flex-col items-end w-max ml-auto content-end'>
                {filesystem.filter(item => item.parent === 'root-desktop').map((item) => (
                  <div
                    key={item.id}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (item.mimetype === 'application/x-executable') {
                        const app = apps.find(a => a.appname === item.appname);
                        if (app) {
                          addwindow({
                            id: `${app.appname}-${Date.now()}`,
                            appname: app.appname,
                            title: app.appname,
                            component: app.componentname,
                            icon: app.icon,
                            isminimized: false,
                            ismaximized: false,
                            position: { top: 100, left: 100 },
                            size: app.defaultsize || { width: 900, height: 600 },
                            props: {},
                          });
                        }
                      } else if (item.mimetype === 'text/x-uri' && item.link) {
                        const safariapp = apps.find(a => a.id === 'safari');
                        if (safariapp) {
                          addwindow({
                            id: `safari-${Date.now()}`,
                            appname: safariapp.appname,
                            title: safariapp.appname,
                            component: safariapp.componentname,
                            icon: safariapp.icon,
                            isminimized: false,
                            ismaximized: false,
                            position: { top: 50, left: 50 },
                            size: { width: 1024, height: 768 },
                            props: { initialurl: item.link }
                          });
                        }
                      } else if (item.mimetype === 'application/pdf') {
                        const fileviewerapp = apps.find(a => a.id === 'fileviewer');
                        if (fileviewerapp) {
                          addwindow({
                            id: `fileviewer-${Date.now()}`,
                            appname: fileviewerapp.appname,
                            title: item.name,
                            component: fileviewerapp.componentname,
                            icon: fileviewerapp.icon,
                            isminimized: false,
                            ismaximized: false,
                            position: { top: 100, left: 100 },
                            size: { width: 700, height: 800 },
                            props: { content: item.content, title: item.name, type: 'application/pdf' }
                          });
                        }
                      }
                    }}
                    className="p-2 flex hover:bg-neutral-400/20 rounded-md hover:backdrop-blur-lg hover:filter px-2 flex-col items-center content-center text-white cursor-default group border border-transparent hover:border-white/10 transition-all w-[90px]"
                  >
                    <div className="w-14 h-14 relative mb-1 drop-shadow-md">
                      {item.icon ? (
                        <div className="w-full h-full">{item.icon}</div>
                      ) : <div className="w-full h-full bg-gray-400 rounded"></div>
                      }
                    </div>
                    <span className='text-[11px] w-full font-semibold text-white drop-shadow-md text-center break-words leading-tight line-clamp-2 px-1 rounded-sm group-hover:text-white'>{item.name}</span>
                  </div>
                ))}

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

            <div className={`absolute top-0 right-0 z-[10001] visible`}>
              <Control isopen={showcontrolcenter} onclose={() => setshowcontrolcenter(false)} ismobile={true} />
            </div>

            <div className={`absolute top-0 left-0 z-[10000] w-full h-full pointer-events-none visible`}>
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
              <div className={`absolute inset-0 pointer-events-none ${showrecentapps ? 'z-[9992]' : 'z-40'}`}>
                <div id="mobile-desktop" className="w-full h-full pointer-events-none overflow-hidden">
                  {windows.map((window: any) => (
                    <Window
                      key={window.id}
                      {...window}
                      shouldblur={showcontrolcenter || showrecentapps || shownotificationcenter}
                      isRecentAppView={showrecentapps}
                      issystemgestureactive={issystemgestureactive}
                    />
                  ))}
                </div>
              </div>
            )}

            <RecentApps isopen={showrecentapps} onclose={() => setshowrecentapps(false)} />

            <div className={`absolute bottom-0 left-0 right-0 h-10 flex items-end justify-center z-[9999] ${(shownotificationcenter || showcontrolcenter) ? 'pointer-events-none' : 'pointer-events-auto'}`}>
              <motion.div
                className="w-[140px] h-[21px] flex items-center content-center cursor-pointer"
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
              >
                <div className="w-full h-[5px] mb-[12px] bg-neutral-400/90 dark:bg-white/80 rounded-full  cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-md"></div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <MacOSNotifications isopen={shownotificationcenter} onclose={() => setshownotificationcenter(false)} />
    </>
  );
};

export default Page;
