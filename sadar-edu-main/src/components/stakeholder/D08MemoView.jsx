import { useState } from "react";
import { ArrowLeft, Download, Save, AlertTriangle, CheckCircle2, Clock, FileText, Check, ShieldCheck } from "lucide-react";
import { useDataStore } from "../../store/useDataStore";
import { useAuthStore } from "../../store/useAuthStore";
import { fmt } from "../../lib/analysis";

export default function D08MemoView({ onNavigate }) {
  const { user } = useAuthStore();
  const { ringkasan, candidates } = useDataStore();

  const [saved, setSaved] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      "BAGIAN,KOMPONEN,KETERANGAN\n" +
      "Ringkasan Eksekutif,Rekomendasi,Kandidat A berpotensi mengurangi gap layanan pada skenario dasar namun belum menutup seluruh kebutuhan.\n" +
      "Bukti Utama,Gap Layanan,Tetap positif pada skenario dasar\n" +
      "Bukti Utama,Akses 3km,Membaik dari 71% menjadi 84%\n" +
      "Bukti Utama,Ketahanan,Hasil bertahan ketika skenario pertumbuhan dinaikkan\n" +
      "Audit Lanjutan,Status Lahan,Wajib verifikasi sertifikat BPN dan status aset Pemkab\n" +
      "Audit Lanjutan,Audit Sekolah,Periksa kapasitas riil sekolah terdekat\n" +
      "Audit Lanjutan,Akses Jalan,Pelebaran dan akses kendaraan roda empat\n" +
      "Audit Lanjutan,Anggaran,Sinkronisasi pagu DAK dan APBD lintas tahun\n" +
      "Tindak Lanjut,Tahap 1,Verifikasi data - Dinas Tata Ruang\n" +
      "Tindak Lanjut,Tahap 2,Survei fisik lahan - Bappeda & BPKAD\n" +
      "Tindak Lanjut,Tahap 3,Kajian dampak lalu lintas - Dinas Perhubungan\n" +
      "Tindak Lanjut,Tahap 4,Kajian kelayakan fiskal - BPKAD / Keuangan\n" +
      "Tindak Lanjut,Tahap 5,Keputusan penetapan lokasi - Forum Lintas Dinas\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Memo_Keputusan_Dinas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleSimpanDraf = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="dinas-page-container">
      {/* Heading */}
      <div className="dinas-section-heading">
        <div>
          <span className="dinas-eyebrow">DRAF MEMO KEBIJAKAN</span>
          <h1 className="dinas-page-title">Ringkasan keputusan yang dapat diaudit</h1>
          <p className="dinas-page-sub">
            Pisahkan temuan data, asumsi simulasi, ketidakpastian, dan keputusan manusia.
          </p>
        </div>
        <button
          onClick={() => onNavigate("ringkasan")}
          className="dinas-btn-secondary"
        >
          <ArrowLeft size={15} />
          <span>Kembali ke dashboard</span>
        </button>
      </div>

      {/* Top Banner Alert */}
      <div className="dinas-warning-box flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-[#92400E] shrink-0" />
          <div>
            <strong className="text-sm text-[#92400E]">Status: Perlu telaah lintas dinas</strong>
            <p className="text-xs text-[#78350F] mt-0.5">
              Belum memenuhi syarat keputusan pencantuman mitra/penganggaran definitif sebelum seluruh verifikasi terpenuhi.
            </p>
          </div>
        </div>
        <span className="dinas-tag-pill is-amber">● DRAF KEBIJAKAN</span>
      </div>

      <div className="dinas-split-grid mt-6">
        {/* Left: Ringkasan Eksekutif & Bukti Utama */}
        <section className="dinas-card" aria-label="Ringkasan eksekutif dan bukti">
          <div className="dinas-card-header">
            <div>
              <h2 className="dinas-card-title">Ringkasan eksekutif</h2>
              <p className="dinas-card-sub">Disusun oleh: {user?.nama || "Analis Perencanaan Wilayah Dinas Pendidikan"}</p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Kandidat A berpotensi mengurangi gap layanan pada contoh skenario dasar sebesar 720 kursi dan menaikkan jangkauan akses 3 km dari 71% menjadi 84%. Namun demikian, pembangunan unit baru belum menutup seluruh kebutuhan secara permanen. Status lahan, mitigasi risiko bencana, pagu biaya konstruksi, dan jaringan jalan masih harus diverifikasi lintas instansi.
            </p>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Bukti Utama yang Mendukung
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span className="text-slate-800">Gap layanan tetap positif konsisten pada ketiga proyeksi pertumbuhan (Rendah, Dasar, Tinggi).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span className="text-slate-800">Aksesibilitas radius 3 km membaik secara signifikan (+13 poin persentase keterlayanan).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span className="text-slate-800">Beban rombel dan utilisasi sekolah SMP sekitar terurai dari 112% (overcapacity) menjadi 95%.</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Data & Dokumen yang Masih Dibutuhkan
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Status sertifikat dan kepastian luasan lahan bebas sengketa (ATR/BPN & BPKAD).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Audit kapasitas riil ruang kelas sekolah sekitar untuk opsi intervensi penambahan RKB.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Kajian geometrik jalan masuk dan kelaikan operasional transportasi pelajar (Dishub).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Batas pagu alokasi anggaran fisik dalam KUA-PPAS tahun anggaran berikutnya.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Right: Tindak Lanjut Lintas Dinas Stepper */}
        <section className="dinas-card" aria-label="Tindak lanjut lintas dinas">
          <div className="dinas-card-header">
            <div>
              <h2 className="dinas-card-title">Tindak lanjut</h2>
              <p className="dinas-card-sub">Tahapan koordinasi antar perangkat daerah</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <div className="dinas-followup-step">
                <div className="dinas-followup-badge">1</div>
                <div>
                  <strong className="text-xs text-slate-900 block">Verifikasi data spasial</strong>
                  <span className="text-[11px] text-slate-500">Dinas Tata Ruang & Pertanahan (DTRP)</span>
                </div>
              </div>

              <div className="dinas-followup-step">
                <div className="dinas-followup-badge">2</div>
                <div>
                  <strong className="text-xs text-slate-900 block">Survei fisik dan legalitas lahan</strong>
                  <span className="text-[11px] text-slate-500">Bappeda & Bidang Aset BPKAD</span>
                </div>
              </div>

              <div className="dinas-followup-step">
                <div className="dinas-followup-badge">3</div>
                <div>
                  <strong className="text-xs text-slate-900 block">Kajian akses dan transportasi</strong>
                  <span className="text-[11px] text-slate-500">Dinas Perhubungan Kabupaten Bogor</span>
                </div>
              </div>

              <div className="dinas-followup-step">
                <div className="dinas-followup-badge">4</div>
                <div>
                  <strong className="text-xs text-slate-900 block">Kajian kapasitas fiskal & penganggaran</strong>
                  <span className="text-[11px] text-slate-500">Badan Pengelola Keuangan dan Aset Daerah</span>
                </div>
              </div>

              <div className="dinas-followup-step">
                <div className="dinas-followup-badge">5</div>
                <div>
                  <strong className="text-xs text-slate-900 block">Keputusan penetapan lokasi</strong>
                  <span className="text-[11px] text-slate-500">Forum Koordinasi Pimpinan Daerah / Bupati</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={handleSimpanDraf}
                className="dinas-btn-primary w-full justify-center"
              >
                <Save size={15} />
                <span>{saved ? "Draf Memo Berhasil Disimpan!" : "Simpan draf memo"}</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="dinas-btn-secondary w-full justify-center"
              >
                <Download size={15} />
                <span>{downloaded ? "Unduhan Dimulai..." : "Unduh ringkasan CSV"}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
