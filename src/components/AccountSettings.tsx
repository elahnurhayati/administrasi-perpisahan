import React, { useState } from 'react';
import { 
  Lock, Check, Image as ImageIcon, RefreshCw, 
  Upload, Sparkles, UserCheck, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface AccountSettingsProps {
  currentUser: UserAccount;
  accounts: UserAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  logoName: string;
  setLogoName: (name: string) => void;
}

export default function AccountSettings({
  currentUser,
  accounts,
  setAccounts,
  logoUrl,
  setLogoUrl,
  logoName,
  setLogoName,
}: AccountSettingsProps) {
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Logo manager states
  const [currentLogoPreview, setCurrentLogoPreview] = useState<string>(logoUrl);
  const [logoUploadError, setLogoUploadError] = useState('');
  const [logoUploadSuccess, setLogoUploadSuccess] = useState('');

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // -- CHANGE PASSWORD HANDLER
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Harap lengkapi semua isian sandi!');
      return;
    }

    // Match old password from memory
    const existingAccount = accounts.find(acc => acc.username === currentUser.username);
    if (!existingAccount || existingAccount.password !== oldPassword) {
      setPasswordError('Kombinasi kata sandi lama tidak tepat!');
      return;
    }

    if (newPassword.length < 5) {
      setPasswordError('Kata sandi baru minimal terdiri dari 5 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak sesuai!');
      return;
    }

    setAccounts(prev => prev.map(acc => {
      if (acc.username === currentUser.username) {
        return {
          ...acc,
          password: newPassword
        };
      }
      return acc;
    }));

    setPasswordSuccess('Alhamdulillah, Kata sandi access Anda berhasil diubah!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // -- UPLOAD LOGO PROCESSOR (ADMIN ONLY)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUploadError('');
    setLogoUploadSuccess('');
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('File harus berupa berkas gambar (PNG, JPG, JPEG)!');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setLogoUploadError('Ukuran gambar terlalu besar! Harap gunakan gambar dibawah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
      setLogoName(file.name);
      setCurrentLogoPreview(base64);
      setLogoUploadSuccess('Logo Kepanitiaan berhasil diperbarui & disimpan di database lokal!');
    };
    reader.readAsDataURL(file);
  };

  // Standard pre-installed logo suggestions (educational themes)
  const presetLogos = [
    {
      name: 'Emas Klasik',
      value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%23115e59" stroke="%23fbbf24" stroke-width="3"/><polygon points="50,15 80,35 80,70 50,88 20,70 20,35" fill="%230f172a" stroke="%23fbbf24" stroke-width="2"/><circle cx="50" cy="50" r="18" fill="%23ffffff"/><path d="M42 45 L50 35 L58 45 L50 48 Z M50 48 L50 63" stroke="%23115e59" stroke-width="3" fill="none"/></svg>'
    },
    {
      name: 'Hijau Madrasah',
      value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%23047857" stroke="%2334d399" stroke-width="4"/><path d="M50 20 L80 40 L80 70 L50 85 L20 70 L20 40 Z" fill="none" stroke="%23ffffff" stroke-width="2"/><path d="M35 50 Q50 35 65 50 Q50 65 35 50 Z" fill="%23fbbf24"/></svg>'
    },
    {
      name: 'Simbol Buku & Pena',
      value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%231e3a8a" stroke="%2360a5fa" stroke-width="4"/><path d="M30 40 L50 25 L70 40 L70 70 L50 78 L30 70 Z" fill="%23ffffff"/><path d="M35 45 Q50 40 65 45 L65 65 L50 72 L35 65 Z" fill="%23e2e8f0"/><path d="M50 40 L50 60" stroke="%231e3a8a" stroke-width="2"/></svg>'
    }
  ];

  const handleApplyPreset = (presetValue: string, presetName: string) => {
    setLogoUrl(presetValue);
    setLogoName(presetName);
    setCurrentLogoPreview(presetValue);
    setLogoUploadSuccess(`Berhasil memakai template logo "${presetName}"!`);
  };

  const handleResetLogo = () => {
    setLogoUrl('');
    setLogoName('Logo Al-Achdan Bawaan');
    setCurrentLogoPreview('');
    setLogoUploadSuccess('Logo telah dikembalikan ke standar/bawaan emblem pondok Al-Achdan.');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-main-container">
      {/* COLUMN 1: PASSWORD MAINTENANCE (ALL ROLES) */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100/90 space-y-6" id="settings-password-box">
        <div className="pb-2 border-b border-slate-100" id="header-col1">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Lock className="text-emerald-700" size={18} /> Ganti Kata Sandi Unit / Personal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Menjaga keamanan akses laporan RAB. Pastikan sandi yang ditentukan mudah Anda ingat tapi sulit ditebak.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4" id="password-adjust-form">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-650 text-slate-700 block">Unit Username Pengguna</span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-600 flex items-center gap-2">
              <UserCheck size={14} className="text-slate-450 text-slate-400" /> {currentUser.username} ({currentUser.institutionName})
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="input-old-pass">Kata Sandi Lama</label>
            <input
              id="input-old-pass"
              type="password"
              required
              placeholder="Ketik password saat ini"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="input-new-pass">Kata Sandi Baru</label>
            <input
              id="input-new-pass"
              type="password"
              required
              placeholder="Minimal 5 karakter unik"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="input-confirm-pass">Ulangi Kata Sandi Baru (Konfirmasi)</label>
            <input
              id="input-confirm-pass"
              type="password"
              required
              placeholder="Ketik ulang password baru Anda"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {passwordError && (
            <p className="text-xs text-red-650 text-red-600 font-medium flex items-center gap-1" id="pass-err-msg">
              <AlertCircle size={14} /> {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1" id="pass-suc-msg">
              <CheckCircle2 size={14} /> {passwordSuccess}
            </p>
          )}

          <div className="pt-2">
            <button
              id="btn-trigger-change-pass"
              type="submit"
              className="w-full px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Check size={14} /> Simpan Kata Sandi Sandi Baru
            </button>
          </div>
        </form>
      </div>

      {/* COLUMN 2: CUSTOM LOGO MANAGER (ADMIN ROLE ONLY) */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100/95 space-y-6" id="settings-logo-box">
        <div className="pb-2 border-b border-slate-100" id="header-col2">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="text-emerald-700" size={18} /> Khusus Admin: Atur Logo Kepanitiaan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mengunggah lambang resmi Yayasan Al-Achdan. Logo ini akan dicetak otomatis sebagai kop kop surat dalam berkas PDF (A4 / F4) dan Word/Excel.
          </p>
        </div>

        {isAdmin ? (
          <div className="space-y-6" id="admin-logo-active-editor">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200" id="logo-preview-box">
              <div className="h-20 w-20 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0" id="circle-preview">
                {currentLogoPreview ? (
                  <img 
                    src={currentLogoPreview} 
                    alt="Logo Al-Achdan" 
                    className="h-full w-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <Sparkles size={24} className="text-emerald-700" />
                    <span className="text-[9px] font-bold text-emerald-850 mt-1">Standar</span>
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Identitas Logo Terpasang:</span>
                <span className="text-[11px] text-slate-500 font-mono block break-all">{logoName || 'Logo Berornamen Standard'}</span>
                
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-file-picker"
                  />
                  <button
                    id="btn-upload-logo-custom"
                    onClick={() => document.getElementById('logo-file-picker')?.click()}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-bold rounded inline-flex items-center gap-1 shadow-xs"
                  >
                    <Upload size={11} /> Upload Foto Logo
                  </button>
                  {currentLogoPreview && (
                    <button
                      id="btn-reset-default-logo"
                      onClick={handleResetLogo}
                      className="px-2.5 py-1 text-red-650 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded text-[10.5px] font-bold"
                    >
                      Reset Bawaan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Presets suggestion */}
            <div className="space-y-2" id="logo-presets">
              <span className="text-xs font-bold text-slate-700 block">Pilih dari Desain Cepat Yayasan:</span>
              <div className="grid grid-cols-3 gap-2" id="preset-grid">
                {presetLogos.map((preset, i) => (
                  <button
                    id={`preset-logo-${i}`}
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(preset.value, `Crest ${preset.name}`)}
                    className="p-2 border border-slate-200 rounded-lg hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/20 text-center space-y-1 transition-all"
                  >
                    <div 
                      className="h-8 w-8 mx-auto" 
                      dangerouslySetInnerHTML={{ __html: preset.value.replace('data:image/svg+xml;utf8,', '') }} 
                    />
                    <span className="text-[10px] font-semibold text-slate-700 block">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {logoUploadError && (
              <p className="text-xs text-red-650 text-red-600 font-medium flex items-center gap-1" id="logo-err-msg">
                <AlertCircle size={14} /> {logoUploadError}
              </p>
            )}

            {logoUploadSuccess && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1" id="logo-suc-msg">
                <CheckCircle2 size={14} /> {logoUploadSuccess}
              </p>
            )}
          </div>
        ) : (
          <div className="p-10 text-center bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-2" id="non-admin-forbidden">
            <Lock className="text-slate-300" size={32} />
            <span className="text-xs font-bold text-slate-700">Akses Terbatas: Hanya Akun Admin</span>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Manajemen penggantian Kop Surat / logo penunjang berkas PDF & form hanya diizinkan untuk Admin Pusat Kepanitiaan Al-Achdan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
