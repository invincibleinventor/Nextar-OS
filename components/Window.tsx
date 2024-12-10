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

  const app = apps.find((app) => app.appName === appName);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMinimized) {
      // Place the minimized window below the dock
      const { innerWidth: screenWidth, innerHeight: screenHeight } = window;
      setPosition({
        top: screenHeight +10, // Adjust to place below the dock
        left: (screenWidth - size.width) / 2, // Center it horizontally
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
    const { innerWidth: screenWidth, innerHeight: screenHeight } = window;

    if (!isMaximized) {
      setPreviousState({ position, size });
      setSize({
        width: screenWidth,
        height: screenHeight - PANEL_HEIGHT - DOCK_HEIGHT,
      });
      setPosition({ top: PANEL_HEIGHT, left: 0 });
      updateWindow(id, { isMaximized: true });
    } else {
      updateWindow(id, { isMaximized: false });
      setPosition(previousState.position);
      setSize(previousState.size);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMaximized) return;

    const startX = 'touches' in e ? e.touches[0].clientX - position.left : e.clientX - position.left;
    const startY = 'touches' in e ? e.touches[0].clientY - position.top : e.clientY - position.top;

    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

      const { innerWidth: screenWidth, innerHeight: screenHeight } = window;

      let newLeft = clientX - startX;
      let newTop = clientY - startY;

      newLeft = Math.max(0, Math.min(screenWidth - size.width, newLeft));
      newTop = Math.max(PANEL_HEIGHT, Math.min(screenHeight - DOCK_HEIGHT - size.height, newTop));

      setPosition({
        top: newTop,
        left: newLeft,
      });
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

  return (
    <div
      ref={windowRef}
      className={`absolute border dark:border-gray-800 border-b border-b-black shadow-md transition-all duration-300 ${
        isMaximized ? '' : 'rounded-xl'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
      style={{
        top: position.top,
        left: position.left,
        width: size.width,
        height: size.height,
        zIndex: activeWindow === id ? 1000 : 0,
        transition: isDragging ? 'none' : 'all 0.2s ease',
      }}
      onMouseDown={() => setActiveWindow(id)}
    >
      <div
        className={`cursor-grab ${isMaximized ? '' : 'rounded-t-xl'} ${
          app?.titlebarblurred
            ? 'dark:bg-opacity-50 bg-opacity-70 dark:bg-black bg-white relative backdrop-blur-sm'
            : 'dark:bg-gray-800 bg-white relative backdrop-blur-sm'
        } px-3 py-[10px] flex justify-between`}
        onDoubleClick={handleMaximize}
        onMouseDown={(e) => {
          if (!(e.target as Element).closest('#buttons')) handleDragStart(e);
        }}
        onTouchStart={(e) => {
          if (!(e.target as Element).closest('#buttons')) handleDragStart(e);
        }}
      >
        <div id="buttons" className='flex flex-row items-center content-center space-x-2'>
          <button
            className='w-3 h-3 rounded-full bg-red-500 window-button'
            onClick={(e) => {
              e.stopPropagation();
              removeWindow(id);
            }}
          ></button>
          <button
            className='w-3 h-3 rounded-full bg-green-500 window-button'
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
          ></button>
          <button
            className='w-3 h-3 rounded-full bg-yellow-500 window-button'
            onClick={(e) => {
              e.stopPropagation();
              updateWindow(id, { isMinimized: true });
            }}
          ></button>
        </div>
        <div className='max-w-72 absolute mx-auto dark:text-white right-0 left-0 bottom-[6px] font-sf font-semibold text-sm text-center'>
          {title}
        </div>
      </div>

      <div className={`h-full w-full overflow-hidden dark:bg-gray-900  ${isMaximized ? '' : 'rounded-b-xl'} bg-white`}>
        <Component focused={activeWindow === id} {...props} />
      </div>
    </div>
  );
};

export default Window;
