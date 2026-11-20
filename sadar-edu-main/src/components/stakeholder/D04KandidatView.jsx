import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Sliders,
  X,
  Check,
  Building,
  Ruler,
  Info,
  DollarSign,
  Users,
  Target,
  Sparkles,
} from "lucide-react";
import { useDataStore } from "../../store/useDataStore";
import { useMapStore } from "../../store/useMapStore";
import { fmt } from "../../lib/analysis";
import MapCanvas from "../map/MapCanvas";

export default function D04KandidatView({ onNavigate, initialSubTab = "alternatif" }) {
  const { candidates, kecamatan, weights, setWeight } = useDataStore();
  const { selectedCandidateId, setSelectedCandidateId, setLayer } = useMapStore();

  const [subTab, setSubTab] = useState(initialSubTab); // "alternatif" | "detail"
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

  // Sync initialSubTab
  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Kunci gerbang sebelum simulasi
  const [gateLocks, setGateLocks] = useState({
    penduduk: true,
    kapasitas: true,
    tataruang: false,
    anggaran: false,
  });

  // Bobot kriteria MCDA interaktif
  const [mcdaWeights, setMcdaWeights] = useState({
    gap: 35,
    akses: 25,
    utilisasi: 20,
    lahan: 10,
    anggaran: 10,
  });

  const mcdaTotal = useMemo(() => {
    return (
      Number(mcdaWeights.gap) +
      Number(mcdaWeights.akses) +
      Number(mcdaWeights.utilisasi) +
      Number(mcdaWeights.lahan) +
      Number(mcdaWeights.anggaran)
    );
  }, [mcdaWeights]);

  const handleWeightChange = (key, val) => {
    setMcdaWeights((prev) => ({ ...prev, [key]: Number(val) }));
  };

  const handleResetWeights = () => {
    setMcdaWeights({
      gap: 35,
      akses: 25,
      utilisasi: 20,
      lahan: 10,
      anggaran: 10,
    });
  };

  const candidateList = useMemo(() => {
    if (candidates?.features && candidates.features.length > 0) {
      return candidates.features.map((f, i) => {
        const p = f.properties || {};
        return {
          id: p.id_candidate || p.id || i + 1,
          name: p.nama_lokasi || `Kandidat ${String.fromCharCode(65 + i)}`,
          kecamatan: p.kecamatan || "Cigombong",
          luas: p.luas_m2 ? `${fmt(p.luas_m2)} m²` : "12.500 m²",
          skor: p.skor_kesesuaian ? Number(p.skor_kesesuaian).toFixed(1) : (82.5 - i * 4.2).toFixed(1),
          keunggulan:
            p.keunggulan ||
            (i === 0
              ? "Dekat pusat pemukiman & jaringan jalan"
              : i === 1
              ? "Lahan verifikasi milik Pemkab tersedia"
              : "Menutup area blank spot perbatasan"),
          catatan:
            p.catatan ||
            (i === 0
              ? "Akses jalan 6 meter, topografi datar"
              : i === 1
              ? "Perlu kajian pematangan lahan"
              : "Jalan masuk masih perkerasan agregat"),
          feature: f,
        };
      });
    }

    // Default 3 candidates matching Figma mockups
    return [
      {
        id: 1,
        name: "Kandidat A",
        kecamatan: "Cigombong",
        luas: "12.500 m²",
        skor: "84.2",
        keunggulan: "Dekat pusat pemukiman",
        catatan: "Akses jalan 6 meter, topografi datar, dekat SD pendukung",
      },
      {
        id: 2,
        name: "Kandidat B",
        kecamatan: "Cigombong",
        luas: "15.000 m²",
        skor: "79.8",
        keunggulan: "Lahan verifikasi tersedia",
        catatan: "Aset tercatat di BPKAD, bebas sengketa batas",
      },
      {
        id: 3,
        name: "Kandidat C",
        kecamatan: "Cigombong",
        luas: "10.200 m²",
        skor: "73.5",
        keunggulan: "Menutup area pinggiran",
        catatan: "Akses jalan sekunder, perlu pelebaran jembatan",
      },
    ];
  }, [candidates]);

  const activeCandidate = candidateList[selectedCandidateIndex] || candidateList[0];

  // Atur Skenario Modal State
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioSavedToast, setScenarioSavedToast] = useState(false);
  const [scenarioForm, setScenarioForm] = useState({
    tipe: "USB", // USB | RKB
    wilayahId: "1",
    kandidat: "Kandidat A (Cigombong)",
    horison: "5 tahun",
    kapasitasBaru: 720,
    pertumbuhan: "Dasar (+1,8% per tahun)",
    radius: 3,
    pagu: "Rp 15.000.000.000",
  });

  // Sinkronkan nama kandidat aktif ke form skenario bila berubah
  useEffect(() => {
    if (activeCandidate) {
      setScenarioForm((prev) => ({
        ...prev,
        kandidat: `${activeCandidate.name} (${activeCandidate.kecamatan})`,
      }));
    }
  }, [activeCandidate]);

  const toggleGate = (key) => {
    setGateLocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePilihKandidat = (idx) => {
    setSelectedCandidateIndex(idx);
    const cand = candidateList[idx];
    if (cand?.id) setSelectedCandidateId(cand.id);
  };

  const handleSaveScenario = () => {
    setScenarioModalOpen(false);
    setScenarioSavedToast(true);
    setTimeout(() => {
      setScenarioSavedToast(false);
    }, 4500);
  };

  const handleApplyAndSimulate = () => {
    setScenarioModalOpen(false);
    onNavigate("simulasi", "uji", scenarioForm);
  };

  return (
    <div className="dinas-page-container">
      {subTab === "alternatif" ? (
        /* Bandingkan Alternatif Lokasi */
        <div key="alternatif" className="animate-page-enter space-y-6">
          <div className="dinas-section-heading">
            <div>
              <span className="dinas-eyebrow">KANDIDAT LOKASI</span>
              <h1 className="dinas-page-title">Bandingkan alternatif lokasi</h1>
              <p className="dinas-page-sub">
                Tinjau cakupan, akses, lahan, dan keterbatasan setiap kandidat sebelum masuk simulasi.
              </p>
            </div>
            <button
              onClick={() => setSubTab("detail")}
              className="dinas-btn-primary"
            >
              <span>Detail {activeCandidate.name}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="dinas-split-grid">
            {/* Left: Peta Kandidat Canvas */}
            <div className="space-y-4">
              <section className="dinas-card dinas-map-card" aria-label="Peta kandidat">
                <div className="dinas-card-header">
                  <div>
                    <h2 className="dinas-card-title">Peta kandidat</h2>
                    <p className="dinas-card-sub">Peta interaktif · Sebaran titik kandidat lahan potensial</p>
                  </div>
                  <span className="dinas-tag-pill is-teal">3 Lokasi Teridentifikasi</span>
                </div>

                <div className="dinas-map-embed-wrapper h-[380px]">
                  <MapCanvas />
                </div>

                <div className="dinas-candidate-legend-pills">
                  {candidateList.slice(0, 3).map((c, i) => (
                    <div
                      key={c.id}
                      onClick={() => handlePilihKandidat(i)}
                      className={`dinas-candidate-legend-pill ${selectedCandidateIndex === i ? "is-active" : ""}`}
                    >
                      <span className="dinas-legend-badge">{String.fromCharCode(65 + i)}</span>
                      <span>{c.keunggulan}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Amber Warning Box */}
              <div className="dinas-warning-box">
                <AlertTriangle size={18} className="text-[#92400E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#92400E] font-semibold text-sm">
                    Lokasi kandidat harus melalui verifikasi lapangan
                  </strong>
                  <p className="text-xs text-[#78350F] mt-0.5">
                    Peta tidak menggantikan status kepemilikan sertifikat, risiko bencana alam (longsor/banjir), dan kesesuaian rencana tata ruang wilayah (RTRW).
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Daftar Kandidat & Callout */}
            <div className="space-y-4">
              <section className="dinas-card" aria-label="Daftar kandidat lahan">
                <div className="dinas-card-header flex justify-between items-center">
                  <div>
                    <h2 className="dinas-card-title">Kandidat lahan</h2>
                    <p className="dinas-card-sub">Pilih lokasi untuk telaah mendalam</p>
                  </div>
                  <span className="dinas-tag-pill is-amber">PILIHAN TELAAH</span>
                </div>

                <div className="space-y-3 p-4">
                  {candidateList.map((c, idx) => {
                    const isSelected = selectedCandidateIndex === idx;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handlePilihKandidat(idx)}
                        className={`dinas-candidate-card ${isSelected ? "is-selected" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="dinas-candidate-badge">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <div>
                              <h3 className="font-semibold text-sm text-slate-900">{c.name}</h3>
                              <p className="text-xs text-slate-500">Kec. {c.kecamatan} · {c.luas}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="dinas-status-pill is-teal">
                              ● SIAP TELAAH
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePilihKandidat(idx);
                                setSubTab("detail");
                              }}
                              className="text-xs font-semibold text-[#1b4965] hover:text-[#133e54] flex items-center gap-1 pl-1"
                            >
                              Detail <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-2.5 pl-9">
                          {c.catatan}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs pl-9">
                          <span className="text-slate-500 font-medium">Skor Kesesuaian</span>
                          <span className="font-bold text-[#133E54]">{c.skor}/100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="dinas-mint-callout">
                <strong className="text-sm text-[#065F46] font-semibold block mb-1">
                  Belum ada kandidat "terbaik" mutlak
                </strong>
                <p className="text-xs text-[#065F46] leading-relaxed">
                  Bobot kriteria dan trade-off sosial-anggaran harus diperiksa bersama tim teknis sebelum melakukan simulasi pembangunan.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detail Kandidat Terpilih */
        <div key="detail" className="animate-page-enter space-y-6">
          <div className="dinas-section-heading">
            <div>
              <span className="dinas-eyebrow">
                KANDIDAT {activeCandidate.name.toUpperCase()} · {activeCandidate.kecamatan.toUpperCase()}
              </span>
              <h1 className="dinas-page-title">Bukti dan kelayakan kandidat</h1>
              <p className="dinas-page-sub">
                Periksa tiap dimensi dan atur parameter skenario sebelum menjalankan simulasi what-if.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubTab("alternatif")}
                className="dinas-btn-outline"
              >
                <ArrowLeft size={16} />
                <span>Bandingkan alternatif</span>
              </button>
              <button
                type="button"
                onClick={() => setScenarioModalOpen(true)}
                className="dinas-btn-action bg-[#1b4965] hover:bg-[#133e54] text-white flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs transition-colors shadow-xs"
              >
                <Sliders size={15} />
                <span>Atur skenario</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("simulasi", "uji", scenarioForm)}
                className="dinas-btn-primary"
              >
                <span>Jalur skenario</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Toast Notifikasi Tersimpan */}
          {scenarioSavedToast && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 animate-fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  <strong>Parameter Skenario Berhasil Disimpan:</strong> {scenarioForm.tipe} · {scenarioForm.kapasitasBaru} Kursi · Radius {scenarioForm.radius} km · Horison {scenarioForm.horison} · {scenarioForm.pagu}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setScenarioSavedToast(false)}
                className="text-emerald-600 hover:text-emerald-900"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="dinas-grid-2cols">
            {/* Top-Left: Lokasi dan Cakupan */}
            <section className="dinas-card" aria-label="Lokasi dan cakupan">
              <div className="dinas-card-header">
                <div>
                  <h2 className="dinas-card-title">Lokasi dan cakupan</h2>
                  <p className="dinas-card-sub">Peta mikro · Kandidat belum diverifikasi di lapangan</p>
                </div>
              </div>
              <div className="dinas-map-embed-wrapper relative h-[240px] m-4 rounded-xl border border-slate-200 overflow-hidden">
                <MapCanvas />
              </div>
              <div className="px-5 pb-4 text-xs text-slate-600 flex justify-between">
                <span>
                  Estimasi radius layanan: <strong>{scenarioForm.radius}.000 meter</strong>
                </span>
                <span>
                  Luas lahan: <strong>{activeCandidate.luas}</strong>
                </span>
              </div>
            </section>

            {/* Top-Right: Metriks Bukti */}
            <section className="dinas-card" aria-label="Metriks bukti">
              <div className="dinas-card-header">
                <div>
                  <h2 className="dinas-card-title">Metriks bukti</h2>
                  <p className="dinas-card-sub">Validasi indikator teknis lokasi</p>
                </div>
              </div>

              <div className="p-4">
                <table className="dinas-table">
                  <thead>
                    <tr>
                      <th>Dimensi</th>
                      <th>Bukti</th>
                      <th>Status Telaah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold text-slate-900">Gap permintaan</td>
                      <td>Relevan (Tinggi)</td>
                      <td>
                        <span className="dinas-status-pill is-teal">Perlu data aktual</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Defisit akses</td>
                      <td>Relevan (Blank Spot)</td>
                      <td>
                        <span className="dinas-status-pill is-teal">Perlu data aktual</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Status lahan</td>
                      <td>Aset Pemkab / Tanah Kas Desa</td>
                      <td>
                        <span className="dinas-status-pill is-amber">Wajib verifikasi BPN</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Aksesibilitas jalan</td>
                      <td>Lebar jalan ≥6m</td>
                      <td>
                        <span className="dinas-status-pill is-blue">Tinjauan Dishub</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bottom-Left: Bobot Penilaian MCDA Interaktif */}
            <section className="dinas-card" aria-label="Bobot penilaian MCDA">
              <div className="dinas-card-header flex justify-between items-center">
                <div>
                  <h2 className="dinas-card-title">Bobot penilaian MCDA</h2>
                  <p className="dinas-card-sub">Bobot kriteria kebijakan (Geser slider untuk penyesuaian)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      mcdaTotal === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Total: {mcdaTotal}%
                  </span>
                  <button
                    type="button"
                    onClick={handleResetWeights}
                    className="text-[11px] font-medium text-slate-500 hover:text-[#1b4965] underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800">Gap permintaan peserta didik</span>
                    <span className="text-[#133E54]">{mcdaWeights.gap}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={mcdaWeights.gap}
                    onChange={(e) => handleWeightChange("gap", e.target.value)}
                    className="w-full accent-[#133E54] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800">Defisit akses geografis (blank spot)</span>
                    <span className="text-[#133E54]">{mcdaWeights.akses}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={mcdaWeights.akses}
                    onChange={(e) => handleWeightChange("akses", e.target.value)}
                    className="w-full accent-[#133E54] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800">Utilisasi & kapasitas sekolah sekitar</span>
                    <span className="text-[#133E54]">{mcdaWeights.utilisasi}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={mcdaWeights.utilisasi}
                    onChange={(e) => handleWeightChange("utilisasi", e.target.value)}
                    className="w-full accent-[#133E54] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800">Kelayakan status lahan</span>
                    <span className="text-[#133E54]">{mcdaWeights.lahan}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={mcdaWeights.lahan}
                    onChange={(e) => handleWeightChange("lahan", e.target.value)}
                    className="w-full accent-[#133E54] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800">Kesesuaian anggaran & efisiensi</span>
                    <span className="text-[#133E54]">{mcdaWeights.anggaran}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={mcdaWeights.anggaran}
                    onChange={(e) => handleWeightChange("anggaran", e.target.value)}
                    className="w-full accent-[#133E54] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
              </div>
            </section>

            {/* Bottom-Right: Gerbang Sebelum Simulasi */}
            <section className="dinas-card" aria-label="Gerbang sebelum simulasi">
              <div className="dinas-card-header">
                <div>
                  <h2 className="dinas-card-title">Gerbang sebelum simulasi</h2>
                  <p className="dinas-card-sub">Checklist validitas sebelum menjalankan skenario (klik untuk verifikasi)</p>
                </div>
              </div>

              <ul className="dinas-gate-checklist p-4 space-y-2.5">
                <li
                  onClick={() => toggleGate("penduduk")}
                  className={`dinas-gate-item cursor-pointer transition-colors ${
                    gateLocks.penduduk ? "is-passed" : "is-locked"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {gateLocks.penduduk ? (
                      <Unlock size={16} className="text-emerald-700" />
                    ) : (
                      <Lock size={16} className="text-amber-700" />
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      Sumber penduduk dan periode terverifikasi
                    </span>
                  </div>
                  <span className="text-xs font-semibold">
                    {gateLocks.penduduk ? "Lolos" : "Belum"}
                  </span>
                </li>

                <li
                  onClick={() => toggleGate("kapasitas")}
                  className={`dinas-gate-item cursor-pointer transition-colors ${
                    gateLocks.kapasitas ? "is-passed" : "is-locked"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {gateLocks.kapasitas ? (
                      <Unlock size={16} className="text-emerald-700" />
                    ) : (
                      <Lock size={16} className="text-amber-700" />
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      Kapasitas efektif sekolah sekitar telah dihitung
                    </span>
                  </div>
                  <span className="text-xs font-semibold">
                    {gateLocks.kapasitas ? "Lolos" : "Belum"}
                  </span>
                </li>

                <li
                  onClick={() => toggleGate("tataruang")}
                  className={`dinas-gate-item cursor-pointer transition-colors ${
                    gateLocks.tataruang ? "is-passed" : "is-locked"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {gateLocks.tataruang ? (
                      <Unlock size={16} className="text-emerald-700" />
                    ) : (
                      <Lock size={16} className="text-amber-700" />
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      Verifikasi tata ruang dan status fisik lahan
                    </span>
                  </div>
                  <span className="text-xs font-semibold">
                    {gateLocks.tataruang ? "Lolos" : "Belum"}
                  </span>
                </li>

                <li
                  onClick={() => toggleGate("anggaran")}
                  className={`dinas-gate-item cursor-pointer transition-colors ${
                    gateLocks.anggaran ? "is-passed" : "is-locked"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {gateLocks.anggaran ? (
                      <Unlock size={16} className="text-emerald-700" />
                    ) : (
                      <Lock size={16} className="text-amber-700" />
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      Batas pagu anggaran daerah teridentifikasi
                    </span>
                  </div>
                  <span className="text-xs font-semibold">
                    {gateLocks.anggaran ? "Lolos" : "Belum"}
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* Modal Dialog Atur Skenario Interaktif */}
      {scenarioModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setScenarioModalOpen(false);
            }}
          >
            <div
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              className="animate-modal-content max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-[#173042] shadow-2xl outline-none"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e1e7dc]">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-[#1b4965]" />
                  <h2 className="text-base font-bold text-[#173042]">
                    Atur Parameter Skenario · {activeCandidate.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setScenarioModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#445665] hover:bg-[#edf3f6] hover:text-[#173042]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Form Modal */}
              <div className="py-4 space-y-4 text-xs text-[#445665]">
                {/* Tipe Intervensi */}
                <div>
                  <label className="block text-xs font-semibold text-[#173042] mb-1.5">
                    Tipe Intervensi Fisik
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScenarioForm((prev) => ({ ...prev, tipe: "USB" }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        scenarioForm.tipe === "USB"
                          ? "border-[#1b4965] bg-[#edf3f6] text-[#1b4965] font-semibold"
                          : "border-[#d7e1e8] bg-white text-[#445665] hover:bg-slate-50"
                      }`}
                    >
                      <Building size={16} className="shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Unit Sekolah Baru (USB)</div>
                        <div className="text-[11px] text-[#6b7c85]">Pembangunan gedung mandiri baru</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScenarioForm((prev) => ({ ...prev, tipe: "RKB" }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        scenarioForm.tipe === "RKB"
                          ? "border-[#1b4965] bg-[#edf3f6] text-[#1b4965] font-semibold"
                          : "border-[#d7e1e8] bg-white text-[#445665] hover:bg-slate-50"
                      }`}
                    >
                      <Ruler size={16} className="shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Ruang Kelas Baru (RKB)</div>
                        <div className="text-[11px] text-[#6b7c85]">Penambahan lokal sekolah terdekat</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Target Kapasitas Kursi Baru */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-[#173042]">
                      Kapasitas Kursi Baru
                    </label>
                    <span className="font-bold text-[#1b4965]">
                      {scenarioForm.kapasitasBaru} Kursi ({Math.round(scenarioForm.kapasitasBaru / 36)} Rombel)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="216"
                    max="1080"
                    step="72"
                    value={scenarioForm.kapasitasBaru}
                    onChange={(e) =>
                      setScenarioForm((prev) => ({
                        ...prev,
                        kapasitasBaru: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#1b4965] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>216 (6 Rombel)</span>
                    <span>504 (14 Rombel)</span>
                    <span>720 (20 Rombel)</span>
                    <span>1.080 (30 Rombel)</span>
                  </div>
                </div>

                {/* Radius Layanan & Horison Waktu */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#173042] mb-1">
                      Radius Layanan
                    </label>
                    <select
                      value={scenarioForm.radius}
                      onChange={(e) =>
                        setScenarioForm((prev) => ({
                          ...prev,
                          radius: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-[#d7e1e8] bg-white px-3 py-2 text-xs text-[#173042] focus:border-[#1b4965] focus:outline-none"
                    >
                      <option value={1}>1.000 meter (Kawasan Padat)</option>
                      <option value={2}>2.000 meter</option>
                      <option value={3}>3.000 meter (Standar Jenjang SMP)</option>
                      <option value={5}>5.000 meter (Kawasan Pedesaan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#173042] mb-1">
                      Horison Waktu
                    </label>
                    <select
                      value={scenarioForm.horison}
                      onChange={(e) =>
                        setScenarioForm((prev) => ({
                          ...prev,
                          horison: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#d7e1e8] bg-white px-3 py-2 text-xs text-[#173042] focus:border-[#1b4965] focus:outline-none"
                    >
                      <option value="3 tahun">3 tahun (Jangka Pendek)</option>
                      <option value="5 tahun">5 tahun (Standar Renstra)</option>
                      <option value="10 tahun">10 tahun (Jangka Panjang)</option>
                    </select>
                  </div>
                </div>

                {/* Asumsi Pertumbuhan & Pagu Anggaran */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#173042] mb-1">
                      Asumsi Pertumbuhan Penduduk
                    </label>
                    <select
                      value={scenarioForm.pertumbuhan}
                      onChange={(e) =>
                        setScenarioForm((prev) => ({
                          ...prev,
                          pertumbuhan: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#d7e1e8] bg-white px-3 py-2 text-xs text-[#173042] focus:border-[#1b4965] focus:outline-none"
                    >
                      <option value="Rendah (+0,8% per tahun)">Rendah (+0,8% per tahun)</option>
                      <option value="Dasar (+1,8% per tahun)">Dasar (+1,8% per tahun)</option>
                      <option value="Tinggi (+2,8% per tahun)">Tinggi (+2,8% per tahun)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#173042] mb-1">
                      Pagu Anggaran Maksimal
                    </label>
                    <select
                      value={scenarioForm.pagu}
                      onChange={(e) =>
                        setScenarioForm((prev) => ({
                          ...prev,
                          pagu: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#d7e1e8] bg-white px-3 py-2 text-xs text-[#173042] focus:border-[#1b4965] focus:outline-none"
                    >
                      <option value="Rp 10.000.000.000">Rp 10.000.000.000</option>
                      <option value="Rp 15.000.000.000">Rp 15.000.000.000 (Standar USB)</option>
                      <option value="Rp 20.000.000.000">Rp 20.000.000.000</option>
                      <option value="Rp 25.000.000.000">Rp 25.000.000.000</option>
                    </select>
                  </div>
                </div>

                {/* Ringkasan Parameter Aktif */}
                <div className="rounded-xl border border-[#d7e1e8] bg-[#f6f7f5] p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#173042] mb-1">
                    <Sparkles size={14} className="text-[#1b4965]" />
                    <span>Estimasi Dampak Skenario Awal:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                    <div className="p-2 bg-white rounded-lg border border-[#e1e7dc]">
                      <div className="text-[10px] text-slate-500">Daya Tampung</div>
                      <div className="font-bold text-[#1b4965]">+{scenarioForm.kapasitasBaru}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-[#e1e7dc]">
                      <div className="text-[10px] text-slate-500">Radius Layanan</div>
                      <div className="font-bold text-[#1b4965]">{scenarioForm.radius} km</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-[#e1e7dc]">
                      <div className="text-[10px] text-slate-500">Periode</div>
                      <div className="font-bold text-[#1b4965]">{scenarioForm.horison}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="pt-3 border-t border-[#e1e7dc] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setScenarioModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveScenario}
                    className="px-4 py-2 text-xs font-semibold text-[#1b4965] border border-[#1b4965] hover:bg-[#1b4965]/10 rounded-lg transition-colors"
                  >
                    Simpan Parameter
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAndSimulate}
                    className="dinas-btn-primary"
                  >
                    <span>Terapkan & Lanjut ke Simulasi</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
