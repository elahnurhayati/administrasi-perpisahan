import React, { useState } from 'react';
import { 
  Plus, Trash2, Check, X, FileText, CheckCircle2, 
  XCircle, Coins, Users, Download, Printer, Eye, Upload, AlertCircle
} from 'lucide-react';
import { RABBudget, UserAccount, UserRole, RABItem } from '../types';
import { formatRupiah, formatDateIndonesian, exportToExcel, exportToWord } from '../utils/export';

interface AdminPanelProps {
  budgets: RABBudget[];
  accounts: UserAccount[];
  setBudgets: React.Dispatch<React.SetStateAction<RABBudget[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser: UserAccount;
  logoUrl: string;
  activeTab?: 'diajukan' | 'verifikasi' | 'realisasi' | 'hapus' | 'akun';
  setActiveTab?: (tab: 'diajukan' | 'verifikasi' | 'realisasi' | 'hapus' | 'akun') => void;
}

export default function AdminPanel({
  budgets,
  accounts,
  setBudgets,
  setAccounts,
  currentUser,
  logoUrl,
  activeTab: controlledTab,
  setActiveTab: setControlledTab,
}: AdminPanelProps) {
  const [localTab, setLocalTab] = useState<'diajukan' | 'verifikasi' | 'realisasi' | 'hapus' | 'akun'>('diajukan');
  const activeTab = controlledTab ?? localTab;
  const setActiveTab = setControlledTab ?? setLocalTab;
  
  // Dialog state for Rejection
  const [rejectingBudgetId, setRejectingBudgetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Detail views
  const [viewingBudget, setViewingBudget] = useState<RABBudget | null>(null);
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'F4'>('A4');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // New account form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Count indicators for status badge numbers
  const countDiajukan = budgets.filter(b => b.status === 'diajukan').length;
  const countRealized = budgets.filter(b => b.status === 'terealisasi').length;

  // -- LOGIC: Approve Budget
  const handleApprove = (id: string, customNote?: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === id) {
        const timestamp = new Date().toISOString();
        return {
          ...budget,
          status: 'disetujui',
          updatedAt: timestamp,
          timeline: [
            ...budget.timeline,
            {
              id: `tl-approve-${Date.now()}`,
              stage: 'Verifikasi Anggaran',
              status: 'disetujui',
              timestamp,
              actor: 'Admin / Bendahara',
              notes: customNote || 'Anggaran disetujui untuk perolehan barang/jasa.',
            }
          ]
        };
      }
      return budget;
    }));
    // If viewing budget is open, sync it
    if (viewingBudget && viewingBudget.id === id) {
      setViewingBudget(prev => prev ? { ...prev, status: 'disetujui' } : null);
    }
  };

  // -- LOGIC: Reject Budget
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBudgetId) return;
    
    setBudgets(prev => prev.map(budget => {
      if (budget.id === rejectingBudgetId) {
        const timestamp = new Date().toISOString();
        return {
          ...budget,
          status: 'ditolak',
          rejectionReason: rejectionReason,
          updatedAt: timestamp,
          timeline: [
            ...budget.timeline,
            {
              id: `tl-reject-${Date.now()}`,
              stage: 'Verifikasi Anggaran',
              status: 'ditolak',
              timestamp,
              actor: 'Admin / Bendahara',
              notes: `Ditolak: ${rejectionReason}`,
            }
          ]
        };
      }
      return budget;
    }));

    // If viewing budget matches
    if (viewingBudget && viewingBudget.id === rejectingBudgetId) {
      setViewingBudget(prev => prev ? { ...prev, status: 'ditolak', rejectionReason } : null);
    }

    setRejectingBudgetId(null);
    setRejectionReason('');
  };

  // -- LOGIC: Mark as Realized
  const handleMarkRealized = (id: string, realizationNotes?: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === id) {
        const timestamp = new Date().toISOString();
        return {
          ...budget,
          status: 'terealisasi',
          updatedAt: timestamp,
          timeline: [
            ...budget.timeline,
            {
              id: `tl-realize-${Date.now()}`,
              stage: 'Realisasi Anggaran',
              status: 'terealisasi',
              timestamp,
              actor: 'Admin / Bendahara',
              notes: realizationNotes || 'Dana dicairkan. Anggaran terealisasi sepenuhnya.',
            }
          ]
        };
      }
      return budget;
    }));

    if (viewingBudget && viewingBudget.id === id) {
      setViewingBudget(prev => prev ? { ...prev, status: 'terealisasi' } : null);
    }
  };

  // -- LOGIC: Delete Budget (Tab 4: Hapus Anggaran)
  const handleDeleteBudget = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengajuan anggaran ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.')) {
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      if (viewingBudget && viewingBudget.id === id) {
        setViewingBudget(null);
      }
    }
  };

  // -- LOGIC: Add Account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess('');

    if (!newUsername.trim() || !newPassword.trim() || !newInstitution.trim()) {
      setAccountError('Semua kolom akun harus diisi!');
      return;
    }

    const usernameLower = newUsername.trim().toLowerCase();
    const isExist = accounts.some(acc => acc.username.toLowerCase() === usernameLower);
    if (isExist) {
      setAccountError('Username sudah terdaftar! Gunakan username unik lain.');
      return;
    }

    const newAcc: UserAccount = {
      id: `u-${Date.now()}`,
      username: usernameLower,
      password: newPassword,
      role: newRole,
      institutionName: newInstitution,
      createdAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAcc]);
    setAccountSuccess(`Akun "${newUsername}" berhasil dibuat untuk ${newInstitution}!`);
    setNewUsername('');
    setNewPassword('');
    setNewInstitution('');
  };

  // -- LOGIC: Delete Account
  const handleDeleteAccount = (id: string, username: string) => {
    if (username === 'admin') {
      alert('Akun admin utama tidak dapat dihapus!');
      return;
    }
    if (window.confirm(`Hapus akun "${username}"? Pengguna ini tidak akan bisa login lagi.`)) {
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  };

  // Total Summary stats
  const totalProposed = budgets.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalRealizedAmount = budgets.filter(b => b.status === 'terealisasi').reduce((acc, b) => acc + b.totalAmount, 0);
  const totalApprovedAmount = budgets.filter(b => b.status === 'disetujui').reduce((acc, b) => acc + b.totalAmount, 0);
  const totalPendingAmount = budgets.filter(b => b.status === 'diajukan').reduce((acc, b) => acc + b.totalAmount, 0);

  // Filter budgets for active tab display
  const submittedBudgets = budgets.filter(b => b.status === 'diajukan');
  const allVerifikasiBudgets = budgets.filter(b => b.status === 'diajukan' || b.status === 'disetujui' || b.status === 'ditolak');
  const realizedBudgets = budgets.filter(b => b.status === 'terealisasi');

  // Trigger system Print View
  const handleTriggerPrint = (budget: RABBudget) => {
    setViewingBudget(budget);
    setPrintPaperSize('A4');
    setShowPrintModal(true);
  };

  const executeSystemPrint = () => {
    const printContent = document.getElementById('printable-area-container');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up browser diaktifkan.');
      return;
    }

    // Capture CSS styles
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    const doubleLineStyle = 'border-top: 1px solid #000; border-bottom: 3px double #000; height: 4px; margin: 10px 0;';

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak RAB Al-Achdan</title>
          ${styles}
          <style>
            @page {
              size: ${printPaperSize === 'A4' ? '21cm 29.7cm' : '21.5cm 33.0cm'};
              margin: 1.5cm;
            }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              color: black; 
              background-color: white; 
              font-size: 11pt;
            }
            .no-print { display: none !important; }
            .kop-container { text-align: center; line-height: 1.25; margin-bottom: 5px; }
            .kop-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; }
            .kop-subtitle { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #115e59; }
            .kop-address { font-size: 9.5pt; font-style: italic; margin: 0; }
            .double-line { ${doubleLineStyle} }
            .doc-title { font-size: 13pt; font-weight: bold; text-align: center; text-decoration: underline; margin-top: 15px; margin-bottom: 3px; }
            .doc-sub { font-size: 11pt; font-weight: bold; text-align: center; margin-bottom: 15px; }
            .meta-grid { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
            .meta-grid td { padding: 3px 0; vertical-align: top; font-size: 10.5pt; }
            .rab-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .rab-table th, .rab-table td { border: 1px solid black; padding: 6px; font-size: 10.5pt; }
            .rab-table th { background-color: #f3f4f6 !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .signature-table { width: 100%; border-collapse: collapse; margin-top: 35px; }
            .signature-cell { width: 33%; text-align: center; vertical-align: top; font-size: 10.5pt; }
            .watermark-text { 
              font-size: 8.5pt; 
              color: #71717a; 
              text-align: right; 
              margin-top: 45px; 
              border-top: 1px dotted #ccc;
              padding-top: 3px;
              font-style: italic;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="admin-main-grid">
      {/* Sidebar Stats and Controls */}
      <div className="lg:col-span-1 space-y-4" id="admin-summary-sidebar">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80" id="card-stats-ringkasan">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2 mb-3 border-b border-slate-150">
            Ringkasan Keuangan Utama
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-50/50 p-3 border border-emerald-100/50" id="stat-realisasi">
              <span className="text-[10px] text-emerald-800 font-semibold block">Total Anggaran Terealisasi</span>
              <span className="text-lg font-black text-emerald-950 block mt-0.5 leading-none">
                {formatRupiah(totalRealizedAmount)}
              </span>
              <div className="w-full bg-emerald-200/50 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalProposed > 0 ? (totalRealizedAmount / totalProposed) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[9px] text-emerald-800 font-mono mt-1 block text-right font-bold">
                {totalProposed > 0 ? ((totalRealizedAmount / totalProposed) * 100).toFixed(1) : 0}% Relisasi
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="bg-blue-50/50 rounded-lg p-2.5 border border-blue-105" id="stat-disetujui">
                <span className="text-[9.5px] text-blue-800 block font-semibold leading-tight">Disetujui (Menanti Payout)</span>
                <span className="text-sm font-black text-blue-950 block mt-0.5">
                  {formatRupiah(totalApprovedAmount)}
                </span>
              </div>
              <div className="bg-amber-50/70 rounded-lg p-2.5 border border-amber-100" id="stat-diajukan-total">
                <span className="text-[9.5px] text-amber-800 block font-semibold leading-tight">Menunggu Verifikasi</span>
                <span className="text-sm font-black text-amber-950 block mt-0.5">
                  {formatRupiah(totalPendingAmount)}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-150" id="stat-usul-total">
                <span className="text-[9.5px] text-slate-500 block leading-tight">Total Pengajuan Masuk (All)</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {formatRupiah(totalProposed)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Watermark Badge */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 text-center" id="card-creator-watermark">
          <span className="text-[10px] text-slate-500 block font-semibold">Beban Kerja & Penanggung Jawab</span>
          <p className="text-xs font-black text-slate-800 mt-0.5">Nandi Achdarizal Sutisna</p>
          <div className="h-px bg-slate-200 my-1.5"></div>
          <p className="text-[8.5px] text-slate-400 font-mono">PANITIA PERPISAHAN AKBAR &copy; 2026</p>
        </div>
      </div>

      {/* Main Admin Tabbed Dashboard Area */}
      <div className="lg:col-span-3 space-y-4" id="admin-main-dashboard">
        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap gap-1" id="admin-navbar-tabs">
          <button
            id="tab-btn-diajukan"
            onClick={() => setActiveTab('diajukan')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 relative ${
              activeTab === 'diajukan' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText size={12} />
            Anggaran Diajukan
            {countDiajukan > 0 && (
              <span className="bg-amber-500 text-white text-[9px] h-3.5 min-w-3.5 px-1 rounded-full flex items-center justify-center font-bold absolute -top-1.5 -right-1 animate-pulse">
                {countDiajukan}
              </span>
            )}
          </button>

          <button
            id="tab-btn-verifikasi"
            onClick={() => setActiveTab('verifikasi')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'verifikasi' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={12} />
            Verifikasi Anggaran
          </button>

          <button
            id="tab-btn-realisasi"
            onClick={() => setActiveTab('realisasi')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'realisasi' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Coins size={12} />
            Anggaran Terealisasi
          </button>

          <button
            id="tab-btn-hapus"
            onClick={() => setActiveTab('hapus')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'hapus' 
                ? 'bg-red-605 bg-red-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Trash2 size={12} />
            Hapus Anggaran
          </button>

          <button
            id="tab-btn-akun"
            onClick={() => setActiveTab('akun')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'akun' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={12} />
            Kelola Akun
          </button>
        </div>

        {/* TAB CONTENT: 1. Anggaran yang Diajukan */}
        {activeTab === 'diajukan' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-5" id="admin-content-diajukan">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100" id="header-diajukan">
              <div>
                <h2 className="text-base font-bold text-slate-800">Antrean Anggaran diusulkan</h2>
                <p className="text-xs text-slate-500">Seluruh berkas pengajuan RAB dari Unit Lembaga yang terdaftar masuk disini.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {submittedBudgets.length} Berkas Menanti
              </span>
            </div>

            {submittedBudgets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="diajukan-empty-state">
                <FileText className="mx-auto text-slate-300 mb-3" size={36} />
                <p className="text-sm font-semibold text-slate-600">Alhamdulillah, Tidak ada pengajuan baru</p>
                <p className="text-xs text-slate-400 mt-1">Seluruh pengajuan RAB saat ini telah selesai diverifikasi.</p>
              </div>
            ) : (
              <div className="space-y-4" id="diajukan-list">
                {submittedBudgets.map(budget => (
                  <div key={budget.id} className="p-4 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all bg-slate-50/50" id={`budget-card-diajukan-${budget.id}`}>
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                          {budget.institutionName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{budget.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Diusulkan pada {formatDateIndonesian(budget.submittedAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Total Estimasi</span>
                        <span className="text-sm font-black text-emerald-800">{formatRupiah(budget.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200 my-3"></div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        Terdiri dari <strong>{budget.items.length}</strong> urgen rincian barang/jasa.
                      </span>
                      <div className="flex gap-2">
                        <button
                          id={`btn-view-${budget.id}`}
                          onClick={() => setViewingBudget(budget)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Detail RAB
                        </button>
                        <button
                          id={`btn-go-verify-${budget.id}`}
                          onClick={() => {
                            setActiveTab('verifikasi');
                            // Scroll or direct action
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg inline-flex items-center gap-1"
                        >
                          Proses Verifikasi <CheckCircle2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 2. Verifikasi Anggaran */}
        {activeTab === 'verifikasi' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-5" id="admin-content-verifikasi">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100" id="header-verifikasi">
              <div>
                <h2 className="text-base font-bold text-slate-800">Verifikasi dan Validasi Kelayakan RAB</h2>
                <p className="text-xs text-slate-500">Review mendalam terhadap butir rincian anggaran. Berikan persetujuan atau lakukan negosiasi.</p>
              </div>
            </div>

            {allVerifikasiBudgets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="verifikasi-empty-state">
                <CheckCircle2 className="mx-auto text-slate-300 mb-3" size={36} />
                <p className="text-sm font-semibold text-slate-600">Belum ada pengajuan untuk diverifikasi</p>
                <p className="text-xs text-slate-400 mt-1">Silakan minta ketua pengusul lembaga untuk mengirim rancangan anggaran.</p>
              </div>
            ) : (
              <div className="space-y-4" id="verifikasi-list">
                {allVerifikasiBudgets.map(budget => (
                  <div key={budget.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/50" id={`budget-card-verifikasi-${budget.id}`}>
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <div>
                        <span className="inline-block bg-slate-200 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                          {budget.institutionName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{budget.title}</h4>
                        <p className="text-[11px] text-slate-500">Tanggal pengiriman: {formatDateIndonesian(budget.submittedAt)}</p>
                      </div>
                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          budget.status === 'diajukan' ? 'bg-amber-100 text-amber-800' :
                          budget.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {budget.status === 'diajukan' ? 'Perlu Keputusan' : budget.status}
                        </span>
                        <div className="text-right mt-1">
                          <span className="text-base font-black text-slate-800">{formatRupiah(budget.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Simple view layout details */}
                    <div className="bg-white rounded-lg p-3 border border-slate-100 mb-4 text-xs" id={`summary-items-${budget.id}`}>
                      <h5 className="font-semibold text-slate-700 mb-2">Item Usulan:</h5>
                      <ul className="space-y-1.5">
                        {budget.items.map((item, i) => (
                          <li key={item.id} className="flex justify-between text-slate-600">
                            <span>{i+1}. {item.name} ({item.quantity} {item.unit} &times; {formatRupiah(item.price)})</span>
                            <span className="font-medium text-slate-800">{formatRupiah(item.quantity * item.price)}</span>
                          </li>
                        ))}
                      </ul>
                      {budget.notes && (
                        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100 text-slate-500 italic">
                          "{budget.notes}"
                        </div>
                      )}
                    </div>

                    {/* Verification Actions */}
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex gap-1.5">
                        <button
                          id={`btn-excel-verify-${budget.id}`}
                          onClick={() => exportToExcel(budget, 'A4')}
                          className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[10.5px] font-semibold text-slate-700 inline-flex items-center gap-1"
                          title="Ekspor ke Excel"
                        >
                          <Download size={11} /> Excel A4
                        </button>
                        <button
                          id={`btn-word-verify-${budget.id}`}
                          onClick={() => exportToWord(budget, 'A4')}
                          className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[10.5px] font-semibold text-slate-700 inline-flex items-center gap-1"
                          title="Ekspor ke Word"
                        >
                          <Download size={11} /> Word A4
                        </button>
                        <button
                          id={`btn-print-verify-${budget.id}`}
                          onClick={() => handleTriggerPrint(budget)}
                          className="p-1 px-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 rounded text-[10.5px] font-semibold inline-flex items-center gap-1"
                          title="Buka Lembar Cetak A4/F4"
                        >
                          <Printer size={11} /> Print A4/F4
                        </button>
                      </div>

                      {budget.status === 'diajukan' ? (
                        <div className="flex gap-2">
                          <button
                            id={`btn-reject-trigger-${budget.id}`}
                            onClick={() => {
                              setRejectingBudgetId(budget.id);
                              setRejectionReason('');
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg inline-flex items-center gap-1"
                          >
                            <X size={13} /> Tolak Anggaran
                          </button>
                          <button
                            id={`btn-approve-trigger-${budget.id}`}
                            onClick={() => {
                              if (window.confirm(`Setujui anggaran "${budget.title}" dengan total ${formatRupiah(budget.totalAmount)}?`)) {
                                handleApprove(budget.id);
                              }
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg inline-flex items-center gap-1"
                          >
                            <Check size={13} /> Setujui Anggaran
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {budget.status === 'disetujui' && (
                            <button
                              id={`btn-realize-trigger-${budget.id}`}
                              onClick={() => {
                                if (window.confirm(`Cairkan dana dan tandai anggaran "${budget.title}" telah Terealisasi?`)) {
                                  handleMarkRealized(budget.id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <Coins size={13} /> Realisasikan Anggaran (Selesai Cair)
                            </button>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            Diverifikasi pada {formatDateIndonesian(budget.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 3. Anggaran Terealisasi */}
        {activeTab === 'realisasi' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-5" id="admin-content-realisasi">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100" id="header-realisasi">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-sans">Anggaran Terealisasikan (Dana Berhasil Cair)</h2>
                <p className="text-xs text-slate-500">Menyajikan daftar anggaran yang telah dipayout / direalisasikan oleh Komite Keuangan Al-Achdan.</p>
              </div>
              <span className="bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                {realizedBudgets.length} Terealisasi
              </span>
            </div>

            {realizedBudgets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="realisasi-empty-state">
                <Coins className="mx-auto text-slate-300 mb-3" size={36} />
                <p className="text-sm font-semibold text-slate-600">Belum ada anggaran yang direalisasikan</p>
                <p className="text-xs text-slate-400 mt-1">Gunakan tab "Verifikasi Anggaran" untuk menyetujui dan merealisasikan anggaran yang lolos seleksi.</p>
              </div>
            ) : (
              <div className="space-y-4" id="realisasi-list">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex items-center justify-between" id="realisasi-quick-stats">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-emerald-700" />
                    <span className="text-xs font-semibold text-emerald-900">Total Kebutuhan Tercairkan (Tunai):</span>
                  </div>
                  <span className="text-lg font-black text-emerald-800">{formatRupiah(totalRealizedAmount)}</span>
                </div>

                {realizedBudgets.map(budget => (
                  <div key={budget.id} className="p-4 border border-slate-100 bg-slate-50 rounded-xl" id={`budget-card-realisasi-${budget.id}`}>
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <span className="inline-block bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                          {budget.institutionName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{budget.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Selesai Realisasi: {formatDateIndonesian(budget.updatedAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total Payout</span>
                        <span className="text-sm font-black text-slate-800">{formatRupiah(budget.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200 my-3"></div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                        Status Lunas Realisasi (Komite Perpisahan)
                      </span>
                      <div className="flex gap-2">
                        <button
                          id={`btn-view-realize-${budget.id}`}
                          onClick={() => setViewingBudget(budget)}
                          className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> Detail
                        </button>
                        <button
                          id={`btn-excel-realize-${budget.id}`}
                          onClick={() => exportToExcel(budget, 'A4')}
                          className="p-1 px-2 border border-slate-200 hover:bg-slate-50 rounded text-xs font-medium inline-flex items-center gap-0.5 bg-white"
                        >
                          <Download size={11} /> Excel A4
                        </button>
                        <button
                          id={`btn-print-realize-${budget.id}`}
                          onClick={() => handleTriggerPrint(budget)}
                          className="p-1 px-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded text-xs font-medium inline-flex items-center gap-0.5"
                        >
                          <Printer size={11} /> Cetak F4/A4
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 4. Hapus Anggaran (Fungsi Kelola Mutlak Admin) */}
        {activeTab === 'hapus' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-red-100 space-y-5" id="admin-content-remove">
            <div className="pb-2 border-b border-red-100" id="header-remove">
              <h2 className="text-base font-bold text-red-700 flex items-center gap-2">
                <Trash2 size={18} /> Pembersihan dan Penghapusan Berkas RAB
              </h2>
              <p className="text-xs text-slate-500 mt-1">Halaman kontrol darurat. Admin dapat menghapus segala jenis pengajuan anggaran yang salah input, dobel atau usang dari memori sistem.</p>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="hapus-empty-state">
                <p className="text-sm font-semibold text-slate-500">Tidak ada anggaran di database saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3" id="hapus-list">
                {budgets.map(budget => (
                  <div key={budget.id} className="p-3.5 border border-red-100 hover:bg-red-50/30 rounded-xl flex items-center justify-between gap-4 transition-all" id={`budget-card-remove-${budget.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9.5px] bg-slate-200 text-slate-800 px-2 py-0.2 rounded font-semibold whitespace-nowrap">
                          {budget.institutionName}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 rounded uppercase ${
                          budget.status === 'diajukan' ? 'bg-amber-100 text-amber-800' :
                          budget.status === 'disetujui' ? 'bg-indigo-100 text-indigo-800' :
                          budget.status === 'terealisasi' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {budget.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{budget.title}</h4>
                      <p className="text-[10.5px] text-slate-500">{formatRupiah(budget.totalAmount)} &bull; diusulkan {formatDateIndonesian(budget.submittedAt)}</p>
                    </div>

                    <button
                      id={`btn-execute-remove-${budget.id}`}
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg shrink-0 flex items-center gap-1 shadow-xs font-semibold text-xs"
                    >
                      <Trash2 size={13} /> Hapus Permanen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: 5. Menambahkan Akun untuk Login */}
        {activeTab === 'akun' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-100 space-y-6" id="admin-content-akun">
            <div className="pb-2 border-b border-emerald-100" id="header-akun">
              <h2 className="text-base font-bold text-slate-800">Menambahkan Akun Login Baru</h2>
              <p className="text-xs text-slate-500 mt-1">Mendaftarkan unit-unit lembaga baru (misal: Madrasah Tsanawiyah, PAUD, Kesekretariatan) untuk masuk dan membuat pengajuan RAB.</p>
            </div>

            {/* Account registration form */}
            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/55" id="register-account-form">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="input-new-username">Username Login</label>
                <input
                  id="input-new-username"
                  type="text"
                  placeholder="Contoh: mts_achdan"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="input-new-password">Kata Sandi / Password</label>
                <input
                  id="input-new-password"
                  type="password"
                  placeholder="Masukkan password akun baru"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="input-new-institution">Nama Unit / Lembaga Pengguna</label>
                <input
                  id="input-new-institution"
                  type="text"
                  placeholder="Contoh: Madrasah Aliyah (MA) Al-Achdan"
                  value={newInstitution}
                  onChange={e => setNewInstitution(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="select-new-role">Tingkat Otoritas / Hak Akses</label>
                <select
                  id="select-new-role"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value={UserRole.USER}>User (Lembaga Pengusul RAB)</option>
                  <option value={UserRole.ADMIN}>Admin Utama (Komite Verifikator)</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                {accountError && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1" id="account-error-msg">
                    <AlertCircle size={14} /> {accountError}
                  </p>
                )}
                {accountSuccess && (
                  <p className="text-xs text-emerald-700 font-semibold" id="account-success-msg">
                    {accountSuccess}
                  </p>
                )}
                <div className="sm:ml-auto">
                  <button
                    id="btn-regist-acc"
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-emerald-750 hover:bg-emerald-800 bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus size={14} /> Simpan Akun Pengguna
                  </button>
                </div>
              </div>
            </form>

            {/* List of Registered Accounts */}
            <div className="space-y-3" id="registered-accounts-section">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Daftar Akun Terdaftar</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200" id="accounts-table-container">
                <table className="w-full border-collapse text-left text-xs bg-white" id="accounts-table">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Username</th>
                      <th className="p-3">Per/Lembaga Nama</th>
                      <th className="p-3">Level Role</th>
                      <th className="p-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-50/50" id={`acc-row-${acc.id}`}>
                        <td className="p-3 font-semibold text-slate-800 font-mono">{acc.username}</td>
                        <td className="p-3 text-slate-600">{acc.institutionName}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            acc.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {acc.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {acc.username === 'admin' ? (
                            <span className="text-[10px] text-slate-400 font-medium">Bawaan Sistem</span>
                          ) : (
                            <button
                              id={`btn-del-acc-${acc.id}`}
                              onClick={() => handleDeleteAccount(acc.id, acc.username)}
                              className="p-1.5 text-red-650 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL BUDGET MODAL VIEW / DRAWER */}
      {viewingBudget && !showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs" id="detail-budget-modal-backdrop">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" id="detail-budget-modal">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-emerald-900 text-white rounded-t-2xl" id="model-header">
              <div>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded uppercase">
                  {viewingBudget.institutionName}
                </span>
                <h3 className="text-base font-bold mt-1">{viewingBudget.title}</h3>
                <p className="text-xs text-white/80 mt-1">Diusulkan: {formatDateIndonesian(viewingBudget.submittedAt)}</p>
              </div>
              <button
                id="btn-close-modal"
                onClick={() => setViewingBudget(null)}
                className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1" id="modal-body-content">
              {viewingBudget.status === 'ditolak' && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-xs" id="alert-rejection-reason">
                  <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-red-800">Alasan Penolakan Anggaran:</h5>
                    <p className="text-red-700 mt-1">{viewingBudget.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2" id="detail-items-section">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Rincian Barang & Estimasi</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden" id="modal-items-table-container">
                  <table className="w-full text-left text-xs border-collapse" id="modal-items-table">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-center" width="5%">No</th>
                        <th className="p-3" width="50%">Nama Barang/Layanan</th>
                        <th className="p-3 text-center" width="10%">Vol</th>
                        <th className="p-3 text-center" width="10%">Satuan</th>
                        <th className="p-3 text-right" width="25%">Harga Satuan</th>
                        <th className="p-3 text-right" width="25%">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingBudget.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/20" id={`modal-item-row-${item.id}`}>
                          <td className="p-3 text-center text-slate-400">{index + 1}</td>
                          <td className="p-3">
                            <div>
                              <span className="font-medium text-slate-800 text-xs block">{item.name}</span>
                              {item.photoUrl && (
                                <div className="mt-2" id={`item-photo-wrapper-${item.id}`}>
                                  <span className="text-[10px] text-slate-500 font-medium block mb-1">Foto Estimasi:</span>
                                  <img 
                                    src={item.photoUrl} 
                                    alt={item.name} 
                                    className="h-28 w-44 object-cover rounded-md border border-slate-200 shadow-xs hover:scale-105 transition-transform" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="p-3 text-center text-slate-600">{item.unit}</td>
                          <td className="p-3 text-right text-slate-600">{formatRupiah(item.price)}</td>
                          <td className="p-3 text-right font-semibold text-slate-800">
                            {formatRupiah(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-55/65 bg-slate-100 font-bold text-slate-800">
                        <td colSpan={5} className="p-3 text-right">JUMLAH TOTAL REKAPITULASI:</td>
                        <td className="p-3 text-right text-emerald-800 text-sm font-black">
                          {formatRupiah(viewingBudget.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingBudget.notes && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200" id="detail-notes">
                  <span className="text-[11px] font-bold text-slate-600 block">Catatan Pemohon:</span>
                  <p className="text-xs text-slate-500 italic">"{viewingBudget.notes}"</p>
                </div>
              )}

              {/* Real Timeline */}
              <div className="space-y-3" id="timeline-flow-section">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Alur Perjalanan Anggaran (Timeline)</h4>
                <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-4" id="timeline-steps">
                  {viewingBudget.timeline?.map((step) => (
                    <div key={step.id} className="relative" id={`timeline-step-${step.id}`}>
                      {/* Timeline dot */}
                      <span className={`absolute -left-[26px] top-1 w-3 H-3 h-3 rounded-full border-2 border-white ${
                        step.status === 'pengajuan' ? 'bg-indigo-505 bg-indigo-500' :
                        step.status === 'disetujui' ? 'bg-emerald-500' :
                        step.status === 'ditolak' ? 'bg-red-500' :
                        'bg-teal-500'
                      }`}></span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block">{step.stage}</span>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                          <span>{formatDateIndonesian(step.timestamp)}</span>
                          <span>&bull;</span>
                          <span>Oleh: {step.actor}</span>
                        </div>
                        {step.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-1.5 mt-1 border border-slate-100">
                            {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-between" id="modal-footer-controls">
              <div className="flex gap-1.5">
                <button
                  id="btn-modal-excel"
                  onClick={() => exportToExcel(viewingBudget, 'A4')}
                  className="px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Download size={13} /> Excel A4
                </button>
                <button
                  id="btn-modal-word"
                  onClick={() => exportToWord(viewingBudget, 'A4')}
                  className="px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Download size={13} /> Word A4
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-modal-print-layout"
                  onClick={() => handleTriggerPrint(viewingBudget)}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                >
                  <Printer size={13} /> Buka Cetak Kertas A4/F4
                </button>
                <button
                  id="btn-modal-close"
                  onClick={() => setViewingBudget(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG POPUP */}
      {rejectingBudgetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs" id="rejection-dialog-backdrop">
          <form onSubmit={handleRejectSubmit} className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4" id="rejection-form">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <XCircle className="text-red-600" size={18} /> Berikan Alasan Penolakan RAB
            </h3>
            <p className="text-xs text-slate-500">Tulis koreksi atau alasan penolakan secara jelas agar dapat dibaca oleh unit pengusul.</p>
            <textarea
              id="rejection-reason-textarea"
              required
              rows={3}
              placeholder="Contoh: Estimasi harga piala boneka terlalu tinggi dikoordinasikan kembali dengan panitia..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                id="btn-cancel-reject"
                type="button"
                onClick={() => setRejectingBudgetId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                id="btn-confirm-reject"
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-650 bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Kirim Penolakan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PAPER SIZER PRINT CONTROLLER & MODAL */}
      {showPrintModal && viewingBudget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 p-4 overflow-y-auto flex items-center justify-center backdrop-blur-xs" id="print-modal-backdrop">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 flex flex-col" id="print-modal-body">
            {/* Options Panel */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-wrap justify-between items-center gap-4" id="print-configs-panel">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase">Set Ukuran Kertas Pelaporan Resmi</h4>
                <p className="text-[11px] text-emerald-800">Format margins dan tabel akan dideklarasikan otomatis untuk ukuran kertas terpilih.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-white p-1 rounded-lg border border-emerald-200" id="print-paper-selector">
                  <button
                    id="btn-select-a4"
                    onClick={() => setPrintPaperSize('A4')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${
                      printPaperSize === 'A4' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A4 (Standar)
                  </button>
                  <button
                    id="btn-select-f4"
                    onClick={() => setPrintPaperSize('F4')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${
                      printPaperSize === 'F4' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    F4 (Folio Indonesia)
                  </button>
                </div>

                <button
                  id="btn-trigger-hardware-print"
                  onClick={executeSystemPrint}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 shadow-xs"
                >
                  <Printer size={13} /> Mulai Cetak PDF
                </button>
                <button
                  id="btn-close-print-preview"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Tutup Preview
                </button>
              </div>
            </div>

            {/* Simulated Live Sheet Template (Page layout preview) */}
            <div className="border border-slate-300 bg-slate-100 p-4 rounded-xl overflow-x-auto h-[50vh]" id="sheet-preview-scroller">
              <div 
                id="printable-area-container" 
                className="bg-white shadow-md mx-auto p-12 border border-slate-200 select-none text-black relative"
                style={{ 
                  width: '210mm', 
                  minHeight: printPaperSize === 'A4' ? '297mm' : '330mm',
                  fontSize: '11pt', 
                  fontFamily: 'Times New Roman, Times, serif',
                  lineHeight: '1.25'
                }}
              >
                {/* Official Letterhead */}
                <div className="kop-container text-center text-black border-b-[3px] border-b-black pb-1 mb-4" id="print-letterhead">
                  <span className="kop-title block text-base font-bold text-black tracking-wide">ORGANISASI PELAKSANA PERPISAHAN AKBAR SISWA</span>
                  <span className="kop-subtitle block text-lg font-black tracking-wider text-black mt-0.5">YAYASAN AL-ACHDAN SUKABUMI</span>
                  <span className="kop-address block text-[9.5pt] italic text-slate-800 mt-1">Sekretariat: Jl. Raya Al-Achdan Km. 5, Cigayung, Sukabumi | Email: panitia@al-achdan.org</span>
                  <div className="double-line mt-1.5"></div>
                </div>

                <p className="doc-title text-center font-bold font-sans text-sm underline tracking-wider uppercase">RENCANA ANGGARAN BIAYA (RAB) KEPANITIAAN</p>
                <p className="doc-sub text-center text-xs font-bold mt-1 uppercase">BAGIAN: {viewingBudget.title}</p>

                {/* Meta details */}
                <table className="meta-grid w-full text-xs text-black border-collapse my-4" id="print-meta-grid">
                  <tbody>
                    <tr>
                      <td width="25%" className="font-bold">Unit Pengaju / Lembaga</td>
                      <td width="3%">:</td>
                      <td width="72%">{viewingBudget.institutionName}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Tanggal Pengajuan</td>
                      <td>:</td>
                      <td>{formatDateIndonesian(viewingBudget.submittedAt)}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Ukuran Kertas Pelaporan</td>
                      <td>:</td>
                      <td>{printPaperSize === 'A4' ? 'A4 STANDAR (21.0 x 29.7 cm)' : 'F4 FOLIO INDONESIA (21.5 x 33.0 cm)'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Tingkat Verifikasi</td>
                      <td>:</td>
                      <td className="font-bold uppercase inline-block font-sans text-[10px]">{viewingBudget.status}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Items */}
                <table className="rab-table w-full text-xs border-collapse border border-black text-black" id="print-items-table">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-2 font-bold text-center" width="5%">No</th>
                      <th className="border border-black p-2 font-bold text-left" width="45%">Uraian Barang / Jasa Pelaksana</th>
                      <th className="border border-black p-2 font-bold text-center" width="10%">Vol</th>
                      <th className="border border-black p-2 font-bold text-center" width="10%">Satuan</th>
                      <th className="border border-black p-2 font-bold text-right" width="15%">Harga Satuan</th>
                      <th className="border border-black p-2 font-bold text-right" width="15%">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingBudget.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black p-2 text-center text-black">{index + 1}</td>
                        <td className="border border-black p-2 text-black">{item.name}</td>
                        <td className="border border-black p-2 text-center text-black">{item.quantity}</td>
                        <td className="border border-black p-2 text-center text-black">{item.unit}</td>
                        <td className="border border-black p-2 text-right text-black">{formatRupiah(item.price)}</td>
                        <td className="border border-black p-2 text-right font-bold text-black">{formatRupiah(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={5} className="border border-black p-2 text-right text-black">TOTAL KEBUTUHAN ANGGARAN:</td>
                      <td className="border border-black p-2 text-right font-black text-black border-b-[3px] border-b-black bg-slate-100">
                        {formatRupiah(viewingBudget.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {viewingBudget.notes && (
                  <div className="text-xs italic text-slate-800 mt-3 p-2 border border-slate-300 rounded" id="print-notes-desc">
                    <strong>Catatan Lampiran Pengaju:</strong><br />
                    "{viewingBudget.notes}"
                  </div>
                )}

                {/* Signatures */}
                <table className="signature-table w-full text-xs text-black border-collapse mt-10" id="print-signature-table">
                  <tbody>
                    <tr>
                      <td className="signature-cell">
                        Mengetahui,<br/>
                        <strong>Kepala Yayasan Al-Achdan</strong>
                        <br/><br/><br/><br/>
                        ( ____________________ )
                      </td>
                      <td className="signature-cell">
                        Menyetujui,<br/>
                        <strong>Ketua Panitia Perpisahan</strong>
                        <br/><br/><br/><br/>
                        ( ____________________ )
                      </td>
                      <td className="signature-cell">
                        Sukabumi, ${formatDateIndonesian(new Date().toISOString())}<br/>
                        <strong>Pengusul / Bendahara</strong>
                        <br/><br/><br/><br/>
                        ( ____________________ )
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Watermark */}
                <div className="watermark-text text-right text-[8.5pt] text-zinc-500 mt-14" id="print-watermark">
                  Made by : Nandi Achdarizal Sutisna &bull; SI RAB Perpisahan Al-Achdan &bull; (${printPaperSize} format)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
