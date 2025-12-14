'use client';

import { usewindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps } from './app';
import { useState } from 'react';

const Dock = () => {
  const { windows, addwindow, setactivewindow, focusortogglewindow } = usewindows();
  const [launchpad, setlaunch] = useState(false);
  const [hoverapp, sethoverapp] = useState<string | null>(null);
  const [searchterm, setsearchterm] = useState('');

  const onclick = (id: string, name: string, title?: string) => {
    const appwins = windows.filter((win: any) => win.appName === name);
    const app = apps.find((a) => a.appName === name);
    const startlarge = app && app.additionalData && app.additionalData.startLarge;
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
    const startmaximized = app.additionalData && app.additionalData.startMaximized;
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

  const filteredapps = applist.filter(app =>
    app.appName.toLowerCase().includes(searchterm.toLowerCase())
  );

  return (
    <div className=''>
      <AnimatePresence>
        {launchpad &&
          <div className="fixed inset-0 z-50" onClick={() => setlaunch(false)}>
            <motion.div
              id="launchpad"
              style={{ zIndex: 99999 }}
              className={` absolute  w-[calc(100vw-80px)]  px-10 md:w-[580px] mx-auto my-auto left-0 right-0 top-0 bottom-0 py-5 h-max md:h-96 rounded-3xl bg-opacity-50 border-[0.01px] border-neutral-500 dark:bg-black bg-white dark:border-neutral-600 dark:bg-opacity-20  backdrop-blur-[12px]`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                ease: 'easeInOut',
                duration: 0.3,
              }}
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className='mx-auto relative'>
                <svg xmlns="http://www.w3.org/2000/svg" className='absolute w-4 text-black dark:text-white left-4 h-4 top-0 bottom-0 my-auto' width="32" height="32" viewBox="0 0 32 32"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 27l7.5-7.5M28 13a9 9 0 1 1-18 0a9 9 0 0 1 18 0" /></svg>
                <input onChange={e => setsearchterm(e.target.value)} className='px-2 pl-10 dark:text-white text-black placeholder:text-black dark:placeholder:text-neutral-200 font-medium placeholder:font-semibold outline-none   rounded-xl  font-sf   w-full text-sm w-full py-3 bg-transparent' placeholder='Search Apps'></input>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-5 py-5 pt-5  gap-6'>
                {filteredapps.map((app, index) => (
                  <div onClick={() => (opennewwin(app))} key={index} className='flex cursor-pointer rounded-xl py-2 flex-col gap-1 items-center content-center w-full h-full'>
                    <img className='w-[60px] md:w-[70px] md:h-[70px] lg:w-[80px] lg:h-[80px] h-[60px]' src={app.icon}></img>
                    <div className='text-[13px] text-black  dark:text-white font-sf font-medium'>{app.appName}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        }
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
                  <motion.img
                    src={app.icon}
                    className="rounded-xl transition-all duration-200"
                    style={{
                      width: iconsize,
                      height: iconsize,
                    }}
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
                  <motion.img
                    src={app.icon}
                    className="rounded-xl transition-all duration-200"
                    style={{
                      width: iconsize,
                      height: iconsize,
                    }}
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
