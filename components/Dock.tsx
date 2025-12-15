'use client';

import Image from 'next/image';

import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps } from './app';
import Launchpad from './apps/Launchpad';
import { useState } from 'react';

const Dock = () => {
  const { windows, addwindow, setactivewindow, focusortogglewindow } = useWindows();
  const [launchpad, setlaunch] = useState(false);
  const [hoverapp, sethoverapp] = useState<string | null>(null);
  const onclick = (id: string, name: string, title?: string) => {
    const appwins = windows.filter((win: any) => win.appName === name);
    const app = apps.find((a) => a.appName === name);
    const startlarge = app && (app.additionalData as any) && (app.additionalData as any).startLarge;
    if (appwins.length > 0) {
      focusortogglewindow(name);
    } else {
      let position = { top: 100, left: 100 };
      let size = { width: 400, height: 300 };
      const ismaximized = false;
      if (startlarge && typeof window !== 'undefined') {
        const screenwidth = window.innerWidth;
        const screenheight = window.innerHeight;
        size = {
          width: Math.round(screenwidth * 0.85),
          height: Math.round((screenheight - 30 - 75) * 0.85),
        };
        position = {
          top: 30 + Math.round(((screenheight - 30 - 75) - size.height) / 2),
          left: Math.round((screenwidth - size.width) / 2),
        };
      }
      const newwin = {
        id: `${name}-${Date.now()}`,
        appName: name,
        additionalData: app?.additionalData || {},
        title: title || app?.appName || name,
        component: app?.componentName || name,
        props: {},
        isMinimized: false,
        position,
        size,
        isMaximized: ismaximized,
      };
      addwindow(newwin);
      setactivewindow(newwin.id);
    }
  }


  const opennewwin = (app: any) => {
    const startmaximized = (app.additionalData as any) && (app.additionalData as any).startMaximized;
    const newwin = {
      id: `${app.appName}-${Date.now()}`,
      appName: app.appName,
      additionalData: app.additionalData || {},
      title: app.title || app.appName,
      component: app.componentName,
      props: {},
      isMinimized: false,
      position: { top: 100, left: 100 },
      size: { width: 400, height: 300 },
      isMaximized: !!startmaximized,
    };
    addwindow(newwin);
    setactivewindow(newwin.id);
    setlaunch(!launchpad);
  }

  const basesize = 55;
  const gap = 10;
  const pinnedapps = apps.filter((app) => app.pinned);
  const applist = apps.filter((app) => app.appName !== 'LaunchPad')
  const unpinnedopenapps = windows
    .map((win: any) => apps.find((app) => app.appName === win.appName))
    .filter((app: any) => app && !app.pinned);
  let dockapps = [...pinnedapps, ...unpinnedopenapps];
  dockapps = dockapps.filter((value, index, self) =>
    index === self.findIndex((t) => t.appName === value.appName)
  );

  const getprops = (i: number) => {
    if (hoverapp) {
      const idx = dockapps.findIndex((app) => app.appName === hoverapp);
      if (i === idx) {
        return { size: basesize * 1.6, y: -basesize * 0.45 };
      }
      if (Math.abs(i - idx) === 1) {
        return { size: basesize * 1.4, y: -basesize * 0.3 };
      }
      if (Math.abs(i - idx) === 2) {
        return { size: basesize * 1.2, y: -basesize * 0.15 };
      }
    }
    return { size: basesize, y: 0 };
  };



  return (
    <div className=''>
      <AnimatePresence>
        {launchpad && <Launchpad onClose={() => setlaunch(false)} />}
      </AnimatePresence>

      <motion.div
        className="fixed z-0 before:absolute before:inset-0 before:bg-transparent before:content-[''] before:backdrop-blur-[12px] before:webkit-backdrop-blur-[12px] before:z-[-1] bottom-1 mx-auto left-0 right-0 w-max before:rounded-3xl bg-white bg-opacity-30 dark:bg-black dark:bg-opacity-10 px-[8px] pt-[10px] pb-[12px] flex flex-shrink-0 rounded-3xl border-[0.1px] dark:border-neutral-600 border-neutral-500 shadow-2xl transition-colors duration-500"
        style={{
          zIndex: 9999,
          height: '67px',
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: `${gap}px`,
        }}
      >
        <div className="flex items-center">
          {dockapps.map((app, i) => {
            const { size: iconsize, y: icony } = getprops(i);
            const ishover = hoverapp === app.appName;
            const haswin = windows.some((win: any) => win.appName === app.appName);

            if (i === 0) {
              return (
                <motion.div
                  id="launchpad"
                  key={app.id}
                  className="relative flex flex-col items-center cursor-pointer"
                  onClick={() => setlaunch(!launchpad)}
                  onMouseEnter={() => sethoverapp(app.appName)}
                  onMouseLeave={() => sethoverapp(null)}
                  animate={{
                    width: iconsize,
                    height: iconsize,
                    y: icony,
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 20,
                    mass: 1,
                  }}
                  style={{
                    position: 'relative',
                    zIndex: ishover ? 10 : undefined,
                  }}
                >
                  {ishover && (
                    <motion.div
                      className="absolute bottom-full mb-2 text-sm dark:bg-black dark:text-white dark:bg-opacity-10 bg-white text-black bg-opacity-30 backdrop-blur-lg px-2 py-1 rounded-md shadow-lg"
                      style={{
                        whiteSpace: 'nowrap',
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 150,
                        damping: 20,
                      }}
                    >
                      {app.appName}
                    </motion.div>
                  )}
                  <Image
                    src={app.icon}
                    alt={app.appName}
                    fill
                    sizes="80px"
                    className="rounded-xl transition-all duration-200 object-cover"
                    draggable={false}
                  />
                </motion.div>
              );
            } else {
              return (
                <motion.div
                  key={app.id}
                  className="relative flex flex-col items-center cursor-pointer"
                  onClick={() => onclick(app.id, app.appName)}
                  onMouseEnter={() => sethoverapp(app.appName)}
                  onMouseLeave={() => sethoverapp(null)}
                  animate={{
                    width: iconsize,
                    height: iconsize,
                    y: icony,
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 20,
                    mass: 1,
                  }}
                  style={{
                    position: 'relative',
                    zIndex: ishover ? 10 : undefined,
                  }}
                >
                  {ishover && (
                    <motion.div
                      className="absolute bottom-full mb-2 text-sm dark:bg-black dark:text-white dark:bg-opacity-10 bg-white text-black bg-opacity-30 backdrop-blur-lg px-2 py-1 rounded-md shadow-lg"
                      style={{
                        whiteSpace: 'nowrap',
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 150,
                        damping: 20,
                      }}
                    >
                      {app.appName}
                    </motion.div>
                  )}
                  <Image
                    src={app.icon}
                    alt={app.appName}
                    fill
                    sizes="80px"
                    className="rounded-xl transition-all duration-200 object-cover"
                    draggable={false}
                  />
                  {haswin && (
                    <div className="absolute bottom-0 w-[3px] h-[3px] bg-neutral-600 dark:bg-white rounded-md -mb-[4px] transition-all duration-200"></div>
                  )}
                </motion.div>
              );
            }
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dock;
