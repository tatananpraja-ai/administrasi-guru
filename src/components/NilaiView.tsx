import React, { useState, useMemo } from 'react';
import {
  CurrentUser,
  SystemConfig,
  Student,
  GradeItem,
  KELAS_LIST,
  KelasType,
} from '../types';
import {
  Award,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { exportGradesExcel } from '../lib/excelExport';

const DEFAULT_SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Pancasila (PPKn)',
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
  'Pendidikan Agama Islam',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Seni Rupa / Seni Budaya',
  'Bahasa Jawa',
  'Bahasa Inggris',
];

interface NilaiViewProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  students: Student[];
  gradeItems: GradeItem[];
  onSaveGrade: (grade: GradeItem) => Promise<void>;
  onDeleteGrade: (gradeId: string) => Promise<void>;
  onOpenCetakModal: (type: 'grades', kelas: string, subject: string) => void;
}

export const NilaiView: React.FC<NilaiViewProps> = ({
  currentUser,
  config,
  students,
  gradeItems,
  onSaveGrade,
  onDeleteGrade,
  onOpenCetakModal,
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

  const [selectedClass, setSelectedClass] = useState<KelasType>(allowedClasses[0] || 'Kelas 1');

  // Default subject according to teacher role
  const defaultSubject = useMemo(() => {
    if (teacherResp === 'Pendidikan Agama Islam') return 'Pendidikan Agama Islam';
    if (teacherResp === 'PJOK') return 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
    return DEFAULT_SUBJECTS[0];
  }, [teacherResp]);

  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubject);
  const [selectedChapter, setSelectedChapter] = useState<string>('Semua Bab');

  // Filter students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.kelas === selectedClass && s.isActive);
  }, [students, selectedClass]);

  // Filter grades for this class and subject
  const currentGrades = useMemo(() => {
    return gradeItems.filter((g) => {
      const matchClass = g.kelas === selectedClass;
      const matchSubject = g.subject === selectedSubject;
      const matchChapter = selectedChapter === 'Semua Bab' || g.chapter === selectedChapter;
      return matchClass && matchSubject && matchChapter;
    });
  }, [gradeItems, selectedClass, selectedSubject, selectedChapter]);

  // Distinct chapters for filtering
  const distinctChapters = useMemo(() => {
    const set = new Set<string>();
    gradeItems
      .filter((g) => g.kelas === selectedClass && g.subject === selectedSubject)
      .forEach((g) => set.add(g.chapter));
    return Array.from(set);
  }, [gradeItems, selectedClass, selectedSubject]);

  // State for creating new assessment
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChapter, setNewChapter] = useState('Bab 1');
  const [newAssessmentName, setNewAssessmentName] = useState('Penilaian Harian 1');

  // Local editing scores state
  const [localScores, setLocalScores] = useState<Record<string, Record<string, number>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Sync grades to local state
  React.useEffect(() => {
    const scoresMap: Record<string, Record<string, number>> = {};
    currentGrades.forEach((g) => {
      scoresMap[g.id] = { ...(g.scores || {}) };
    });
    setLocalScores(scoresMap);
  }, [currentGrades]);

  const handleScoreChange = (gradeId: string, studentId: string, valStr: string) => {
    const num = valStr === '' ? 0 : Math.min(100, Math.max(0, parseInt(valStr, 10) || 0));
    setLocalScores((prev) => ({
      ...prev,
      [gradeId]: {
        ...(prev[gradeId] || {}),
        [studentId]: num,
      },
    }));
  };

  const handleSaveGradeScores = async (grade: GradeItem) => {
    setSavingId(grade.id);
    const updated: GradeItem = {
      ...grade,
      scores: localScores[grade.id] || {},
    };
    try {
      await onSaveGrade(updated);
      setSaveSuccessMsg(`Nilai ${grade.assessmentName} berhasil disimpan!`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan nilai');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapter.trim() || !newAssessmentName.trim()) return;

    const newGrade: GradeItem = {
      id: `grade_${Date.now()}`,
      kelas: selectedClass,
      subject: selectedSubject,
      chapter: newChapter.trim(),
      assessmentName: newAssessmentName.trim(),
      semester: config.activeSemester || '1',
      teacherId: currentUser.teacher?.id || 'admin',
      scores: {},
      createdAt: new Date().toISOString(),
    };

    await onSaveGrade(newGrade);
    setShowAddModal(false);
    setNewAssessmentName('Penilaian Harian 2');
  };

  const handleDeleteAssessment = async (gradeId: string, title: string) => {
    if (window.confirm(`Hapus kolom penilaian "${title}"? Data nilai terkait akan dihapus.`)) {
      await onDeleteGrade(gradeId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Kelas
            </label>
            <select
              id="select-kelas-nilai"
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

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Mata Pelajaran
            </label>
            <select
              id="select-mapel-nilai"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
            >
              {DEFAULT_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          {distinctChapters.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Filter Bab
              </label>
              <select
                id="select-bab-nilai"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              >
                <option value="Semua Bab">Semua Bab</option>
                {distinctChapters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-tambah-penilaian"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penilaian Bab</span>
          </button>
          <button
            id="btn-cetak-nilai"
            onClick={() => onOpenCetakModal('grades', selectedClass, selectedSubject)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak Nilai</span>
          </button>
          <button
            id="btn-excel-nilai"
            onClick={() => {
              exportGradesExcel({
                students: classStudents,
                gradeItems: currentGrades,
                kelas: selectedClass,
                subject: selectedSubject,
                schoolName: config.schoolName,
                academicYear: config.academicYear || '2026/2027',
                semester: config.activeSemester || '1',
              });
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 text-xs shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grade Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Penilaian Harian — {selectedSubject}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedClass} • Penilaian per bab (dapat lebih dari 1 penilaian per bab) • Tanpa Kategori/Predikat
            </p>
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Tidak ada siswa terdaftar di {selectedClass}.
          </div>
        ) : currentGrades.length === 0 ? (
          <div className="p-10 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada penilaian harian untuk {selectedSubject} di {selectedClass}.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan klik tombol "Tambah Penilaian Bab" untuk mulai menambahkan Penilaian Harian 1, Penilaian Harian 2, dll.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white font-semibold px-4 py-2 text-xs shadow-sm hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Penilaian Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-20">NIS</th>
                  <th className="py-3 px-3 min-w-44">Nama Siswa</th>
                  {currentGrades.map((grade) => (
                    <th key={grade.id} className="py-3 px-3 text-center min-w-32">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-blue-700">{grade.chapter}</span>
                        <span className="text-[10px] text-slate-500 normal-case">{grade.assessmentName}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            onClick={() => handleSaveGradeScores(grade)}
                            disabled={savingId === grade.id}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 active:scale-95"
                            title="Simpan Kolom Ini"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(grade.id, `${grade.chapter} - ${grade.assessmentName}`)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 active:scale-95"
                            title="Hapus Kolom Penilaian Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 w-24 text-center bg-blue-50/70 text-blue-900">
                    Rata-Rata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {classStudents.map((student, idx) => {
                  let sum = 0;
                  let count = 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-xs">
                        {student.nis || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {student.name}
                      </td>
                      {currentGrades.map((grade) => {
                        const scoreVal = localScores[grade.id]?.[student.id];
                        const hasScore = typeof scoreVal === 'number';
                        if (hasScore) {
                          sum += scoreVal;
                          count++;
                        }

                        return (
                          <td key={grade.id} className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={hasScore ? scoreVal : ''}
                              onChange={(e) => handleScoreChange(grade.id, student.id, e.target.value)}
                              placeholder="0"
                              className="w-16 text-center rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                            />
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center font-bold text-blue-800 bg-blue-50/50">
                        {count > 0 ? (sum / count).toFixed(1) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah Penilaian Bab Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Tambah Penilaian Harian
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tambahkan penilaian harian untuk bab tertentu. Anda dapat menambahkan lebih dari 1 penilaian dalam satu bab yang sama.
            </p>

            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Bab / Lingkup Materi
                </label>
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  placeholder="Contoh: Bab 1 - Bilangan Cacah"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Penilaian
                </label>
                <input
                  type="text"
                  value={newAssessmentName}
                  onChange={(e) => setNewAssessmentName(e.target.value)}
                  placeholder="Contoh: Penilaian Harian 1 / PH 2 / Remedial"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Simpan Penilaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
