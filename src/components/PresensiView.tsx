import React, { useState, useMemo } from 'react';
import {
  CurrentUser,
  SystemConfig,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  KELAS_LIST,
  KelasType,
} from '../types';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Info,
  Save,
  CheckCheck
} from 'lucide-react';
import { exportMonthlyAttendanceExcel, exportSemesterAttendanceExcel } from '../lib/excelExport';

interface PresensiViewProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (record: AttendanceRecord) => Promise<void>;
  onOpenCetakModal: (type: 'monthly_attendance' | 'semester_attendance', kelas: string) => void;
}

export const PresensiView: React.FC<PresensiViewProps> = ({
  currentUser,
  config,
  students,
  attendanceRecords,
  onSaveAttendance,
  onOpenCetakModal,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const teacherResp = currentUser.teacher?.tanggungJawab;
  const isSpecialTeacher = teacherResp === 'Pendidikan Agama Islam' || teacherResp === 'PJOK';

  // Allowed classes
  const allowedClasses: KelasType[] = useMemo(() => {
    if (isAdmin || isSpecialTeacher) {
      return [...KELAS_LIST];
    }
    if (teacherResp && KELAS_LIST.includes(teacherResp as KelasType)) {
      return [teacherResp as KelasType];
    }
    return ['Kelas 1'];
  }, [isAdmin, isSpecialTeacher, teacherResp]);

  const [selectedClass, setSelectedClass] = useState<KelasType>(allowedClasses[0] || 'Kelas 1');

  // Date selection (default today YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Check if chosen date is Saturday or Sunday
  const dateObj = new Date(selectedDate);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Filter students for selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.kelas === selectedClass && s.isActive);
  }, [students, selectedClass]);

  // Current record for this class and date
  const currentRecordId = `att_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}`;
  const existingRecord = attendanceRecords.find((a) => a.kelas === selectedClass && a.date === selectedDate);

  const [dailyStatuses, setDailyStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [dailyNotes, setDailyNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Sync state when date or class changes
  React.useEffect(() => {
    if (existingRecord) {
      setDailyStatuses(existingRecord.records || {});
      setDailyNotes(existingRecord.notes || '');
    } else {
      // Default to empty or pre-fill
      setDailyStatuses({});
      setDailyNotes('');
    }
    setSaveMessage('');
  }, [selectedClass, selectedDate, existingRecord]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    if (isWeekend) return;
    setDailyStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSetAllPresent = () => {
    if (isWeekend) return;
    const next: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      next[s.id] = 'H';
    });
    setDailyStatuses(next);
  };

  const handleSave = async () => {
    if (isWeekend) return;
    setIsSaving(true);
    setSaveMessage('');

    const [year, month] = selectedDate.split('-');
    const record: AttendanceRecord = {
      id: currentRecordId,
      kelas: selectedClass,
      date: selectedDate,
      month: `${year}-${month}`,
      semester: config.activeSemester || '1',
      teacherId: currentUser.teacher?.id || 'admin',
      records: dailyStatuses,
      notes: dailyNotes,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveAttendance(record);
      setSaveMessage('Presensi berhasil disimpan ke database!');
      setTimeout(() => setSaveMessage(''), 3500);
    } catch (e) {
      console.error(e);
      setSaveMessage('Gagal menyimpan presensi. Silakan coba kembali.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick stats for the day
  const countH = classStudents.filter((s) => dailyStatuses[s.id] === 'H').length;
  const countS = classStudents.filter((s) => dailyStatuses[s.id] === 'S').length;
  const countI = classStudents.filter((s) => dailyStatuses[s.id] === 'I').length;
  const countA = classStudents.filter((s) => dailyStatuses[s.id] === 'A').length;

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Left: Class & Date Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Kelas
            </label>
            <select
              id="select-kelas-presensi"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as KelasType)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              disabled={allowedClasses.length === 1}
            >
              {allowedClasses.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tanggal Presensi
            </label>
            <div className="relative">
              <input
                id="input-tanggal-presensi"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-medium focus:outline-hidden ${
                  isWeekend
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-slate-300 bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right: Export & Cetak Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-cetak-absen-bulanan"
            onClick={() => onOpenCetakModal('monthly_attendance', selectedClass)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak Absen Bulanan</span>
          </button>
          <button
            id="btn-cetak-absen-semester"
            onClick={() => onOpenCetakModal('semester_attendance', selectedClass)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Cetak Rekap Semester</span>
          </button>
          <button
            id="btn-export-absen-excel"
            onClick={() => {
              const currentMonth = selectedDate.substring(0, 7);
              exportMonthlyAttendanceExcel({
                students: classStudents,
                attendanceRecords,
                yearMonth: currentMonth,
                kelas: selectedClass,
                schoolName: config.schoolName,
              });
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 text-xs shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* Weekend Alert Notice */}
      {isWeekend && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold block">
              Hari {dayOfWeek === 6 ? 'Sabtu' : 'Minggu'} adalah Hari Libur Sekolah
            </span>
            <p className="mt-0.5 text-rose-700">
              Sesuai ketentuan, kalender pada hari Sabtu dan Minggu tidak dapat diisi presensi kehadiran siswa.
              Silakan pilih hari Senin sampai Jumat untuk mengisi daftar hadir.
            </p>
          </div>
        </div>
      )}

      {/* Daily Attendance Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Presensi Harian — {selectedClass}
            </h3>
            <p className="text-xs text-slate-500">
              {new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(dateObj)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time counters */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                H: {countH}
              </span>
              <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                S: {countS}
              </span>
              <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                I: {countI}
              </span>
              <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                A: {countA}
              </span>
            </div>

            {!isWeekend && (
              <button
                id="btn-set-all-present"
                onClick={handleSetAllPresent}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 text-xs transition"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Semua Hadir (H)</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Attendance List */}
        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Belum ada siswa terdaftar di {selectedClass}. Buka menu Data Siswa untuk menambah siswa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-24">NIS</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4 w-16 text-center">L/P</th>
                  <th className="py-3 px-4 w-64 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {classStudents.map((student, idx) => {
                  const status = dailyStatuses[student.id];

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {student.nis || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            student.gender === 'L'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          {/* Hadir */}
                          <button
                            type="button"
                            disabled={isWeekend}
                            onClick={() => handleSetStatus(student.id, 'H')}
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition active:scale-95 ${
                              status === 'H'
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                            } ${isWeekend ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title="Hadir"
                          >
                            H
                          </button>

                          {/* Sakit */}
                          <button
                            type="button"
                            disabled={isWeekend}
                            onClick={() => handleSetStatus(student.id, 'S')}
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition active:scale-95 ${
                              status === 'S'
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800'
                            } ${isWeekend ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title="Sakit"
                          >
                            S
                          </button>

                          {/* Izin */}
                          <button
                            type="button"
                            disabled={isWeekend}
                            onClick={() => handleSetStatus(student.id, 'I')}
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition active:scale-95 ${
                              status === 'I'
                                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                            } ${isWeekend ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title="Izin"
                          >
                            I
                          </button>

                          {/* Alpa */}
                          <button
                            type="button"
                            disabled={isWeekend}
                            onClick={() => handleSetStatus(student.id, 'A')}
                            className={`w-9 h-8 rounded-lg font-bold text-xs transition active:scale-95 ${
                              status === 'A'
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                            } ${isWeekend ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title="Alpa (Tanpa Keterangan)"
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Notes & Save Button */}
        {!isWeekend && classStudents.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-lg">
              <input
                id="input-catatan-presensi"
                type="text"
                value={dailyNotes}
                onChange={(e) => setDailyNotes(e.target.value)}
                placeholder="Catatan hari ini (misal: cuaca hujan, kegiatan literasi)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {saveMessage}
                </span>
              )}
              <button
                id="btn-simpan-presensi"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-5 py-2.5 text-sm shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
