export type UserRole = 'admin' | 'guru';

export type TanggungJawab =
  | 'Kelas 1'
  | 'Kelas 2'
  | 'Kelas 3'
  | 'Kelas 4'
  | 'Kelas 5'
  | 'Kelas 6'
  | 'Pendidikan Agama Islam'
  | 'PJOK';

export const TANGGUNG_JAWAB_OPTIONS: TanggungJawab[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
  'Pendidikan Agama Islam',
  'PJOK',
];

export const KELAS_LIST = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
] as const;

export type KelasType = (typeof KELAS_LIST)[number];

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  role: UserRole;
  tanggungJawab: TanggungJawab;
  signatureUrl?: string;
  password?: string;
  phone?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  kelas: KelasType;
  isActive: boolean;
  createdAt?: string;
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface AttendanceRecord {
  id: string; // e.g., "Kelas 1_2026-09-08"
  kelas: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  semester: '1' | '2';
  teacherId: string;
  records: Record<string, AttendanceStatus>; // studentId -> 'H'|'S'|'I'|'A'
  notes?: string;
  updatedAt?: string;
}

export interface GradeItem {
  id: string;
  kelas: string;
  subject: string;
  chapter: string; // e.g. "Bab 1 - Bilangan Cacah"
  assessmentName: string; // e.g. "Penilaian Harian 1", "Penilaian Harian 2"
  semester: '1' | '2';
  teacherId: string;
  scores: Record<string, number>; // studentId -> score 0..100
  createdAt?: string;
}

export interface TeachingJournal {
  id: string;
  kelas: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  lessonHours: string; // e.g. "1 - 2"
  subject: string;
  topic: string; // Materi Pokok / Kegiatan
  reflection: string; // Refleksi / Hambatan
  createdAt?: string;
}

export interface StudentGuidance {
  id: string;
  kelas: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  semester: '1' | '2';
  issue: string; // Gejala / Permasalahan
  actionTaken: string; // Tindak Lanjut / Bimbingan
  result: string; // Perkembangan / Hasil
  notes?: string;
  createdAt?: string;
}

export interface SystemConfig {
  id: string;
  schoolName: string;
  schoolAddress: string;
  schoolLogoUrl: string;
  cityLogoUrl: string;
  locationCity: string; // e.g. "Suratmajan"
  principalName: string; // Kepala Satuan Pendidikan
  principalNip: string;
  principalSignatureUrl: string;
  academicYear: string; // e.g. "2026/2027"
  activeSemester: '1' | '2';
  adminPassword?: string;
  guruPasswordDefault?: string;
}

export interface CurrentUser {
  role: UserRole;
  teacher?: Teacher;
}

export type ActiveTab =
  | 'dashboard'
  | 'presensi'
  | 'nilai'
  | 'jurnal'
  | 'bimbingan'
  | 'siswa'
  | 'guru'
  | 'pengaturan'
  | 'cetak';
