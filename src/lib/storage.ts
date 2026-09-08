import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  SystemConfig,
  Teacher,
  Student,
  AttendanceRecord,
  GradeItem,
  TeachingJournal,
  StudentGuidance,
  CurrentUser,
  KelasType,
} from '../types';
import {
  DEFAULT_CONFIG,
  DEFAULT_TEACHERS,
  DEFAULT_STUDENTS,
  DEFAULT_ATTENDANCE,
  DEFAULT_GRADES,
  DEFAULT_JOURNALS,
  DEFAULT_GUIDANCE,
} from './initialData';

const CACHE_KEYS = {
  CONFIG: 'sdn_suratmajan_config',
  TEACHERS: 'sdn_suratmajan_teachers',
  STUDENTS: 'sdn_suratmajan_students',
  ATTENDANCE: 'sdn_suratmajan_attendance',
  GRADES: 'sdn_suratmajan_grades',
  JOURNALS: 'sdn_suratmajan_journals',
  GUIDANCE: 'sdn_suratmajan_guidance',
};

// Helper for local caching to minimize database reads
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// ---------------- CONFIG ----------------
export async function fetchSystemConfig(): Promise<SystemConfig> {
  const cached = getLocal<SystemConfig>(CACHE_KEYS.CONFIG, DEFAULT_CONFIG);
  if (cached.schoolName === 'SD NEGERI SURATMAJAN' || !cached.schoolName) {
    cached.schoolName = 'SDN MAOSPATI 3';
    if (cached.locationCity === 'Suratmajan') cached.locationCity = 'Maospati';
  }

  try {
    const ref = doc(db, 'config', 'system');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = { ...DEFAULT_CONFIG, ...snap.data(), id: 'system' } as SystemConfig;
      if (data.schoolName === 'SD NEGERI SURATMAJAN' || !data.schoolName) {
        data.schoolName = 'SDN MAOSPATI 3';
        if (data.locationCity === 'Suratmajan') data.locationCity = 'Maospati';
        if (data.schoolAddress && data.schoolAddress.includes('Suratmajan')) {
          data.schoolAddress = 'Jl. Raya Maospati No. 12, Kec. Maospati, Kab. Magetan, Jawa Timur';
        }
        await setDoc(ref, data, { merge: true });
      }
      setLocal(CACHE_KEYS.CONFIG, data);
      return data;
    } else {
      // Seed default
      await setDoc(ref, DEFAULT_CONFIG);
      setLocal(CACHE_KEYS.CONFIG, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.warn('Using cached config:', error);
    return cached;
  }
}

export async function updateSystemConfig(updated: Partial<SystemConfig>): Promise<SystemConfig> {
  const current = await fetchSystemConfig();
  const merged: SystemConfig = { ...current, ...updated, id: 'system' };
  try {
    const ref = doc(db, 'config', 'system');
    await setDoc(ref, merged, { merge: true });
    setLocal(CACHE_KEYS.CONFIG, merged);
    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/system');
  }
}

// ---------------- TEACHERS ----------------
export async function fetchTeachers(): Promise<Teacher[]> {
  const isExplicitlySeeded = localStorage.getItem('sdn_suratmajan_teachers_seeded');
  const cached = getLocal<Teacher[]>(CACHE_KEYS.TEACHERS, isExplicitlySeeded ? [] : DEFAULT_TEACHERS);

  try {
    const col = collection(db, 'teachers');
    const snap = await getDocs(col);
    if (!snap.empty) {
      const teachers = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Teacher));
      setLocal(CACHE_KEYS.TEACHERS, teachers);
      localStorage.setItem('sdn_suratmajan_teachers_seeded', 'true');
      return teachers;
    } else {
      if (isExplicitlySeeded) {
        // Explicitly cleared by user, do not automatically re-seed!
        setLocal(CACHE_KEYS.TEACHERS, []);
        return [];
      }
      // Seed initial teachers first time only
      for (const t of DEFAULT_TEACHERS) {
        await setDoc(doc(db, 'teachers', t.id), t);
      }
      localStorage.setItem('sdn_suratmajan_teachers_seeded', 'true');
      setLocal(CACHE_KEYS.TEACHERS, DEFAULT_TEACHERS);
      return DEFAULT_TEACHERS;
    }
  } catch (error) {
    console.warn('Using cached teachers:', error);
    return cached || [];
  }
}

