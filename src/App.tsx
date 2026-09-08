import React, { useState, useEffect, useCallback } from 'react';
import {
  CurrentUser,
  SystemConfig,
  Teacher,
  Student,
  AttendanceRecord,
  GradeItem,
  TeachingJournal,
  StudentGuidance,
  ActiveTab,
} from './types';
import {
  fetchSystemConfig,
  updateSystemConfig,
  fetchTeachers,
  saveTeacher,
  deleteTeacher,
  clearAllTeachers,
  fetchStudents,
  saveStudent,
  deleteStudent,
  clearAllStudents,
  fetchAttendance,
  saveAttendance,
  fetchGrades,
  saveGrade,
  deleteGrade,
  fetchJournals,
  saveJournal,
  deleteJournal,
  fetchGuidance,
  saveGuidance,
  deleteGuidance,
  clearAllTeacherSavedData,
} from './lib/storage';
import { DEFAULT_CONFIG, DEFAULT_TEACHERS, DEFAULT_STUDENTS } from './lib/initialData';

import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { PresensiView } from './components/PresensiView';
import { NilaiView } from './components/NilaiView';
import { JurnalView } from './components/JurnalView';
import { BimbinganView } from './components/BimbinganView';
import { DataSiswaView } from './components/DataSiswaView';
import { DataGuruView } from './components/DataGuruView';
import { PengaturanView } from './components/PengaturanView';
import { PrintDocument, PrintDocType } from './components/PrintDocument';
import { OfflineIndicator } from './components/OfflineIndicator';

