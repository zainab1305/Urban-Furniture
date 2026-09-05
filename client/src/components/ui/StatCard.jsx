export function StatCard({ label, value, note, tone = 'green' }) {
  return <article className="stat-card"><span className="stat-label">{label}</span><strong>{value}</strong><span className={`stat-note ${tone}`}>{note}</span></article>;
}
