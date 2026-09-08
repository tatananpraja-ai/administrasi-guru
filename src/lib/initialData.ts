import { SystemConfig, Teacher, Student, AttendanceRecord, GradeItem, TeachingJournal, StudentGuidance } from '../types';

export const DEFAULT_CONFIG: SystemConfig = {
  id: 'system',
  schoolName: 'SDN MAOSPATI 3',
  schoolAddress: 'Jl. Raya Maospati No. 12, Kec. Maospati, Kab. Magetan, Jawa Timur',
  schoolLogoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
  cityLogoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&auto=format&fit=crop&q=80',
  locationCity: 'Maospati',
  principalName: 'Dra. Hj. Sri Mulyani, M.Pd.',
  principalNip: '196908151993032004',
  principalSignatureUrl: '',
  academicYear: '2026/2027',
  activeSemester: '1',
  adminPassword: 'admin123',
  guruPasswordDefault: 'sdnmaospati3',
};

export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'guru-1',
    nip: '198504122010012015',
    name: 'Siti Rahayu, S.Pd.',
    role: 'guru',
    tanggungJawab: 'Kelas 1',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-2',
    nip: '198708232014021008',
    name: 'Budi Santoso, S.Pd.',
    role: 'guru',
    tanggungJawab: 'Kelas 2',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-3',
    nip: '199003152019032009',
    name: 'Dewi Lestari, S.Pd.',
    role: 'guru',
    tanggungJawab: 'Kelas 3',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-4',
    nip: '198211042008011012',
    name: 'Ahmad Fauzi, S.Pd.',
    role: 'guru',
    tanggungJawab: 'Kelas 4',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-5',
    nip: '198402192009022004',
    name: 'Sri Wahyuni, S.Pd.',
    role: 'guru',
    tanggungJawab: 'Kelas 5',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-6',
    nip: '197805162005011003',
    name: 'Bambang Sutrisno, S.Pd.',
    role: 'guru',
    tanggungJawab: 'Kelas 6',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-pai',
    nip: '198007122006041011',
    name: 'Ust. Mansur, S.Pd.I.',
    role: 'guru',
    tanggungJawab: 'Pendidikan Agama Islam',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
  {
    id: 'guru-pjok',
    nip: '198909202015031002',
    name: 'Eko Prasetyo, S.Pd.',
    role: 'guru',
    tanggungJawab: 'PJOK',
    password: 'sdnmaospati3',
    signatureUrl: '',
  },
];

export const DEFAULT_STUDENTS: Student[] = [
  // Kelas 1
  { id: 's-k1-1', nis: '2401', nisn: '0151234501', name: 'Aditya Pratama', gender: 'L', kelas: 'Kelas 1', isActive: true },
  { id: 's-k1-2', nis: '2402', nisn: '0151234502', name: 'Anisa Putri Maharani', gender: 'P', kelas: 'Kelas 1', isActive: true },
  { id: 's-k1-3', nis: '2403', nisn: '0151234503', name: 'Bayu Arya Danendra', gender: 'L', kelas: 'Kelas 1', isActive: true },
  { id: 's-k1-4', nis: '2404', nisn: '0151234504', name: 'Citra Kirana Wulandari', gender: 'P', kelas: 'Kelas 1', isActive: true },
  { id: 's-k1-5', nis: '2405', nisn: '0151234505', name: 'Dimas Setiawan', gender: 'L', kelas: 'Kelas 1', isActive: true },

  // Kelas 2
  { id: 's-k2-1', nis: '2301', nisn: '0141234501', name: 'Eka Nur Syamsi', gender: 'P', kelas: 'Kelas 2', isActive: true },
  { id: 's-k2-2', nis: '2302', nisn: '0141234502', name: 'Fajar Hidayat', gender: 'L', kelas: 'Kelas 2', isActive: true },
  { id: 's-k2-3', nis: '2303', nisn: '0141234503', name: 'Gita Permata', gender: 'P', kelas: 'Kelas 2', isActive: true },
  { id: 's-k2-4', nis: '2304', nisn: '0141234504', name: 'Hafiz Al-Farizi', gender: 'L', kelas: 'Kelas 2', isActive: true },

  // Kelas 3
  { id: 's-k3-1', nis: '2201', nisn: '0131234501', name: 'Indah Kusuma', gender: 'P', kelas: 'Kelas 3', isActive: true },
  { id: 's-k3-2', nis: '2202', nisn: '0131234502', name: 'Joko Purnomo', gender: 'L', kelas: 'Kelas 3', isActive: true },
  { id: 's-k3-3', nis: '2203', nisn: '0131234503', name: 'Kirana Dewi', gender: 'P', kelas: 'Kelas 3', isActive: true },
  { id: 's-k3-4', nis: '2204', nisn: '0131234504', name: 'Lukman Hakim', gender: 'L', kelas: 'Kelas 3', isActive: true },

  // Kelas 4
  { id: 's-k4-1', nis: '2101', nisn: '0121234501', name: 'Muhammad Rizki', gender: 'L', kelas: 'Kelas 4', isActive: true },
  { id: 's-k4-2', nis: '2102', nisn: '0121234502', name: 'Nadia Safitri', gender: 'P', kelas: 'Kelas 4', isActive: true },
  { id: 's-k4-3', nis: '2103', nisn: '0121234503', name: 'Oki Kurniawan', gender: 'L', kelas: 'Kelas 4', isActive: true },
  { id: 's-k4-4', nis: '2104', nisn: '0121234504', name: 'Putri Ayu Wandira', gender: 'P', kelas: 'Kelas 4', isActive: true },

  // Kelas 5
  { id: 's-k5-1', nis: '2001', nisn: '0111234501', name: 'Qori Amalia', gender: 'P', kelas: 'Kelas 5', isActive: true },
  { id: 's-k5-2', nis: '2002', nisn: '0111234502', name: 'Rangga Wijaya', gender: 'L', kelas: 'Kelas 5', isActive: true },
  { id: 's-k5-3', nis: '2003', nisn: '0111234503', name: 'Salsabila Rahma', gender: 'P', kelas: 'Kelas 5', isActive: true },
  { id: 's-k5-4', nis: '2004', nisn: '0111234504', name: 'Tegar Pratama Putra', gender: 'L', kelas: 'Kelas 5', isActive: true },

  // Kelas 6
  { id: 's-k6-1', nis: '1901', nisn: '0101234501', name: 'Umar Bakri', gender: 'L', kelas: 'Kelas 6', isActive: true },
  { id: 's-k6-2', nis: '1902', nisn: '0101234502', name: 'Vina Panduwinata', gender: 'P', kelas: 'Kelas 6', isActive: true },
  { id: 's-k6-3', nis: '1903', nisn: '0101234503', name: 'Wahyu Ramadhan', gender: 'L', kelas: 'Kelas 6', isActive: true },
  { id: 's-k6-4', nis: '1904', nisn: '0101234504', name: 'Zahra Azzahra', gender: 'P', kelas: 'Kelas 6', isActive: true },
];

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_k1_2026-09-01',
    kelas: 'Kelas 1',
    date: '2026-09-01',
    month: '2026-09',
    semester: '1',
    teacherId: 'guru-1',
    records: {
      's-k1-1': 'H',
      's-k1-2': 'H',
      's-k1-3': 'S',
      's-k1-4': 'H',
      's-k1-5': 'H',
    },
    notes: 'Awal bulan kegiatan pembiasaan pagi',
  },
  {
    id: 'att_k1_2026-09-02',
    kelas: 'Kelas 1',
    date: '2026-09-02',
    month: '2026-09',
    semester: '1',
    teacherId: 'guru-1',
    records: {
      's-k1-1': 'H',
      's-k1-2': 'I',
      's-k1-3': 'H',
      's-k1-4': 'H',
      's-k1-5': 'H',
    },
  },
];

