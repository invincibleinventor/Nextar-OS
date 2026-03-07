'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useWindows } from '@/components/WindowContext';
import Window from '@/components/Window';
import { apps, openSystemItem, getFileIcon } from '@/components/data';
import { useDevice } from '@/components/DeviceContext';
import Panel from '@/components/panel';
import Dock from '@/components/Dock';
import BootScreen from '@/components/BootScreen';
import LockScreen from '@/components/LockScreen';
import MobileHomeScreen from '@/components/MobileHomeScreen';
import Control from '@/components/controlcenter';
import RecentApps from '@/components/RecentApps';
import { LuWifi, LuSignal, LuBatteryFull } from "react-icons/lu";
import { motion, useMotionValue } from 'framer-motion';

import NotificationCenter from '@/components/NotificationCenter';
import CalendarPanel from '@/components/CalendarPanel';
import ContextMenu from '@/components/ui/ContextMenu';
import { SelectionArea } from '@/components/ui/SelectionArea';
import FileModal from '@/components/ui/FileModal';
import { useFileSystem } from '@/components/FileSystemContext';
import { useAuth } from '@/components/AuthContext';
import Next from '@/components/Next';
import AppSwitcher from '@/components/AppSwitcher';
import TourGuide from '@/components/TourGuide';
import ForceQuit from '@/components/ForceQuit';
import AboutDevice from '@/components/AboutDevice';
import { useSettings } from '@/components/SettingsContext';
import { useMenuRegistration } from '@/components/AppMenuContext';
import Portfolio from '@/components/Portfolio';
import DesktopEffects from '@/components/DesktopEffects';
import { useNotifications } from '@/components/NotificationContext';
import { ProfileWidget, StatsWidget, SkillsWidget, ExperienceWidget } from '@/components/Widgets';

const GRID_CELL = 106; // 90px icon + 16px gap
const GRID_PAD_TOP = 40; // top padding (clear panel)
const WIDGET_IDS = ['profile', 'skills', 'experience', 'stats'] as const;

