
'use client'
import React, { useState, useEffect, useRef, memo } from 'react';
import { useWindows } from './WindowContext';
import { apps } from './app';
import { motion } from 'framer-motion';

const PANEL_HEIGHT = 30;
const DOCK_HEIGHT = 69;
const ANIMATION_DURATION = 200;
// eslint-disable-next-line react/display-name
const MemoizedDynamicComponent = memo(
  ({ icon, component, appname, appProps, isFocused }: { icon:string, component: string; appname:string,appProps: any; isFocused: boolean }) => {
    const [DynamicComponent, setDynamicComponent] = useState<any>(null);

    useEffect(() => {
      const loadComponent = async () => {
        try {
          const importedModule = await import(`../components/${component}`);
          setDynamicComponent(() => importedModule.default || null);
        } catch (err) {
          console.log(err);
          setDynamicComponent(null);
        }
      };

      loadComponent();
    }, [component]); // Reload component when it changes

    if (!DynamicComponent) {
      return (
        <div className="flex flex-row h-full w-full items-center content-center">
          <div className="flex flex-col space-y-5 font-sf mx-auto items-center content-center">
            <img className="w-24 h-24" src={icon} />
            <div className="text-sm dark:text-white">{appname} is being developed</div>
          </div>
        </div>
      );
    }

    return <DynamicComponent {...appProps} isFocused={isFocused} />;
  },
  (prevProps, nextProps) => prevProps.isFocused === nextProps.isFocused
);



