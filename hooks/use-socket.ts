'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface TimerSyncData {
  serverTime: number;
  remainingTime: number;
}

interface AutoSaveData {
  attemptId: string;
  questionId: string;
  selectedOptions: number[];
  timeSpent: number;
}

export function useSocket(options: UseSocketOptions = { autoConnect: true }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.autoConnect) return;

    const socketIo = io({
      transports: ['websocket'],
      upgrade: false
    });

    socketIo.on('connect', () => {
      console.log('Socket connected:', socketIo.id);
      setConnected(true);
      setError(null);
    });

    socketIo.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketIo.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    setSocket(socketIo);

    return () => {
      socketIo.close();
    };
  }, [options.autoConnect]);

  return { socket, connected, error };
}

export function useTestTimer(
  socket: Socket | null,
  attemptId: string | null,
  testDuration: number,
  onTimeUp?: () => void
) {
  const [remainingTime, setRemainingTime] = useState(testDuration * 60 * 1000);
  const [serverSynced, setServerSynced] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!socket || !attemptId) return;

    // Listen for timer sync from server
    const handleTimerSync = (data: TimerSyncData) => {
      setRemainingTime(data.remainingTime);
      setServerSynced(true);
      lastSyncRef.current = Date.now();
      console.log('Timer synced with server:', data.remainingTime / 1000, 'seconds remaining');
    };

    // Listen for auto-submit
    const handleAutoSubmit = (data: { attemptId: string; reason: string }) => {
      console.log('Auto-submit triggered:', data.reason);
      setRemainingTime(0);
      if (onTimeUp) {
        onTimeUp();
      }
    };

    socket.on('timer-sync', handleTimerSync);
    socket.on('auto-submit', handleAutoSubmit);

    // Start local timer
    intervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0 && onTimeUp) {
          onTimeUp();
        }
        return newTime;
      });
    }, 1000);

    // Request initial sync
    socket.emit('request-timer-sync', { attemptId });

    // Sync with server every 30 seconds
    const syncInterval = setInterval(() => {
      socket.emit('request-timer-sync', { attemptId });
    }, 30000);

    return () => {
      socket.off('timer-sync', handleTimerSync);
      socket.off('auto-submit', handleAutoSubmit);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(syncInterval);
    };
  }, [socket, attemptId, onTimeUp]);

  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    serverSynced,
    isTimeUp: remainingTime <= 0
  };
}

export function useAutoSave(
  socket: Socket | null,
  attemptId: string | null,
  interval: number = 10000 // 10 seconds
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !attemptId) return;

    const handleSaveConfirmed = (data: { questionId: string; timestamp: number }) => {
      setLastSaved(new Date(data.timestamp));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleSaveError = (data: { error: string }) => {
      console.error('Auto-save error:', data.error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    };

    socket.on('save-confirmed', handleSaveConfirmed);
    socket.on('save-error', handleSaveError);

    return () => {
      socket.off('save-confirmed', handleSaveConfirmed);
      socket.off('save-error', handleSaveError);
    };
  }, [socket, attemptId]);

  const autoSave = (data: Omit<AutoSaveData, 'attemptId'>) => {
    if (!socket || !attemptId) return;

    setSaveStatus('saving');

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce auto-save
    timeoutRef.current = setTimeout(() => {
      socket.emit('auto-save', {
        ...data,
        attemptId
      });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    autoSave,
    lastSaved,
    saveStatus
  };
}

export function useTestSocket(
  attemptId: string,
  testId: string,
  studentId: string,
  duration: number,
  onTimeUp?: () => void
) {
  const { socket, connected } = useSocket();
  const [joined, setJoined] = useState(false);

  const timer = useTestTimer(socket, attemptId, duration, onTimeUp);
  const autoSave = useAutoSave(socket, attemptId);

  useEffect(() => {
    if (socket && connected && !joined) {
      socket.emit('join-test', {
        attemptId,
        testId,
        studentId,
        duration
      });
      setJoined(true);
      console.log('Joined test room');
    }
  }, [socket, connected, attemptId, testId, studentId, duration, joined]);

  const submitTest = () => {
    if (socket && attemptId) {
      socket.emit('submit-test', { attemptId });
    }
  };

  return {
    socket,
    connected,
    ...timer,
    ...autoSave,
    submitTest
  };
}