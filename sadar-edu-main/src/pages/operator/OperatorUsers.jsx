import AkunTab from '../../components/operator/AkunTab';
import { PageHeader } from '../../components/operator/ui';

export default function OperatorUsers() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-7">
      <PageHeader
        eyebrow="Akses & Pengguna"
        title="Kelola Akun Staf"
        description="Pendaftaran mandiri hanya menghasilkan akun umum. Tambahkan dan kelola hak akses staf Dinas (Stakeholder dan Operator) di sini."
      />
      <AkunTab />
    </div>
  );
}
