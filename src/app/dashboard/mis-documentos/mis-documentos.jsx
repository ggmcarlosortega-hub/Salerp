"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./css/mis-documentos.module.css";
import { API_DOCUMENTO, getHeaders, getFileHeaders } from "@/utils/api";

const formatoMoneda = (valor) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(valor || 0));
};

const formatoFecha = (fecha) => {
  if (!fecha) return "Sin fecha";
  try {
    return new Date(fecha).toLocaleDateString("es-CO");
  } catch {
    return "Sin fecha";
  }
};

const TIPO_DOCUMENTOS = [
  { value: "todos", label: "Todos los documentos" },
  { value: "Cotización", label: "Cotizaciones" },
  { value: "Factura", label: "Facturas" },
  { value: "Contrato", label: "Contratos" },
  { value: "Abono", label: "Abonos" },
];

const TITULO_DOCUMENTOS = {
  todos: "documentos",
  Cotización: "cotizaciones",
  Factura: "facturas",
  Contrato: "contratos",
  Abono: "abonos",
};

const RUTA_PDF = {
  "Cotización": "cotizacion",
  "Factura": "factura",
  "Contrato": "contrato",
  "Abono": "abono",
};

export default function MisDocumentos() {
  const router = useRouter();
  const [usuario, setUsuario] = useState({ nombre: "", correo: "", rol: "" });
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [redirigiendo, setRedirigiendo] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user_salerp");
      if (raw) {
        const datos = JSON.parse(raw);
        if (datos.rol?.toLowerCase() === "admin") {
          router.push("/dashboard");
          return;
        }
        setUsuario({
          nombre: datos.nombre || datos.correo?.split("@")[0] || "",
          correo: datos.correo || "",
          rol: datos.rol || "",
        });
      } else {
        setRedirigiendo(true);
        router.push("/dashboard/cotizar");
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    if (!usuario.correo) return;

    const fetchDocumentos = async () => {
      setCargando(true);
      setError("");
      try {
        const res = await fetch(`${API_DOCUMENTO}/cliente/${encodeURIComponent(usuario.correo)}`, {
          headers: getHeaders(),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al obtener documentos");
        }
        const data = await res.json();
        setDocumentos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchDocumentos();
  }, [usuario.correo]);

  const documentosFiltrados = useMemo(() => {
    let filtrados = documentos;

    if (tipoFiltro !== "todos") {
      filtrados = filtrados.filter((doc) => doc.tipo_documento === tipoFiltro);
    }

    if (estadoFiltro === "activos") {
      filtrados = filtrados.filter((doc) => Number(doc.activo) === 1);
    } else if (estadoFiltro === "desactivados") {
      filtrados = filtrados.filter((doc) => Number(doc.activo) !== 1);
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      filtrados = filtrados.filter(
        (doc) =>
          String(doc.id_documento).includes(q) ||
          (doc.asunto && doc.asunto.toLowerCase().includes(q)) ||
          (doc.observaciones && doc.observaciones.toLowerCase().includes(q)) ||
          (doc.tipo_documento && doc.tipo_documento.toLowerCase().includes(q))
      );
    }

    return filtrados;
  }, [documentos, tipoFiltro, estadoFiltro, busqueda]);

  const badgeTipo = (tipo) => {
    switch (tipo) {
      case "Cotización":
        return styles["badge-cotizacion"];
      case "Factura":
        return styles["badge-factura"];
      case "Contrato":
        return styles["badge-contrato"];
      case "Abono":
        return styles["badge-abono"];
      default:
        return styles["badge-cotizacion"];
    }
  };

  const pillEstado = (doc) => {
    if (Number(doc.activo) !== 1) return styles["pill-gray"];
    const estado = String(doc.estado ?? "").toLowerCase();
    if (estado === "desactivado") return styles["pill-gray"];
    if (
      estado === "pagada" ||
      estado === "aceptada" ||
      estado === "activo" ||
      estado === "efectivo"
    )
      return styles["pill-success"];
    return styles["pill-blue"];
  };

  const textoEstado = (doc) => {
    return Number(doc.activo) !== 1 ? "Desactivado" : doc.estado || "Sin estado";
  };

  const abrirPDF = async (doc) => {
    const idField = RUTA_PDF[doc.tipo_documento] || "cotizacion";

    try {
      const res = await fetch(`${API_DOCUMENTO}/${idField}/${doc.id_documento}/pdf`, {
        headers: getFileHeaders(),
      });
      if (!res.ok) throw new Error("Error al obtener el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      setError(err.message);
    }
  };

  if (redirigiendo) {
    return <div className={styles["loading"]}>Redirigiendo...</div>;
  }

  if (cargando) {
    return <div className={styles["loading"]}>Cargando documentos...</div>;
  }

  if (error && documentos.length === 0) {
    return <div className={styles["error"]}>{error}</div>;
  }

  return (
    <div className={styles["page"]}>
      <div className={styles["hero"]}>
        <div className={styles["hero-content"]}>
          <span className={styles["hero-badge"]}>Portal del cliente</span>
          <h1>Mis Documentos</h1>
          <p>Consulta todas tus cotizaciones, facturas, contratos y abonos.</p>
        </div>
      </div>

      <div className={styles["card"]}>
        <div className={styles["card-header"]}>
          <div>
            <h2>Historial de documentos</h2>
            <p>Revisa el estado y detalle de tus documentos generados.</p>
          </div>

          <div className={styles["doc-toolbar"]}>
            <select
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value);
                setBusqueda("");
                setMenuAbierto(null);
              }}
            >
              {TIPO_DOCUMENTOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value);
                setMenuAbierto(null);
              }}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="desactivados">Desactivados</option>
            </select>
            <input
              type="text"
              placeholder={`Buscar en ${TITULO_DOCUMENTOS[tipoFiltro]}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className={styles["table-wrap"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total / Monto</th>
                <th>Observación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documentosFiltrados.map((doc) => {
                const key = `${doc.tipo_documento}-${doc.id_documento}`;
                return (
                  <tr key={key}>
                    <td>
                      <span className={badgeTipo(doc.tipo_documento)}>
                        {doc.tipo_documento}
                      </span>
                      <strong>
                        #{doc.id_documento}
                      </strong>
                      <span>{doc.asunto || "Sin asunto"}</span>
                    </td>
                    <td>{formatoFecha(doc.fecha)}</td>
                    <td>
                      <span className={pillEstado(doc)}>
                        {textoEstado(doc)}
                      </span>
                    </td>
                    <td>
                      <strong>{formatoMoneda(doc.total)}</strong>
                    </td>
                    <td>{doc.observaciones || "Sin observación"}</td>
                    <td className={styles["actions-cell"]}>
                      <button
                        type="button"
                        className={styles["btn-dots"]}
                        onClick={() =>
                          setMenuAbierto(menuAbierto === key ? null : key)
                        }
                      >
                        ⋮
                      </button>

                      {menuAbierto === key && (
                        <div className={styles["doc-menu"]}>
                          <button type="button" onClick={() => abrirPDF(doc)}>
                            {doc.tipo_documento === "Abono"
                              ? "Ver comprobante"
                              : "Ver PDF"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {documentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles["empty"]}>
                    No hay{" "}
                    {estadoFiltro === "activos"
                      ? `${TITULO_DOCUMENTOS[tipoFiltro]} activos`
                      : estadoFiltro === "desactivados"
                      ? `${TITULO_DOCUMENTOS[tipoFiltro]} desactivados`
                      : TITULO_DOCUMENTOS[tipoFiltro]}{" "}
                    registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
