import { useMemo } from "react";
import { ArrowRight, AlertTriangle, CheckCircle2, Clock, MapPin, Database, ChevronRight, School, Users, Building } from "lucide-react";
import { useDataStore } from "../../store/useDataStore";
import { useMapStore } from "../../store/useMapStore";
import { fmt } from "../../lib/analysis";
import MapCanvas from "../map/MapCanvas";

export default function D01DashboardView({ onNavigate }) {
  const { ringkasan, prioritas, kecamatan, loaded, candidates } = useDataStore();
  const { setLayer, activeLayers } = useMapStore();

  const totalKecamatan = kecamatan?.length || 40;
  const gapKursiTotal = Number(ringkasan?.gap_kursi) || 12450;
  const blankSpotCount = prioritas?.features?.filter((f) => f.properties?.metrik?.luas_blank_spot_km2 > 0)?.length || 14;
  const defisitAksesPct = totalKecamatan > 0 ? ((blankSpotCount / totalKecamatan) * 100).toFixed(1) : "35.0";

  return (
    <div className="dinas-page-container">
      {/* Top Banner Notice */}
      <section className="dinas-alert-banner" role="status">
        <div className="dinas-alert-icon">
          <AlertTriangle size={16} />
        </div>
        <div className="dinas-alert-body">
          <p>
            <strong>Hasil analisis adalah bahan telaah.</strong> Sistem tidak merekomendasikan pembangunan sekolah secara otomatis. Setiap keputusan harus melalui telaah teknis, ketersediaan lahan, dan kemampuan anggaran daerah.
          </p>
        </div>
      </section>

      {/* Heading & Main CTA */}
      <div className="dinas-section-heading">
        <div>
          <span className="dinas-eyebrow">PENGAMBILAN KEBIJAKAN</span>
          <h1 className="dinas-page-title">Pusat keputusan wilayah</h1>
          <p className="dinas-page-sub">
            Pantau kesiapan data dan mulai telaah kebutuhan layanan pendidikan Kabupaten Bogor.
          </p>
        </div>
        <button
          onClick={() => onNavigate("diagnosis")}
          className="dinas-btn-primary"
        >
          <span>Mulai diagnosis</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 3 Key Metric Cards */}
      <div className="dinas-kpi-grid">
        <div className="dinas-kpi-card">
          <span className="dinas-kpi-label">Wilayah ditelaah</span>
          <div className="dinas-kpi-value">
            {loaded ? `${totalKecamatan} Kecamatan` : "—"}
          </div>
          <span className="dinas-kpi-sub">
            {loaded ? "Kabupaten Bogor terpetakan" : "Menunggu data wilayah"}
          </span>
        </div>

        <div className="dinas-kpi-card">
          <span className="dinas-kpi-label">Gap kapasitas</span>
          <div className="dinas-kpi-value is-amber">
            {loaded ? `${fmt(gapKursiTotal)} kursi` : "—"}
          </div>
          <span className="dinas-kpi-sub">
            {loaded ? "Defisit daya tampung total" : "Belum dihitung"}
          </span>
        </div>

        <div className="dinas-kpi-card">
          <span className="dinas-kpi-label">Defisit akses</span>
          <div className="dinas-kpi-value is-rose">
            {loaded ? `${defisitAksesPct}% wilayah` : "—"}
          </div>
          <span className="dinas-kpi-sub">
            {loaded ? `${blankSpotCount} kecamatan memiliki blank spot` : "Belum dihitung"}
          </span>
        </div>
      </div>

      {/* Split Section: Cakupan Wilayah (Map) & Kesiapan Data / Stepper */}
      <div className="dinas-split-grid">
        {/* Left: Cakupan Wilayah (Map Canvas Inside Card) */}
        <section className="dinas-card dinas-map-card" aria-label="Cakupan wilayah">
          <div className="dinas-card-header">
            <div>
              <h2 className="dinas-card-title">Cakupan wilayah</h2>
              <p className="dinas-card-sub">Peta skematis · Terakhir diperbarui dari data operasional terkini</p>
            </div>
            <div className="dinas-card-badge">
              <span className="dinas-status-dot is-online" />
              <span>Sistem Aktif</span>
            </div>
          </div>

          <div className="dinas-map-embed-wrapper">
            <MapCanvas />
          </div>

          <div className="dinas-map-footer-legend">
            <div className="dinas-legend-item">
              <span className="dinas-dot is-negeri" />
              <span>SMP Negeri</span>
            </div>
            <div className="dinas-legend-item">
              <span className="dinas-dot is-swasta" />
              <span>SMP Swasta</span>
            </div>
            <div className="dinas-legend-item">
              <span className="dinas-dot is-high-need" />
              <span>Kebutuhan Sangat Tinggi</span>
            </div>
            <div className="dinas-legend-item">
              <span className="dinas-dot is-candidate" />
              <span>Kandidat Lahan</span>
            </div>
          </div>
        </section>

        {/* Right: Kesiapan Data & Alur Telaah */}
        <div className="dinas-side-stack">
          {/* Card Kesiapan Data */}
          <section className="dinas-card" aria-label="Kesiapan data">
            <div className="dinas-card-header">
              <div>
                <h2 className="dinas-card-title">Kesiapan data</h2>
                <p className="dinas-card-sub">Kondisi minimum untuk simulasi yang sah</p>
              </div>
            </div>

            <ul className="dinas-checklist">
              <li className="dinas-checklist-item">
                <div className="dinas-check-lead">
                  <Users size={16} className="dinas-check-icon text-[#133E54]" />
                  <span>Penduduk usia sekolah</span>
                </div>
                <span className={`dinas-pill-tag ${loaded ? "is-connected" : "is-pending"}`}>
                  {loaded ? "Terhubung" : "Belum terhubung"}
                </span>
              </li>

              <li className="dinas-checklist-item">
                <div className="dinas-check-lead">
                  <School size={16} className="dinas-check-icon text-[#133E54]" />
                  <span>Kapasitas sekolah</span>
                </div>
                <span className={`dinas-pill-tag ${loaded ? "is-connected" : "is-pending"}`}>
                  {loaded ? "Terhubung" : "Belum terhubung"}
                </span>
              </li>

              <li className="dinas-checklist-item">
                <div className="dinas-check-lead">
                  <MapPin size={16} className="dinas-check-icon text-[#133E54]" />
                  <span>Jaringan jalan & akses</span>
                </div>
                <span className={`dinas-pill-tag ${loaded ? "is-connected" : "is-pending"}`}>
                  {loaded ? "Terhubung" : "Belum terhubung"}
                </span>
              </li>

              <li className="dinas-checklist-item">
                <div className="dinas-check-lead">
                  <Building size={16} className="dinas-check-icon text-[#133E54]" />
                  <span>Lahan & anggaran</span>
                </div>
                <span className={`dinas-pill-tag ${candidates?.features?.length > 0 ? "is-connected" : "is-pending"}`}>
                  {candidates?.features?.length > 0 ? "Terhubung" : "Belum terhubung"}
                </span>
              </li>
            </ul>
          </section>

          {/* Card Alur Telaah */}
          <section className="dinas-card" aria-label="Alur telaah keputusan">
            <div className="dinas-card-header">
              <div>
                <h2 className="dinas-card-title">Alur telaah</h2>
                <p className="dinas-card-sub">5 tahapan pengambilan keputusan berbasis bukti</p>
              </div>
            </div>

            <div className="dinas-stepper">
              <button
                onClick={() => onNavigate("diagnosis")}
                className="dinas-step is-active"
                title="Langkah 1: Diagnosis Wilayah"
              >
                <div className="dinas-step-num">1</div>
                <span className="dinas-step-text">Diagnosis</span>
              </button>
              <div className="dinas-step-line" />

              <button
                onClick={() => onNavigate("diagnosis", "wilayah")}
                className="dinas-step"
                title="Langkah 2: Wilayah Telaah"
              >
                <div className="dinas-step-num">2</div>
                <span className="dinas-step-text">Wilayah</span>
              </button>
              <div className="dinas-step-line" />

              <button
                onClick={() => onNavigate("kandidat")}
                className="dinas-step"
                title="Langkah 3: Kandidat Lokasi"
              >
                <div className="dinas-step-num">3</div>
                <span className="dinas-step-text">Kandidat</span>
              </button>
              <div className="dinas-step-line" />

              <button
                onClick={() => onNavigate("simulasi")}
                className="dinas-step"
                title="Langkah 4: Simulasi What-If"
              >
                <div className="dinas-step-num">4</div>
                <span className="dinas-step-text">Simulasi</span>
              </button>
              <div className="dinas-step-line" />

              <button
                onClick={() => onNavigate("memo")}
                className="dinas-step"
                title="Langkah 5: Memo Keputusan"
              >
                <div className="dinas-step-num">5</div>
                <span className="dinas-step-text">Memo</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
