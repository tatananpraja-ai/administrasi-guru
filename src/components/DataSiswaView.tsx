import React, { useState, useMemo, useRef } from 'react';
import {
  CurrentUser,
  Student,
  KELAS_LIST,
  KelasType,
  SystemConfig,
} from '../types';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Download,
  AlertTriangle,
  Search,
  CheckCircle2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  downloadStudentExcelTemplate,
  downloadStudentCsvTemplate,
  parseSpreadsheetFile,
} from '../lib/excelExport';

interface DataSiswaViewProps {
  currentUser: CurrentUser;
  config?: SystemConfig;
  students: Student[];
  onSaveStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onClearAllStudents: () => Promise<void>;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  currentUser,
  config,
  students,
  onSaveStudent,
  onDeleteStudent,
  onClearAllStudents,
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

  const [selectedClass, setSelectedClass] = useState<KelasType | 'Semua Kelas'>(
    isAdmin || isSpecialTeacher ? 'Semua Kelas' : allowedClasses[0] || 'Kelas 1'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formKelas, setFormKelas] = useState<KelasType>(allowedClasses[0] || 'Kelas 1');

  // Danger Clear All Modal (Admin only)
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // Bulk CSV Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'Semua Kelas' ? true : s.kelas === selectedClass;
      const matchQuery =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.nisn.includes(searchQuery);
      return matchClass && matchQuery;
    });
  }, [students, selectedClass, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNis('');
    setFormNisn('');
    setFormName('');
    setFormGender('L');
    setFormKelas(selectedClass === 'Semua Kelas' ? allowedClasses[0] || 'Kelas 1' : selectedClass);
    setShowModal(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingId(s.id);
    setFormNis(s.nis);
    setFormNisn(s.nisn);
    setFormName(s.name);
    setFormGender(s.gender);
    setFormKelas(s.kelas);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const student: Student = {
      id: editingId || `student_${Date.now()}`,
      nis: formNis.trim(),
      nisn: formNisn.trim(),
      name: formName.trim(),
      gender: formGender,
      kelas: formKelas,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await onSaveStudent(student);
    setShowModal(false);
  };

  const handleDelete = async (s: Student) => {
    if (window.confirm(`Hapus data siswa ${s.name} (${s.kelas})?`)) {
      await onDeleteStudent(s.id);
    }
  };

  // Bulk Excel / CSV upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length < 2) {
        alert('File kosong atau format tidak sesuai. Pastikan file memiliki baris header dan data.');
        return;
      }

      // Header: NIS, NISN, Nama, JenisKelamin, Kelas
      let addedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3 || !row[2]) continue;

        const rawGender = (row[3] || '').toString().trim().toUpperCase();
        const gender: 'L' | 'P' = rawGender === 'P' || rawGender.startsWith('P') ? 'P' : 'L';
        const rawKelas = (row[4] || '').toString().trim();
        const kelas: KelasType = (KELAS_LIST.includes(rawKelas as KelasType) ? rawKelas : 'Kelas 1') as KelasType;

        const student: Student = {
          id: `student_${Date.now()}_${i}`,
          nis: row[0] ? String(row[0]).trim() : '',
          nisn: row[1] ? String(row[1]).trim() : '',
          name: String(row[2]).trim(),
          gender,
          kelas,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        await onSaveStudent(student);
        addedCount++;
      }

      setImportStatus(`Berhasil mengimpor ${addedCount} data siswa masal!`);
      setTimeout(() => setImportStatus(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel/CSV. Pastikan format kolom sesuai template.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteClearAll = async () => {
    const isMatched = clearConfirmText.trim().toUpperCase() === 'HAPUS SEMUA SISWA';
    if (!isMatched) {
      alert('Teks konfirmasi tidak sesuai. Harap ketik "HAPUS SEMUA SISWA".');
      return;
    }
    setIsClearing(true);
    try {
      await onClearAllStudents();
      setShowClearModal(false);
      setClearConfirmText('');
      alert('Semua data siswa berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus data siswa:', err);
      alert('Terjadi kesalahan saat menghapus data siswa.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Kelas
            </label>
            <select
              id="select-kelas-siswa"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as KelasType | 'Semua Kelas')}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
            >
              {(isAdmin || isSpecialTeacher) && <option value="Semua Kelas">Semua Kelas</option>}
              {allowedClasses.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Cari Siswa
            </label>
            <div className="relative">
              <input
                id="input-cari-siswa"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama / NIS / NISN..."
                className="w-48 sm:w-60 rounded-xl border border-slate-300 bg-slate-50 pl-8 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Student */}
          <button
            id="btn-tambah-siswa"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          {/* Admin Tools: CSV Bulk Upload & Template & Clear All */}
          {isAdmin && (
            <>
              <button
                id="btn-download-template-siswa-excel"
                onClick={downloadStudentExcelTemplate}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-2 text-xs transition shadow-2xs"
                title="Unduh Template Excel format per-kolom (NIS, NISN, Nama, Jenis Kelamin, Kelas)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Template Excel (Per Kolom)</span>
              </button>

              <button
                id="btn-download-template-siswa-csv"
                onClick={downloadStudentCsvTemplate}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
                title="Unduh Template CSV untuk input masal"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Template CSV</span>
              </button>

              <button
                id="btn-upload-siswa"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 text-xs shadow-xs transition active:scale-95 cursor-pointer"
                title="Unggah file Excel atau CSV data siswa masal"
              >
                <Upload className="w-4 h-4" />
                <span>Input Masal Excel / CSV</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                id="btn-clear-all-siswa"
                onClick={() => {
                  setClearConfirmText('');
                  setShowClearModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-2 text-xs transition active:scale-95"
                title="Hapus seluruh data siswa di database"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Semua Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {importStatus && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Peserta Didik ({filteredStudents.length} Siswa)
            </h3>
            <p className="text-xs text-slate-500">
              {selectedClass} • Data induk siswa aktif {config?.schoolName || 'SDN Maospati 3'}
            </p>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold">Tidak ada data siswa ditemukan.</p>
            <p className="text-xs text-slate-500 mt-1">Gunakan tombol "Tambah Siswa" atau "Input Masal CSV".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">NIS</th>
                  <th className="py-3 px-4 w-32">NISN</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-4 w-24 text-center">L/P</th>
                  <th className="py-3 px-4 w-28 text-center">Kelas</th>
                  <th className="py-3 px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                      {s.nis || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                      {s.nisn || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          s.gender === 'L'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Edit Siswa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                          title="Hapus Siswa"
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

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Muhammad Rizki Pratama"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="Contoh: 2401"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    NISN
                  </label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="Contoh: 0151234567"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Penempatan Kelas
                  </label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value as KelasType)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    disabled={!isAdmin && !isSpecialTeacher && allowedClasses.length === 1}
                  >
                    {allowedClasses.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {editingId ? 'Simpan Perubahan' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Students Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Konfirmasi Hapus Semua Siswa
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Tindakan ini akan <strong>MENGHAPUS SELURUH DATA SISWA</strong> dari database Firestore secara permanen.
              Data yang telah dihapus tidak dapat dikembalikan.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-100 text-xs">
              <span className="text-slate-500 block mb-1">
                Ketik teks konfirmasi di bawah ini:
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-rose-700 select-all">
                  HAPUS SEMUA SISWA
                </span>
                <button
                  type="button"
                  onClick={() => setClearConfirmText('HAPUS SEMUA SISWA')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  Isi otomatis
                </button>
              </div>
            </div>

            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && clearConfirmText.trim().toUpperCase() === 'HAPUS SEMUA SISWA' && !isClearing) {
                  e.preventDefault();
                  handleExecuteClearAll();
                }
              }}
              placeholder="Ketik HAPUS SEMUA SISWA"
              disabled={isClearing}
              className="w-full rounded-xl border border-rose-300 bg-rose-50/50 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-hidden mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteClearAll}
                disabled={clearConfirmText.trim().toUpperCase() !== 'HAPUS SEMUA SISWA' || isClearing}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isClearing ? 'Sedang Menghapus...' : 'Ya, Hapus Semua Siswa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
