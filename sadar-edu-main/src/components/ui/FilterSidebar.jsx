import { ChevronDown } from 'lucide-react';

export default function FilterSidebar({
  selectedKecamatan = '',
  onKecamatanChange,
  selectedStatus = 'all',
  onStatusChange,
  kecamatanList = [],
  onReset,
}) {
  return (
    <div className="filter-sidebar-content">
      <h2>Persempit pencarian</h2>

      <div className="filter-field">
        <span>Provinsi</span>
        <div className="filter-disabled">Jawa Barat</div>
      </div>

      <div className="filter-field">
        <span>Kabupaten</span>
        <div className="filter-disabled">Kabupaten Bogor</div>
      </div>

      <label className="filter-field">
        <span>Kecamatan</span>
        <div className="relative">
          <select
            value={selectedKecamatan}
            onChange={(e) => onKecamatanChange?.(e.target.value)}
            className="w-full h-full bg-transparent appearance-none border-0 outline-none text-[#173042] text-sm pr-6 cursor-pointer"
          >
            <option value="">Semua Kecamatan (40)</option>
            {kecamatanList.map((k) => (
              <option key={k.id || k.name} value={k.id || k.name}>
                {k.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#445665]" />
        </div>
      </label>

      <hr />

      <div className="filter-field">
        <span>Jenjang</span>
        <div className="filter-disabled">SMP (Sekolah Menengah Pertama)</div>
      </div>

      <label className="filter-field">
        <span>Status sekolah</span>
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="w-full h-full bg-transparent appearance-none border-0 outline-none text-[#173042] text-sm pr-6 cursor-pointer"
          >
            <option value="all">Semua Status (Negeri &amp; Swasta)</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta">Swasta</option>
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#445665]" />
        </div>
      </label>

      <button
        type="button"
        className="filter-reset mt-2"
        onClick={onReset}
      >
        Hapus semua filter
      </button>

      <p className="filter-hint">
        Filter wilayah mencakup 40 kecamatan resmi di Kabupaten Bogor.
      </p>
    </div>
  );
}
