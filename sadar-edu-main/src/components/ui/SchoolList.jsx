import iconList from '../../assets/figma/icon-list.svg';
import schoolHero from '../../assets/figma/school-hero.png';
import schoolA from '../../assets/figma/school-a.png';
import schoolB from '../../assets/figma/school-b.png';
import schoolC from '../../assets/figma/school-c.png';

const ILLUSTRATIONS = [schoolHero, schoolA, schoolB, schoolC];

export default function SchoolList({
  schools = [],
  onDetail,
  query = '',
}) {
  const visibleSchools = schools.filter((school) => {
    const p = school.properties || school;
    const name = p.nama || p.nama_sekolah || '';
    const npsn = p.npsn ? String(p.npsn) : '';
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return name.toLowerCase().includes(q) || npsn.includes(q);
  });

  const total = visibleSchools.length;
  const mapped = visibleSchools.filter((s) => {
    const coords = s.geometry?.coordinates || [s.longitude, s.latitude];
    return coords && coords[0] && coords[1];
  }).length;
  const unmapped = total - mapped;

  return (
    <section className="school-list-content" aria-labelledby="school-list-title">
      <h2 className="school-list-title" id="school-list-title">
        <img src={iconList} alt="" />
        Daftar sekolah
      </h2>

      <div className="school-list-counts" aria-label="Ringkasan hasil">
        <div>
          <strong>{total}</strong>
          <small>Total hasil</small>
        </div>
        <div>
          <strong>{mapped}</strong>
          <small>Terpetakan</small>
        </div>
        <div>
          <strong>{unmapped}</strong>
          <small>Tanpa titik</small>
        </div>
      </div>

      <hr />

      {visibleSchools.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#445665]">
          Tidak ada data sekolah yang cocok dengan kriteria filter.
        </div>
      ) : (
        <div className="school-cards">
          {visibleSchools.map((school, index) => {
            const p = school.properties || school;
            const name = p.nama || p.nama_sekolah || `Sekolah #${index + 1}`;
            const npsn = p.npsn || 'NPSN belum tersedia';
            const status = p.status || p.status_sekolah || 'SMP';
            const jenjang = p.jenjang || 'SMP';
            const wilayah = p.kecamatan || p.nama_wilayah || 'Kabupaten Bogor';
            const coords = school.geometry?.coordinates || [school.longitude, school.latitude];
            const hasCoords = Boolean(coords && coords[0] && coords[1]);
            const image = p.fotoUrl || ILLUSTRATIONS[index % ILLUSTRATIONS.length];

            return (
              <article className="school-card" key={p.id || p.npsn || index}>
                <div className="school-card-image">
                  <img src={image} alt={`Foto ${name}`} />
                  <span>{p.fotoUrl ? 'Foto sekolah' : 'Foto ilustrasi'}</span>
                </div>
                <div className="school-card-body">
                  <h3 title={name}>{name}</h3>
                  <p>NPSN: {npsn}</p>
                  <p>{jenjang} &bull; {status} &bull; {wilayah}</p>
                  {!hasCoords ? (
                    <p className="school-card-unavailable">Koordinat belum tersedia</p>
                  ) : (
                    <button
                      type="button"
                      className="school-card-action"
                      onClick={() => onDetail?.(school)}
                    >
                      Lihat detail sekolah &rarr;
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="school-list-note">
        Data bersumber dari Dapodik &amp; Basis Data Dinas Pendidikan Kabupaten Bogor.
      </p>
    </section>
  );
}
