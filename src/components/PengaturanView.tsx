import React, { useState } from 'react';
import { CurrentUser, SystemConfig, Teacher } from '../types';
import {
  Settings,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileSignature,
  School,
  Lock,
  Calendar,
  Image as ImageIcon,
  MapPin
} from 'lucide-react';

interface PengaturanViewProps {
  currentUser: CurrentUser;
  config: SystemConfig;
  onUpdateConfig: (updated: Partial<SystemConfig>) => Promise<SystemConfig | undefined>;
  onUpdateTeacherSignature: (signatureUrl: string) => Promise<void>;
  onClearTeacherData: (kelas: string, teacherId?: string) => Promise<void>;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  currentUser,
  config,
  onUpdateConfig,
  onUpdateTeacherSignature,
  onClearTeacherData,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Config form state (Admin)
  const [schoolName, setSchoolName] = useState(config.schoolName || 'SDN MAOSPATI 3');
  const [schoolAddress, setSchoolAddress] = useState(config.schoolAddress || '');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(config.schoolLogoUrl || '');
  const [cityLogoUrl, setCityLogoUrl] = useState(config.cityLogoUrl || '');
  const [locationCity, setLocationCity] = useState(config.locationCity || 'Maospati');
  const [principalName, setPrincipalName] = useState(config.principalName || '');
  const [principalNip, setPrincipalNip] = useState(config.principalNip || '');
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState(config.principalSignatureUrl || '');
  const [academicYear, setAcademicYear] = useState(config.academicYear || '2026/2027');
  const [activeSemester, setActiveSemester] = useState<'1' | '2'>(config.activeSemester || '1');
  const [adminPassword, setAdminPassword] = useState(config.adminPassword || 'admin123');
  const [guruPasswordDefault, setGuruPasswordDefault] = useState(config.guruPasswordDefault || 'sdnmaospati3');

  // Teacher signature state
  const [teacherSigUrl, setTeacherSigUrl] = useState(currentUser.teacher?.signatureUrl || '');

