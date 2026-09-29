export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string; // Kept secure in application memory or local state
  role: UserRole;
  institutionName: string; // e.g., 'Madrasah Tsanawiyah (MTs)', 'PAUD Al-Achdan', 'DTA Al-Achdan', 'Madrasah Aliyah (MA)'
  createdAt: string;
}

export interface RABItem {
  id: string;
  name: string; // nama barang atau kegiatan
  quantity: number; // volume
  unit: string; // satuan (buah, orang, rim, paket, dll.)
  price: number; // harga satuan rupiah
  photoUrl?: string; // base64 string or placeholder for uploaded image
}

export interface RABTimelineEvent {
  id: string;
  stage: string; // e.g. 'Pengajuan', 'Verifikasi', 'Realisasi'
  status: 'pending' | 'disetujui' | 'ditolak' | 'terealisasi' | 'pengajuan';
  timestamp: string;
  actor: string;
  notes?: string;
}

export interface RABBudget {
  id: string;
  institutionId: string; // maps to account username/institutionName
  institutionName: string;
  title: string; // nama pengajuan / sub-program
  items: RABItem[];
  totalAmount: number;
  status: 'diajukan' | 'disetujui' | 'ditolak' | 'terealisasi';
  submittedAt: string;
  updatedAt: string;
  rejectionReason?: string;
  notes?: string;
  timeline: RABTimelineEvent[];
}

// Global System Configuration
export interface SystemConfig {
  logoUrl: string; // Base64 or icon path
  logoName: string;
  organizationName: string; // default e.g., "Yayasan Pendidikan Al-Achdan"
  eventName: string; // default e.g., "Kepanitiaan Perpisahan Siswa Al-Achdan 2026"
}

// Initial Data
export const DEFAULT_CONFIG: SystemConfig = {
  logoUrl: '', // Default state will use a clean Lucide school emblem if none uploaded
  logoName: 'Logo Al-Achdan',
  organizationName: 'Kepanitiaan Perpisahan Al-Achdan',
  eventName: 'Perpisahan Ke-15 Yayasan Al-Achdan',
};

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'u-1',
    username: 'admin',
    password: 'admin123',
    role: UserRole.ADMIN,
    institutionName: 'Panitia Pusat / Admin',
    createdAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'u-2',
    username: 'madrasah',
    password: 'madrasah123',
    role: UserRole.USER,
    institutionName: 'Madrasah Al-Achdan (MTs & MA)',
    createdAt: '2026-05-20T10:05:00Z',
  },
  {
    id: 'u-3',
    username: 'paud',
    password: 'paud123',
    role: UserRole.USER,
    institutionName: 'PAUD Al-Achdan',
    createdAt: '2026-05-20T10:10:00Z',
  },
  {
    id: 'u-4',
    username: 'dta',
    password: 'dta123',
    role: UserRole.USER,
    institutionName: 'DTA Al-Achdan',
    createdAt: '2026-05-20T10:15:00Z',
  },
];

