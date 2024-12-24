/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react';
import { useWindows } from '@/components/WindowContext';
import Window from '@/components/Window';
import { apps } from '@/components/app'

const Page = () => {
  const { windows, addWindow } = useWindows();

  const handleAddWindow = () => {

    const newWindow = {
      id: Date.now(),
      appName: 'Welcome',
      component: apps.find((app) => app.appName === 'Welcome')?.componentName,
      props: {},
    };
    addWindow(newWindow);
  };

  return (
    <div>
      <button onClick={handleAddWindow} className="p-2   bg-blue-500 text-white">
        Add Window
      </button>
      {windows.map((window: any,index:any) => (
        <Window key={index} {...window} />
      ))}
    </div>
  );
};

export default Page;
