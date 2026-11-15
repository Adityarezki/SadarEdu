import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  House,
  Compass,
  MapPin,
  Sliders,
  FileText,
  LogOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Bell,
  User,
  X,
} from "lucide-react";
import logoSadar from "../../assets/figma/logo-sadar.svg";
import "./stakeholder.css";
import D01DashboardView from "../../components/stakeholder/D01DashboardView";
import D02DiagnosisView from "../../components/stakeholder/D02DiagnosisView";
import D04KandidatView from "../../components/stakeholder/D04KandidatView";
import D06SimulasiView from "../../components/stakeholder/D06SimulasiView";
import D08MemoView from "../../components/stakeholder/D08MemoView";
import { useAuthStore } from "../../store/useAuthStore";
import { useDataStore } from "../../store/useDataStore";
import { useMapStore } from "../../store/useMapStore";

const MENU_ITEMS = [
  { id: "ringkasan", label: "Ringkasan", icon: House, desc: "Pusat keputusan dan kesiapan data wilayah" },
  { id: "diagnosis", label: "Diagnosis wilayah", icon: Compass, desc: "Ukur kebutuhan dan telaah wilayah" },
  { id: "kandidat", label: "Kandidat lokasi", icon: MapPin, desc: "Bandingkan alternatif dan detail bukti kandidat" },
  { id: "simulasi", label: "Simulasi what-if", icon: Sliders, desc: "Uji skenario pembangunan dan analisis dampak" },
  { id: "memo", label: "Memo keputusan", icon: FileText, desc: "Ringkasan rekomendasi kebijakan yang dapat diaudit" },
];

