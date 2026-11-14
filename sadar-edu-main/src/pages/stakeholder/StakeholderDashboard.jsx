import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react";
import "./stakeholder.css";
import MapCanvas from "../../components/map/MapCanvas";
import PrioritasPanel from "../../components/stakeholder/PrioritasPanel";
import DiagnosisPanel from "../../components/stakeholder/DiagnosisPanel";
import SekolahKeputusanPanel from "../../components/stakeholder/SekolahKeputusanPanel";
import KandidatPanel from "../../components/stakeholder/KandidatPanel";
import SimulasiPanel from "../../components/stakeholder/SimulasiPanel";
import CompareModal from "../../components/ui/CompareModal";
import { ErrorBox, InfoBox, Spinner } from "../../components/ui/kit";
import { useAuthStore } from "../../store/useAuthStore";
import { useDataStore } from "../../store/useDataStore";
import { useMapStore } from "../../store/useMapStore";
import { BOGOR_BOUNDS } from "../../lib/bogorBoundary";

const TABS = [
  { id: "prioritas", label: "Prioritas" },
  { id: "diagnosis", label: "Diagnosis" },
  { id: "keputusan", label: "Keputusan" },
  { id: "simulasi", label: "Simulasi & Lahan" },
];

const LAYER_TOGGLES = [
  ["mcdaLayer", "Kebutuhan kecamatan"],
  ["showBlankSpots", "Blank spot"],
  ["showCoverage", "Jangkauan 3 km"],
  ["showCandidates", "Area kandidat"],
  ["showSchools", "Titik sekolah"],
];

