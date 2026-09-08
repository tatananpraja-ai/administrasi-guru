import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg shadow-amber-900/20 border border-amber-500 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-100" />
      <span>Mode Offline — Menggunakan data lokal perangkat.</span>
    </div>
  );
};
