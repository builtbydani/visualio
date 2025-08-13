export default function ButtonPill({ active, children, className = "", ...props }) {
  const base = "px-3 py-1.5 rounded-xl text-sm border transition-colors";
  const on = "border-white/40 bg-white/10";
  const off = "border-white/10 hover:bg-white/5";
  return (
    <button className={`${base} ${active ? on : off} ${className}`} {...props}>
      {children}
    </button>
  );
}