const USER_SESSION_KEY = 'sdn_suratmajan_active_user';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_SESSION_KEY);
      return saved ? (JSON.parse(saved) as CurrentUser) : null;
    } catch {
      return null;
    }
  });

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App Data State
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [teachers, setTeachers] = useState<Teacher[]>(DEFAULT_TEACHERS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [guidance, setGuidance] = useState<StudentGuidance[]>([]);
  const [loading, setLoading] = useState(true);

  // Print context handover (when clicking "Cetak..." from another view)
  const [printContext, setPrintContext] = useState<{
    docType: PrintDocType;
    kelas?: string;
    month?: string;
    semester?: '1' | '2';
    subject?: string;
  }>({
    docType: 'monthly_attendance',
  });

  // Load initial global config & teachers for login
  useEffect(() => {
    const loadInitialMeta = async () => {
      try {
        const [loadedConfig, loadedTeachers] = await Promise.all([
          fetchSystemConfig(),
          fetchTeachers(),
        ]);
        setConfig(loadedConfig);
        setTeachers(loadedTeachers);
      } catch (err) {
        console.warn('Initial metadata load notice:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialMeta();
  }, []);

  // Synchronize dynamic browser tab title with configured school name
  useEffect(() => {
    if (config?.schoolName) {
      document.title = `Administrasi Guru - ${config.schoolName}`;
    }
  }, [config?.schoolName]);

  // Reload role-authorized data whenever user logs in or changes
  const reloadUserData = useCallback(async (user: CurrentUser) => {
    setLoading(true);
    try {
      const [
        loadedStudents,
        loadedAttendance,
        loadedGrades,
        loadedJournals,
        loadedGuidance,
        loadedTeachers,
        loadedConfig,
      ] = await Promise.all([
        fetchStudents(user),
        fetchAttendance(user),
        fetchGrades(user),
        fetchJournals(user),
        fetchGuidance(user),
        fetchTeachers(),
        fetchSystemConfig(),
      ]);

      setStudents(loadedStudents);
      setAttendance(loadedAttendance);
      setGrades(loadedGrades);
      setJournals(loadedJournals);
      setGuidance(loadedGuidance);
      setTeachers(loadedTeachers);
      setConfig(loadedConfig);
    } catch (err) {
      console.warn('User data load notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      reloadUserData(currentUser);
    }
  }, [currentUser, reloadUserData]);

  // Auth Handlers
  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  // Data mutation handlers
  const handleSaveAttendance = async (record: AttendanceRecord) => {
    await saveAttendance(record);
    if (currentUser) {
      const updated = await fetchAttendance(currentUser);
      setAttendance(updated);
    }
  };

  const handleSaveGrade = async (grade: GradeItem) => {
    await saveGrade(grade);
    if (currentUser) {
      const updated = await fetchGrades(currentUser);
      setGrades(updated);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    await deleteGrade(gradeId);
    if (currentUser) {
      const updated = await fetchGrades(currentUser);
      setGrades(updated);
    }
  };

  const handleSaveJournal = async (journal: TeachingJournal) => {
    await saveJournal(journal);
    if (currentUser) {
      const updated = await fetchJournals(currentUser);
      setJournals(updated);
    }
  };

  const handleDeleteJournal = async (journalId: string) => {
    await deleteJournal(journalId);
    if (currentUser) {
      const updated = await fetchJournals(currentUser);
      setJournals(updated);
    }
  };

  const handleSaveGuidance = async (guidanceItem: StudentGuidance) => {
    await saveGuidance(guidanceItem);
    if (currentUser) {
      const updated = await fetchGuidance(currentUser);
      setGuidance(updated);
    }
  };

  const handleDeleteGuidance = async (guidanceId: string) => {
    await deleteGuidance(guidanceId);
    if (currentUser) {
      const updated = await fetchGuidance(currentUser);
      setGuidance(updated);
    }
  };

  const handleSaveStudent = async (student: Student) => {
    await saveStudent(student);
    if (currentUser) {
      const updated = await fetchStudents(currentUser);
      setStudents(updated);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    if (currentUser) {
      const updated = await fetchStudents(currentUser);
      setStudents(updated);
    }
  };

  const handleClearAllStudents = async () => {
    await clearAllStudents();
    setStudents([]);
  };

  const handleSaveTeacher = async (teacher: Teacher) => {
    await saveTeacher(teacher);
    const updated = await fetchTeachers();
    setTeachers(updated);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    await deleteTeacher(teacherId);
    const updated = await fetchTeachers();
    setTeachers(updated);
  };

  const handleClearAllTeachers = async () => {
    await clearAllTeachers();
    setTeachers([]);
  };

  const handleUpdateConfig = async (updated: Partial<SystemConfig>) => {
    const res = await updateSystemConfig(updated);
    if (res) {
      setConfig(res);
    }
    return res;
  };

  const handleUpdateTeacherSignature = async (sigUrl: string) => {
    if (!currentUser?.teacher) return;
    const updatedTeacher: Teacher = {
      ...currentUser.teacher,
      signatureUrl: sigUrl,
    };
    await saveTeacher(updatedTeacher);
    setCurrentUser({
      ...currentUser,
      teacher: updatedTeacher,
    });
    const updatedTeachers = await fetchTeachers();
    setTeachers(updatedTeachers);
  };

  const handleClearTeacherData = async (kelas: string, teacherId?: string) => {
    await clearAllTeacherSavedData(kelas, teacherId);
    if (currentUser) {
      await reloadUserData(currentUser);
    }
  };

  // Quick handover to Cetak tab
  const handleOpenCetakModal = (
    type: 'monthly_attendance' | 'semester_attendance' | 'grades' | 'journal' | 'guidance',
    kelas?: string,
    param3?: string,
    param4?: string
  ) => {
    if (type === 'monthly_attendance') {
      setPrintContext({
        docType: 'monthly_attendance',
        kelas,
        month: param3,
      });
    } else if (type === 'semester_attendance') {
      setPrintContext({
        docType: 'semester_attendance',
        kelas,
        semester: param3 as '1' | '2',
      });
    } else if (type === 'grades') {
      setPrintContext({
        docType: 'grades',
        kelas,
        subject: param3,
        semester: param4 as '1' | '2',
      });
    } else if (type === 'journal') {
      setPrintContext({
        docType: 'journal',
        kelas,
        month: param3,
      });
    } else if (type === 'guidance') {
      setPrintContext({
        docType: 'guidance',
        kelas,
        semester: param3 as '1' | '2',
      });
    }
    setActiveTab('cetak');
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900">
        <OfflineIndicator />
        <LoginPage
          teachers={teachers}
          config={config}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Offline status notification banner */}
      <OfflineIndicator />

      {/* Sidepanel Navigation (Fixed on scroll) */}
      <Sidebar
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        config={config}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Top Navigation Bar */}
        <Navbar
          currentTab={activeTab}
          currentUser={currentUser}
          config={config}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        {/* View Routing Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              config={config}
              students={students}
              teachers={teachers}
              attendance={attendance}
              journals={journals}
              guidance={guidance}
              grades={grades}
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeTab === 'presensi' && (
            <PresensiView
              currentUser={currentUser}
              config={config}
              students={students}
              attendanceList={attendance}
              onSaveAttendance={handleSaveAttendance}
              onOpenCetakModal={handleOpenCetakModal}
            />
          )}

          {activeTab === 'nilai' && (
            <NilaiView
              currentUser={currentUser}
              config={config}
              students={students}
              grades={grades}
              onSaveGrade={handleSaveGrade}
              onDeleteGrade={handleDeleteGrade}
              onOpenCetakModal={handleOpenCetakModal}
            />
          )}

          {activeTab === 'jurnal' && (
            <JurnalView
              currentUser={currentUser}
              config={config}
              journals={journals}
              onSaveJournal={handleSaveJournal}
              onDeleteJournal={handleDeleteJournal}
              onOpenCetakModal={handleOpenCetakModal}
            />
          )}

          {activeTab === 'bimbingan' && (
            <BimbinganView
              currentUser={currentUser}
              config={config}
              students={students}
              guidanceList={guidance}
              onSaveGuidance={handleSaveGuidance}
              onDeleteGuidance={handleDeleteGuidance}
              onOpenCetakModal={handleOpenCetakModal}
            />
          )}

          {activeTab === 'siswa' && (
            <DataSiswaView
              currentUser={currentUser}
              config={config}
              students={students}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onClearAllStudents={handleClearAllStudents}
            />
          )}

          {activeTab === 'guru' && currentUser.role === 'admin' && (
            <DataGuruView
              teachers={teachers}
              onSaveTeacher={handleSaveTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onClearAllTeachers={handleClearAllTeachers}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              currentUser={currentUser}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onUpdateTeacherSignature={handleUpdateTeacherSignature}
              onClearTeacherData={handleClearTeacherData}
            />
          )}

          {activeTab === 'cetak' && (
            <PrintDocument
              currentUser={currentUser}
              config={config}
              students={students}
              teachers={teachers}
              attendance={attendance}
              grades={grades}
              journals={journals}
              guidance={guidance}
              initialDocType={printContext.docType}
              initialClass={printContext.kelas}
              initialMonth={printContext.month}
              initialSemester={printContext.semester}
              initialSubject={printContext.subject}
            />
          )}
        </main>
      </div>
    </div>
  );
}