const GridItem = React.memo(({ col, row, span, padX, onReposition, children, className, style, whileDrag, ...rest }: {
  col: number; row: number; span: number; padX: number;
  onReposition: (dCols: number, dRows: number) => void;
  children: React.ReactNode;
  className?: string; style?: React.CSSProperties; whileDrag?: any;
  [key: string]: any;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const justDragged = React.useRef(false);
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      data-no-selection
      style={{
        position: 'absolute',
        left: col * GRID_CELL + padX,
        top: row * GRID_CELL + GRID_PAD_TOP,
        width: span === 1 ? 90 : span * GRID_CELL - 16,
        height: span === 1 ? undefined : span * GRID_CELL - 16,
        x, y,
        ...style,
      }}
      whileDrag={whileDrag}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      onDragStart={() => { justDragged.current = true; }}
      onDragEnd={(_: any, info: any) => {
        const dCols = Math.round(info.offset.x / GRID_CELL);
        const dRows = Math.round(info.offset.y / GRID_CELL);
        x.set(0);
        y.set(0);
        // Any drag movement suppresses click
        justDragged.current = true;
        setTimeout(() => { justDragged.current = false; }, 300);
        if (dCols !== 0 || dRows !== 0) {
          onReposition(dCols, dRows);
        }
      }}
      onClickCapture={(e: React.MouseEvent) => {
        if (justDragged.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      className={className || ''}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
GridItem.displayName = 'GridItem';

const Desktop = () => {
  const { windows, addwindow, setwindows, updatewindow, setactivewindow, activewindow } = useWindows();
  const { osstate, ismobile } = useDevice();
  const { wallpaperurl, islightbackground, inverselabelcolor } = useSettings();
  const [showcontrolcenter, setshowcontrolcenter] = useState(false);
  const [shownotificationcenter, setshownotificationcenter] = useState(false);
  const [showcalendar, setshowcalendar] = useState(false);
  const [showrecentapps, setshowrecentapps] = useState(false);
  const [shownext, setshownext] = useState(false);
  const [showappswitcher, setshowappswitcher] = useState(false);
  const [showtour, setshowtour] = useState(false);
  const [showforcequit, setshowforcequit] = useState(false);
  const [showaboutmac, setshowaboutmac] = useState(false);
  const [issystemgestureactive, setissystemgestureactive] = useState(false);
  const [showdesktopeffects, setshowdesktopeffects] = useState(false);

  const { user } = useAuth();
  const { notifications } = useNotifications();
  const hasActiveNotification = notifications.some(n => !n.viewed);



  const haslaunchedwelcome = React.useRef(false);

  const { createFolder, createFile, files, emptyTrash, moveItem, refreshFileSystem, copyItem, cutItem, pasteItem, clipboard, moveToTrash, renameItem, currentUserDesktopId } = useFileSystem();

  const context = { addwindow, windows, updatewindow, setactivewindow, ismobile, activewindow, files };
  const windowsref = useRef(windows);
  windowsref.current = windows;
  const activewindowref = useRef(activewindow);
  activewindowref.current = activewindow;
  const overlayref = useRef({ showcontrolcenter, shownotificationcenter, showcalendar, showrecentapps, shownext, showforcequit, showaboutmac, showappswitcher });
  overlayref.current = { showcontrolcenter, shownotificationcenter, showcalendar, showrecentapps, shownext, showforcequit, showaboutmac, showappswitcher };
  const containerRef = useRef<HTMLDivElement>(null);


  const [fileModal, setFileModal] = useState<{ isOpen: boolean, type: 'create-folder' | 'create-file' | 'rename', initialValue?: string }>({ isOpen: false, type: 'create-folder' });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string } | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Grid-based desktop positions — {col, row} per item, persisted in localStorage
  const [gridPositions, setGridPositions] = useState<Record<string, { col: number; row: number }>>({});
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('desktop-grid-positions');
    if (saved) setGridPositions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
    // Re-run when conditions change that affect whether the container div is in the DOM
  }, [osstate, user, ismobile]);

  const gridCols = containerSize.w > 0 ? Math.floor(containerSize.w / GRID_CELL) : 0;
  const gridRows = containerSize.h > 0 ? Math.floor((containerSize.h - GRID_PAD_TOP) / GRID_CELL) : 0;
  // Center grid — equal padding on both sides
  const gridPadX = containerSize.w > 0 ? Math.floor((containerSize.w - gridCols * GRID_CELL + 16) / 2) : 0;

  const desktopFiles = useMemo(() =>
    files.filter(f => f.parent === currentUserDesktopId && !f.isTrash),
    [files, currentUserDesktopId]
  );

  // Compute effective positions: saved positions + auto-layout for unpositioned items
  const itemPositions = useMemo(() => {
    if (gridCols === 0 || gridRows === 0) return {};

    const positions: Record<string, { col: number; row: number }> = {};
    const occupied = new Set<string>();

    const markCells = (col: number, row: number, span: number) => {
      for (let c = 0; c < span; c++)
        for (let r = 0; r < span; r++)
          occupied.add(`${col + c},${row + r}`);
    };

    const isFree = (col: number, row: number, span: number) => {
      if (col < 0 || row < 0 || col + span > gridCols || row + span > gridRows) return false;
      for (let c = 0; c < span; c++)
        for (let r = 0; r < span; r++)
          if (occupied.has(`${col + c},${row + r}`)) return false;
      return true;
    };

    const spanOf = (id: string) => id.startsWith('widget-') ? 2 : 1;

    // Place items with saved positions first
    const allIds = [...WIDGET_IDS.map(w => `widget-${w}`), ...desktopFiles.map(f => f.id)];
    allIds.forEach(id => {
      const saved = gridPositions[id];
      if (saved) {
        const span = spanOf(id);
        const col = Math.max(0, Math.min(gridCols - span, saved.col));
        const row = Math.max(0, Math.min(gridRows - span, saved.row));
        positions[id] = { col, row };
        markCells(col, row, span);
      }
    });

    // Auto-place widgets (left side, top to bottom)
    const unplacedWidgets = WIDGET_IDS.map(w => `widget-${w}`).filter(id => !positions[id]);
    for (const id of unplacedWidgets) {
      let placed = false;
      for (let col = 0; col <= gridCols - 2 && !placed; col++) {
        for (let row = 0; row <= gridRows - 2 && !placed; row++) {
          if (isFree(col, row, 2)) {
            positions[id] = { col, row };
            markCells(col, row, 2);
            placed = true;
          }
        }
      }
    }

    // Auto-place files (right side, top to bottom, right to left)
    const unplacedFiles = desktopFiles.map(f => f.id).filter(id => !positions[id]);
    for (const id of unplacedFiles) {
      let placed = false;
      for (let col = gridCols - 1; col >= 0 && !placed; col--) {
        for (let row = 0; row < gridRows && !placed; row++) {
          if (isFree(col, row, 1)) {
            positions[id] = { col, row };
            markCells(col, row, 1);
            placed = true;
          }
        }
      }
    }

    return positions;
  }, [gridPositions, desktopFiles, gridCols, gridRows]);

  const handleReposition = (id: string, span: number, dCols: number, dRows: number) => {
    const current = itemPositions[id];
    if (!current) return;
    const newCol = Math.max(0, Math.min(gridCols - span, current.col + dCols));
    const newRow = Math.max(0, Math.min(gridRows - span, current.row + dRows));
    setGridPositions(prev => {
      const next = { ...prev, [id]: { col: newCol, row: newRow } };
      localStorage.setItem('desktop-grid-positions', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const handleGlobalMenu = (e: CustomEvent) => {
      const { appId, actionId, title } = e.detail;
      const effectiveActionId = actionId || title;

      if (appId === 'explorer' && effectiveActionId === 'new-window') {
        const lastWindow = windows[windows.length - 1];
        if (lastWindow && lastWindow.appname === 'Explorer' && (Date.now() - (lastWindow.lastInteraction || 0) < 500)) {
          return;
        }

        const username = user?.username || 'Guest';
        const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));

        addwindow({
          id: `explorer-${Date.now()}`,
          appname: 'Explorer',
          title: 'Explorer',
          component: 'apps/Explorer',
          icon: '/explorer.png',
          isminimized: false,
          ismaximized: false,
          position: { top: 100, left: 100 },
          size: { width: 800, height: 500 },
          props: { initialpath: ['Disk Drive', 'Users', homeDir, 'Desktop'] }
        });
        return;
      }

      if (activewindow) {
        return;
      }

      if (effectiveActionId === 'new-window') {
      }

      if (effectiveActionId === 'new-folder') {
        setFileModal({ isOpen: true, type: 'create-folder', initialValue: '' });
      } else if (effectiveActionId === 'new-file') {
        setFileModal({ isOpen: true, type: 'create-file', initialValue: '' });
      }
    };

    window.addEventListener('menu-action' as any, handleGlobalMenu);
    return () => window.removeEventListener('menu-action' as any, handleGlobalMenu);
  }, [windows, activewindow]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
        e.preventDefault();
        const aw = activewindowref.current;
        if (aw && aw !== 'explorer-desktop') {
          setwindows((prev: any[]) => prev.filter((w: any) => w.id !== aw));
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const aw = activewindowref.current;
        if (aw && aw !== 'explorer-desktop') {
          setwindows((prev: any[]) => prev.filter((w: any) => w.id !== aw));
        }
        return;
      }

      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setshownext(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        if (!showappswitcher) {
          setshowappswitcher(true);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 't') {
        e.preventDefault();
        setshowtour(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'Escape' || e.key === 'Esc')) {
        e.preventDefault();
        setshowforcequit(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        const aw = activewindowref.current;
        if (aw) {
          updatewindow(aw, { isminimized: true });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        const currentWindows = windowsref.current;
        const settingsExists = currentWindows.find((w: any) => w.appname === 'Settings');
        if (!settingsExists) {
          addwindow({
            id: `settings-${Date.now()}`,
            appname: 'Settings',
            component: 'apps/Settings',
            props: {},
            isminimized: false,
            ismaximized: false,
          });
        } else {
          setactivewindow(settingsExists.id);
        }
      }
    };

    const handleStartTour = () => setshowtour(true);
    const handleToggleNext = () => setshownext(prev => !prev);
    const handleForceQuit = () => setshowforcequit(true);
    const handleAboutMac = () => setshowaboutmac(true);
    const handleCloseAbout = () => {
      const currentWindows = windowsref.current;
      const aboutWindow = currentWindows.find((w: any) => w.appname === 'About Bala' || w.id?.startsWith('aboutbala'));
      if (aboutWindow) {
        updatewindow(aboutWindow.id, { isminimized: true });
      }
    };
    const handleTourEnded = () => {
      const currentWindows = windowsref.current;
      const aboutWindow = currentWindows.find((w: any) => w.appname === 'About Bala' || w.id?.startsWith('aboutbala'));
      if (aboutWindow) {
        updatewindow(aboutWindow.id, { isminimized: false });
        setactivewindow(aboutWindow.id);
      }
    };
    const handleToggleDesktopEffects = () => setshowdesktopeffects((prev: boolean) => !prev);
    const handleToggleNotifications = () => { setshownotificationcenter((prev: boolean) => { if (!prev) setshowcalendar(false); return !prev; }); };
    const handleOpenNotifications = () => { setshownotificationcenter(true); setshowcalendar(false); };
    const handleToggleCalendar = () => { setshowcalendar((prev: boolean) => { if (!prev) setshownotificationcenter(false); return !prev; }); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('start-tour', handleStartTour);
    window.addEventListener('toggle-next', handleToggleNext);
    window.addEventListener('show-force-quit', handleForceQuit);
    window.addEventListener('show-about-mac', handleAboutMac);
    window.addEventListener('close-about', handleCloseAbout);
    window.addEventListener('tour-ended', handleTourEnded);
    window.addEventListener('toggle-desktop-effects', handleToggleDesktopEffects);
    window.addEventListener('toggle-calendar', handleToggleCalendar);
    window.addEventListener('toggle-notifications', handleToggleNotifications);
    window.addEventListener('open-notifications', handleOpenNotifications);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('start-tour', handleStartTour);
      window.removeEventListener('toggle-next', handleToggleNext);
      window.removeEventListener('show-force-quit', handleForceQuit);
      window.removeEventListener('show-about-mac', handleAboutMac);
      window.removeEventListener('close-about', handleCloseAbout);
      window.removeEventListener('tour-ended', handleTourEnded);
      window.removeEventListener('toggle-desktop-effects', handleToggleDesktopEffects);
      window.removeEventListener('toggle-notifications', handleToggleNotifications);
      window.removeEventListener('open-notifications', handleOpenNotifications);
      window.removeEventListener('toggle-calendar', handleToggleCalendar);
    };
  }, [showappswitcher, addwindow, updatewindow, setactivewindow]);

  useEffect(() => {
    if (!ismobile) return;

    history.pushState({ guard: true }, '');

    const handlePopState = () => {
      history.pushState({ guard: true }, '');

      const s = overlayref.current;
      if (s.shownotificationcenter) { setshownotificationcenter(false); return; }
      if (s.showcalendar) { setshowcalendar(false); return; }
      if (s.showcontrolcenter) { setshowcontrolcenter(false); return; }
      if (s.shownext) { setshownext(false); return; }
      if (s.showforcequit) { setshowforcequit(false); return; }
      if (s.showaboutmac) { setshowaboutmac(false); return; }
      if (s.showappswitcher) { setshowappswitcher(false); return; }
      if (s.showrecentapps) { setshowrecentapps(false); return; }

      const currentWindows = windowsref.current;
      const visibleWindows = currentWindows.filter((w: any) => !w.isminimized);
      if (visibleWindows.length > 0) {
        const backEvent = new CustomEvent('app-back', { cancelable: true });
        window.dispatchEvent(backEvent);
        if (!backEvent.defaultPrevented) {
          setwindows((prev: any[]) => prev.map((w: any) => ({ ...w, isminimized: true })));
        }
        return;
      }

      const homeBackEvent = new CustomEvent('app-back', { cancelable: true });
      window.dispatchEvent(homeBackEvent);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [ismobile]);

  const handleContextMenu = (e: React.MouseEvent, fileId?: string) => {
    if (ismobile) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };



  const handleModalConfirm = (inputValue: string) => {
    if (fileModal.type === 'create-folder') {
      createFolder(inputValue, currentUserDesktopId);
    } else if (fileModal.type === 'create-file') {
      createFile(inputValue, currentUserDesktopId);
    } else if (fileModal.type === 'rename' && contextMenu?.fileId) {
      renameItem(contextMenu.fileId, inputValue);
    }
    setFileModal({ ...fileModal, isOpen: false });
  };

  useEffect(() => {
    if (osstate === 'unlocked' && user && !ismobile) {
      const desktopExplorer = windows.find((w: any) => w.id === 'explorer-desktop');
      if (!desktopExplorer) {
        addwindow({
          id: 'explorer-desktop',
          appname: 'Explorer',
          component: 'apps/Explorer',
          props: { isDesktopBackend: true },
          isminimized: true,
          ismaximized: false,
          position: { top: 0, left: 0 },
          size: { width: 0, height: 0 }
        });
      }
    }
  }, [osstate, user, windows, addwindow]);

  const handleDesktopClick = () => {
    if (shownotificationcenter) setshownotificationcenter(false);
    if (showcalendar) setshowcalendar(false);
    setContextMenu(null);
    setactivewindow('explorer-desktop');
  };

  const getContextMenuItems = () => {
    if (contextMenu?.fileId) {
      const activeFileItem = files.find(f => f.id === contextMenu.fileId);
      if (!activeFileItem) return [];

      const targets = (selectedFileIds.includes(activeFileItem.id)) ? selectedFileIds : [activeFileItem.id];
      const hasReadOnly = targets.some(id => files.find(f => f.id === id)?.isReadOnly || files.find(f => f.id === id)?.isSystem);
      const isMulti = targets.length > 1;

      const baseItems: any[] = [
        {
          label: 'Open',
          action: () => targets.forEach(id => {
            const f = files.find(x => x.id === id);
            if (f) openSystemItem(f, context);
          })
        }
      ];

      if (!isMulti) {
        baseItems.push({ label: 'Get Info', action: () => openSystemItem(activeFileItem, context, 'getinfo') });
        baseItems.push({
          label: 'Show in Explorer',
          action: () => openSystemItem('explorer', context, undefined, { openPath: activeFileItem.parent || currentUserDesktopId, selectItem: activeFileItem.id })
        });
        baseItems.push({ separator: true, label: '' });
        baseItems.push({
          label: 'Rename',
          action: () => setFileModal({ isOpen: true, type: 'rename', initialValue: activeFileItem.name }),
          disabled: activeFileItem.isReadOnly
        });
      }

      baseItems.push({ separator: true, label: '' });
      baseItems.push({ label: isMulti ? `Copy ${targets.length} Items` : 'Copy', action: () => copyItem(targets) });
      baseItems.push({ label: isMulti ? `Cut ${targets.length} Items` : 'Cut', action: () => cutItem(targets), disabled: hasReadOnly });
      baseItems.push({ separator: true, label: '' });
      baseItems.push({ label: isMulti ? `Move ${targets.length} Items to Trash` : 'Move to Trash', action: () => targets.forEach(id => moveToTrash(id)), danger: true, disabled: hasReadOnly });

      return baseItems;
    } else {
      return [
        { label: 'New Folder', action: () => setFileModal({ isOpen: true, type: 'create-folder', initialValue: '' }) },
        { label: 'New File', action: () => setFileModal({ isOpen: true, type: 'create-file', initialValue: '' }) },
        { separator: true, label: '' },
        { label: 'Paste', action: () => pasteItem(currentUserDesktopId), disabled: !clipboard },
        { separator: true, label: '' },
        { label: 'Get Info', action: () => { }, disabled: true },
        {
          label: 'Change Wallpaper', action: () => {
            addwindow({
              id: `settings-${Date.now()}`,
              appname: 'Settings',
              component: 'apps/Settings',
              props: { initialPage: 'appearance' },
              isminimized: false,
              ismaximized: false,
            });
          }
        },
        { separator: true, label: '' },
        { label: 'Refresh', action: refreshFileSystem },
        { separator: true, label: '' },
        { label: 'Empty Trash', action: emptyTrash, disabled: files.filter(f => f.isTrash).length === 0 }
      ];
    }
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('sourceId', fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetParentId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('sourceId');
    if (!sourceId) return;

    if (sourceId === targetParentId) return;

    moveItem(sourceId, targetParentId);
  };

  useEffect(() => {
    if (osstate === 'unlocked' && user && !haslaunchedwelcome.current) {
      if (!ismobile) {
        const mode = process.env.NEXT_PUBLIC_NEXTAROS_MODE || 'prod';
        if (mode === 'local') {
          openSystemItem('welcome', context);
        } else {
          openSystemItem('portfolio', context);
        }
      }
      haslaunchedwelcome.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osstate, addwindow, user]);

  const StatusBar = () => {
    const [timestr, settimestr] = useState('');
    const clay = typeof document !== 'undefined' && document.documentElement.classList.contains('clay');

    useEffect(() => {
      const update = () => {
        const now = new Date();
        settimestr(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <motion.div
        data-tour="ios-statusbar"
        className={`absolute top-0 left-0 right-0 h-11 z-[300] flex items-center justify-between px-6 cursor-pointer ${clay ? '' : 'bg-[--bg-surface] border-b border-[--border-color]'}`}
        style={clay ? {
          background: 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 35%, transparent))',
          backdropFilter: 'blur(var(--glass-blur-heavy))',
          WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
        } : undefined}
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
        <div className="text-[15px] text-[--text-color] font-semibold pl-6">
          {timestr}
        </div>
        <div className="flex text-[--text-color] items-center gap-2 pr-6">
          <LuSignal size={16} />
          <LuWifi size={16} />
          <div className="flex items-center">
            <span className="text-[12px] font-medium mr-1">100%</span>
            <LuBatteryFull size={22} />
          </div>
        </div>
      </motion.div>
    );
  };

  if (!user && osstate !== 'booting') {
    return <></>;
  }

  return (
    <>
      <div
        className={`relative w-full h-full transition-all duration-500 ease-out bg-center bg-cover bg-no-repeat
                    ${osstate === 'unlocked'
            ? 'opacity-100 scale-100'
            : osstate === 'booting' ? 'opacity-0 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none'}`}
        style={{ backgroundImage: `url('${wallpaperurl}')` }}
      >
        <DesktopEffects active={showdesktopeffects} paused={showcontrolcenter || shownotificationcenter || showcalendar || hasActiveNotification} />
        {!ismobile && (
          <>
            <FileModal
              isOpen={fileModal.isOpen}
              type={fileModal.type}
              initialValue={fileModal.initialValue}
              onConfirm={handleModalConfirm}
              onCancel={() => setFileModal({ ...fileModal, isOpen: false })}
            />
            {contextMenu && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={getContextMenuItems()}
                onClose={() => setContextMenu(null)}
              />
            )}

            <main
              id="desktop-main"
              className="absolute inset-0 pt-6 pb-16"
              onContextMenu={handleContextMenu}
              onClick={handleDesktopClick}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, currentUserDesktopId)}
            >
              <div data-tour="desktop" className="relative h-full w-full" ref={containerRef}>
                <SelectionArea
                  containerRef={containerRef as React.RefObject<HTMLElement>}
                  zIndex={10}
                  onSelectionChange={(rect) => {
                    if (rect) {
                      const newSelectedIds: string[] = [];
                      const items = containerRef.current?.querySelectorAll('.desktop-item');
                      items?.forEach((el) => {
                        const itemRect = el.getBoundingClientRect();
                        if (
                          rect.x < itemRect.x + itemRect.width &&
                          rect.x + rect.width > itemRect.x &&
                          rect.y < itemRect.y + itemRect.height &&
                          rect.y + rect.height > itemRect.y
                        ) {
                          const id = el.getAttribute('data-id');
                          if (id) newSelectedIds.push(id);
                        }
                      });
                      setSelectedFileIds(newSelectedIds);
                    }
                  }}
                  onSelectionEnd={(rect) => {
                    if (!rect || (rect.width < 5 && rect.height < 5)) {
                      setSelectedFileIds([]);
                    }
                  }}
                />

                {/* Desktop Widgets — 2x2 grid cells each */}
                {WIDGET_IDS.map((widgetId) => {
                  const id = `widget-${widgetId}`;
                  const pos = itemPositions[id];
                  if (!pos) return null;
                  return (
                    <GridItem
                      key={id}
                      col={pos.col}
                      row={pos.row}
                      span={2}
                      padX={gridPadX}
                      onReposition={(dCols, dRows) => handleReposition(id, 2, dCols, dRows)}
                      className="desktop-widget cursor-grab active:cursor-grabbing rounded-[22px]"
                      whileDrag={{ scale: 1.02, zIndex: 50 }}
                      data-widget={widgetId}
                    >
                      {widgetId === 'profile' && <ProfileWidget size="medium" />}
                      {widgetId === 'stats' && <StatsWidget />}
                      {widgetId === 'experience' && <ExperienceWidget />}
                      {widgetId === 'skills' && <SkillsWidget />}
                    </GridItem>
                  );
                })}

                {/* Desktop file icons — 1x1 grid cell each */}
                {desktopFiles.map((item) => {
                  const pos = itemPositions[item.id];
                  if (!pos) return null;
                  const isSelected = selectedFileIds.includes(item.id);
                  return (
                    <GridItem
                      key={item.id}
                      col={pos.col}
                      row={pos.row}
                      span={1}
                      padX={gridPadX}
                      onReposition={(dCols, dRows) => handleReposition(item.id, 1, dCols, dRows)}
                      data-id={item.id}
                      whileDrag={{ scale: 1.05, zIndex: 50 }}
                      onDoubleClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        openSystemItem(item, context);
                      }}
                      onContextMenu={(e: React.MouseEvent) => {
                        handleContextMenu(e, item.id);
                        if (!isSelected) setSelectedFileIds([item.id]);
                      }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          setSelectedFileIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                        } else {
                          setSelectedFileIds([item.id]);
                        }
                      }}
                      className={`desktop-item p-2 flex flex-col items-center content-center text-white cursor-default group border transition-colors
                        ${isSelected
                          ? 'bg-black/20 dark:bg-white/20 border-white/20 backdrop-blur-md'
                          : 'hover:bg-neutral-400/20 border-transparent hover:border-white/10 hover:backdrop-blur-lg'
                        }`}
                      onDragOver={(e: any) => {
                        if (item.mimetype === 'inode/directory') { e.preventDefault(); e.stopPropagation(); }
                      }}
                      onDrop={(e: any) => {
                        if (item.mimetype === 'inode/directory') { e.preventDefault(); e.stopPropagation(); handleDrop(e, item.id); }
                      }}
                    >
                      <div className="w-14 h-14 relative mb-1.5 drop-shadow-md">
                        <div className="w-full h-full aspect-square">
                          {getFileIcon(item.mimetype, item.name, item.icon, item.id, item.content || item.link)}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] w-full font-medium text-center break-words leading-tight line-clamp-1 px-1 text-white ${isSelected ? 'bg-accent' : ''}`}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.2)' }}
                      >{item.name}</span>
                    </GridItem>
                  );
                })}
              </div>

              {/* Windows rendered outside the grid */}
              {windows.map((window: any) => (
                <div key={window.id} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
                  <Window {...window} />
                </div>
              ))}
            </main>

            <Panel
              ontogglenotifications={() => { setshownotificationcenter(prev => { if (!prev) setshowcalendar(false); return !prev; }); }}
              ontogglecalendar={() => { setshowcalendar(prev => { if (!prev) setshownotificationcenter(false); return !prev; }); }}
            />

            <Dock />
          </>
        )}

        {ismobile && (
          <div className="relative w-full h-full">

            <div className={`absolute top-0 right-0 z-[500] visible`}>
              <Control isopen={showcontrolcenter} onclose={() => setshowcontrolcenter(false)} ismobile={true} />
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
              <div className={`absolute inset-0 pointer-events-none ${showrecentapps ? 'z-[492]' : 'z-40'}`}>
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

            <div className={`absolute left-0 right-0 h-10 flex items-end justify-center z-[400] ${(shownotificationcenter || showcontrolcenter) ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px)' }}>
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
                      window.dispatchEvent(new CustomEvent('home-pressed'));
                    }
                  } else if (showcontrolcenter) {
                    if (isdragup || isflick) setshowcontrolcenter(false);
                  } else if (shownotificationcenter) {
                    if (isdragup || isflick) setshownotificationcenter(false);
                  } else {
                    if (isdragup) {
                      if (isflick) {
                        setwindows(windows.map((w: any) => ({ ...w, isminimized: true })));
                        window.dispatchEvent(new CustomEvent('home-pressed'));
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
                  window.dispatchEvent(new CustomEvent('home-pressed'));
                }}
              >
                <div className="w-full h-[6px]  cursor-pointer rounded-none bg-white mix-blend-difference" style={{ boxShadow: '0 0 8px rgba(128,128,128,0.5), 0 0 20px rgba(128,128,128,0.2)' }}></div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <NotificationCenter isopen={shownotificationcenter} onclose={() => setshownotificationcenter(false)} />
      <CalendarPanel isopen={showcalendar} onclose={() => setshowcalendar(false)} />
      <Next isOpen={shownext} onClose={() => setshownext(false)} />
      <AppSwitcher isOpen={showappswitcher} onClose={() => setshowappswitcher(false)} />
      <TourGuide isOpen={showtour} onClose={() => setshowtour(false)} />
      <ForceQuit isopen={showforcequit} onclose={() => setshowforcequit(false)} />
      <AboutDevice isopen={showaboutmac} onclose={() => setshowaboutmac(false)} />
    </>
  );
}

const Page = () => {
  const { appmode } = useDevice();

  if (appmode === 'portfolio') {
    return <Portfolio />;
  }

  return (
    <>
      <BootScreen />
      <LockScreen />
      <Desktop />
    </>
  );
};

export default Page;
