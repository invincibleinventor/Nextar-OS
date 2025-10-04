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
      appName: 'XCode',
      component: apps.find((app) => app.appName === 'XCode')?.componentName,
      props: {},
    };
    addWindow(newWindow);
  };

  return (
    <div className='p-4 py-10 flex flex-col items-end content-end '>
      <button onClick={handleAddWindow} className="p-2 flex hover:bg-neutral-400/20 rounded-2xl hover:backdrop-blur-lg hover:filter px-4 flex-col items-center content-center text-white">
        <img className='w-16 h-16' src="/code.png"></img>
        <span className='text-xs font-medium text-white mt-2'>XCode</span>
      </button>
      {windows.map((window: any,index:any) => (
        <Window key={index} {...window} />
      ))}
    </div>
  );
};

export default Page;
