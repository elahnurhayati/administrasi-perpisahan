import { RABBudget } from '../types';

// Helper to format currency in Rupiah
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to format date
export const formatDateIndonesian = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

// EXPORT TO EXCEL: Outputs a beautifully styled HTML/XML Spreadsheet format readable by MS Excel & Google Sheets
export function exportToExcel(budget: RABBudget, paperSize: 'A4' | 'F4', logoUrl?: string) {
  const sizeLabel = paperSize === 'A4' ? 'A4 (21.0 x 29.7 cm)' : 'F4 Folio (21.5 x 33.0 cm)';
  
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>RAB Perpisahan Al-Achdan</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; }
        .kop-title { font-size: 16pt; font-weight: bold; text-align: center; }
        .kop-subtitle { font-size: 11pt; text-align: center; font-style: italic; }
        .divider { border-bottom: 2px double #000; margin-bottom: 15px; }
        .doc-title { font-size: 14pt; font-weight: bold; text-align: center; margin-top: 15px; text-decoration: underline; }
        .meta-table { font-size: 11pt; margin-bottom: 15px; }
        .data-table { border-collapse: collapse; width: 100%; font-size: 11pt; }
        .data-table th { background-color: #e2e8f0; border: 1px solid #000; padding: 6px; font-weight: bold; text-align: center; }
        .data-table td { border: 1px solid #000; padding: 6px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .signature-section { margin-top: 40px; font-size: 11pt; }
        .watermark { font-size: 9pt; color: #94a3b8; text-align: right; margin-top: 50px; }
      </style>
    </head>
    <body>
      <table width="100%">
        <tr>
          <td colspan="6" class="kop-title">PANITIA PERPISAHAN KEPANITIAAN AL-ACHDAN</td>
        </tr>
        <tr>
          <td colspan="6" class="kop-title" style="font-size: 13pt;">YAYASAN AL-ACHDAN SUKABUMI</td>
        </tr>
        <tr>
          <td colspan="6" class="kop-subtitle">Sekretariat: Jl. Raya Al-Achdan No. 12, Sukabumi, Jawa Barat | Akun Lembaga: ${budget.institutionName}</td>
        </tr>
        <tr>
          <td colspan="6" style="border-bottom: 3px double #000000; height: 10px;"></td>
        </tr>
        <tr><td colspan="6" style="height: 10px;"></td></tr>
        <tr>
          <td colspan="6" class="doc-title">RENCANA ANGGARAN BIAYA (RAB)</td>
        </tr>
        <tr>
          <td colspan="6" class="text-center" style="font-size: 11pt; font-weight: bold;">SUB-PROGRAM: ${budget.title.toUpperCase()}</td>
        </tr>
        <tr><td colspan="6" style="height: 15px;"></td></tr>
        
        <tr>
          <td colspan="3" class="font-bold">Lembaga Pengusul:</td>
          <td colspan="3">${budget.institutionName}</td>
        </tr>
        <tr>
          <td colspan="3" class="font-bold">Tanggal Pengajuan:</td>
          <td colspan="3">${formatDateIndonesian(budget.submittedAt)}</td>
        </tr>
        <tr>
          <td colspan="3" class="font-bold">Status Anggaran:</td>
          <td colspan="3">${budget.status.toUpperCase()}</td>
        </tr>
        <tr>
          <td colspan="3" class="font-bold">Ukuran Kertas Ekspor:</td>
          <td colspan="3">${sizeLabel}</td>
        </tr>
        <tr><td colspan="6" style="height: 15px;"></td></tr>
      </table>

      <table class="data-table">
        <thead>
          <tr>
            <th width="5%">NO</th>
            <th width="45%">URAIAN BARANG / KEGIATAN</th>
            <th width="10%">VOLUME</th>
            <th width="10%">SATUAN</th>
            <th width="15%">HARGA SATUAN</th>
            <th width="15%">TOTAL HARGA</th>
          </tr>
        </thead>
        <tbody>
          ${budget.items.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.unit}</td>
              <td class="text-right">${formatRupiah(item.price)}</td>
              <td class="text-right font-bold">${formatRupiah(item.quantity * item.price)}</td>
            </tr>
          `).join('')}
          <tr style="background-color: #f8fafc;">
            <td colspan="5" class="text-right font-bold" style="padding: 10px;">JUMLAH TOTAL</td>
            <td class="text-right font-bold" style="padding: 10px; background-color: #f1f5f9; border: 2px solid #000;">${formatRupiah(budget.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      ${budget.notes ? `
        <table width="100%" style="margin-top: 20px;">
          <tr>
            <td colspan="6" class="font-bold" style="font-size: 10pt;">Catatan Pengajuan:</td>
          </tr>
          <tr>
            <td colspan="6" style="font-size: 10pt; font-style: italic;">"${budget.notes}"</td>
          </tr>
        </table>
      ` : ''}

      <table width="100%" class="signature-section" style="margin-top: 40px;">
        <tr>
          <td colspan="2" class="text-center" width="33%">
            Mengetahui,<br/>
            <strong>Kepala Yayasan Al-Achdan</strong>
            <br/><br/><br/><br/>
            ( _______________________ )
          </td>
          <td colspan="2" class="text-center" width="33%">
            Menyetujui,<br/>
            <strong>Ketua Panitia Perpisahan</strong>
            <br/><br/><br/><br/>
            ( _______________________ )
          </td>
          <td colspan="2" class="text-center" width="34%">
            Sukabumi, ${formatDateIndonesian(new Date().toISOString())}<br/>
            <strong>Bendahara Panitia / Pengusul</strong>
            <br/><br/><br/><br/>
            ( _______________________ )
          </td>
        </tr>
      </table>

      <table width="100%">
        <tr>
          <td colspan="6" class="watermark">
            Made by : Nandi Achdarizal Sutisna &bull; Sistem Informasi RAB Al-Achdan &bull; Kertas ${paperSize}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RAB_Al-Achdan_${budget.id}_[${paperSize}].xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// EXPORT TO WORD: Outputs a styled Microsoft Word document HTML representation
export function exportToWord(budget: RABBudget, paperSize: 'A4' | 'F4', logoUrl?: string) {
  // Setup standard print CSS variables for MS Word parsing
  const width = paperSize === 'A4' ? '21cm' : '21.5cm';
  const height = paperSize === 'A4' ? '29.7cm' : '33cm';
  const sizeLabel = paperSize === 'A4' ? 'A4' : 'F4';

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8" />
      <title>Rencana Anggaran Biaya - Al-Achdan</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: ${width} ${height};
          margin: 2.0cm 2.0cm 2.0cm 2.0cm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.WordSection1 {
          page: WordSection1;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.25;
          color: #000;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
          margin-bottom: 5px;
        }
        .header-cell {
          border: none;
          text-align: center;
        }
        .org-title {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .org-sub {
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          color: #005a2b;
        }
        .org-address {
          font-size: 10pt;
          font-style: italic;
          margin: 0;
        }
        .double-line {
          border-top: 1px solid #000000;
          border-bottom: 3px double #000000;
          height: 4px;
          margin-bottom: 20px;
        }
        .doc-title {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin-top: 20px;
          margin-bottom: 5px;
          text-decoration: underline;
        }
        .doc-sub {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 30px;
          text-transform: uppercase;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .meta-label {
          width: 25%;
          font-weight: bold;
          vertical-align: top;
        }
        .meta-value {
          width: 75%;
          vertical-align: top;
        }
        .rab-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 25px;
        }
        .rab-table th {
          border: 1px solid #000000;
          background-color: #f2f2f2;
          padding: 8px;
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
        }
        .rab-table td {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 11pt;
          vertical-align: top;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 40px;
        }
        .signature-cell {
          border: none;
          text-align: center;
          width: 33%;
          font-size: 11pt;
        }
        .watermark {
          font-size: 9pt;
          color: #888888;
          text-align: right;
          margin-top: 70px;
          border-top: 1px dashed #cccccc;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        <!-- HEADER KOP SURAT -->
        <table class="header-table">
          <tr>
            <td class="header-cell" style="padding-bottom:10px;">
              <p class="org-title">Panitia Organisasi Pelaksana</p>
              <p class="org-sub">Kepanitiaan Perpisahan Al-Achdan</p>
              <p class="org-title" style="font-size:11pt; font-weight:normal;">YAYASAN PENDIDIKAN ISLAM AL-ACHDAN SUKABUMI</p>
              <p class="org-address">Sekretariat: Jl. Raya Cigayung Km. 5, Sukabumi, Jawa Barat &bull; Email: info@al-achdan.sch.id</p>
            </td>
          </tr>
        </table>
        
        <div class="double-line"></div>
        
        <!-- DOCUMENT TITLE -->
        <p class="doc-title">RENCANA ANGGARAN BIAYA (RAB)</p>
        <p class="doc-sub">KATEGORI PROGRAM: ${budget.title}</p>
        
        <!-- METADATA -->
        <table class="meta-table">
          <tr>
            <td class="meta-label">Lembaga Pengusul</td>
            <td class="meta-value">: ${budget.institutionName}</td>
          </tr>
          <tr>
            <td class="meta-label">Tanggal Pengajuan</td>
            <td class="meta-value">: ${formatDateIndonesian(budget.submittedAt)}</td>
          </tr>
          <tr>
            <td class="meta-label">Jumlah Total RAB</td>
            <td class="meta-value">: <strong>${formatRupiah(budget.totalAmount)}</strong></td>
          </tr>
          <tr>
            <td class="meta-label">Status Verifikasi</td>
            <td class="meta-value">: <span style="text-transform:uppercase; font-weight:bold;">${budget.status}</span></td>
          </tr>
          ${budget.rejectionReason ? `
          <tr>
            <td class="meta-label" style="color:#cc0000;">Alasan Penolakan</td>
            <td class="meta-value" style="color:#cc0000;">: ${budget.rejectionReason}</td>
          </tr>
          ` : ''}
        </table>

        <!-- ITEMS TABLE -->
        <table class="rab-table">
          <thead>
            <tr>
              <th width="6%">No.</th>
              <th width="44%">Uraian Barang / Jasa / Kegiatan</th>
              <th width="10%">Volume</th>
              <th width="10%">Satuan</th>
              <th width="15%">Harga Satuan</th>
              <th width="15%">Jumlah Total</th>
            </tr>
          </thead>
          <tbody>
            ${budget.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center">${item.unit}</td>
                <td class="text-right">${formatRupiah(item.price)}</td>
                <td class="text-right font-bold">${formatRupiah(item.quantity * item.price)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="5" class="text-right font-bold" style="background-color:#f9f9f9; padding:10px;">JUMLAH TOTAL</td>
              <td class="text-right font-bold" style="background-color:#f9f9f9; padding:10px; border-bottom: 2px double #000;">${formatRupiah(budget.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        ${budget.notes ? `
          <p style="font-size:10.5pt; margin-top:15px; font-style:italic;">
            <strong>Catatan Tambahan:</strong><br />
            "${budget.notes}"
          </p>
        ` : ''}

        <!-- SIGNATURES -->
        <table class="signature-table">
          <tr>
            <td class="signature-cell" style="padding-bottom: 60px;">
              Mengetahui,<br/>
              <strong>Kepala Yayasan Al-Achdan</strong>
            </td>
            <td class="signature-cell" style="padding-bottom: 60px;">
              Menyetujui,<br/>
              <strong>Ketua Panitia Perpisahan</strong>
            </td>
            <td class="signature-cell" style="padding-bottom: 60px;">
              Sukabumi, ${formatDateIndonesian(new Date().toISOString())}<br/>
              <strong>Pengusul / Bendahara ${budget.institutionName}</strong>
            </td>
          </tr>
          <tr>
            <td class="signature-cell">
              <strong>( _______________________ )</strong>
            </td>
            <td class="signature-cell">
              <strong>( _______________________ )</strong>
            </td>
            <td class="signature-cell">
              <strong>( _______________________ )</strong>
            </td>
          </tr>
        </table>

        <!-- WATERMARK AND FOOTER -->
        <p class="watermark">
          Format Dokumen: MS Word (${sizeLabel} Paper) &bull; Made by : Nandi Achdarizal Sutisna &bull; Sistem Informasi Kepanitiaan Perpisahan Al-Achdan
        </p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RAB_Al-Achdan_${budget.id}_[${paperSize}].doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
