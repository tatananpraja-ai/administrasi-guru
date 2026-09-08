import React, { useState, useMemo } from 'react';
import {
  CurrentUser,
  SystemConfig,
  StudentGuidance,
  Student,
  KELAS_LIST,
  KelasType,
} from '../types';
import {
  HeartHandshake,
  Plus,
  Trash2,
  Edit3,
  Printer,
  FileSpreadsheet,
  X,
  UserCheck
} from 'lucide-react';
import { exportGuidanceExcel } from '../lib/excelExport';

interface BimbinganViewProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  students: Student[];
  guidanceList: StudentGuidance[];
  onSaveGuidance: (guidance: StudentGuidance) => Promise<void>;
  onDeleteGuidance: (guidanceId: string) => Promise<void>;
  onOpenCetakModal: (type: 'guidance', kelas: string, semester: '1' | '2') => void;
}

export const BimbinganView: React.FC<BimbinganViewProps> = ({
  currentUser,
  config,
  students,
  guidanceList,
  onSaveGuidance,
  onDeleteGuidance,
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
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(config.activeSemester || '1');

  // Filter students for selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.kelas === selectedClass && s.isActive);
  }, [students, selectedClass]);

  // Filtered guidance
  const filteredList = useMemo(() => {
    return guidanceList
      .filter((g) => g.kelas === selectedClass && g.semester === selectedSemester)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [guidanceList, selectedClass, selectedSemester]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formIssue, setFormIssue] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formResult, setFormResult] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormStudentId(classStudents[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormIssue('');
    setFormAction('');
    setFormResult('');
    setFormNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (g: StudentGuidance) => {
    setEditingId(g.id);
    setFormStudentId(g.studentId);
    setFormDate(g.date);
    setFormIssue(g.issue);
    setFormAction(g.actionTaken);
    setFormResult(g.result);
    setFormNotes(g.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = classStudents.find((s) => s.id === formStudentId);
    if (!st || !formIssue.trim() || !formAction.trim()) return;

    const data: StudentGuidance = {
      id: editingId || `guidance_${Date.now()}`,
      kelas: selectedClass,
      studentId: st.id,
      studentName: st.name,
      teacherId: currentUser.teacher?.id || 'admin',
      date: formDate,
      semester: selectedSemester,
      issue: formIssue.trim(),
      actionTaken: formAction.trim(),
      result: formResult.trim() || 'Dalam pemantauan',
      notes: formNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    await onSaveGuidance(data);
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus catatan bimbingan untuk siswa ${name}?`)) {
      await onDeleteGuidance(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Kelas
            </label>
            <select
              id="select-kelas-bimbingan"
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
              Semester
            </label>
            <select
              id="select-semester-bimbingan"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as '1' | '2')}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-tambah-bimbingan"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Bimbingan Baru</span>
          </button>
          <button
            id="btn-cetak-bimbingan"
            onClick={() => onOpenCetakModal('guidance', selectedClass, selectedSemester)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak Bimbingan Semester</span>
          </button>
          <button
            id="btn-excel-bimbingan"
            onClick={() => {
              exportGuidanceExcel({
                guidanceList: filteredList,
                kelas: selectedClass,
                semester: selectedSemester,
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Buku Catatan Bimbingan Siswa — {selectedClass}
            </h3>
            <p className="text-xs text-slate-500">
              Semester {selectedSemester} • Pembinaan kepribadian, sosial, belajar, dan kedisiplinan siswa
            </p>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold">Belum ada catatan bimbingan siswa di semester ini.</p>
            <p className="text-xs text-slate-500 mt-1">Klik "Catat Bimbingan Baru" untuk mendokumentasikan pembinaan peserta didik.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">Tanggal</th>
                  <th className="py-3 px-4 w-44">Nama Siswa</th>
                  <th className="py-3 px-4">Permasalahan / Kasus</th>
                  <th className="py-3 px-4">Tindak Lanjut / Bimbingan</th>
                  <th className="py-3 px-4">Hasil / Perkembangan</th>
                  <th className="py-3 px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredList.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {g.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">
                      {g.studentName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {g.issue}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {g.actionTaken}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">
                      {g.result}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.studentName)}
                          className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Catatan Bimbingan' : 'Catat Bimbingan Siswa Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pilih Siswa
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    required
                  >
                    {classStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gender})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Bimbingan
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Gejala / Permasalahan / Kasus
                </label>
                <textarea
                  rows={2}
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  placeholder="Contoh: Kurang konsentrasi, sering terlambat, kesulitan membaca..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tindak Lanjut / Bentuk Bimbingan
                </label>
                <textarea
                  rows={2}
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  placeholder="Contoh: Konseling pribadi, pendampingan khusus, komunikasi dengan wali murid..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Hasil / Perkembangan Siswa
                </label>
                <input
                  type="text"
                  value={formResult}
                  onChange={(e) => setFormResult(e.target.value)}
                  placeholder="Contoh: Menunjukkan perubahan positif, hadir tepat waktu..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Bimbingan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
