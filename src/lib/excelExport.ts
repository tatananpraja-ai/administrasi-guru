import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, GradeItem, TeachingJournal, StudentGuidance } from '../types';

// Helper to download workbook
function exportWorkbook(wb: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(wb, fileName);
}

// 1. Download Absen Harian 1 Bulan Excel
export function exportMonthlyAttendanceExcel({
  students,
  attendanceRecords,
  yearMonth,
  kelas,
  schoolName,
}: {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  yearMonth: string; // YYYY-MM
  kelas: string;
  schoolName: string;
}) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthTitle = `${monthNames[month - 1]} ${year}`;

  // Build headers
  const headers = ['No', 'NIS', 'Nama Siswa'];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month - 1, d);
    const dayOfWeek = dayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    headers.push(`${d}${isWeekend ? ' (Libur)' : ''}`);
  }
  headers.push('H', 'S', 'I', 'A', '% Hadir');

  // Map of date string -> AttendanceRecord
  const attMap: Record<string, Record<string, string>> = {};
  attendanceRecords.forEach((att) => {
    attMap[att.date] = att.records;
  });

  const rows: any[] = [];
  students.forEach((student, idx) => {
    let countH = 0;
    let countS = 0;
    let countI = 0;
    let countA = 0;
    let effectiveDays = 0;

    const row: any[] = [idx + 1, student.nis || '-', student.name];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend) {
        row.push('L'); // Libur
      } else {
        effectiveDays++;
        const dateStr = `${yearStr}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRecords = attMap[dateStr] || {};
        const status = dayRecords[student.id] || '-';
        row.push(status);

        if (status === 'H') countH++;
        else if (status === 'S') countS++;
        else if (status === 'I') countI++;
        else if (status === 'A') countA++;
      }
    }

    const pct = effectiveDays > 0 ? Math.round((countH / effectiveDays) * 100) : 0;
    row.push(countH, countS, countI, countA, `${pct}%`);
    rows.push(row);
  });

  const wsData = [
    [schoolName.toUpperCase()],
    [`DAFTAR HADIR SISWA - ${kelas.toUpperCase()}`],
    [`Bulan: ${monthTitle}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Presensi Bulanan');
  exportWorkbook(wb, `Presensi_${kelas.replace(/\s+/g, '_')}_${yearMonth}.xlsx`);
}

// 2. Download Rekap H S I A Semester 1 / 2 Excel
export function exportSemesterAttendanceExcel({
  students,
  attendanceRecords,
  semester,
  kelas,
  schoolName,
  academicYear,
}: {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  semester: '1' | '2';
  kelas: string;
  schoolName: string;
  academicYear: string;
}) {
  const headers = ['No', 'NIS', 'Nama Siswa', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Total Absen', '% Kehadiran'];
  const rows: any[] = [];

  students.forEach((student, idx) => {
    let countH = 0;
    let countS = 0;
    let countI = 0;
    let countA = 0;

    attendanceRecords.forEach((att) => {
      const status = att.records?.[student.id];
      if (status === 'H') countH++;
      else if (status === 'S') countS++;
      else if (status === 'I') countI++;
      else if (status === 'A') countA++;
    });

    const totalDays = countH + countS + countI + countA;
    const pct = totalDays > 0 ? Math.round((countH / totalDays) * 100) : 0;

    rows.push([
      idx + 1,
      student.nis || '-',
      student.name,
      countH,
      countS,
      countI,
      countA,
      countS + countI + countA,
      `${pct}%`,
    ]);
  });

  const wsData = [
    [schoolName.toUpperCase()],
    [`REKAPITULASI PRESENSI SISWA (H-S-I-A)`],
    [`Kelas: ${kelas} | Semester: ${semester} | Tahun Ajaran: ${academicYear}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap Semester ${semester}`);
  exportWorkbook(wb, `Rekap_Presensi_${kelas.replace(/\s+/g, '_')}_Sem${semester}.xlsx`);
}

// 3. Download Nilai Harian per Bab Excel (Tanpa Predikat & Tanpa Capaian Kompetensi)
export function exportGradesExcel({
  students,
  gradeItems,
  kelas,
  subject,
  schoolName,
  academicYear,
  semester,
}: {
  students: Student[];
  gradeItems: GradeItem[];
  kelas: string;
  subject?: string;
  schoolName: string;
  academicYear: string;
  semester: string;
}) {
  // Headers: No, NIS, Nama Siswa, [Column for each assessment], Rata-rata
  const headers = ['No', 'NIS', 'Nama Siswa'];
  gradeItems.forEach((g) => {
    headers.push(`${g.chapter} - ${g.assessmentName}`);
  });
  headers.push('Nilai Rata-rata');

  const rows: any[] = [];
  students.forEach((student, idx) => {
    const row: any[] = [idx + 1, student.nis || '-', student.name];
    let sum = 0;
    let count = 0;

    gradeItems.forEach((g) => {
      const score = g.scores?.[student.id];
      if (typeof score === 'number') {
        row.push(score);
        sum += score;
        count++;
      } else {
        row.push('-');
      }
    });

    const avg = count > 0 ? (sum / count).toFixed(1) : '-';
    row.push(avg);
    rows.push(row);
  });

  const wsData = [
    [schoolName.toUpperCase()],
    [`DAFTAR PENILAIAN HARIAN`],
    [`Kelas: ${kelas} | Mata Pelajaran: ${subject || 'Semua'} | Semester: ${semester} (${academicYear})`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nilai Harian');
  exportWorkbook(wb, `Nilai_${kelas.replace(/\s+/g, '_')}_${subject || 'Semua'}.xlsx`);
}

// 4. Download Jurnal Mengajar Excel
export function exportJournalsExcel({
  journals,
  kelas,
  teacherName,
  yearMonth,
  schoolName,
}: {
  journals: TeachingJournal[];
  kelas: string;
  teacherName: string;
  yearMonth?: string;
  schoolName: string;
}) {
  const headers = ['No', 'Tanggal', 'Jam Ke-', 'Mata Pelajaran', 'Materi Pokok / Kegiatan Pembelajaran', 'Refleksi / Hambatan'];
  const rows = journals.map((j, idx) => [
    idx + 1,
    j.date,
    j.lessonHours,
    j.subject,
    j.topic,
    j.reflection || '-',
  ]);

  const wsData = [
    [schoolName.toUpperCase()],
    [`JURNAL CATATAN MENGAJAR GURU`],
    [`Kelas: ${kelas} | Guru: ${teacherName} | Periode: ${yearMonth || 'Semua'}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Mengajar');
  exportWorkbook(wb, `Jurnal_Mengajar_${kelas.replace(/\s+/g, '_')}_${yearMonth || 'Rekap'}.xlsx`);
}

// 5. Download Bimbingan Siswa Excel
export function exportGuidanceExcel({
  guidanceList,
  kelas,
  semester,
  schoolName,
}: {
  guidanceList: StudentGuidance[];
  kelas: string;
  semester: string;
  schoolName: string;
}) {
  const headers = ['No', 'Tanggal', 'Nama Siswa', 'Permasalahan / Kasus', 'Tindak Lanjut / Bimbingan', 'Hasil / Perkembangan', 'Keterangan'];
  const rows = guidanceList.map((g, idx) => [
    idx + 1,
    g.date,
    g.studentName,
    g.issue,
    g.actionTaken,
    g.result,
    g.notes || '-',
  ]);

  const wsData = [
    [schoolName.toUpperCase()],
    [`BUKU CATATAN BIMBINGAN SISWA`],
    [`Kelas: ${kelas} | Semester: ${semester}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bimbingan Siswa');
  exportWorkbook(wb, `Bimbingan_Siswa_${kelas.replace(/\s+/g, '_')}_Sem${semester}.xlsx`);
}

// 6. Excel & CSV Templates for Bulk Teacher Upload (Per Kolom)
export function downloadTeacherExcelTemplate() {
  const headers = ['NIP', 'Nama Guru & Gelar', 'Tanggung Jawab', 'Password', 'Nomor Telepon'];
  const data = [
    headers,
    ['198504122010012015', 'Siti Rahayu, S.Pd.', 'Kelas 1', 'sdnsuratmajan2', '081234567890'],
    ['198708232014021008', 'Budi Santoso, S.Pd.', 'Kelas 2', 'sdnsuratmajan2', '081234567891'],
    ['198305142009031005', 'Dewi Lestari, S.Pd.', 'Kelas 3', 'sdnsuratmajan2', '081234567892'],
    ['198103192008012011', 'Ahmad Fauzi, S.Pd.', 'Kelas 4', 'sdnsuratmajan2', '081234567893'],
    ['198611052011012018', 'Sri Wahyuni, S.Pd.', 'Kelas 5', 'sdnsuratmajan2', '081234567894'],
    ['197902172005011009', 'Hendra Wijaya, S.Pd.', 'Kelas 6', 'sdnsuratmajan2', '081234567895'],
    ['198007122006041011', 'Ust. Mansur, S.Pd.I.', 'Pendidikan Agama Islam', 'sdnsuratmajan2', '081234567896'],
    ['198909202015031002', 'Eko Prasetyo, S.Pd.', 'PJOK', 'sdnsuratmajan2', '081234567897'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 24 }, // NIP
    { wch: 28 }, // Nama Guru
    { wch: 26 }, // Tanggung Jawab
    { wch: 20 }, // Password
    { wch: 20 }, // No Telepon
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
  exportWorkbook(wb, 'Template_Masal_Guru_Perkolom.xlsx');
}

export function downloadTeacherCsvTemplate() {
  // UTF-8 BOM (\uFEFF) ensures Excel splits columns properly
  const csvContent =
    '\uFEFFNIP,Nama,TanggungJawab,Password,Telepon\n' +
    '198504122010012015,Siti Rahayu S.Pd.,Kelas 1,sdnsuratmajan2,081234567890\n' +
    '198708232014021008,Budi Santoso S.Pd.,Kelas 2,sdnsuratmajan2,081234567891\n' +
    '198007122006041011,Ust. Mansur S.Pd.I.,Pendidikan Agama Islam,sdnsuratmajan2,081234567892\n' +
    '198909202015031002,Eko Prasetyo S.Pd.,PJOK,sdnsuratmajan2,081234567893\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_input_masal_guru.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 7. Excel & CSV Templates for Bulk Student Upload (Per Kolom)
export function downloadStudentExcelTemplate() {
  const headers = ['NIS', 'NISN', 'Nama Siswa', 'Jenis Kelamin (L/P)', 'Kelas'];
  const data = [
    headers,
    ['2401', '0151234501', 'Aditya Pratama', 'L', 'Kelas 1'],
    ['2402', '0151234502', 'Anisa Putri Maharani', 'P', 'Kelas 1'],
    ['2301', '0141234501', 'Bagus Setiawan', 'L', 'Kelas 2'],
    ['2302', '0141234502', 'Cantika Dewi', 'P', 'Kelas 2'],
    ['2201', '0131234501', 'Dimas Anggara', 'L', 'Kelas 3'],
    ['2101', '0121234501', 'Eka Nur Syamsi', 'P', 'Kelas 4'],
    ['2001', '0111234501', 'Fajar Ramadhan', 'L', 'Kelas 5'],
    ['1901', '0101234501', 'Gita Permata', 'P', 'Kelas 6'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, // NIS
    { wch: 16 }, // NISN
    { wch: 30 }, // Nama Siswa
    { wch: 22 }, // Jenis Kelamin
    { wch: 16 }, // Kelas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  exportWorkbook(wb, 'Template_Masal_Siswa_Perkolom.xlsx');
}

export function downloadStudentCsvTemplate() {
  // UTF-8 BOM (\uFEFF) ensures Excel splits columns properly
  const csvContent =
    '\uFEFFNIS,NISN,Nama,JenisKelamin,Kelas\n' +
    '2401,0151234501,Aditya Pratama,L,Kelas 1\n' +
    '2402,0151234502,Anisa Putri Maharani,P,Kelas 1\n' +
    '2301,0141234501,Eka Nur Syamsi,P,Kelas 2\n' +
    '2201,0131234501,Indah Kusuma,P,Kelas 3\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_input_masal_siswa.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 8. Universal Spreadsheet / CSV Parser (supports .xlsx, .xls, .csv per column)
export async function parseSpreadsheetFile(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  return rawRows.map((row) =>
    Array.isArray(row)
      ? row.map((cell) => (cell !== undefined && cell !== null ? String(cell).trim() : ''))
      : []
  ).filter((r) => r.some((cell) => cell.length > 0));
}

// Legacy CSV Parser fallback
export function parseCsvRows(csvText: string): string[][] {
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    // Detect if separator is semicolon or comma
    const separator = line.includes(';') && !line.includes(',') ? ';' : ',';
    const row: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === separator && !insideQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  });
}