export async function saveTeacher(teacher: Teacher): Promise<void> {
  try {
    await setDoc(doc(db, 'teachers', teacher.id), teacher, { merge: true });
    const teachers = getLocal<Teacher[]>(CACHE_KEYS.TEACHERS, DEFAULT_TEACHERS);
    const idx = teachers.findIndex((t) => t.id === teacher.id);
    if (idx >= 0) teachers[idx] = teacher;
    else teachers.push(teacher);
    setLocal(CACHE_KEYS.TEACHERS, teachers);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `teachers/${teacher.id}`);
  }
}

export async function deleteTeacher(teacherId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teachers', teacherId));
    const teachers = getLocal<Teacher[]>(CACHE_KEYS.TEACHERS, DEFAULT_TEACHERS).filter(
      (t) => t.id !== teacherId
    );
    setLocal(CACHE_KEYS.TEACHERS, teachers);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teachers/${teacherId}`);
  }
}

export async function clearAllTeachers(): Promise<void> {
  // Always update local cache immediately so the UI is instantaneous
  localStorage.setItem('sdn_suratmajan_teachers_seeded', 'true');
  setLocal(CACHE_KEYS.TEACHERS, []);

  try {
    const col = collection(db, 'teachers');
    const snap = await getDocs(col);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Firestore clearAllTeachers notice:', error);
  }
}

// ---------------- STUDENTS ----------------
export async function fetchStudents(user: CurrentUser): Promise<Student[]> {
  const isExplicitlySeeded = localStorage.getItem('sdn_suratmajan_students_seeded');
  const cached = getLocal<Student[]>(CACHE_KEYS.STUDENTS, isExplicitlySeeded ? [] : DEFAULT_STUDENTS);
  let allStudents: Student[] = cached;

  try {
    const col = collection(db, 'students');
    const snap = await getDocs(col);
    if (!snap.empty) {
      allStudents = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Student));
      setLocal(CACHE_KEYS.STUDENTS, allStudents);
      localStorage.setItem('sdn_suratmajan_students_seeded', 'true');
    } else {
      if (isExplicitlySeeded) {
        setLocal(CACHE_KEYS.STUDENTS, []);
        allStudents = [];
      } else {
        // Seed default students on first run
        for (const s of DEFAULT_STUDENTS) {
          await setDoc(doc(db, 'students', s.id), s);
        }
        localStorage.setItem('sdn_suratmajan_students_seeded', 'true');
        setLocal(CACHE_KEYS.STUDENTS, DEFAULT_STUDENTS);
        allStudents = DEFAULT_STUDENTS;
      }
    }
  } catch (error) {
    console.warn('Using cached students:', error);
  }

  // Authorization and Read-quota Optimization:
  // Admin: full access
  if (user.role === 'admin') {
    return allStudents;
  }

  // Guru:
  const resp = user.teacher?.tanggungJawab;
  // PAI & PJOK: access names of all students (karena mengajar semua kelas)
  if (resp === 'Pendidikan Agama Islam' || resp === 'PJOK') {
    return allStudents;
  }

  // Specific class teacher (Kelas 1 - 6): only access their assigned class!
  return allStudents.filter((s) => s.kelas === resp);
}

export async function saveStudent(student: Student): Promise<void> {
  try {
    await setDoc(doc(db, 'students', student.id), student, { merge: true });
    const students = getLocal<Student[]>(CACHE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const idx = students.findIndex((s) => s.id === student.id);
    if (idx >= 0) students[idx] = student;
    else students.push(student);
    setLocal(CACHE_KEYS.STUDENTS, students);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${student.id}`);
  }
}

export async function deleteStudent(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'students', studentId));
    const students = getLocal<Student[]>(CACHE_KEYS.STUDENTS, DEFAULT_STUDENTS).filter(
      (s) => s.id !== studentId
    );
    setLocal(CACHE_KEYS.STUDENTS, students);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
  }
}

