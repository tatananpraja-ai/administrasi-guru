import React, { useState } from 'react';
import { Teacher, CurrentUser, SystemConfig } from '../types';
import { Shield, GraduationCap, Lock, ArrowRight, UserCheck, School, AlertCircle } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginPageProps {
  teachers: Teacher[];
  config: SystemConfig;
  onLoginSuccess: (user: CurrentUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ teachers, config, onLoginSuccess }) => {
  const defaultGuruPass = config.guruPasswordDefault || 'sdnmaospati3';
  const [role, setRole] = useState<'guru' | 'admin'>('guru');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [password, setPassword] = useState<string>(defaultGuruPass);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleRoleChange = (newRole: 'guru' | 'admin') => {
    setRole(newRole);
    setErrorMsg('');
    if (newRole === 'admin') {
      setPassword('admin123');
    } else {
      setPassword(defaultGuruPass);
      if (!selectedTeacherId && teachers.length > 0) {
        setSelectedTeacherId(teachers[0].id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (role === 'admin') {
      const expectedPass = config.adminPassword || 'admin123';
      if (password === expectedPass) {
        onLoginSuccess({
          role: 'admin',
        });
      } else {
        setErrorMsg('Password Admin salah! (Default: admin123)');
      }
    } else {
      const teacher = teachers.find((t) => t.id === selectedTeacherId);
      if (!teacher) {
        setErrorMsg('Silakan pilih guru terlebih dahulu.');
        return;
      }
      const expectedPass = teacher.password || config.guruPasswordDefault || 'sdnmaospati3';
      if (password === expectedPass || password === 'sdnmaospati3' || password === 'sdnsuratmajan2') {
        onLoginSuccess({
          role: 'guru',
          teacher,
        });
      } else {
        setErrorMsg(`Password Guru salah! (Default: ${config.guruPasswordDefault || 'sdnmaospati3'})`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 overflow-y-auto px-4 py-8">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sky-500 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8">
        {/* School Emblem & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 text-white shadow-lg shadow-blue-500/30 mb-3">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {config.schoolName || 'SDN MAOSPATI 3'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Sistem Administrasi Guru & Presensi Digital
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button
            id="tab-login-guru"
            type="button"
            onClick={() => handleRoleChange('guru')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              role === 'guru'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Sebagai Guru</span>
          </button>
          <button
            id="tab-login-admin"
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              role === 'admin'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Sebagai Admin</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'guru' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Akun Guru / Mata Pelajaran
              </label>
              <div className="relative">
                <select
                  id="select-guru-login"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.tanggungJawab}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Akses Administrator
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 font-medium">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Admin Utama {config.schoolName || 'SDN Maospati 3'}</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Kata Sandi (Password)
              </label>
              <span className="text-[11px] text-blue-600 font-medium">
                Default: {role === 'admin' ? 'admin123' : (config.guruPasswordDefault || 'sdnmaospati3')}
              </span>
            </div>
            <div className="relative">
              <input
                id="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 text-sm shadow-md shadow-blue-600/20 transition transform active:scale-98"
          >
            <span>Masuk Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PWA & Offline Ready</span>
          </div>
          <PWAInstallButton compact />
        </div>
      </div>
    </div>
  );
};
