'use client';

import Image from 'next/image';

import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps, openSystemItem, getfilteredapps } from './data';
import Launchpad from './apps/Launchpad';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useDevice } from './DeviceContext';
import ContextMenu from './ui/ContextMenu';
import TintedAppIcon from './ui/TintedAppIcon';
import { iselectron } from '@/utils/platform';

const Dock = () => {
  const { windows, addwindow, setactivewindow, activewindow, focusortogglewindow, updatewindow, removewindow } = useWindows();
  const [launchpad, setlaunch] = useState(false);
  const [hoverapp, sethoverapp] = useState<string | null>(null);
  const { ismobile } = useDevice();

  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastClickedApp = useRef<{ name: string; index: number }>({ name: '', index: 0 });

  const filteredapps = useMemo(() => getfilteredapps(iselectron), []);

  useEffect(() => {
    const saved = localStorage.getItem('nextaros-dock-pinned');
    if (saved) {
      const savedIds = JSON.parse(saved);
      const validIds = savedIds.filter((id: string) => filteredapps.some(a => a.id === id));
      setPinnedAppIds(validIds);
    } else {
      setPinnedAppIds(filteredapps.filter(a => a.pinned).map(a => a.id));
    }
    setIsInitialized(true);
  }, [filteredapps]);

  const savePinnedApps = (ids: string[]) => {
    setPinnedAppIds(ids);
    localStorage.setItem('nextaros-dock-pinned', JSON.stringify(ids));
  };

  const togglePin = (appId: string) => {
    if (pinnedAppIds.includes(appId)) {
      savePinnedApps(pinnedAppIds.filter(id => id !== appId));
    } else {
      savePinnedApps([...pinnedAppIds, appId]);
    }
  };

  const getAppWindows = (appname: string) => {
    return windows.filter((win: any) => win.appname === appname && win.id !== 'explorer-desktop');
  };

  const onclick = (id: string, name: string) => {
    if (id === 'trash-folder') {
      addwindow({
        id: `explorer-trash-${Date.now()}`,
        appname: 'Explorer',
        title: 'Trash',
        component: 'apps/Explorer',
        props: { istrash: true },
        isminimized: false,
        defaultSize: { width: 900, height: 600 }
      });
      return;
    }

    const appwins = getAppWindows(name);

    if (appwins.length === 0) {
      openSystemItem(id, { addwindow, windows, updatewindow, setactivewindow, ismobile });
      lastClickedApp.current = { name, index: 0 };
      return;
    }

    if (appwins.length === 1) {
      const win = appwins[0];
      if (win.id === activewindow && !win.isminimized) {
        updatewindow(win.id, { isminimized: true });
      } else {
        updatewindow(win.id, { isminimized: false });
        setactivewindow(win.id);
      }
      lastClickedApp.current = { name, index: 0 };
      return;
    }

    // Multi-window cycling
    let nextIdx = 0;
    if (lastClickedApp.current.name === name) {
      nextIdx = (lastClickedApp.current.index + 1) % appwins.length;
    }
    const targetWin = appwins[nextIdx];
    updatewindow(targetWin.id, { isminimized: false });
    setactivewindow(targetWin.id);
    lastClickedApp.current = { name, index: nextIdx };
  };

  const pinnedAppsList = pinnedAppIds.map(id => filteredapps.find(a => a.id === id)).filter(Boolean) as typeof apps;
  const openUnpinnedApps = windows
    .map((win: any) => filteredapps.find((app) => app.appname === win.appname))
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
      componentname: 'Explorer',
      maximizeable: true,
      multiwindow: true,
      titlebarblurred: true,
      additionaldata: {}
    }
  ];

  const basesize = 50;
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

  const getContextMenuItems = () => {
    if (!contextMenu) return [];
    const item = contextMenu.item;
    const appWins = getAppWindows(item.appname);
    const isSystem = item.isSystem;
    const hasWindows = appWins.length > 0;

    const items: any[] = [];

    // Window list
    if (appWins.length > 0) {
      appWins.forEach((win: any) => {
        items.push({
          label: win.title || win.appname,
          action: () => {
            updatewindow(win.id, { isminimized: false });
            setactivewindow(win.id);
          },
          bold: win.id === activewindow,
        });
      });
      items.push({ separator: true });
    }

    items.push({
      label: hasWindows ? 'New Window' : 'Open',
      action: () => openSystemItem(item.id, { addwindow, windows, updatewindow, setactivewindow, ismobile }),
    });

    if (!isSystem) {
      items.push({ separator: true });
      items.push({
        label: pinnedAppIds.includes(item.id) ? 'Unpin from Dock' : 'Pin to Dock',
        action: () => togglePin(item.id),
      });
    }

    if (hasWindows) {
      items.push({ separator: true });
      if (appWins.length > 1) {
        items.push({
          label: 'Close All Windows',
          action: () => handleQuit(item.appname),
          danger: true,
        });
      } else {
        items.push({
          label: 'Quit',
          action: () => handleQuit(item.appname),
        });
      }
    }

    return items;
  };


  if (!isInitialized) return null;
  return (
    <div className=''>
      <AnimatePresence>
        {launchpad && <Launchpad onclose={() => setlaunch(false)} />}
      </AnimatePresence>

      {contextMenu && (
        <div
          className="fixed z-[600] mb-2 origin-bottom"
          style={{
            bottom: '80px',
            left: contextMenu.x,
            transform: 'translateX(-50%)'
          }}
        >
          <ContextMenu
            x={0}
            y={0}
            items={getContextMenuItems()}
            onClose={() => setContextMenu(null)}
            className="!fixed !static !transform-none !m-0 !w-56 border border-[--border-color]"
          />
        </div>
      )}

      <motion.div
        data-tour="dock"
        className="fixed bottom-0 mx-auto left-0 right-0 w-max bg-surface px-[8px] pt-[10px] pb-[12px] flex flex-shrink-0 border-t-2 border-accent/40 transition-colors duration-500 anime-glow-sm"
        onMouseLeave={() => sethoverapp(null)}
        style={{
          zIndex: 200,
          height: '67px',
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'row',
        }}
      >
        <div className="flex items-center" style={{ gap: `${gap}px` }}>
          {dockItems.map((app, i) => {
            const { size: iconsize, y: icony } = getprops(i);
            const ishover = hoverapp === app.appname;
            const appwins = getAppWindows(app.appname);
            const wincount = appwins.length;
            const haswin = wincount > 0;
            const isActive = haswin && appwins.some((w: any) => w.id === activewindow);
            const islaunchpad = app.id === 'launchpad-item';
            const isTrash = app.id === 'trash-folder';

            return (
              <motion.div
                key={app.id || i}
                className="relative flex flex-col items-center cursor-pointer"
                onClick={() => {
                  if (islaunchpad) setlaunch(!launchpad);
                  else if (isTrash) onclick('trash-folder', 'Explorer');
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
                    className="absolute bottom-full mb-4 text-[13px] bg-overlay text-[--text-color] px-2 py-1 border border-[--border-color] anime-glow-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {app.appname}
                    {wincount > 1 && <span className="ml-1 opacity-60">({wincount})</span>}
                  </motion.div>
                )}

                <TintedAppIcon
                  appId={app.id}
                  appName={app.appname}
                  originalIcon={app.icon}
                  size={iconsize}
                  useFill={true}
                />

                {haswin && !islaunchpad && !isTrash && (
                  <div className="absolute -bottom-2 flex items-center gap-[3px]">
                    {wincount <= 3 ? (
                      Array.from({ length: wincount }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-[5px] h-[5px] transition-colors ${isActive ? 'bg-accent' : 'bg-[--text-muted]'}`}
                          style={{ opacity: isActive ? 1 : 0.5 }}
                        />
                      ))
                    ) : (
                      <>
                        <div className={`w-[5px] h-[5px] ${isActive ? 'bg-accent' : 'bg-[--text-muted]'}`} />
                        <span className={`text-[8px] font-bold ${isActive ? 'text-accent' : 'text-[--text-muted]'}`}>{wincount}</span>
                      </>
                    )}
                  </div>
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
