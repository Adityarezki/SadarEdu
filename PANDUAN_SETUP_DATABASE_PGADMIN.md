# 🗄️ Panduan Step-by-Step Setup Database SadarEdu di pgAdmin 4

Dokumen ini berisi panduan lengkap untuk kolaborator/rekan tim dalam menginstal, mengonfigurasi, dan menghubungkan database **PostgreSQL + PostGIS** ke proyek **SadarEdu** dari nol menggunakan **pgAdmin 4**.

---

## 📋 Daftar Isi
1. [Prasyarat Instalasi](#1-prasyarat-instalasi)
2. [Membuat Database & PostGIS di pgAdmin 4](#2-membuat-database--postgis-di-pgadmin-4)
3. [Konfigurasi File Environment (.env) Backend](#3-konfigurasi-file-environment-env-backend)
4. [Menjalankan Migrasi & Seed Akun Otomatis](#4-menjalankan-migrasi--seed-akun-otomatis)
5. [Memverifikasi Tabel di pgAdmin 4](#5-memverifikasi-tabel-di-pgadmin-4)
6. [Mengisi Data Awal (Demo / Data Nyata)](#6-mengisi-data-awal-demo--data-nyata)
7. [Solusi Masalah Umum (Troubleshooting)](#7-solusi-masalah-umum-troubleshooting)

---

## 1. Prasyarat Instalasi

Pastikan laptop Anda sudah terpasang perangkat lunak berikut:
1. **Node.js** (versi 18, 20, atau 22+) 👉 [Unduh Node.js](https://nodejs.org/)
2. **PostgreSQL** (versi 14, 15, atau 16) + **pgAdmin 4** 👉 [Unduh PostgreSQL](https://www.postgresql.org/download/)
3. **Ekstensi PostGIS (Wajib untuk data spasial/SIG):**
   * Di Windows: Saat selesai menginstal PostgreSQL, biarkan centang **Stack Builder** tetap aktif.
   * Pada Stack Builder, buka kategori **Spatial Extensions**, lalu centang dan pasang **PostGIS Bundle for PostgreSQL**.

---

## 2. Membuat Database & PostGIS di pgAdmin 4

Ikuti langkah-langkah visual berikut di pgAdmin:

### A. Buka pgAdmin 4 & Sambungkan ke Server
1. Buka aplikasi **pgAdmin 4** di laptop Anda.
2. Masukkan master password PostgreSQL Anda saat diminta (*password yang Anda buat saat instalasi PostgreSQL*).
3. Di panel sebelah kiri (*Browser*), klik ganda pada **Servers** $\rightarrow$ **PostgreSQL 16** (atau versi yang terpasang).

### B. Membuat Database Baru (`SadarEdu`)
1. Klik kanan pada menu **Databases** $\rightarrow$ pilih **Create** $\rightarrow$ klik **Database...**.
2. Pada tab **General**:
   * **Database:** isi dengan `SadarEdu` *(Perhatikan huruf besar-kecilnya)*.
   * **Owner:** pilih `postgres`.
3. Klik tombol **Save** di pojok kanan bawah.
4. Database `SadarEdu` sekarang sudah muncul di daftar database Anda.

### C. Mengaktifkan Ekstensi PostGIS
1. Klik kanan pada database **`SadarEdu`** yang baru saja dibuat.
2. Pilih menu **Query Tool** (ikon petir/terminal kecil di toolbar atas).
3. Di editor SQL yang muncul, ketik query berikut:
   ```sql
   -- Mengaktifkan ekstensi geospasial PostGIS
   CREATE EXTENSION IF NOT EXISTS postgis;

   -- Verifikasi PostGIS sudah aktif
   SELECT postgis_full_version();
   ```
4. Klik tombol **Execute/Refresh** (ikon segitiga / tombol ▶ atau tekan tombol **F5** pada keyboard).
5. Pada panel *Data Output* di bawah, jika muncul teks versi PostGIS (misal: `POSTGIS="3.4..."`), berarti PostGIS **berhasil aktif**.

---

## 3. Konfigurasi File Environment (.env) Backend

Sekarang hubungkan kode backend ke database yang baru saja dibuat.

1. Buka terminal (PowerShell atau Command Prompt), lalu masuk ke direktori backend:
   ```bash
   cd SadarEdu-be-main
   ```
2. Buat file `.env` dengan menyalin file template `.env.example`:
   * **Di Windows PowerShell:**
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Di CMD:**
     ```cmd
     copy .env.example .env
     ```
3. Buka file `.env` tersebut menggunakan VS Code atau text editor pilihan Anda.
4. Sesuaikan baris konfigurasi berikut:

   ```env
   PORT=5000
   NODE_ENV=development

   # ==========================================
   # KONEKSI DATABASE POSTGRESQL + POSTGIS
   # ==========================================
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=ISI_DENGAN_PASSWORD_POSTGRES_LAPTOP_ANDA
   DB_NAME=SadarEdu

   # ==========================================
   # KEAMANAN TOKEN & AUTENTIKASI
   # ==========================================
   JWT_SECRET=sadaredu_jwt_secret_key_be_2026_super_acak_987654321
   JWT_EXPIRES_IN=1d

   # Origin Frontend yang Diizinkan
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:4174

   # Akun Pengujian Bawaan
   SEED_OPERATOR_EMAIL=operator@sadaredu.id
   SEED_OPERATOR_PASSWORD=operator123
   SEED_STAKEHOLDER_EMAIL=stakeholder@sadaredu.id
   SEED_STAKEHOLDER_PASSWORD=stakeholder123
   ```

> ⚠️ **PENTING:** Ganti nilai `DB_PASSWORD` dengan kata sandi akun `postgres` di laptop Anda masing-masing.

---

## 4. Menjalankan Migrasi & Seed Akun Otomatis

Seluruh struktur tabel, relasi, indeks spasial, dan akun default dapat dibuat dalam 3 baris perintah tanpa perlu menulis SQL manual:

Pastikan Anda masih berada di folder `SadarEdu-be-main`, lalu jalankan:

```bash
# 1. Unduh pustaka / dependency backend
npm install

# 2. Eksekusi skema database (otomatis membuat semua tabel dan relasi PostGIS)
npm run db:init

# 3. Buat akun bawaan Operator dan Stakeholder
npm run seed:users
```

Jika sukses, terminal akan memberikan respon:
```text
✅ schema.sql berhasil dijalankan.
✅ Seed data master ROLE (Umum, Stakeholder, Operator) berhasil disinkronkan.
✅ Akun siap: operator@sadaredu.id
✅ Akun siap: stakeholder@sadaredu.id
```

---

## 5. Memverifikasi Tabel di pgAdmin 4

Untuk memastikan semua tabel sudah terbuat dengan benar:
1. Kembali ke aplikasi **pgAdmin 4**.
2. Pada panel kiri (*Browser*), navigasikan ke:
   `Servers` $\rightarrow$ `PostgreSQL` $\rightarrow$ `Databases` $\rightarrow$ `SadarEdu` $\rightarrow$ `Schemas` $\rightarrow$ `public` $\rightarrow$ **`Tables`**.
3. Pastikan tabel-tabel berikut sudah ada:
   * `role`
   * `user_account`
   * `wilayah`
   * `sekolah` *(sudah termasuk kolom foto_url)*
   * `dataset_metadata`
   * `dataset_version`
   * `priority_score`
   * `candidate_area`
   * `layer_constraint`
   * `spatial_ref_sys` *(bawaan PostGIS)*

*(Tips: Klik kanan pada salah satu tabel, misalnya `user_account` $\rightarrow$ pilih **View/Edit Data** $\rightarrow$ **All Rows** untuk melihat akun yang sudah terdaftar).*

---

## 6. Mengisi Data Awal (Demo / Data Nyata)

### Pilihan A: Mengisi Data Demo Sintetis (Sangat Cepat)
Jika Anda hanya ingin langsung mencoba fitur peta dan analisis:
```bash
npm run seed:demo
```
Perintah ini akan otomatis mengisi data simulasi kecamatan dan sekolah di Kabupaten Bogor.

### Pilihan B: Menggunakan Data Nyata Hasil Olahan
Jika ingin mengunggah data resmi batas kecamatan dan SMP Kota/Kabupaten Bogor:
1. Jalankan backend:
   ```bash
   npm run dev
   ```
2. Di terminal baru, jalankan frontend:
   ```bash
   cd sadar-edu-main
   npm install
   npm run dev
   ```
3. Buka browser di `http://localhost:5173/login`.
4. Masuk dengan akun Operator:
   * **Email:** `operator@sadaredu.id`
   * **Password:** `operator123`
5. Masuk ke menu **Impor Dataset** (`/operator/impor`) dan unggah file GeoJSON:
   * Data Wilayah: `wilayah_kecamatan_bogor (1).json`
   * Data Sekolah: `SMPbogorSudahDiolah.json`

---

## 7. Solusi Masalah Umum (Troubleshooting)

### Masalah 1: `password authentication failed for user "postgres"`
* **Penyebab:** Password di file `.env` pada parameter `DB_PASSWORD` tidak cocok dengan password postgres laptop Anda.
* **Solusi:** Buka file `.env` di `SadarEdu-be-main`, lalu perbaiki password pada baris `DB_PASSWORD=...`.

### Masalah 2: `database "SadarEdu" does not exist`
* **Penyebab:** Database belum dibuat atau nama database di pgAdmin salah ketik.
* **Solusi:** Pastikan di pgAdmin nama databasenya persis: `SadarEdu` (huruf S dan E besar).

### Masalah 3: `could not open extension control file ".../postgis.control"`
* **Penyebab:** Komponen PostGIS belum terinstal di instalasi PostgreSQL Anda.
* **Solusi:** Buka Windows Start Menu $\rightarrow$ cari dan buka **Stack Builder** $\rightarrow$ pilih instalasi PostgreSQL Anda $\rightarrow$ centang **Spatial Extensions** $\rightarrow$ **PostGIS Bundle** $\rightarrow$ selesaikan instalasi $\rightarrow$ jalankan ulang `CREATE EXTENSION postgis;` di pgAdmin.

### Masalah 4: `port 5432 already in use` atau Service PostgreSQL Berhenti
* **Penyebab:** Layanan (*Service*) PostgreSQL belum berjalan.
* **Solusi:** Buka Windows Task Manager $\rightarrow$ tab **Services** $\rightarrow$ cari service bernama `postgresql-x64-XX` $\rightarrow$ klik kanan dan pilih **Start**.

---

*Dokumen panduan ini disiapkan untuk tim pengembang SADAR-EDU V1.*
