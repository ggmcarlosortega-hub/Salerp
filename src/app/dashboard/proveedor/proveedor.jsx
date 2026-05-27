"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/proveedor.module.css";

const API_PROVEEDOR = "http://localhost:3001/api/proveedor";

const proveedorInicial = {
  id_proveedor: "",
  nombre: "",
  nit: "",
  telefono: "",
  correo: "",
  direccion: "",
  contacto: "",
  observacion: "",
};

const insumoInicial = {
  nombre: "",
  descripcion: "",
  unidad_medida: "Unidad",
  costo_unitario: "",
  stock_actual: 0,
  stock_minimo: 0,
};

const entradaInicial = {
  id_insumo: "",
  cantidad: "",
  costo_unitario: "",
  observacion: "",
};

export default function GestionProveedores() {
  const [lista, setLista] = useState([]);
  const [vistaActual, setVistaActual] = useState("lista");

  const [proveedor, setProveedor] = useState(proveedorInicial);
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [insumoForm, setInsumoForm] = useState(insumoInicial);
  const [entradaForm, setEntradaForm] = useState(entradaInicial);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(valor || 0));
  };

  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return lista.filter((p) => {
      return (
        p.nombre?.toLowerCase().includes(texto) ||
        p.nit?.toLowerCase().includes(texto) ||
        p.correo?.toLowerCase().includes(texto) ||
        p.telefono?.toLowerCase().includes(texto)
      );
    });
  }, [lista, busqueda]);

  const totalInsumos = insumos.length;

  const valorInventario = insumos.reduce((total, item) => {
    return total + Number(item.stock_actual || 0) * Number(item.costo_unitario || 0);
  }, 0);

  const insumosBajoStock = insumos.filter((item) => {
    return Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0);
  }).length;

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(API_PROVEEDOR);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar proveedores.");
      }

      setLista(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarDetalleProveedor = async (idProveedor) => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(`${API_PROVEEDOR}/${idProveedor}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar proveedor.");
      }

      setProveedor(data.proveedor);
      setInsumos(data.insumos || []);
      setMovimientos(data.movimientos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const abrirDetalle = async (p) => {
    setMensaje("");
    setError("");
    setModoEdicion(false);
    setVistaActual("detalle");
    await cargarDetalleProveedor(p.id_proveedor);
  };

  const nuevoProveedor = () => {
    setProveedor(proveedorInicial);
    setInsumos([]);
    setMovimientos([]);
    setInsumoForm(insumoInicial);
    setEntradaForm(entradaInicial);
    setModoEdicion(true);
    setMensaje("");
    setError("");
    setVistaActual("detalle");
  };

  const volverLista = () => {
    setProveedor(proveedorInicial);
    setInsumos([]);
    setMovimientos([]);
    setInsumoForm(insumoInicial);
    setEntradaForm(entradaInicial);
    setModoEdicion(false);
    setVistaActual("lista");
    cargarProveedores();
  };

  const handleProveedorChange = (e) => {
    const { name, value } = e.target;

    setProveedor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInsumoChange = (e) => {
    const { name, value } = e.target;

    setInsumoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEntradaChange = (e) => {
    const { name, value } = e.target;

    setEntradaForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!proveedor.nombre.trim()) {
      setError("El nombre del proveedor es obligatorio.");
      return;
    }

    try {
      const esEdicion = Boolean(proveedor.id_proveedor);

      const response = await fetch(
        esEdicion ? `${API_PROVEEDOR}/${proveedor.id_proveedor}` : API_PROVEEDOR,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proveedor),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar proveedor.");
      }

      setMensaje(
        esEdicion
          ? "Proveedor actualizado correctamente."
          : "Proveedor registrado correctamente."
      );

      setModoEdicion(false);

      if (esEdicion) {
        await cargarDetalleProveedor(proveedor.id_proveedor);
      } else {
        await cargarDetalleProveedor(data.id_proveedor);
      }

      cargarProveedores();
    } catch (err) {
      setError(err.message);
    }
  };

  const agregarInsumo = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!proveedor.id_proveedor) {
      setError("Primero debes guardar el proveedor para registrar insumos.");
      return;
    }

    if (!insumoForm.nombre.trim()) {
      setError("El nombre del insumo es obligatorio.");
      return;
    }

    if (!insumoForm.unidad_medida.trim()) {
      setError("La unidad de medida es obligatoria.");
      return;
    }

    try {
      const response = await fetch(`${API_PROVEEDOR}/${proveedor.id_proveedor}/insumos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insumoForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar insumo.");
      }

      setMensaje("Insumo registrado correctamente.");
      setInsumoForm(insumoInicial);

      await cargarDetalleProveedor(proveedor.id_proveedor);
      cargarProveedores();
    } catch (err) {
      setError(err.message);
    }
  };

  const registrarEntrada = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!entradaForm.id_insumo) {
      setError("Debes seleccionar un insumo.");
      return;
    }

    if (!entradaForm.cantidad || Number(entradaForm.cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    if (!entradaForm.costo_unitario || Number(entradaForm.costo_unitario) <= 0) {
      setError("El costo unitario debe ser mayor a cero.");
      return;
    }

    try {
      const response = await fetch(
        `${API_PROVEEDOR}/insumos/${entradaForm.id_insumo}/entrada`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entradaForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar entrada.");
      }

      setMensaje("Entrada de inventario registrada correctamente.");
      setEntradaForm(entradaInicial);

      await cargarDetalleProveedor(proveedor.id_proveedor);
      cargarProveedores();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarInsumo = async (idInsumo) => {
    try {
      setMensaje("");
      setError("");

      const response = await fetch(`${API_PROVEEDOR}/insumos/${idInsumo}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al desactivar insumo.");
      }

      setMensaje("Insumo desactivado correctamente.");

      await cargarDetalleProveedor(proveedor.id_proveedor);
      cargarProveedores();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmarDesactivacion = async () => {
    try {
      setMensaje("");
      setError("");

      const response = await fetch(`${API_PROVEEDOR}/${proveedor.id_proveedor}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al desactivar proveedor.");
      }

      setMostrarModalConfirmacion(false);
      volverLista();
    } catch (err) {
      setError(err.message);
      setMostrarModalConfirmacion(false);
    }
  };

  return (
    <div className={styles["page"]}>
      {mensaje && <div className={styles["alerta-exito"]}>{mensaje}</div>}
      {error && <div className={styles["alerta-error"]}>{error}</div>}

      {vistaActual === "lista" && (
        <>
          <section className={styles["hero"]}>
            <div>
              <span className={styles["hero-badge"]}>Inventario por proveedores</span>
              <h1>Gestión de proveedores</h1>
              <p>
                Administra proveedores, insumos, materias primas, stock disponible y
                movimientos de inventario para alimentar los costos de fabricación.
              </p>
            </div>

            <button onClick={nuevoProveedor} className={styles["btn-hero"]}>
              + Nuevo proveedor
            </button>
          </section>

          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Proveedores registrados</h2>
                <p>Consulta proveedores, insumos asociados y valor actual del inventario.</p>
              </div>

              <div className={styles["search-box"]}>
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Buscar proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>NIT / Documento</th>
                    <th>Contacto</th>
                    <th>Insumos</th>
                    <th>Inventario</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {proveedoresFiltrados.map((p) => (
                    <tr key={p.id_proveedor} onClick={() => abrirDetalle(p)}>
                      <td>
                        <div className={styles["supplier-cell"]}>
                          <div className={styles["supplier-icon"]}>
                            {p.nombre?.charAt(0)?.toUpperCase() || "P"}
                          </div>

                          <div>
                            <strong>{p.nombre}</strong>
                            <span>{p.correo || "Sin correo registrado"}</span>
                          </div>
                        </div>
                      </td>

                      <td>{p.nit || "No registrado"}</td>
                      <td>{p.telefono || "No registrado"}</td>
                      <td>
                        <span className={styles["pill-blue"]}>
                          {p.total_insumos || 0} insumos
                        </span>
                      </td>
                      <td>{formatoMoneda(p.valor_inventario)}</td>

                      <td>
                        <button
                          className={styles["btn-table"]}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalle(p);
                          }}
                        >
                          Ver inventario
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!cargando && proveedoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="6" className={styles["empty"]}>
                        No hay proveedores registrados.
                      </td>
                    </tr>
                  )}

                  {cargando && (
                    <tr>
                      <td colSpan="6" className={styles["empty"]}>
                        Cargando proveedores...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {vistaActual === "detalle" && (
        <>
          <button onClick={volverLista} className={styles["back-btn"]}>
            ← Volver a proveedores
          </button>

          <section className={styles["detail-hero"]}>
            <div className={styles["detail-title"]}>
              <div className={styles["big-icon"]}>
                {proveedor.nombre?.charAt(0)?.toUpperCase() || "P"}
              </div>

              <div>
                <span>Proveedor</span>
                <h1>{proveedor.nombre || "Nuevo proveedor"}</h1>
                <p>
                  {proveedor.nit || "Sin NIT"} · {proveedor.telefono || "Sin teléfono"}
                </p>
              </div>
            </div>

            <div className={styles["detail-actions"]}>
              {proveedor.id_proveedor && !modoEdicion && (
                <>
                  <button
                    type="button"
                    onClick={() => setModoEdicion(true)}
                    className={styles["btn-secondary"]}
                  >
                    Editar proveedor
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarModalConfirmacion(true)}
                    className={styles["btn-danger"]}
                  >
                    Desactivar
                  </button>
                </>
              )}
            </div>
          </section>

          <section className={styles["summary-grid"]}>
            <article className={styles["summary-card"]}>
              <span>Total insumos</span>
              <strong>{totalInsumos}</strong>
              <small>Productos asociados al proveedor</small>
            </article>

            <article className={styles["summary-card"]}>
              <span>Valor inventario</span>
              <strong>{formatoMoneda(valorInventario)}</strong>
              <small>Stock actual valorizado</small>
            </article>

            <article className={styles["summary-card"]}>
              <span>Bajo stock</span>
              <strong>{insumosBajoStock}</strong>
              <small>Insumos en nivel mínimo o inferior</small>
            </article>

            <article className={styles["summary-card"]}>
              <span>Movimientos</span>
              <strong>{movimientos.length}</strong>
              <small>Últimos registros de inventario</small>
            </article>
          </section>

          <section className={styles["content-grid"]}>
            <form onSubmit={guardarProveedor} className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Información del proveedor</h2>
                  <p>Datos principales del proveedor y contacto comercial.</p>
                </div>
              </div>

              <div className={styles["form-grid"]}>
                <div className={styles["field-large"]}>
                  <label>Nombre del proveedor</label>
                  <input
                    type="text"
                    name="nombre"
                    value={proveedor.nombre || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="Ej: Dyna, HarinaPan, Proveedor Central..."
                  />
                </div>

                <div>
                  <label>NIT / Documento</label>
                  <input
                    type="text"
                    name="nit"
                    value={proveedor.nit || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="NIT"
                  />
                </div>

                <div>
                  <label>Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={proveedor.telefono || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="Teléfono"
                  />
                </div>

                <div>
                  <label>Correo</label>
                  <input
                    type="email"
                    name="correo"
                    value={proveedor.correo || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="correo@empresa.com"
                  />
                </div>

                <div>
                  <label>Contacto</label>
                  <input
                    type="text"
                    name="contacto"
                    value={proveedor.contacto || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="Persona de contacto"
                  />
                </div>

                <div className={styles["field-full"]}>
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={proveedor.direccion || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="Dirección del proveedor"
                  />
                </div>

                <div className={styles["field-full"]}>
                  <label>Observación</label>
                  <textarea
                    name="observacion"
                    value={proveedor.observacion || ""}
                    onChange={handleProveedorChange}
                    disabled={!modoEdicion}
                    placeholder="Información adicional del proveedor..."
                  />
                </div>
              </div>

              {modoEdicion && (
                <div className={styles["form-actions"]}>
                  <button type="submit" className={styles["btn-primary"]}>
                    Guardar proveedor
                  </button>

                  {proveedor.id_proveedor && (
                    <button
                      type="button"
                      onClick={() => setModoEdicion(false)}
                      className={styles["btn-light"]}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </form>

            <section className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Registrar insumo</h2>
                  <p>Crea materias primas o productos comprados a este proveedor.</p>
                </div>
              </div>

              <form onSubmit={agregarInsumo} className={styles["side-form"]}>
                <div className={styles["field-full"]}>
                  <label>Nombre del insumo</label>
                  <input
                    type="text"
                    name="nombre"
                    value={insumoForm.nombre}
                    onChange={handleInsumoChange}
                    placeholder="Ej: Pegante PU, harina, tornillos..."
                  />
                </div>

                <div>
                  <label>Unidad</label>
                  <select
                    name="unidad_medida"
                    value={insumoForm.unidad_medida}
                    onChange={handleInsumoChange}
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Gramo">Gramo</option>
                    <option value="Kilogramo">Kilogramo</option>
                    <option value="Metro">Metro</option>
                    <option value="Litro">Litro</option>
                    <option value="Caja">Caja</option>
                  </select>
                </div>

                <div>
                  <label>Costo unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costo_unitario"
                    value={insumoForm.costo_unitario}
                    onChange={handleInsumoChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label>Stock inicial</label>
                  <input
                    type="number"
                    step="0.001"
                    name="stock_actual"
                    value={insumoForm.stock_actual}
                    onChange={handleInsumoChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label>Stock mínimo</label>
                  <input
                    type="number"
                    step="0.001"
                    name="stock_minimo"
                    value={insumoForm.stock_minimo}
                    onChange={handleInsumoChange}
                    placeholder="0"
                  />
                </div>

                <div className={styles["field-full"]}>
                  <label>Descripción</label>
                  <input
                    type="text"
                    name="descripcion"
                    value={insumoForm.descripcion}
                    onChange={handleInsumoChange}
                    placeholder="Descripción opcional"
                  />
                </div>

                <button type="submit" className={styles["btn-primary"]}>
                  + Agregar insumo
                </button>
              </form>
            </section>
          </section>

          <section className={styles["content-grid"]}>
            <section className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Inventario del proveedor</h2>
                  <p>Insumos disponibles para fabricar productos o registrar costos.</p>
                </div>
              </div>

              <div className={styles["table-wrap"]}>
                <table className={styles["table"]}>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Unidad</th>
                      <th>Stock</th>
                      <th>Costo</th>
                      <th>Valor</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {insumos.map((item) => {
                      const bajoStock =
                        Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0);

                      return (
                        <tr key={item.id_insumo}>
                          <td>
                            <strong>{item.nombre}</strong>
                            {item.descripcion && <span>{item.descripcion}</span>}
                          </td>
                          <td>{item.unidad_medida}</td>
                          <td>{Number(item.stock_actual || 0).toFixed(3)}</td>
                          <td>{formatoMoneda(item.costo_unitario)}</td>
                          <td>
                            {formatoMoneda(
                              Number(item.stock_actual || 0) *
                                Number(item.costo_unitario || 0)
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                bajoStock ? styles["pill-danger"] : styles["pill-success"]
                              }
                            >
                              {bajoStock ? "Bajo stock" : "Disponible"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => eliminarInsumo(item.id_insumo)}
                              className={styles["btn-delete-small"]}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {insumos.length === 0 && (
                      <tr>
                        <td colSpan="7" className={styles["empty"]}>
                          Este proveedor todavía no tiene insumos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Entrada de inventario</h2>
                  <p>Registra compras o aumentos de stock de un insumo.</p>
                </div>
              </div>

              <form onSubmit={registrarEntrada} className={styles["side-form"]}>
                <div className={styles["field-full"]}>
                  <label>Insumo</label>
                  <select
                    name="id_insumo"
                    value={entradaForm.id_insumo}
                    onChange={handleEntradaChange}
                  >
                    <option value="">Seleccionar insumo</option>
                    {insumos.map((item) => (
                      <option key={item.id_insumo} value={item.id_insumo}>
                        {item.nombre} - Stock: {Number(item.stock_actual || 0).toFixed(3)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    step="0.001"
                    name="cantidad"
                    value={entradaForm.cantidad}
                    onChange={handleEntradaChange}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label>Costo unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costo_unitario"
                    value={entradaForm.costo_unitario}
                    onChange={handleEntradaChange}
                    placeholder="0"
                  />
                </div>

                <div className={styles["field-full"]}>
                  <label>Observación</label>
                  <input
                    type="text"
                    name="observacion"
                    value={entradaForm.observacion}
                    onChange={handleEntradaChange}
                    placeholder="Ej: Compra de inventario"
                  />
                </div>

                <button type="submit" className={styles["btn-primary"]}>
                  Registrar entrada
                </button>
              </form>
            </section>
          </section>

          <section className={styles["card"]}>
            <div className={styles["card-header"]}>
              <div>
                <h2>Últimos movimientos</h2>
                <p>Historial de entradas, salidas y ajustes del inventario del proveedor.</p>
              </div>
            </div>

            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Insumo</th>
                    <th>Movimiento</th>
                    <th>Origen</th>
                    <th>Cantidad</th>
                    <th>Costo</th>
                    <th>Observación</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id_movimiento}>
                      <td>{new Date(m.fecha_movimiento).toLocaleDateString()}</td>
                      <td>{m.insumo}</td>
                      <td>
                        <span
                          className={
                            m.tipo_movimiento === "Entrada"
                              ? styles["pill-success"]
                              : styles["pill-danger"]
                          }
                        >
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td>{m.origen}</td>
                      <td>
                        {Number(m.cantidad || 0).toFixed(3)} {m.unidad_medida}
                      </td>
                      <td>{formatoMoneda(m.costo_unitario)}</td>
                      <td>{m.observacion || "Sin observación"}</td>
                    </tr>
                  ))}

                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan="7" className={styles["empty"]}>
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </>
      )}

      {mostrarModalConfirmacion && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <h3>Desactivar proveedor</h3>
            <p>
              ¿Seguro que deseas desactivar <strong>{proveedor.nombre}</strong>?
              El proveedor dejará de aparecer en la lista principal.
            </p>

            <div className={styles["modal-actions"]}>
              <button
                onClick={() => setMostrarModalConfirmacion(false)}
                className={styles["btn-light"]}
              >
                Cancelar
              </button>

              <button onClick={confirmarDesactivacion} className={styles["btn-danger"]}>
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}