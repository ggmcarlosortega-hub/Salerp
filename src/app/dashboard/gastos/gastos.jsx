"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/gasto.module.css";
import { useNotification } from "../../../context/NotificationContext";

import { API_GASTO, getHeaders, getFileHeaders } from "@/utils/api";

const API_BASE = "http://localhost:3001";

const gastoInicial = {
  id_gasto: "",
  descripcion: "",
  tipo: "",
  monto: "",
  metodo_pago: "Efectivo",
  referencia: "",
  observacion: "",
  comprobante: "",
};

const tiposGasto = [
  "Servicio",
  "Materia prima",
  "Nómina",
  "Transporte",
  "Arriendo",
  "Mantenimiento",
  "Compra",
  "Impuesto",
  "Herramienta",
  "Otro",
];

const metodosPago = ["Efectivo", "Transferencia", "Tarjeta", "Crédito", "Otro"];

export default function GestionGastos() {
  const [gasto, setGasto] = useState(gastoInicial);
  const [lista, setLista] = useState([]);
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [previewComprobante, setPreviewComprobante] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [esEdicion, setEsEdicion] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");
  const [filtroEst, setFiltroEst] = useState("1");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const { notify } = useNotification();

  useEffect(() => {
    if (mensaje) {
      notify("success", mensaje);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMensaje("");
    }
    if (error) {
      notify("error", error);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("");
    }
  }, [mensaje, error, notify]);

  const [cargando, setCargando] = useState(false);

  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState(null);

  useEffect(() => {
    obtenerGastos();
  }, []);

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
      return new Date(fecha).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "Sin fecha";
    }
  };

  const obtenerMesActual = () => {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    return `${ahora.getFullYear()}-${mes}`;
  };

  const obtenerNombreMes = (valorMes) => {
    if (!valorMes) return "Todos los meses";

    const [anio, mes] = valorMes.split("-");
    const fecha = new Date(Number(anio), Number(mes) - 1, 1);

    return fecha.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    });
  };

  const getArchivoUrl = (ruta) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta;
    return `${API_BASE}${ruta}`;
  };

  const obtenerGastos = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(API_GASTO, { headers: getHeaders() });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al cargar gastos.");
      }

      setLista(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const gastosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return lista.filter((item) => {
      const fechaMes = item.fecha ? String(item.fecha).substring(0, 7) : "";
      const coincideMes = filtroMes ? fechaMes === filtroMes : true;
      const coincideTipo = filtroTipo ? item.tipo === filtroTipo : true;
      const coincideMetodo = filtroMetodo ? item.metodo_pago === filtroMetodo : true;
      const coincideEst = filtroEst !== "" ? Number(item.estado) === Number(filtroEst) : true;

      const coincideBusqueda =
        !texto ||
        item.descripcion?.toLowerCase().includes(texto) ||
        item.tipo?.toLowerCase().includes(texto) ||
        item.metodo_pago?.toLowerCase().includes(texto) ||
        item.referencia?.toLowerCase().includes(texto) ||
        item.observacion?.toLowerCase().includes(texto) ||
        String(item.monto || "").includes(texto);

      return coincideMes && coincideTipo && coincideMetodo && coincideBusqueda && coincideEst;
    });
  }, [lista, busqueda, filtroMes, filtroTipo, filtroMetodo, filtroEst]);

  const resumen = useMemo(() => {
    const mesActual = obtenerMesActual();

    const totalGeneral = lista.reduce((acc, item) => acc + Number(item.monto || 0), 0);

    const totalMesActual = lista.reduce((acc, item) => {
      const fechaMes = item.fecha ? String(item.fecha).substring(0, 7) : "";
      return fechaMes === mesActual ? acc + Number(item.monto || 0) : acc;
    }, 0);

    const totalFiltrado = gastosFiltrados.reduce((acc, item) => {
      return acc + Number(item.monto || 0);
    }, 0);

    const comprobantes = lista.filter((item) => item.comprobante).length;

    const gastoMayor = gastosFiltrados.reduce((mayor, item) => {
      return Number(item.monto || 0) > Number(mayor?.monto || 0) ? item : mayor;
    }, null);

    return {
      totalGeneral,
      totalMesActual,
      totalFiltrado,
      comprobantes,
      gastoMayor,
    };
  }, [lista, gastosFiltrados]);

  const tipoMasUsado = useMemo(() => {
    if (lista.length === 0) return "Sin datos";

    const conteo = lista.reduce((acc, item) => {
      const tipo = item.tipo || "Sin tipo";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";
  }, [lista]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroMes("");
    setFiltroTipo("");
    setFiltroMetodo("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setGasto((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArchivo = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    setArchivoComprobante(archivo);
    setNombreArchivo(archivo.name);

    if (archivo.type.startsWith("image/")) {
      setPreviewComprobante(URL.createObjectURL(archivo));
    } else {
      setPreviewComprobante("");
    }
  };

  const abrirModalRegistro = () => {
    cancelar(false);
    setMostrarModalFormulario(true);
  };

  const guardar = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!gasto.descripcion.trim() || !gasto.tipo || !gasto.monto) {
      setError("La descripción, el tipo y el monto son obligatorios.");
      return;
    }

    if (Number(gasto.monto) <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("descripcion", gasto.descripcion.trim());
      formData.append("tipo", gasto.tipo);
      formData.append("monto", gasto.monto);
      formData.append("metodo_pago", gasto.metodo_pago || "Efectivo");
      formData.append("referencia", gasto.referencia || "");
      formData.append("observacion", gasto.observacion || "");

      if (archivoComprobante) {
        formData.append("comprobante", archivoComprobante);
      }

      const respuesta = await fetch(
        esEdicion ? `${API_GASTO}/${gasto.id_gasto}` : API_GASTO,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: getFileHeaders(),
          body: formData,
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al guardar gasto.");
      }

      setMensaje(
        esEdicion
          ? "Gasto actualizado correctamente."
          : "Gasto registrado correctamente."
      );

      await obtenerGastos();
      cancelar();
      setMostrarModalFormulario(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    }
  };

  const iniciarEdicion = (item) => {
    setGasto({
      id_gasto: item.id_gasto || "",
      descripcion: item.descripcion || "",
      tipo: item.tipo || "",
      monto: item.monto || "",
      metodo_pago: item.metodo_pago || "Efectivo",
      referencia: item.referencia || "",
      observacion: item.observacion || "",
      comprobante: item.comprobante || "",
    });

    setArchivoComprobante(null);
    setPreviewComprobante("");
    setNombreArchivo("");
    setEsEdicion(true);
    setMostrarModalFormulario(true);
  };

  const iniciarEliminacion = (item) => {
    setGastoAEliminar(item);
    setMostrarModalConfirmacion(true);
  };

  const confirmarEliminacion = async () => {
    try {
      setMensaje("");
      setError("");

      const respuesta = await fetch(`${API_GASTO}/${gastoAEliminar.id_gasto}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al desactivar gasto.");
      }

      setMensaje("Gasto desactivado correctamente.");
      setMostrarModalConfirmacion(false);
      setGastoAEliminar(null);
      await obtenerGastos();
    } catch (err) {
      setError(err.message);
      setMostrarModalConfirmacion(false);
    }
  };

  const activarGasto = async (id) => {
    try {
      setMensaje("");
      setError("");

      const respuesta = await fetch(`${API_GASTO}/activar/${id}`, {
        method: "PUT",
        headers: getHeaders(),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al activar gasto.");
      }

      setMensaje("Gasto activado correctamente.");
      await obtenerGastos();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelar = (cerrarModal = true) => {
    setGasto(gastoInicial);
    setArchivoComprobante(null);
    setPreviewComprobante("");
    setNombreArchivo("");
    setEsEdicion(false);

    if (cerrarModal) {
      setMostrarModalFormulario(false);
    }
  };

  const abrirComprobante = (ruta) => {
    if (!ruta) {
      setMensaje("Este gasto no tiene comprobante asociado.");
      return;
    }

    window.open(getArchivoUrl(ruta), "_blank");
  };

  return (
    <div className={styles["page"]}>
      <section className={styles["hero"]}>
        <div className={styles["hero-content"]}>
          <span className={styles["hero-badge"]}>Lectura rápida</span>
          <h1>
            {gastosFiltrados.length} gastos encontrados · {formatoMoneda(resumen.totalFiltrado)}
          </h1>
          <p>
            {resumen.gastoMayor
              ? `El gasto mayor del filtro es "${resumen.gastoMayor.descripcion}" por ${formatoMoneda(resumen.gastoMayor.monto)}.`
              : "Aún no hay gastos para mostrar con los filtros actuales."}
          </p>
        </div>
        <div className={styles["hero-panel"]}>
          <span className={styles["hero-panel-label"]}>Totales</span>
          <strong>{formatoMoneda(resumen.totalFiltrado)}</strong>
          <small>Total general del filtro actual</small>
          <button type="button" onClick={limpiarFiltros} className={styles["btn-hero"]}>
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className={styles["panel"]}>
        <div className={styles["panel-header"]}>
          <div>
            <h2>Historial de gastos</h2>
            <p>Consulta, filtra, edita y revisa comprobantes sin abrir el formulario principal.</p>
          </div>

          <div className={styles["panel-actions"]}>
            <button
              type="button"
              onClick={abrirModalRegistro}
              className={styles["btn-add"]}
            >
              + Nuevo gasto
            </button>

            <div className={styles["filters"]}>
            <div className={styles["search-box"]}>
              <span>⌕</span>
              <input
                type="text"
                placeholder="Buscar por descripción, referencia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)} className={styles["filter-control"]}>
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Desactivados</option>
              </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className={styles["filter-control"]}
            >
              <option value="">Todos los tipos</option>
              {tiposGasto.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className={styles["filter-control"]}
            >
              <option value="">Todos los métodos</option>
              {metodosPago.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>

        <div className={styles["table-wrap"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>Gasto</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Soporte</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {gastosFiltrados.map((item) => (
                <tr key={item.id_gasto}>
                  <td>
                    <div className={styles["expense-cell"]}>
                      <div className={styles["expense-icon"]}>
                        {item.tipo?.charAt(0)?.toUpperCase() || "G"}
                      </div>

                      <div>
                        <strong>{item.descripcion}</strong>
                        <span>{item.referencia || "Sin referencia"}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={styles["pill-blue"]}>{item.tipo || "Sin tipo"}</span>
                  </td>

                  <td>
                    <strong>{formatoMoneda(item.monto)}</strong>
                  </td>

                  <td>{formatoFecha(item.fecha)}</td>

                  <td>
                    <span className={styles["pill-gray"]}>
                      {item.metodo_pago || "Efectivo"}
                    </span>
                  </td>

                  <td>
                    {item.comprobante ? (
                      <button
                        type="button"
                        onClick={() => abrirComprobante(item.comprobante)}
                        className={styles["btn-table"]}
                      >
                        Ver soporte
                      </button>
                    ) : (
                      <span className={styles["pill-muted"]}>Sin soporte</span>
                    )}
                  </td>

                  <td>
                    <div className={styles["row-actions"]}>
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(item)}
                        className={styles["btn-table"]}
                      >
                        Editar
                      </button>

                      {Number(item.estado) === 0 ? (
                        <button
                          type="button"
                          onClick={() => activarGasto(item.id_gasto)}
                          className={styles["btn-table"]}
                        >
                          Activar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => iniciarEliminacion(item)}
                          className={styles["btn-delete-small"]}
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!cargando && gastosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="7" className={styles["empty"]}>
                    No hay gastos registrados con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {cargando && (
                <tr>
                  <td colSpan="7" className={styles["empty"]}>
                    Cargando gastos...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mostrarModalFormulario && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["expense-modal"]}>
            <div className={styles["modal-topbar"]}>
              <div>
                <span>{esEdicion ? "Actualizar registro" : "Nuevo egreso"}</span>
                <h3>{esEdicion ? "Editar gasto" : "Registrar gasto"}</h3>
                <p>
                  La fecha se guarda automáticamente desde el backend al momento de registrar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => cancelar()}
                className={styles["btn-close"]}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={guardar} className={styles["modal-body"]}>
              <div className={styles["form-panel"]}>
                <div className={styles["form-grid"]}>
                  <div className={styles["field-full"]}>
                    <label>Descripción del gasto</label>
                    <input
                      type="text"
                      name="descripcion"
                      value={gasto.descripcion}
                      onChange={handleChange}
                      placeholder="Ej: Pago de luz, compra de herramientas, transporte..."
                      maxLength="500"
                    />
                  </div>

                  <div>
                    <label>Tipo de gasto</label>
                    <select name="tipo" value={gasto.tipo} onChange={handleChange}>
                      <option value="">Seleccionar tipo</option>
                      {tiposGasto.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Monto</label>
                    <input
                      type="number"
                      name="monto"
                      value={gasto.monto}
                      onChange={handleChange}
                      placeholder="0"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label>Método de pago</label>
                    <select
                      name="metodo_pago"
                      value={gasto.metodo_pago}
                      onChange={handleChange}
                    >
                      {metodosPago.map((metodo) => (
                        <option key={metodo} value={metodo}>
                          {metodo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Referencia</label>
                    <input
                      type="text"
                      name="referencia"
                      value={gasto.referencia}
                      onChange={handleChange}
                      placeholder="Factura, recibo o transferencia"
                      maxLength="255"
                    />
                  </div>

                  <div className={styles["field-full"]}>
                    <label>Observación</label>
                    <textarea
                      name="observacion"
                      value={gasto.observacion}
                      onChange={handleChange}
                      placeholder="Notas adicionales del gasto..."
                      maxLength="2000"
                    />
                  </div>

                  <div className={styles["field-full"]}>
                    <label>Observación</label>
                    <textarea
                      name="observacion"
                      value={gasto.observacion}
                      onChange={handleChange}
                      placeholder="Notas internas del gasto..."
                    />
                  </div>
                </div>
              </div>

              <aside className={styles["receipt-panel"]}>
                <div className={styles["receipt-glow"]}></div>

                <div className={styles["receipt-header"]}>
                  <span>Comprobante</span>
                  <small>Imagen o PDF</small>
                </div>

                <label className={styles["upload-card"]}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleArchivo}
                  />

                  {previewComprobante ? (
                    <img src={previewComprobante} alt="Vista previa del comprobante" />
                  ) : gasto.comprobante ? (
                    <div className={styles["upload-empty"]}>
                      <div className={styles["upload-icon"]}>✓</div>
                      <strong>Soporte guardado</strong>
                      <span>Selecciona otro archivo para reemplazarlo.</span>
                    </div>
                  ) : (
                    <div className={styles["upload-empty"]}>
                      <div className={styles["upload-icon"]}>＋</div>
                      <strong>Adjuntar soporte</strong>
                      <span>Factura, recibo o comprobante de pago</span>
                    </div>
                  )}
                </label>

                <div className={styles["file-info"]}>
                  <span>Archivo</span>
                  <strong>
                    {nombreArchivo ||
                      (gasto.comprobante ? "Comprobante guardado" : "Ningún archivo seleccionado")}
                  </strong>
                </div>

                {gasto.comprobante && (
                  <button
                    type="button"
                    onClick={() => abrirComprobante(gasto.comprobante)}
                    className={styles["btn-soft-full"]}
                  >
                    Ver comprobante actual
                  </button>
                )}
              </aside>

              <div className={styles["modal-actions"]}>
                <button
                  type="button"
                  onClick={() => cancelar()}
                  className={styles["btn-light"]}
                >
                  Cancelar
                </button>

                <button type="submit" className={styles["btn-primary"]}>
                  {esEdicion ? "Actualizar gasto" : "Registrar gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalConfirmacion && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["confirm-modal"]}>
            <div className={styles["confirm-icon"]}>!</div>
            <h3>Desactivar gasto</h3>
            <p>
              ¿Seguro que deseas desactivar el gasto{" "}
              <strong>{gastoAEliminar?.descripcion}</strong>? El registro dejará de aparecer
              en la lista principal.
            </p>

            <div className={styles["confirm-actions"]}>
              <button
                type="button"
                onClick={() => setMostrarModalConfirmacion(false)}
                className={styles["btn-light"]}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminacion}
                className={styles["btn-danger"]}
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
