export default function ColorControl({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)} className="w-full h-10 rounded" />
    </div>
  );
}
