import React, { useState, useMemo } from 'react';
import {
  CurrentUser,
  SystemConfig,
  TeachingJournal,
  KELAS_LIST,
  KelasType,
} from '../types';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Edit3,
  Printer,
  FileSpreadsheet,
  Calendar,
  X,
  Clock
} from 'lucide-react';
import { exportJournalsExcel } from '../lib/excelExport';

interface JurnalViewProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  journals: TeachingJournal[];
  onSaveJournal: (journal: TeachingJournal) => Promise<void>;
  onDeleteJournal: (journalId: string) => Promise<void>;
  onOpenCetakModal: (type: 'journal', kelas: string, month: string) => void;
}

export const JurnalView: React.FC<JurnalViewProps> = ({
  currentUser,
  config,
  journals,
  onSaveJournal,
  onDeleteJournal,
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

  // Month filter (YYYY-MM)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formHours, setFormHours] = useState('1 - 2');
  const [formSubject, setFormSubject] = useState(
    teacherResp === 'Pendidikan Agama Islam'
      ? 'Pendidikan Agama Islam'
      : teacherResp === 'PJOK'
      ? 'PJOK'
      : 'Bahasa Indonesia'
  );
  const [formTopic, setFormTopic] = useState('');
  const [formReflection, setFormReflection] = useState('');

  // Filtered journals
  const filteredJournals = useMemo(() => {
    return journals
      .filter((j) => {
        const matchClass = j.kelas === selectedClass;
        const matchMonth = selectedMonth ? j.month === selectedMonth : true;
        return matchClass && matchMonth;
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [journals, selectedClass, selectedMonth]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormHours('1 - 2');
    setFormTopic('');
    setFormReflection('');
    setShowModal(true);
  };

  const handleOpenEditModal = (j: TeachingJournal) => {
    setEditingId(j.id);
    setFormDate(j.date);
    setFormHours(j.lessonHours);
    setFormSubject(j.subject);
    setFormTopic(j.topic);
    setFormReflection(j.reflection);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopic.trim()) return;

    const [year, month] = formDate.split('-');
    const journalData: TeachingJournal = {
      id: editingId || `jurnal_${Date.now()}`,
      kelas: selectedClass,
      teacherId: currentUser.teacher?.id || 'admin',
      teacherName: currentUser.teacher?.name || 'Administrator',
      date: formDate,
      month: `${year}-${month}`,
      lessonHours: formHours,
      subject: formSubject,
      topic: formTopic.trim(),
      reflection: formReflection.trim(),
      createdAt: new Date().toISOString(),
    };

    await onSaveJournal(journalData);
    setShowModal(false);
  };

  const handleDelete = async (id: string, topic: string) => {
    if (window.confirm(`Hapus catatan jurnal ini?\n"${topic}"`)) {
      await onDeleteJournal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Kelas
            </label>
            <select
              id="select-kelas-jurnal"
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
              Bulan Jurnal
            </label>
            <input
              id="input-bulan-jurnal"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-tambah-jurnal"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Catatan Jurnal</span>
          </button>
          <button
            id="btn-cetak-jurnal"
            onClick={() => onOpenCetakModal('journal', selectedClass, selectedMonth)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak Jurnal Bulan Ini</span>
          </button>
          <button
            id="btn-excel-jurnal"
            onClick={() => {
              exportJournalsExcel({
                journals: filteredJournals,
                kelas: selectedClass,
                teacherName: currentUser.teacher?.name || 'Pendidik',
                yearMonth: selectedMonth,
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

      {/* Jurnal Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Jurnal Pembelajaran — {selectedClass}
            </h3>
            <p className="text-xs text-slate-500">
              Periode: {selectedMonth || 'Semua Bulan'} • {filteredJournals.length} Catatan Kegiatan Mengajar
            </p>
          </div>
        </div>

        {filteredJournals.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold">Belum ada catatan jurnal pada bulan ini.</p>
            <p className="text-xs text-slate-500 mt-1">Klik "Tambah Catatan Jurnal" untuk mendokumentasikan kegiatan belajar mengajar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">Tanggal</th>
                  <th className="py-3 px-4 w-24 text-center">Jam Ke</th>
                  <th className="py-3 px-4 w-40">Mata Pelajaran</th>
                  <th className="py-3 px-4">Materi Pokok / Kegiatan Pembelajaran</th>
                  <th className="py-3 px-4">Refleksi / Hambatan</th>
                  <th className="py-3 px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredJournals.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {j.date}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                      {j.lessonHours}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-700">
                      {j.subject}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {j.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">
                      {j.reflection || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(j)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(j.id, j.topic)}
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

      {/* Modal Add/Edit Journal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Catatan Jurnal' : 'Tambah Catatan Jurnal Mengajar'}
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
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Jam Ke-
                  </label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    placeholder="Contoh: 1 - 3"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Contoh: Matematika"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Materi Pokok / Kegiatan Pembelajaran
                </label>
                <textarea
                  rows={3}
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Uraikan materi atau aktivitas pembelajaran yang dilaksanakan..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Refleksi / Hambatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={formReflection}
                  onChange={(e) => setFormReflection(e.target.value)}
                  placeholder="Catatan kendala, pemahaman siswa, atau tindak lanjut..."
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
                  {editingId ? 'Simpan Perubahan' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