export async function clearAllStudents(): Promise<void> {
  localStorage.setItem('sdn_suratmajan_students_seeded', 'true');
  setLocal(CACHE_KEYS.STUDENTS, []);

  try {
    const col = collection(db, 'students');
    const snap = await getDocs(col);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Firestore clearAllStudents notice:', error);
  }
}

// ---------------- ATTENDANCE ----------------
export async function fetchAttendance(
  user: CurrentUser,
  kelasFilter?: string,
  monthFilter?: string
): Promise<AttendanceRecord[]> {
  const cached = getLocal<AttendanceRecord[]>(CACHE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
  let allAttendance: AttendanceRecord[] = cached;

  try {
    const col = collection(db, 'attendance');
    const snap = await getDocs(col);
    if (!snap.empty) {
      allAttendance = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AttendanceRecord));
      setLocal(CACHE_KEYS.ATTENDANCE, allAttendance);
    } else {
      for (const a of DEFAULT_ATTENDANCE) {
        await setDoc(doc(db, 'attendance', a.id), a);
      }
      setLocal(CACHE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
      allAttendance = DEFAULT_ATTENDANCE;
    }
  } catch (error) {
    console.warn('Using cached attendance:', error);
  }

  // Authorization filter:
  if (user.role === 'guru') {
    const resp = user.teacher?.tanggungJawab;
    if (resp !== 'Pendidikan Agama Islam' && resp !== 'PJOK') {
      allAttendance = allAttendance.filter((a) => a.kelas === resp);
    }
  }

  if (kelasFilter) {
    allAttendance = allAttendance.filter((a) => a.kelas === kelasFilter);
  }
  if (monthFilter) {
    allAttendance = allAttendance.filter((a) => a.month === monthFilter);
  }

  return allAttendance;
}

export async function saveAttendance(record: AttendanceRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'attendance', record.id), record, { merge: true });
    const cached = getLocal<AttendanceRecord[]>(CACHE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    const idx = cached.findIndex((a) => a.id === record.id);
    if (idx >= 0) cached[idx] = record;
    else cached.push(record);
    setLocal(CACHE_KEYS.ATTENDANCE, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `attendance/${record.id}`);
  }
}

// ---------------- GRADES ----------------
export async function fetchGrades(user: CurrentUser, kelasFilter?: string): Promise<GradeItem[]> {
  const cached = getLocal<GradeItem[]>(CACHE_KEYS.GRADES, DEFAULT_GRADES);
  let allGrades: GradeItem[] = cached;

  try {
    const col = collection(db, 'grades');
    const snap = await getDocs(col);
    if (!snap.empty) {
      allGrades = snap.docs.map((d) => ({ ...d.data(), id: d.id } as GradeItem));
      setLocal(CACHE_KEYS.GRADES, allGrades);
    } else {
      for (const g of DEFAULT_GRADES) {
        await setDoc(doc(db, 'grades', g.id), g);
      }
      setLocal(CACHE_KEYS.GRADES, DEFAULT_GRADES);
      allGrades = DEFAULT_GRADES;
    }
  } catch (error) {
    console.warn('Using cached grades:', error);
  }

  if (user.role === 'guru') {
    const resp = user.teacher?.tanggungJawab;
    if (resp !== 'Pendidikan Agama Islam' && resp !== 'PJOK') {
      allGrades = allGrades.filter((g) => g.kelas === resp);
    }
  }

  if (kelasFilter) {
    allGrades = allGrades.filter((g) => g.kelas === kelasFilter);
  }

  return allGrades;
}

export async function saveGrade(grade: GradeItem): Promise<void> {
  try {
    await setDoc(doc(db, 'grades', grade.id), grade, { merge: true });
    const cached = getLocal<GradeItem[]>(CACHE_KEYS.GRADES, DEFAULT_GRADES);
    const idx = cached.findIndex((g) => g.id === grade.id);
    if (idx >= 0) cached[idx] = grade;
    else cached.push(grade);
    setLocal(CACHE_KEYS.GRADES, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `grades/${grade.id}`);
  }
}

