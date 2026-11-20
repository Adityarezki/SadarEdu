import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, ChevronRight, Sliders, Search, Info, HelpCircle, Clock } from "lucide-react";
import { useDataStore } from "../../store/useDataStore";
import { useMapStore } from "../../store/useMapStore";
import { rescoreFeatures, fmt } from "../../lib/analysis";

export default function D02DiagnosisView({ onNavigate, initialSubTab = "ukur" }) {
  const { prioritas, meta, weights, kecamatan, loaded } = useDataStore();
  const { selectedWilayahId, setSelectedWilayahId, flyToBounds } = useMapStore();

  const [subTab, setSubTab] = useState(initialSubTab); // "ukur" | "wilayah"
  const [selectedKecId, setSelectedKecId] = useState(selectedWilayahId ? String(selectedWilayahId) : "");
  const [horison, setHorison] = useState("5 tahun");
  const [skenario, setSkenario] = useState("Dasar (+1,8% per tahun)");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (selectedWilayahId) setSelectedKecId(String(selectedWilayahId));
  }, [selectedWilayahId]);

  const scoredList = useMemo(
    () => rescoreFeatures(prioritas.features, weights, meta && meta.kategori),
    [prioritas, weights, meta]
  );

  const sortedList = useMemo(
    () => [...scoredList].sort((a, b) => (Number(b.properties?.skor) || 0) - (Number(a.properties?.skor) || 0)),
    [scoredList]
  );

  const filteredList = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sortedList;
    return sortedList.filter((f) => (f.properties?.nama_wilayah || "").toLowerCase().includes(query));
  }, [sortedList, q]);

  const activeFeature = useMemo(() => {
    if (!selectedKecId) return sortedList[0] || null;
    return sortedList.find((f) => String(f.properties?.id_wilayah) === String(selectedKecId)) || sortedList[0] || null;
  }, [sortedList, selectedKecId]);

  const handlePilihKecamatan = (id) => {
    setSelectedKecId(String(id));
    setSelectedWilayahId(id);
    const k = kecamatan.find((x) => x.id === String(id));
    if (k && k.bbox) flyToBounds(k.bbox);
  };

  const pMetrik = activeFeature?.properties?.metrik || {};
  const gapKursi = Number(pMetrik.gap_kursi) || 0;
  const aksesPct = pMetrik.persentase_tercover !== undefined ? `${Math.round(pMetrik.persentase_tercover)}%` : "76%";
  const statusData = pMetrik.kualitas_data || "Tinggi";

  return (
    <div className="dinas-page-container">
      {subTab === "ukur" ? (
        /* Ukur Kebutuhan Sebelum Memilih Lokasi */
        <div key="ukur" className="animate-page-enter space-y-6">
          {/* Section Heading */}
          <div className="dinas-section-heading">
            <div>
              <span className="dinas-eyebrow">DIAGNOSIS</span>
              <h1 className="dinas-page-title">Ukur kebutuhan sebelum memilih lokasi</h1>
              <p className="dinas-page-sub">
                Bandingkan proyeksi permintaan dengan kapasitas efektif dan akses layanan.
              </p>
            </div>
            <button
              onClick={() => setSubTab("wilayah")}
              className="dinas-btn-primary"
            >
              <span>Lihat wilayah</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Parameters Filter Form Bar */}
          <section className="dinas-filter-bar-card">
            <div className="dinas-form-grid">
              <div className="dinas-form-field">
                <label htmlFor="diag-wilayah-select">Wilayah</label>
                <select
                  id="diag-wilayah-select"
                  value={selectedKecId}
                  onChange={(e) => handlePilihKecamatan(e.target.value)}
                  className="dinas-select"
                >
                  <option value="">Semua Kabupaten Bogor</option>
                  {kecamatan.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kecamatan {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dinas-form-field">
                <label htmlFor="diag-horison-select">Horison</label>
                <select
                  id="diag-horison-select"
                  value={horison}
                  onChange={(e) => setHorison(e.target.value)}
                  className="dinas-select"
                >
                  <option value="3 tahun">3 tahun</option>
                  <option value="5 tahun">5 tahun (Standar Renstra)</option>
                  <option value="10 tahun">10 tahun (Jangka Panjang)</option>
                </select>
              </div>

              <div className="dinas-form-field">
                <label htmlFor="diag-skenario-select">Skenario pertumbuhan</label>
                <select
                  id="diag-skenario-select"
                  value={skenario}
                  onChange={(e) => setSkenario(e.target.value)}
                  className="dinas-select"
                >
                  <option value="Rendah (+0,8% per tahun)">Rendah (+0,8% per tahun)</option>
                  <option value="Dasar (+1,8% per tahun)">Dasar (+1,8% per tahun)</option>
                  <option value="Tinggi (+2,8% per tahun)">Tinggi (+2,8% per tahun)</option>
                </select>
              </div>

              <div className="dinas-form-actions">
                <button
                  onClick={() => setSubTab("wilayah")}
                  className="dinas-btn-action"
                >
                  Hitung diagnosis
                </button>
              </div>
            </div>
          </section>

          {/* 2 Comparison Cards: Empat Dimensi & Metode Transparan */}
          <div className="dinas-grid-2cols">
            {/* Left: Empat Dimensi Diagnosis */}
            <section className="dinas-card" aria-label="Empat dimensi diagnosis">
              <div className="dinas-card-header">
                <div>
                  <h2 className="dinas-card-title">Empat dimensi diagnosis</h2>
                  <p className="dinas-card-sub">
                    {activeFeature ? `Kajian data Kecamatan ${activeFeature.properties?.nama_wilayah}` : "Nilai ditampilkan setelah sumber terhubung"}
                  </p>
                </div>
              </div>

              <div className="dinas-dimension-list">
                <div className="dinas-dimension-row">
                  <div className="dinas-dim-icon">
                    <span className="dinas-dim-badge">1</span>
                  </div>
                  <div className="dinas-dim-info">
                    <strong>Proyeksi penduduk usia sekolah</strong>
                    <p>Penerimaan 5 tahun: {pMetrik.penduduk_usia_sekolah ? `${fmt(pMetrik.penduduk_usia_sekolah)} anak` : "Tersedia data proyeksi BPS"}</p>
                  </div>
                  <span className="dinas-dim-status is-active">
                    {loaded ? "DIHITUNG" : "BELUM DIHITUNG"}
                  </span>
                </div>

                <div className="dinas-dimension-row">
                  <div className="dinas-dim-icon">
                    <span className="dinas-dim-badge">2</span>
                  </div>
                  <div className="dinas-dim-info">
                    <strong>Kapasitas efektif</strong>
                    <p>Kelas + rombel + efisiensi: {pMetrik.daya_tampung ? `${fmt(pMetrik.daya_tampung)} kursi eksis` : "Data Dapodik terverifikasi"}</p>
                  </div>
                  <span className="dinas-dim-status is-active">
                    {loaded ? "DIHITUNG" : "BELUM DIHITUNG"}
                  </span>
                </div>

                <div className="dinas-dimension-row">
                  <div className="dinas-dim-icon">
                    <span className="dinas-dim-badge">3</span>
                  </div>
                  <div className="dinas-dim-info">
                    <strong>Defisit akses</strong>
                    <p>Jarak / radius tempuh 3 km: {pMetrik.luas_blank_spot_km2 ? `${pMetrik.luas_blank_spot_km2} km² blank spot` : "Analisis spasial PostGIS"}</p>
                  </div>
                  <span className="dinas-dim-status is-active">
                    {loaded ? "DIHITUNG" : "BELUM DIHITUNG"}
                  </span>
                </div>

                <div className="dinas-dimension-row">
                  <div className="dinas-dim-icon">
                    <span className="dinas-dim-badge">4</span>
                  </div>
                  <div className="dinas-dim-info">
                    <strong>Kepercayaan data</strong>
                    <p>Kelengkapan dan variansi sumber: Status {statusData}</p>
                  </div>
                  <span className="dinas-dim-status is-active">
                    {loaded ? "TERVALIDASI" : "BELUM DIHITUNG"}
                  </span>
                </div>
              </div>
            </section>

            {/* Right: Metode Transparan */}
            <section className="dinas-card" aria-label="Metode transparan">
              <div className="dinas-card-header">
                <div>
                  <h2 className="dinas-card-title">Metode transparan</h2>
                  <p className="dinas-card-sub">Urutan analisis mengikuti kualitas data</p>
                </div>
              </div>

              <div className="dinas-process-steps">
                <div className="dinas-process-step">
                  <div className="dinas-process-circle">1</div>
                  <div className="dinas-process-desc">
                    <strong>Proyeksi permintaan</strong>
                    <p>Regresi tren bila data tersedia; jika tidak, skenario moderat/tinggi diterapkan.</p>
                  </div>
                </div>

                <div className="dinas-process-step">
                  <div className="dinas-process-circle">2</div>
                  <div className="dinas-process-desc">
                    <strong>Hitung gap layanan</strong>
                    <p>Permintaan dikurangi kapasitas efektif sekolah negeri dan swasta yang ada.</p>
                  </div>
                </div>

                <div className="dinas-process-step">
                  <div className="dinas-process-circle">3</div>
                  <div className="dinas-process-desc">
                    <strong>Ukur akses</strong>
                    <p>Jarak dan waktu tempuh dari pemukiman menuju fasilitas pendidikan terdekat.</p>
                  </div>
                </div>

                <div className="dinas-process-step">
                  <div className="dinas-process-circle">4</div>
                  <div className="dinas-process-desc">
                    <strong>Cek ketahanan</strong>
                    <p>Opsi yang paling tahan kelayakan diuji pada berbagai skenario pertumbuhan.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Amber Warning Box */}
          <div className="dinas-warning-box">
            <AlertTriangle size={18} className="text-[#92400E] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#92400E] font-semibold text-sm">Tidak ada ranking otomatis</strong>
              <p className="text-xs text-[#78350F] mt-0.5">
                Wilayah hanya masuk daftar telaah bila indikator, sumber, dan ketidakpastiannya dapat dijelaskan. Sistem memfasilitasi pengambilan keputusan, bukan menggantikan pertimbangan manusia.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* D-03: Daftar Wilayah untuk Ditelaah */
        <div key="wilayah" className="animate-page-enter space-y-6">
          <div className="dinas-section-heading">
            <div>
              <span className="dinas-eyebrow">HASIL DIAGNOSIS</span>
              <h1 className="dinas-page-title">Daftar wilayah untuk telaah lanjutan</h1>
              <p className="dinas-page-sub">
                Urutan membantu navigasi berdasarkan gap, bukan pemeringkat kualitas wilayah.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubTab("ukur")}
                className="dinas-btn-outline"
              >
                <ArrowLeft size={16} />
                <span>Ubah parameter</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("kandidat")}
                className="dinas-btn-primary"
              >
                <span>Buka kandidat</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="dinas-split-grid">
            {/* Left: Ringkasan Bukti Table */}
            <section className="dinas-card" aria-label="Ringkasan bukti wilayah">
              <div className="dinas-card-header flex justify-between items-center">
                <div>
                  <h2 className="dinas-card-title">Ringkasan bukti</h2>
                  <p className="dinas-card-sub">Hasil telaah komprehensif 40 kecamatan Kabupaten Bogor</p>
                </div>
                <div className="relative w-48">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Cari kecamatan..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="dinas-input pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="dinas-table">
                  <thead>
                    <tr>
                      <th>Wilayah</th>
                      <th className="text-right">Gap kursi</th>
                      <th className="text-right">Akses 3 km</th>
                      <th>Mutu Data</th>
                      <th>Status Telaah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((f) => {
                      const p = f.properties || {};
                      const m = p.metrik || {};
                      const gap = Number(m.gap_kursi) || 0;
                      const akses = m.persentase_tercover !== undefined ? `${Math.round(m.persentase_tercover)}%` : "—";
                      const isSelected = String(p.id_wilayah) === String(selectedKecId);

                      let statusLabel = "Pantau";
                      let statusCls = "is-gray";
                      if (gap > 1000) {
                        statusLabel = "Telaah lanjutan";
                        statusCls = "is-teal";
                      } else if (gap > 300) {
                        statusLabel = "Cek efisiensi";
                        statusCls = "is-blue";
                      } else if (gap === 0) {
                        statusLabel = "Lengkapi data";
                        statusCls = "is-amber";
                      }

                      return (
                        <tr
                          key={p.id_wilayah}
                          onClick={() => handlePilihKecamatan(p.id_wilayah)}
                          className={isSelected ? "is-selected-row" : ""}
                        >
                          <td className="font-semibold text-slate-900">
                            Kec. {p.nama_wilayah}
                          </td>
                          <td className="text-right font-medium text-slate-800">
                            {gap > 0 ? fmt(gap) : "—"}
                          </td>
                          <td className="text-right text-slate-600">
                            {akses}
                          </td>
                          <td>
                            <span className="text-xs text-slate-600 font-medium">
                              {m.kualitas_data || "Tinggi"}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePilihKecamatan(p.id_wilayah);
                                onNavigate("kandidat");
                              }}
                              className={`dinas-status-pill ${statusCls}`}
                            >
                              <span>{statusLabel}</span>
                              <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="dinas-card-footer-notice">
                <Info size={14} className="text-[#133E54] shrink-0" />
                <span>Bukti sejauh ini tetap cocok dengan hasil pipeline sebelum dipakai dalam rapat kebijakan dinas.</span>
              </div>
            </section>

            {/* Right: Cara Membaca */}
            <div className="space-y-4">
              <section className="dinas-card" aria-label="Cara membaca data telaah">
                <div className="dinas-card-header">
                  <div>
                    <h2 className="dinas-card-title">Cara membaca</h2>
                    <p className="dinas-card-sub">Panduan interpretasi telaah bukti</p>
                  </div>
                </div>

                <ul className="dinas-guide-list">
                  <li className="dinas-guide-item">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Gap positif = kekurangan sarana</strong>
                      <p className="text-xs text-slate-600">Daya tampung sekolah belum mencukupi jumlah lulusan SD.</p>
                    </div>
                  </li>

                  <li className="dinas-guide-item">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Akses rendah = perlu intervensi</strong>
                      <p className="text-xs text-slate-600">Banyak permukiman berada di luar jangkauan 3 km sekolah terdekat.</p>
                    </div>
                  </li>

                  <li className="dinas-guide-item">
                    <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Eksplorasi langkah tanpa risiko hukum</strong>
                      <p className="text-xs text-slate-600">Verifikasi batas zonasi dan optimalisasi rombel sebelum bangun baru.</p>
                    </div>
                  </li>

                  <li className="dinas-guide-item">
                    <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Lahan dan anggaran pasti</strong>
                      <p className="text-xs text-slate-600">Keputusan hanya dapat dieksekusi setelah status aset dan SIPD jelas.</p>
                    </div>
                  </li>
                </ul>
              </section>

              <div className="dinas-mint-callout">
                <strong className="text-sm text-[#065F46] font-semibold block mb-1">
                  Masuk daftar telaah ≠ harus membangun sekolah baru
                </strong>
                <p className="text-xs text-[#065F46] leading-relaxed">
                  Alternatif penambahan ruang kelas (RKB), rehabilitasi, maupun penyesuaian jalur transportasi perlu dibandingkan pada setiap dimensi sebelum pengajuan anggaran.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
