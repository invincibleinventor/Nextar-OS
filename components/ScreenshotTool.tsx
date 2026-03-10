'use client'

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCamera, IoCameraOutline, IoDesktopOutline, IoCropOutline, IoVideocam, IoClose, IoCheckmark } from 'react-icons/io5';
import { isnative, electronapi } from '@/utils/platform';
import { useIsClay } from './hooks/useIsClay';
import { glassCard } from './hooks/useClayStyles';
import { useNotifications } from './NotificationContext';

type ScreenshotMode = 'full' | 'window' | 'area';

export default function ScreenshotTool({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<ScreenshotMode>('full');
  const [delay, setDelay] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const clay = useIsClay();
  const { addToast } = useNotifications();

  const takeScreenshot = useCallback(async () => {
    if (!isnative || !electronapi?.screenshot) {
      addToast('Screenshots require native mode', 'error');
      return;
    }
    try {
      onClose();
      if (delay > 0) await new Promise(r => setTimeout(r, delay * 1000));
      const result = await electronapi.screenshot.take(mode);
      if (result?.path) {
        addToast(`Screenshot saved to ${result.path}`, 'success');
      }
    } catch (e: any) {
      addToast(e?.message || 'Screenshot failed', 'error');
    }
  }, [mode, delay, onClose, addToast]);

  const toggleRecording = useCallback(async () => {
    if (!isnative || !electronapi?.screenshot) {
      addToast('Screen recording requires native mode', 'error');
      return;
    }
    try {
      if (isRecording) {
        await electronapi.screenshot.recordstop();
        setIsRecording(false);
        addToast('Recording saved', 'success');
      } else {
        await electronapi.screenshot.recordstart();
        setIsRecording(true);
        onClose();
        addToast('Recording started', 'info');
      }
    } catch (e: any) {
      addToast(e?.message || 'Recording failed', 'error');
    }
  }, [isRecording, onClose, addToast]);

  const modes: { id: ScreenshotMode; label: string; icon: React.ReactNode }[] = [
    { id: 'full', label: 'Full Screen', icon: <IoDesktopOutline size={20} /> },
    { id: 'window', label: 'Window', icon: <IoCameraOutline size={20} /> },
    { id: 'area', label: 'Selection', icon: <IoCropOutline size={20} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[700]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[701]"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`flex items-center gap-2 p-2 ${clay ? 'rounded-[16px] border border-[--glass-border]' : 'rounded-xl border border-[--border-color] bg-overlay'}`}
              style={clay ? { ...glassCard, background: 'color-mix(in srgb, var(--bg-glass) 80%, transparent)', backdropFilter: 'blur(40px)' } : undefined}
              onClick={e => e.stopPropagation()}
            >
              {/* Mode selector */}
              <div className={`flex gap-1 p-1 ${clay ? 'bg-[--bg-glass-active] rounded-[10px]' : 'bg-[--bg-base] rounded-lg'}`}>
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-all text-[11px] ${
                      mode === m.id
                        ? clay ? 'bg-[--accent-source]/20 text-[--accent-source]' : 'bg-[--accent-source] text-white'
                        : 'text-[--text-muted] hover:text-[--text-color]'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className={`w-px h-10 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`} />

              {/* Delay selector */}
              <div className="flex gap-1">
                {[0, 3, 5, 10].map(d => (
                  <button
                    key={d}
                    onClick={() => setDelay(d)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      delay === d
                        ? clay ? 'bg-[--bg-glass-hover] text-[--text-color]' : 'bg-[--accent-source]/15 text-[--accent-source]'
                        : 'text-[--text-muted] hover:text-[--text-color]'
                    }`}
                  >
                    {d === 0 ? 'Now' : `${d}s`}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className={`w-px h-10 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`} />

              {/* Actions */}
              <button
                onClick={takeScreenshot}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                  clay ? 'bg-[--accent-source]/20 text-[--accent-source] hover:bg-[--accent-source]/30' : 'bg-[--accent-source] text-white hover:opacity-90'
                }`}
              >
                <IoCamera size={16} />
                Capture
              </button>

              <button
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-glass-hover]'
                }`}
              >
                <IoVideocam size={16} />
                {isRecording ? 'Stop' : 'Record'}
              </button>

              <button onClick={onClose} className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-glass-hover] transition-all">
                <IoClose size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