export async function deleteGrade(gradeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'grades', gradeId));
    const cached = getLocal<GradeItem[]>(CACHE_KEYS.GRADES, DEFAULT_GRADES).filter(
      (g) => g.id !== gradeId
    );
    setLocal(CACHE_KEYS.GRADES, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `grades/${gradeId}`);
  }
}

// ---------------- JOURNALS ----------------
export async function fetchJournals(
  user: CurrentUser,
  kelasFilter?: string,
  monthFilter?: string
): Promise<TeachingJournal[]> {
  const cached = getLocal<TeachingJournal[]>(CACHE_KEYS.JOURNALS, DEFAULT_JOURNALS);
  let allJournals: TeachingJournal[] = cached;

  try {
    const col = collection(db, 'teaching_journals');
    const snap = await getDocs(col);
    if (!snap.empty) {
      allJournals = snap.docs.map((d) => ({ ...d.data(), id: d.id } as TeachingJournal));
      setLocal(CACHE_KEYS.JOURNALS, allJournals);
    } else {
      for (const j of DEFAULT_JOURNALS) {
        await setDoc(doc(db, 'teaching_journals', j.id), j);
      }
      setLocal(CACHE_KEYS.JOURNALS, DEFAULT_JOURNALS);
      allJournals = DEFAULT_JOURNALS;
    }
  } catch (error) {
    console.warn('Using cached journals:', error);
  }

  if (user.role === 'guru') {
    const resp = user.teacher?.tanggungJawab;
    if (resp !== 'Pendidikan Agama Islam' && resp !== 'PJOK') {
      allJournals = allJournals.filter((j) => j.kelas === resp);
    }
  }

  if (kelasFilter) {
    allJournals = allJournals.filter((j) => j.kelas === kelasFilter);
  }
  if (monthFilter) {
    allJournals = allJournals.filter((j) => j.month === monthFilter);
  }

  return allJournals;
}

export async function saveJournal(journal: TeachingJournal): Promise<void> {
  try {
    await setDoc(doc(db, 'teaching_journals', journal.id), journal, { merge: true });
    const cached = getLocal<TeachingJournal[]>(CACHE_KEYS.JOURNALS, DEFAULT_JOURNALS);
    const idx = cached.findIndex((j) => j.id === journal.id);
    if (idx >= 0) cached[idx] = journal;
    else cached.push(journal);
    setLocal(CACHE_KEYS.JOURNALS, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `teaching_journals/${journal.id}`);
  }
}

