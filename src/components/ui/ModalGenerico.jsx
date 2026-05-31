import styles from './../../app/dashboard/clientes/css/cliente.module.css';

export default function ModalGenerico({ abierto, onCerrar, titulo, badge, subtitulo, children, acciones }) {
  if (!abierto) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className={`${styles["modal"]} ${styles["modal-xl"]}`}>
        <div className={styles["modal-header"]}>
          <div>
            {badge && <span className={styles["modal-badge"]}>{badge}</span>}
            <h3>{titulo}</h3>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} className={styles["btn-close"]}>×</button>
        </div>

        <div className={styles["modal-body-grid"]}>
          {children}
        </div>

        {acciones && (
          <div className={styles["modal-actions"]}>
            {acciones}
          </div>
        )}
      </div>
    </div>
  );
}
