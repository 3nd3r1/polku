export function SectionHeader({ index, title, right }: { index: string; title: string; right?: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-line px-6">
      <span className="label">
        <span className="text-dim">{index} /</span> <span className="text-fg">{title}</span>
      </span>
      {right && <span className="label">{right}</span>}
    </div>
  );
}
