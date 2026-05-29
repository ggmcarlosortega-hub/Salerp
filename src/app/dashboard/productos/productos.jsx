"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/productos.module.css";

const API_BASE = "http://localhost:3001";
const API_PRODUCTO = `${API_BASE}/api/producto`;
const API_INSUMOS = `${API_PRODUCTO}/insumos`;

const productoInicial = {
  id_producto: "",
  id_categoria: "",
  categoria_nombre: "",
  nombre: "",
  descripcion: "",
  tipo_producto: "Fabricado",
  imagen: "",
  precio_venta: 0,
  costo_total: 0,
  margen_valor: 0,
  margen_porcentaje: 30,
  stock: 0,
  unidad_medida: "Unidad",
  visible_cliente: 1,
  destacado: 0,
  estado: 1,
};

const costoInicial = {
  usa_insumo: 1,
  id_insumo: "",
  concepto: "",
  tipo_costo: "Materia prima",
  cantidad: 1,
  costo_unitario: "",
  observacion: "",
  descuenta_inventario: 1,
};

const categoriaInicial = {
  nombre: "",
  descripcion: "",
  visible_cliente: 1,
};

export default function GestionProductos() {
  const [lista, setLista] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [insumosSistema, setInsumosSistema] = useState([]);
  const [vistaActual, setVistaActual] = useState("lista");

  const [producto, setProducto] = useState(productoInicial);
  const [costos, setCostos] = useState([]);
  const [costoForm, setCostoForm] = useState(costoInicial);
  const [categoriaForm, setCategoriaForm] = useState(categoriaInicial);

  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarInsumosSistema();
  }, []);

  useEffect(() => {
    return () => {
      if (imagenPreview && imagenPreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagenPreview);
      }
    };
  }, [imagenPreview]);

  useEffect(() => {
    const pending = localStorage.getItem('pendingAction');
    if (pending) {
      try {
        const { action } = JSON.parse(pending);
        localStorage.removeItem('pendingAction');
        if (action === 'nuevoProducto') nuevoProducto();
        else if (action === 'nuevaCategoria') {
          setMostrarModalCategoria(true);
        }
      } catch (e) {
        console.error('Error parsing pending action:', e);
      }
    }
  }, []);

  const formatoMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(valor || 0));

  const getImagenUrl = (ruta) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta;
    return `${API_BASE}${ruta}`;
  };

  const esNuevoProducto = !producto.id_producto;

  const costoCalculadoLocal = useMemo(() => {
    return costos.reduce((total, item) => total + Number(item.subtotal || 0), 0);
  }, [costos]);

  const precioVentaCalculado = useMemo(() => {
    const costo = Number(producto.costo_total || costoCalculadoLocal || 0);
    const margen = Number(producto.margen_porcentaje || 0);
    return costo + costo * (margen / 100);
  }, [producto.costo_total, producto.margen_porcentaje, costoCalculadoLocal]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return lista.filter((p) => {
      const coincideTexto =
        p.nombre?.toLowerCase().includes(texto) ||
        p.descripcion?.toLowerCase().includes(texto) ||
        p.categoria_nombre?.toLowerCase().includes(texto);
      const coincideCategoria = !categoriaFiltro || String(p.id_categoria) === String(categoriaFiltro);
      return coincideTexto && coincideCategoria;
    });
  }, [lista, busqueda, categoriaFiltro]);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError("");
      const response = await fetch(API_PRODUCTO);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al cargar productos.");
      setLista(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch(`${API_PRODUCTO}/categorias`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al cargar categorías.");
      setCategorias(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarInsumosSistema = async () => {
    try {
      const response = await fetch(API_INSUMOS);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al cargar insumos.");
      setInsumosSistema(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarDetalleProducto = async (idProducto) => {
    try {
      setCargando(true);
      setError("");
      const response = await fetch(`${API_PRODUCTO}/${idProducto}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al cargar el detalle del producto.");
      setProducto({ ...data.producto, margen_porcentaje: data.producto.margen_porcentaje ?? 30 });
      setCostos(data.costos || []);
      setImagenPreview(getImagenUrl(data.producto.imagen));
      setImagenArchivo(null);
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
    await cargarDetalleProducto(p.id_producto);
  };

  const nuevoProducto = () => {
    setProducto({ ...productoInicial, stock: 0, precio_venta: 0, costo_total: 0 });
    setCostos([]);
    setCostoForm(costoInicial);
    setImagenArchivo(null);
    setImagenPreview("");
    setModoEdicion(true);
    setMensaje("");
    setError("");
    setVistaActual("detalle");
  };

  const volverLista = () => {
    setProducto(productoInicial);
    setCostos([]);
    setCostoForm(costoInicial);
    setImagenArchivo(null);
    setImagenPreview("");
    setVistaActual("lista");
    setModoEdicion(false);
    cargarProductos();
  };

  const handleProductoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProducto((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleImagenChange = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setImagenArchivo(archivo);
    setImagenPreview(URL.createObjectURL(archivo));
  };

  const handleCostoChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "id_insumo") {
      const insumo = insumosSistema.find((i) => String(i.id_insumo) === String(value));
      setCostoForm((prev) => ({
        ...prev,
        id_insumo: value,
        concepto: insumo ? insumo.nombre : "",
        costo_unitario: insumo ? insumo.costo_unitario : "",
        tipo_costo: "Materia prima",
        descuenta_inventario: value ? 1 : prev.descuenta_inventario,
      }));
      return;
    }

    if (name === "usa_insumo") {
      const usar = checked ? 1 : 0;
      setCostoForm((prev) => ({
        ...prev,
        usa_insumo: usar,
        id_insumo: usar ? prev.id_insumo : "",
        descuenta_inventario: usar ? 1 : 0,
      }));
      return;
    }

    setCostoForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const crearFormDataProducto = () => {
    const formData = new FormData();
    formData.append("id_categoria", producto.id_categoria || "");
    formData.append("nombre", producto.nombre || "");
    formData.append("descripcion", producto.descripcion || "");
    formData.append("tipo_producto", producto.tipo_producto || "Comprado");
    formData.append("margen_porcentaje", producto.margen_porcentaje || 0);
    formData.append("stock", esNuevoProducto ? 0 : producto.stock || 0);
    formData.append("unidad_medida", producto.unidad_medida || "Unidad");
    formData.append("visible_cliente", producto.visible_cliente ? 1 : 0);
    formData.append("destacado", producto.destacado ? 1 : 0);
    if (imagenArchivo) formData.append("imagen", imagenArchivo);
    return formData;
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    if (!categoriaForm.nombre.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    try {
      const response = await fetch(`${API_PRODUCTO}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoriaForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al guardar la categoría.");
      setMensaje("Categoría registrada correctamente.");
      setCategoriaForm(categoriaInicial);
      setMostrarModalCategoria(false);
      await cargarCategorias();
      setProducto((prev) => ({ ...prev, id_categoria: data.id_categoria }));
    } catch (err) {
      setError(err.message);
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!producto.nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    if (Number(producto.margen_porcentaje) < 0) {
      setError("El porcentaje de ganancia no puede ser negativo.");
      return;
    }

    try {
      const esEdicion = Boolean(producto.id_producto);
      const response = await fetch(
        esEdicion ? `${API_PRODUCTO}/${producto.id_producto}` : API_PRODUCTO,
        {
          method: esEdicion ? "PUT" : "POST",
          body: crearFormDataProducto(),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al guardar el producto.");

      setMensaje(esEdicion ? "Producto actualizado correctamente." : "Producto registrado correctamente.");
      setModoEdicion(false);
      await cargarDetalleProducto(esEdicion ? producto.id_producto : data.id_producto);
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  };

  const agregarCosto = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!producto.id_producto) {
      setError("Primero debes guardar el producto para agregar costos.");
      return;
    }
    if (Number(costoForm.usa_insumo) === 1 && !costoForm.id_insumo) {
      setError("Selecciona un insumo existente del inventario.");
      return;
    }
    if (!costoForm.concepto.trim()) {
      setError("El concepto del costo es obligatorio.");
      return;
    }
    if (!costoForm.cantidad || Number(costoForm.cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }
    if (!costoForm.costo_unitario || Number(costoForm.costo_unitario) <= 0) {
      setError("El costo unitario debe ser mayor a cero.");
      return;
    }

    try {
      const response = await fetch(`${API_PRODUCTO}/${producto.id_producto}/costos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costoForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al agregar el costo.");

      setCostoForm(costoInicial);
      setMensaje("Costo agregado correctamente. El precio de venta se recalculó automáticamente.");
      await cargarDetalleProducto(producto.id_producto);
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarCosto = async (idDetalle) => {
    try {
      setMensaje("");
      setError("");
      const response = await fetch(`${API_PRODUCTO}/costos/${idDetalle}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al eliminar el costo.");
      setMensaje("Costo eliminado correctamente. El precio de venta se recalculó automáticamente.");
      await cargarDetalleProducto(producto.id_producto);
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmarDesactivacion = async () => {
    try {
      setMensaje("");
      setError("");
      const response = await fetch(`${API_PRODUCTO}/${producto.id_producto}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al desactivar producto.");
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
              <span className={styles["hero-badge"]}>Catálogo empresarial</span>
              <h1>Gestión de productos</h1>
              <p>
                Crea productos fabricados, comprados o servicios. Define costos reales con insumos del inventario y calcula el precio de venta desde el porcentaje de ganancia.
              </p>
            </div>
            <button onClick={nuevoProducto} className={styles["btn-hero"]}>+ Nuevo producto</button>
          </section>

          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Productos registrados</h2>
                <p>Estos productos podrán alimentar luego el catálogo de clientes.</p>
              </div>
              <div className={styles["search-box"]}>
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <select
                className={styles["filter-select"]}
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Costo</th>
                    <th>Ganancia</th>
                    <th>Precio venta</th>
                    <th>Cliente</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p) => (
                    <tr key={p.id_producto} onClick={() => abrirDetalle(p)}>
                      <td>
                        <div className={styles["product-cell"]}>
                          {p.imagen ? (
                            <img className={styles["product-thumb"]} src={getImagenUrl(p.imagen)} alt={p.nombre} />
                          ) : (
                            <div className={styles["product-icon"]}>{p.nombre?.charAt(0)?.toUpperCase() || "P"}</div>
                          )}
                          <div className={styles["product-info"]}>
                            <strong>{p.nombre}</strong>
                            <span>{p.descripcion || "Sin descripción"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.categoria_nombre || "Sin categoría"}</td>
                      <td>{formatoMoneda(p.costo_total)}</td>
                      <td>
                        <span className={styles["pill-green"]}>{Number(p.margen_porcentaje || 0).toFixed(1)}%</span>
                      </td>
                      <td>{formatoMoneda(p.precio_venta)}</td>
                      <td>
                        <span className={Number(p.visible_cliente) === 1 ? styles["pill-blue"] : styles["pill-gray"]}>
                          {Number(p.visible_cliente) === 1 ? "Visible" : "Oculto"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles["btn-table"]}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalle(p);
                          }}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!cargando && productosFiltrados.length === 0 && (
                    <tr><td colSpan="7" className={styles["empty"]}>No hay productos registrados.</td></tr>
                  )}
                  {cargando && (
                    <tr><td colSpan="7" className={styles["empty"]}>Cargando productos...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {vistaActual === "detalle" && (
        <>
          <button onClick={volverLista} className={styles["back-btn"]}>← Volver a productos</button>

          <section className={styles["detail-hero"]}>
            <div className={styles["detail-title"]}>
              {imagenPreview ? (
                <img src={imagenPreview} alt={producto.nombre || "Producto"} className={styles["big-image"]} />
              ) : (
                <div className={styles["big-icon"]}>{producto.nombre?.charAt(0)?.toUpperCase() || "P"}</div>
              )}
              <div>
                <span>{producto.tipo_producto || "Producto"}</span>
                <h1>{producto.nombre || "Nuevo producto"}</h1>
                <p>
                  {producto.categoria_nombre || "Sin categoría"} · {Number(producto.visible_cliente) === 1 ? "Visible para clientes" : "Oculto para clientes"}
                </p>
              </div>
            </div>
            <div className={styles["detail-actions"]}>
              {producto.id_producto && !modoEdicion && (
                <>
                  <button type="button" onClick={() => setModoEdicion(true)} className={styles["btn-secondary"]}>Editar producto</button>
                  <button type="button" onClick={() => setMostrarModalConfirmacion(true)} className={styles["btn-danger"]}>Desactivar</button>
                </>
              )}
            </div>
          </section>

          <section className={styles["summary-grid"]}>
            <article className={styles["summary-card"]}>
              <span>Costo real</span>
              <strong>{formatoMoneda(producto.costo_total)}</strong>
              <small>Suma de costos asociados</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Ganancia</span>
              <strong>{Number(producto.margen_porcentaje || 0).toFixed(2)}%</strong>
              <small>{formatoMoneda(producto.margen_valor)} de utilidad</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Precio venta</span>
              <strong>{formatoMoneda(producto.precio_venta || precioVentaCalculado)}</strong>
              <small>Costo + porcentaje de ganancia</small>
            </article>
            <article className={styles["summary-card"]}>
              <span>Stock</span>
              <strong>{Number(producto.stock || 0)}</strong>
              <small>{esNuevoProducto ? "Se inicializa en 0" : "Editable en modificación"}</small>
            </article>
          </section>

          <section className={styles["content-grid"]}>
            <form onSubmit={guardarProducto} className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Información del producto</h2>
                  <p>El costo se calcula con el detalle. El precio de venta se calcula con el porcentaje de ganancia.</p>
                </div>
              </div>

              <div className={styles["product-form-layout"]}>
                <aside className={styles["image-panel"]}>
                  <div className={styles["image-panel-title"]}>
                    <span>Imagen</span>
                    <small>Catálogo del cliente</small>
                  </div>
                  <label className={`${styles["upload-card"]} ${!modoEdicion ? styles["upload-disabled"] : ""}`}>
                    {imagenPreview ? (
                      <img src={imagenPreview} alt="Vista previa del producto" />
                    ) : (
                      <div className={styles["upload-empty"]}>
                        <div className={styles["upload-icon"]}>＋</div>
                        <strong>Subir imagen</strong>
                        <span>JPG, PNG o WEBP</span>
                      </div>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImagenChange} disabled={!modoEdicion} />
                  </label>
                  <p className={styles["image-help"]}>Esta imagen se usará después para mostrar el producto en la vista de clientes.</p>
                </aside>

                <div className={styles["form-area"]}>
                  <div className={styles["form-grid"]}>
                    <div>
                      <label>Tipo de producto</label>
                      <select name="tipo_producto" value={producto.tipo_producto || "Comprado"} onChange={handleProductoChange} disabled={!modoEdicion}>
                        <option value="Fabricado">Fabricado</option>
                        <option value="Comprado">Comprado</option>
                        <option value="Servicio">Servicio</option>
                      </select>
                    </div>

                    <div className={styles["category-field"]}>
                      <label>Categoría</label>
                      <div className={styles["category-select-row"]}>
                        <select name="id_categoria" value={producto.id_categoria || ""} onChange={handleProductoChange} disabled={!modoEdicion}>
                          <option value="">Sin categoría</option>
                          {categorias.map((cat) => (
                            <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                          ))}
                        </select>
                        {modoEdicion && (
                          <button type="button" onClick={() => setMostrarModalCategoria(true)} className={styles["btn-category-add"]} title="Crear categoría">+</button>
                        )}
                      </div>
                    </div>

                    <div className={styles["field-full"]}>
                      <label>Nombre del producto</label>
                      <input type="text" name="nombre" value={producto.nombre || ""} onChange={handleProductoChange} disabled={!modoEdicion} placeholder="Ej: Pan aliñado, cerradura, instalación..." />
                    </div>

                    <div>
                      <label>Porcentaje de ganancia</label>
                      <input type="number" step="0.01" name="margen_porcentaje" value={producto.margen_porcentaje || 0} onChange={handleProductoChange} disabled={!modoEdicion} placeholder="30" />
                    </div>

                    <div>
                      <label>Precio venta calculado</label>
                      <input type="text" value={formatoMoneda(producto.precio_venta || precioVentaCalculado)} disabled />
                    </div>

                    <div>
                      <label>Unidad</label>
                      <input type="text" name="unidad_medida" value={producto.unidad_medida || "Unidad"} onChange={handleProductoChange} disabled={!modoEdicion} placeholder="Unidad" />
                    </div>

                    <div>
                      <label>Stock</label>
                      <input
                        type="number"
                        name="stock"
                        value={producto.stock || 0}
                        onChange={handleProductoChange}
                        disabled={!modoEdicion || producto.tipo_producto === "Servicio" || esNuevoProducto}
                        title={esNuevoProducto ? "El stock se crea en 0. Podrás modificarlo al editar el producto." : ""}
                      />
                    </div>

                    <div className={styles["field-full"]}>
                      <label>Descripción</label>
                      <textarea name="descripcion" value={producto.descripcion || ""} onChange={handleProductoChange} disabled={!modoEdicion} placeholder="Describe brevemente este producto..." />
                    </div>

                    <div className={styles["field-full"]}>
                      <div className={styles["option-grid"]}>
                        <label className={styles["option-card"]}>
                          <input type="checkbox" name="visible_cliente" checked={Number(producto.visible_cliente) === 1} onChange={handleProductoChange} disabled={!modoEdicion} />
                          <span className={styles["custom-check"]}></span>
                          <div>
                            <strong>Visible para clientes</strong>
                            <small>Aparecerá en el futuro catálogo de cotización.</small>
                          </div>
                        </label>
                        <label className={styles["option-card"]}>
                          <input type="checkbox" name="destacado" checked={Number(producto.destacado) === 1} onChange={handleProductoChange} disabled={!modoEdicion} />
                          <span className={styles["custom-check"]}></span>
                          <div>
                            <strong>Producto destacado</strong>
                            <small>Útil para mostrarlo primero en el catálogo.</small>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {modoEdicion && (
                <div className={styles["form-actions"]}>
                  <button type="submit" className={styles["btn-primary"]}>Guardar producto</button>
                  {producto.id_producto && <button type="button" onClick={() => setModoEdicion(false)} className={styles["btn-light"]}>Cancelar</button>}
                </div>
              )}
            </form>

            <section className={styles["card"]}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Agregar costo asociado</h2>
                  <p>Usa insumos existentes del inventario o registra costos manuales como mano de obra.</p>
                </div>
              </div>

              <form onSubmit={agregarCosto} className={styles["cost-form"]}>
                <div className={styles["field-full"]}>
                  <label className={styles["toggle-line"]}>
                    <input type="checkbox" name="usa_insumo" checked={Number(costoForm.usa_insumo) === 1} onChange={handleCostoChange} />
                    <span>Usar insumo existente del inventario</span>
                  </label>
                </div>

                {Number(costoForm.usa_insumo) === 1 && (
                  <div className={styles["field-full"]}>
                    <label>Insumo del sistema</label>
                    <select name="id_insumo" value={costoForm.id_insumo} onChange={handleCostoChange}>
                      <option value="">Seleccionar insumo</option>
                      {insumosSistema.map((insumo) => (
                        <option key={insumo.id_insumo} value={insumo.id_insumo}>
                          {insumo.nombre} · {insumo.proveedor || "Sin proveedor"} · Stock: {Number(insumo.stock_actual || 0).toFixed(3)} {insumo.unidad_medida}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles["field-full"]}>
                  <label>Concepto</label>
                  <input type="text" name="concepto" value={costoForm.concepto} onChange={handleCostoChange} placeholder="Ej: Harina, transporte, mano de obra..." />
                </div>

                <div>
                  <label>Tipo de costo</label>
                  <select name="tipo_costo" value={costoForm.tipo_costo} onChange={handleCostoChange}>
                    <option value="Materia prima">Materia prima</option>
                    <option value="Mano de obra">Mano de obra</option>
                    <option value="Empaque">Empaque</option>
                    <option value="Servicio">Servicio</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label>Cantidad por unidad</label>
                  <input type="number" step="0.001" name="cantidad" value={costoForm.cantidad} onChange={handleCostoChange} />
                </div>

                <div>
                  <label>Costo unitario</label>
                  <input type="number" step="0.01" name="costo_unitario" value={costoForm.costo_unitario} onChange={handleCostoChange} placeholder="0" />
                </div>

                <div>
                  <label>Descuenta inventario</label>
                  <select name="descuenta_inventario" value={costoForm.descuenta_inventario} onChange={handleCostoChange} disabled={Number(costoForm.usa_insumo) !== 1}>
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div className={styles["field-full"]}>
                  <label>Observación</label>
                  <input type="text" name="observacion" value={costoForm.observacion} onChange={handleCostoChange} placeholder="Opcional" />
                </div>

                <button type="submit" className={styles["btn-primary"]}>+ Agregar costo</button>
              </form>
            </section>
          </section>

          <section className={styles["card"]}>
            <div className={styles["card-header"]}>
              <div>
                <h2>Detalle de costos / receta</h2>
                <p>Estos costos calculan el valor real del producto. Si usan inventario, se descontarán cuando se venda o facture.</p>
              </div>
            </div>
            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Insumo</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Costo unitario</th>
                    <th>Subtotal</th>
                    <th>Inventario</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {costos.map((c) => (
                    <tr key={c.id_detalle_producto}>
                      <td>
                        <div className={styles["cost-detail"]}>
                          <strong>{c.concepto}</strong>
                          {c.observacion && <span>{c.observacion}</span>}
                        </div>
                      </td>
                      <td>{c.insumo_nombre || "Manual"}</td>
                      <td>{c.tipo_costo}</td>
                      <td>{Number(c.cantidad || 0).toFixed(3)}</td>
                      <td>{formatoMoneda(c.costo_unitario)}</td>
                      <td><strong>{formatoMoneda(c.subtotal)}</strong></td>
                      <td>
                        <span className={Number(c.descuenta_inventario) === 1 ? styles["pill-blue"] : styles["pill-gray"]}>
                          {Number(c.descuenta_inventario) === 1 ? "Descuenta" : "No descuenta"}
                        </span>
                      </td>
                      <td>
                        <button type="button" onClick={() => eliminarCosto(c.id_detalle_producto)} className={styles["btn-delete-small"]}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {costos.length === 0 && (
                    <tr><td colSpan="8" className={styles["empty"]}>Este producto todavía no tiene costos registrados.</td></tr>
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
            <h3>Desactivar producto</h3>
            <p>¿Seguro que deseas desactivar <strong>{producto.nombre}</strong>? El producto dejará de aparecer en la lista principal.</p>
            <div className={styles["modal-actions"]}>
              <button onClick={() => setMostrarModalConfirmacion(false)} className={styles["btn-light"]}>Cancelar</button>
              <button onClick={confirmarDesactivacion} className={styles["btn-danger"]}>Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalCategoria && (
        <div className={styles["modal-overlay"]}>
          <div className={`${styles["modal"]} ${styles["modal-category"]}`}>
            <div className={styles["category-modal-head"]}>
              <div className={styles["category-modal-icon"]}>▦</div>
              <div>
                <span>Nueva categoría</span>
                <h3>Organiza tu catálogo</h3>
                <p>Crea una categoría para clasificar productos y preparar la futura vista de clientes.</p>
              </div>
            </div>

            <form onSubmit={guardarCategoria} className={styles["category-form"]}>
              <div>
                <label>Nombre</label>
                <input
                  type="text"
                  value={categoriaForm.nombre}
                  onChange={(e) => setCategoriaForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Puertas, bebidas, servicios..."
                />
              </div>
              <div>
                <label>Descripción</label>
                <textarea
                  value={categoriaForm.descripcion}
                  onChange={(e) => setCategoriaForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción opcional"
                />
              </div>
              <label className={styles["category-check-card"]}>
                <input
                  type="checkbox"
                  checked={Number(categoriaForm.visible_cliente) === 1}
                  onChange={(e) => setCategoriaForm((prev) => ({ ...prev, visible_cliente: e.target.checked ? 1 : 0 }))}
                />
                <span></span>
                <div>
                  <strong>Visible para clientes</strong>
                  <small>La categoría podrá aparecer en el catálogo público de cotización.</small>
                </div>
              </label>
              <div className={styles["modal-actions"]}>
                <button type="button" onClick={() => setMostrarModalCategoria(false)} className={styles["btn-light"]}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>Guardar categoría</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}