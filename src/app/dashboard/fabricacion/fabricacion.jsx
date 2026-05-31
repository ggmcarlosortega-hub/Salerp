"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/fabricacion.module.css";
import { useNotification } from "../../../context/NotificationContext";

const API_BASE = "http://localhost:3001";
const API_FABRICACION = `${API_BASE}/api/fabricacion`;
const API_PRODUCTO = `${API_BASE}/api/producto`;

const ordenInicial = {
  id_producto: "",
  cantidad: 1,
  observacion: "",
};

const API_HEADERS = () => {
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem('user_salerp') : null;
  const usuario = raw ? JSON.parse(raw) : {};
  return {
    'Content-Type': 'application/json',
    'x-empresa-id': usuario.id_empresa || '1',
    'x-user-id': usuario.id_acceso || ''
  };
};

export default function GestionFabricacion() {
  const [ordenes, setOrdenes] = useState([]);
  const [vistaActual, setVistaActual] = useState("lista");
  const [orden, setOrden] = useState(null);
  const [ordenForm, setOrdenForm] = useState(ordenInicial);
  const [productosFabricados, setProductosFabricados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarModalOrden, setMostrarModalOrden] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    if (mensaje) {
      notify("success", mensaje);
      setMensaje("");
    }
    if (error) {
      notify("error", error);
      setError("");
    }
  }, [mensaje, error, notify]);

  useEffect(() => {
    cargarOrdenes();
    cargarProductosFabricados();
  }, []);

  const formatoMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(valor || 0));

  const cargarOrdenes = async () => {
    try {
      setCargando(true);
      const res = await fetch(API_FABRICACION, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar órdenes.");
      setOrdenes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarProductosFabricados = async () => {
    try {
      const res = await fetch(API_PRODUCTO, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar productos.");
      const fabricados = data.filter(p => p.tipo_producto === "Fabricado" && Number(p.estado) === 1);
      setProductosFabricados(fabricados);
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirDetalle = async (o) => {
    try {
      setCargando(true);
      const res = await fetch(`${API_FABRICACION}/${o.id_orden}`, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar orden.");
      setOrden(data);
      setVistaActual("detalle");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const volverLista = () => {
    setOrden(null);
    setOrdenForm(ordenInicial);
    setVistaActual("lista");
    cargarOrdenes();
  };

  const nuevaOrden = () => {
    setOrdenForm(ordenInicial);
    setMostrarModalOrden(true);
  };

  const handleOrdenChange = (e) => {
    const { name, value } = e.target;
    setOrdenForm(prev => ({ ...prev, [name]: value }));
  };

  const crearOrden = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!ordenForm.id_producto) {
      setError("Debes seleccionar un producto.");
      return;
    }

    if (!ordenForm.cantidad || Number(ordenForm.cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    try {
      const res = await fetch(API_FABRICACION, {
        method: "POST",
        headers: API_HEADERS(),
        body: JSON.stringify(ordenForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear orden.");

      setMensaje(`Orden ${data.codigo} creada correctamente.`);
      setMostrarModalOrden(false);
      setOrdenForm(ordenInicial);
      await cargarOrdenes();
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarEstado = async (id_orden, nuevoEstado) => {
    try {
      const res = await fetch(`${API_FABRICACION}/${id_orden}/estado`, {
        method: "PUT",
        headers: API_HEADERS(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado.");

      if (nuevoEstado === "Completada") {
        setMensaje("Orden completada. Insumos descontados del inventario y stock de producto incrementado.");
      } else {
        setMensaje(`Orden actualizada a ${nuevoEstado}.`);
      }

      if (orden?.orden?.id_orden === id_orden) {
        await abrirDetalle({ id_orden });
      } else {
        await cargarOrdenes();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarOrden = async (id_orden) => {
    if (!confirm("¿Eliminar esta orden? Solo se pueden eliminar órdenes pendientes.")) return;
    try {
      const res = await fetch(`${API_FABRICACION}/${id_orden}`, {
        method: "DELETE",
        headers: API_HEADERS(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar orden.");
      setMensaje("Orden eliminada correctamente.");
      await cargarOrdenes();
    } catch (err) {
      setError(err.message);
    }
  };

  const ordenesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return ordenes.filter(o => {
      const coincideEstado = !filtroEstado || o.estado === filtroEstado;
      const coincideTexto =
        o.codigo?.toLowerCase().includes(texto) ||
        o.producto_nombre?.toLowerCase().includes(texto);
      return coincideEstado && coincideTexto;
    });
  }, [ordenes, filtroEstado, busqueda]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Pendiente": return styles["status-pending"];
      case "En Proceso": return styles["status-progress"];
      case "Completada": return styles["status-complete"];
      case "Cancelada": return styles["status-cancelled"];
      default: return "";
    }
  };

  return (
    <div className={styles["page"]}>
      <section className={styles["hero"]}>
        <div>
          <span className={styles["hero-badge"]}>Modulo de fabricacion</span>
          <h1>Ordenes de Fabricacion</h1>
          <p>
            Crea y gestiona ordenes de produccion. Cada orden consume insumos
            del inventario y aumenta el stock del producto terminado.
          </p>
        </div>
        <button onClick={nuevaOrden} className={styles["btn-hero"]}>
          + Nueva orden
        </button>
      </section>

      {vistaActual === "lista" && (
        <>
          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Ordenes de fabricacion</h2>
                <p>Historial de ordenes generadas y su estado actual.</p>
              </div>
              <div className={styles["filters-row"]}>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles["search-box"]}>
                  <option value="">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
                <div className={styles["search-box"]}>
                  <span>&#8981;</span>
                  <input type="text" placeholder="Buscar por codigo o producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
              </div>
            </div>

            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesFiltradas.map(o => (
                    <tr key={o.id_orden}>
                      <td><strong>{o.codigo}</strong></td>
                      <td>{o.producto_nombre}</td>
                      <td>{Number(o.cantidad).toFixed(2)}</td>
                      <td>
                        <span className={`${styles["status-pill"]} ${getEstadoColor(o.estado)}`}>
                          {o.estado}
                        </span>
                      </td>
                      <td>{new Date(o.fecha_registro).toLocaleDateString("es-CO")}</td>
                      <td>
                        <div className={styles["action-row"]}>
                          <button onClick={() => abrirDetalle(o)} className={styles["btn-table"]}>Ver</button>
                          {o.estado === "Pendiente" && (
                            <>
                              <button onClick={() => cambiarEstado(o.id_orden, "En Proceso")} className={styles["btn-start"]}>Iniciar</button>
                              <button onClick={() => eliminarOrden(o.id_orden)} className={styles["btn-delete-small"]}>Eliminar</button>
                            </>
                          )}
                          {o.estado === "En Proceso" && (
                            <button onClick={() => cambiarEstado(o.id_orden, "Completada")} className={styles["btn-complete"]}>Completar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!cargando && ordenesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="6" className={styles["empty"]}>
                        No hay ordenes de fabricacion registradas.
                      </td>
                    </tr>
                  )}
                  {cargando && (
                    <tr>
                      <td colSpan="6" className={styles["empty"]}>Cargando...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {vistaActual === "detalle" && orden && (
        <>
          <button onClick={volverLista} className={styles["back-btn"]}>
            &larr; Volver a ordenes
          </button>

          <section className={styles["detail-hero"]}>
            <div className={styles["detail-title"]}>
              <div className={styles["big-icon"]}>OF</div>
              <div>
                <span>Orden de Fabricacion</span>
                <h1>{orden.orden.codigo}</h1>
                <p>{orden.orden.producto_nombre} &middot; {Number(orden.orden.cantidad).toFixed(2)} unidades</p>
              </div>
            </div>
            <div className={styles["detail-actions"]}>
              {orden.orden.estado === "Pendiente" && (
                <>
                  <button onClick={() => cambiarEstado(orden.orden.id_orden, "En Proceso")} className={styles["btn-start"]}>Iniciar Produccion</button>
                  <button onClick={() => cambiarEstado(orden.orden.id_orden, "Cancelada")} className={styles["btn-cancel"]}>Cancelar</button>
                </>
              )}
              {orden.orden.estado === "En Proceso" && (
                <button onClick={() => cambiarEstado(orden.orden.id_orden, "Completada")} className={styles["btn-complete"]}>Marcar Completada</button>
              )}
            </div>
          </section>

          <section className={styles["summary-grid"]}>
            <article className={styles["summary-card"]}>
              <span>Estado</span>
              <strong className={getEstadoColor(orden.orden.estado)}>{orden.orden.estado}</strong>
              <small>Estado actual de la orden</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Cantidad</span>
              <strong>{Number(orden.orden.cantidad).toFixed(2)}</strong>
              <small>Unidades a producir</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Insumos</span>
              <strong>{orden.detalle?.length || 0}</strong>
              <small>Requeridos para esta orden</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Stock Producto</span>
              <strong>{Number(orden.orden.producto_stock || 0).toFixed(2)}</strong>
              <small>Stock actual del producto</small>
            </article>
          </section>

          <section className={styles["card"]}>
            <div className={styles["card-header"]}>
              <div>
                <h2>Insumos requeridos</h2>
                <p>Lista de materias primas e insumos necesarios para completar esta orden de fabricacion.</p>
              </div>
            </div>
            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Cantidad Requerida</th>
                    <th>Cantidad Utilizada</th>
                    <th>Costo Unitario</th>
                    <th>Stock Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {orden.detalle?.map(d => (
                    <tr key={d.id_detalle}>
                      <td><strong>{d.insumo_nombre}</strong></td>
                      <td>{Number(d.cantidad_req).toFixed(3)} {d.unidad_medida}</td>
                      <td>{Number(d.cantidad_utilizada || 0).toFixed(3)} {d.unidad_medida}</td>
                      <td>{formatoMoneda(d.costo_unitario)}</td>
                      <td>
                        <span className={Number(d.stock_actual || 0) <= 0 ? styles["text-danger"] : ""}>
                          {Number(d.stock_actual || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!orden.detalle || orden.detalle.length === 0) && (
                    <tr><td colSpan="5" className={styles["empty"]}>Sin insumos asociados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {orden.orden.observacion && (
            <section className={styles["card"]}>
              <div className={styles["card-header"]}>
                <h2>Observacion</h2>
              </div>
              <p className={styles["observation-text"]}>{orden.orden.observacion}</p>
            </section>
          )}
        </>
      )}

      {mostrarModalOrden && (
        <div className={styles["modal-overlay"]} onClick={() => setMostrarModalOrden(false)}>
          <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>Nueva Orden de Fabricacion</h3>
                <p>Selecciona el producto a fabricar y la cantidad.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setMostrarModalOrden(false)}>&times;</button>
            </div>
            <form onSubmit={crearOrden}>
              <div className={styles["form-grid"]}>
                <div className={styles["field-full"]}>
                  <label>Producto (Tipo Fabricado)</label>
                  <select name="id_producto" value={ordenForm.id_producto} onChange={handleOrdenChange}>
                    <option value="">Seleccionar producto...</option>
                    {productosFabricados.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre} (Stock: {Number(p.stock || 0).toFixed(2)} | Costos: {p.costos_count || 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Cantidad a producir</label>
                  <input type="number" name="cantidad" min="0.001" step="0.001" value={ordenForm.cantidad} onChange={handleOrdenChange} placeholder="1" />
                </div>
                <div className={styles["field-full"]}>
                  <label>Observacion (opcional)</label>
                  <textarea name="observacion" value={ordenForm.observacion} onChange={handleOrdenChange} placeholder="Notas o instrucciones para esta orden..." maxLength="500" />
                </div>
              </div>
              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setMostrarModalOrden(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}