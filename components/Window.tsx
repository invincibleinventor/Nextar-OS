'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWindows } from './WindowContext';
import { apps } from './app';

const PANEL_HEIGHT = 25;
const DOCK_HEIGHT = 110;

const Window = ({ id, appName, title, component: Component, props, isMinimized, isMaximized }: any) => {
  const { removeWindow, updateWindow, activeWindow, setActiveWindow } = useWindows();
  const [position, setPosition] = useState({ top: 100, left: 100 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [previousState, setPreviousState] = useState({ position, size });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const app = apps.find((app) => app.appName === appName);
  const windowRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);

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

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMaximized || isResizing) return;

    const startX = 'touches' in e ? e.touches[0].clientX - position.left : e.clientX - position.left;
    const startY = 'touches' in e ? e.touches[0].clientY - position.top : e.clientY - position.top;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

      const { innerWidth: screenWidth, innerHeight: screenHeight } = window;

      let newLeft = clientX - startX;
      let newTop = clientY - startY;

      newLeft = Math.max(-size.width / 2, Math.min(screenWidth - size.width / 2, newLeft));
      newTop = Math.max(PANEL_HEIGHT, Math.min(screenHeight - DOCK_HEIGHT - size.height / 4, newTop));

      setPosition({ top: newTop, left: newLeft });
    };

    const onMouseUp = () => {
      setIsDragging(false);
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
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
  
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startTop = position.top;
    const startLeft = position.left;
  
    setIsResizing(true);
  
    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
  
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newTop = startTop;
      let newLeft = startLeft;
  
      if (direction.includes('right')) newWidth = Math.max(200, startWidth + (clientX - startX));
      if (direction.includes('bottom')) newHeight = Math.max(100, startHeight + (clientY - startY) - DOCK_HEIGHT + PANEL_HEIGHT);
      if (direction.includes('left')) {
        newWidth = Math.max(200, startWidth - (clientX - startX));
        newLeft = startLeft + (clientX - startX);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(100, startHeight - (clientY - startY));
        newTop = startTop + (clientY - startY);
  
        // Ensure the window does not move out of the top bounds
        const { innerHeight: screenHeight } = window;
        if (newTop < PANEL_HEIGHT) {
          newTop = PANEL_HEIGHT;
        }
      }
  
      setSize({ width: newWidth, height: newHeight });
      setPosition({ top: newTop, left: newLeft });
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
    <div
      ref={windowRef}
      className={`absolute  ${
        isMaximized ? '' : 'rounded-xl'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
      style={{
        top: position.top,
        left: position.left,
        width: size.width,
        height: size.height,
        zIndex: activeWindow === id ? 1000 : 0,
        transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
      }}
      onMouseDown={() => setActiveWindow(id)}
    >
      {/* Title Bar */}
      <div
        className={`cursor-grab dark:border-x dark:border-x-neutral-800 dark:border-t dark:border-t-neutral-800 border-x border-x-neutral-200 border-t border-b border-b-white dark:border-b dark:border-b-neutral-900 border-t-neutral-200 ${isMaximized ? '' : 'rounded-t-xl'} ${
          app?.titlebarblurred
            ? 'dark:bg-opacity-70 bg-opacity-70  dark:bg-black bg-white relative backdrop-blur-sm'
            : 'dark:bg-neutral-900 bg-white relative backdrop-blur-sm'
        } px-3 py-[10px] flex justify-between`}
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
            className={`w-[14px] h-[14px] rounded-full ${activeWindow==id?'bg-red-500':'bg-neutral-400'} window-button`}
            onClick={(e) => {
              e.stopPropagation();
              removeWindow(id);
            }}
          ></button>
          <button
            className={`w-[14px] h-[14px] rounded-full ${activeWindow==id?'bg-green-500':'bg-neutral-400'} window-button`}
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
          ></button>
          <button
            className={`${activeWindow==id?app?.titlebarblurred?'bg-yellow-500':'bg-yellow-400':'bg-neutral-400'} w-[14px] h-[14px] rounded-full  window-button`}
            onClick={(e) => {
              e.stopPropagation();
              updateWindow(id, { isMinimized: true });
            }}
          ></button>
        </div>
        <div className="max-w-72 absolute mx-auto dark:text-white right-0 left-0 bottom-[8px] font-sf font-semibold text-[13px] text-center">
          {title}
        </div>
      </div>

      {/* Content Area */}
      <div
        className={`h-full w-full overflow-hidden border-x border-x-neutral-200 dark:border-x border-b border-b-neutral-200 dark:border-b dark:border-b-neutral-800 dark:border-x-neutral-800 border-t dark:border-t  border-t-neutral-200 dark:border-t-neutral-900  dark:bg-neutral-900 ${
          isMaximized ? '' : 'rounded-b-xl'
        } bg-white `}
      >
        <Component focused={activeWindow === id} {...props} />
      </div>

      {/* Resize Handles */}
      <div
        className="absolute w-full h-3 -top-[3px] cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top')}
      />
      <div
        className="absolute w-full h-3 -bottom-[3px] cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      />
      <div
        className="absolute h-full w-3 -left-[3px] cursor-ew-resize"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />
      <div
        className="absolute h-full w-3 -right-[3px] cursor-ew-resize"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
      <div
        className="absolute w-3 h-3 -left-[3px] -top-[3px] cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
      />
      <div
        className="absolute w-3 h-3 -right-[3px] -top-[3px] cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
      />
      <div
        className="absolute w-3 h-3 -left-[3px] -bottom-[3px] cursor-nesw-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
      />
      <div
        className="absolute w-3 h-3 -right-[3px] -bottom-[3px] cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
      />
    </div>
  );
};

export default Window;
