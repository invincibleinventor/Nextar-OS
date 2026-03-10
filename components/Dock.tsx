'use client';

import React from 'react';
import Image from 'next/image';
import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import { apps, openSystemItem, getfilteredapps } from './data';
import Launchpad from './apps/Launchpad';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useDevice } from './DeviceContext';
import ContextMenu from './ui/ContextMenu';
import TintedAppIcon from './ui/TintedAppIcon';
import { iselectron, battery, wifi as wifiApi } from '@/utils/platform';
import { useIsClay } from './hooks/useIsClay';
import { glassPill } from './hooks/useClayStyles';
import Control from './controlcenter';
import { LuWifi, LuSignal, LuBatteryFull, LuAppWindow, LuPlus, LuPin, LuPinOff, LuX } from 'react-icons/lu';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const Dock = () => {
  const { windows, addwindow, setactivewindow, activewindow, updatewindow, removewindow, nativeWindows, focusNativeWindow, minimizeNativeWindow, closeNativeWindow } = useWindows();
  const [launchpad, setlaunch] = useState(false);
  const [hoverapp, sethoverapp] = useState<string | null>(null);
  const { ismobile, setappmode } = useDevice();
  const clay = useIsClay();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const glassStyle: React.CSSProperties = {
    ...glassPill,
    background: 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 35%, transparent))',
    backdropFilter: 'blur(var(--glass-blur-heavy))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
  };

  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastClickedApp = useRef<{ name: string; index: number }>({ name: '', index: 0 });
  const filteredapps = useMemo(() => getfilteredapps(iselectron), []);

  // ─── Status tray state (clay mode) ───
  const [currentdate, setcurrentdate] = useState('');
  const [currenttime, setcurrenttime] = useState('');
  const [showcontrolcenter, setshowcontrolcenter] = useState(false);
  const [wifistatus, setwifistatus] = useState({ connected: false, ssid: null as string | null, available: false });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!iselectron) return;
    const fetch = async () => {
      try {
        const w = await wifiApi.getstatus();
        if (w.connected !== undefined) setwifistatus({ connected: w.connected, ssid: w.ssid, available: true });
      } catch { }
    };
    fetch();
    const iv = setInterval(fetch, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setcurrentdate(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      setcurrenttime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nextaros-dock-pinned');
    if (saved) {
      const ids = JSON.parse(saved).filter((id: string) => filteredapps.some(a => a.id === id));
      setPinnedAppIds(ids);
    } else {
      setPinnedAppIds(filteredapps.filter(a => a.pinned).map(a => a.id));
    }
    setIsInitialized(true);
  }, [filteredapps]);

  const savePinnedApps = (ids: string[]) => { setPinnedAppIds(ids); localStorage.setItem('nextaros-dock-pinned', JSON.stringify(ids)); };
  const togglePin = (appId: string) => {
    if (pinnedAppIds.includes(appId)) savePinnedApps(pinnedAppIds.filter(id => id !== appId));
    else savePinnedApps([...pinnedAppIds, appId]);
  };
  const getAppWindows = (appname: string) => windows.filter((win: any) => win.appname === appname && win.id !== 'explorer-desktop');

  const onclick = (id: string, name: string) => {
    // Handle native window clicks
    if (id.startsWith('native-')) {
      const item = nativeWindowItems.find((i: any) => i.id === id);
      if (item && focusNativeWindow) focusNativeWindow(item.windowId);
      return;
    }
    if (id === 'trash-folder') {
      addwindow({ id: `explorer-trash-${Date.now()}`, appname: 'Explorer', title: 'Trash', component: 'apps/Explorer', props: { istrash: true }, isminimized: false, defaultSize: { width: 900, height: 600 } });
      return;
    }
    const appwins = getAppWindows(name);
    if (appwins.length === 0) { openSystemItem(id, { addwindow, windows, updatewindow, setactivewindow, ismobile }); lastClickedApp.current = { name, index: 0 }; return; }
    if (appwins.length === 1) {
      const win = appwins[0];
      if (win.id === activewindow && !win.isminimized) updatewindow(win.id, { isminimized: true });
      else { updatewindow(win.id, { isminimized: false }); setactivewindow(win.id); }
      lastClickedApp.current = { name, index: 0 };
      return;
    }
    const nextIdx = lastClickedApp.current.name === name ? (lastClickedApp.current.index + 1) % appwins.length : 0;
    updatewindow(appwins[nextIdx].id, { isminimized: false });
    setactivewindow(appwins[nextIdx].id);
    lastClickedApp.current = { name, index: nextIdx };
  };

  const pinnedAppsList = pinnedAppIds.map(id => filteredapps.find(a => a.id === id)).filter(Boolean) as typeof apps;
  const uniqueOpenUnpinned = windows
    .map((win: any) => filteredapps.find((app) => app.appname === win.appname))
    .filter((app: any, idx: number, self: any[]) => app && !pinnedAppIds.includes(app.id) && idx === self.findIndex((t: any) => t?.id === app?.id)) as typeof apps;

  // Native window entries for the dock (grouped by wmClass)
  const nativeWindowItems = useMemo(() => {
    if (!nativeWindows || nativeWindows.length === 0) return [];
    const seen = new Set<string>();
    return nativeWindows
      .filter((w: any) => !w.isHidden && w.title)
      .filter((w: any) => {
        const key = w.wmClass || w.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((w: any) => ({
        id: `native-${w.windowId}`,
        appname: w.wmClass || w.title,
        icon: '/icons/appstore.svg',
        pinned: false,
        isSystem: false,
        isNative: true,
        windowId: w.windowId,
        componentname: '',
        maximizeable: true,
        multiwindow: true,
        titlebarblurred: false,
        additionaldata: {},
      }));
  }, [nativeWindows]);

  /* ─── Dock items differ between clay and classic ─── */
  const classicDockItems = [
    { id: 'launchpad-item', appname: 'LaunchPad', icon: '/launchpad.png', pinned: true, isSystem: true, componentname: 'apps/Launchpad', maximizeable: false, multiwindow: false, titlebarblurred: false, additionaldata: {} },
    ...pinnedAppsList,
    ...uniqueOpenUnpinned,
    ...nativeWindowItems,
    { id: 'trash-folder', appname: 'Trash', icon: '/trash.png', pinned: true, isSystem: true, componentname: 'Explorer', maximizeable: true, multiwindow: true, titlebarblurred: true, additionaldata: {} }
  ];

  const clayDockItems = [
    ...pinnedAppsList,
    ...uniqueOpenUnpinned,
    ...nativeWindowItems,
    { id: 'trash-folder', appname: 'Trash', icon: '/trash.png', pinned: true, isSystem: true, componentname: 'Explorer', maximizeable: true, multiwindow: true, titlebarblurred: true, additionaldata: {} }
  ];

  const dockItems = clay ? clayDockItems : classicDockItems;

  const basesize = clay ? 42 : 50;
  const gap = clay ? 6 : 10;
  const getprops = (i: number) => {
    if (hoverapp) {
      const idx = dockItems.findIndex((a) => a.appname === hoverapp);
      if (clay) {
        if (i === idx) return { size: basesize * 1.45, y: -basesize * 0.4 };
        if (Math.abs(i - idx) === 1) return { size: basesize * 1.25, y: -basesize * 0.2 };
        if (Math.abs(i - idx) === 2) return { size: basesize * 1.1, y: -basesize * 0.08 };
      } else {
        if (i === idx) return { size: basesize * 1.6, y: -basesize * 0.45 };
        if (Math.abs(i - idx) === 1) return { size: basesize * 1.4, y: -basesize * 0.3 };
        if (Math.abs(i - idx) === 2) return { size: basesize * 1.2, y: -basesize * 0.15 };
      }
    }
    return { size: basesize, y: 0 };
  };

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any } | null>(null);
  const handleContextMenu = (e: React.MouseEvent, item: any) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item }); };
  const handleQuit = (appName: string) => windows.filter((w: any) => w.appname === appName).forEach((w: any) => removewindow(w.id));

  const getContextMenuItems = () => {
    if (!contextMenu) return [];
    const item = contextMenu.item;

    // Native window context menu
    if (item.isNative) {
      const nwins = nativeWindows.filter((w: any) => (w.wmClass || w.title) === item.appname && !w.isHidden);
      const items: any[] = [];
      nwins.forEach((w: any) => items.push({ label: w.title || w.wmClass, icon: <LuAppWindow size={14} />, action: () => focusNativeWindow?.(w.windowId) }));
      if (nwins.length > 0) items.push({ separator: true });
      if (nwins.length === 1 && minimizeNativeWindow) {
        items.push({ label: 'Minimize', action: () => minimizeNativeWindow(nwins[0].windowId) });
      }
      if (nwins.length > 0 && closeNativeWindow) {
        items.push({ separator: true });
        items.push(nwins.length > 1
          ? { label: 'Close All Windows', icon: <LuX size={14} />, action: () => nwins.forEach((w: any) => closeNativeWindow(w.windowId)), danger: true }
          : { label: 'Quit', icon: <LuX size={14} />, action: () => closeNativeWindow(nwins[0].windowId) }
        );
      }
      return items;
    }

    const appWins = getAppWindows(item.appname);
    const items: any[] = [];
    if (appWins.length > 0) {
      appWins.forEach((win: any) => items.push({ label: win.title || win.appname, icon: <LuAppWindow size={14} />, action: () => { updatewindow(win.id, { isminimized: false }); setactivewindow(win.id); }, bold: win.id === activewindow }));
      items.push({ separator: true });
    }
    items.push({ label: appWins.length > 0 ? 'New Window' : 'Open', icon: <LuPlus size={14} />, action: () => openSystemItem(item.id, { addwindow, windows, updatewindow, setactivewindow, ismobile }) });
    if (!item.isSystem) { items.push({ separator: true }); items.push({ label: pinnedAppIds.includes(item.id) ? 'Unpin from Dock' : 'Pin to Dock', icon: pinnedAppIds.includes(item.id) ? <LuPinOff size={14} /> : <LuPin size={14} />, action: () => togglePin(item.id) }); }
    if (appWins.length > 0) {
      items.push({ separator: true });
      items.push(appWins.length > 1 ? { label: 'Close All Windows', icon: <LuX size={14} />, action: () => handleQuit(item.appname), danger: true } : { label: 'Quit', icon: <LuX size={14} />, action: () => handleQuit(item.appname) });
    }
    return items;
  };

  if (!isInitialized) return null;

  /* ═══════════════════════════════════════════════════
     CLAY MODE — Three separate floating glass pills
     ═══════════════════════════════════════════════════ */
  if (clay) {
    return (
      <div>
        <AnimatePresence>{launchpad && <Launchpad onclose={() => setlaunch(false)} />}</AnimatePresence>

        {contextMenu && (
          <div className="fixed z-[600]" style={{ bottom: '70px', left: contextMenu.x, transform: 'translateX(-50%)' }}>
            <ContextMenu x={0} y={0} items={getContextMenuItems()} onClose={() => setContextMenu(null)} className="!fixed !static !transform-none !m-0 !w-56" />
          </div>
        )}

        {/* LEFT PILLS — App Launcher + Ask Genie (vertically centered with 56px dock at bottom-2) */}
        <div className="fixed bottom-[14px] left-3 z-[200] flex items-center gap-2">
          {/* App Launcher pill */}
          <div
            className="flex items-center justify-center h-[44px] px-3 rounded-[22px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={glassStyle}
            onClick={() => setlaunch(!launchpad)}
          >
            <svg className="w-[16px] h-[16px] text-[--text-color]" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" />
            </svg>
          </div>

          {/* Search pill */}
          <div
            className="flex items-center gap-2.5 h-[44px] px-4 rounded-[22px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={{
              ...glassStyle,
              background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 28%, transparent))',
            }}
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-next'))}
          >
            <svg className="w-[15px] h-[15px] text-[--text-color] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <span className="text-[14px] text-[--text-color] font-medium whitespace-nowrap">Search</span>
          </div>
        </div>

        {/* CENTER PILL — App Icons (Dock) */}
        <div
          className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[200] flex items-center rounded-[22px]"
          style={{ height: '56px', padding: '0 8px', ...glassStyle }}
          onMouseLeave={() => sethoverapp(null)}
        >
          <div className="flex items-center" style={{ gap: `${gap}px` }}>
            {dockItems.map((app, i) => {
              const { size: iconsize, y: icony } = getprops(i);
              const ishover = hoverapp === app.appname;
              const isNativeItem = (app as any).isNative;
              const appwins = isNativeItem ? [] : getAppWindows(app.appname);
              const nativeCount = isNativeItem ? nativeWindows.filter((w: any) => (w.wmClass || w.title) === app.appname && !w.isHidden).length : 0;
              const wincount = appwins.length + nativeCount;
              const haswin = wincount > 0;
              const isActive = isNativeItem ? true : (haswin && appwins.some((w: any) => w.id === activewindow));
              const isTrash = app.id === 'trash-folder';

              return (
                <motion.div
                  key={app.id || i}
                  className="relative flex flex-col items-center cursor-pointer"
                  onClick={() => isTrash ? onclick('trash-folder', 'Explorer') : onclick(app.id, app.appname)}
                  onMouseEnter={() => sethoverapp(app.appname)}
                  onMouseLeave={() => sethoverapp(null)}
                  onContextMenu={(e) => handleContextMenu(e, app)}
                  animate={{ width: iconsize, height: iconsize, y: icony }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 20, mass: 1 }}
                  style={{ position: 'relative', zIndex: ishover ? 10 : undefined }}
                >
                  {ishover && (
                    <div
                      className="absolute bottom-full mb-3 text-[11px] text-[--text-color] px-2.5 py-1 rounded-[10px] font-semibold"
                      style={{ whiteSpace: 'nowrap', background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 20%, transparent))', backdropFilter: 'blur(var(--glass-blur-heavy))', WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}
                    >
                      {app.appname}
                      {wincount > 1 && <span className="ml-1 opacity-50">({wincount})</span>}
                    </div>
                  )}
                  <TintedAppIcon appId={app.id} appName={app.appname} originalIcon={app.icon} size={iconsize} useFill={true} />
                  {haswin && !isTrash && (
                    <div className="absolute flex items-center gap-[3px] -bottom-1">
                      {wincount <= 3 ? Array.from({ length: wincount }).map((_, idx) => (
                        <div key={idx} className="w-[4px] h-[4px] rounded-full" style={{ background: isActive ? 'var(--accent-color)' : 'var(--text-muted)', opacity: isActive ? 1 : 0.4 }} />
                      )) : (
                        <><div className="w-[4px] h-[4px] rounded-full" style={{ background: isActive ? 'var(--accent-color)' : 'var(--text-muted)' }} /><span className="text-[7px] font-bold" style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-muted)' }}>{wincount}</span></>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PILLS — Status Tray (3 sections) */}
        {/* RIGHT PILLS — vertically centered with 56px dock at bottom-2 */}
        <div className="fixed bottom-[14px] right-3 z-[200] flex items-center gap-1">
          {/* Section 1: Status icons */}
          <div
            className="hidden md:flex items-center gap-2 h-[44px] px-3 rounded-[22px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={glassStyle}
            onClick={() => setshowcontrolcenter(!showcontrolcenter)}
          >
            {!isOnline && <span className="text-[9px] font-bold text-[--text-muted] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--text-muted) 10%, transparent)' }}>OFFLINE</span>}
            <LuSignal className={`w-[14px] h-[14px] ${!isOnline ? 'text-[--text-muted]' : 'text-[--text-color]'}`} />
            <LuWifi className={`w-[14px] h-[14px] ${!isOnline ? 'text-[--text-muted]' : 'text-[--text-color]'}`} />
            <LuBatteryFull className="w-[18px] h-[18px] text-[--text-color]" />
          </div>

          {/* Section 2: Date — opens calendar */}
          <div
            className="hidden md:flex items-center h-[44px] px-3 rounded-[22px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={glassStyle}
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-calendar'))}
          >
            <span className="text-[13px] font-bold text-[--text-color] tabular-nums">{currentdate}</span>
          </div>

          {/* Section 3: Time + notification badge — opens notifications */}
          <div
            className="flex items-center gap-2 h-[44px] px-3 rounded-[22px] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={glassStyle}
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-notifications'))}
          >
            <span className="text-[13px] font-bold text-[--text-color] tabular-nums">{currenttime}</span>
            {notifications.length > 0 && (
              <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}>
                <span className="text-[10px] font-bold text-white">{notifications.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Control Center */}
        {showcontrolcenter && (
          <>
            <div className="fixed inset-0 z-[499]" onClick={() => setshowcontrolcenter(false)} />
            <div className="fixed bottom-[72px] right-3 z-[500]">
              <Control isopen={showcontrolcenter} onclose={() => setshowcontrolcenter(false)} ismobile={false} />
            </div>
          </>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     CLASSIC MODE — Original single-bar dock from main
     ═══════════════════════════════════════════════════ */
  return (
    <div>
      <AnimatePresence>{launchpad && <Launchpad onclose={() => setlaunch(false)} />}</AnimatePresence>

      {contextMenu && (
        <div className="fixed z-[600] mb-2 origin-bottom" style={{ bottom: '80px', left: contextMenu.x, transform: 'translateX(-50%)' }}>
          <ContextMenu x={0} y={0} items={getContextMenuItems()} onClose={() => setContextMenu(null)} className="!fixed !static !transform-none !m-0 !w-56 border border-[--border-color]" />
        </div>
      )}

      <motion.div
        data-tour="dock"
        className="fixed bottom-0 mx-auto left-0 right-0 w-max bg-surface px-[8px] pt-[10px] pb-[12px] flex flex-shrink-0 border-t-2 border-[--border-color] transition-colors duration-500 anime-glow-sm"
        onMouseLeave={() => sethoverapp(null)}
        style={{ zIndex: 200, height: '67px', overflow: 'visible', display: 'flex', justifyContent: 'center', flexDirection: 'row' }}
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
                animate={{ width: iconsize, height: iconsize, y: icony }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 150, damping: 20, mass: 1 }}
                style={{ position: 'relative', zIndex: ishover ? 10 : undefined }}
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
                <TintedAppIcon appId={app.id} appName={app.appname} originalIcon={app.icon} size={iconsize} useFill={true} />
                {haswin && !islaunchpad && !isTrash && (
                  <div className="absolute -bottom-2 flex items-center gap-[3px]">
                    {wincount <= 3 ? Array.from({ length: wincount }).map((_, idx) => (
                      <div key={idx} className="w-[5px] h-[5px] transition-colors" style={{ background: isActive ? 'var(--accent-color)' : 'var(--text-muted)', opacity: isActive ? 1 : 0.5 }} />
                    )) : (
                      <><div className="w-[5px] h-[5px]" style={{ background: isActive ? 'var(--accent-color)' : 'var(--text-muted)' }} /><span className="text-[8px] font-bold" style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-muted)' }}>{wincount}</span></>
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
