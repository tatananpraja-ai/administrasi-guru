import React, { useState, useRef } from 'react';
import {
  Teacher,
  TanggungJawab,
  TANGGUNG_JAWAB_OPTIONS,
} from '../types';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Download,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  X,
  FileSignature,
  FileSpreadsheet
} from 'lucide-react';
import {
  downloadTeacherExcelTemplate,
  downloadTeacherCsvTemplate,
  parseSpreadsheetFile,
} from '../lib/excelExport';

interface DataGuruViewProps {
  teachers: Teacher[];
  onSaveTeacher: (teacher: Teacher) => Promise<void>;
  onDeleteTeacher: (teacherId: string) => Promise<void>;
  onClearAllTeachers: () => Promise<void>;
}

export const DataGuruView: React.FC<DataGuruViewProps> = ({
  teachers,
  onSaveTeacher,
  onDeleteTeacher,
  onClearAllTeachers,
}) => {
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNip, setFormNip] = useState('');
  const [formName, setFormName] = useState('');
  const [formTanggungJawab, setFormTanggungJawab] = useState<TanggungJawab>('Kelas 1');
  const [formPassword, setFormPassword] = useState('sdnsuratmajan2');
  const [formPhone, setFormPhone] = useState('');
  const [formSignatureUrl, setFormSignatureUrl] = useState('');

  // Clear All Danger Modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // CSV file upload ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNip('');
    setFormName('');
    setFormTanggungJawab('Kelas 1');
    setFormPassword('sdnsuratmajan2');
    setFormPhone('');
    setFormSignatureUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingId(t.id);
    setFormNip(t.nip);
    setFormName(t.name);
    setFormTanggungJawab(t.tanggungJawab);
    setFormPassword(t.password || 'sdnsuratmajan2');
    setFormPhone(t.phone || '');
    setFormSignatureUrl(t.signatureUrl || '');
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const teacher: Teacher = {
      id: editingId || `guru_${Date.now()}`,
      nip: formNip.trim(),
      name: formName.trim(),
      role: 'guru',
      tanggungJawab: formTanggungJawab,
      password: formPassword.trim() || 'sdnsuratmajan2',
      phone: formPhone.trim(),
      signatureUrl: formSignatureUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    await onSaveTeacher(teacher);
    setShowModal(false);
  };

  const handleDelete = async (t: Teacher) => {
    if (window.confirm(`Hapus data guru ${t.name} (${t.tanggungJawab})?`)) {
      await onDeleteTeacher(t.id);
    }
  };

  // Bulk Excel / CSV Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length < 2) {
        alert('File kosong atau format tidak sesuai. Pastikan file memiliki baris header dan data.');
        return;
      }

      // Header: NIP, Nama, Tanggung Jawab, Password, Telepon
      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2 || !row[1]) continue;

        const teacher: Teacher = {
          id: `guru_${Date.now()}_${i}`,
          nip: row[0] || '',
          name: row[1].trim(),
          role: 'guru',
          tanggungJawab: (row[2] as TanggungJawab) || 'Kelas 1',
          password: row[3] || 'sdnsuratmajan2',
          phone: row[4] || '',
          signatureUrl: '',
          createdAt: new Date().toISOString(),
        };

        await onSaveTeacher(teacher);
        count++;
      }

      setImportStatus(`Berhasil mengimpor ${count} data guru masal!`);
      setTimeout(() => setImportStatus(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel/CSV. Pastikan format kolom sesuai template.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteClearAll = async () => {
    const isMatched = clearConfirmText.trim().toUpperCase() === 'HAPUS SEMUA GURU';
    if (!isMatched) {
      alert('Teks konfirmasi tidak sesuai. Harap ketik "HAPUS SEMUA GURU".');
      return;
    }
    setIsClearing(true);
    try {
      await onClearAllTeachers();
      setShowClearModal(false);
      setClearConfirmText('');
      alert('Semua data guru berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus data guru:', err);
      alert('Terjadi kesalahan saat menghapus data guru.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Daftar Tenaga Pendidik ({teachers.length} Guru)
          </h2>
          <p className="text-xs text-slate-500">
            Kelola penugasan wali kelas (Kelas 1 - 6) serta guru mata pelajaran (PAI & PJOK)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-tambah-guru"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>

          <button
            id="btn-download-template-guru-excel"
            onClick={downloadTeacherExcelTemplate}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-2 text-xs transition shadow-2xs"
            title="Unduh Template Excel format per-kolom (NIP, Nama, Tanggung Jawab, Password, Telepon)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Template Excel (Per Kolom)</span>
          </button>

          <button
            id="btn-download-template-guru-csv"
            onClick={downloadTeacherCsvTemplate}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-2 text-xs transition"
            title="Unduh Template CSV Guru"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Template CSV</span>
          </button>

          <button
            id="btn-upload-guru"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 text-xs shadow-xs transition active:scale-95 cursor-pointer"
            title="Unggah File Excel atau CSV Data Guru Masal"
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
            id="btn-clear-all-guru"
            onClick={() => {
              setClearConfirmText('');
              setShowClearModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-2 text-xs transition active:scale-95"
            title="Hapus semua guru di database"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Hapus Semua Guru</span>
          </button>
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
        {teachers.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold">Belum ada data guru terdaftar.</p>
            <p className="text-xs text-slate-500 mt-1">Klik "Tambah Guru" atau gunakan "Input Masal CSV".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                  <th className="py-3 px-4 w-44">NIP</th>
                  <th className="py-3 px-4 w-48">Tanggung Jawab</th>
                  <th className="py-3 px-4 w-32">Kata Sandi</th>
                  <th className="py-3 px-4 w-28 text-center">Scan TTD</th>
                  <th className="py-3 px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {teachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {t.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                      {t.nip || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {t.tanggungJawab}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {t.password || 'sdnsuratmajan2'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.signatureUrl ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                          <FileSignature className="w-3.5 h-3.5" />
                          <span>Ada</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Belum</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Edit Guru"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1 rounded-md text-rose-500 hover:bg-rose-50"
                          title="Hapus Guru"
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Data Pendidik' : 'Tambah Tenaga Pendidik Baru'}
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
                  Nama Lengkap beserta Gelar
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Siti Rahayu, S.Pd."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    placeholder="18 digit NIP"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggung Jawab
                  </label>
                  <select
                    value={formTanggungJawab}
                    onChange={(e) => setFormTanggungJawab(e.target.value as TanggungJawab)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    {TANGGUNG_JAWAB_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kata Sandi Login
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="sdnsuratmajan2"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Scan Tanda Tangan (Opsional)
                </label>
                <input
                  type="url"
                  value={formSignatureUrl}
                  onChange={(e) => setFormSignatureUrl(e.target.value)}
                  placeholder="https://.../ttd_guru.png (PNG transparan disarankan)"
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
                  {editingId ? 'Simpan Perubahan' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Teachers Danger Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Konfirmasi Hapus Semua Guru
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Tindakan ini akan <strong>MENGHAPUS SELURUH DATA AKUN GURU</strong> dari database Firestore secara permanen.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-100 text-xs">
              <span className="text-slate-500 block mb-1">
                Ketik teks konfirmasi di bawah ini:
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-rose-700 select-all">
                  HAPUS SEMUA GURU
                </span>
                <button
                  type="button"
                  onClick={() => setClearConfirmText('HAPUS SEMUA GURU')}
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
                if (e.key === 'Enter' && clearConfirmText.trim().toUpperCase() === 'HAPUS SEMUA GURU' && !isClearing) {
                  e.preventDefault();
                  handleExecuteClearAll();
                }
              }}
              placeholder="Ketik HAPUS SEMUA GURU"
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
                disabled={clearConfirmText.trim().toUpperCase() !== 'HAPUS SEMUA GURU' || isClearing}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isClearing ? 'Sedang Menghapus...' : 'Ya, Hapus Semua Guru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
