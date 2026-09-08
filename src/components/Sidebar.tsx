import React from 'react';
import { ActiveTab, CurrentUser, SystemConfig } from '../types';
import {
  LayoutDashboard,
  CalendarCheck2,
  Award,
  BookOpenCheck,
  Users2,
  GraduationCap,
  Settings,
  Printer,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  School,
  X,
  HeartHandshake
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: CurrentUser;
  config: SystemConfig;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  config,
  isOpen,
  onToggle,
  onLogout,
  isMobileOpen,
  onMobileClose,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presensi' as ActiveTab, label: 'Daftar Hadir (Absen)', icon: CalendarCheck2 },
    { id: 'nilai' as ActiveTab, label: 'Penilaian Harian', icon: Award },
    { id: 'jurnal' as ActiveTab, label: 'Jurnal Mengajar', icon: BookOpenCheck },
    { id: 'bimbingan' as ActiveTab, label: 'Bimbingan Siswa', icon: HeartHandshake },
    { id: 'siswa' as ActiveTab, label: 'Data Siswa', icon: GraduationCap },
    ...(isAdmin ? [{ id: 'guru' as ActiveTab, label: 'Data Guru', icon: Users2 }] : []),
    { id: 'cetak' as ActiveTab, label: 'Cetak Dokumen', icon: Printer },
    { id: 'pengaturan' as ActiveTab, label: 'Pengaturan', icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    onMobileClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <School className="w-5 h-5 text-white" />
          </div>
          {(isOpen || isMobileOpen) && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate leading-tight" title={config.schoolName || 'SDN MAOSPATI 3'}>
                {config.schoolName || 'SDN MAOSPATI 3'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Administrasi Guru
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!isMobileOpen && (
          <button
            onClick={onToggle}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User Badge Info */}
      <div className={`p-3 border-b border-slate-800 bg-slate-950/40 shrink-0 ${!isOpen && !isMobileOpen ? 'text-center' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-blue-400">
            {isAdmin ? <Shield className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          </div>
          {(isOpen || isMobileOpen) && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {isAdmin ? 'Administrator' : currentUser.teacher?.name}
              </div>
              <div className="text-[11px] text-blue-400 truncate font-medium">
                {isAdmin ? 'Admin Utama' : currentUser.teacher?.tanggungJawab}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List - Fixed inside sidebar, independent scroll if needed */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleSelectTab(item.id)}
              title={!isOpen && !isMobileOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              } ${!isOpen && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(isOpen || isMobileOpen) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
        {(isOpen || isMobileOpen) && (
          <div className="mb-2">
            <PWAInstallButton compact />
          </div>
        )}

        <button
          id="btn-logout"
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition ${
            !isOpen && !isMobileOpen ? 'justify-center px-0' : ''
          }`}
          title="Keluar Akun"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {(isOpen || isMobileOpen) && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Offcanvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Fixed Sidepanel (Does NOT move on scroll) */}
      <aside
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 shadow-xl ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
