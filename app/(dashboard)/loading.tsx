export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-[var(--color-surface)] rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--color-surface)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
