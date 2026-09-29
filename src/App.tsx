import React, { useState, useEffect } from 'react';
import { 
  LogOut, Settings, Award, User, Lock, Eye, EyeOff, Sparkles, 
  HelpCircle, ChevronRight, GraduationCap, Landmark, FileText, CheckCircle,
  Coins, Users, Clock, Trash2, Menu, X, Printer, Download, CheckCircle2
} from 'lucide-react';
import { 
  UserAccount, 
  UserRole, 
  RABBudget, 
  DEFAULT_ACCOUNTS, 
  INITIAL_BUDGETS,
  DEFAULT_CONFIG
} from './types';
import AdminPanel from './components/AdminPanel';
import LembagaPanel from './components/LembagaPanel';
import AccountSettings from './components/AccountSettings';

export default function App() {
  // --- PERSISTED STATE INITIALIZATION ---
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('rab_al_achdan_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing accounts', e);
      }
    }
    return DEFAULT_ACCOUNTS;
  });

  const [budgets, setBudgets] = useState<RABBudget[]>(() => {
    const saved = localStorage.getItem('rab_al_achdan_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing budgets', e);
      }
    }
    return INITIAL_BUDGETS;
  });

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('rab_al_achdan_logo_url') || DEFAULT_CONFIG.logoUrl;
  });

  const [logoName, setLogoName] = useState<string>(() => {
    return localStorage.getItem('rab_al_achdan_logo_name') || DEFAULT_CONFIG.logoName;
  });

  // Active Auth Session State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = sessionStorage.getItem('rab_al_achdan_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing session user', e);
      }
    }
    return null;
  });

  // Login form inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Main UI router states
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  
  // Shared active tabs controlled by sidebar
  const [adminTab, setAdminTab] = useState<'diajukan' | 'verifikasi' | 'realisasi' | 'hapus' | 'akun'>('diajukan');
  const [lembagaTab, setLembagaTab] = useState<'pengajuan' | 'monitoring' | 'edit-hapus' | 'foto'>('pengajuan');
  
  // Mobile sidebar visibility flag
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync state to localstorage when changes occur
  useEffect(() => {
    localStorage.setItem('rab_al_achdan_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('rab_al_achdan_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('rab_al_achdan_logo_url', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    localStorage.setItem('rab_al_achdan_logo_name', logoName);
  }, [logoName]);

  // -- AUTH FLOW HANDLERS
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Harap isi lengkap username dan sandi!');
      return;
    }

    const matchedAccount = accounts.find(
      acc => acc.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!matchedAccount || matchedAccount.password !== passwordInput.trim()) {
      setLoginError('Kombinasi Username atau Kata Sandi salah!');
      return;
    }

    // Login success
    setCurrentUser(matchedAccount);
    sessionStorage.setItem('rab_al_achdan_current_user', JSON.stringify(matchedAccount));
    setCurrentView('dashboard');
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari sistem RAB Al-Achdan?')) {
      setCurrentUser(null);
      sessionStorage.removeItem('rab_al_achdan_current_user');
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased" id="main-app-shell">
      {/* 1. AUTH LOGIN FRAME */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-emerald-950" id="login-viewport">
          {/* Custom Ambient backgrounds geometric shapes */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-900/40 blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-900/40 blur-3xl"></div>

          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 z-15 relative border border-slate-100" id="login-card">
            {/* Header School Seal Logo in Login Panel */}
            <div className="text-center space-y-2.5" id="login-logo-header">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs overflow-hidden" id="login-emblem">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Perpisahan Al-Achdan" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-emerald-700 flex flex-col items-center">
                    <GraduationCap size={32} />
                  </div>
                )}
              </div>
              <div id="login-brand-titles">
                <h2 className="text-xs font-bold text-center tracking-widest text-emerald-800 uppercase block">Kepanitiaan Perpisahan</h2>
                <h1 className="text-xl font-black text-center text-slate-800 tracking-tight block mt-0.5">Yayasan Al-Achdan Sukabumi</h1>
                <p className="text-[10.5px] text-slate-500 font-medium">Sistem Pengajuan Rencana Anggaran Biaya (RAB) Terintegrasi</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-actual-form">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="login-username">Username Pengguna</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <User size={15} />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    required
                    placeholder="Masukkan username atau nama lembaga"
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="login-password">Kata Sandi / Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan sandi akses unit"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full text-xs pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    id="btn-toggle-login-pass"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-red-650 text-red-600 font-semibold" id="login-error-msg-banner">
                  &bull; {loginError}
                </p>
              )}

              <button
                type="submit"
                id="btn-execute-login"
                className="w-full py-3 bg-emerald-750 hover:bg-emerald-800 bg-emerald-750 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Masuk ke Portal RAB
              </button>
            </form>

            <div className="h-px bg-slate-100 my-1"></div>

            {/* Info help details without demo labels */}
            <div className="p-3 bg-slate-50 border border-slate-205 border-slate-200 rounded-xl space-y-2 text-[11px]" id="info-credentials">
              <span className="text-slate-700 font-bold block flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-700" /> Panduan Akses Cepat Al-Achdan:
              </span>
              <ul className="space-y-1 text-slate-500 font-mono text-[10px]">
                <li>&bull; Akun Panitia Admin: <strong>admin</strong> (sandi: <strong>admin123</strong>)</li>
                <li>&bull; Akun Unit Madrasah: <strong>madrasah</strong> (sandi: <strong>madrasah123</strong>)</li>
                <li>&bull; Akun Unit PAUD: <strong>paud</strong> (sandi: <strong>paud123</strong>)</li>
              </ul>
            </div>
          </div>

          {/* Persistent watermark at Login */}
          <div className="mt-8 text-white/50 text-xs font-medium tracking-wide flex flex-col items-center gap-1" id="login-footer-credits">
            <span>Sistem Informasi Penyusunan & Verifikasi Anggaran Madrasah Al-Achdan</span>
            <span className="font-semibold text-white/70">Made by : Nandi Achdarizal Sutisna</span>
          </div>
        </div>
      ) : (
        // 2. MAIN LOGGED-IN SITE LAYOUT (HIGH DENSITY THEME)
        <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden" id="main-app-shell-logged">
          
          {/* LEFT SIDEBAR (Desktop) */}
          <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 shadow-xl border-r border-slate-800" id="desktop-sidebar">
            <div className="p-5 flex flex-col items-center border-b border-slate-800/80" id="sidebar-header-brand">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-2.5 shadow-lg shrink-0 overflow-hidden" id="sidebar-logo-box">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white font-bold text-xl font-mono">AA</span>
                )}
              </div>
              <h1 className="text-white font-black text-xs tracking-widest uppercase text-center">AL-ACHDAN SYSTEM</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Budget Rekapitulasi</p>
            </div>
            
            <nav className="flex-1 py-4 overflow-y-auto text-xs space-y-4" id="sidebar-navigation">
              {currentUser.role === UserRole.ADMIN ? (
                <div id="admin-menu-section">
                  <div className="px-5 py-2 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Admin Menu</div>
                  <ul className="space-y-1 px-3">
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setAdminTab('diajukan'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && adminTab === 'diajukan'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-diajukan"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && adminTab === 'diajukan' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Anggaran Diajukan</span>
                      {budgets.filter(b => b.status === 'diajukan').length > 0 && (
                        <span className="ml-auto bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full font-black">
                          {budgets.filter(b => b.status === 'diajukan').length}
                        </span>
                      )}
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setAdminTab('verifikasi'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && adminTab === 'verifikasi'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-verifikasi"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && adminTab === 'verifikasi' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Verifikasi Anggaran</span>
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setAdminTab('realisasi'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && adminTab === 'realisasi'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-realisasi"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && adminTab === 'realisasi' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Anggaran Terealisasi</span>
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setAdminTab('hapus'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && adminTab === 'hapus'
                          ? 'bg-red-600/15 text-red-400 border-l-2 border-red-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-hapus"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && adminTab === 'hapus' ? 'bg-red-400' : 'bg-slate-600'}`}></span>
                      <span>Hapus Anggaran</span>
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setAdminTab('akun'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && adminTab === 'akun'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-akun"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && adminTab === 'akun' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Manajemen Akun</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div id="lembaga-menu-section">
                  <div className="px-5 py-2 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Lembaga Menu</div>
                  <ul className="space-y-1 px-3">
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setLembagaTab('pengajuan'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && lembagaTab === 'pengajuan'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-pengajuan"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && lembagaTab === 'pengajuan' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Pengajuan RAB Unit</span>
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setLembagaTab('monitoring'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && lembagaTab === 'monitoring'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-monitoring"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && lembagaTab === 'monitoring' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Monitoring Status</span>
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setLembagaTab('edit-hapus'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && lembagaTab === 'edit-hapus'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-edithapus"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && lembagaTab === 'edit-hapus' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Edit/Hapus Anggaran</span>
                    </li>
                    <li 
                      onClick={() => { setCurrentView('dashboard'); setLembagaTab('foto'); }}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                        currentView === 'dashboard' && lembagaTab === 'foto'
                          ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      id="sidebar-item-foto"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'dashboard' && lembagaTab === 'foto' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      <span>Upload Dokumentasi</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="h-px bg-slate-800/60 my-2 mx-4"></div>
              
              <div id="general-menu-section">
                <div className="px-5 py-2 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Sistem</div>
                <ul className="space-y-1 px-3">
                  <li 
                    onClick={() => setCurrentView('settings')}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer font-semibold transition-all ${
                      currentView === 'settings'
                        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500' 
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    id="sidebar-item-settings"
                  >
                    <Settings size={14} className="text-slate-500 shrink-0" />
                    <span>Pengaturan Akun & Logo</span>
                  </li>
                  <li 
                    onClick={handleLogout}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-md cursor-pointer text-red-400 hover:bg-red-950/20 hover:text-red-300 font-semibold transition-all"
                    id="sidebar-item-logout"
                  >
                    <LogOut size={14} className="text-red-400 shrink-0" />
                    <span>Keluar Portal</span>
                  </li>
                </ul>
              </div>
            </nav>

            <div className="p-4 border-t border-slate-800/80 bg-slate-950/20" id="sidebar-footer">
              <div className="text-[10px] text-zinc-400 font-semibold truncate block">Unit: {currentUser.institutionName}</div>
              <div className="text-[9px] text-slate-600 font-mono italic mt-1 block">Made by : Nandi Achdarizal Sutisna</div>
            </div>
          </aside>

          {/* MOBILE SIDEBAR DRAWER OVERLAY */}
          {mobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs" id="mobile-sidebar-overlay">
              <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full animate-slide-in" id="mobile-sidebar">
                <div className="p-5 flex items-center justify-between border-b border-slate-800" id="mobile-sidebar-header">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">AA</span>
                    </div>
                    <div>
                      <h1 className="text-white font-bold text-xs tracking-wide">AL-ACHDAN</h1>
                      <p className="text-[8px] text-slate-500">Sistem Anggaran</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <nav className="flex-1 py-4 overflow-y-auto text-xs space-y-4" id="mobile-sidebar-nav">
                  {currentUser.role === UserRole.ADMIN ? (
                    <div id="mobile-admin-tablist">
                      <div className="px-5 py-1.5 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Admin Menu</div>
                      <ul className="space-y-1 px-3">
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setAdminTab('diajukan'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${adminTab === 'diajukan' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Anggaran Diajukan
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setAdminTab('verifikasi'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${adminTab === 'verifikasi' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Verifikasi Anggaran
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setAdminTab('realisasi'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${adminTab === 'realisasi' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Anggaran Terealisasi
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setAdminTab('hapus'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${adminTab === 'hapus' && currentView === 'dashboard' ? 'bg-red-650 bg-red-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Hapus Anggaran
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setAdminTab('akun'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${adminTab === 'akun' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Manajemen Akun
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div id="mobile-user-tablist">
                      <div className="px-5 py-1.5 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Lembaga Menu</div>
                      <ul className="space-y-1 px-3">
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setLembagaTab('pengajuan'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${lembagaTab === 'pengajuan' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Pengajuan RAB Unit
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setLembagaTab('monitoring'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${lembagaTab === 'monitoring' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Monitoring Status
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setLembagaTab('edit-hapus'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${lembagaTab === 'edit-hapus' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Edit/Hapus Anggaran
                        </li>
                        <li 
                          onClick={() => { setCurrentView('dashboard'); setLembagaTab('foto'); setMobileSidebarOpen(false); }}
                          className={`flex items-center px-3 py-2 rounded cursor-pointer ${lembagaTab === 'foto' && currentView === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                        >
                          Upload Dokumentasi
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="h-px bg-slate-800 my-2 mx-4"></div>
                  
                  <div className="px-5 py-1.5 uppercase text-[9px] font-bold text-slate-500 tracking-wider">Sistem</div>
                  <ul className="space-y-1 px-3">
                    <li 
                      onClick={() => { setCurrentView('settings'); setMobileSidebarOpen(false); }}
                      className={`flex items-center px-3 py-2 rounded cursor-pointer ${currentView === 'settings' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
                    >
                      Pengaturan Akun & Logo
                    </li>
                    <li 
                      onClick={() => { setMobileSidebarOpen(false); handleLogout(); }}
                      className="flex items-center px-3 py-2 rounded cursor-pointer text-red-400 hover:bg-slate-800"
                    >
                      Keluar Portal
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}

          {/* MAIN COLUMN WRAPPER */}
          <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0" id="main-content-window-col">
            
            {/* TOP HIGH DENSITY HEADER */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-xs z-30" id="main-top-header">
              <div className="flex items-center space-x-3" id="header-brand-pane">
                <button 
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded text-slate-600 mr-1"
                  title="Menu Samping"
                >
                  <Menu size={18} />
                </button>
                
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight" id="header-view-title">
                  {currentView === 'settings' 
                    ? 'Manajemen Pengaturan Akun' 
                    : currentUser.role === UserRole.ADMIN 
                      ? `Verifikasi Anggaran Diajukan (${adminTab === 'diajukan' ? 'Draft Baru' : adminTab.toUpperCase()})` 
                      : `Unit Kerja: ${currentUser.institutionName}`}
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold whitespace-nowrap hidden sm:inline-block border border-emerald-200/50">
                  Aktif: Perpisahan 2026/2027
                </span>
              </div>
              
              <div className="flex items-center space-x-2.5 sm:space-x-3" id="header-profile-action">
                {/* Print templates size help bar */}
                <span className="text-[10px] text-slate-400 hidden lg:inline-block font-mono bg-slate-100 px-2 py-1 rounded">
                  Format Cetak Pas: <strong>A4</strong> / <strong>F4</strong>
                </span>

                <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-black text-slate-800 leading-tight block">{currentUser.institutionName}</p>
                    <p className="text-[9px] text-slate-500 font-mono tracking-tighter block">{currentUser.role === UserRole.ADMIN ? 'Panitia Inti Keuangan' : 'Lembaga Pemohon'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-250 border-slate-200 text-blue-600 font-bold text-xs flex items-center justify-center select-none" id="avatar-circle">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
            </header>

            {/* LOWER CONTENT AREA - WITH SIDEBAR NAVIGATION SYNC */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50" id="workspace-scrollable-container">
              {currentView === 'settings' ? (
                <AccountSettings
                  currentUser={currentUser}
                  accounts={accounts}
                  setAccounts={setAccounts}
                  logoUrl={logoUrl}
                  setLogoUrl={setLogoUrl}
                  logoName={logoName}
                  setLogoName={setLogoName}
                />
              ) : currentUser.role === UserRole.ADMIN ? (
                <AdminPanel
                  budgets={budgets}
                  accounts={accounts}
                  setBudgets={setBudgets}
                  setAccounts={setAccounts}
                  currentUser={currentUser}
                  logoUrl={logoUrl}
                  activeTab={adminTab}
                  setActiveTab={setAdminTab}
                />
              ) : (
                <LembagaPanel
                  budgets={budgets}
                  setBudgets={setBudgets}
                  currentUser={currentUser}
                  logoUrl={logoUrl}
                  activeTab={lembagaTab}
                  setActiveTab={setLembagaTab}
                />
              )}
            </div>

            {/* COMPACT NOTIFICATION WATERMARK BANNER (FLOATING AESTHETIC HIGHLIGHT) */}
            <div className="shrink-0 bg-slate-900 border-t border-slate-800 text-slate-400 text-[10px] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-1.5" id="compact-footer-banner">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Sistem Real-Time. Perubahan data otomatis terekam di hard disk local secara otomatis.</span>
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                Sesi User: {currentUser.username.toUpperCase()} | Sisa Sesi: 24 jam
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
