<<<<<<< HEAD:src/lib/operatorXlsx.js
// Membaca berkas XLSX menjadi tabel teks dengan bentuk yang sama seperti parseCsv:
=======
﻿// Membaca berkas XLSX menjadi tabel teks dengan bentuk yang sama seperti parseCsv:
>>>>>>> upstream/main:sadar-edu-main/src/lib/operatorXlsx.js
// { headers, rows }. Hanya lembar pertama yang dibaca.

const cellToText = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
};

export async function readXlsx(file) {
  // Dimuat saat dibutuhkan supaya halaman lain tidak ikut menanggung ukuran library.
  const { readSheet } = await import('read-excel-file/browser');
  const data = await readSheet(file);

  const cleaned = data
    .map((row) => row.map(cellToText))
    .filter((row) => row.some((value) => value.trim() !== ''));
  const [headers = [], ...rows] = cleaned;

  return { headers: headers.map((header) => header.trim()), rows };
<<<<<<< HEAD:src/lib/operatorXlsx.js
}
=======
}
>>>>>>> upstream/main:sadar-edu-main/src/lib/operatorXlsx.js
