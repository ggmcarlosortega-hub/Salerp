"use client";
import React, { useState, useRef, useEffect } from "react";
import { useNotification } from "../context/NotificationContext";
import styles from "./NotificationBell.module.css";

const iconos = {
  success: "✓",
  error: "✕",
};

export default function NotificationBell() {
  const { notifications, clearNotification, clearAll } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unread = notifications.length;

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bell} onClick={() => setOpen((v) => !v)} title="Notificaciones">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <strong>Notificaciones</strong>
            {unread > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>
                Limpiar todo
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>Sin notificaciones</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`${styles.item} ${styles[n.type]}`}>
                  <span className={styles.icon}>{iconos[n.type]}</span>
                  <span className={styles.msg}>{n.message}</span>
                  <button className={styles.dismiss} onClick={() => clearNotification(n.id)}>
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
