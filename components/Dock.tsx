'use client';

import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps } from './app';
import { useState } from 'react';

const Dock = () => {
  const { windows, addWindow, toggleWindows, setActiveWindow } = useWindows();
  const [launchpad, setLaunch] = useState(false);
  const [hoverApp, setHoverApp] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const onClick = (id: string, name: string, title?: string) => {
    const appWins = windows.filter((win: any) => win.appName === name);

    if (appWins.length > 0) {
      toggleWindows(name);
    } else {
      const newWin = {
        id: `${name}-${Date.now()}`,
        appName: name,
        title: title || name,
        component: name,
        props: {},
        isMinimized: false,
        position: { top: 100, left: 100 },
        size: { width: 400, height: 300 },
        isMaximized: false,
      };
      addWindow(newWin);
      setActiveWindow(newWin.id);
    }
  };


  const openNewWin = (app:any) => {

    const newWin = {
      id: `${app.appName}-${Date.now()}`,
      appName: app.appName,
      title: app.title || app.appName,
      component: () => <div className="p-4">This is {app.appName}</div>,
      props: {},
      isMinimized: false,
      position: { top: 100, left: 100 },
      size: { width: 400, height: 300 },
      isMaximized: false,
    };
    addWindow(newWin);
    setActiveWindow(newWin.id);
    setLaunch(!launchpad)

  }

  const baseSize = 55;
  const gap = 10;
  const pinnedApps = apps.filter((app) => app.pinned);
  const appList = apps.filter((app) => app.appName !== 'LaunchPad')
  const unpinnedOpenApps = windows
    .map((win: any) => apps.find((app) => app.appName === win.appName))
    .filter((app: any) => app && !app.pinned);
    let dockApps = [...pinnedApps, ...unpinnedOpenApps];
    dockApps = dockApps.filter((value, index, self) =>
    index === self.findIndex((t) => t.appName === value.appName)
  );
  
  const getProps = (i: number) => {
    if (hoverApp) {
      const idx = dockApps.findIndex((app) => app.appName === hoverApp);
      if (i === idx) {
        return { size: baseSize * 1.6, y: -baseSize * 0.45 };
      }
      if (Math.abs(i - idx) === 1) {
        return { size: baseSize * 1.4, y: -baseSize * 0.3 };
      }
      if (Math.abs(i - idx) === 2) {
        return { size: baseSize * 1.2, y: -baseSize * 0.15 };
      }
    }
    return { size: baseSize, y: 0 };
  };
 
  const filteredApps = appList.filter(app =>
    app.appName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className=''>
      <AnimatePresence>
        {launchpad &&
          <div className="fixed inset-0 z-50" onClick={() => setLaunch(false)}>
            <motion.div
              id="launchpad"
              style={{ zIndex: 11 }}
              className={` absolute w-screen h-screen lg:w-[580px] px-10 mx-auto my-auto left-0 right-0 top-0 bottom-0 py-5 lg:h-96 lg:rounded-3xl bg-opacity-50 border-[0.01px] border-neutral-500 dark:bg-black bg-white dark:bg-opacity-20  backdrop-blur-[12px]`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                opacity: { duration: 0.3, ease: 'easeInOut' },
                scale: { type: 'spring', stiffness: 300, damping: 20 },
              }}
              onClick={(e:any) => e.stopPropagation()}
            >
              <div className='mx-auto relative'>
                <svg xmlns="http://www.w3.org/2000/svg" className='absolute w-4 text-black dark:text-neutral-400 left-4 h-4 top-0 bottom-0 my-auto' width="32" height="32" viewBox="0 0 32 32"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 27l7.5-7.5M28 13a9 9 0 1 1-18 0a9 9 0 0 1 18 0"/></svg>
                <input           onChange={e => setSearchTerm(e.target.value)}  className='px-2 pl-10 dark:text-white text-black placeholder:text-black dark:placeholder:text-neutral-200 font-medium placeholder:font-semibold outline-none   rounded-xl bg-neutral-700/10 dark:bg-neutral-200/10 font-sf   w-full text-xs w-full py-3 bg-transparent' placeholder='Search Apps'></input>
              </div>
              <div className='grid grid-cols-3 py-5 pt-5 sm:grid-cols-4 gap-6'>
                {filteredApps.map((app,index)=>(
                  <div onClick={()=>(openNewWin(app))}  key={index}  className='flex cursor-pointer rounded-xl py-2 flex-col gap-1 items-center content-center w-full h-full'>
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
        className="fixed  z-0 before:absolute before:inset-0 before:bg-transparent before:content-[''] before:backdrop-blur-[12px] before:webkit-backdrop-blur-[12px] before:z-[-1] bottom-1 mx-auto left-0 right-0 w-max before:rounded-3xl   dark:bg-black dark:bg-opacity-5 bg-white bg-opacity-10 px-[8px] pt-[10px] pb-[12px] flex flex-shrink-0 rounded-3xl border-[0.1px] dark:border-neutral-600 border-neutral-500 shadow-2xl"
        style={{
          zIndex: 11
          ,
          height: '67px',
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: `${gap}px`,
        }}
      >
        <div className="flex items-center">
          {dockApps.map((app, i) => {
            const { size: iconSize, y: iconY } = getProps(i);
            const isHover = hoverApp === app.appName;
            const hasWin = windows.some((win: any) => win.appName === app.appName);

            if (i === 0) {
              return (
                <motion.div
                  id="launchpad"
                  key={app.id}
                  className="relative flex flex-col items-center cursor-pointer"
                  onClick={() => setLaunch(!launchpad)}
                  onMouseEnter={() => setHoverApp(app.appName)}
                  onMouseLeave={() => setHoverApp(null)}
                  animate={{
                    width: iconSize,
                    height: iconSize,
                    y: iconY,
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
                    zIndex: isHover ? 10 : undefined,
                  }}
                >
                  {isHover && (
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
                      width: iconSize,
                      height: iconSize,
                    }}
                  />
                </motion.div>
              );
            } else {
              return (
                <motion.div
                  key={app.id}
                  className="relative flex flex-col items-center cursor-pointer"
                  onClick={() => onClick(app.id, app.appName)}
                  onMouseEnter={() => setHoverApp(app.appName)}
                  onMouseLeave={() => setHoverApp(null)}
                  animate={{
                    width: iconSize,
                    height: iconSize,
                    y: iconY,
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
                    zIndex: isHover ? 10 : undefined,
                  }}
                >
                  {isHover && (
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
                      width: iconSize,
                      height: iconSize,
                    }}
                  />
                  {hasWin && (
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
