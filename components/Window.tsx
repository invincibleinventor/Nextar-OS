'use client'
import React, { useState, useEffect, useLayoutEffect, useRef, memo, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useWindows } from './WindowContext';
import { apps, componentmap } from './data';
import { motion } from 'framer-motion';
import { useDevice } from './DeviceContext';
import { useSettings } from './SettingsContext';
import { useProcess } from './ProcessContext';
import AppErrorBoundary from './AppErrorBoundary';
import { ui } from '../utils/constants';

const panelheight = ui.panelHeight;
const dockheight = ui.dockHeight;

const shallowEqual = (a: Record<string, any> | undefined, b: Record<string, any> | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
};

const MemoizedDynamicComponent = memo(
  ({ icon, component, appname, appprops, isFocused, isExternal, externalUrl }: { icon: string, component: string; appname: string, appprops: any; isFocused: boolean, isExternal?: boolean, externalUrl?: string }) => {
    if (isExternal && externalUrl) {
      const ExternalLoader = componentmap['apps/ExternalAppLoader'];
      if (ExternalLoader) {
        return <ExternalLoader externalUrl={externalUrl} appname={appname} icon={icon} />;
      }
    }

    const DynamicComponent = componentmap[component];

    if (!DynamicComponent) {
      return (
        <div className="flex flex-row h-full w-full items-center content-center">
          <div className="flex flex-col space-y-5 font-mono mx-auto items-center content-center">
            <Image className="w-24 h-24" src={icon} width={96} height={96} alt={appname} />
            <div className="text-sm text-[--text-color]">{appname} is coming soon</div>
          </div>
        </div>
      );
    }

    return <DynamicComponent {...appprops} isFocused={isFocused} />;
  },
  (prevprops, nextprops) =>
    prevprops.isFocused === nextprops.isFocused &&
    prevprops.component === nextprops.component &&
    prevprops.appname === nextprops.appname &&
    prevprops.icon === nextprops.icon &&
    prevprops.isExternal === nextprops.isExternal &&
    prevprops.externalUrl === nextprops.externalUrl &&
    shallowEqual(prevprops.appprops, nextprops.appprops)
);
MemoizedDynamicComponent.displayName = 'MemoizedDynamicComponent';

