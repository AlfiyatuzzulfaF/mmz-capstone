export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Halaman Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Ringkasan Operasional
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pantau performa harian, antrean sesi Studio 1 & Studio 2, serta kelola transaksi kasir secara terpusat.
          </p>
        </div>
      </div>
    </div>
  );
}
