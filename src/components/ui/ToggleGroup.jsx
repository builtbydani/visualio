import ButtonPill from "./ButtonPill.jsx";
export default function ToggleGroup({ options, value, onChange, cols = 3 }) {
  return (
    <div className={`grid grid-cols-${cols} gap-2`}>
      {options.map(o => (
        <ButtonPill key={o.id} active={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </ButtonPill>
      ))}
    </div>
  );
}
