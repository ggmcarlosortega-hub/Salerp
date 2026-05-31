"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/compras.module.css";
import { useNotification } from "../../../context/NotificationContext";

const API_BASE = "http://localhost:3001";
const API_COMPRA = `${API_BASE}/api/compra`;
const API_PRODUCTO = `${API_BASE}/api/producto`;
const API_PROVEEDOR = `${API_BASE}/api/proveedor`;

const compraInicial = {
  id_proveedor: "",
  id_producto: "",
  numero_factura: "",
  fecha_compra: new Date().toISOString().split('T')[0],
  cantidad: 1,
  costo_unitario: "",
  forma_pago: "",
  observacion: "",
};

const productoProvInicial = {
  id_proveedor: "",
  id_producto: "",
  precio_compra: "",
  tiempo_entrega: "",
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

export default function GestionCompras() {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [vistaActual, setVistaActual] = useState("lista");
  const [compra, setCompra] = useState(null);
  const [compraForm, setCompraForm] = useState(compraInicial);
  const [productoProvForm, setProductoProvForm] = useState(productoProvInicial);
  const [stockProductoSeleccionado, setStockProductoSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [mostrarModalProductoProv, setMostrarModalProductoProv] = useState(false);
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
    cargarCompras();
    cargarProductos();
    cargarProveedores();
  }, []);

  const formatoMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(valor || 0));

  const cargarCompras = async () => {
    try {
      setCargando(true);
      const res = await fetch(API_COMPRA, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar compras.");
      setCompras(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch(API_PRODUCTO, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar productos.");
      setProductos(data.filter(p => Number(p.estado) === 1));
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarProveedores = async () => {
    try {
      const res = await fetch(API_PROVEEDOR, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar proveedores.");
      setProveedores(data.filter(p => Number(p.estado) === 1));
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarStockProducto = async (id_producto) => {
    try {
      const res = await fetch(`${API_COMPRA}/stock/${id_producto}`, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar stock.");
      setStockProductoSeleccionado(data);
    } catch (err) {
      setStockProductoSeleccionado(null);
    }
  };

  const cargarProductosProveedor = async (id_proveedor) => {
    try {
      const res = await fetch(`${API_COMPRA}/proveedor/${id_proveedor}/productos`, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar productos del proveedor.");
      setProductosProveedor(data);
    } catch (err) {
      setProductosProveedor([]);
    }
  };

  const abrirDetalle = async (c) => {
    try {
      setCargando(true);
      const res = await fetch(`${API_COMPRA}/${c.id_compra}`, { headers: API_HEADERS() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar compra.");
      setCompra(data);
      setVistaActual("detalle");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const volverLista = () => {
    setCompra(null);
    setCompraForm(compraInicial);
    setStockProductoSeleccionado(null);
    setVistaActual("lista");
    cargarCompras();
  };

  const nuevaCompra = () => {
    setCompraForm(compraInicial);
    setStockProductoSeleccionado(null);
    setMostrarModalCompra(true);
  };

  const handleCompraChange = (e) => {
    const { name, value } = e.target;
    setCompraForm(prev => {
      const newForm = { ...prev, [name]: value };
      if (name === 'id_producto' && value) {
        cargarStockProducto(value);
      }
      return newForm;
    });
  };

  const crearCompra = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!compraForm.id_proveedor) {
      setError("Debes seleccionar un proveedor.");
      return;
    }
    if (!compraForm.id_producto) {
      setError("Debes seleccionar un producto.");
      return;
    }
    if (!compraForm.cantidad || Number(compraForm.cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }
    if (!compraForm.costo_unitario || Number(compraForm.costo_unitario) <= 0) {
      setError("El costo unitario debe ser mayor a cero.");
      return;
    }

    try {
      const res = await fetch(API_COMPRA, {
        method: "POST",
        headers: API_HEADERS(),
        body: JSON.stringify(compraForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar compra.");

      setMensaje(`Compra registrada. Stock actualizado a ${data.nuevo_stock?.toFixed(2) || '?'} unidades.`);
      setMostrarModalCompra(false);
      setCompraForm(compraInicial);
      setStockProductoSeleccionado(null);
      await cargarCompras();
      await cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProductoProvChange = (e) => {
    const { name, value } = e.target;
    setProductoProvForm(prev => ({ ...prev, [name]: value }));
  };

  const abrirAgregarProductoProveedor = (id_proveedor) => {
    setProductoProvForm({ ...productoProvInicial, id_proveedor });
    cargarProductosProveedor(id_proveedor);
    setMostrarModalProductoProv(true);
  };

  const agregarProductoProveedor = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!productoProvForm.id_producto) {
      setError("Debes seleccionar un producto.");
      return;
    }

    try {
      const res = await fetch(`${API_COMPRA}/proveedor/producto`, {
        method: "POST",
        headers: API_HEADERS(),
        body: JSON.stringify(productoProvForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al agregar producto.");

      setMensaje("Producto agregado al proveedor.");
      setProductoProvForm(productoProvInicial);
      setMostrarModalProductoProv(false);
      cargarProveedores();
    } catch (err) {
      setError(err.message);
    }
  };

  const comprasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return compras.filter(c => {
      const coincideTexto =
        c.numero_factura?.toLowerCase().includes(texto) ||
        c.producto_nombre?.toLowerCase().includes(texto) ||
        c.proveedor_nombre?.toLowerCase().includes(texto);
      return coincideTexto;
    });
  }, [compras, busqueda]);

  return (
    <div className={styles["page"]}>
      <section className={styles["hero"]}>
        <div>
          <span className={styles["hero-badge"]}>Inventario de productos</span>
          <h1>Compras a Proveedores</h1>
          <p>
            Registra compras de productos terminados a proveedores.
            Cada compra incrementa el stock del producto.
          </p>
        </div>
        <button onClick={nuevaCompra} className={styles["btn-hero"]}>
          + Nueva compra
        </button>
      </section>

      {vistaActual === "lista" && (
        <>
          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Historial de compras</h2>
                <p>Compras de productos terminados a proveedores.</p>
              </div>
              <div className={styles["filters-row"]}>
                <div className={styles["search-box"]}>
                  <span>&#8981;</span>
                  <input type="text" placeholder="Buscar por producto o proveedor..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
              </div>
            </div>

            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Factura</th>
                    <th>Proveedor</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Costo</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {comprasFiltradas.map(c => (
                    <tr key={c.id_compra}>
                      <td>{new Date(c.fecha_compra).toLocaleDateString("es-CO")}</td>
                      <td>{c.numero_factura || "Sin factura"}</td>
                      <td>{c.proveedor_nombre}</td>
                      <td>{c.producto_nombre}</td>
                      <td>{Number(c.cantidad).toFixed(2)}</td>
                      <td>{formatoMoneda(c.costo_unitario)}</td>
                      <td><strong>{formatoMoneda(c.total)}</strong></td>
                      <td>
                        <button onClick={() => abrirDetalle(c)} className={styles["btn-table"]}>Ver</button>
                      </td>
                    </tr>
                  ))}
                  {!cargando && comprasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="8" className={styles["empty"]}>
                        No hay compras registradas.
                      </td>
                    </tr>
                  )}
                  {cargando && (
                    <tr><td colSpan="8" className={styles["empty"]}>Cargando...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Productos disponibles por proveedor</h2>
                <p>Asociar productos que se compran regularmente a cada proveedor.</p>
              </div>
            </div>
            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Productos asociados</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map(p => (
                    <tr key={p.id_proveedor}>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className={styles["pill-blue"]}>{p.total_insumos || 0} insumos</span></td>
                      <td>
                        <button onClick={() => abrirAgregarProductoProveedor(p.id_proveedor)} className={styles["btn-table"]}>
                          + Agregar producto
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {vistaActual === "detalle" && compra && (
        <>
          <button onClick={volverLista} className={styles["back-btn"]}>
            &larr; Volver a compras
          </button>

          <section className={styles["detail-hero"]}>
            <div className={styles["detail-title"]}>
              <div className={styles["big-icon"]}>CP</div>
              <div>
                <span>Compra a Proveedor</span>
                <h1>{compra.numero_factura || "Sin factura"}</h1>
                <p>{compra.proveedor_nombre} &middot; {new Date(compra.fecha_compra).toLocaleDateString("es-CO")}</p>
              </div>
            </div>
          </section>

          <section className={styles["summary-grid"]}>
            <article className={styles["summary-card"]}>
              <span>Producto</span>
              <strong>{compra.producto_nombre}</strong>
              <small>Item comprado</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Cantidad</span>
              <strong>{Number(compra.cantidad).toFixed(2)}</strong>
              <small>Unidades ingresadas</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Costo Unitario</span>
              <strong>{formatoMoneda(compra.costo_unitario)}</strong>
              <small>Precio por unidad</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Total</span>
              <strong>{formatoMoneda(compra.total)}</strong>
              <small>Valor total de la compra</small>
            </article>
          </section>

          <section className={styles["card"]}>
            <div className={styles["card-header"]}>
              <h2>Informacion de la compra</h2>
            </div>
            <div className={styles["info-grid"]}>
              <div><label>Proveedor</label><span>{compra.proveedor_nombre}</span></div>
              <div><label>Numero Factura</label><span>{compra.numero_factura || "Sin factura"}</span></div>
              <div><label>Fecha Compra</label><span>{new Date(compra.fecha_compra).toLocaleDateString("es-CO")}</span></div>
              <div><label>Forma de Pago</label><span>{compra.forma_pago || "No especificada"}</span></div>
              <div><label>Stock Actual Producto</label><span>{Number(compra.producto_stock || 0).toFixed(2)}</span></div>
              {compra.observacion && <div className={styles["full"]}><label>Observacion</label><span>{compra.observacion}</span></div>}
            </div>
          </section>
        </>
      )}

      {mostrarModalCompra && (
        <div className={styles["modal-overlay"]} onClick={() => setMostrarModalCompra(false)}>
          <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>Nueva Compra</h3>
                <p>Registra la compra de un producto a proveedor.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setMostrarModalCompra(false)}>&times;</button>
            </div>
            <form onSubmit={crearCompra}>
              <div className={styles["form-grid"]}>
                <div className={styles["field-full"]}>
                  <label>Proveedor</label>
                  <select name="id_proveedor" value={compraForm.id_proveedor} onChange={handleCompraChange}>
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map(p => (
                      <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles["field-full"]}>
                  <label>Producto</label>
                  <select name="id_producto" value={compraForm.id_producto} onChange={handleCompraChange}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre} (Stock actual: {Number(p.stock || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                {stockProductoSeleccionado && (
                  <div className={styles["stock-info"]}>
                    <span>Stock actual de <strong>{stockProductoSeleccionado.nombre}</strong>: </span>
                    <strong className={Number(stockProductoSeleccionado.stock) <= Number(stockProductoSeleccionado.stock_minimo) ? styles["text-danger"] : ""}>
                      {Number(stockProductoSeleccionado.stock).toFixed(2)} {stockProductoSeleccionado.unidad_medida}
                    </strong>
                    <span> | Stock minimo: {Number(stockProductoSeleccionado.stock_minimo).toFixed(2)}</span>
                  </div>
                )}
                <div>
                  <label>Numero Factura (opcional)</label>
                  <input type="text" name="numero_factura" value={compraForm.numero_factura} onChange={handleCompraChange} placeholder="-factura" />
                </div>
                <div>
                  <label>Fecha de Compra</label>
                  <input type="date" name="fecha_compra" value={compraForm.fecha_compra} onChange={handleCompraChange} />
                </div>
                <div>
                  <label>Cantidad</label>
                  <input type="number" name="cantidad" min="0.001" step="0.001" value={compraForm.cantidad} onChange={handleCompraChange} placeholder="1" />
                </div>
                <div>
                  <label>Costo Unitario</label>
                  <input type="number" name="costo_unitario" min="0.01" step="0.01" value={compraForm.costo_unitario} onChange={handleCompraChange} placeholder="0" />
                </div>
                <div>
                  <label>Forma de Pago</label>
                  <select name="forma_pago" value={compraForm.forma_pago} onChange={handleCompraChange}>
                    <option value="">Seleccionar...</option>
                    <option value="Contado">Contado</option>
                    <option value="Credito 30 dias">Credito 30 dias</option>
                    <option value="Credito 60 dias">Credito 60 dias</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div className={styles["field-full"]}>
                  <label>Observacion (opcional)</label>
                  <textarea name="observacion" value={compraForm.observacion} onChange={handleCompraChange} placeholder="Notas sobre esta compra..." maxLength="500" />
                </div>
              </div>
              {compraForm.costo_unitario && compraForm.cantidad && (
                <div className={styles["total-preview"]}>
                  <span>Total de la compra:</span>
                  <strong>{formatoMoneda(Number(compraForm.costo_unitario) * Number(compraForm.cantidad))}</strong>
                </div>
              )}
              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setMostrarModalCompra(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>Registrar Compra</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalProductoProv && (
        <div className={styles["modal-overlay"]} onClick={() => setMostrarModalProductoProv(false)}>
          <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>Productos del Proveedor</h3>
                <p>Asociar productos que se compran a este proveedor.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setMostrarModalProductoProv(false)}>&times;</button>
            </div>
            <form onSubmit={agregarProductoProveedor}>
              <div className={styles["form-grid"]}>
                <div className={styles["field-full"]}>
                  <label>Producto</label>
                  <select name="id_producto" value={productoProvForm.id_producto} onChange={handleProductoProvChange}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>{p.nombre} (Stock: {Number(p.stock || 0).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Precio de Compra (opcional)</label>
                  <input type="number" name="precio_compra" min="0" step="0.01" value={productoProvForm.precio_compra} onChange={handleProductoProvChange} placeholder="0" />
                </div>
                <div>
                  <label>Tiempo de Entrega (opcional)</label>
                  <input type="text" name="tiempo_entrega" value={productoProvForm.tiempo_entrega} onChange={handleProductoProvChange} placeholder="Ej: 5 dias" maxLength="100" />
                </div>
              </div>
              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setMostrarModalProductoProv(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>Agregar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}