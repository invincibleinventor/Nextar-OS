'use client'
import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useWindows } from './WindowContext';
import { apps } from './data';
import { motion } from 'framer-motion';
import { useDevice } from './DeviceContext';
import { useSettings } from './SettingsContext';

const panelheight = 35;
const dockheight = 70;

import dynamic from 'next/dynamic';

const componentmap: { [key: string]: any } = {
  'apps/Finder': dynamic(() => import('./apps/Finder')),
  'apps/FileInfo': dynamic(() => import('./apps/FileInfo')),
  'apps/TextEdit': dynamic(() => import('./apps/TextEdit')),
  'apps/Settings': dynamic(() => import('./apps/Settings')),
  'apps/Calendar': dynamic(() => import('./apps/Calendar')),
  'apps/Safari': dynamic(() => import('./apps/Safari')),
  'apps/Photos': dynamic(() => import('./apps/Photos')),
  'apps/Terminal': dynamic(() => import('./apps/Terminal')),
  'apps/Launchpad': dynamic(() => import('./apps/Launchpad')),
  'apps/Python': dynamic(() => import('./apps/Python')),
  'apps/FileViewer': dynamic(() => import('./apps/FileViewer')),

  'AppStore': dynamic(() => import('./AppStore')),
  'BalaDev': dynamic(() => import('./BalaDev')),
  'Welcome': dynamic(() => import('./Welcome')),

  'Mail': dynamic(() => import('./Mail')),
  'Calculator': dynamic(() => import('./Calculator')),
};


const MemoizedDynamicComponent = memo(
  ({ icon, component, appname, appprops, isFocused }: { icon: string, component: string; appname: string, appprops: any; isFocused: boolean }) => {
    const DynamicComponent = componentmap[component];

    if (!DynamicComponent) {
      return (
        <div className="flex flex-row h-full w-full items-center content-center">
          <div className="flex flex-col space-y-5 font-sf mx-auto items-center content-center">
            <Image className="w-24 h-24" src={icon} width={96} height={96} alt={appname} />
            <div className="text-sm dark:text-white">{appname} is coming soon</div>
          </div>
        </div>
      );
    }

    return <DynamicComponent {...appprops} isFocused={isFocused} />;
  },
  (prevprops, nextprops) => prevprops.isFocused === nextprops.isFocused
);
MemoizedDynamicComponent.displayName = 'MemoizedDynamicComponent';

