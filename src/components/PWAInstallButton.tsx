import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Android / Chromium
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className={`flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition active:scale-95 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        }`}
        title="Pasang aplikasi di HP/Laptop"
      >
        <Download className="w-4 h-4" />
        <span>Instal Aplikasi</span>
      </button>
    );
  }

  // iOS Safari
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Pasang di iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">Pasang di iPhone/iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah navigasi bawah Safari.<br />
                2. Geser ke bawah lalu ketuk <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.<br />
                3. Ketuk <strong>Tambah</strong> di sudut kanan atas.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
