import styles from './../../app/dashboard/clientes/css/cliente.module.css';

export default function TablaGenerica({ columnas, datos, filaVacia, cargando, mensajeVacio }) {
  return (
    <div className={styles["table-wrap"]}>
      <table className={styles["table"]}>
        <thead>
          <tr>
            {columnas.map((col, i) => (
              <th key={i} style={col.width ? { width: col.width } : undefined}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={fila.id || i}>
              {columnas.map((col, j) => (
                <td key={j}>{fila[col.key]}</td>
              ))}
            </tr>
          ))}
          {!cargando && datos.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className={styles["empty"]}>
                {mensajeVacio || 'No hay registros.'}
              </td>
            </tr>
          )}
          {cargando && (
            <tr>
              <td colSpan={columnas.length} className={styles["empty"]}>Cargando...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
