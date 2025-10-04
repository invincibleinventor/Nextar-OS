'use client';
import React, { createContext, useState, useContext } from 'react';

const WindowContext = createContext<any>(null);

export const useWindows = () => useContext(WindowContext);

export const WindowProvider = ({ children }: any) => {
  const [windows, setWindows] = useState<any[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  const addWindow = (newWindow: any) => {
    setWindows((prevWindows) => {
      return [...prevWindows, newWindow];
    });
  };
  const removeWindow = (id: string) => {
    setWindows((prevWindows) => {
      // Remove the window with the given ID
      const updatedWindows = prevWindows.filter((window) => window.id !== id);
      // If no windows are left, clear the active window
      if (updatedWindows.length === 0) {
        setActiveWindow(null);
      } else {
        // If the active window is the one being closed, set the next window as active, but do NOT change its position/size
        if (activeWindow === id) {
          setActiveWindow(updatedWindows[updatedWindows.length - 1]?.id || null);
        }
      }
      return updatedWindows;
    });
  };
  
  
  const toggleWindows = (appName: string) => {
    setWindows((prevWindows) => {
      return prevWindows.map((win) => {
        if (win.appName === appName) {
          return { ...win, isMinimized: !win.isMinimized };
        }
        return win;
      });
    });
  };
  const updateWindow = (id: string, updatedProps: any) => {
    setWindows(
      windows.map((window) =>
        window.id === id ? { ...window, ...updatedProps } : window
      )
    );
    if (updatedProps.isMinimized === false) {
      setActiveWindow(id);
    }
  };

  return (
    <WindowContext.Provider
      value={{
        windows,
        addWindow,
        removeWindow,
        updateWindow,
        activeWindow,
        setActiveWindow,
        toggleWindows,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
};