const Window = ({ id, appName, title, component, props, isMinimized, isMaximized }:any) => {
  const { removeWindow, updateWindow, activeWindow, setActiveWindow } = useWindows();
  const [position, setPosition] = useState({ top: 100, left: 100 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [previousState, setPreviousState] = useState({ position, size });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const app = apps.find((app) => app.appName === appName);
  const windowRef = useRef(null);
  
  useEffect(() => {
    if (isMinimized) {
      const { innerWidth: screenWidth, innerHeight: screenHeight } = window;
      if(!isMaximized){
      setPreviousState({
        position,size
      })
    }
      setPosition({
        top: screenHeight ,
        left: (screenWidth - size.width) / 2,
      });
    } else if (isMaximized) {
      const { innerWidth: screenWidth, innerHeight: screenHeight } = window;
      setPosition({ top: PANEL_HEIGHT, left: 0 });
      setSize({
        width: screenWidth,
        height: screenHeight - PANEL_HEIGHT - DOCK_HEIGHT,
      });
    } else {
      setPosition(previousState.position);
      setSize(previousState.size);
    }
  }, [isMinimized, isMaximized]);
  const handleMaximize = () => {
    if (!isMaximized) {
      setPreviousState({ position, size });
      updateWindow(id, { isMaximized: true });
    } else {
      updateWindow(id, { isMaximized: false });
      setPosition(previousState.position);
      setSize(previousState.size);
    }
  };

  const handleDragStart = (e: any) => {
    // Only start drag-to-unmaximize if the user is actually moving the mouse (not just clicking)
    let dragStarted = false;
    const wasMaximized = isMaximized;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let startX = 0;
    let startY = 0;
    let prevSize = size;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (wasMaximized) {
      prevSize = previousState.size;
      prevPosition = previousState.position;
      dragOffsetX = prevSize.width / 2;
      dragOffsetY = 20;
      startX = clientX;
      startY = clientY;
    } else {
      startX = clientX;
      startY = clientY;
      dragOffsetX = startX - position.left;
      dragOffsetY = startY - position.top;
    }

    let lastTop = wasMaximized ? PANEL_HEIGHT : position.top;
    let maximizedOnDrag = false;

    const onMouseMove = (moveEvent: any) => {
      const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      if (!dragStarted && wasMaximized && Math.abs(moveY - startY) > 3) {
        // Only unmaximize if the user actually drags
        dragStarted = true;
        updateWindow(id, { isMaximized: false });
        setTimeout(() => {
          setSize(prevSize);
          setPosition({
            top: moveY - dragOffsetY,
            left: moveX - dragOffsetX,
          });
        }, 0);
        setIsDragging(true);
      } else if (!wasMaximized) {
        setIsDragging(true);
      }

      if (!dragStarted && wasMaximized) return;

      const { innerWidth: screenWidth, innerHeight: screenHeight } = window;
      let newLeft = moveX - dragOffsetX;
      let newTop = moveY - dragOffsetY;

      if (!wasMaximized && newTop <= PANEL_HEIGHT + 5) {
        maximizedOnDrag = true;
        setTimeout(() => {
          updateWindow(id, { isMaximized: true });
        }, 80);
      }

      newLeft = Math.max(-size.width / 2.0, Math.min(screenWidth - size.width / 2.0, newLeft));
      newTop = Math.max(PANEL_HEIGHT, Math.min(screenHeight - DOCK_HEIGHT - size.height / 4.0, newTop));

      setPosition({
        top: newTop,
        left: newLeft,
      });
      lastTop = newTop;
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);
      if (!wasMaximized && lastTop <= PANEL_HEIGHT + 5 && !maximizedOnDrag) {
        updateWindow(id, { isMaximized: true });
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
  };

  const handleResizeStart = (e:any, direction:any) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startTop = position.top;
    const startLeft = position.left;

    setIsResizing(true);

    const onMouseMove = (moveEvent:any) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newTop = startTop;
      let newLeft = startLeft;

      if (direction.includes('right')) newWidth = Math.max(300, startWidth + (clientX - startX));
      if (direction.includes('bottom')) {
        newHeight = Math.max(100, startHeight + (clientY - startY));
        const { innerHeight: screenHeight } = window;
        if (newTop + newHeight > screenHeight - DOCK_HEIGHT) {
          newHeight = screenHeight - DOCK_HEIGHT - newTop;
        }
      }
      if (direction.includes('left')) {
        newWidth = Math.max(300, startWidth - (clientX - startX));
        newLeft = startLeft + (clientX - startX);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(100, startHeight - (clientY - startY));
        newTop = startTop + (clientY - startY);
        if (newTop < PANEL_HEIGHT) {
          newTop = PANEL_HEIGHT;
          newHeight = startHeight - (newTop - startTop);
        }
      }

      setSize({
        width: newWidth,
        height: newHeight,
      });
      setPosition({
        top: newTop,
        left: newLeft,
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
  };

  return (
    <motion.div
      ref={windowRef}
      initial= {{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit = {{opacity: 0,y:-10}}
      
      transition={{ duration: 0.1, ease: 'easeOut', }}
            className={`${app?.titlebarblurred
            ? 'dark:bg-opacity-40 bg-opacity-80  dark:bg-black bg-white backdrop-blur-lg'
            : 'dark:bg-neutral-900 bg-white backdrop-blur-sm'} absolute ${isMaximized ? '' : 'rounded-2xl'} ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
      style={{
        top: position.top,
        left: isMaximized ? 0 : position.left,
        width: isMaximized ? '100vw' : size.width,
        height: size.height,
        zIndex: activeWindow === id ? 10 : 0,
        willChange: 'transform',
        transition: isDragging || isResizing ? 'none' : `all ${ANIMATION_DURATION}ms ease-in-out`
      }}
      onMouseDown={() => setActiveWindow(id)}
    >
      <div
        className={`cursor-grab  ${isMaximized ? '' : 'rounded-t-xl'} ${
          app?.titlebarblurred
            ? ' relative '
            : 'dark:bg-neutral-900 bg-white relative backdrop-blur-sm'
        } px-5 py-[16px] flex justify-between`}
        onDoubleClick={handleMaximize}
        onMouseDown={(e) => {
          if (!(e.target as Element).closest('#buttons')) handleDragStart(e);
        }}
        onTouchStart={(e) => {
          if (!(e.target as Element).closest('#buttons')) handleDragStart(e);
        }}
      >
        <div id="buttons" className="flex flex-row items-center content-center space-x-[10px]">
          <button
            className={`w-[14px] h-[14px] rounded-full ${activeWindow==id?'bg-red-600':'bg-neutral-400'} window-button`}
            onClick={(e) => {
              e.stopPropagation();
              removeWindow(id);
            }}
          ></button>
         
          <button
            className={`${activeWindow==id?app?.titlebarblurred?'bg-yellow-500':'bg-yellow-400':'bg-neutral-400'} w-[14px] h-[14px] rounded-full  window-button`}
            onClick={(e) => {
              e.stopPropagation();
              updateWindow(id, { isMinimized: true });
            }}
          ></button>
           <button
            className={`w-[14px] h-[14px] rounded-full ${activeWindow==id?'bg-green-600':'bg-neutral-400'} window-button`}
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
          ></button>
        </div>
        <div className="w-max max-w-72  absolute mx-auto dark:text-white right-0 left-0 bottom-[12px] font-sf font-semibold text-[14px] text-center">
          {title}
        </div>
      </div>

      <div
        className={`h-[calc((100%)-35px)] w-full overflow-hidden   ${
          isMaximized ? '' : 'rounded-b-2xl'
        } ${app?.titlebarblurred?'':'bg-white dark:bg-neutral-900'}`}
      >
      
<MemoizedDynamicComponent appname={app?app.appName:''} icon={app?app.icon:''} component={component} appProps={props} isFocused={activeWindow === id} />
</div>

      <div
        className="absolute w-full h-3 -top-[3px] cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top')}
      />
      <div
        className="absolute w-full  h-3 cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      />
     <div
  className="absolute top-0 left-0 w-[2px] h-full cursor-ew-resize"
  onMouseDown={(e) => handleResizeStart(e, 'left')}
></div>
<div
  className="absolute top-0 right-0 w-[2px] h-full cursor-ew-resize"
  onMouseDown={(e) => handleResizeStart(e, 'right')}
></div>
      <div
        className="absolute w-3 h-3 -left-[3px] -top-[3px] cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
      />
      <div
        className="absolute w-3 h-3 -right-[3px] -top-[3px] cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
      />
      <div
        className="absolute w-3 h-3 -left-[3px]  cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
      />
      <div
        className="absolute w-3 h-3 -right-[3px] cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
      />
    </motion.div>
  );
};

export default Window;
