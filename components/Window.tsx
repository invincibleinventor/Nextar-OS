'use client'
import React, { useState, useEffect, useRef, memo } from 'react';
import { useWindows } from './WindowContext';
import { apps } from './app';
import { motion } from 'framer-motion';
import { useDevice } from './DeviceContext';
import { useSettings } from './SettingsContext';

const panelheight = 35;
const dockheight = 70;

import dynamic from 'next/dynamic';

const componentmap: { [key: string]: any } = {
  'apps/Finder': dynamic(() => import('./apps/Finder')),
  'apps/Settings': dynamic(() => import('./apps/Settings')),
  'apps/Calendar': dynamic(() => import('./apps/Calendar')),
  'apps/Safari': dynamic(() => import('./apps/Safari')),
  'apps/Messages': dynamic(() => import('./apps/Messages')),
  'apps/Photos': dynamic(() => import('./apps/Photos')),
  'apps/Terminal': dynamic(() => import('./apps/Terminal')),
  'apps/Launchpad': dynamic(() => import('./apps/Launchpad')),
  'apps/News': dynamic(() => import('./apps/News')),
  'apps/Python': dynamic(() => import('./apps/Python')),

  'AppStore': dynamic(() => import('./AppStore')),
  'BalaDev': dynamic(() => import('./BalaDev')),
  'Welcome': dynamic(() => import('./Welcome')),

  'Mail': dynamic(() => import('./Mail')),
  'Calculator': dynamic(() => import('./Calculator')),
};


const MemoizedDynamicComponent = memo(
  ({ icon, component, appname, appProps, isFocused }: { icon: string, component: string; appname: string, appProps: any; isFocused: boolean }) => {
    const DynamicComponent = componentmap[component];

    if (!DynamicComponent) {
      return (
        <div className="flex flex-row h-full w-full items-center content-center">
          <div className="flex flex-col space-y-5 font-sf mx-auto items-center content-center">
            <img className="w-24 h-24" src={icon} alt={appname} />
            <div className="text-sm dark:text-white">{appname} is coming soon</div>
          </div>
        </div>
      );
    }

    return <DynamicComponent {...appProps} isFocused={isFocused} />;
  },
  (prevprops, nextprops) => prevprops.isFocused === nextprops.isFocused
);
MemoizedDynamicComponent.displayName = 'MemoizedDynamicComponent';