export async function deleteJournal(journalId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teaching_journals', journalId));
    const cached = getLocal<TeachingJournal[]>(CACHE_KEYS.JOURNALS, DEFAULT_JOURNALS).filter(
      (j) => j.id !== journalId
    );
    setLocal(CACHE_KEYS.JOURNALS, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teaching_journals/${journalId}`);
  }
}

// ---------------- GUIDANCE ----------------
export async function fetchGuidance(
  user: CurrentUser,
  kelasFilter?: string,
  semesterFilter?: '1' | '2'
): Promise<StudentGuidance[]> {
  const cached = getLocal<StudentGuidance[]>(CACHE_KEYS.GUIDANCE, DEFAULT_GUIDANCE);
  let allGuidance: StudentGuidance[] = cached;

  try {
    const col = collection(db, 'student_guidance');
    const snap = await getDocs(col);
    if (!snap.empty) {
      allGuidance = snap.docs.map((d) => ({ ...d.data(), id: d.id } as StudentGuidance));
      setLocal(CACHE_KEYS.GUIDANCE, allGuidance);
    } else {
      for (const g of DEFAULT_GUIDANCE) {
        await setDoc(doc(db, 'student_guidance', g.id), g);
      }
      setLocal(CACHE_KEYS.GUIDANCE, DEFAULT_GUIDANCE);
      allGuidance = DEFAULT_GUIDANCE;
    }
  } catch (error) {
    console.warn('Using cached guidance:', error);
  }

  if (user.role === 'guru') {
    const resp = user.teacher?.tanggungJawab;
    if (resp !== 'Pendidikan Agama Islam' && resp !== 'PJOK') {
      allGuidance = allGuidance.filter((g) => g.kelas === resp);
    }
  }

  if (kelasFilter) {
    allGuidance = allGuidance.filter((g) => g.kelas === kelasFilter);
  }
  if (semesterFilter) {
    allGuidance = allGuidance.filter((g) => g.semester === semesterFilter);
  }

  return allGuidance;
}

export async function saveGuidance(guidance: StudentGuidance): Promise<void> {
  try {
    await setDoc(doc(db, 'student_guidance', guidance.id), guidance, { merge: true });
    const cached = getLocal<StudentGuidance[]>(CACHE_KEYS.GUIDANCE, DEFAULT_GUIDANCE);
    const idx = cached.findIndex((g) => g.id === guidance.id);
    if (idx >= 0) cached[idx] = guidance;
    else cached.push(guidance);
    setLocal(CACHE_KEYS.GUIDANCE, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `student_guidance/${guidance.id}`);
  }
}

export async function deleteGuidance(guidanceId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'student_guidance', guidanceId));
    const cached = getLocal<StudentGuidance[]>(CACHE_KEYS.GUIDANCE, DEFAULT_GUIDANCE).filter(
      (g) => g.id !== guidanceId
    );
    setLocal(CACHE_KEYS.GUIDANCE, cached);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `student_guidance/${guidanceId}`);
  }
}

// ---------------- GURU DATA CLEAR (2-STEP CONFIRMATION) ----------------
// "Pada akun guru tambahkan tombol untuk menghapus semua data tersimpan,
// seperti absen, nilai, jurnal, bimbingan, konfirmasi 2 kali agar menghindari tidak sengaja terhapus"
export async function clearAllTeacherSavedData(kelas: string, teacherId?: string): Promise<void> {
  try {
    // 1. Attendance
    const attSnap = await getDocs(collection(db, 'attendance'));
    for (const d of attSnap.docs) {
      const data = d.data() as AttendanceRecord;
      if (data.kelas === kelas || (teacherId && data.teacherId === teacherId)) {
        await deleteDoc(d.ref);
      }
    }
    const filteredAtt = getLocal<AttendanceRecord[]>(CACHE_KEYS.ATTENDANCE, []).filter(
      (a) => a.kelas !== kelas && (!teacherId || a.teacherId !== teacherId)
    );
    setLocal(CACHE_KEYS.ATTENDANCE, filteredAtt);

    // 2. Grades
    const grSnap = await getDocs(collection(db, 'grades'));
    for (const d of grSnap.docs) {
      const data = d.data() as GradeItem;
      if (data.kelas === kelas || (teacherId && data.teacherId === teacherId)) {
        await deleteDoc(d.ref);
      }
    }
    const filteredGr = getLocal<GradeItem[]>(CACHE_KEYS.GRADES, []).filter(
      (g) => g.kelas !== kelas && (!teacherId || g.teacherId !== teacherId)
    );
    setLocal(CACHE_KEYS.GRADES, filteredGr);

    // 3. Journals
    const jSnap = await getDocs(collection(db, 'teaching_journals'));
    for (const d of jSnap.docs) {
      const data = d.data() as TeachingJournal;
      if (data.kelas === kelas || (teacherId && data.teacherId === teacherId)) {
        await deleteDoc(d.ref);
      }
    }
    const filteredJ = getLocal<TeachingJournal[]>(CACHE_KEYS.JOURNALS, []).filter(
      (j) => j.kelas !== kelas && (!teacherId || j.teacherId !== teacherId)
    );
    setLocal(CACHE_KEYS.JOURNALS, filteredJ);

    // 4. Guidance
    const bgSnap = await getDocs(collection(db, 'student_guidance'));
    for (const d of bgSnap.docs) {
      const data = d.data() as StudentGuidance;
      if (data.kelas === kelas || (teacherId && data.teacherId === teacherId)) {
        await deleteDoc(d.ref);
      }
    }
    const filteredBg = getLocal<StudentGuidance[]>(CACHE_KEYS.GUIDANCE, []).filter(
      (b) => b.kelas !== kelas && (!teacherId || b.teacherId !== teacherId)
    );
    setLocal(CACHE_KEYS.GUIDANCE, filteredBg);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `batch-clear/${kelas}`);
  }
}
