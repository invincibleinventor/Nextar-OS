'use client';

import Image from 'next/image';

import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps, openSystemItem } from './data';
import Launchpad from './apps/Launchpad';
import { useState, useEffect } from 'react';
import { useDevice } from './DeviceContext';
import ContextMenu from './ui/ContextMenu';

const Dock = () => {
  const { windows, addwindow, setactivewindow, focusortogglewindow, updatewindow, removewindow } = useWindows();
  const [launchpad, setlaunch] = useState(false);
  const [hoverapp, sethoverapp] = useState<string | null>(null);
  const { ismobile } = useDevice();

  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('macos-dock-pinned');
    if (saved) {
      setPinnedAppIds(JSON.parse(saved));
    } else {
      setPinnedAppIds(apps.filter(a => a.pinned).map(a => a.id));
    }
    setIsInitialized(true);
  }, []);

  const savePinnedApps = (ids: string[]) => {
    setPinnedAppIds(ids);
    localStorage.setItem('macos-dock-pinned', JSON.stringify(ids));
  };

  const togglePin = (appId: string) => {
    if (pinnedAppIds.includes(appId)) {
      savePinnedApps(pinnedAppIds.filter(id => id !== appId));
    } else {
      savePinnedApps([...pinnedAppIds, appId]);
    }
  };

  const onclick = (id: string, name: string, title?: string) => {
    if (id === 'trash-folder') {
      addwindow({
        id: `finder-trash-${Date.now()}`,
        appname: 'Finder',
        title: 'Trash',
        component: 'apps/Finder',
        props: { istrash: true },
        isminimized: false,
        defaultSize: { width: 900, height: 600 }
      });
      return;
    }

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

  const pinnedAppsList = pinnedAppIds.map(id => apps.find(a => a.id === id)).filter(Boolean) as typeof apps;
  const openUnpinnedApps = windows
    .map((win: any) => apps.find((app) => app.appname === win.appname))
    .filter((app: any) => app && !pinnedAppIds.includes(app.id));

  const uniqueOpenUnpinned = openUnpinnedApps.filter((value: any, index: number, self: any[]) =>
    value && index === self.findIndex((t: any) => t?.id === value?.id)
  ) as typeof apps;

  const dockItems = [
    {
      id: 'launchpad-item',
      appname: 'LaunchPad',
      icon: '/launchpad.png',
      pinned: true,  
      isSystem: true,
      componentname: 'apps/Launchpad',
      maximizeable: false,
      multiwindow: false,
      titlebarblurred: false,
      additionaldata: {}
    },
    ...pinnedAppsList,
    ...uniqueOpenUnpinned,
    {
      id: 'trash-folder',
      appname: 'Trash',
      icon: '/trash.png',
      pinned: true,
      isSystem: true,
      componentname: 'Finder',
      maximizeable: true,
      multiwindow: true,
      titlebarblurred: true,
      additionaldata: {}
    }
  ];

  const basesize = 55;
  const gap = 10;

  const getprops = (i: number) => {
    if (hoverapp) {
      const idx = dockItems.findIndex((app) => app.appname === hoverapp);
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

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleQuit = (appName: string) => {
    const appWins = windows.filter((w: any) => w.appname === appName);
    appWins.forEach((w: any) => {
      removewindow(w.id);
    });
  };


  if (!isInitialized) return null;
  return (
    <div className=''>
      <AnimatePresence>
        {launchpad && <Launchpad onclose={() => setlaunch(false)} />}
      </AnimatePresence>

      {contextMenu && (
        <div
          className="fixed z-[9999] mb-2 origin-bottom"
          style={{
            bottom: '70px',
            left: contextMenu.x,
            transform: 'translateX(-50%)'
          }}
        >
          <ContextMenu
            x={0}
            y={0}
            items={[
              {
                label: 'Open',
                action: () => onclick(contextMenu.item.id, contextMenu.item.appname),
                disabled: windows.some((w: any) => w.appname === contextMenu.item.appname)
              },
              { separator: true },
              {
                label: pinnedAppIds.includes(contextMenu.item.id) ? 'Unpin from Dock' : 'Pin to Dock',
                action: () => togglePin(contextMenu.item.id),
                disabled: contextMenu.item.isSystem
              },
              { separator: true },
              {
                label: 'Quit',
                action: () => handleQuit(contextMenu.item.appname),
                disabled: !windows.some((w: any) => w.appname === contextMenu.item.appname)
              }
            ]}
            onClose={() => setContextMenu(null)}
            className="!fixed !static !transform-none !m-0 !w-48 shadow-2xl border border-white/20"
          />
        </div>
      )}

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
          {dockItems.map((app, i) => {
            const { size: iconsize, y: icony } = getprops(i);
            const ishover = hoverapp === app.appname;
            const haswin = windows.some((win: any) => win.appname === app.appname);
            const islaunchpad = app.id === 'launchpad-item';
            const isTrash = app.id === 'trash-folder';

            return (
              <motion.div
                key={app.id || i}
                className="relative flex flex-col items-center cursor-pointer"
                onClick={() => {
                  if (islaunchpad) setlaunch(!launchpad);
                  else if (isTrash) onclick('trash-folder', 'Finder');
                  else onclick(app.id, app.appname);
                }}
                onMouseEnter={() => sethoverapp(app.appname)}
                onMouseLeave={() => sethoverapp(null)}
                onContextMenu={(e) => handleContextMenu(e, app)}
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
                    className="absolute bottom-full mb-4 text-sm dark:bg-black dark:text-white dark:bg-opacity-10 bg-white text-black bg-opacity-30 backdrop-blur-lg px-2 py-1 rounded-md shadow-lg border border-white/20"
                    style={{ whiteSpace: 'nowrap' }}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
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

                {haswin && !islaunchpad && !isTrash && (
                  <div className="absolute -bottom-2 w-[4px] h-[4px] bg-black/50 dark:bg-white rounded-full"></div>
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
