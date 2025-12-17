'use client';

import Image from 'next/image';

import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps, openSystemItem } from './data';
import Launchpad from './apps/Launchpad';
import { useState } from 'react';
import { useDevice } from './DeviceContext';

const Dock = () => {
  const { windows, addwindow, setactivewindow, focusortogglewindow, updatewindow } = useWindows();
  const [launchpad, setlaunch] = useState(false);
  const [hoverapp, sethoverapp] = useState<string | null>(null);
  const { ismobile } = useDevice();

  const onclick = (id: string, name: string, title?: string) => {
    const appwins = windows.filter((win: any) => win.appname === name);

    if (appwins.length > 0) {
      if (ismobile) {
        const lastWin = appwins[appwins.length - 1];
        updatewindow(lastWin.id, { isminimized: false });
        setactivewindow(lastWin.id);
      } else {
        focusortogglewindow(name);
      }
    } else {
      openSystemItem(id, {
        addwindow,
        windows,
        updatewindow,
        setactivewindow,
        ismobile
      });
    }
  }

  const basesize = 55;
  const gap = 10;
  const pinnedapps = apps.filter((app) => app.pinned);
  const applist = apps;
  const unpinnedopenapps = windows
    .map((win: any) => apps.find((app) => app.appname === win.appname))
    .filter((app: any) => app && !app.pinned);
  let dockapps = [...pinnedapps, ...unpinnedopenapps];
  dockapps = dockapps.filter((value, index, self) =>
    index === self.findIndex((t) => t.appname === value.appname)
  );

  const alldockitems = [
    {
      id: 'launchpad-item',
      appname: 'LaunchPad',
      icon: '/launchpad.png',
      pinned: true,
      componentname: 'apps/Launchpad'
    },
    ...dockapps
  ];

  const getprops = (i: number) => {
    if (hoverapp) {
      const idx = alldockitems.findIndex((app) => app.appname === hoverapp);
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
        {launchpad && <Launchpad onclose={() => setlaunch(false)} />}
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
          {alldockitems.map((app, i) => {
            const { size: iconsize, y: icony } = getprops(i);
            const ishover = hoverapp === app.appname;
            const haswin = windows.some((win: any) => win.appname === app.appname);
            const islaunchpad = app.appname === 'LaunchPad';

            return (
              <motion.div
                key={app.id || i}
                className="relative flex flex-col items-center cursor-pointer"
                onClick={() => islaunchpad ? setlaunch(!launchpad) : onclick(app.id, app.appname)}
                onMouseEnter={() => sethoverapp(app.appname)}
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
                    {app.appname}
                  </motion.div>
                )}
                <Image
                  src={app.icon}
                  alt={app.appname}
                  fill
                  sizes="80px"
                  className="rounded-xl transition-all duration-200 object-cover"
                  draggable={false}
                />
                {haswin && !islaunchpad && (
                  <div className="absolute bottom-0 w-[3px] h-[3px] bg-neutral-600 dark:bg-white rounded-md -mb-[4px] transition-all duration-200"></div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dock;