export default function StakeholderDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { loaded, loading, error, loadPublic, loadCandidates, meta, ringkasan, kecamatan, candidates } = useDataStore();
  const {
    selectedWilayahId,
    setSelectedWilayahId,
    clearSelection,
    flyToBounds,
    activeLayers,
    toggleLayer,
    setLayer,
    comparedSchools,
    setIsCompareOpen,
  } = useMapStore();
  const [tab, setTab] = useState("prioritas");
  const [simSubTab, setSimSubTab] = useState("simulasi"); // "simulasi" | "kandidat"
  const [preset, setPreset] = useState(null);
  const [candidateError, setCandidateError] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const selectedKecamatan = kecamatan.find((x) => x.id === String(selectedWilayahId));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPublic();
      try {
        if (!cancelled) await loadCandidates();
      } catch (e) {
        if (!cancelled) setCandidateError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPublic, loadCandidates]);

  // Sinkronisasi klik poligon / kandidat pada peta ke tab aktif
  useEffect(() => {
    let prevWilayah = useMapStore.getState().selectedWilayahId;
    let prevCandidate = useMapStore.getState().selectedCandidateId;
    return useMapStore.subscribe((state) => {
      if (state.selectedWilayahId !== prevWilayah) {
        prevWilayah = state.selectedWilayahId;
        if (state.selectedWilayahId) {
          setPanelOpen(true);
          setTab((curr) => (curr === "prioritas" ? "diagnosis" : curr));
        }
      }
      if (state.selectedCandidateId !== prevCandidate) {
        prevCandidate = state.selectedCandidateId;
        if (state.selectedCandidateId) {
          setPanelOpen(true);
          setTab("simulasi");
          setSimSubTab("kandidat");
        }
      }
    });
  }, []);

  const pilihWilayah = useCallback(
    (id) => {
      setSelectedWilayahId(id);
      const k = useDataStore.getState().kecamatan.find((x) => x.id === String(id));
      if (k && k.bbox) flyToBounds(k.bbox);
    },
    [setSelectedWilayahId, flyToBounds]
  );

  const resetPetaBogor = useCallback(() => {
    clearSelection();
    const flat = BOGOR_BOUNDS.flat();
    flyToBounds(flat);
  }, [clearSelection, flyToBounds]);

  const keSimulasi = (p) => {
    if (p.id_wilayah) setSelectedWilayahId(p.id_wilayah);
    setPreset({ ...p, nonce: Date.now() });
    setSimSubTab("simulasi");
    setTab("simulasi");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`sh-workspace ${panelOpen ? "panel-open" : "panel-closed"}`}>
      {/* Peta selalu full-screen di latar belakang agar tidak pernah menyisakan ruang kosong saat panel ditutup */}
      <main className="sh-map-stage">
        <MapCanvas />
      </main>

      {/* Navigasi Mengambang Kiri Atas */}
      <header className="sh-floating-header">
        <div className="sh-brand">
          <span className="sh-brand-dot" />
          <div>
            <h1 className="sh-brand-title">Dinas Pendidikan Bogor</h1>
            <p className="sh-brand-sub">
              {user?.nama || "Stakeholder"}
              {meta ? ` · Data ${meta.tahun}` : ""}
            </p>
          </div>
        </div>
        <nav className="sh-header-actions" aria-label="Kontrol utama">
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={`sh-pill-btn ${panelOpen ? "is-primary" : ""}`}
            aria-expanded={panelOpen}
          >
            {panelOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            <span>{panelOpen ? "Tutup Panel" : "Buka Panel"}</span>
          </button>
          {user?.role === "Operator" && (
            <Link to="/operator/dataset" className="sh-pill-btn">
              Dataset
            </Link>
          )}
          <Link to="/peta" className="sh-pill-btn">
            Peta Publik
          </Link>
          <button onClick={handleLogout} className="sh-pill-btn is-danger">
            Keluar
          </button>
        </nav>
      </header>

      {/* Kontrol Lapisan Peta Mengambang Kanan Atas */}
      <div className="sh-floating-layers">
        <div className="sh-layer-group" role="group" aria-label="Lapisan peta">
          <button
            onClick={resetPetaBogor}
            title="Reset tampilan peta ke seluruh wilayah Bogor"
            className="sh-layer-btn inline-flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset Peta</span>
          </button>
          {LAYER_TOGGLES.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={!!activeLayers[key]}
              onClick={() => toggleLayer(key)}
              className="sh-layer-btn"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Analisis Mengambang */}
      <aside
        className={`sh-panel ${panelOpen ? "is-open" : "is-closed"}`}
        aria-label="Panel analisis keputusan"
        inert={!panelOpen}
      >
        <div className="sh-tabs" role="tablist" aria-label="Menu analisis">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="sh-tab"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="sh-content">
          {ringkasan?.menggunakan_data_demo && (
            <div className="mb-4">
              <InfoBox tone="amber">
                <strong>Data demo.</strong> Angka dan peta berasal dari dataset sintetis.
              </InfoBox>
            </div>
          )}

          <ErrorBox message={error || candidateError} />
          {error && (
            <button onClick={loadPublic} className="mt-2 text-xs font-semibold text-[#1F6F5F] hover:underline">
              Muat ulang data
            </button>
          )}
          {loading && !loaded && <Spinner label="Memuat data analisis wilayah & sekolah..." />}

          {loaded && tab === "prioritas" && (
            <PrioritasPanel
              ringkasan={ringkasan}
              onPilihWilayah={(id) => {
                pilihWilayah(id);
                setTab("diagnosis");
              }}
            />
          )}

          {loaded && tab === "diagnosis" && (
            <DiagnosisPanel wilayahId={selectedWilayahId} onPilihWilayah={pilihWilayah} onSimulasi={keSimulasi} />
          )}

          {loaded && tab === "keputusan" && (
            <SekolahKeputusanPanel
              wilayahId={selectedWilayahId}
              onPilihWilayah={(id) => {
                pilihWilayah(id);
                setTab("diagnosis");
              }}
              onSimulasi={keSimulasi}
            />
          )}

          {loaded && tab === "simulasi" && (
            <div>
              <div className="sh-segmented mb-5" role="group" aria-label="Pilih mode simulasi atau kandidat lahan">
                <button
                  onClick={() => setSimSubTab("simulasi")}
                  className={simSubTab === "simulasi" ? "is-active" : ""}
                >
                  Simulasi Intervensi
                </button>
                <button
                  onClick={() => {
                    setSimSubTab("kandidat");
                    setLayer("showCandidates", true);
                  }}
                  className={simSubTab === "kandidat" ? "is-active" : ""}
                >
                  Kandidat Lahan ({candidates?.features?.length || 0})
                </button>
              </div>
              {simSubTab === "simulasi" ? (
                <SimulasiPanel
                  key={`${preset?.nonce || "init"}-${selectedWilayahId || ""}`}
                  preset={preset}
                  wilayahId={selectedWilayahId}
                />
              ) : (
                <KandidatPanel wilayahId={selectedWilayahId} onSimulasi={keSimulasi} />
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Legenda Ringkas di Bawah Peta */}
      <div className="sh-map-legend" aria-label="Legenda peta">
        {selectedKecamatan && (
          <div className="flex items-center gap-2 pr-3 border-r border-slate-300">
            <span className="font-semibold text-slate-900">
              Fokus: Kec. {selectedKecamatan.nama}
            </span>
            <button
              onClick={resetPetaBogor}
              className="text-xs font-semibold text-[#1F6F5F] hover:underline"
            >
              Semua Kecamatan
            </button>
          </div>
        )}
        {activeLayers.showSchools && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e] inline-block border border-white" />
              SMP Negeri
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block border border-white" />
              SMP Swasta
            </span>
            {!selectedKecamatan && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b] inline-block border border-white" />
                Klaster Sekolah
              </span>
            )}
          </div>
        )}
        {activeLayers.mcdaLayer && (
          <div className="flex items-center gap-2.5 border-l border-slate-300 pl-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626] inline-block" />
              Sangat Tinggi
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#f97316] inline-block" />
              Tinggi
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#eab308] inline-block" />
              Sedang
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981] inline-block" />
              Rendah
            </span>
          </div>
        )}
        {comparedSchools.length > 0 && (
          <button
            onClick={() => setIsCompareOpen(true)}
            className="bg-[#1F6F5F] text-white font-semibold px-3 py-1 rounded-lg hover:bg-[#175649] transition-colors text-xs"
          >
            Bandingkan ({comparedSchools.length}/3)
          </button>
        )}
      </div>

      {kecamatan.length === 0 && loaded && (
        <div className="absolute top-20 right-4 z-10 max-w-xs">
          <InfoBox tone="amber">Belum ada batas kecamatan. Minta Operator mengunggah dataset wilayah.</InfoBox>
        </div>
      )}
      <CompareModal />
    </div>
  );
}