const Window = ({ id, appname, title, component, props, isminimized, ismaximized, shouldblur = false, isRecentAppView = false, issystemgestureactive = false, size: initialsize, position: initialposition }: any) => {

  const { removewindow, updatewindow, activewindow, setactivewindow, windows } = useWindows();
  const { ismobile } = useDevice();
  const { reducemotion, reducetransparency } = useSettings();
  const app = apps.find((app) => app.appname === appname);



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
  const zindex = activewindow === id ? 1000 : 100 + myindex;

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

  useEffect(() => {
    if (!ismobile || !isRecentAppView) {
      if (ismobile && windowref.current) {
        const el = windowref.current as HTMLElement;
        el.style.top = '44px';
        el.style.left = '0px';
        el.style.width = window.innerWidth + 'px';
        el.style.height = (window.innerHeight - 44) + 'px';
        el.style.borderRadius = '0px';
        el.style.transform = 'none';
      }
      return;
    }

    let animationFrameId: number;

    const trackLayout = () => {
      const slotId = `recent-app-slot-${id}`;
      const slotElement = document.getElementById(slotId);
      const windowElement = windowref.current as HTMLElement | null;

      if (slotElement && windowElement) {
        const rect = slotElement.getBoundingClientRect();

        windowElement.style.top = `${rect.top}px`;
        windowElement.style.left = `${rect.left}px`;
        windowElement.style.width = `${rect.width}px`;
        windowElement.style.height = `${rect.height}px`;
        windowElement.style.borderRadius = '24px';
        windowElement.style.transform = 'none';
      }

      animationFrameId = requestAnimationFrame(trackLayout);
    };

    trackLayout();

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

      if (!wasmaximized && newtop <= panelheight - 10) {

      }

      newleft = Math.max(-size.width / 2.0, Math.min(screenwidth - size.width / 2.0, newleft));
      newtop = Math.max(panelheight - 20, Math.min(screenheight - dockheight - size.height / 4.0, newtop));

      setposition({
        top: newtop,
        left: newleft,
      });
      lasttop = newtop;
    };

    const onmouseup = () => {
      setisdragging(false);
      document.removeEventListener('mousemove', onmousemove);
      document.removeEventListener('mouseup', onmouseup);
      document.removeEventListener('touchmove', onmousemove);
      document.removeEventListener('touchend', onmouseup);

      if (!wasmaximized && lasttop <= panelheight) {
        previousStateRef.current = { position, size };
        updatewindow(id, { ismaximized: true });
      } else if (wasmaximized && dragstarted) {

      }
    };

    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('touchmove', onmousemove);
    document.addEventListener('touchend', onmouseup);
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

    const onmouseup = () => {
      document.removeEventListener('mousemove', onmousemove);
      document.removeEventListener('mouseup', onmouseup);
      document.removeEventListener('touchmove', onmousemove);
      document.removeEventListener('touchend', onmouseup);
    };

    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('touchmove', onmousemove);
    document.addEventListener('touchend', onmouseup);
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
      className={`border dark:border-neutral-700 border-neutral-300 overflow-hidden flex flex-col ${app?.titlebarblurred
        ? `dark:bg-opacity-80 bg-opacity-80 dark:bg-neutral-900 bg-white backdrop-blur-xl`
        : `dark:bg-neutral-900 bg-white backdrop-blur-sm`
        } ${ismaximized || ismobile ? '' : 'rounded-2xl shadow-2xl'} ${isdragging ? 'cursor-grabbing' : 'cursor-default'} ${(isminimized || shouldblur || isRecentAppView) ? 'pointer-events-none' : 'pointer-events-auto'}
        ${(ismobile && isRecentAppView) ? 'absolute inset-0 w-full h-full rounded-[24px]' : 'absolute'}`

      }
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
        <div id="buttons" className="absolute top-[18px] left-4 z-50 flex flex-row items-center content-center space-x-[8px] group">
          <button
            className={`w-[12px] h-[12px] rounded-full ${activewindow == id ? 'bg-[#FF5F56] border-[#E0443E] border' : 'bg-neutral-400/50 border-neutral-500/50 border'} window-button flex items-center justify-center`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removewindow(id);
            }}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black/50">×</span>
          </button>

          <button
            className={`w-[12px] h-[12px] rounded-full ${activewindow == id ? 'bg-[#FFBD2E] border-[#DEA123] border' : 'bg-neutral-400/50 border-neutral-500/50 border'} window-button flex items-center justify-center`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updatewindow(id, { isminimized: true });
            }}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black/50">−</span>
          </button>
          <button
            className={`w-[12px] h-[12px] rounded-full ${activewindow == id ? 'bg-[#27C93F] border-[#1AAB29] border' : 'bg-neutral-400/50 border-neutral-500/50 border'} window-button flex items-center justify-center`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlemaximize();
            }}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[6px] font-bold text-black/50">↗</span>
          </button>
        </div>
      )}

      <div
        className={`w-full h-full flex-1 overflow-hidden ${ismaximized || ismobile ? '' : ''} ${app?.titlebarblurred ? '' : 'bg-white  dark:bg-neutral-900'} ${(isminimized || issystemgestureactive || shouldblur || isRecentAppView) ? 'pointer-events-none' : 'pointer-events-auto'}`}
      >
        <MemoizedDynamicComponent appname={app ? app.appname : ''} icon={app ? app.icon : ''} component={app?.componentname ? app.componentname : component} appprops={props} isFocused={activewindow === id && !shouldblur} />

        {((ismobile && shouldblur && !isRecentAppView) || issystemgestureactive) && (
          <div className="absolute inset-0 z-[9999] bg-transparent w-full h-full pointer-events-auto" />
        )}
      </div>


      {!ismobile && (
        <>
          <div
            className="absolute w-full h-3 -top-[3px] cursor-ns-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'top')}
          />
          <div
            className="absolute w-full h-3 -bottom-[3px] cursor-ns-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'bottom')}
          />
          <div
            className="absolute top-0 left-0 w-[2px] h-full cursor-ew-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'left')}
          />
          <div
            className="absolute top-0 right-0 w-[2px] h-full cursor-ew-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'right')}
          />
          <div
            className="absolute w-3 h-3 -left-[3px] -top-[3px] cursor-nwse-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'top-left')}
          />
          <div
            className="absolute w-3 h-3 -right-[3px] -top-[3px] cursor-nesw-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'top-right')}
          />
          <div
            className="absolute w-3 h-3 -left-[3px] -bottom-[3px] cursor-nesw-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'bottom-left')}
          />
          <div
            className="absolute w-3 h-3 -right-[3px] -bottom-[3px] cursor-nwse-resize z-50"
            onMouseDown={(e) => handleresizestart(e, 'bottom-right')}
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
