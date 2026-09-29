import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, Check, X, FileText, 
  Clock, CheckCircle, XCircle, BarChart2, 
  Upload, Eye, Download, Printer, AlertCircle, Info, Trash
} from 'lucide-react';
import { RABBudget, RABItem, UserAccount } from '../types';
import { formatRupiah, formatDateIndonesian, exportToExcel, exportToWord } from '../utils/export';

interface LembagaPanelProps {
  budgets: RABBudget[];
  setBudgets: React.Dispatch<React.SetStateAction<RABBudget[]>>;
  currentUser: UserAccount;
  logoUrl: string;
  activeTab?: 'pengajuan' | 'monitoring' | 'edit-hapus' | 'foto';
  setActiveTab?: (tab: 'pengajuan' | 'monitoring' | 'edit-hapus' | 'foto') => void;
}

export default function LembagaPanel({
  budgets,
  setBudgets,
  currentUser,
  logoUrl,
  activeTab: controlledTab,
  setActiveTab: setControlledTab,
}: LembagaPanelProps) {
  const [localTab, setLocalTab] = useState<'pengajuan' | 'monitoring' | 'edit-hapus' | 'foto'>('pengajuan');
  const activeTab = controlledTab ?? localTab;
  const setActiveTab = setControlledTab ?? setLocalTab;
  
  // -- Active budgets filtered for CURRENT INSTITUTION username
  const myBudgets = budgets.filter(b => b.institutionId === currentUser.username);

  // --- STATE FOR NEW FORM ---
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<Omit<RABItem, 'id'>[]>([
    { name: '', quantity: 1, unit: 'Buah', price: 0, photoUrl: '' }
  ]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // --- STATE FOR EDITING ---
  const [editingBudget, setEditingBudget] = useState<RABBudget | null>(null);
  const [editSuccess, setEditSuccess] = useState('');

  // --- STATE FOR DETAILED VIEW ---
  const [viewingBudget, setViewingBudget] = useState<RABBudget | null>(null);
  
  // --- STATE FOR UPLOADING FOTO (AS COMPONENT INDEPENDENT ACTION) ---
  const [selectedBudgetForPhoto, setSelectedBudgetForPhoto] = useState<string>('');
  const [selectedItemForPhoto, setSelectedItemForPhoto] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers for Form Item Addition & Editing
  const addFormItem = () => {
    setFormItems(prev => [...prev, { name: '', quantity: 1, unit: 'Buah', price: 0, photoUrl: '' }]);
  };

  const removeFormItem = (index: number) => {
    if (formItems.length === 1) {
      alert('Minimal mengajukan 1 rincian item anggaran!');
      return;
    }
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateFormItemField = <K extends keyof Omit<RABItem, 'id'>>(index: number, field: K, value: Omit<RABItem, 'id'>[K]) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Convert File to Base64 Url string
  const handleItemPhotoUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateFormItemField(index, 'photoUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  // SUBMIT NEW RAB REQUEST
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formTitle.trim()) {
      setFormError('Judul Utama Program RAB wajib diisi!');
      return;
    }

    // Validate items
    const isValid = formItems.every(it => it.name.trim() && it.quantity > 0 && it.price >= 0);
    if (!isValid) {
      setFormError('Harap lengkapi seluruh kolom Uraian Barang, Volume, dan Harga Satuan!');
      return;
    }

    const calculatedTotal = formItems.reduce((acc, current) => acc + (current.quantity * current.price), 0);
    const timestamp = new Date().toISOString();
    
    const isMadrasah = currentUser.username === 'madrasah';
    const submissionId = `rab-${Date.now()}`;
    
    const newBudget: RABBudget = {
      id: submissionId,
      institutionId: currentUser.username,
      institutionName: currentUser.institutionName,
      title: formTitle.trim(),
      notes: formNotes.trim(),
      items: formItems.map((item, idx) => ({
        id: `it-${submissionId}-${idx}-${Date.now()}`,
        ...item
      })),
      totalAmount: calculatedTotal,
      status: 'diajukan', // Sends straight to "anggaran yang diajukan" / "verifikasi"
      submittedAt: timestamp,
      updatedAt: timestamp,
      timeline: [
        {
          id: `tl-${submissionId}-init`,
          stage: 'Pengajuan Anggaran',
          status: 'pengajuan',
          timestamp,
          actor: currentUser.institutionName,
          notes: formNotes.trim() || 'RAB diajukan secara resmi oleh unit kepanitiaan.',
        }
      ]
    };

    setBudgets(prev => [newBudget, ...prev]);
    setFormSuccess(`Sip! Pengajuan RAB "${formTitle}" berhasil dikirim ke Admin Komite untuk proses verifikasi.`);
    
    // Clear forms
    setFormTitle('');
    setFormNotes('');
    setFormItems([{ name: '', quantity: 1, unit: 'Buah', price: 0, photoUrl: '' }]);
  };

  // SAVE EDIT OF EXISTING RAB
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    if (!editingBudget.title.trim()) {
      alert('Judul tidak boleh kosong!');
      return;
    }

    const calculatedTotal = editingBudget.items.reduce((acc, current) => acc + (current.quantity * current.price), 0);
    const timestamp = new Date().toISOString();

    setBudgets(prev => prev.map(b => {
      if (b.id === editingBudget.id) {
        return {
          ...editingBudget,
          totalAmount: calculatedTotal,
          updatedAt: timestamp,
          timeline: [
            ...editingBudget.timeline,
            {
              id: `tl-edit-${Date.now()}`,
              stage: 'Pembaruan Berkas RAB (Edit)',
              status: b.status,
              timestamp,
              actor: currentUser.institutionName,
              notes: 'Rincian anggaran telah diperbarui oleh lembaga pemohon.',
            }
          ]
        };
      }
      return b;
    }));

    setEditSuccess('Perubahan RAB berhasil disimpan!');
    setTimeout(() => {
      setEditingBudget(null);
      setEditSuccess('');
      setActiveTab('monitoring'); // switch to status check
    }, 1200);
  };

  const handleEditItemField = <K extends keyof RABItem>(itemIndex: number, field: K, value: RABItem[K]) => {
    if (!editingBudget) return;
    const updatedItems = editingBudget.items.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, [field]: value };
      }
      return item;
    });

    setEditingBudget({
      ...editingBudget,
      items: updatedItems,
      totalAmount: updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
    });
  };

  // DELETE BUDGET OWNED BY ME
  const handleDeleteBudget = (id: string, title: string) => {
    if (window.confirm(`Hapus pengajuan RAB "${title}"? Data akan hilang dan ditarik dari panitia verifikator.`)) {
      setBudgets(prev => prev.filter(b => b.id !== id));
    }
  };

  // INDEPENDENT PHOTO UPLOADS (Tab 4: Upload Foto Barang)
  const handlePhotoSelectTrigger = (budgetId: string, itemId: string) => {
    setSelectedBudgetForPhoto(budgetId);
    setSelectedItemForPhoto(itemId);
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      injectPhotoIntoItem(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && selectedBudgetForPhoto && selectedItemForPhoto) {
      injectPhotoIntoItem(file);
    }
  };

  const injectPhotoIntoItem = (file: File) => {
    if (!selectedBudgetForPhoto || !selectedItemForPhoto) {
      alert('Harap pilih berkas anggaran dan rincian barang terlebih dahulu!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setBudgets(prev => prev.map(budget => {
        if (budget.id === selectedBudgetForPhoto) {
          const updatedItems = budget.items.map(it => {
            if (it.id === selectedItemForPhoto) {
              return { ...it, photoUrl: base64 };
            }
            return it;
          });
          return {
            ...budget,
            items: updatedItems
          };
        }
        return budget;
      }));
      alert('Foto bukti/estimasi berhasil diupload ke rincian barang!');
      // Reset targets
      setSelectedBudgetForPhoto('');
      setSelectedItemForPhoto('');
    };
    reader.readAsDataURL(file);
  };

  // Financial status calculations per Lembaga
  const myTotalProposed = myBudgets.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const myTotalApproved = myBudgets.filter(b => b.status === 'disetujui' || b.status === 'terealisasi').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const myTotalRealised = myBudgets.filter(b => b.status === 'terealisasi').reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="lembaga-main-grid">
      {/* Sidebar Quick Navigation & Stats */}
      <div className="lg:col-span-1 space-y-4" id="lembaga-sidebar">
        {/* Personal Stats card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80" id="card-lembaga-stats">
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Estimasi Dana Unit</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100/50" id="sidebar-cair">
              <span className="text-[9px] text-emerald-800/80 font-bold block">Total Cair (Realisasi)</span>
              <span className="text-sm font-black text-emerald-950 block mt-0.5">{formatRupiah(myTotalRealised)}</span>
            </div>
            <div className="p-2.5 bg-blue-50/50 border border-blue-100/40 rounded-lg" id="sidebar-disetujui">
              <span className="text-[9px] text-blue-800 block font-semibold">Total Disetujui Komite</span>
              <span className="text-sm font-black text-blue-950 block mt-0.5">{formatRupiah(myTotalApproved)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg" id="sidebar-diajukan">
              <span className="text-[9px] text-slate-500 block">Total Diusulkan (All)</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">{formatRupiah(myTotalProposed)}</span>
            </div>
          </div>
        </div>

        {/* Brand signature Watermark */}
        <div className="bg-slate-55 bg-slate-100/40 p-3.5 rounded-lg border border-slate-200/60 text-center" id="watermark-sidebar-brand">
          <p className="text-[10px] text-slate-500 font-semibold font-sans">Sistem Pertanggungjawaban RAB</p>
          <span className="text-[10px] font-black text-slate-800 mt-0.5 block">Nandi Achdarizal Sutisna</span>
          <p className="text-[8.5px] text-slate-400 font-mono mt-1">&copy; DIPA AL-ACHDAN 2026/2027</p>
        </div>
      </div>

      {/* Main interactive screen */}
      <div className="lg:col-span-3 space-y-4" id="lembaga-workspace">
        {/* Sub-menu local tabs */}
        <div className="bg-white p-1 rounded-xl shadow-xs border border-slate-200/80 flex flex-wrap gap-1" id="sub-menu-tabs-lembaga">
          <button
            id="sub-tab-pengajuan"
            onClick={() => { setActiveTab('pengajuan'); setEditingBudget(null); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'pengajuan' && !editingBudget
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={12} />
            Pengajuan Madrasah
          </button>

          <button
            id="sub-tab-monitoring"
            onClick={() => { setActiveTab('monitoring'); setEditingBudget(null); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'monitoring' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={12} />
            Monitoring Alur
          </button>

          <button
            id="sub-tab-edithapus"
            onClick={() => { setActiveTab('edit-hapus'); setEditingBudget(null); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'edit-hapus' || editingBudget
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit2 size={12} />
            Edit & Hapus
          </button>

          <button
            id="sub-tab-foto"
            onClick={() => { setActiveTab('foto'); setEditingBudget(null); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'foto' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Upload size={12} />
            Upload Foto
          </button>
        </div>

        {/* --- WORKSPACE TABS LOGIC --- */}
        
        {/* TAB 1: SUBMIT NEW RAB FORM */}
        {activeTab === 'pengajuan' && !editingBudget && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6" id="workspace-submitting-form">
            <div className="pb-2 border-b border-slate-105 border-slate-100" id="header-pengajuan-form">
              <h2 className="text-base font-bold text-slate-850 text-slate-800">1. Formulir Pengajuan RAB {currentUser.institutionName}</h2>
              <p className="text-xs text-slate-500">Gunakan form ini untuk merinci item kebutuhan perpisahan Al-Achdan. Isian akan langsung masuk antrean verifikasi pusat.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5" id="new-rab-form">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="form-judul">
                  Judul/Sub-Kegiatan Pengajuan Anggaran
                </label>
                <input
                  id="form-judul"
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Konsumsi & Undangan Serta ATK Perpisahan"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Rincian item list */}
              <div className="space-y-3" id="items-inputs-wrapper">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Info size={13} className="text-emerald-700" /> Rincian Volume & Satuan Usulan
                  </span>
                  <button
                    id="btn-add-item-row"
                    type="button"
                    onClick={addFormItem}
                    className="px-3 py-1 bg-emerald-700 text-white rounded text-[11px] font-bold hover:bg-emerald-800 inline-flex items-center gap-0.5 shadow-xs"
                  >
                    <Plus size={11} /> Baris Baru
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1" id="items-repeater">
                  {formItems.map((item, index) => (
                    <div key={index} className="p-3 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-55/15 bg-slate-50 relative" id={`row-repeater-${index}`}>
                      <div className="sm:col-span-4 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600">Butir Uraian Barang / Jasa</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Spanduk Backdrop 3x2m"
                          value={item.name}
                          onChange={e => updateFormItemField(index, 'name', e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600">Volume</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={e => updateFormItemField(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-center"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600">Satuan</label>
                        <input
                          type="text"
                          required
                          placeholder="Hari/Rim/Buah"
                          value={item.unit}
                          onChange={e => updateFormItemField(index, 'unit', e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-center"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600">Harga Satuan (Rp)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.price}
                          onChange={e => updateFormItemField(index, 'price', parseInt(e.target.value) || 0)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-right font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className="p-2 text-red-650 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Hapus baris"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Display inline base64 image or upload */}
                      <div className="sm:col-span-12 flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-slate-200 mt-1" id="inline-file-handler">
                        <span className="text-slate-500">Estimasi subtotal: <strong>{formatRupiah(item.quantity * item.price)}</strong></span>
                        <div className="inline-flex items-center gap-1.5">
                          {item.photoUrl ? (
                            <div className="flex items-center gap-15 gap-1.5" id={`view-photo-uploaded-${index}`}>
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5"><Check size={11} /> Foto OK</span>
                              <button
                                type="button"
                                onClick={() => updateFormItemField(index, 'photoUrl', '')}
                                className="text-slate-400 hover:text-red-650 text-red-600 font-medium"
                              >
                                Hapus Foto
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleItemPhotoUpload(index, file);
                              }}
                              className="text-[10px] max-w-44 text-slate-500 cursor-pointer"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="form-catatan">
                  Catatan Keterangan Tambahan Pengusul
                </label>
                <textarea
                  id="form-catatan"
                  rows={2}
                  placeholder="Contoh: Sangat urgen untuk memotong sewa backdrop sebelum tanggal rapat akbar."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Total Summary of current Form */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center" id="new-total-banner">
                <span className="text-xs font-bold text-emerald-950">ESTIMASI JUMLAH KEBUTUHAN UTAMA:</span>
                <span className="text-lg font-black text-emerald-800">
                  {formatRupiah(formItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0))}
                </span>
              </div>

              {formError && (
                <p className="text-xs text-red-650 text-red-600 font-medium flex items-center gap-1" id="form-error-msg">
                  <AlertCircle size={14} /> {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-xs text-emerald-700 font-bold" id="form-success-msg">
                  {formSuccess}
                </p>
              )}

              <div className="flex justify-end pt-2" id="form-trigger">
                <button
                  id="btn-submit-rab"
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check size={14} /> Kirim Pengajuan RAB Sekarang
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: MONITORING ALUR PERJALANAN */}
        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-5" id="workspace-monitoring">
            <div className="pb-2 border-b border-slate-100/80" id="header-monitoring-list">
              <h2 className="text-base font-bold text-slate-800">2. Alur Perjalanan (Monitoring Status RAB)</h2>
              <p className="text-xs text-slate-500">Lihat status kelulusan verifikasi anggaran Anda di bawah ini secara transparan berserta catatan panitia verifikator.</p>
            </div>

            {myBudgets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="mybadget-empty-state">
                <Clock className="mx-auto text-slate-300 mb-3" size={36} />
                <p className="text-sm font-semibold text-slate-600">Belum ada pengajuan RAB terdaftar</p>
                <p className="text-xs text-slate-400 mt-1">Silakan gunakan tab formulir untuk membuat proposal perdana.</p>
              </div>
            ) : (
              <div className="space-y-4" id="mybudgets-list">
                {myBudgets.map(budget => (
                  <div key={budget.id} className="p-4 border border-slate-200 hover:border-emerald-300 rounded-xl bg-slate-50/50" id={`mybudget-card-${budget.id}`}>
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{budget.title}</h4>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">Diusulkan pada {formatDateIndonesian(budget.submittedAt)}</p>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          budget.status === 'diajukan' ? 'bg-amber-150 bg-amber-100 text-amber-800 border border-amber-200' :
                          budget.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          budget.status === 'terealisasi' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {budget.status === 'diajukan' ? 'Proses Verifikasi' : budget.status}
                        </span>
                        <span className="text-sm font-black text-slate-800 block mt-1">{formatRupiah(budget.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Timeline flow chart */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200/60" id="monitoring-flow">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-3">Linimasa Keputusan (Alur):</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="timeline-flow-grid">
                        {/* Step 1: Draft Submitted */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-100 flex items-start gap-2 text-xs" id="monitoring-flow-step1">
                          <CheckCircle className="text-indigo-505 text-indigo-500 shrink-0" size={15} />
                          <div>
                            <span className="font-bold block text-slate-800">1. Pengajuan</span>
                            <span className="text-[10px] text-zinc-400">{formatDateIndonesian(budget.submittedAt)}</span>
                            <span className="text-[10px] text-slate-500 block">Diterima loket masuk komite.</span>
                          </div>
                        </div>

                        {/* Step 2: Verification outcome */}
                        <div className={`p-2.5 bg-white rounded-lg border flex items-start gap-2 text-xs ${
                          budget.status === 'diajukan' ? 'border-amber-200' :
                          budget.status === 'ditolak' ? 'border-red-200 bg-red-50/10' :
                          'border-emerald-200 bg-emerald-50/10'
                        }`} id="monitoring-flow-step2">
                          {budget.status === 'diajukan' ? (
                            <Clock className="text-amber-500 shrink-0" size={15} />
                          ) : budget.status === 'ditolak' ? (
                            <XCircle className="text-red-500 shrink-0" size={15} />
                          ) : (
                            <CheckCircle className="text-emerald-500 shrink-0" size={15} />
                          )}
                          <div>
                            <span className="font-bold block text-slate-800">2. Verifikasi Komite</span>
                            <span className="text-[10px] text-zinc-400">
                              {budget.status === 'diajukan' ? 'Pengecekan Berkas' : formatDateIndonesian(budget.updatedAt)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {budget.status === 'diajukan' ? 'Antrean Keputusan Admin.' :
                               budget.status === 'ditolak' ? 'Ditolak: Hubungi Komite.' : 'Disetujui. Dana siap dicairkan.'}
                            </span>
                          </div>
                        </div>

                        {/* Step 3: Realization Payout */}
                        <div className={`p-2.5 bg-white rounded-lg border flex items-start gap-2 text-xs ${
                          budget.status === 'terealisasi' ? 'border-teal-200 bg-teal-50/10' : 'border-slate-100 text-slate-400'
                        }`} id="monitoring-flow-step3">
                          <CheckCircle className={`${budget.status === 'terealisasi' ? 'text-teal-600' : 'text-slate-300'} shrink-0`} size={15} />
                          <div>
                            <span className="font-bold block">3. Pencairan Dana</span>
                            <span className="text-[10px]">
                              {budget.status === 'terealisasi' ? formatDateIndonesian(budget.updatedAt) : 'Menunggu Payout'}
                            </span>
                            <span className="text-[10px] block">
                              {budget.status === 'terealisasi' ? 'Cair Tunai / Selesai.' : 'Belum terealisasikan.'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Display Rejection notes */}
                      {budget.status === 'ditolak' && budget.rejectionReason && (
                        <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg mt-3 flex items-start gap-2" id="notes-rejection">
                          <XCircle size={14} className="mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold">Koreksi Verifikator:</span>
                            <p className="mt-0.5 italic">"{budget.rejectionReason}"</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-slate-200 my-3"></div>

                    {/* View Item details controls */}
                    <div className="flex justify-between items-center text-xs" id="monitoring-footer-controls">
                      <span className="text-slate-500">Jumlah item: <strong>{budget.items.length}</strong></span>
                      <div className="flex gap-2">
                        <button
                          id={`btn-expand-monitoring-${budget.id}`}
                          onClick={() => setViewingBudget(budget)}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-55 rounded text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> Detail & Bukti Foto
                        </button>
                        <button
                          id={`btn-excel-monitoring-${budget.id}`}
                          onClick={() => exportToExcel(budget, 'A4')}
                          className="px-2 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50"
                        >
                          Excel A4
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EDIT AND DELETE BUDGETS */}
        {activeTab === 'edit-hapus' && !editingBudget && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-5" id="workspace-edit-hapus-list">
            <div className="pb-2 border-b border-slate-100" id="header-edithapus">
              <h2 className="text-base font-bold text-slate-800">3. Edit dan Hapus Anggaran Berjalan</h2>
              <p className="text-xs text-slate-500">Daftar rancangan anggaran Anda. Selama status belum direalisasikan atau diajukan ulang, Anda dapat memodifikasi isi rincian usulan.</p>
            </div>

            {myBudgets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="edit-empty-state">
                <p className="text-sm font-semibold text-slate-500">Tidak ada anggaran miliki unit Anda.</p>
              </div>
            ) : (
              <div className="space-y-3" id="edit-budgets-grid">
                {myBudgets.map(budget => (
                  <div key={budget.id} className="p-4 border border-slate-200 hover:bg-slate-50/50 rounded-xl flex flex-wrap justify-between items-center gap-4 text-xs" id={`card-edit-row-${budget.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.2 rounded text-[10px] font-semibold uppercase ${
                          budget.status === 'diajukan' ? 'bg-amber-100 text-amber-800' :
                          budget.status === 'disetujui' ? 'bg-indigo-150 bg-indigo-100 text-indigo-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {budget.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 truncate">{budget.title}</h4>
                      <p className="text-slate-500">{formatRupiah(budget.totalAmount)} &bull; diusulkan {formatDateIndonesian(budget.submittedAt)}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id={`btn-begin-edit-${budget.id}`}
                        onClick={() => {
                          setEditingBudget(budget);
                          setEditSuccess('');
                        }}
                        className="p-1 px-3 border border-emerald-200 hover:bg-emerald-50 text-emerald-800 rounded-lg font-semibold inline-flex items-center gap-1"
                      >
                        <Edit2 size={12} /> Edit Isi RAB
                      </button>

                      <button
                        id={`btn-begin-del-${budget.id}`}
                        onClick={() => handleDeleteBudget(budget.id, budget.title)}
                        className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-lg inline-flex items-center gap-1 shadow-xs"
                      >
                        <Trash2 size={12} /> Tarik/Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE FORM: EDITING PANEL FOR INDIVIDUAL BUDGET */}
        {editingBudget && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-amber-100 space-y-6" id="workspace-active-edit-panel">
            <div className="pb-2 border-b border-amber-100 flex justify-between items-center" id="header-editing-rab">
              <div>
                <h2 className="text-base font-bold text-slate-800">Modifikasi Rincian Anggaran</h2>
                <p className="text-xs text-slate-500">Sesuaikan uraian, volume, atau harga satuan. Setelah disimpan, status pengajuan akan bertukar ke admin.</p>
              </div>
              <button
                id="btn-cancel-active-edit"
                onClick={() => setEditingBudget(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold text-slate-600"
              >
                Batal Edit
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4" id="editing-rab-form">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="edit-title-input">Judul Pengajuan Program</label>
                <input
                  id="edit-title-input"
                  type="text"
                  required
                  value={editingBudget.title}
                  onChange={e => setEditingBudget({ ...editingBudget, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Repeater for items */}
              <div className="space-y-2" id="edit-repeater-wrapper">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Rincian Barang</span>
                  <button
                    id="btn-add-item-edit"
                    type="button"
                    onClick={() => {
                      const updatedItems = [
                        ...editingBudget.items,
                        { id: `it-edit-${Date.now()}`, name: '', quantity: 1, unit: 'Buah', price: 0 }
                      ];
                      setEditingBudget({
                        ...editingBudget,
                        items: updatedItems,
                        totalAmount: updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
                      });
                    }}
                    className="px-2 py-1 bg-emerald-700 text-white rounded text-[11px] font-bold"
                  >
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-3" id="edit-items-repeater">
                  {editingBudget.items.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 bg-slate-50/50" id={`edit-row-repeater-${idx}`}>
                      <div className="col-span-12 sm:col-span-5 space-y-0.5">
                        <label className="text-[10px] text-slate-500 block">Nama Barang</label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={e => handleEditItemField(idx, 'name', e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] text-slate-500 block text-center">Volume</label>
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={e => handleEditItemField(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-center"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-0.5">
                        <label className="text-[10px] text-slate-500 block text-center">Satuan</label>
                        <input
                          type="text"
                          required
                          value={item.unit}
                          onChange={e => handleEditItemField(idx, 'unit', e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-center"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-3 space-y-0.5">
                        <label className="text-[10px] text-slate-500 block text-right">Harga (Rp)</label>
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={e => handleEditItemField(idx, 'price', parseInt(e.target.value) || 0)}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-right font-mono"
                        />
                      </div>

                      <div className="col-span-12 flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed border-slate-200 mt-1">
                        <span className="text-slate-500">Estimasi subtotal: <strong>{formatRupiah(item.quantity * item.price)}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingBudget.items.length === 1) {
                              alert('Minimal mengajukan 1 rincian item anggaran!');
                              return;
                            }
                            const updatedItems = editingBudget.items.filter((_, i) => i !== idx);
                            setEditingBudget({
                              ...editingBudget,
                              items: updatedItems,
                              totalAmount: updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
                            });
                          }}
                          className="text-red-650 text-red-600 hover:text-red-700 font-bold"
                        >
                          Hapus Baris
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-xs font-bold flex justify-between items-center" id="edit-live-total">
                <span className="text-emerald-950">JUMLAH BARU TOTAL REKAP:</span>
                <span className="text-sm font-black text-emerald-800">
                  {formatRupiah(editingBudget.totalAmount)}
                </span>
              </div>

              {editSuccess && (
                <p className="text-xs text-emerald-700 font-bold" id="edit-success-msg">
                  {editSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2" id="edit-triggers">
                <button
                  id="btn-close-edit"
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Urungkan
                </button>
                <button
                  id="btn-save-edit-rab"
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Simpan Perubahan RAB
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: UPLOAD PHOTO SECTION (INDEPENDENT ACTIONS) */}
        {activeTab === 'foto' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6" id="workspace-photo-upload">
            <div className="pb-2 border-b border-slate-100" id="header-photos-main">
              <h2 className="text-base font-bold text-slate-800">4. Unggah Foto Lampiran Barang / Bukti Estimasi</h2>
              <p className="text-xs text-slate-500">Gunakan zona drag-drop atau tombol untuk melampirkan foto sampel barang/estimasi harga dari vendor pada item anggaran yang diajukan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="photos-upload-layout">
              {/* Select target selectors */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4" id="photo-selectors-form">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pilih Item Anggaran Sasaran</h3>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block" htmlFor="select-target-budget-photo">Rancangan RAB Utama</label>
                  <select
                    id="select-target-budget-photo"
                    value={selectedBudgetForPhoto}
                    onChange={(e) => {
                      setSelectedBudgetForPhoto(e.target.value);
                      setSelectedItemForPhoto('');
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Pilih Berkas Anggaran --</option>
                    {myBudgets.map(b => (
                      <option key={b.id} value={b.id}>{b.title} ({formatRupiah(b.totalAmount)})</option>
                    ))}
                  </select>
                </div>

                {selectedBudgetForPhoto && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block" htmlFor="select-target-item-photo">Butir Rincian Barang</label>
                    <select
                      id="select-target-item-photo"
                      value={selectedItemForPhoto}
                      onChange={(e) => setSelectedItemForPhoto(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">-- Pilih Rincian Barang --</option>
                      {budgets.find(b => b.id === selectedBudgetForPhoto)?.items.map(it => (
                        <option key={it.id} value={it.id}>{it.name} ({formatRupiah(it.price)})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Real Drag-Drop zone compliant to guidelines: supports click and drag-drop */}
              <div 
                id="photo-drag-drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (selectedBudgetForPhoto && selectedItemForPhoto) {
                    fileInputRef.current?.click();
                  } else {
                    alert('Harap tentukan target rencana RAB dan rincian barang terlebih dahulu pada panel kiri!');
                  }
                }}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'
                } ${(!selectedBudgetForPhoto || !selectedItemForPhoto) ? 'opacity-55 cursor-not-allowed' : ''}`}
              >
                <Upload size={32} className="text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  {(!selectedBudgetForPhoto || !selectedItemForPhoto) 
                    ? 'Tentukan sasaran barang terlebih dahulu' 
                    : 'Seret foto kesini / Klik untuk pilih file'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Mendukung format gambar JPEG, PNG, atau WEBP.</p>

                {/* Secret file input */}
                <input
                  id="secret-photo-file-input"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Gallery list of currently uploaded photos */}
            <div className="space-y-3" id="photo-gallery-recap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Galeri Bukti Rincian Barang Terlampir</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="photo-gallery-grid">
                {myBudgets.flatMap(b => b.items.filter(it => it.photoUrl).map(it => (
                  <div key={it.id} className="bg-slate-50 rounded-xl p-2 border border-slate-200 relative group" id={`gallery-item-${it.id}`}>
                    <img 
                      src={it.photoUrl} 
                      alt={it.name} 
                      className="w-full h-24 object-cover rounded-lg border border-slate-100" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-1.5 mt-1" id={`gallery-meta-${it.id}`}>
                      <span className="text-[10px] font-bold text-slate-800 line-clamp-1 block">{it.name}</span>
                      <span className="text-[9.5px] text-emerald-800 font-mono block">{formatRupiah(it.price)}</span>
                    </div>

                    <button
                      id={`btn-delete-item-photo-${it.id}`}
                      onClick={() => {
                        if (window.confirm(`Hapus foto bukti untuk "${it.name}"?`)) {
                          setBudgets(prev => prev.map(budget => {
                            const updatedItems = budget.items.map(item => {
                              if (item.id === it.id) {
                                return { ...item, photoUrl: '' };
                              }
                              return item;
                            });
                            return { ...budget, items: updatedItems };
                          }));
                        }
                      }}
                      className="absolute top-3 right-3 p-1 bg-red-650 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus foto ini"
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                )))}

                {myBudgets.flatMap(b => b.items.filter(it => it.photoUrl)).length === 0 && (
                  <div className="col-span-full text-center py-6 text-xs text-slate-400 italic">
                    Belum ada foto yang dionboardkan pada usulan barang Anda.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL VIEW OVERLAY FOR INDIVIDUAL BUDGETS (SYNCED TO MONITORING AND GENERAL EXPANDS) */}
      {viewingBudget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs" id="detail-monitoring-view">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" id="detail-monitoring-modal-body">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-emerald-900 text-white rounded-t-2xl" id="monitoring-modal-header">
              <div>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded uppercase">
                  Pengecekan Detail RAB
                </span>
                <h3 className="text-base font-bold mt-1">{viewingBudget.title}</h3>
                <p className="text-xs text-white/80 mt-1">Diajukan: {formatDateIndonesian(viewingBudget.submittedAt)}</p>
              </div>
              <button
                id="btn-close-monitoring-modal"
                onClick={() => setViewingBudget(null)}
                className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 flex-1" id="monitoring-modal-body-content">
              {viewingBudget.status === 'ditolak' && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-xs" id="monitoring-rejection-msg">
                  <h5 className="font-bold text-red-800">Catatan/Koreksi dari Admin Verifikator:</h5>
                  <p className="text-red-700 font-medium mt-1">"{viewingBudget.rejectionReason}"</p>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2" id="monitoring-items">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Rincian Barang & Estimasi</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden" id="monitoring-items-table-container">
                  <table className="w-full text-left text-xs border-collapse" id="monitoring-items-table">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-center" width="5%">No</th>
                        <th className="p-3">Nama Barang/Layanan</th>
                        <th className="p-3 text-center" width="10%">Vol</th>
                        <th className="p-3 text-center" width="10%">Satuan</th>
                        <th className="p-3 text-right" width="25%">Harga Satuan</th>
                        <th className="p-3 text-right" width="25%">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingBudget.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/20" id={`monitoring-item-row-${item.id}`}>
                          <td className="p-3 text-center text-slate-400">{index + 1}</td>
                          <td className="p-3">
                            <div>
                              <span className="font-semibold text-slate-800 block">{item.name}</span>
                              {item.photoUrl && (
                                <div className="mt-2" id={`monitoring-photo-wrap-${item.id}`}>
                                  <span className="text-[10px] text-slate-500 block mb-1">Foto Estimasi:</span>
                                  <img 
                                    src={item.photoUrl} 
                                    alt={item.name} 
                                    className="h-28 w-44 object-cover rounded-md border border-slate-200" 
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
                      <tr className="bg-slate-100 font-bold text-slate-800">
                        <td colSpan={5} className="p-3 text-right">JUMLAH TOTAL REKAP:</td>
                        <td className="p-3 text-right text-emerald-800 text-sm font-black">
                          {formatRupiah(viewingBudget.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingBudget.notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200-text-xs text-slate-600 italic" id="monitoring-additional-notes">
                  <strong>Catatan Pengajuan:</strong> "{viewingBudget.notes}"
                </div>
              )}

              {/* Timeline chronological layout */}
              <div className="space-y-3" id="monitoring-timeline-list">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Peta Perjalanan Keputusan (Timeline)</h4>
                <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-4" id="view-timeline-items">
                  {viewingBudget.timeline?.map((step) => (
                    <div key={step.id} className="relative" id={`timeline-item-${step.id}`}>
                      <span className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                        step.status === 'pengajuan' ? 'bg-indigo-500' :
                        step.status === 'disetujui' ? 'bg-emerald-500' :
                        step.status === 'ditolak' ? 'bg-red-500' :
                        'bg-teal-500'
                      }`}></span>
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block">{step.stage}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatDateIndonesian(step.timestamp)}</span>
                          <span>&bull;</span>
                          <span>Oleh: {step.actor}</span>
                        </div>
                        {step.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded mt-1 border border-slate-100">
                            {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer containing document export actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-2" id="monitoring-modal-footer">
              <div className="flex gap-1">
                <button
                  id="btn-monitoring-modal-excel"
                  onClick={() => exportToExcel(viewingBudget, 'A4')}
                  className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50"
                >
                  Excel A4
                </button>
                <button
                  id="btn-monitoring-modal-word"
                  onClick={() => exportToWord(viewingBudget, 'A4')}
                  className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50"
                >
                  Word A4
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-close-and-back"
                  onClick={() => setViewingBudget(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
