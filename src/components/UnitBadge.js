export default function UnitBadge({ code }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-sm">
      {code}
    </span>
  );
}