const Window = ({ id, appName, title, component, props, isMinimized, isMaximized, shouldBlur = true, isSystemGestureActive = false }: any) => {

  const { removewindow, updatewindow, activewindow, setactivewindow, windows } = useWindows();
  const { ismobile } = useDevice();
  const { reducemotion, reducetransparency } = useSettings();
  const app = apps.find((app) => app.appName === appName);

  const [position, setposition] = useState(() => {
    if (app && (app.additionalData as any) && (app.additionalData as any).startLarge && typeof window !== 'undefined') {
      const screenwidth = window.innerWidth;
      const screenheight = window.innerHeight;
      const width = Math.round(screenwidth * 0.85);
      const height = Math.round((screenheight - panelheight - dockheight) * 0.85);
      return {
        top: panelheight + Math.round(((screenheight - panelheight - dockheight) - height) / 2),
        left: Math.round((screenwidth - width) / 2),
      };
    }
    return { top: 100, left: 100 };
  });
  const [size, setsize] = useState(() => {
    if (app && (app.additionalData as any) && (app.additionalData as any).startLarge && typeof window !== 'undefined') {
      const screenwidth = window.innerWidth;
      const screenheight = window.innerHeight;
      return {
        width: Math.round(screenwidth * 0.85),
        height: Math.round((screenheight - panelheight - dockheight) * 0.85),
      };
    }
    return { width: 400, height: 300 };
  });
  const [previousstate, setpreviousstate] = useState({ position, size });
  const [isdragging, setisdragging] = useState(false);

  const windowref = useRef(null);

  const myindex = windows ? windows.findIndex((w: any) => w.id === id) : 0;
  const zindex = activewindow === id ? 1000 : 100 + myindex;

  useEffect(() => {
    if (ismobile) {
      setposition({ top: 44, left: 0 });
      setsize({ width: window.innerWidth, height: window.innerHeight - 44 });
      return;
    }
    if (isMinimized) {
      const { innerWidth: screenwidth, innerHeight: screenheight } = window;
      if (!isMaximized) {
        setpreviousstate({
          position, size
        })
      }
      setposition({
        top: screenheight,
        left: (screenwidth - size.width) / 2,
      });
    } else if (isMaximized) {
      const { innerWidth: screenwidth, innerHeight: screenheight } = window;
      setposition({ top: panelheight, left: 0 });
      setsize({
        width: screenwidth,
        height: screenheight - panelheight - dockheight,
      });
    } else {
      setsize(previousstate.size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMinimized, isMaximized, ismobile]);

  const handlemaximize = () => {
    if (!isMaximized) {
      setpreviousstate({ position, size });
      updatewindow(id, { isMaximized: true });
    } else {
      updatewindow(id, { isMaximized: false });
      setposition(previousstate.position);
      setsize(previousstate.size);
    }
  };

  const handledragstart = (e: any) => {
    if (e.detail === 2) return;

    let dragstarted = false;
    const wasmaximized = isMaximized;
    let dragoffsetx = 0;
    let dragoffsety = 0;
    let startx = 0;
    let starty = 0;
    let prevsize = size;

    const clientx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clienty = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (wasmaximized) {
      prevsize = previousstate.size;
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
    const maximizedondrag = false;


    const onmousemove = (moveevent: any) => {
      const movex = 'touches' in moveevent ? moveevent.touches[0].clientX : moveevent.clientX;
      const movey = 'touches' in moveevent ? moveevent.touches[0].clientY : moveevent.clientY;

      if (!isdragging && Math.abs(movex - startx) < 5 && Math.abs(movey - starty) < 5) {
        return;
      }

      if (!dragstarted && wasmaximized && Math.abs(movey - starty) > 10) {
        dragstarted = true;
        updatewindow(id, { isMaximized: false });

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
        updatewindow(id, { isMaximized: true });
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

  return (
    <motion.div
      ref={windowref}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: isMinimized ? 0 : 1, y: isMinimized ? 400 : 0, scale: isMinimized ? 0.5 : 1 }}
      exit={{ opacity: 0, y: -10 }}
      onAnimationComplete={(definition) => {
        if (isMinimized) {
        }
      }}
      transition={{
        type: reducemotion ? "tween" : "spring",
        stiffness: reducemotion ? undefined : 350,
        damping: reducemotion ? undefined : 30,
        duration: reducemotion ? 0.2 : undefined
      }}
      className={`border dark:border-neutral-600 border-neutral-500 overflow-hidden flex flex-col ${app?.titlebarblurred
        ? `dark:bg-opacity-40 absolute bg-opacity-80  dark:bg-black bg-white ${shouldBlur ? 'backdrop-blur-lg' : ''}`
        : `dark:bg-neutral-900 bg-white ${shouldBlur ? 'backdrop-blur-sm' : ''}`}  absolute ${isMaximized || ismobile ? '' : 'rounded-3xl'} ${isdragging ? 'cursor-grabbing' : 'cursor-default'} ${isMinimized ? 'pointer-events-none' : 'pointer-events-auto'}`}
      style={{
        top: position.top,
        left: isMaximized ? 0 : position.left,
        width: isMaximized ? '100vw' : size.width,
        height: size.height,
        zIndex: isMinimized ? -1 : zindex,
        willChange: 'transform',
      }}
      onMouseDown={() => setactivewindow(id)}
    >
      {!ismobile && (
        <div
          className={`cursor-grab  ${isMaximized ? '' : 'rounded-t-3xl'} ${app?.titlebarblurred
            ? ' relative '
            : 'dark:bg-neutral-800 bg-white relative backdrop-blur-sm'
            } px-5 py-[16px] flex justify-between`}
          onDoubleClick={handlemaximize}
          onMouseDown={(e) => {
            if (!(e.target as Element).closest('#buttons')) handledragstart(e);
          }}
          onTouchStart={(e) => {
            if (!(e.target as Element).closest('#buttons')) handledragstart(e);
          }}
        >
          <div id="buttons" className="flex flex-row items-center content-center space-x-[10px]">
            <button
              className={`w-[14px] h-[14px] rounded-full ${activewindow == id ? 'bg-red-600' : 'bg-neutral-400'} window-button`}
              onClick={(e) => {
                e.stopPropagation();
                removewindow(id);
              }}
            ></button>

            <button
              className={`${activewindow == id ? app?.titlebarblurred ? 'bg-yellow-500' : 'bg-yellow-400' : 'bg-neutral-400'} w-[14px] h-[14px] rounded-full  window-button`}
              onClick={(e) => {
                e.stopPropagation();
                updatewindow(id, { isMinimized: true });
              }}
            ></button>
            <button
              className={`w-[14px] h-[14px] rounded-full ${activewindow == id ? 'bg-green-600' : 'bg-neutral-400'} window-button`}
              onClick={(e) => {
                e.stopPropagation();
                handlemaximize();
              }}
            ></button>
          </div>
          <div className="w-max max-w-72  absolute mx-auto dark:text-white right-0 left-0 bottom-[12px] font-sf font-semibold text-[15px] text-center">
            {title}
          </div>
        </div>
      )}

      <div
        className={`w-full dark:border-neutral-600 border-neutral-500 overflow-hidden flex-1 h-full ${isMaximized || ismobile ? '' : 'rounded-b-3xl'} ${app?.titlebarblurred ? '' : 'bg-white  dark:bg-neutral-800'} ${(isMinimized || isSystemGestureActive) ? 'pointer-events-none' : 'pointer-events-auto'}`}
      >

        <MemoizedDynamicComponent appname={app ? app.appName : ''} icon={app ? app.icon : ''} component={app?.componentName ? app.componentName : component} appProps={props} isFocused={activewindow === id} />
      </div>

      {!ismobile && (
        <>
          <div
            className="absolute w-full h-3 -top-[3px] cursor-ns-resize"
            onMouseDown={(e) => handleresizestart(e, 'top')}
          />
          <div
            className="absolute w-full h-3 -bottom-[3px] cursor-ns-resize"
            onMouseDown={(e) => handleresizestart(e, 'bottom')}
          />
          <div
            className="absolute top-0 left-0 w-[2px] h-full cursor-ew-resize"
            onMouseDown={(e) => handleresizestart(e, 'left')}
          ></div>
          <div
            className="absolute top-0 right-0 w-[2px] h-full cursor-ew-resize"
            onMouseDown={(e) => handleresizestart(e, 'right')}
          ></div>
          <div
            className="absolute w-3 h-3 -left-[3px] -top-[3px] cursor-nwse-resize"
            onMouseDown={(e) => handleresizestart(e, 'top-left')}
          />
          <div
            className="absolute w-3 h-3 -right-[3px] -top-[3px] cursor-nesw-resize"
            onMouseDown={(e) => handleresizestart(e, 'top-right')}
          />
          <div
            className="absolute w-3 h-3 -left-[3px] -bottom-[3px] cursor-nesw-resize"
            onMouseDown={(e) => handleresizestart(e, 'bottom-left')}
          />
          <div
            className="absolute w-3 h-3 -right-[3px] -bottom-[3px] cursor-nwse-resize"
            onMouseDown={(e) => handleresizestart(e, 'bottom-right')}
          />
        </>
      )}
    </motion.div >
  );
};

Window.displayName = 'Window';
export default Window;