const Window = ({ id, appname, title, component, props, isminimized, ismaximized, shouldblur = false, isRecentAppView = false, issystemgestureactive = false, size: initialsize, position: initialposition }: any) => {

  const { removewindow, updatewindow, activewindow, setactivewindow, windows } = useWindows();
  const { ismobile } = useDevice();
  const { reducemotion, reducetransparency } = useSettings();
  const { spawn, suspend, resume, kill, crash, getByWindow } = useProcess();
  const app = apps.find((app) => app.appname === appname);
  const processref = useRef<number | null>(null);

  useEffect(() => {
    if (!processref.current) {
      const pid = spawn(app?.id || appname, id);
      processref.current = pid;
    }
    return () => {
      if (processref.current) {
        kill(processref.current);
      }
    };
  }, [app?.id, appname, id, spawn, kill]);

  useEffect(() => {
    if (!processref.current) return;
    if (isminimized) {
      suspend(processref.current);
    } else {
      resume(processref.current);
    }
  }, [isminimized, suspend, resume]);

  const stableAppProps = useMemo(() => ({ ...props, windowId: id }), [props, id]);

  const handleCrash = useCallback((error: string) => {
    if (processref.current) {
      crash(processref.current, error);
    }
  }, [crash]);



  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }
    };
  }, []);

  const [mounted, setmounted] = useState(false);
  useEffect(() => setmounted(true), []);

  const [portaltarget, setportaltarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (ismobile && mounted) {
      const desktop = document.getElementById('mobile-desktop');
      if (desktop) setportaltarget(desktop);
    }
  }, [ismobile, mounted]);

  const [position, setposition] = useState(() => {
    if (initialposition) return initialposition;

    if (app && (app.additionaldata as any) && (app.additionaldata as any).startlarge && typeof window !== 'undefined') {
      const screenwidth = window.innerWidth;
      const screenheight = window.innerHeight;
      const width = Math.round(screenwidth * 0.85);
      const height = Math.round((screenheight - panelheight - dockheight) * 0.85);
      return {
        top: panelheight + Math.round(((screenheight - panelheight - dockheight) - height) / 2),
        left: Math.round((screenwidth - width) / 2),
      };
    }
    if (typeof window !== 'undefined') {
      return { top: window.innerHeight / 8, left: window.innerWidth / 4 };
    }
    return { top: 100, left: 100 };
  });

  const [size, setsize] = useState(() => {
    if (initialsize) return initialsize;
    if (app && (app.additionaldata as any) && (app.additionaldata as any).startlarge && typeof window !== 'undefined') {
      const screenwidth = window.innerWidth;
      const screenheight = window.innerHeight;
      return {
        width: Math.round(screenwidth * 0.85),
        height: Math.round((screenheight - panelheight - dockheight) * 0.85),
      };
    }
    return { width: 900, height: 600 };
  });

  const previousStateRef = useRef({ position, size });
  const [isdragging, setisdragging] = useState(false);

  const windowref = useRef(null);
  const positionref = useRef(position);
  const sizeref = useRef(size);

  useEffect(() => {
    positionref.current = position;
  }, [position]);

  useEffect(() => {
    sizeref.current = size;
  }, [size]);

  const myindex = windows ? windows.findIndex((w: any) => w.id === id) : 0;
  const zindex = activewindow === id ? 199 : 100 + myindex;

  useEffect(() => {

    if (ismobile) {
      if (typeof window !== 'undefined') {
        setposition({ top: 44, left: 0 });
        setsize({ width: window.innerWidth, height: window.innerHeight - 44 });
      }
      return;
    }
    if (isminimized) {

      if (typeof window !== 'undefined') {
        if (!ismaximized) {
          previousStateRef.current = {
            position: positionref.current,
            size: sizeref.current
          };
        }
      }


    } else {
      setposition(previousStateRef.current.position);
      setsize(previousStateRef.current.size);
    }
  }, [isminimized, ismaximized, ismobile]);

  useLayoutEffect(() => {
    if (!ismobile || !isRecentAppView) {
      if (ismobile && windowref.current) {
        const el = windowref.current as HTMLElement;
        // Explicitly reset to mobile fullscreen values after RAF loop manipulated them
        el.style.visibility = '';
        el.style.top = '44px';
        el.style.left = '0px';
        el.style.width = '100%';
        el.style.height = 'calc(100% - 44px)';
        el.style.borderRadius = '';
        el.style.transform = '';
        el.style.pointerEvents = '';
      }
      return;
    }

    // Hide immediately before paint to prevent full-screen flash
    const windowElement = windowref.current as HTMLElement | null;
    if (windowElement) {
      windowElement.style.visibility = 'hidden';
    }

    let animationFrameId: number;
    let lastUpdate = 0;
    const throttleMs = 16;

    const trackLayout = (timestamp: number) => {
      if (timestamp - lastUpdate < throttleMs) {
        animationFrameId = requestAnimationFrame(trackLayout);
        return;
      }
      lastUpdate = timestamp;

      const slotId = `recent-app-slot-${id}`;
      const slotElement = document.getElementById(slotId);
      const el = windowref.current as HTMLElement | null;

      if (el) {
        if (slotElement) {
          const rect = slotElement.getBoundingClientRect();
          el.style.top = `${rect.top}px`;
          el.style.left = `${rect.left}px`;
          el.style.width = `${rect.width}px`;
          el.style.height = `${rect.height}px`;
          el.style.borderRadius = '0px';
          el.style.transform = 'none';
          el.style.visibility = 'visible';
        } else {
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        }
      }

      animationFrameId = requestAnimationFrame(trackLayout);
    };

    animationFrameId = requestAnimationFrame(trackLayout);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [ismobile, isRecentAppView, id]);


  const handlemaximize = () => {
    if (!ismaximized) {
      previousStateRef.current = { position, size };
      updatewindow(id, { ismaximized: true });
    } else {
      updatewindow(id, { ismaximized: false });
      setposition(previousStateRef.current.position);
      setsize(previousStateRef.current.size);
    }
  };

  const handledragstart = (e: any) => {

    if (e.detail === 2) return;

    const target = e.target as HTMLElement;
    const isinteractive = target.closest('button, a, input, textarea, [role="button"], .interactive') !== null;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clienty = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const istoparea = (clienty - rect.top) <= 50;

    if (!istoparea || isinteractive) {
      return;
    }


    let dragstarted = false;
    const wasmaximized = ismaximized;
    let dragoffsetx = 0;
    let dragoffsety = 0;
    let startx = 0;
    let starty = 0;
    let prevsize = size;

    const clientx = 'touches' in e ? e.touches[0].clientX : e.clientX;

    if (wasmaximized) {
      prevsize = previousStateRef.current.size;
      dragoffsetx = prevsize.width / 2;
      dragoffsety = 20;
      startx = clientx;
      starty = clienty;
    } else {
      startx = clientx;
      starty = clienty;
      dragoffsetx = startx - position.left;
      dragoffsety = starty - position.top;
    }

    let lasttop = wasmaximized ? panelheight : position.top;

    const onmousemove = (moveevent: any) => {
      const movex = 'touches' in moveevent ? moveevent.touches[0].clientX : moveevent.clientX;
      const movey = 'touches' in moveevent ? moveevent.touches[0].clientY : moveevent.clientY;

      if (!isdragging && Math.abs(movex - startx) < 5 && Math.abs(movey - starty) < 5) {
        return;
      }

      if (!dragstarted && wasmaximized && Math.abs(movey - starty) > 10) {
        dragstarted = true;
        updatewindow(id, { ismaximized: false });

        setTimeout(() => {
          setsize(prevsize);
          setposition({
            top: movey - dragoffsety,
            left: movex - dragoffsetx,
          });
        }, 0);
        setisdragging(true);
      } else if (!wasmaximized) {
        setisdragging(true);
      }

      if (!dragstarted && wasmaximized) return;

      const { innerWidth: screenwidth, innerHeight: screenheight } = window;
      let newleft = movex - dragoffsetx;
      let newtop = movey - dragoffsety;

      newleft = Math.max(-size.width / 2.0, Math.min(screenwidth - size.width / 2.0, newleft));
      newtop = Math.max(panelheight - 20, Math.min(screenheight - dockheight - size.height / 4.0, newtop));

      setposition({
        top: newtop,
        left: newleft,
      });
      lasttop = newtop;
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', onmousemove);
      document.removeEventListener('mouseup', onmouseup);
      document.removeEventListener('touchmove', onmousemove);
      document.removeEventListener('touchend', onmouseup);
      dragCleanupRef.current = null;
    };

    const onmouseup = () => {
      setisdragging(false);
      cleanup();

      if (!wasmaximized && lasttop <= panelheight) {
        previousStateRef.current = { position, size };
        updatewindow(id, { ismaximized: true });
      }
    };

    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('touchmove', onmousemove);
    document.addEventListener('touchend', onmouseup);
    dragCleanupRef.current = cleanup;
  };

  const handleresizestart = (e: any, direction: any) => {

    e.preventDefault();
    e.stopPropagation();

    const startx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const starty = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startwidth = size.width;
    const startheight = size.height;
    const starttop = position.top;
    const startleft = position.left;

    const onmousemove = (moveevent: any) => {
      const clientx = 'touches' in moveevent ? moveevent.touches[0].clientX : moveevent.clientX;
      const clienty = 'touches' in moveevent ? moveevent.touches[0].clientY : moveevent.clientY;

      let newwidth = startwidth;
      let newheight = startheight;
      let newtop = starttop;
      let newleft = startleft;

      if (direction.includes('right')) newwidth = Math.max(300, startwidth + (clientx - startx));
      if (direction.includes('bottom')) {
        newheight = Math.max(100, startheight + (clienty - starty));
        const { innerHeight: screenheight } = window;
        if (newtop + newheight > screenheight - dockheight) {
          newheight = screenheight - dockheight - newtop;
        }
      }
      if (direction.includes('left')) {
        newwidth = Math.max(300, startwidth - (clientx - startx));
        newleft = startleft + (clientx - startx);
      }
      if (direction.includes('top')) {
        newheight = Math.max(100, startheight - (clienty - starty));
        newtop = starttop + (clienty - starty);
        if (newtop < panelheight) {
          newtop = panelheight;
          newheight = startheight - (newtop - starttop);
        }
      }

      setsize({
        width: newwidth,
        height: newheight,
      });
      setposition({
        top: newtop,
        left: newleft,
      });
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', onmousemove);
      document.removeEventListener('mouseup', onmouseup);
      document.removeEventListener('touchmove', onmousemove);
      document.removeEventListener('touchend', onmouseup);
      dragCleanupRef.current = null;
    };

    const onmouseup = () => {
      cleanup();
    };

    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('touchmove', onmousemove);
    document.addEventListener('touchend', onmouseup);
    dragCleanupRef.current = cleanup;
  };

  const content = (
    <motion.div
      ref={windowref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: (ismobile && isRecentAppView) ? 1 : (isminimized ? 0 : 1),
        y: (ismobile && isRecentAppView) ? 0 : (isminimized ? 400 : 0),
        scale: (ismobile && isRecentAppView) ? 1 : (isminimized ? 0.7 : 1)
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
        mass: 1,
      }}
      className={`window overflow-hidden flex flex-col bg-surface
      ${activewindow === id ? 'border border-[--border-color] shadow-[0_8px_32px_-6px_rgba(0,0,0,0.25),0_0_0_1px_rgba(237,135,150,0.4),0_2px_8px_-2px_rgba(237,135,150,0.1)] anime-glow' : 'border border-[--border-color] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15),0_0_0_1px_var(--border-color)]'}
      ${isdragging ? 'cursor-grabbing' : 'cursor-default'} ${(isminimized || shouldblur || isRecentAppView) ? 'pointer-events-none' : 'pointer-events-auto'}
        ${(ismobile && isRecentAppView) ? 'absolute inset-0 w-full h-full' : 'absolute'}`}
      data-window-id={id}
      style={{
        top: (ismobile && isRecentAppView) ? 0 : (ismobile ? 44 : (ismaximized ? 35 : (position?.top || 0))),
        left: (ismobile && isRecentAppView) ? 0 : (ismobile ? 0 : (ismaximized ? 0 : (position?.left || 0))),
        width: (ismobile && isRecentAppView) ? '100%' : (ismobile ? '100%' : (ismaximized ? '100vw' : (size?.width || 0))),
        height: (ismobile && isRecentAppView) ? '100%' : (ismobile ? 'calc(100% - 44px)' : (ismaximized ? 'calc(100vh - 105px)' : (size?.height || 0))),
        zIndex: isminimized ? -1 : zindex,
        willChange: 'transform, opacity, top, left, width, height',
        pointerEvents: (shouldblur || isRecentAppView || isminimized || issystemgestureactive) ? 'none' : 'auto'
      }}
      onMouseDown={(e) => {
        if (shouldblur || isRecentAppView || isminimized || issystemgestureactive) return;
        setactivewindow(id);
        if (!ismobile) {
          handledragstart(e)
        }
      }}
      onDoubleClick={(e) => {
        if (shouldblur || isRecentAppView || isminimized || issystemgestureactive) return;
        if (!ismobile) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          if (e.clientY - rect.top <= 50) {
            handlemaximize();
          }
        }
      }}
    >

      {!ismobile && (
        <div className={`w-full h-[48px] shrink-0 flex items-center border-b border-[--border-color] bg-[--bg-overlay] px-4 z-50 anime-gradient-top ${isdragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
          <div id="buttons" className="flex flex-row items-center space-x-[8px] group shrink-0">
            <button
              aria-label="Close window"
              className={`w-[12px] h-[12px]  ${activewindow == id ? 'bg-pastel-red' : 'bg-[--border-color]'} window-button flex items-center justify-center`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removewindow(id);
              }}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[--bg-base]">×</span>
            </button>

            <button
              aria-label="Minimize window"
              className={`w-[12px] h-[12px]  ${activewindow == id ? 'bg-pastel-yellow' : 'bg-[--border-color]'} window-button flex items-center justify-center`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updatewindow(id, { isminimized: true });
              }}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[--bg-base]">−</span>
            </button>
            <button
              aria-label={ismaximized ? "Restore window" : "Maximize window"}
              className={`w-[12px] h-[12px]  ${activewindow == id ? 'bg-pastel-teal' : 'bg-[--border-color]'} window-button flex items-center justify-center`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlemaximize();
              }}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[6px] font-bold text-[--bg-base]">↗</span>
            </button>
          </div>
          <span className="ml-4 text-[13px] text-[--text-muted] truncate select-none">{title || appname}</span>
        </div>
      )}

      <div
        className={`w-full h-full flex-1 overflow-hidden ${ismaximized || ismobile ? '' : ''} ${(isminimized || issystemgestureactive || shouldblur || isRecentAppView) ? 'pointer-events-none' : 'pointer-events-auto'} ${isRecentAppView && !app?.hidePreview ? 'recent-app-frozen' : ''}`}
      >
        <AppErrorBoundary appId={app?.id || appname} windowId={id} onCrash={handleCrash}>
          <MemoizedDynamicComponent appname={app ? app.appname : ''} icon={app ? app.icon : ''} component={app?.componentname ? app.componentname : component} appprops={stableAppProps} isFocused={activewindow === id && !shouldblur} isExternal={app?.isExternal} externalUrl={app?.externalUrl} />
        </AppErrorBoundary>

        {((ismobile && shouldblur && !isRecentAppView) || issystemgestureactive) && (
          <div className="absolute inset-0 z-[500] bg-transparent w-full h-full pointer-events-auto" />
        )}
      </div>


      {!ismobile && !ismaximized && (
        <>
          <div
            className="absolute w-full h-[6px] top-0 left-0 cursor-ns-resize z-50"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'top'); }}
          />
          <div
            className="absolute w-full h-[6px] bottom-0 left-0 cursor-ns-resize z-50"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'bottom'); }}
          />
          <div
            className="absolute top-0 left-0 w-[6px] h-full cursor-ew-resize z-50"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'left'); }}
          />
          <div
            className="absolute top-0 right-0 w-[6px] h-full cursor-ew-resize z-50"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'right'); }}
          />
          <div
            className="absolute w-4 h-4 left-0 top-0 cursor-nwse-resize z-[51]"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'top-left'); }}
          />
          <div
            className="absolute w-4 h-4 right-0 top-0 cursor-nesw-resize z-[51]"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'top-right'); }}
          />
          <div
            className="absolute w-4 h-4 left-0 bottom-0 cursor-nesw-resize z-[51]"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'bottom-left'); }}
          />
          <div
            className="absolute w-4 h-4 right-0 bottom-0 cursor-nwse-resize z-[51]"
            onMouseDown={(e) => { e.stopPropagation(); handleresizestart(e, 'bottom-right'); }}
          />
        </>
      )}
    </motion.div >
  );

  if (ismobile && mounted && portaltarget) {
    return createPortal(content, portaltarget);
  }

  return content;
};

Window.displayName = 'Window';
export default Window;
