import React, { useState, useMemo } from 'react';
import {
  CurrentUser,
  SystemConfig,
  Student,
  AttendanceRecord,
  GradeItem,
  TeachingJournal,
  StudentGuidance,
  Teacher,
  KelasType,
  KELAS_LIST,
} from '../types';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Check,
  RotateCw,
  LayoutTemplate,
  Calendar,
  Layers,
  School,
  FileSignature
} from 'lucide-react';
import {
  exportMonthlyAttendanceExcel,
  exportSemesterAttendanceExcel,
  exportGradesExcel,
  exportJournalsExcel,
  exportGuidanceExcel,
} from '../lib/excelExport';

export type PrintDocType =
  | 'monthly_attendance'
  | 'semester_attendance'
  | 'grades'
  | 'journal'
  | 'guidance';

interface PrintDocumentProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  grades: GradeItem[];
  journals: TeachingJournal[];
  guidance: StudentGuidance[];
  initialDocType?: PrintDocType;
  initialClass?: string;
  initialMonth?: string;
  initialSemester?: '1' | '2';
  initialSubject?: string;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  currentUser,
  config,
  students,
  teachers,
  attendance,
  grades,
  journals,
  guidance,
  initialDocType = 'monthly_attendance',
  initialClass,
  initialMonth,
  initialSemester,
  initialSubject,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const teacherResp = currentUser.teacher?.tanggungJawab;
  const isSpecialTeacher = teacherResp === 'Pendidikan Agama Islam' || teacherResp === 'PJOK';

  const allowedClasses: KelasType[] = useMemo(() => {
    if (isAdmin || isSpecialTeacher) {
      return [...KELAS_LIST];
    }
    if (teacherResp && KELAS_LIST.includes(teacherResp as KelasType)) {
      return [teacherResp as KelasType];
    }
    return ['Kelas 1'];
  }, [isAdmin, isSpecialTeacher, teacherResp]);

  // Controls state
  const [docType, setDocType] = useState<PrintDocType>(initialDocType);
  const [selectedClass, setSelectedClass] = useState<KelasType>(
    (initialClass as KelasType) || allowedClasses[0] || 'Kelas 1'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || new Date().toISOString().substring(0, 7)
  );
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(
    initialSemester || config.activeSemester || '1'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || (teacherResp === 'Pendidikan Agama Islam' ? 'Pendidikan Agama Islam' : teacherResp === 'PJOK' ? 'PJOK' : 'Matematika')
  );

  // User preference: Paper Layout (Portrait / Landscape)
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>(
    initialDocType === 'monthly_attendance' || initialDocType === 'grades' ? 'landscape' : 'portrait'
  );

  // User preference: Auto Signature vs Manual (Kosongan)
  const [useAutoSignature, setUseAutoSignature] = useState<boolean>(true);

  // Filter students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.kelas === selectedClass && s.isActive);
  }, [students, selectedClass]);

  // Current Teacher for this class
  const classTeacher = useMemo(() => {
    if (currentUser.teacher && currentUser.role === 'guru') {
      return currentUser.teacher;
    }
    return (
      teachers.find((t) => t.tanggungJawab === selectedClass) || {
        id: 'guru-unknown',
        name: 'Wali Kelas ' + selectedClass,
        nip: '-',
        role: 'guru',
        tanggungJawab: selectedClass,
      }
    );
  }, [currentUser, teachers, selectedClass]);

  // Month breakdown calculation
  const [yearStr, monthStr] = selectedMonth.split('-');
  const yearNum = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const formattedMonthName = `${monthNames[monthNum - 1]} ${yearNum}`;

  // Print Date today
  const printDateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Handle Excel download for current view
  const handleDownloadExcel = () => {
    if (docType === 'monthly_attendance') {
      exportMonthlyAttendanceExcel({
        students: classStudents,
        attendanceRecords: attendance,
        yearMonth: selectedMonth,
        kelas: selectedClass,
        schoolName: config.schoolName,
      });
    } else if (docType === 'semester_attendance') {
      exportSemesterAttendanceExcel({
        students: classStudents,
        attendanceRecords: attendance,
        semester: selectedSemester,
        kelas: selectedClass,
        schoolName: config.schoolName,
        academicYear: config.academicYear,
      });
    } else if (docType === 'grades') {
      const classGrades = grades.filter((g) => g.kelas === selectedClass && g.subject === selectedSubject);
      exportGradesExcel({
        students: classStudents,
        gradeItems: classGrades,
        kelas: selectedClass,
        subject: selectedSubject,
        schoolName: config.schoolName,
        academicYear: config.academicYear,
        semester: selectedSemester,
      });
    } else if (docType === 'journal') {
      const filteredJ = journals.filter((j) => j.kelas === selectedClass && (selectedMonth ? j.month === selectedMonth : true));
      exportJournalsExcel({
        journals: filteredJ,
        kelas: selectedClass,
        teacherName: classTeacher.name,
        yearMonth: selectedMonth,
        schoolName: config.schoolName,
      });
    } else if (docType === 'guidance') {
      const filteredG = guidance.filter((g) => g.kelas === selectedClass && g.semester === selectedSemester);
      exportGuidanceExcel({
        guidanceList: filteredG,
        kelas: selectedClass,
        semester: selectedSemester,
        schoolName: config.schoolName,
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Dynamic Print CSS to enforce page layout orientation */}
      <style>{`
        @media print {
          @page {
            size: ${paperOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Control Configuration Bar (Hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pusat Cetak Dokumen Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Pengesahan Kepala Satuan Pendidikan dan Guru Kelas/Mata Pelajaran
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-trigger-print"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2.5 text-xs sm:text-sm shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              id="btn-print-download-excel"
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 text-xs sm:text-sm shadow-xs transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Format Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Document Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Jenis Dokumen
            </label>
            <select
              id="print-select-doc-type"
              value={docType}
              onChange={(e) => {
                const next = e.target.value as PrintDocType;
                setDocType(next);
                if (next === 'monthly_attendance' || next === 'grades') {
                  setPaperOrientation('landscape');
                } else {
                  setPaperOrientation('portrait');
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
            >
              <option value="monthly_attendance">Absen Harian 1 Bulan</option>
              <option value="semester_attendance">Rekap Absen Semester (H-S-I-A)</option>
              <option value="grades">Penilaian Harian Bab</option>
              <option value="journal">Jurnal Catatan Mengajar</option>
              <option value="guidance">Bimbingan Siswa</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Kelas
            </label>
            <select
              id="print-select-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as KelasType)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              disabled={allowedClasses.length === 1}
            >
              {allowedClasses.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Month (for Monthly attendance & Journal) */}
          {(docType === 'monthly_attendance' || docType === 'journal') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Pilih Bulan
              </label>
              <input
                id="print-select-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          )}

          {/* Semester (for Semester attendance, guidance, & grades) */}
          {(docType === 'semester_attendance' || docType === 'guidance' || docType === 'grades') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Pilih Semester
              </label>
              <select
                id="print-select-semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
          )}

          {/* Subject (for Grades) */}
          {docType === 'grades' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Mata Pelajaran
              </label>
              <input
                id="print-select-subject"
                type="text"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          )}

          {/* Layout Orientation (Portrait / Landscape) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Orientasi Kertas (PDF)
            </label>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaperOrientation('portrait')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  paperOrientation === 'portrait'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setPaperOrientation('landscape')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  paperOrientation === 'landscape'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Signature Type (Otomatis vs Manual) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Model Tanda Tangan
            </label>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setUseAutoSignature(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  useAutoSignature
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Otomatis (Scan)
              </button>
              <button
                type="button"
                onClick={() => setUseAutoSignature(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !useAutoSignature
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual (Kosong)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (WHAT GETS PRINTED) */}
      <div className="print-container bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-md text-slate-900 mx-auto max-w-6xl font-serif text-[13px] leading-relaxed">
        {/* KOP SURAT RESMI PEMERINTAH */}
        <div className="border-b-4 border-double border-black pb-3 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Pemda */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {config.cityLogoUrl ? (
                <img
                  src={config.cityLogoUrl}
                  alt="Logo Kabupaten"
                  className="max-h-20 max-w-20 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-sans text-center">
                  LOGO PEMKAB
                </div>
              )}
            </div>

            {/* Kop Center Text */}
            <div className="flex-1 text-center font-serif leading-tight">
              <h4 className="text-sm font-bold uppercase tracking-wide">
                PEMERINTAH KABUPATEN MAGETAN
              </h4>
              <h3 className="text-base font-bold uppercase tracking-wide">
                DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA
              </h3>
              <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase mt-0.5">
                {config.schoolName || 'SDN MAOSPATI 3'}
              </h2>
              <p className="text-xs font-sans text-slate-700 mt-1">
                {config.schoolAddress || 'Jl. Raya Maospati No. 12, Kec. Maospati, Kab. Magetan, Jawa Timur'}
              </p>
            </div>

            {/* Logo Tut Wuri / Logo Sekolah */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {config.schoolLogoUrl ? (
                <img
                  src={config.schoolLogoUrl}
                  alt="Logo Sekolah"
                  className="max-h-20 max-w-20 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-sans text-center">
                  LOGO SEKOLAH
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1. ABSEN HARIAN 1 BULAN */}
        {docType === 'monthly_attendance' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                DAFTAR HADIR SISWA
              </h3>
              <div className="flex justify-between items-center text-xs font-sans font-semibold mt-2 px-1">
                <span>Kelas: {selectedClass}</span>
                <span>Bulan: {formattedMonthName}</span>
                <span>Tahun Ajaran: {config.academicYear || '2026/2027'}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-black font-sans text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black">
                    <th className="border border-black py-2 px-1 w-7" rowSpan={2}>No</th>
                    <th className="border border-black py-2 px-2 text-left w-20" rowSpan={2}>NIS</th>
                    <th className="border border-black py-2 px-2 text-left min-w-36" rowSpan={2}>Nama Siswa</th>
                    <th className="border border-black py-1 px-1" colSpan={daysInMonth}>
                      Tanggal
                    </th>
                    <th className="border border-black py-1 px-1" colSpan={4}>
                      Jumlah
                    </th>
                    <th className="border border-black py-2 px-1 w-10" rowSpan={2}>%</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-black text-[10px]">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = i + 1;
                      const dateDay = new Date(yearNum, monthNum - 1, d);
                      const isWeekend = dateDay.getDay() === 0 || dateDay.getDay() === 6;
                      return (
                        <th
                          key={d}
                          className={`border border-black py-1 px-0.5 w-6 ${
                            isWeekend ? 'bg-red-200 text-red-700 font-bold' : ''
                          }`}
                        >
                          {d}
                        </th>
                      );
                    })}
                    <th className="border border-black py-1 px-1 w-6">H</th>
                    <th className="border border-black py-1 px-1 w-6">S</th>
                    <th className="border border-black py-1 px-1 w-6">I</th>
                    <th className="border border-black py-1 px-1 w-6">A</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student, idx) => {
                    let countH = 0;
                    let countS = 0;
                    let countI = 0;
                    let countA = 0;
                    let effectiveDays = 0;

                    return (
                      <tr key={student.id} className="border-b border-black">
                        <td className="border border-black py-1 px-1">{idx + 1}</td>
                        <td className="border border-black py-1 px-2 text-left font-mono text-[10px]">
                          {student.nis || '-'}
                        </td>
                        <td className="border border-black py-1 px-2 text-left font-medium">
                          {student.name}
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const d = i + 1;
                          const dateDay = new Date(yearNum, monthNum - 1, d);
                          const isWeekend = dateDay.getDay() === 0 || dateDay.getDay() === 6;

                          if (isWeekend) {
                            return (
                              <td
                                key={d}
                                className="border border-black py-1 px-0.5 bg-red-100 text-red-600 font-bold"
                              >
                                -
                              </td>
                            );
                          }

                          effectiveDays++;
                          const dateStr = `${yearStr}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const attRecord = attendance.find(
                            (a) => a.kelas === selectedClass && a.date === dateStr
                          );
                          const status = attRecord?.records?.[student.id] || '';

                          if (status === 'H') countH++;
                          else if (status === 'S') countS++;
                          else if (status === 'I') countI++;
                          else if (status === 'A') countA++;

                          return (
                            <td key={d} className="border border-black py-1 px-0.5 font-bold">
                              {status || '.'}
                            </td>
                          );
                        })}
                        <td className="border border-black py-1 px-1 font-bold">{countH}</td>
                        <td className="border border-black py-1 px-1">{countS || '-'}</td>
                        <td className="border border-black py-1 px-1">{countI || '-'}</td>
                        <td className="border border-black py-1 px-1">{countA || '-'}</td>
                        <td className="border border-black py-1 px-1 font-bold text-[10px]">
                          {effectiveDays > 0 ? Math.round((countH / effectiveDays) * 100) : 0}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] font-sans text-slate-500 mt-2 italic">
              * Kolom berwarna merah menandakan hari Sabtu dan Minggu (libur sekolah). Keterangan: H (Hadir), S (Sakit), I (Izin), A (Alpa).
            </p>
          </div>
        )}

        {/* 2. REKAP ABSEN SEMESTER 1 / 2 */}
        {docType === 'semester_attendance' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                REKAPITULASI PRESENSI KEHADIRAN SISWA
              </h3>
              <div className="flex justify-between items-center text-xs font-sans font-semibold mt-2 px-1">
                <span>Kelas: {selectedClass}</span>
                <span>Semester: {selectedSemester} ({selectedSemester === '1' ? 'Ganjil' : 'Genap'})</span>
                <span>Tahun Ajaran: {config.academicYear || '2026/2027'}</span>
              </div>
            </div>

            <table className="w-full text-center border-collapse border border-black font-sans text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-black">
                  <th className="border border-black py-2.5 px-2 w-10">No</th>
                  <th className="border border-black py-2.5 px-3 text-left w-24">NIS</th>
                  <th className="border border-black py-2.5 px-3 text-left">Nama Lengkap Siswa</th>
                  <th className="border border-black py-2.5 px-2 w-16">L/P</th>
                  <th className="border border-black py-2.5 px-2 w-20">Hadir (H)</th>
                  <th className="border border-black py-2.5 px-2 w-20">Sakit (S)</th>
                  <th className="border border-black py-2.5 px-2 w-20">Izin (I)</th>
                  <th className="border border-black py-2.5 px-2 w-20">Alpa (A)</th>
                  <th className="border border-black py-2.5 px-2 w-24">Total Absen</th>
                  <th className="border border-black py-2.5 px-2 w-24">% Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student, idx) => {
                  let countH = 0;
                  let countS = 0;
                  let countI = 0;
                  let countA = 0;

                  attendance
                    .filter((a) => a.kelas === selectedClass && a.semester === selectedSemester)
                    .forEach((a) => {
                      const st = a.records?.[student.id];
                      if (st === 'H') countH++;
                      else if (st === 'S') countS++;
                      else if (st === 'I') countI++;
                      else if (st === 'A') countA++;
                    });

                  const totalDays = countH + countS + countI + countA;
                  const pct = totalDays > 0 ? Math.round((countH / totalDays) * 100) : 100;

                  return (
                    <tr key={student.id} className="border-b border-black">
                      <td className="border border-black py-2 px-2">{idx + 1}</td>
                      <td className="border border-black py-2 px-3 text-left font-mono">{student.nis || '-'}</td>
                      <td className="border border-black py-2 px-3 text-left font-semibold">{student.name}</td>
                      <td className="border border-black py-2 px-2">{student.gender}</td>
                      <td className="border border-black py-2 px-2 font-bold">{countH}</td>
                      <td className="border border-black py-2 px-2">{countS}</td>
                      <td className="border border-black py-2 px-2">{countI}</td>
                      <td className="border border-black py-2 px-2">{countA}</td>
                      <td className="border border-black py-2 px-2 font-semibold text-rose-700">{countS + countI + countA}</td>
                      <td className="border border-black py-2 px-2 font-bold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. PENILAIAN HARIAN TIAP BAB (TANPA PREDIKAT & TANPA CAPAIAN) */}
        {docType === 'grades' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                DAFTAR PENILAIAN HARIAN PESERTA DIDIK
              </h3>
              <div className="flex justify-between items-center text-xs font-sans font-semibold mt-2 px-1">
                <span>Kelas: {selectedClass}</span>
                <span>Mata Pelajaran: {selectedSubject}</span>
                <span>Semester: {selectedSemester} ({config.academicYear})</span>
              </div>
            </div>

            {(() => {
              const classGrades = grades.filter(
                (g) => g.kelas === selectedClass && g.subject === selectedSubject
              );

              if (classGrades.length === 0) {
                return (
                  <p className="text-center py-8 font-sans text-slate-500">
                    Belum ada data penilaian harian untuk {selectedSubject} di {selectedClass}.
                  </p>
                );
              }

              return (
                <table className="w-full text-center border-collapse border border-black font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black">
                      <th className="border border-black py-2.5 px-2 w-10">No</th>
                      <th className="border border-black py-2.5 px-3 text-left w-24">NIS</th>
                      <th className="border border-black py-2.5 px-3 text-left">Nama Siswa</th>
                      {classGrades.map((g) => (
                        <th key={g.id} className="border border-black py-2 px-2 min-w-24">
                          <div className="text-[11px] font-bold">{g.chapter}</div>
                          <div className="text-[10px] text-slate-600 font-normal">{g.assessmentName}</div>
                        </th>
                      ))}
                      <th className="border border-black py-2.5 px-2 w-24 font-bold bg-slate-200">
                        Nilai Rata-rata
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, idx) => {
                      let sum = 0;
                      let count = 0;

                      return (
                        <tr key={student.id} className="border-b border-black">
                          <td className="border border-black py-2 px-2">{idx + 1}</td>
                          <td className="border border-black py-2 px-3 text-left font-mono">{student.nis || '-'}</td>
                          <td className="border border-black py-2 px-3 text-left font-semibold">{student.name}</td>
                          {classGrades.map((g) => {
                            const score = g.scores?.[student.id];
                            if (typeof score === 'number') {
                              sum += score;
                              count++;
                            }
                            return (
                              <td key={g.id} className="border border-black py-2 px-2 font-bold">
                                {typeof score === 'number' ? score : '-'}
                              </td>
                            );
                          })}
                          <td className="border border-black py-2 px-2 font-bold bg-slate-50">
                            {count > 0 ? (sum / count).toFixed(1) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {/* 4. JURNAL MENGAJAR BULAN TERTENTU */}
        {docType === 'journal' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                JURNAL CATATAN MENGAJAR GURU
              </h3>
              <div className="flex justify-between items-center text-xs font-sans font-semibold mt-2 px-1">
                <span>Kelas: {selectedClass}</span>
                <span>Guru: {classTeacher.name}</span>
                <span>Periode Bulan: {formattedMonthName}</span>
              </div>
            </div>

            {(() => {
              const filteredJ = journals
                .filter((j) => j.kelas === selectedClass && j.month === selectedMonth)
                .sort((a, b) => (a.date < b.date ? -1 : 1));

              if (filteredJ.length === 0) {
                return (
                  <p className="text-center py-8 font-sans text-slate-500">
                    Tidak ada catatan jurnal mengajar pada bulan {formattedMonthName}.
                  </p>
                );
              }

              return (
                <table className="w-full text-left border-collapse border border-black font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-center">
                      <th className="border border-black py-2 px-2 w-10">No</th>
                      <th className="border border-black py-2 px-3 w-28">Tanggal</th>
                      <th className="border border-black py-2 px-2 w-20">Jam Ke</th>
                      <th className="border border-black py-2 px-3 w-40">Mata Pelajaran</th>
                      <th className="border border-black py-2 px-3">Materi Pokok / Kegiatan Pembelajaran</th>
                      <th className="border border-black py-2 px-3">Refleksi / Hambatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJ.map((j, idx) => (
                      <tr key={j.id} className="border-b border-black">
                        <td className="border border-black py-2 px-2 text-center">{idx + 1}</td>
                        <td className="border border-black py-2 px-3 font-semibold whitespace-nowrap">{j.date}</td>
                        <td className="border border-black py-2 px-2 text-center">{j.lessonHours}</td>
                        <td className="border border-black py-2 px-3 font-medium">{j.subject}</td>
                        <td className="border border-black py-2 px-3">{j.topic}</td>
                        <td className="border border-black py-2 px-3 italic">{j.reflection || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {/* 5. BIMBINGAN SISWA SEMESTER 1 / 2 */}
        {docType === 'guidance' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                BUKU CATATAN BIMBINGAN SISWA
              </h3>
              <div className="flex justify-between items-center text-xs font-sans font-semibold mt-2 px-1">
                <span>Kelas: {selectedClass}</span>
                <span>Semester: {selectedSemester} ({selectedSemester === '1' ? 'Ganjil' : 'Genap'})</span>
                <span>Tahun Pelajaran: {config.academicYear || '2026/2027'}</span>
              </div>
            </div>

            {(() => {
              const filteredG = guidance
                .filter((g) => g.kelas === selectedClass && g.semester === selectedSemester)
                .sort((a, b) => (a.date < b.date ? -1 : 1));

              if (filteredG.length === 0) {
                return (
                  <p className="text-center py-8 font-sans text-slate-500">
                    Tidak ada catatan bimbingan siswa pada Semester {selectedSemester}.
                  </p>
                );
              }

              return (
                <table className="w-full text-left border-collapse border border-black font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-center">
                      <th className="border border-black py-2 px-2 w-10">No</th>
                      <th className="border border-black py-2 px-3 w-28">Tanggal</th>
                      <th className="border border-black py-2 px-3 w-44">Nama Siswa</th>
                      <th className="border border-black py-2 px-3">Gejala / Permasalahan</th>
                      <th className="border border-black py-2 px-3">Tindak Lanjut / Bimbingan</th>
                      <th className="border border-black py-2 px-3">Hasil / Perkembangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredG.map((g, idx) => (
                      <tr key={g.id} className="border-b border-black">
                        <td className="border border-black py-2 px-2 text-center">{idx + 1}</td>
                        <td className="border border-black py-2 px-3 font-semibold whitespace-nowrap">{g.date}</td>
                        <td className="border border-black py-2 px-3 font-bold">{g.studentName}</td>
                        <td className="border border-black py-2 px-3">{g.issue}</td>
                        <td className="border border-black py-2 px-3">{g.actionTaken}</td>
                        <td className="border border-black py-2 px-3">{g.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {/* TANDA TANGAN RESMI (KEPALA SATUAN PENDIDIKAN & GURU) */}
        {/* "Penyebutan kepala sekolah menjadi kepala satuan pendidikan."
            "Ketika mencetak berikan pilihan untuk tanda tangan otomatis, atau tanda tangan manual (kosongan)"
            "tentukan tempat lokasi tanda tangan (misal : Suratmajan)" */}
        <div className="mt-10 pt-4 font-sans text-xs grid grid-cols-2 gap-8 break-inside-avoid">
          {/* Kolom Kiri: Mengetahui Kepala Satuan Pendidikan */}
          <div className="text-center">
            <p className="text-slate-600 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-900 uppercase">
              Kepala Satuan Pendidikan
            </p>
            <p className="font-bold text-slate-900 uppercase">
              {config.schoolName || 'SDN MAOSPATI 3'}
            </p>

            {/* Signature Area */}
            <div className="h-24 my-2 flex items-center justify-center">
              {useAutoSignature && config.principalSignatureUrl ? (
                <img
                  src={config.principalSignatureUrl}
                  alt="Tanda Tangan Kepala Satuan Pendidikan"
                  className="max-h-24 max-w-44 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-48 h-full border-b border-dotted border-black/30 flex items-end justify-center pb-1 text-[10px] text-slate-400 italic">
                  ( Tanda Tangan Manual )
                </div>
              )}
            </div>

            <p className="font-bold text-slate-900 underline text-sm">
              {config.principalName || 'Dra. Hj. Sri Mulyani, M.Pd.'}
            </p>
            <p className="text-slate-700">
              NIP. {config.principalNip || '-'}
            </p>
          </div>

          {/* Kolom Kanan: Guru Kelas / Mata Pelajaran */}
          <div className="text-center">
            <p className="text-slate-700 mb-1">
              {config.locationCity || 'Maospati'}, {printDateStr}
            </p>
            <p className="font-bold text-slate-900 uppercase">
              {classTeacher.tanggungJawab === 'Pendidikan Agama Islam'
                ? 'Guru Pendidikan Agama Islam'
                : classTeacher.tanggungJawab === 'PJOK'
                ? 'Guru PJOK'
                : `Guru Kelas ${selectedClass.replace('Kelas ', '')}`}
            </p>
            <p className="font-bold text-slate-900 uppercase opacity-0">
              {config.schoolName || 'SDN MAOSPATI 3'}
            </p>

            {/* Signature Area */}
            <div className="h-24 my-2 flex items-center justify-center">
              {useAutoSignature && classTeacher.signatureUrl ? (
                <img
                  src={classTeacher.signatureUrl}
                  alt="Tanda Tangan Guru"
                  className="max-h-24 max-w-44 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-48 h-full border-b border-dotted border-black/30 flex items-end justify-center pb-1 text-[10px] text-slate-400 italic">
                  ( Tanda Tangan Manual )
                </div>
              )}
            </div>

            <p className="font-bold text-slate-900 underline text-sm">
              {classTeacher.name}
            </p>
            <p className="text-slate-700">
              NIP. {classTeacher.nip || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
