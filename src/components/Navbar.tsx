import React from 'react';
import { CurrentUser, SystemConfig, ActiveTab } from '../types';
import { Menu, Bell, Calendar, Shield, GraduationCap } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: ActiveTab;
  currentUser: CurrentUser;
  config: SystemConfig;
  onMobileMenuClick: () => void;
  sidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  currentUser,
  config,
  onMobileMenuClick,
  sidebarOpen,
}) => {
  const schoolLabel = config.schoolName || 'SDN Maospati 3';
  const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Utama', subtitle: `Ringkasan data administrasi ${schoolLabel}` },
    presensi: { title: 'Daftar Hadir Siswa', subtitle: 'Presensi harian dan rekap kehadiran siswa' },
    nilai: { title: 'Penilaian Harian', subtitle: 'Input nilai per bab dan evaluasi hasil belajar' },
    jurnal: { title: 'Jurnal Catatan Mengajar', subtitle: 'Agenda harian dan refleksi proses pembelajaran' },
    bimbingan: { title: 'Bimbingan Siswa', subtitle: 'Catatan pembinaan dan konseling peserta didik' },
    siswa: { title: 'Data Siswa', subtitle: `Manajemen data profil siswa ${schoolLabel}` },
    guru: { title: 'Data Guru & Tenaga Pendidik', subtitle: 'Manajemen akun pendidik dan penugasan kelas' },
    pengaturan: { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi instansi, logo, dan tanda tangan resmi' },
    cetak: { title: 'Cetak Dokumen Resmi', subtitle: 'Ekspor PDF, Excel, dan format tanda tangan' },
  };

  const info = tabTitles[currentTab] || { title: 'Administrasi Guru', subtitle: '' };
  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {info.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Date, Semester badge, PWA button, and User */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{todayStr}</span>
        </div>

        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Sem. {config.activeSemester || '1'} ({config.academicYear || '2026/2027'})
        </div>

        <PWAInstallButton compact />

        <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {currentUser.role === 'admin' ? 'AD' : currentUser.teacher?.name.substring(0, 2).toUpperCase() || 'GU'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser.role === 'admin' ? 'Administrator' : currentUser.teacher?.name}
            </div>
            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
              {currentUser.role === 'admin' ? (config.schoolName || 'SDN Maospati 3') : currentUser.teacher?.tanggungJawab}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
