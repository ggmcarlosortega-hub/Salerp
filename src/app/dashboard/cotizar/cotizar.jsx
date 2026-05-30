"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./css/cotizar.module.css";
import { useNotification } from "../../../context/NotificationContext";

import { API_PRODUCTO, API_DOCUMENTO, getHeaders } from "@/utils/api";

const API_BASE = "http://localhost:3001";

export default function CotizarCliente() {
  const router = useRouter();
  const [usuario, setUsuario] = useState({ nombre: "", correo: "", rol: "" });
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cart, setCart] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [cotizacionData, setCotizacionData] = useState(null);
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

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [checkoutObs, setCheckoutObs] = useState("");

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

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_PRODUCTO}/catalogo`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar catálogo");
      setProductos(data.productos || []);
      setCategorias(data.categorias || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user_salerp");
      if (raw) {
        const datos = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsuario({
          nombre: datos.nombre || (datos.correo ? datos.correo.split("@")[0] : "Cliente"),
          correo: datos.correo || "",
          rol: datos.rol || "cliente",
        });
        if (datos.rol?.toLowerCase() === "admin") router.push("/dashboard");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCatalogo();
  }, []);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return productos.filter((p) => {
      const coincideCat = categoriaFiltro
        ? String(p.id_categoria) === String(categoriaFiltro)
        : true;
      const coincideTexto = texto
        ? p.nombre?.toLowerCase().includes(texto) ||
          p.descripcion?.toLowerCase().includes(texto) ||
          p.categoria_nombre?.toLowerCase().includes(texto)
        : true;
      return coincideCat && coincideTexto;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const totalCart = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.precio_venta * item.cantidad, 0);
  }, [cart]);

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCart((prev) => {
      const existe = prev.find((p) => p.id_producto === producto.id_producto);
      if (existe) {
        return prev.map((p) =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: p.cantidad + cantidad }
            : p
        );
      }
      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio_venta: Number(producto.precio_venta || 0),
          imagen: producto.imagen,
          cantidad,
        },
      ];
    });
    setMensaje(`${producto.nombre} agregado al carrito`);
  };

  const cambiarCantidad = (id, delta) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id_producto === id ? { ...p, cantidad: Math.max(1, p.cantidad + delta) } : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  const eliminarDelCarrito = (id) => {
    setCart((prev) => prev.filter((p) => p.id_producto !== id));
  };

  const abrirDetalle = (producto) => {
    setProductoSeleccionado(producto);
  };

  const cerrarDetalle = () => {
    setProductoSeleccionado(null);
  };

  const abrirCheckout = () => {
    setCheckoutObs("");
    setMostrarCheckout(true);
  };

  const confirmarCotizacion = async () => {
    if (!usuario.correo) {
      setError("No se encontró tu correo. Inicia sesión nuevamente.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const res = await fetch(`${API_DOCUMENTO}/cotizacion-cliente`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          correo: usuario.correo,
          observaciones: checkoutObs,
          items: cart.map((item) => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear cotización");

      setCotizacionData(data);
      setMostrarCheckout(false);
      setMostrarExito(true);
      setCart([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => {
    if (cotizacionData?.id_cotizacion) {
      window.open(
        `${API_DOCUMENTO}/cotizacion/${cotizacionData.id_cotizacion}/pdf`,
        "_blank"
      );
    }
  };

  if (cargando) {
    return (
      <div className={styles["page"]}>
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#9ca3af" }}>
          Cargando catálogo de productos...
        </div>
      </div>
    );
  }

  return (
    <div className={styles["page"]}>
      {mostrarCheckout ? (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>Confirmar cotización</h3>
                <p>Revisa los productos antes de enviar tu solicitud</p>
              </div>
              <button
                className={styles["modal-close"]}
                onClick={() => setMostrarCheckout(false)}
              >
                &times;
              </button>
            </div>

            <div className={styles["modal-body"]}>
              <div className={styles["modal-form"]}>
                <label>
                  Observaciones
                  <textarea
                    value={checkoutObs}
                    onChange={(e) => setCheckoutObs(e.target.value)}
                    placeholder="Notas adicionales para tu cotización..."
                  />
                </label>
              </div>

              {cart.map((item) => (
                <div key={item.id_producto} className={styles["resume-item"]}>
                  <span className={styles["resume-item-name"]}>{item.nombre}</span>
                  <span className={styles["resume-item-qty"]}>x{item.cantidad}</span>
                  <span className={styles["resume-item-price"]}>
                    {formatoMoneda(item.precio_venta * item.cantidad)}
                  </span>
                </div>
              ))}

              <div className={styles["modal-totals"]}>
                <div className={styles["modal-total-final"]}>
                  <span>Total</span>
                  <strong>{formatoMoneda(totalCart)}</strong>
                </div>
              </div>
            </div>

            <div className={styles["modal-actions"]}>
              <button
                className={styles["btn-ghost"]}
                onClick={() => setMostrarCheckout(false)}
              >
                Cancelar
              </button>
              <button
                className={styles["btn-primary"]}
                onClick={confirmarCotizacion}
                disabled={guardando}
              >
                {guardando ? "Enviando..." : "Confirmar cotización"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className={styles["hero"]}>
            <div className={styles["hero-content"]}>
              <span className={styles["hero-badge"]}>Catálogo de productos</span>
              <h1>Cotiza con nosotros</h1>
              <p>
                Explora nuestro catálogo y arma tu cotización. Agrega los productos
                que necesites y al finalizar solicita tu cotización.
              </p>
            </div>
            <div className={styles["hero-user"]}>
              <div className={styles["hero-user-avatar"]}>
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div className={styles["hero-user-name"]}>{usuario.nombre}</div>
              <div className={styles["hero-user-role"]}>Cliente</div>
            </div>
          </section>

          <div className={styles["filters-bar"]}>
            <div className={styles["search-box"]}>
              <span className={styles["search-icon"]}>⌕</span>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {categorias.length > 0 && (
              <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                ))}
              </select>
            )}
            {busqueda || categoriaFiltro ? (
              <button
                className={styles["filter-clear"]}
                onClick={() => { setBusqueda(""); setCategoriaFiltro(""); }}
              >
                Limpiar
              </button>
            ) : null}
            <span className={styles["results-info"]}>
              {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className={styles["layout"]}>
            <div className={styles["products-grid"]}>
              {productosFiltrados.length === 0 ? (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1rem", color: "#9ca3af" }}>
                  No se encontraron productos con los filtros actuales.
                </p>
              ) : (
                productosFiltrados.map((producto) => (
                  <div
                    key={producto.id_producto}
                    className={styles["product-card"]}
                    onClick={() => abrirDetalle(producto)}
                  >
                    <div className={styles["product-card-image"]}>
                      {getImagenUrl(producto.imagen) ? (
                        <img src={getImagenUrl(producto.imagen)} alt={producto.nombre} />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className={styles["product-card-body"]}>
                      <span className={styles["product-card-category"]}>
                        {producto.categoria_nombre || "General"}
                      </span>
                      <h3 className={styles["product-card-name"]}>{producto.nombre}</h3>
                      <p className={styles["product-card-desc"]}>
                        {producto.descripcion || "Sin descripción"}
                      </p>
                    </div>
                    <div className={styles["product-card-footer"]}>
                      <span className={styles["product-card-price"]}>
                        {formatoMoneda(producto.precio_venta)}
                        <small className={styles["product-card-unit"]}> /unidad</small>
                      </span>
                      <button
                        className={`${styles["card-add-btn"]} ${styles["add"]}`}
                        onClick={(e) => { e.stopPropagation(); agregarAlCarrito(producto); }}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles["cart-sidebar"]}>
              <div className={styles["cart-header"]}>
                <h3>🛒 Carrito {totalItems > 0 && <>· {totalItems}</>}</h3>
                {totalItems > 0 && <span>{totalItems} producto{totalItems !== 1 ? "s" : ""}</span>}
              </div>
              <div className={styles["cart-items"]}>
                {cart.length === 0 ? (
                  <div className={styles["cart-empty"]}>
                    <div className={styles["cart-empty-icon"]}>🛒</div>
                    <div className={styles["cart-empty-text"]}>
                      Agrega productos del catálogo para armar tu cotización
                    </div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id_producto} className={styles["cart-item"]}>
                      <div className={styles["cart-item-thumb"]}>
                        {item.imagen ? (
                          <img src={getImagenUrl(item.imagen)} alt={item.nombre} />
                        ) : (
                          "📦"
                        )}
                      </div>
                      <div className={styles["cart-item-info"]}>
                        <div className={styles["cart-item-name"]}>{item.nombre}</div>
                        <div className={styles["cart-item-price"]}>
                          {formatoMoneda(item.precio_venta)} c/u
                        </div>
                      </div>
                      <div className={styles["cart-item-qty"]}>
                        <button
                          className={`${styles["qty-btn"]} ${item.cantidad <= 1 ? styles["remove"] : ""}`}
                          onClick={() => cambiarCantidad(item.id_producto, -1)}
                        >
                          &minus;
                        </button>
                        <span className={styles["qty-value"]}>{item.cantidad}</span>
                        <button
                          className={styles["qty-btn"]}
                          onClick={() => cambiarCantidad(item.id_producto, 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className={styles["cart-item-line-total"]}>
                        {formatoMoneda(item.precio_venta * item.cantidad)}
                      </span>
                      <button
                        className={styles["cart-item-remove"]}
                        onClick={() => eliminarDelCarrito(item.id_producto)}
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className={styles["cart-footer"]}>
                  <div className={styles["cart-total-row"]}>
                    <span className={styles["cart-total-label"]}>Total estimado</span>
                    <span className={styles["cart-total-value"]}>{formatoMoneda(totalCart)}</span>
                  </div>
                  <button className={styles["cart-checkout-btn"]} onClick={abrirCheckout}>
                    Solicitar cotización
                  </button>
                </div>
              )}
            </div>
          </div>

          {productoSeleccionado && (
            <div className={styles["detail-panel"]}>
              <div className={styles["detail-panel-header"]}>
                {getImagenUrl(productoSeleccionado.imagen) ? (
                  <img src={getImagenUrl(productoSeleccionado.imagen)} alt={productoSeleccionado.nombre} />
                ) : (
                  <span style={{ fontSize: "3rem", opacity: 0.3 }}>📦</span>
                )}
                <button className={styles["detail-panel-close"]} onClick={cerrarDetalle}>
                  &times;
                </button>
              </div>
              <div className={styles["detail-panel-body"]}>
                <span className={styles["detail-panel-category"]}>
                  {productoSeleccionado.categoria_nombre || "General"}
                </span>
                <h3 className={styles["detail-panel-name"]}>{productoSeleccionado.nombre}</h3>
                <p className={styles["detail-panel-desc"]}>
                  {productoSeleccionado.descripcion || "Sin descripción."}
                </p>
                <div className={styles["detail-panel-price-row"]}>
                  <span className={styles["detail-panel-price"]}>
                    {formatoMoneda(productoSeleccionado.precio_venta)}
                  </span>
                  <span className={styles["detail-panel-unit"]}>/ unidad</span>
                </div>
                <DetalleAddToCart
                  producto={productoSeleccionado}
                  onAdd={agregarAlCarrito}
                />
              </div>
            </div>
          )}
        </>
      )}

      {mostrarExito && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["success-modal"]}>
              <div className={styles["success-icon"]}>&#10003;</div>
              <h3>¡Cotización creada exitosamente!</h3>
              <p>
                Tu cotización #<strong>{cotizacionData?.id_cotizacion}</strong> ha sido
                registrada. Puedes descargar el PDF o esperar a que nuestro equipo te
                contacte.
              </p>
              <button className={styles["btn-pdf"]} onClick={abrirPDF}>
                &#128196; Ver PDF
              </button>
              <br />
              <br />
              <button
                className={styles["btn-ghost"]}
                onClick={() => setMostrarExito(false)}
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleAddToCart({ producto, onAdd }) {
  const [cantidad, setCantidad] = useState(1);

  return (
    <div className={styles["detail-add-section"]}>
      <div className={styles["detail-qty-selector"]}>
        <button
          className={styles["detail-qty-btn"]}
          onClick={() => setCantidad(Math.max(1, cantidad - 1))}
        >
          &minus;
        </button>
        <span className={styles["detail-qty-value"]}>{cantidad}</span>
        <button
          className={styles["detail-qty-btn"]}
          onClick={() => setCantidad(cantidad + 1)}
        >
          +
        </button>
      </div>
      <button
        className={styles["detail-add-cart-btn"]}
        onClick={() => {
          onAdd(producto, cantidad);
          setCantidad(1);
        }}
      >
        Agregar {cantidad > 1 ? `${cantidad} unidades` : "al carrito"}
      </button>
    </div>
  );
}