function BrandMark() {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
      {failed ? (
        <span className="flex h-full w-full items-center justify-center bg-[#1b4965] text-white">
          <House size={18} aria-hidden="true" />
        </span>
      ) : (
        <img
          src={logoSadar}
          alt=""
          width="34"
          height="34"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export default function StakeholderDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { loadPublic, loadCandidates } = useDataStore();
  const { clearSelection } = useMapStore();

  const [activeTab, setActiveTab] = useState("ringkasan");
  const [targetSubTab, setTargetSubTab] = useState(null);
  const [configuredScenario, setConfiguredScenario] = useState(null);
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const [searchQ, setSearchQ] = useState("");
  const [panduanOpen, setPanduanOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPublic();
      try {
        if (!cancelled) await loadCandidates();
      } catch (err) {
        console.warn("Candidates load non-blocking error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPublic, loadCandidates]);

  // Di layar kecil, sidebar otomatis menutup saat resize atau load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigate = useCallback((tabId, subTabId = null, extraParams = null) => {
    setActiveTab(tabId);
    setTargetSubTab(subTabId);
    if (extraParams) {
      setConfiguredScenario(extraParams);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleResetData = useCallback(() => {
    clearSelection();
    loadPublic();
    loadCandidates();
  }, [clearSelection, loadPublic, loadCandidates]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hide = collapsed ? "sr-only" : "";

  return (
    <div className="operator-shell h-screen bg-[#f6f7f5] p-3 text-[#173042] [font-family:'Public_Sans',system-ui,sans-serif] sm:p-6">
      <div className="flex h-full min-h-0 overflow-hidden rounded-[20px] border-0 bg-[#f6f7f5] sm:rounded-[28px]">
        {/* Sidebar Kiri Harmonized with Operator */}
        <aside
          className={`flex shrink-0 flex-col overflow-y-auto border-r border-[#e1e7dc] bg-[#f6f7f5] transition-[width] duration-200 motion-reduce:transition-none ${
            collapsed ? "w-[76px]" : "w-[230px]"
          }`}
        >
          {/* Logo & Toggle Header */}
          <div
            className={`flex pt-[22px] ${
              collapsed ? "flex-col items-center gap-3" : "items-start justify-between px-[22px]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className={`text-base font-semibold leading-6 text-[#1b4965] ${hide}`}>
                SADAR EDU
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d7e1e8] bg-[#edf3f6] text-[#445665] transition-colors hover:bg-[#e1eaee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6f5f]"
            >
              {collapsed ? (
                <ChevronRight size={18} aria-hidden="true" />
              ) : (
                <ChevronLeft size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Label MENU */}
          <p className={`mt-[26px] px-[22px] text-[11px] font-medium leading-4 text-[#445665] ${hide}`}>
            MENU
          </p>

          {/* Navigation Items */}
          <nav
            aria-label="Menu pengambil kebijakan dinas"
            className={`mt-3 flex flex-col gap-2 ${collapsed ? "px-3" : "px-5"}`}
          >
            {MENU_ITEMS.map(({ id, label, icon: Icon, desc }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavigate(id)}
                  title={collapsed ? label : desc}
                  className={`relative flex h-[46px] items-center rounded-[10px] text-xs transition-all duration-200 ${
                    collapsed ? "justify-center" : "gap-[13px] px-[14px]"
                  } ${
                    isActive
                      ? "bg-[#25382e] text-white font-medium shadow-xs"
                      : "text-[#445665] hover:bg-[#e8ede7] hover:translate-x-[2px] active:scale-[0.98]"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6f5f]`}
                >
                  <Icon size={17} aria-hidden="true" className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar / AKUN */}
          <div className={`mt-auto pb-4 pt-8 ${collapsed ? "px-3" : "px-5"}`}>
            <p className={`px-0.5 text-[11px] font-medium leading-4 text-[#445665] ${hide}`}>AKUN</p>
            <div className="my-3 h-px bg-[#d7e1e8]" />
            <button
              type="button"
              onClick={handleLogout}
              aria-label={collapsed ? "Keluar dari akun" : undefined}
              className={`flex h-[46px] w-full cursor-pointer items-center rounded-lg border border-[#a12b31] bg-[#fff0f0] text-sm font-semibold text-[#a12b31] transition-all duration-150 hover:bg-[#ffe3e3] hover:shadow-xs active:scale-[0.98] ${
                collapsed ? "justify-center" : "gap-3.5 px-[13px]"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a12b31]`}
            >
              <LogOut size={20} aria-hidden="true" className="shrink-0" />
              {!collapsed && <span>Keluar dari akun</span>}
            </button>
            <button
              type="button"
              onClick={() => setPanduanOpen(true)}
              title="Buka panduan analis"
              className={`mt-3 flex h-10 w-full cursor-pointer items-center text-xs text-[#445665] hover:text-[#173042] ${
                collapsed ? "justify-center" : "gap-2.5 px-3"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6f5f]`}
            >
              <BookOpen size={16} aria-hidden="true" className="shrink-0" />
              {!collapsed && <span>Panduan analis</span>}
            </button>
          </div>
        </aside>

        {/* Kolom Konten Utama & Header */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header Topbar Harmonized */}
          <header className="flex h-[80px] shrink-0 items-center gap-3 border-b border-[#e1e7dc] bg-[#f6f7f5] px-4 sm:px-7">
            {/* Search Box di sisi kiri sesuai Operator */}
            <div className="relative mr-auto w-full max-w-[460px]">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#445665]"
              />
              <input
                id="cari-menu-stakeholder"
                type="search"
                autoComplete="off"
                placeholder="Cari menu, wilayah, skenario..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-[48px] w-full rounded-[10px] border-0 bg-[#f8f9f6] pl-[44px] pr-3 text-xs placeholder:text-[#445665] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6f5f]"
              />
            </div>

            {/* Refresh / Perbarui Data Button */}
            <button
              type="button"
              onClick={handleResetData}
              title="Perbarui data dan reset pilihan peta"
              className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full bg-[#f8f9f6] text-[#445665] transition-colors hover:bg-[#e8ede7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6f5f]"
            >
              <RotateCcw size={18} aria-hidden="true" />
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              title="Notifikasi analis"
              className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full bg-[#f8f9f6] text-[#445665] transition-colors hover:bg-[#e8ede7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f6f5f]"
            >
              <Bell size={18} aria-hidden="true" />
            </button>

            {/* User Profile Chip - 100% harmonized with Operator */}
            <div className="flex h-[50px] items-center gap-3 rounded-[10px] border border-[#e1e7dc] bg-[#edf3f6] pl-2 pr-4">
              <span
                aria-hidden="true"
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#1b4965] text-white"
              >
                <User size={18} />
              </span>
              <span className="hidden sm:block">
                <span className="block text-xs font-semibold leading-[18px] text-[#173042]">
                  {user?.nama ?? "Stakeholder Dinas"}
                </span>
                <span className="block text-[11px] font-medium leading-4 text-[#445665]">
                  Ruang kerja internal
                </span>
              </span>
            </div>
          </header>

          {/* Area Konten Scrollable */}
          <main data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto bg-[#f6f7f5]">
            <div key={activeTab} className="animate-page-enter p-4 sm:p-7 space-y-6">
              {activeTab === "ringkasan" && <D01DashboardView onNavigate={handleNavigate} />}

              {activeTab === "diagnosis" && (
                <D02DiagnosisView
                  onNavigate={handleNavigate}
                  initialSubTab={targetSubTab || "ukur"}
                />
              )}

              {activeTab === "kandidat" && (
                <D04KandidatView
                  onNavigate={handleNavigate}
                  initialSubTab={targetSubTab || "alternatif"}
                />
              )}

              {activeTab === "simulasi" && (
                <D06SimulasiView
                  onNavigate={handleNavigate}
                  initialSubTab={targetSubTab || "uji"}
                  configuredScenario={configuredScenario}
                />
              )}

              {activeTab === "memo" && <D08MemoView onNavigate={handleNavigate} />}
            </div>
          </main>
        </div>
      </div>

      {/* Modal Dialog Panduan Analis */}
      {panduanOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPanduanOpen(false);
          }}
        >
          <div
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className="animate-modal-content max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-[#173042] shadow-xl outline-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e7dc]">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#1b4965]" />
                <h2 className="text-lg font-bold text-[#173042]">Panduan Analis Pengambil Kebijakan</h2>
              </div>
              <button
                type="button"
                onClick={() => setPanduanOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#445665] hover:bg-[#edf3f6] hover:text-[#173042]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-[#445665] leading-relaxed">
              <p>
                SADAR EDU mengadopsi prinsip <strong>Desktop Decision Flow</strong> berbasis bukti (evidence-based planning). Sistem berfungsi sebagai instrumen telaah dan simulasi what-if, bukan penentu keputusan otomatis.
              </p>
              <div className="space-y-2 p-3.5 bg-[#f6f7f5] rounded-xl border border-[#d7e1e8]">
                <strong className="text-[#173042] block font-semibold text-xs">Alur 5 Langkah Telaah Kebijakan:</strong>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#445665]">
                  <li><strong>Ringkasan:</strong> Pantau gap kapasitas dan defisit akses wilayah secara makro.</li>
                  <li><strong>Diagnosis:</strong> Ukur kesenjangan daya tampung vs proyeksi penduduk usia SMP 5 tahun ke depan.</li>
                  <li><strong>Kandidat:</strong> Bandingkan lokasi alternatif lahan potensial dengan status verifikasi fisik.</li>
                  <li><strong>Simulasi What-If:</strong> Uji skenario intervensi USB/RKB pada berbagai asumsi pertumbuhan.</li>
                  <li><strong>Memo Keputusan:</strong> Susun draf rekomendasi kebijakan formal yang siap diaudit.</li>
                </ol>
              </div>
              <p>
                Seluruh skenario dan draf memo yang dibuat tidak mengubah data master kependudukan maupun dataset sekolah operasional.
              </p>
            </div>

            <div className="pt-3 border-t border-[#e1e7dc] flex justify-end">
              <button
                type="button"
                onClick={() => setPanduanOpen(false)}
                className="inline-flex h-[42px] cursor-pointer items-center justify-center rounded-lg bg-[#253c30] px-5 text-sm font-semibold text-white transition-colors hover:brightness-95"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
