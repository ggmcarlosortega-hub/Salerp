"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Accesos.module.css";

const MODULOS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "📊" },
  { key: "clientes", label: "Clientes", href: "/dashboard/clientes", icon: "👤" },
  { key: "maquinaria", label: "Maquinaria", href: "/dashboard/maquinaria", icon: "⚙️" },
  { key: "productos", label: "Productos", href: "/dashboard/productos", icon: "📦" },
  { key: "gastos", label: "Gastos", href: "/dashboard/gastos", icon: "💸" },
  { key: "proveedor", label: "Proveedor", href: "/dashboard/proveedor", icon: "🏭" },
  { key: "cotizar", label: "Cotizar", href: "/dashboard/cotizar", icon: "🛒" },
];

export default function Accesos() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const [accesos, setAccesos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("accesos_salerp");
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAccesos(JSON.parse(raw));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("accesos_salerp", JSON.stringify(accesos));
  }, [accesos, loaded]);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggle = (key) => {
    setAccesos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const accesosOrdenados = MODULOS.filter((m) => accesos.includes(m.key));

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.accesosBtn} onClick={() => setOpen((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span>Accesos</span>
      </button>

      <div className={styles.shortcuts}>
        {accesosOrdenados.map((m) => (
          <button
            key={m.key}
            className={`${styles.shortcut} ${pathname === m.href ? styles.active : ""}`}
            onClick={() => router.push(m.href)}
            title={m.label}
          >
            <span>{m.icon}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>Organizar Accesos Directos</div>
          <div className={styles.body}>
            {MODULOS.map((m) => (
              <label key={m.key} className={styles.item}>
                <input
                  type="checkbox"
                  checked={accesos.includes(m.key)}
                  onChange={() => toggle(m.key)}
                />
                <span>{m.icon}</span>
                <span className={styles.itemLabel}>{m.label}</span>
              </label>
            ))}
          </div>
          <div className={styles.footer}>
            Selecciona los módulos que quieres tener siempre a la vista.
          </div>
        </div>
      )}
    </div>
  );
}