export const DEFAULT_GRADES: GradeItem[] = [
  {
    id: 'g-1',
    kelas: 'Kelas 1',
    subject: 'Matematika',
    chapter: 'Bab 1 - Bilangan Cacah',
    assessmentName: 'Penilaian Harian 1',
    semester: '1',
    teacherId: 'guru-1',
    scores: {
      's-k1-1': 88,
      's-k1-2': 92,
      's-k1-3': 78,
      's-k1-4': 85,
      's-k1-5': 90,
    },
  },
  {
    id: 'g-2',
    kelas: 'Kelas 1',
    subject: 'Matematika',
    chapter: 'Bab 1 - Bilangan Cacah',
    assessmentName: 'Penilaian Harian 2 (Pengukuran)',
    semester: '1',
    teacherId: 'guru-1',
    scores: {
      's-k1-1': 90,
      's-k1-2': 88,
      's-k1-3': 82,
      's-k1-4': 86,
      's-k1-5': 94,
    },
  },
  {
    id: 'g-3',
    kelas: 'Kelas 1',
    subject: 'Bahasa Indonesia',
    chapter: 'Bab 1 - Bunyi Apa?',
    assessmentName: 'Penilaian Harian 1',
    semester: '1',
    teacherId: 'guru-1',
    scores: {
      's-k1-1': 85,
      's-k1-2': 90,
      's-k1-3': 80,
      's-k1-4': 88,
      's-k1-5': 86,
    },
  },
];

export const DEFAULT_JOURNALS: TeachingJournal[] = [
  {
    id: 'j-1',
    kelas: 'Kelas 1',
    teacherId: 'guru-1',
    teacherName: 'Siti Rahayu, S.Pd.',
    date: '2026-09-01',
    month: '2026-09',
    lessonHours: '1 - 3',
    subject: 'Bahasa Indonesia',
    topic: 'Mengenal huruf vokal dan konsonan dengan kartu huruf bergambar',
    reflection: 'Sebagian besar siswa antusias dan sudah mampu membedakan bunyi konsonan.',
  },
  {
    id: 'j-2',
    kelas: 'Kelas 1',
    teacherId: 'guru-1',
    teacherName: 'Siti Rahayu, S.Pd.',
    date: '2026-09-02',
    month: '2026-09',
    lessonHours: '1 - 2',
    subject: 'Matematika',
    topic: 'Membilang benda konkret 1 sampai 10 di lingkungan sekitar kelas',
    reflection: 'Perlu bimbingan khusus untuk 1 siswa yang masih tertukar angka 6 dan 9.',
  },
];

export const DEFAULT_GUIDANCE: StudentGuidance[] = [
  {
    id: 'bg-1',
    kelas: 'Kelas 1',
    studentId: 's-k1-3',
    studentName: 'Bayu Arya Danendra',
    teacherId: 'guru-1',
    date: '2026-09-03',
    semester: '1',
    issue: 'Sering kurang fokus saat kegiatan literasi dan belum lancar memegang pensil.',
    actionTaken: 'Melatih motorik halus dengan plastisin dan pendampingan membaca berpasangan.',
    result: 'Menunjukkan peningkatan kemandirian dan cara memegang pensil sudah lebih rileks.',
    notes: 'Akan dievaluasi berkala bersama orang tua siswa.',
  },
];
