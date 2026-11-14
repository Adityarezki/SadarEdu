import { useMemo, useState } from "react";
import { Download, MapPin, ArrowRight } from "lucide-react";
import { useDataStore } from "../../store/useDataStore";
import { useMapStore } from "../../store/useMapStore";
import { rescoreFeatures, fmt } from "../../lib/analysis";
import { KategoriBadge, inputCls, btnPrimary, btnGhost } from "../ui/kit";

function downloadDecisionCsv(filename, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function SekolahKeputusanPanel({ wilayahId, onPilihWilayah, onSimulasi }) {
  const { sekolah, prioritas, weights, meta, kecamatan } = useDataStore();
  const { flyToSchool, activeLayers, toggleLayer, addToCompare, comparedSchools } = useMapStore();

  const [mode, setMode] = useState("keputusan"); // "keputusan" | "sekolah"
  const [programTab, setProgramTab] = useState("rehab"); // "usb" | "rehab" | "rkb" | "guru"
  const [q, setQ] = useState("");
  const [filterWilayah, setFilterWilayah] = useState(wilayahId ? String(wilayahId) : "");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAkred, setFilterAkred] = useState("ALL");
  const [filterMasalah, setFilterMasalah] = useState("rusak");
  const [visibleCount, setVisibleCount] = useState(35);

  const [kuota, setKuota] = useState({
    usb: 5,
    rehab: 120,
    rkb: 80,
    guru: 100,
  });

  const scoredKecamatan = useMemo(
    () => rescoreFeatures(prioritas.features, weights, meta && meta.kategori),
    [prioritas, weights, meta]
  );

  const kecMap = useMemo(() => {
    const map = new Map();
    scoredKecamatan.forEach((f) => {
      const p = f.properties;
      map.set(String(p.id_wilayah), p);
      if (p.nama_wilayah) map.set(p.nama_wilayah.toLowerCase().replace(/\s+/g, ""), p);
    });
    return map;
  }, [scoredKecamatan]);

  const enrichedSchools = useMemo(() => {
    return (sekolah?.features || []).map((f) => {
      const p = f.properties || {};
      const kecObj =
        (p.id_wilayah && kecMap.get(String(p.id_wilayah))) ||
        (p.kecamatan && kecMap.get(String(p.kecamatan).toLowerCase().replace(/\s+/g, ""))) ||
        null;
      const siswa = Number(p.jumlahSiswa) || 0;
      const guru = Number(p.jumlahGuru) || 0;
      const kelas = Number(p.ruangKelas) || 0;
      const baik = Number(p.kelasBaik) || 0;
      const rr = Number(p.kelasRusakRingan) || 0;
      const rs = Number(p.kelasRusakSedang) || 0;
      const rb = Number(p.kelasRusakBerat) || 0;
      const rusakTotal = rb + rs;
      const rasioKelas = kelas > 0 ? siswa / kelas : 0;
      const butuhRkb = kelas > 0 && rasioKelas > 32 ? Math.ceil(siswa / 32) - kelas : 0;
      const rasioGuru = guru > 0 ? siswa / guru : 0;
      const butuhGuru = guru > 0 && rasioGuru > 20 ? Math.ceil(siswa / 20) - guru : 0;
      const surplusGuru = guru > 2 && siswa > 0 && rasioGuru < 12 ? guru - Math.ceil(siswa / 16) : 0;
      const skorWilayah = kecObj?.skor ?? 0;

      const skorRehab = rb * 15 + rs * 7 + skorWilayah * 0.3;
      const skorRkb = butuhRkb * 10 + Math.max(0, rasioKelas - 32) * 1.5 + skorWilayah * 0.25;
      const skorGuru = butuhGuru * 10 + Math.max(0, rasioGuru - 20) * 1.2 + skorWilayah * 0.25;

      return {
        feature: f,
        ...p,
        id_wilayah: p.id_wilayah || kecObj?.id_wilayah || null,
        nama_wilayah: kecObj?.nama_wilayah || p.kecamatan || "-",
        kategori_wilayah: kecObj?.kategori_live || null,
        skor_wilayah: skorWilayah,
        siswa,
        guru,
        kelas,
        baik,
        rusakRingan: rr,
        rusakSedang: rs,
        rusakBerat: rb,
        rusakTotal,
        rasioKelas,
        butuhRkb,
        rasioGuru,
        butuhGuru,
        surplusGuru: Math.max(0, surplusGuru),
        skorRehab,
        skorRkb,
        skorGuru,
      };
    });
  }, [sekolah, kecMap]);

  const filteredSchools = useMemo(() => {
    const query = q.trim().toLowerCase();
    return enrichedSchools
      .filter((s) => {
        if (filterWilayah && String(s.id_wilayah) !== String(filterWilayah)) return false;
        if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
        if (filterAkred !== "ALL") {
          if (filterAkred === "TT" && s.akreditasi) return false;
          if (filterAkred !== "TT" && s.akreditasi !== filterAkred) return false;
        }
        if (filterMasalah === "rusak" && s.rusakTotal <= 0) return false;
        if (filterMasalah === "padat" && s.butuhRkb <= 0) return false;
        if (filterMasalah === "guru" && s.butuhGuru <= 0) return false;
        if (filterMasalah === "mutu" && s.akreditasi !== "C" && s.akreditasi !== null) return false;
        if (query) {
          const hay = `${s.nama} ${s.npsn || ""} ${s.desa || ""} ${s.nama_wilayah || ""}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filterMasalah === "rusak") return b.skorRehab - a.skorRehab;
        if (filterMasalah === "padat") return b.skorRkb - a.skorRkb;
        if (filterMasalah === "guru") return b.skorGuru - a.skorGuru;
        return b.siswa - a.siswa;
      });
  }, [enrichedSchools, q, filterWilayah, filterStatus, filterAkred, filterMasalah]);

  const rencanaKeputusan = useMemo(() => {
    const kandidatUsb = [...scoredKecamatan]
      .sort((a, b) => (a.properties.ranking_live ?? 999) - (b.properties.ranking_live ?? 999))
      .map((f) => {
        const p = f.properties;
        const m = p.metrik || {};
        const gap = Number(m.gap_kursi) || 0;
        const blank = Number(m.blank_pct) || 0;
        const negeri = Number(m.jumlah_sekolah_negeri) || 0;
        const alasan = [];
        if (gap >= 288) alasan.push(`Kurang ${fmt(gap)} kursi`);
        if (blank >= 25) alasan.push(`Blank spot ${fmt(blank, 1)}%`);
        if (negeri === 0) alasan.push("Belum ada SMP Negeri");
        return {
          id_wilayah: p.id_wilayah,
          nama_wilayah: p.nama_wilayah,
          ranking: p.ranking_live,
          skor: p.skor,
          kategori: p.kategori_live,
          gap_kursi: gap,
          blank_pct: blank,
          negeri,
          alasan: alasan.join(" · ") || "Prioritas skor tertinggi",
        };
      })
      .filter((k) => k.gap_kursi > 0 || k.blank_pct >= 25 || k.negeri === 0)
      .slice(0, Math.max(1, Number(kuota.usb) || 0));

    let sisaRehab = Math.max(0, Number(kuota.rehab) || 0);
    const alokasiRehab = [];
    const sortedRehab = [...enrichedSchools].filter((s) => s.rusakTotal > 0).sort((a, b) => b.skorRehab - a.skorRehab);
    for (const s of sortedRehab) {
      if (sisaRehab <= 0) break;
      const jml = Math.min(s.rusakTotal, sisaRehab);
      sisaRehab -= jml;
      alokasiRehab.push({ ...s, alokasi: jml, kursiPulih: jml * 32 });
    }

    let sisaRkb = Math.max(0, Number(kuota.rkb) || 0);
    const alokasiRkb = [];
    const sortedRkb = [...enrichedSchools].filter((s) => s.butuhRkb > 0).sort((a, b) => b.skorRkb - a.skorRkb);
    for (const s of sortedRkb) {
      if (sisaRkb <= 0) break;
      const jml = Math.min(s.butuhRkb, sisaRkb);
      sisaRkb -= jml;
      alokasiRkb.push({ ...s, alokasi: jml, kursiTambah: jml * 32 });
    }

    let sisaGuru = Math.max(0, Number(kuota.guru) || 0);
    const alokasiGuru = [];
    const sortedGuru = [...enrichedSchools].filter((s) => s.butuhGuru > 0).sort((a, b) => b.skorGuru - a.skorGuru);
    for (const s of sortedGuru) {
      if (sisaGuru <= 0) break;
      const jml = Math.min(s.butuhGuru, sisaGuru);
      sisaGuru -= jml;
      alokasiGuru.push({ ...s, alokasi: jml });
    }

    const totalSumberRedistribusi = enrichedSchools.reduce((acc, s) => acc + s.surplusGuru, 0);

    return {
      kandidatUsb,
      alokasiRehab,
      totalRehab: alokasiRehab.reduce((a, b) => a + b.alokasi, 0),
      kursiPulihRehab: alokasiRehab.reduce((a, b) => a + b.kursiPulih, 0),
      alokasiRkb,
      totalRkb: alokasiRkb.reduce((a, b) => a + b.alokasi, 0),
      kursiTambahRkb: alokasiRkb.reduce((a, b) => a + b.kursiTambah, 0),
      alokasiGuru,
      totalGuru: alokasiGuru.reduce((a, b) => a + b.alokasi, 0),
      totalSumberRedistribusi,
    };
  }, [scoredKecamatan, enrichedSchools, kuota]);

  const fokusKeSekolah = (s) => {
    if (!activeLayers.showSchools) toggleLayer("showSchools");
    flyToSchool(s.feature);
  };

  const unduhRencanaCsv = () => {
    const rows = [
      ["Program Intervensi", "Prioritas", "Kecamatan", "NPSN", "Nama Sekolah", "Status", "Volume Alokasi", "Satuan", "Estimasi Dampak / Alasan"],
    ];
    rencanaKeputusan.kandidatUsb.forEach((u, idx) => {
      rows.push([
        "Pembangunan Unit Sekolah Baru (USB)",
        idx + 1,
        u.nama_wilayah,
        "-",
        `Usulan SMP Baru Kec. ${u.nama_wilayah}`,
        "Negeri",
        1,
        "Unit Sekolah (9 RKB)",
        `${u.alasan} (+288 kursi)`,
      ]);
    });
    rencanaKeputusan.alokasiRehab.forEach((s, idx) => {
      rows.push([
        "Rehabilitasi Ruang Kelas Rusak",
        idx + 1,
        s.nama_wilayah,
        s.npsn || "-",
        s.nama,
        s.status,
        s.alokasi,
        "Ruang Kelas",
        `Rusak Berat: ${s.rusakBerat}, Rusak Sedang: ${s.rusakSedang} (Memulihkan ${s.kursiPulih} kursi layak)`,
      ]);
    });
    rencanaKeputusan.alokasiRkb.forEach((s, idx) => {
      rows.push([
        "Penambahan Ruang Kelas Baru (RKB)",
        idx + 1,
        s.nama_wilayah,
        s.npsn || "-",
        s.nama,
        s.status,
        s.alokasi,
        "Ruang Kelas",
        `Rasio saat ini ${fmt(s.rasioKelas, 1)} siswa/kelas (+${s.kursiTambah} kursi baru)`,
      ]);
    });
    rencanaKeputusan.alokasiGuru.forEach((s, idx) => {
      rows.push([
        "Penempatan / Redistribusi Guru",
        idx + 1,
        s.nama_wilayah,
        s.npsn || "-",
        s.nama,
        s.status,
        s.alokasi,
        "Guru",
        `Rasio saat ini ${fmt(s.rasioGuru, 1)} siswa/guru (${s.siswa} siswa, ${s.guru} guru)`,
      ]);
    });
    downloadDecisionCsv(`rekomendasi-keputusan-dinas-bogor-${meta?.tahun || 2026}.csv`, rows);
  };

  return (
    <div>
      <section className="sh-section">
        <div className="sh-segmented" role="group" aria-label="Pilih mode tampilan">
          <button
            onClick={() => setMode("keputusan")}
            className={mode === "keputusan" ? "is-active" : ""}
          >
            Rencana Alokasi Kuota
          </button>
          <button
            onClick={() => setMode("sekolah")}
            className={mode === "sekolah" ? "is-active" : ""}
          >
            Direktori Sekolah ({enrichedSchools.length})
          </button>
        </div>
      </section>

      {mode === "keputusan" ? (
        <>
          <section className="sh-section">
            <div className="sh-section-head">
              <h2 className="sh-section-title">Kuota Intervensi Tahunan</h2>
              <span className="sh-section-meta">4 program utama</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Atur target kuota intervensi untuk menyusun daftar kecamatan dan sekolah sasaran paling mendesak secara otomatis.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="q-usb">
                  Unit Sekolah Baru (unit)
                </label>
                <input
                  id="q-usb"
                  type="number"
                  min="0"
                  max="46"
                  className={inputCls}
                  value={kuota.usb}
                  onChange={(e) => setKuota({ ...kuota, usb: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="q-rehab">
                  Rehabilitasi Kelas (ruang)
                </label>
                <input
                  id="q-rehab"
                  type="number"
                  min="0"
                  max="2000"
                  className={inputCls}
                  value={kuota.rehab}
                  onChange={(e) => setKuota({ ...kuota, rehab: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="q-rkb">
                  Ruang Kelas Baru (ruang)
                </label>
                <input
                  id="q-rkb"
                  type="number"
                  min="0"
                  max="2000"
                  className={inputCls}
                  value={kuota.rkb}
                  onChange={(e) => setKuota({ ...kuota, rkb: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="q-guru">
                  Penempatan Guru (orang)
                </label>
                <input
                  id="q-guru"
                  type="number"
                  min="0"
                  max="2000"
                  className={inputCls}
                  value={kuota.guru}
                  onChange={(e) => setKuota({ ...kuota, guru: e.target.value })}
                />
              </div>
            </div>

            <dl className="sh-dl mb-3">
              <div className="sh-dl-row">
                <dt>Dampak penambahan daya tampung (USB + RKB)</dt>
                <dd className="text-[#1F6F5F]">
                  +{fmt(rencanaKeputusan.kandidatUsb.length * 288 + rencanaKeputusan.kursiTambahRkb)} kursi baru
                </dd>
              </div>
              <div className="sh-dl-row">
                <dt>Dampak pemulihan ruang kelas rusak</dt>
                <dd className="text-amber-800">
                  {fmt(rencanaKeputusan.kursiPulihRehab)} kursi layak ({rencanaKeputusan.alokasiRehab.length} sekolah)
                </dd>
              </div>
              <div className="sh-dl-row">
                <dt>Pemenuhan guru & potensi redistribusi</dt>
                <dd>
                  +{fmt(rencanaKeputusan.totalGuru)} guru (sumber lebih: {fmt(rencanaKeputusan.totalSumberRedistribusi)})
                </dd>
              </div>
            </dl>

            <button onClick={unduhRencanaCsv} className={`${btnPrimary} w-full inline-flex items-center justify-center gap-2`}>
              <Download size={14} />
              <span>Unduh Paket Rekomendasi Keputusan (CSV)</span>
            </button>
          </section>

          <section className="sh-section">
            <div className="sh-section-head">
              <h3 className="sh-section-title">Daftar Sasaran Prioritas</h3>
            </div>

            <div className="sh-segmented mb-3" role="group" aria-label="Pilih program intervensi">
              {[
                ["rehab", `Rehab (${rencanaKeputusan.totalRehab})`],
                ["rkb", `RKB (${rencanaKeputusan.totalRkb})`],
                ["guru", `Guru (${rencanaKeputusan.totalGuru})`],
                ["usb", `USB (${rencanaKeputusan.kandidatUsb.length})`],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setProgramTab(id)}
                  className={programTab === id ? "is-active" : ""}
                >
                  {label}
                </button>
              ))}
            </div>

            {programTab === "usb" && (
              <ol className="sh-list">
                {rencanaKeputusan.kandidatUsb.map((u, idx) => (
                  <li key={u.id_wilayah} className="sh-list-item px-1">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onPilihWilayah && onPilihWilayah(u.id_wilayah)}
                        className="text-left text-[13px] font-semibold text-slate-900 hover:text-[#1F6F5F]"
                      >
                        #{idx + 1} · Kec. {u.nama_wilayah}
                      </button>
                      <KategoriBadge kategori={u.kategori} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{u.alasan}</p>
                    <div className="flex justify-between items-center mt-1.5 text-xs">
                      <span className="text-slate-600">
                        Skor kebutuhan: <strong>{fmt(u.skor, 1)}</strong>
                      </span>
                      <button
                        onClick={() => onSimulasi && onSimulasi({ id_wilayah: u.id_wilayah, tipe: "Sekolah Baru", jumlah: 1 })}
                        className="inline-flex items-center gap-1 font-semibold text-[#1F6F5F] hover:underline"
                      >
                        <span>Uji simulasi USB</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {programTab === "rehab" && (
              <ol className="sh-list">
                {rencanaKeputusan.alokasiRehab.map((s, idx) => (
                  <li key={s.id} className="sh-list-item px-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => fokusKeSekolah(s)}
                        className="text-left text-[13px] font-semibold text-slate-900 hover:text-[#1F6F5F] leading-snug"
                      >
                        {idx + 1}. {s.nama}
                      </button>
                      <span className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shrink-0">
                        Rehab {s.alokasi} ruang
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Kec. {s.nama_wilayah} · {s.status} · Rusak berat: <strong>{s.rusakBerat}</strong>, sedang:{" "}
                      <strong>{s.rusakSedang}</strong> (pulih +{s.kursiPulih} kursi)
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {programTab === "rkb" && (
              <ol className="sh-list">
                {rencanaKeputusan.alokasiRkb.map((s, idx) => (
                  <li key={s.id} className="sh-list-item px-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => fokusKeSekolah(s)}
                        className="text-left text-[13px] font-semibold text-slate-900 hover:text-[#1F6F5F] leading-snug"
                      >
                        {idx + 1}. {s.nama}
                      </button>
                      <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                        +{s.alokasi} RKB
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Kec. {s.nama_wilayah} · {s.status} · Kepadatan <strong>{fmt(s.rasioKelas, 1)}</strong> siswa/kelas ({fmt(s.siswa)} siswa / {s.kelas} kelas)
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {programTab === "guru" && (
              <ol className="sh-list">
                {rencanaKeputusan.alokasiGuru.map((s, idx) => (
                  <li key={s.id} className="sh-list-item px-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => fokusKeSekolah(s)}
                        className="text-left text-[13px] font-semibold text-slate-900 hover:text-[#1F6F5F] leading-snug"
                      >
                        {idx + 1}. {s.nama}
                      </button>
                      <span className="text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md shrink-0">
                        +{s.alokasi} Guru
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Kec. {s.nama_wilayah} · {s.status} · Beban <strong>{fmt(s.rasioGuru, 1)}</strong> siswa/guru ({fmt(s.siswa)} siswa / {s.guru} guru)
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      ) : (
        <section className="sh-section">
          <div className="space-y-2.5 mb-3">
            <input
              type="search"
              placeholder="Cari nama sekolah, NPSN, atau desa..."
              className={inputCls}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setVisibleCount(35);
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Filter kecamatan"
                className={inputCls}
                value={filterWilayah}
                onChange={(e) => {
                  setFilterWilayah(e.target.value);
                  setVisibleCount(35);
                }}
              >
                <option value="">Semua Kecamatan ({kecamatan.length})</option>
                {kecamatan.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kec. {k.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter masalah sekolah"
                className={inputCls}
                value={filterMasalah}
                onChange={(e) => {
                  setFilterMasalah(e.target.value);
                  setVisibleCount(35);
                }}
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="rusak">Kelas Rusak (Berat/Sedang)</option>
                <option value="padat">Padat (&gt;32 siswa/kelas)</option>
                <option value="guru">Kurang Guru (&gt;20 siswa/guru)</option>
                <option value="mutu">Akreditasi C / Belum</option>
              </select>
              <select
                aria-label="Filter status sekolah"
                className={inputCls}
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setVisibleCount(35);
                }}
              >
                <option value="ALL">Negeri & Swasta</option>
                <option value="Negeri">Hanya SMP Negeri</option>
                <option value="Swasta">Hanya SMP Swasta</option>
              </select>
              <select
                aria-label="Filter akreditasi"
                className={inputCls}
                value={filterAkred}
                onChange={(e) => {
                  setFilterAkred(e.target.value);
                  setVisibleCount(35);
                }}
              >
                <option value="ALL">Semua Akreditasi</option>
                <option value="A">Akreditasi A</option>
                <option value="B">Akreditasi B</option>
                <option value="C">Akreditasi C</option>
                <option value="TT">Belum Terakreditasi</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>
              Menampilkan <strong>{fmt(filteredSchools.length)}</strong> sekolah
            </span>
            {(q || filterWilayah || filterStatus !== "ALL" || filterAkred !== "ALL" || filterMasalah !== "ALL") && (
              <button
                onClick={() => {
                  setQ("");
                  setFilterWilayah("");
                  setFilterStatus("ALL");
                  setFilterAkred("ALL");
                  setFilterMasalah("ALL");
                  setVisibleCount(35);
                }}
                className="text-xs font-semibold text-[#1F6F5F] hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>

          <ul className="sh-list">
            {filteredSchools.slice(0, visibleCount).map((s) => {
              const isCompared = comparedSchools.some((c) => c.id === s.id);
              return (
                <li key={s.id} className="sh-list-item px-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => fokusKeSekolah(s)}
                      className="text-left text-[13px] font-semibold text-slate-900 hover:text-[#1F6F5F] leading-snug"
                    >
                      {s.nama}
                    </button>
                    <span className="text-xs font-medium text-slate-600 shrink-0">
                      {s.status} · Akred. {s.akreditasi || "Belum"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    NPSN {s.npsn || "-"} · {s.desa ? `Desa ${s.desa} · ` : ""}Kec. {s.nama_wilayah}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    <strong>{fmt(s.siswa)}</strong> siswa · <strong>{fmt(s.guru)}</strong> guru
                    {s.rasioGuru > 0 ? ` (${fmt(s.rasioGuru, 0)}:1)` : ""} · <strong>{fmt(s.kelas)}</strong> kelas
                    {s.rasioKelas > 0 ? ` (${fmt(s.rasioKelas, 0)}/kls)` : ""}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-slate-600">
                      <span>Baik: {s.baik}</span>
                      {s.rusakRingan > 0 && <span>R. Ringan: {s.rusakRingan}</span>}
                      {s.rusakSedang > 0 && (
                        <span className="text-amber-800 font-semibold">R. Sedang: {s.rusakSedang}</span>
                      )}
                      {s.rusakBerat > 0 && (
                        <span className="text-rose-700 font-semibold">R. Berat: {s.rusakBerat}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <button
                        onClick={() => fokusKeSekolah(s)}
                        className="inline-flex items-center gap-1 font-semibold text-[#1F6F5F] hover:underline"
                      >
                        <MapPin size={12} />
                        <span>Peta</span>
                      </button>
                      <button
                        disabled={comparedSchools.length >= 3 || isCompared}
                        onClick={() => addToCompare(s.feature.properties)}
                        className="font-semibold text-slate-700 hover:text-slate-950 disabled:text-slate-400"
                      >
                        {isCompared ? "Dibandingkan" : "+ Bandingkan"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {filteredSchools.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((c) => c + 35)}
              className={`${btnGhost} w-full mt-3`}
            >
              Tampilkan lebih banyak ({fmt(filteredSchools.length - visibleCount)} tersisa)
            </button>
          )}
        </section>
      )}
    </div>
  );
}