export const INITIAL_BUDGETS: RABBudget[] = [
  {
    id: 'rab-1',
    institutionId: 'madrasah',
    institutionName: 'Madrasah Al-Achdan (MTs & MA)',
    title: 'Pengadaan Perlengkapan Panggung & Sewa Sound System',
    status: 'terealisasi',
    totalAmount: 4850000,
    submittedAt: '2026-05-20T12:00:00Z',
    updatedAt: '2026-05-21T09:00:00Z',
    notes: 'Seluruh perlengkapan panggung utama dan sound system 5000 watt untuk resepsi perpisahan akbar.',
    items: [
      {
        id: 'item-1-1',
        name: 'Sewa Panggung Utama & Backdrop 6x4m',
        quantity: 1,
        unit: 'Paket',
        price: 1500000,
        photoUrl: '',
      },
      {
        id: 'item-1-2',
        name: 'Sewa Sound System 5000 Watt',
        quantity: 1,
        unit: 'Hari',
        price: 2000000,
        photoUrl: '',
      },
      {
        id: 'item-1-3',
        name: 'Dekorasi Taman & Bunga Panggung',
        quantity: 1,
        unit: 'Paket',
        price: 750000,
        photoUrl: '',
      },
      {
        id: 'item-1-4',
        name: 'Sewa Kursi VIP dengan Cover Sutra',
        quantity: 40,
        unit: 'Unit',
        price: 15000,
        photoUrl: '',
      },
    ],
    timeline: [
      {
        id: 'tl-1-1',
        stage: 'Pengajuan Anggaran',
        status: 'pengajuan',
        timestamp: '2026-05-20T12:00:00Z',
        actor: 'Madrasah Al-Achdan',
        notes: 'Mengajukan anggaran sewa perlengkapan panggung perpisahan.',
      },
      {
        id: 'tl-1-2',
        stage: 'Verifikasi Anggaran',
        status: 'disetujui',
        timestamp: '2026-05-21T08:30:00Z',
        actor: 'Admin / Bendahara',
        notes: 'Disetujui. Sesuai dengan rincian vendor panggung.',
      },
      {
        id: 'tl-1-3',
        stage: 'Realisasi Anggaran',
        status: 'terealisasi',
        timestamp: '2026-05-21T09:00:00Z',
        actor: 'Admin / Bendahara',
        notes: 'Dana telah dicairkan tunai ke seksi perlengkapan.',
      },
    ],
  },
  {
    id: 'rab-2',
    institutionId: 'madrasah',
    institutionName: 'Madrasah Al-Achdan (MTs & MA)',
    title: 'Konsumsi Tamu Undangan Wali Murid & Siswa',
    status: 'disetujui',
    totalAmount: 6750000,
    submittedAt: '2026-05-21T13:45:00Z',
    updatedAt: '2026-05-22T08:00:00Z',
    notes: 'Konsumsi untuk 400 orang tamu termasuk wali murid, siswa, guru, dinas pendidikan, dan aparatur desa.',
    items: [
      {
        id: 'item-2-1',
        name: 'Nasi Kotak Premium (VIP & Tokoh Masyarakat)',
        quantity: 50,
        unit: 'Kotak',
        price: 35000,
        photoUrl: '',
      },
      {
        id: 'item-2-2',
        name: 'Nasi Kotak Siswa & Wali Murid',
        quantity: 350,
        unit: 'Kotak',
        price: 12000,
        photoUrl: '',
      },
      {
        id: 'item-2-3',
        name: 'Air Mineral Gelas 240ml (Snack)',
        quantity: 10,
        unit: 'Dus',
        price: 25000,
        photoUrl: '',
      },
      {
        id: 'item-2-4',
        name: 'Makanan Ringan / Snack Box Tamu',
        quantity: 400,
        unit: 'Kotak',
        price: 8000,
        photoUrl: '',
      },
    ],
    timeline: [
      {
        id: 'tl-2-1',
        stage: 'Pengajuan Anggaran',
        status: 'pengajuan',
        timestamp: '2026-05-21T13:45:00Z',
        actor: 'Madrasah Al-Achdan',
        notes: 'Konsumsi krusial untuk seluruh peserta upacara perpisahan.',
      },
      {
        id: 'tl-2-2',
        stage: 'Verifikasi Anggaran',
        status: 'disetujui',
        timestamp: '2026-05-22T08:00:00Z',
        actor: 'Admin / Bendahara',
        notes: 'Disetujui, harap laksanakan koordinasi konsumsi dengan katering lokal.',
      },
    ],
  },
  {
    id: 'rab-3',
    institutionId: 'paud',
    institutionName: 'PAUD Al-Achdan',
    title: 'Cinderamata, Piala & Piagam Kelulusan PAUD',
    status: 'diajukan',
    totalAmount: 2350000,
    submittedAt: '2026-05-21T15:10:00Z',
    updatedAt: '2026-05-21T15:10:00Z',
    notes: 'Pengadaan cinderamata piala boneka wisuda dan medali akrilik custom untuk anak PAUD yang lulus.',
    items: [
      {
        id: 'item-3-1',
        name: 'Piala Boneka Wisuda Custom Lucu',
        quantity: 45,
        unit: 'Buah',
        price: 35000,
        photoUrl: '',
      },
      {
        id: 'item-3-2',
        name: 'Medali Kelulusan Bahan Akrilik',
        quantity: 45,
        unit: 'Buah',
        price: 12000,
        photoUrl: '',
      },
      {
        id: 'item-3-3',
        name: 'Cetak Piagam Kelulusan & Map Bludru',
        quantity: 45,
        unit: 'Lembar',
        price: 15000,
        photoUrl: '',
      },
      {
        id: 'item-3-4',
        name: 'Buku Kenang-Kenangan Foto Angkatan',
        quantity: 45,
        unit: 'Buku',
        price: 25000,
        photoUrl: '',
      },
    ],
    timeline: [
      {
        id: 'tl-3-1',
        stage: 'Pengajuan Anggaran',
        status: 'pengajuan',
        timestamp: '2026-05-21T15:10:00Z',
        actor: 'PAUD Al-Achdan',
        notes: 'Atribut kelulusan mutlak untuk prosesi wisuda anak didik PAUD.',
      },
    ],
  },
  {
    id: 'rab-4',
    institutionId: 'dta',
    institutionName: 'DTA Al-Achdan',
    title: 'Honorarium Panitia Pelaksana & Jasa Kebersihan',
    status: 'ditolak',
    totalAmount: 1800000,
    submittedAt: '2026-05-18T09:00:00Z',
    updatedAt: '2026-05-19T11:00:00Z',
    rejectionReason: 'Honorarium panitia telah dijadikan satu pintu melalui anggaran komite perpisahan pusat.',
    notes: 'Jatah apresiasi lelah panitia lokal pelaksana perpisahan madrasah diniyah.',
    items: [
      {
        id: 'item-4-1',
        name: 'Insentif Panitia Lokal DTA (6 orang)',
        quantity: 6,
        unit: 'Orang',
        price: 200000,
        photoUrl: '',
      },
      {
        id: 'item-4-2',
        name: 'Bantuan Transport Pengawas/Penceramah Agama',
        quantity: 1,
        unit: 'Paket',
        price: 400000,
        photoUrl: '',
      },
      {
        id: 'item-4-3',
        name: 'Petugas Kebersihan Gedung & Lapangan',
        quantity: 2,
        unit: 'Orang',
        price: 100000,
        photoUrl: '',
      },
    ],
    timeline: [
      {
        id: 'tl-4-1',
        stage: 'Pengajuan Anggaran',
        status: 'pengajuan',
        timestamp: '2026-05-18T09:00:00Z',
        actor: 'DTA Al-Achdan',
        notes: 'Pengajuan untuk transport penceramah dan apresiasi tim operasional.',
      },
      {
        id: 'tl-4-2',
        stage: 'Verifikasi Anggaran',
        status: 'ditolak',
        timestamp: '2026-05-19T11:00:00Z',
        actor: 'Admin / Bendahara',
        notes: 'Ditolak: Honorarium dikoordinasikan langsung via komite pusat, tidak diajukan per lembaga.',
      },
    ],
  },
];