  // Status & notifications
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 2-Step Confirmation Modal for Guru
  // "Pada akun guru tambahkan tombol untuk menghapus semua data tersimpan,
  // seperti absen, nilai, jurnal, bimbingan, konfirmasi 2 kali agar menghindari tidak sengaja terhapus"
  const [showConfirmStep1, setShowConfirmStep1] = useState(false);
  const [showConfirmStep2, setShowConfirmStep2] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [confirmInputText, setConfirmInputText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateConfig({
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
        schoolLogoUrl: schoolLogoUrl.trim(),
        cityLogoUrl: cityLogoUrl.trim(),
        locationCity: locationCity.trim(),
        principalName: principalName.trim(),
        principalNip: principalNip.trim(),
        principalSignatureUrl: principalSignatureUrl.trim(),
        academicYear: academicYear.trim(),
        activeSemester,
        adminPassword: adminPassword.trim(),
        guruPasswordDefault: guruPasswordDefault.trim(),
      });
      setSaveSuccessMsg('Konfigurasi sistem berhasil disimpan ke database!');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan konfigurasi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTeacherSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateTeacherSignature(teacherSigUrl.trim());
      setSaveSuccessMsg('Tanda tangan digital guru berhasil diperbarui!');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan tanda tangan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Step 1 to Step 2
  const handleProceedToStep2 = () => {
    if (!confirmedCheck) return;
    setShowConfirmStep1(false);
    setConfirmInputText('');
    setShowConfirmStep2(true);
  };

  // Final Step 2 Execution
  const handleExecuteTeacherClear = async () => {
    if (confirmInputText !== 'HAPUS SEMUA DATA') {
      alert('Teks konfirmasi harus persis "HAPUS SEMUA DATA".');
      return;
    }
    setIsClearing(true);
    try {
      const resp = currentUser.teacher?.tanggungJawab || '';
      const teacherId = currentUser.teacher?.id;
      await onClearTeacherData(resp, teacherId);
      setShowConfirmStep2(false);
      setConfirmInputText('');
      setConfirmedCheck(false);
      alert('Semua data presensi, nilai, jurnal, dan bimbingan Anda berhasil dihapus.');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ADMIN CONFIGURATION SECTION */}
      {isAdmin ? (
        <form onSubmit={handleAdminSave} className="space-y-6">
          {/* 1. Identity & Official Documents */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Identitas Satuan Pendidikan & Kop Surat
                </h3>
                <p className="text-xs text-slate-500">
                  Digunakan sebagai kop resmi cetak presensi, nilai, jurnal, dan bimbingan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Satuan Pendidikan
                </label>
                <input
                  id="cfg-school-name"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lokasi Tempat Tanda Tangan Dokumen
                </label>
                <div className="relative">
                  <input
                    id="cfg-location-city"
                    type="text"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    placeholder="Contoh: Maospati / Magetan"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 pl-9 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Akan tercetak di kanan bawah dokumen: "{locationCity}, [Tanggal]"
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Lengkap Satuan Pendidikan
              </label>
              <textarea
                id="cfg-school-address"
                rows={2}
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                required
              />
            </div>

            {/* Logo URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Logo Sekolah / Tut Wuri Handayani
                </label>
                <input
                  id="cfg-school-logo"
                  type="url"
                  value={schoolLogoUrl}
                  onChange={(e) => setSchoolLogoUrl(e.target.value)}
                  placeholder="https://.../logo_sekolah.png"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Logo Pemerintah Daerah / Kabupaten
                </label>
                <input
                  id="cfg-city-logo"
                  type="url"
                  value={cityLogoUrl}
                  onChange={(e) => setCityLogoUrl(e.target.value)}
                  placeholder="https://.../logo_kabupaten.png"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 2. Kepala Satuan Pendidikan */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSignature className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kepala Satuan Pendidikan & Tanda Tangan Resmi
                </h3>
                <p className="text-xs text-slate-500">
                  Nama dan scan tanda tangan untuk pengesahan cetak dokumen resmi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Kepala Satuan Pendidikan
                </label>
                <input
                  id="cfg-principal-name"
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Contoh: Dra. Hj. Sri Mulyani, M.Pd."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NIP Kepala Satuan Pendidikan
                </label>
                <input
                  id="cfg-principal-nip"
                  type="text"
                  value={principalNip}
                  onChange={(e) => setPrincipalNip(e.target.value)}
                  placeholder="196908151993032004"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                URL Scan Tanda Tangan Kepala Satuan Pendidikan
              </label>
              <input
                id="cfg-principal-signature"
                type="url"
                value={principalSignatureUrl}
                onChange={(e) => setPrincipalSignatureUrl(e.target.value)}
                placeholder="https://.../ttd_kepala_sekolah.png (Format PNG transparan disarankan)"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jika diisi, tanda tangan dapat disisipkan otomatis saat cetak dokumen. Jika kosong, kolom tanda tangan dicetak manual (kosongan bergaris).
              </span>
            </div>
          </div>

          {/* 3. Tahun Ajaran & Kata Sandi */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tahun Ajaran & Keamanan Sistem
                </h3>
                <p className="text-xs text-slate-500">
                  Pengaturan semester aktif serta kata sandi login default
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tahun Ajaran Aktif
                </label>
                <input
                  id="cfg-academic-year"
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Semester Aktif
                </label>
                <select
                  id="cfg-active-semester"
                  value={activeSemester}
                  onChange={(e) => setActiveSemester(e.target.value as '1' | '2')}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi Admin (Default: admin123)
                </label>
                <input
                  id="cfg-admin-password"
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi Default Guru (Default: sdnmaospati3)
                </label>
                <input
                  id="cfg-guru-password"
                  type="text"
                  value={guruPasswordDefault}
                  onChange={(e) => setGuruPasswordDefault(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-save-admin-config"
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-3 text-sm shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan Seluruh Pengaturan'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* GURU CONFIGURATION SECTION */
        <div className="space-y-6">
          {/* Guru Signature Update */}
          <form onSubmit={handleTeacherSave} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSignature className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Profil & Scan Tanda Tangan Guru
                </h3>
                <p className="text-xs text-slate-500">
                  {currentUser.teacher?.name} • {currentUser.teacher?.tanggungJawab}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                URL Scan Tanda Tangan Guru (Opsional)
              </label>
              <input
                id="input-guru-signature"
                type="url"
                value={teacherSigUrl}
                onChange={(e) => setTeacherSigUrl(e.target.value)}
                placeholder="https://.../ttd_guru.png (Format PNG transparan disarankan)"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jika diisi, tanda tangan Anda dapat disematkan secara otomatis di dokumen cetak presensi, nilai, jurnal, dan bimbingan.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-save-guru-sig"
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 text-xs shadow-xs transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tanda Tangan</span>
              </button>
            </div>
          </form>

          {/* Guru Danger Zone: Delete All Saved Data (2-Step Confirmation) */}
          {/* "Pada akun guru tambahkan tombol untuk menghapus semua data tersimpan,
              seperti absen, nilai, jurnal, bimbingan, konfirmasi 2 kali agar menghindari tidak sengaja terhapus" */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">
                  Hapus Seluruh Data Tersimpan Guru
                </h3>
                <p className="text-xs text-rose-700">
                  Fitur pembersihan data khusus untuk akun Anda ({currentUser.teacher?.tanggungJawab})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tombol ini akan menghapus seluruh data <strong>presensi</strong>, <strong>nilai harian</strong>, <strong>jurnal mengajar</strong>, dan <strong>bimbingan siswa</strong> yang menjadi tanggung jawab Anda di database.
              Sistem akan meminta <strong>konfirmasi 2 kali</strong> untuk mencegah penghapusan tanpa sengaja.
            </p>

            <div className="pt-2">
              <button
                id="btn-guru-clear-all-step1"
                type="button"
                onClick={() => {
                  setConfirmedCheck(false);
                  setShowConfirmStep1(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2.5 text-xs shadow-xs transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Data Tersimpan (Absen, Nilai, Jurnal, Bimbingan)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL - STEP 1 (GURU) */}
      {showConfirmStep1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold mb-2">
              KONFIRMASI TAHAP 1 DARI 2
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Apakah Anda yakin ingin menghapus seluruh data?
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Seluruh catatan presensi, nilai harian bab, jurnal catatan mengajar, dan bimbingan siswa untuk <strong>{currentUser.teacher?.tanggungJawab}</strong> akan dihapus permanen dari server Firestore.
            </p>

            <div className="my-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-700 leading-snug font-medium">
                  Saya memahami bahwa data yang dihapus <strong>tidak dapat dipulihkan</strong> kembali.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmStep1(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!confirmedCheck}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40 transition"
              >
                Lanjut ke Konfirmasi Akhir (Tahap 2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL - STEP 2 (GURU FINAL) */}
      {showConfirmStep2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-rose-500">
            <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold mb-2">
              KONFIRMASI TAHAP 2 (TERAKHIR)
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Peringatan Terakhir: Penghapusan Permanen
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Untuk mengeksekusi penghapusan semua data tersimpan Anda di <strong>{currentUser.teacher?.tanggungJawab}</strong>, silakan ketik teks di bawah ini:
            </p>

            <div className="my-3 p-3 rounded-xl bg-slate-100 text-center text-xs font-mono font-bold text-rose-700 select-all border border-slate-200">
              HAPUS SEMUA DATA
            </div>

            <input
              type="text"
              value={confirmInputText}
              onChange={(e) => setConfirmInputText(e.target.value)}
              placeholder="Ketik teks di atas"
              className="w-full rounded-xl border border-rose-300 bg-rose-50/50 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-hidden mb-4 text-center"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmStep2(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteTeacherClear}
                disabled={confirmInputText !== 'HAPUS SEMUA DATA' || isClearing}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40 transition"
              >
                {isClearing ? 'Menghapus...' : 'Ya, Hapus Permanen Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
