"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/proveedor.module.css";
import { useNotification } from "../../../context/NotificationContext";

import { API_PROVEEDOR, API_PRODUCTO, getHeaders } from "@/utils/api";

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
  id_categoria_insumo: "",
  id_tipo_producto: "",
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
  const [categoriasInsumo, setCategoriasInsumo] = useState([]);
  const [categoriasProducto, setCategoriasProducto] = useState([]);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState(""); // Filtro para lista de proveedores
  const [filtroEst, setFiltroEst] = useState("1"); // Filtro de estado para proveedores
  const [busquedaInsumo, setBusquedaInsumo] = useState(""); // Filtro para tabla de inventario de insumos
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
  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
    cargarProveedores();
    cargarCategoriasInsumo();
    cargarCategoriasProducto();
  }, []);

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(valor || 0));
  };

  // ============================================================
  // FILTROS: Lista de proveedores
  // Filtra por nombre, nit, correo o telefono + estado activo/inactivo
  // ============================================================
  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return lista.filter((p) => {
      const coincideEst = filtroEst !== "" ? Number(p.estado) === Number(filtroEst) : true;
      return coincideEst && (
        p.nombre?.toLowerCase().includes(texto) ||
        p.nit?.toLowerCase().includes(texto) ||
        p.correo?.toLowerCase().includes(texto) ||
        p.telefono?.toLowerCase().includes(texto)
      );
    });
  }, [lista, busqueda, filtroEst]);

  // ============================================================
  // FILTRO: Inventario de insumos del proveedor seleccionado
  // Filtra por ID o nombre del insumo
  // ============================================================
  const insumosFiltrados = useMemo(() => {
    if (!busquedaInsumo.trim()) return insumos;
    const texto = busquedaInsumo.toLowerCase();
    return insumos.filter((i) =>
      String(i.id_insumo).toLowerCase().includes(texto) ||
      i.nombre?.toLowerCase().includes(texto)
    );
  }, [insumos, busquedaInsumo]);

  // ============================================================
  // ESTADISTICAS: Totales del inventario de insumos
  // ============================================================
  const totalInsumos = insumos.length;

  const valorInventario = insumos.reduce((total, item) => {
    return total + Number(item.stock_actual || 0) * Number(item.costo_unitario || 0);
  }, 0);

  const insumosBajoStock = insumos.filter((item) => {
    return Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0);
  }).length;

  // ============================================================
  // FUNCIONES DE CARGA DE DATOS DESDE LA API
  // ============================================================

  // Carga la lista completa de proveedores
  const cargarProveedores = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(API_PROVEEDOR, { headers: getHeaders() });
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

  // Carga las categorias de insumos (para el formulario de registro de insumos)
  const cargarCategoriasInsumo = async () => {
    try {
      const res = await fetch(`${API_PROVEEDOR}/insumos/categorias`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar categorias.");
      setCategoriasInsumo(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Carga las categorias de productos (para el formulario de registro de insumos)
  const cargarCategoriasProducto = async () => {
    try {
      const res = await fetch(`${API_PRODUCTO}/categorias`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar categorias producto.");
      setCategoriasProducto(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Carga el detalle de un proveedor + sus insumos y movimientos (llamado al abrir detalle)
  const cargarDetalleProveedor = async (idProveedor) => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(`${API_PROVEEDOR}/${idProveedor}`, { headers: getHeaders() });
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

  // ============================================================
  // NAVEGACION: Abre el detalle de un proveedor seleccionado
  // Resetea filtros de inventario al entrar
  // ============================================================
  const abrirDetalle = async (p) => {
    setMensaje("");
    setError("");
    setModoEdicion(false);
    setBusquedaInsumo(""); // Limpia filtro de insumos al abrir detalle
    setVistaActual("detalle");
    await cargarDetalleProveedor(p.id_proveedor);
  };

  // Abre el modal para registrar un nuevo proveedor
  const nuevoProveedor = () => {
    setProveedor(proveedorInicial);
    setInsumos([]);
    setMovimientos([]);
    setInsumoForm(insumoInicial);
    setEntradaForm(entradaInicial);
    setModoEdicion(true);
    setMensaje("");
    setError("");
    setMostrarModalProveedor(true);
  };

  // Abre el modal en modo edicion para modificar el proveedor actual
  const abrirEdicionProveedor = async () => {
    setModoEdicion(true);
    setMostrarModalProveedor(true);
  };

  // ============================================================
  // NAVEGACION: Vuelve a la lista de proveedores desde el detalle
  // Resetea todos los formularios y filtros
  // ============================================================
  const volverLista = () => {
    setProveedor(proveedorInicial);
    setInsumos([]);
    setMovimientos([]);
    setInsumoForm(insumoInicial);
    setEntradaForm(entradaInicial);
    setModoEdicion(false);
    setBusquedaInsumo(""); // Limpia filtro de insumos
    setVistaActual("lista");
    cargarProveedores();
  };

  // ============================================================
  // HANDLERS: Cambios en formularios
  // ============================================================

  // Handler generico para el formulario del proveedor (modal)
  const handleProveedorChange = (e) => {
    const { name, value } = e.target;

    setProveedor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler para el formulario de registro de nuevo insumo
  const handleInsumoChange = (e) => {
    const { name, value } = e.target;

    setInsumoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler para el formulario de entrada de inventario (compra de insumos)
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
          headers: getHeaders(),
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

      setMostrarModalProveedor(false);
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

  // Registra un nuevo insumo asociado al proveedor actual
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
        headers: getHeaders(),
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

  // Registra una entrada de inventario (compra/aumento de stock de un insumo)
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
          headers: getHeaders(),
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

  // ============================================================
  // ACCIONES: Insumos
  // ============================================================

  // Desactiva (elimina logicamente) un insumo del proveedor
  const eliminarInsumo = async (idInsumo) => {
    try {
      setMensaje("");
      setError("");

      const response = await fetch(`${API_PROVEEDOR}/insumos/${idInsumo}`, {
        method: "DELETE",
        headers: getHeaders(),
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

  // Confirma la desactivacion del proveedor actual (modal de confirmacion)
  const confirmarDesactivacion = async () => {
    try {
      setMensaje("");
      setError("");
      const response = await fetch(`${API_PROVEEDOR}/${proveedor.id_proveedor}`, { method: "DELETE", headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al desactivar proveedor.");
      setMostrarModalConfirmacion(false);
      setMensaje(data?.message || "Proveedor desactivado correctamente.");
      volverLista();
    } catch (err) {
      setError(err.message);
      setMostrarModalConfirmacion(false);
    }
  };

  // Reactiva un proveedor previamente desactivado
  const activarProveedor = async () => {
    try {
      setMensaje("");
      setError("");
      const response = await fetch(`${API_PROVEEDOR}/activar/${proveedor.id_proveedor}`, { method: "PUT", headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al activar proveedor.");
      setMensaje("Proveedor activado correctamente.");
      await cargarDetalleProveedor(proveedor.id_proveedor);
      cargarProveedores();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles["page"]}>
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

      {/* ============================================================ */}
      {/* VISTA: Lista de proveedores */}
      {/* Muestra tabla con todos los proveedores y filtros de busqueda */}
      {/* ============================================================ */}
      {vistaActual === "lista" && (
        <>
          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Proveedores registrados</h2>
                <p>Consulta proveedores, insumos asociados y valor actual del inventario.</p>
              </div>
              <select value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)} className={styles["search-box"]}>
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Desactivados</option>
              </select>
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

      {/* ============================================================ */}
      {/* VISTA: Detalle del proveedor seleccionado */}
      {/* Muestra info del proveedor + formularios + inventario + movimientos */}
      {/* ============================================================ */}
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
              {proveedor.id_proveedor && (
                <>
                  <button
                    type="button"
                    onClick={abrirEdicionProveedor}
                    className={styles["btn-secondary"]}
                  >
                    Editar proveedor
                  </button>

                  {Number(proveedor.estado) === 0 ? (
                    <button type="button" onClick={activarProveedor} className={styles["btn-table"]}>Activar</button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMostrarModalConfirmacion(true)}
                      className={styles["btn-danger"]}
                    >
                      Desactivar
                    </button>
                  )}
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

          {/* Seccion: Informacion del proveedor (datos generales) */}
          <section className={styles["content-grid"]}>
            <div className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Información del proveedor</h2>
                  <p>Datos principales del proveedor y contacto comercial.</p>
                </div>
              </div>

              <div className={styles["detail-info"]}>
                <div className={styles["detail-info-grid"]}>
                  <div>
                    <label>Nombre</label>
                    <span>{proveedor.nombre || "—"}</span>
                  </div>
                  <div>
                    <label>NIT / Documento</label>
                    <span>{proveedor.nit || "—"}</span>
                  </div>
                  <div>
                    <label>Teléfono</label>
                    <span>{proveedor.telefono || "—"}</span>
                  </div>
                  <div>
                    <label>Correo</label>
                    <span>{proveedor.correo || "—"}</span>
                  </div>
                  <div>
                    <label>Contacto</label>
                    <span>{proveedor.contacto || "—"}</span>
                  </div>
                  <div>
                    <label>Dirección</label>
                    <span>{proveedor.direccion || "—"}</span>
                  </div>
                </div>
                {proveedor.observacion && (
                  <div className={styles["detail-info-full"]}>
                    <label>Observación</label>
                    <p>{proveedor.observacion}</p>
                  </div>
                )}
              </div>
            </div>

          {/* Seccion: Registrar insumo (formulario para crear nuevo insumo del proveedor) */}
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
                    maxLength="255"
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
                    min="0.01"
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
                    step="0.01"
                    min="0"
                    name="stock_actual"
                    value={insumoForm.stock_actual}
                    onChange={handleInsumoChange}
                  />
                </div>
                <div>
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="stock_minimo"
                    value={insumoForm.stock_minimo}
                    onChange={handleInsumoChange}
                    placeholder="0"
                  />
                </div>

<div className={styles["field-full"]}>
                  <label>Descripcion</label>
                  <input
                    type="text"
                    name="descripcion"
                    value={insumoForm.descripcion}
                    onChange={handleInsumoChange}
                    placeholder="Descripcion opcional"
                    maxLength="500"
                  />
                </div>

                <div>
                  <label>Categoria de Insumo</label>
                  <select name="id_categoria_insumo" value={insumoForm.id_categoria_insumo} onChange={handleInsumoChange}>
                    <option value="">Sin categoria</option>
                    {categoriasInsumo.map(c => (
                      <option key={c.id_categoria_insumo} value={c.id_categoria_insumo}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Usar en producto tipo</label>
                  <select name="id_tipo_producto" value={insumoForm.id_tipo_producto} onChange={handleInsumoChange}>
                    <option value="">Todos los tipos</option>
                    {categoriasProducto.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className={styles["btn-primary"]}>
                  + Agregar insumo
                </button>
              </form>
            </section>
          </section>

          {/* Seccion: Inventario del proveedor (tabla de insumos + buscador) */}
          <section className={styles["content-grid"]}>
            <section className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Inventario del proveedor</h2>
                  <p>Insumos disponibles para fabricar productos o registrar costos.</p>
                </div>
              </div>

              {/* Barra de busqueda para filtrar insumos por ID o nombre */}
              <div style={{ padding: "0 1.1rem 0.75rem" }}>
                <input
                  type="text"
                  placeholder="Buscar por ID o nombre del insumo..."
                  value={busquedaInsumo}
                  onChange={(e) => setBusquedaInsumo(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "10px", fontSize: "0.875rem" }}
                />
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
                    {insumosFiltrados.map((item) => {
                      const bajoStock =
                        Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0);

                      return (
                        <tr key={item.id_insumo}>
                          <td>
                            <strong>{item.nombre}</strong>
                            {item.descripcion && <span>{item.descripcion}</span>}
                          </td>
                          <td>{item.unidad_medida}</td>
                          <td>{Number(item.stock_actual || 0).toFixed(2)}</td>
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

                    {insumosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="7" className={styles["empty"]}>
                          {insumos.length === 0
                            ? "Este proveedor todavía no tiene insumos registrados."
                            : "Ningun insumo coincide con los filtros aplicados."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Seccion: Entrada de inventario (formulario para comprar insumos) */}
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
                  <select name="id_insumo" value={entradaForm.id_insumo} onChange={handleEntradaChange}>
                    <option value="">Seleccionar insumo</option>
                    {insumos.map(item => (
                      <option key={item.id_insumo} value={item.id_insumo}>{item.nombre} - Stock: {Number(item.stock_actual || 0).toFixed(2)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
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
                    min="0.01"
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
                    placeholder="Motivo de la entrada"
                    maxLength="500"
                  />
                </div>

                <button type="submit" className={styles["btn-primary"]}>
                  Registrar entrada
                </button>
              </form>
            </section>
          </section>

          {/* Seccion: Historial de movimientos (tabla de entradas/salidas de inventario) */}
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

      {/* ============================================================ */}
      {/* MODAL: Registrar / Editar proveedor */}
      {/* ============================================================ */}
      {mostrarModalProveedor && (
        <div className={styles["modal-overlay"]} onClick={() => setMostrarModalProveedor(false)}>
          <div className={`${styles.modal} ${styles["modal-large"]}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>{modoEdicion && proveedor.id_proveedor ? "Editar proveedor" : "Nuevo proveedor"}</h3>
                <p>Registra los datos principales del proveedor.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setMostrarModalProveedor(false)}>×</button>
            </div>

            <form onSubmit={guardarProveedor}>
              <div className={styles["modal-form-grid"]}>
                <div className={styles["field-full"]}>
                  <label>Nombre del proveedor</label>
                  <input type="text" name="nombre" value={proveedor.nombre || ""} onChange={handleProveedorChange} placeholder="Ej: Dyna, HarinaPan, Proveedor Central..." maxLength="255" />
                </div>
                <div>
                  <label>NIT / Documento</label>
                  <input type="text" name="nit" value={proveedor.nit || ""} onChange={handleProveedorChange} placeholder="NIT" maxLength="50" />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input type="tel" name="telefono" value={proveedor.telefono || ""} onChange={handleProveedorChange} placeholder="Teléfono" pattern="[\d\s+\-()]{7,20}" title="Ingresa un número de teléfono válido (7-20 dígitos)" maxLength="20" />
                </div>
                <div>
                  <label>Correo</label>
                  <input type="email" name="correo" value={proveedor.correo || ""} onChange={handleProveedorChange} placeholder="correo@empresa.com" maxLength="255" />
                </div>
                <div>
                  <label>Contacto</label>
                  <input type="text" name="contacto" value={proveedor.contacto || ""} onChange={handleProveedorChange} placeholder="Persona de contacto" maxLength="255" />
                </div>
                <div className={styles["field-full"]}>
                  <label>Dirección</label>
                  <input type="text" name="direccion" value={proveedor.direccion || ""} onChange={handleProveedorChange} placeholder="Dirección del proveedor" maxLength="255" />
                </div>
                <div className={styles["field-full"]}>
                  <label>Observación</label>
                  <textarea name="observacion" value={proveedor.observacion || ""} onChange={handleProveedorChange} placeholder="Información adicional del proveedor..." maxLength="2000" />
                </div>
              </div>

              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setMostrarModalProveedor(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>
                  {modoEdicion && proveedor.id_proveedor ? "Actualizar proveedor" : "Registrar proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Confirmar desactivacion de proveedor */}
      {/* ============================================================ */}
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