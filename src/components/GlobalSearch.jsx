"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./GlobalSearch.module.css";

const PAGINAS = [
  { path: "/dashboard/clientes", label: "Clientes", keywords: "registrar cliente crear nuevo agregar persona empresa", icon: "👤" },
  { path: "/dashboard/maquinaria", label: "Maquinaria", keywords: "registrar maquinaria equipo mantenimiento", icon: "⚙️" },
  { path: "/dashboard/productos", label: "Productos", keywords: "registrar producto catalogo insumo fabricar", icon: "📦" },
  { path: "/dashboard/gastos", label: "Gastos", keywords: "registrar gasto costo egreso", icon: "💸" },
  { path: "/dashboard/proveedor", label: "Proveedor", keywords: "registrar proveedor insumo comprar materia prima", icon: "🏭" },
  { path: "/dashboard/cotizar", label: "Cotizar", keywords: "cotizacion cliente catalogo comprar", icon: "🛒" },
  { path: "/dashboard", label: "Dashboard", keywords: "inicio panel estadisticas grafica", icon: "📊" },
];

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  const resultados = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return PAGINAS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.keywords.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  const navegar = (path) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)} title="Buscar (Ctrl+K)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.inputWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Buscar página..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>ESC</kbd>
          </div>

          <div className={styles.lista}>
            {resultados.length === 0 && query.trim() ? (
              <div className={styles.empty}>Sin resultados</div>
            ) : !query.trim() ? (
              <div className={styles.sugerencias}>
                <div className={styles.sugHeader}>Páginas disponibles</div>
                {PAGINAS.map((p) => (
                  <button key={p.path} className={styles.item} onClick={() => navegar(p.path)}>
                    <span>{p.icon}</span>
                    <span className={styles.itemLabel}>{p.label}</span>
                    <span className={styles.itemPath}>{p.path}</span>
                  </button>
                ))}
              </div>
            ) : (
              resultados.map((p) => (
                <button key={p.path} className={styles.item} onClick={() => navegar(p.path)}>
                  <span>{p.icon}</span>
                  <span className={styles.itemLabel}>{p.label}</span>
                  <span className={styles.itemPath}>{p.path}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
