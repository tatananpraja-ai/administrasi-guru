import React from 'react';
import { CurrentUser, SystemConfig, Student, Teacher, AttendanceRecord, TeachingJournal, StudentGuidance, GradeItem, ActiveTab } from '../types';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  HeartHandshake,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  School
} from 'lucide-react';

interface DashboardProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  journals: TeachingJournal[];
  guidance: StudentGuidance[];
  grades: GradeItem[];
  onNavigate: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  config,
  students,
  teachers,
  attendance,
  journals,
  guidance,
  grades,
  onNavigate,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const roleName = isAdmin ? 'Administrator' : currentUser.teacher?.name;
  const responsibility = isAdmin ? 'Seluruh Sistem Sekolah' : currentUser.teacher?.tanggungJawab;

  // Filter students based on role
  const relevantStudents = students.filter((s) => {
    if (isAdmin) return true;
    const resp = currentUser.teacher?.tanggungJawab;
    if (resp === 'Pendidikan Agama Islam' || resp === 'PJOK') return true;
    return s.kelas === resp;
  });

  // Calculate student counts per class
  const classBreakdown = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => ({
    name: k,
    count: students.filter((s) => s.kelas === k).length,
  }));

  // Today's attendance summary
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter((a) => {
    if (a.date !== today) return false;
    if (isAdmin) return true;
    const resp = currentUser.teacher?.tanggungJawab;
    if (resp === 'Pendidikan Agama Islam' || resp === 'PJOK') return true;
    return a.kelas === resp;
  });

  let todayH = 0;
  let todayS = 0;
  let todayI = 0;
  let todayA = 0;

  todayRecords.forEach((rec) => {
    Object.values(rec.records || {}).forEach((st) => {
      if (st === 'H') todayH++;
      else if (st === 'S') todayS++;
      else if (st === 'I') todayI++;
      else if (st === 'A') todayA++;
    });
  });

  const totalTodayAtt = todayH + todayS + todayI + todayA;
  const todayPercentage = totalTodayAtt > 0 ? Math.round((todayH / totalTodayAtt) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-sky-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-xs mb-3 border border-blue-400/20">
            <School className="w-3.5 h-3.5" />
            <span>{config.schoolName || 'SDN MAOSPATI 3'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {roleName}
          </h2>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            {isAdmin
              ? 'Anda memiliki hak akses penuh untuk mengelola data guru, siswa, konfigurasi tanda tangan, dan pengarsipan digital sekolah.'
              : `Penugasan aktif Anda: ${responsibility}. Akses data telah dioptimalkan khusus untuk kelas dan mata pelajaran binaan Anda.`}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              id="dash-btn-presensi"
              onClick={() => onNavigate('presensi')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-blue-900 shadow-sm hover:bg-blue-50 active:scale-95 transition"
            >
              <CalendarCheck className="w-4 h-4 text-blue-700" />
              <span>Input Presensi Hari Ini</span>
            </button>
            <button
              id="dash-btn-nilai"
              onClick={() => onNavigate('nilai')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700/60 border border-blue-400/30 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition"
            >
              <Award className="w-4 h-4 text-sky-300" />
              <span>Input Nilai Harian</span>
            </button>
            <button
              id="dash-btn-cetak"
              onClick={() => onNavigate('cetak')}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600/80 border border-sky-400/30 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 active:scale-95 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Menu Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden md:block">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Siswa Card */}
        <div
          onClick={() => onNavigate('siswa')}
          className="cursor-pointer group rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total Siswa' : 'Siswa Terdata'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {relevantStudents.length}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-medium">Aktif</span> di {isAdmin ? '6 Kelas' : responsibility}
          </p>
        </div>

        {/* Guru / Mapel Card */}
        <div
          onClick={() => onNavigate(isAdmin ? 'guru' : 'dashboard')}
          className={`group rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition ${
            isAdmin ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendidik & Mapel
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {teachers.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelas 1-6, PAI & PJOK
          </p>
        </div>

        {/* Presensi Card */}
        <div
          onClick={() => onNavigate('presensi')}
          className="cursor-pointer group rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kehadiran Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {todayH > 0 ? `${todayPercentage}%` : 'Belum Diisi'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            H: {todayH} | S: {todayS} | I: {todayI} | A: {todayA}
          </p>
        </div>

        {/* Jurnal Mengajar Card */}
        <div
          onClick={() => onNavigate('jurnal')}
          className="cursor-pointer group rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jurnal Mengajar
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {journals.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {guidance.length} Kasus Bimbingan Siswa
          </p>
        </div>
      </div>

      {/* Two Column Layout: Student Distribution & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Distribution / Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Distribution */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Distribusi Siswa per Kelas
                </h3>
                <p className="text-xs text-slate-500">
                  {config.schoolName || 'SDN Maospati 3'} Tahun Ajaran {config.academicYear || '2026/2027'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('siswa')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Kelola Siswa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {classBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Wali: {teachers.find((t) => t.tanggungJawab === item.name)?.name || '-'}
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Teaching Journals */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Jurnal Catatan Mengajar Terbaru
                </h3>
                <p className="text-xs text-slate-500">
                  Aktivitas pembelajaran yang baru saja didokumentasikan
                </p>
              </div>
              <button
                onClick={() => onNavigate('jurnal')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Lihat Semua Jurnal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {journals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada catatan jurnal mengajar.
              </p>
            ) : (
              <div className="space-y-3">
                {journals.slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        {j.subject} ({j.kelas})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {j.date} • Jam ke {j.lessonHours}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {j.topic}
                    </p>
                    {j.reflection && (
                      <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                        Refleksi: {j.reflection}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Info & Guidance */}
        <div className="space-y-6">
          {/* Institutional Info Card */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600" />
              <span>Data Satuan Pendidikan</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kepala Satuan Pendidikan</span>
                <span className="font-semibold text-slate-800">{config.principalName}</span>
                <span className="text-slate-500 block text-[11px]">NIP. {config.principalNip || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lokasi Tanda Tangan</span>
                <span className="font-semibold text-slate-800">{config.locationCity || 'Maospati'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Alamat Sekolah</span>
                <span className="text-slate-600 leading-relaxed block">{config.schoolAddress}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Tanda Tangan Digital</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  config.principalSignatureUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {config.principalSignatureUrl ? 'Tersedia (Otomatis Aktif)' : 'Manual (Kosongan)'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Guidance */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-500" />
                <span>Bimbingan Siswa</span>
              </h3>
              <button
                onClick={() => onNavigate('bimbingan')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Detail
              </button>
            </div>

            {guidance.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada catatan bimbingan.
              </p>
            ) : (
              <div className="space-y-2.5">
                {guidance.slice(0, 3).map((g) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 truncate">{g.studentName}</span>
                      <span className="text-[10px] text-slate-400">{g.date}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 text-[11px]">
                      {g.issue}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
