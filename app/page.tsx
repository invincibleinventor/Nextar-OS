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
import { IoWifi, IoBatteryFull } from "react-icons/io5";
import { motion } from 'framer-motion';
import { BiSignal5 } from "react-icons/bi";

import NotificationCenter from '@/components/NotificationCenter';
import ContextMenu from '@/components/ui/ContextMenu';
import { SelectionArea } from '@/components/ui/SelectionArea';
import FileModal from '@/components/ui/FileModal';
import { useFileSystem } from '@/components/FileSystemContext';
import { useAuth } from '@/components/AuthContext';
import Spotlight from '@/components/Spotlight';
import AppSwitcher from '@/components/AppSwitcher';
import TourGuide from '@/components/TourGuide';
import ForceQuit from '@/components/ForceQuit';
import AboutDevice from '@/components/AboutDevice';
import { useSettings } from '@/components/SettingsContext';
import { useMenuRegistration } from '@/components/AppMenuContext';

const Desktop = () => {
  const { windows, addwindow, setwindows, updatewindow, setactivewindow, activewindow } = useWindows();
  const { osstate, ismobile } = useDevice();
  const { wallpaperurl } = useSettings();
  const [showcontrolcenter, setshowcontrolcenter] = useState(false);
  const [shownotificationcenter, setshownotificationcenter] = useState(false);
  const [showrecentapps, setshowrecentapps] = useState(false);
  const [showspotlight, setshowspotlight] = useState(false);
  const [showappswitcher, setshowappswitcher] = useState(false);
  const [showtour, setshowtour] = useState(false);
  const [showforcequit, setshowforcequit] = useState(false);
  const [showaboutmac, setshowaboutmac] = useState(false);
  const [issystemgestureactive, setissystemgestureactive] = useState(false);

  const { user } = useAuth();



  const haslaunchedwelcome = React.useRef(false);

  const { createFolder, createFile, files, emptyTrash, moveItem, refreshFileSystem, copyItem, cutItem, pasteItem, clipboard, moveToTrash, renameItem, currentUserDesktopId } = useFileSystem();

  const context = { addwindow, windows, updatewindow, setactivewindow, ismobile, activewindow, files };
  const containerRef = useRef<HTMLDivElement>(null);


  const [fileModal, setFileModal] = useState<{ isOpen: boolean, type: 'create-folder' | 'create-file' | 'rename', initialValue?: string }>({ isOpen: false, type: 'create-folder' });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string } | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  useEffect(() => {
    const handleGlobalMenu = (e: CustomEvent) => {
      const { appId, actionId, title } = e.detail;
      console.log('[Page] Received menu-action:', e.detail);
      const effectiveActionId = actionId || title;

      if (appId === 'finder' && effectiveActionId === 'new-window') {
        const lastWindow = windows[windows.length - 1];
        if (lastWindow && lastWindow.appname === 'Finder' && (Date.now() - (lastWindow.lastInteraction || 0) < 500)) {
          console.log('[Page] Ignoring duplicate new-window request');
          return;
        }

        const username = user?.username || 'Guest';
        const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));

        addwindow({
          id: `finder-${Date.now()}`,
          appname: 'Finder',
          title: 'Finder',
          component: 'apps/Finder',
          icon: '/finder.png',
          isminimized: false,
          ismaximized: false,
          position: { top: 100, left: 100 },
          size: { width: 800, height: 500 },
          props: { initialpath: ['System', 'Users', homeDir, 'Desktop'] }
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setshowspotlight(prev => !prev);
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
        e.preventDefault();
        if (activewindow && activewindow !== 'finder-desktop') {
          setwindows(windows.filter((w: any) => w.id !== activewindow));
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activewindow && activewindow !== 'finder-desktop') {
          setwindows(windows.filter((w: any) => w.id !== activewindow));
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        if (activewindow) {
          updatewindow(activewindow, { isminimized: true });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        const settingsExists = windows.find((w: any) => w.appname === 'Settings');
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
    const handleToggleSpotlight = () => setshowspotlight(prev => !prev);
    const handleForceQuit = () => setshowforcequit(true);
    const handleAboutMac = () => setshowaboutmac(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('start-tour', handleStartTour);
    window.addEventListener('toggle-spotlight', handleToggleSpotlight);
    window.addEventListener('show-force-quit', handleForceQuit);
    window.addEventListener('show-about-mac', handleAboutMac);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('start-tour', handleStartTour);
      window.removeEventListener('toggle-spotlight', handleToggleSpotlight);
      window.removeEventListener('show-force-quit', handleForceQuit);
      window.removeEventListener('show-about-mac', handleAboutMac);
    };
  }, [showappswitcher]);

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
      const desktopFinder = windows.find((w: any) => w.id === 'finder-desktop');
      if (!desktopFinder) {
        addwindow({
          id: 'finder-desktop',
          appname: 'Finder',
          component: 'apps/Finder',
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
    setContextMenu(null);
    setactivewindow('finder-desktop');
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
          label: 'Show in Finder',
          action: () => openSystemItem('finder', context, undefined, { openPath: activeFileItem.parent || currentUserDesktopId, selectItem: activeFileItem.id })
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
              props: { initialPage: 'wallpaper' },
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
      openSystemItem('welcome', context);
      haslaunchedwelcome.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osstate, addwindow, user]);

  const StatusBar = () => {
    const now = new Date();
    const timestr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

    return (
      <motion.div
        data-tour="ios-statusbar"
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
              <div data-tour="desktop" className='p-4 pt-10 gap-4 flex flex-col flex-wrap-reverse content-start h-full w-full' ref={containerRef}>
                <SelectionArea
                  containerRef={containerRef as React.RefObject<HTMLElement>}
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

                {files.filter(file => file.parent === currentUserDesktopId && !file.isTrash).map((item) => {
                  const isSelected = selectedFileIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      data-id={item.id}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        openSystemItem(item, context);
                      }}
                      onContextMenu={(e) => {
                        handleContextMenu(e, item.id);
                        if (!isSelected) setSelectedFileIds([item.id]);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          if (selectedFileIds.includes(item.id)) {
                            setSelectedFileIds(prev => prev.filter(id => id !== item.id));
                          } else {
                            setSelectedFileIds(prev => [...prev, item.id]);
                          }
                        } else {
                          setSelectedFileIds([item.id]);
                        }
                      }}
                      className={`desktop-item p-2 flex rounded-md flex-col items-center content-center text-white cursor-default group border transition-all w-[90px]
                        ${isSelected
                          ? 'bg-black/20 dark:bg-white/20 border-white/20 backdrop-blur-md'
                          : 'hover:bg-neutral-400/20 border-transparent hover:border-white/10 hover:backdrop-blur-lg'
                        }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => {
                        if (item.mimetype === 'inode/directory') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      onDrop={(e) => {
                        if (item.mimetype === 'inode/directory') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDrop(e, item.id);
                        }
                      }}
                    >
                      <div className="w-14 h-14 relative mb-1 drop-shadow-md">
                        <div className="w-full h-full aspect-square">
                          {getFileIcon(item.mimetype, item.name, item.icon)}
                        </div>
                      </div>
                      <span className={`text-[11px] w-full font-semibold text-white drop-shadow-md text-center break-words leading-tight line-clamp-2 px-1 rounded-sm ${isSelected ? 'bg-accent' : ''} group-hover:text-white`}>{item.name}</span>
                    </div>
                  )
                })}

                {windows.map((window: any) => (
                  <div key={window.id} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
                    <Window {...window} />
                  </div>
                ))}
              </div>
            </main>

            <Panel ontogglenotifications={() => setshownotificationcenter(prev => !prev)} />

            <Dock />
          </>
        )}

        {ismobile && (
          <div className="relative w-full h-full">

            <div className={`absolute top-0 right-0 z-[10001] visible`}>
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
                <div className="w-full h-[5px] mb-[12px] bg-neutral-300/90 dark:bg-white/80 rounded-full  cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-md"></div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <NotificationCenter isopen={shownotificationcenter} onclose={() => setshownotificationcenter(false)} />
      <Spotlight isOpen={showspotlight} onClose={() => setshowspotlight(false)} />
      <AppSwitcher isOpen={showappswitcher} onClose={() => setshowappswitcher(false)} />
      <TourGuide isOpen={showtour} onClose={() => setshowtour(false)} />
      <ForceQuit isopen={showforcequit} onclose={() => setshowforcequit(false)} />
      <AboutDevice isopen={showaboutmac} onclose={() => setshowaboutmac(false)} />
    </>
  );
}

const Page = () => {
  return (
    <>
      <BootScreen />
      <LockScreen />
      <Desktop />
    </>
  );
};

export default Page;
