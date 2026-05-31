export default function Buscador({ valor, onChange, placeholder = "Buscar..." }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 10, top: 8, color: '#94a3b8' }}>⌕</span>
      <input
        type="text"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px 8px 32px',
          border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 14, outline: 'none',
        }}
      />
    </div>
  );
}
