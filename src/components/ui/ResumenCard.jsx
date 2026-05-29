import styles from './../../app/dashboard/clientes/css/cliente.module.css';

export default function ResumenCard({ label, valor, footer, formato = (v) => v }) {
  return (
    <article className={styles["summary-card"]}>
      <span>{label}</span>
      <strong>{formato(valor)}</strong>
      {footer && <small>{footer}</small>}
    </article>
  );
}
