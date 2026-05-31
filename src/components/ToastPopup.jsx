"use client";
import React, { useEffect, useState, useRef } from "react";
import { useNotification } from "../context/NotificationContext";
import styles from "./ToastPopup.module.css";

export default function ToastPopup() {
  const { notifications, clearNotification } = useNotification();
  const [visible, setVisible] = useState(null);
  const timerRef = useRef(null);

  const latest = notifications[0];

  useEffect(() => {
    if (!latest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(null);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(latest);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(null);
      clearNotification(latest.id);
    }, latest.type === "error" ? 8000 : 3000);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${visible.type === "success" ? styles.success : styles.error}`}>
      <span className={styles.icon}>{visible.type === "success" ? "✓" : "✕"}</span>
      <span className={styles.msg}>{visible.message}</span>
      <button className={styles.close} onClick={() => { clearNotification(visible.id); setVisible(null); }}>×</button>
    </div>
  );
}
