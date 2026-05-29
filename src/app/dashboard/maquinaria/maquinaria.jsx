"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/maquinaria.module.css";
import { useNotification } from "../../../context/NotificationContext";

import { API_MAQUINARIA, getHeaders, getFileHeaders } from "@/utils/api";

const API_BASE = "http://localhost:3001";

const maquinariaInicial = {
  id_maquinaria: "",
  codigo_interno: "",
  nombre: "",
  categoria: "",
  marca: "",
  modelo: "",
  serie: "",
  ubicacion: "",
  responsable: "",
  estado_operativo: "Operativa",
  fecha_compra: "",
  valor_compra: "",
  descripcion: "",
  observacion: "",
};

const mantenimientoInicial = {
  id_mantenimiento: "",
  tipo_mantenimiento: "Preventivo",
  descripcion: "",
  costo: "",
  tecnico: "",
  proveedor: "",
  observacion: "",
  fecha_proximo: "",
  comprobante: "",
};

export default function GestionMaquinaria() {
  const [lista, setLista] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [maquinaria, setMaquinaria] = useState(maquinariaInicial);
  const [mantenimiento, setMantenimiento] = useState(mantenimientoInicial);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEst, setFiltroEst] = useState("1");
  

  const [modalMaquinaria, setModalMaquinaria] = useState(false);
  const [modalMantenimiento, setModalMantenimiento] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const [esEdicionMaquinaria, setEsEdicionMaquinaria] = useState(false);
  const [esEdicionMantenimiento, setEsEdicionMantenimiento] = useState(false);
  const [maquinariaAEliminar, setMaquinariaAEliminar] = useState(null);
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [previewComprobante, setPreviewComprobante] = useState("");

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

  const getArchivoUrl = (ruta) => {
    if (!ruta) return "";
    if (ruta.startsWith("http")) return ruta;
    return `${API_BASE}${ruta}`;
  };

  async function cargarMaquinaria() {
    try {
      setCargando(true);
      setError("");
      const response = await fetch(API_MAQUINARIA, { headers: getHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar maquinaria.");
      }

      const registros = Array.isArray(data) ? data : data.maquinarias || [];
      setLista(registros);

      if (!detalle && registros.length > 0) {
        await cargarDetalleMaquinaria(registros[0].id_maquinaria);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    (async () => {
      await cargarMaquinaria();
    })();
  }, []);

  async function cargarDetalleMaquinaria(idMaquinaria) {
  try {
    setError("");

    const response = await fetch(`${API_MAQUINARIA}/${idMaquinaria}`, { headers: getHeaders() });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al cargar detalle de maquinaria.");
    }

    const detalleOrganizado = data.maquinaria
      ? data
      : {
          maquinaria: data,
          mantenimientos: data.mantenimientos || [],
          resumen: data.resumen || {
            total_mantenimientos: data.mantenimientos?.length || 0,
            costo_total_mantenimientos: 0,
            ultimo_mantenimiento: null,
            proximo_mantenimiento: null,
          },
        };

    setDetalle(detalleOrganizado);
  } catch (err) {
    setError(err.message);
  }
}

  const categorias = useMemo(() => {
    const set = new Set(lista.map((item) => item.categoria).filter(Boolean));
    return Array.from(set);
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return lista.filter((item) => {
      const coincideTexto =
        item.nombre?.toLowerCase().includes(texto) ||
        item.codigo_interno?.toLowerCase().includes(texto) ||
        item.categoria?.toLowerCase().includes(texto) ||
        item.marca?.toLowerCase().includes(texto) ||
        item.modelo?.toLowerCase().includes(texto) ||
        item.ubicacion?.toLowerCase().includes(texto) ||
        item.responsable?.toLowerCase().includes(texto);

      const coincideEstado = filtroEstado ? item.estado_operativo === filtroEstado : true;
      const coincideCategoria = filtroCategoria ? item.categoria === filtroCategoria : true;
      const coincideEst = filtroEst !== "" ? Number(item.estado) === Number(filtroEst) : true;

      return coincideTexto && coincideEstado && coincideCategoria && coincideEst;
    });
  }, [lista, busqueda, filtroEstado, filtroCategoria, filtroEst]);

  const totalMaquinaria = lista.filter((m) => m.estado === 1).length;
  const totalOperativa = lista.filter((m) => m.estado_operativo === "Operativa" && m.estado === 1).length;
  const totalEnMantenimiento = lista.filter((m) => m.estado_operativo === "En mantenimiento").length;
  const costoTotalMantenimiento = lista.reduce((acc, item) => acc + Number(item.costo_total_mantenimientos || 0), 0);

  const mantenimientos = detalle?.mantenimientos || [];
  const costoDetalle = mantenimientos.reduce((acc, item) => acc + Number(item.costo || 0), 0);

  const handleMaquinariaChange = (e) => {
    const { name, value } = e.target;
    setMaquinaria((prev) => ({ ...prev, [name]: value }));
  };

  const handleMantenimientoChange = (e) => {
    const { name, value } = e.target;
    setMantenimiento((prev) => ({ ...prev, [name]: value }));
  };

  const handleArchivo = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setArchivoComprobante(archivo);
    if (archivo.type.startsWith("image/")) {
      setPreviewComprobante(URL.createObjectURL(archivo));
    } else {
      setPreviewComprobante("");
    }
  };

  const abrirModalNuevaMaquinaria = () => {
    setMaquinaria(maquinariaInicial);
    setEsEdicionMaquinaria(false);
    setMensaje("");
    setError("");
    setModalMaquinaria(true);
  };

  const abrirModalEditarMaquinaria = (item) => {
    setMaquinaria({
      id_maquinaria: item.id_maquinaria || "",
      codigo_interno: item.codigo_interno || "",
      nombre: item.nombre || "",
      categoria: item.categoria || "",
      marca: item.marca || "",
      modelo: item.modelo || "",
      serie: item.serie || "",
      ubicacion: item.ubicacion || "",
      responsable: item.responsable || "",
      estado_operativo: item.estado_operativo || "Operativa",
      fecha_compra: item.fecha_compra ? String(item.fecha_compra).substring(0, 10) : "",
      valor_compra: item.valor_compra || "",
      descripcion: item.descripcion || "",
      observacion: item.observacion || "",
    });
    setEsEdicionMaquinaria(true);
    setModalMaquinaria(true);
  };

  const guardarMaquinaria = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!maquinaria.nombre.trim()) {
      setError("El nombre de la maquinaria es obligatorio.");
      return;
    }

    try {
      const response = await fetch(
        esEdicionMaquinaria ? `${API_MAQUINARIA}/${maquinaria.id_maquinaria}` : API_MAQUINARIA,
        {
          method: esEdicionMaquinaria ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(maquinaria),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar maquinaria.");
      }

      setMensaje(esEdicionMaquinaria ? "Maquinaria actualizada correctamente." : "Maquinaria registrada correctamente.");
      setModalMaquinaria(false);
      await cargarMaquinaria();

      const idFinal = esEdicionMaquinaria ? maquinaria.id_maquinaria : data.id_maquinaria;
      if (idFinal) await cargarDetalleMaquinaria(idFinal);
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirModalMantenimiento = () => {
    if (!detalle?.maquinaria?.id_maquinaria) {
      setError("Selecciona una maquinaria antes de registrar un mantenimiento.");
      return;
    }

    setMantenimiento(mantenimientoInicial);
    setArchivoComprobante(null);
    setPreviewComprobante("");
    setEsEdicionMantenimiento(false);
    setMensaje("");
    setError("");
    setModalMantenimiento(true);
  };

  const abrirEditarMantenimiento = (item) => {
    setMantenimiento({
      id_mantenimiento: item.id_mantenimiento || "",
      tipo_mantenimiento: item.tipo_mantenimiento || "Preventivo",
      descripcion: item.descripcion || "",
      costo: item.costo || "",
      tecnico: item.tecnico || "",
      proveedor: item.proveedor || "",
      observacion: item.observacion || "",
      fecha_proximo: item.fecha_proximo ? String(item.fecha_proximo).substring(0, 10) : "",
      comprobante: item.comprobante || "",
    });
    setArchivoComprobante(null);
    setPreviewComprobante("");
    setEsEdicionMantenimiento(true);
    setModalMantenimiento(true);
  };

  const guardarMantenimiento = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!mantenimiento.descripcion.trim()) {
      setError("La descripción del mantenimiento es obligatoria.");
      return;
    }

    if (!mantenimiento.costo || Number(mantenimiento.costo) < 0) {
      setError("El costo del mantenimiento debe ser válido.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("tipo_mantenimiento", mantenimiento.tipo_mantenimiento || "Preventivo");
      formData.append("descripcion", mantenimiento.descripcion);
      formData.append("costo", mantenimiento.costo || 0);
      formData.append("tecnico", mantenimiento.tecnico || "");
      formData.append("proveedor", mantenimiento.proveedor || "");
      formData.append("observacion", mantenimiento.observacion || "");
      formData.append("fecha_proximo", mantenimiento.fecha_proximo || "");

      if (archivoComprobante) {
        formData.append("comprobante", archivoComprobante);
      }

      const idMaquinaria = detalle.maquinaria.id_maquinaria;
      const url = esEdicionMantenimiento
        ? `${API_MAQUINARIA}/mantenimientos/${mantenimiento.id_mantenimiento}`
        : `${API_MAQUINARIA}/${idMaquinaria}/mantenimientos`;

      const response = await fetch(url, {
        method: esEdicionMantenimiento ? "PUT" : "POST",
        headers: getFileHeaders(),
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar mantenimiento.");
      }

      setMensaje(
        esEdicionMantenimiento
          ? "Mantenimiento actualizado correctamente."
          : "Mantenimiento registrado y enviado a gastos correctamente."
      );
      setModalMantenimiento(false);
      await cargarMaquinaria();
      await cargarDetalleMaquinaria(idMaquinaria);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmarEliminarMaquinaria = (item) => {
    setMaquinariaAEliminar(item);
    setModalEliminar(true);
  };

  const eliminarMaquinaria = async () => {
    try {
      setError("");
      const response = await fetch(`${API_MAQUINARIA}/${maquinariaAEliminar.id_maquinaria}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al desactivar maquinaria.");
      }

      setMensaje("Maquinaria desactivada correctamente.");
      setModalEliminar(false);
      setMaquinariaAEliminar(null);
      setDetalle(null);
      await cargarMaquinaria();
    } catch (err) {
      setError(err.message);
      setModalEliminar(false);
    }
  };

  const activarMaquinaria = async (idMaquinaria) => {
    try {
      setError("");
      const response = await fetch(`${API_MAQUINARIA}/activar/${idMaquinaria}`, {
        method: "PUT",
        headers: getHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al activar maquinaria.");
      }

      setMensaje("Maquinaria activada correctamente.");
      setDetalle(null);
      await cargarMaquinaria();
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirComprobante = (ruta) => {
    if (!ruta) {
      setMensaje("Este mantenimiento no tiene comprobante asociado.");
      return;
    }
    window.open(getArchivoUrl(ruta), "_blank");
  };

  return (
    <div className={styles.page}>
      <section className={styles["hero"]}>
        <div>
          <span className={styles["hero-badge"]}>Inventario operativo</span>
          <h1>Gestión de maquinaria</h1>
          <p>
            Controla equipos, estado operativo, ubicación, responsables y mantenimientos. Cada mantenimiento con costo se registra automáticamente como gasto.
          </p>
        </div>

        <button type="button" className={styles["btn-hero"]} onClick={abrirModalNuevaMaquinaria}>
          + Registrar maquinaria
        </button>
      </section>

      <section className={styles["summary-grid"]}>
        <article className={styles["summary-card"]}>
          <span>Total maquinaria</span>
          <strong>{totalMaquinaria}</strong>
          <small>Equipos activos registrados</small>
        </article>

        <article className={styles["summary-card"]}>
          <span>Operativas</span>
          <strong>{totalOperativa}</strong>
          <small>Disponibles para uso</small>
        </article>

        <article className={styles["summary-card"]}>
          <span>En mantenimiento</span>
          <strong>{totalEnMantenimiento}</strong>
          <small>Equipos bajo revisión</small>
        </article>

        <article className={styles["summary-card"]}>
          <span>Costo mantenimientos</span>
          <strong>{formatoMoneda(costoTotalMantenimiento)}</strong>
          <small>Acumulado registrado</small>
        </article>
      </section>

      <section className={styles.workspace}>
        <aside className={styles["machine-list"]}>
          <div className={styles["panel-header"]}>
            <div>
              <h2>Maquinarias</h2>
              <p>Selecciona un equipo para ver su hoja de vida.</p>
            </div>
          </div>

          <div className={styles.filters}>
            <div className={styles["search-box"]}>
              <span>⌕</span>
              <input
                type="text"
                placeholder="Buscar maquinaria..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className={styles["filter-row"]}>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="Operativa">Operativa</option>
                <option value="En mantenimiento">En mantenimiento</option>
                <option value="Fuera de servicio">Fuera de servicio</option>
                <option value="Retirada">Retirada</option>
              </select>

              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Desactivados</option>
              </select>
            </div>
          </div>

          <div className={styles["machine-cards"]}>
            {listaFiltrada.map((item) => (
              <button
                type="button"
                key={item.id_maquinaria}
                onClick={() => cargarDetalleMaquinaria(item.id_maquinaria)}
                className={`${styles["machine-card"]} ${detalle?.maquinaria?.id_maquinaria === item.id_maquinaria ? styles.active : ""}`}
              >
                <div className={styles["machine-card-top"]}>
                  <div className={styles["machine-icon"]}>{item.nombre?.charAt(0)?.toUpperCase() || "M"}</div>
                  <div>
                    <strong>{item.nombre}</strong>
                    <span>{item.codigo_interno || item.categoria || "Sin código"}</span>
                  </div>
                </div>

                <div className={styles["machine-meta"]}>
                  <span>{item.ubicacion || "Sin ubicación"}</span>
                  <span>{item.total_mantenimientos || 0} mant.</span>
                </div>

                <div className={styles["machine-bottom"]}>
                  <span className={styles[`estado-${(item.estado_operativo || "Operativa").replaceAll(" ", "-").toLowerCase()}`]}>
                    {item.estado_operativo || "Operativa"}
                  </span>
                  <strong>{formatoMoneda(item.costo_total_mantenimientos)}</strong>
                </div>
                {Number(item.estado) === 0 && (
                  <div
                    className={styles["btn-activar-card"]}
                    onClick={(e) => {
                      e.stopPropagation();
                      activarMaquinaria(item.id_maquinaria);
                    }}
                  >
                    Activar
                  </div>
                )}
              </button>
            ))}

            {!cargando && listaFiltrada.length === 0 && (
              <div className={styles.empty}>No hay maquinaria con los filtros seleccionados.</div>
            )}
          </div>
        </aside>

        <main className={styles["detail-panel"]}>
          {!detalle ? (
            <div className={styles["empty-detail"]}>
              <div className={styles["empty-icon"]}>⚙</div>
              <h2>Selecciona una maquinaria</h2>
              <p>Al seleccionar un equipo verás su ficha técnica, costos y mantenimientos.</p>
            </div>
          ) : (
            <>
              <div className={styles["detail-hero"]}>
                <div className={styles["detail-title"]}>
                  <div className={styles["big-icon"]}>{detalle.maquinaria.nombre?.charAt(0)?.toUpperCase() || "M"}</div>
                  <div>
                    <span>{detalle.maquinaria.codigo_interno || "Sin código interno"}</span>
                    <h2>{detalle.maquinaria.nombre}</h2>
                    <p>
                      {detalle.maquinaria.categoria || "Sin categoría"} · {detalle.maquinaria.ubicacion || "Sin ubicación"}
                    </p>
                  </div>
                </div>

                <div className={styles["detail-actions"]}>
                  <button type="button" className={styles["btn-secondary"]} onClick={() => abrirModalEditarMaquinaria(detalle.maquinaria)}>
                    Editar
                  </button>
                  {Number(detalle.maquinaria.estado) === 0 ? (
                    <button type="button" className={styles["btn-primary"]} onClick={() => activarMaquinaria(detalle.maquinaria.id_maquinaria)}>
                      Activar
                    </button>
                  ) : (
                    <button type="button" className={styles["btn-danger"]} onClick={() => confirmarEliminarMaquinaria(detalle.maquinaria)}>
                      Desactivar
                    </button>
                  )}
                </div>
              </div>

              <section className={styles["info-grid"]}>
                <article>
                  <span>Estado</span>
                  <strong>{detalle.maquinaria.estado_operativo || "Operativa"}</strong>
                </article>
                <article>
                  <span>Responsable</span>
                  <strong>{detalle.maquinaria.responsable || "Sin responsable"}</strong>
                </article>
                <article>
                  <span>Valor compra</span>
                  <strong>{formatoMoneda(detalle.maquinaria.valor_compra)}</strong>
                </article>
                <article>
                  <span>Mantenimiento total</span>
                  <strong>{formatoMoneda(costoDetalle)}</strong>
                </article>
              </section>

              <section className={styles["technical-card"]}>
                <div className={styles["section-title"]}>
                  <div>
                    <h3>Ficha técnica</h3>
                    <p>Información principal de identificación y operación.</p>
                  </div>
                </div>

                <div className={styles["tech-grid"]}>
                  <div><span>Marca</span><strong>{detalle.maquinaria.marca || "No registrada"}</strong></div>
                  <div><span>Modelo</span><strong>{detalle.maquinaria.modelo || "No registrado"}</strong></div>
                  <div><span>Serie</span><strong>{detalle.maquinaria.serie || "No registrada"}</strong></div>
                  <div><span>Fecha compra</span><strong>{formatoFecha(detalle.maquinaria.fecha_compra)}</strong></div>
                  <div className={styles["tech-wide"]}><span>Descripción</span><strong>{detalle.maquinaria.descripcion || "Sin descripción"}</strong></div>
                  <div className={styles["tech-wide"]}><span>Observación</span><strong>{detalle.maquinaria.observacion || "Sin observación"}</strong></div>
                </div>
              </section>

              <section className={styles["maintenance-card"]}>
                <div className={styles["section-title"]}>
                  <div>
                    <h3>Historial de mantenimientos</h3>
                    <p>Cada mantenimiento con costo se registra también como gasto.</p>
                  </div>
                  <button type="button" className={styles["btn-primary"]} onClick={abrirModalMantenimiento}>
                    + Registrar mantenimiento
                  </button>
                </div>

                <div className={styles["maintenance-list"]}>
                  {mantenimientos.map((item) => (
                    <article key={item.id_mantenimiento} className={styles["maintenance-item"]}>
                      <div className={styles["timeline-dot"]}></div>
                      <div className={styles["maintenance-body"]}>
                        <div className={styles["maintenance-top"]}>
                          <div>
                            <span className={styles["pill-blue"]}>{item.tipo_mantenimiento}</span>
                            <h4>{item.descripcion}</h4>
                            <p>{item.observacion || "Sin observaciones adicionales"}</p>
                          </div>
                          <strong>{formatoMoneda(item.costo)}</strong>
                        </div>

                        <div className={styles["maintenance-meta"]}>
                          <span>Fecha: {formatoFecha(item.fecha_mantenimiento)}</span>
                          <span>Técnico: {item.tecnico || "No registrado"}</span>
                          <span>Proveedor: {item.proveedor || "No registrado"}</span>
                          <span>Próximo: {formatoFecha(item.fecha_proximo)}</span>
                        </div>

                        <div className={styles["maintenance-actions"]}>
                          {item.comprobante && (
                            <button type="button" className={styles["btn-table"]} onClick={() => abrirComprobante(item.comprobante)}>
                              Ver comprobante
                            </button>
                          )}
                          <button type="button" className={styles["btn-table"]} onClick={() => abrirEditarMantenimiento(item)}>
                            Editar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {mantenimientos.length === 0 && (
                    <div className={styles.empty}>Esta maquinaria todavía no tiene mantenimientos registrados.</div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </section>

      {modalMaquinaria && (
        <div className={styles["modal-overlay"]}>
          <div className={`${styles.modal} ${styles["modal-large"]}`}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>{esEdicionMaquinaria ? "Editar maquinaria" : "Registrar maquinaria"}</h3>
                <p>Registra la ficha técnica y datos operativos del equipo.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setModalMaquinaria(false)}>×</button>
            </div>

            <form onSubmit={guardarMaquinaria}>
              <div className={styles["form-grid"]}>
                <div><label>Código interno</label><input name="codigo_interno" value={maquinaria.codigo_interno} onChange={handleMaquinariaChange} placeholder="Ej: M-A001" maxLength="50" /></div>
                <div><label>Nombre</label><input name="nombre" value={maquinaria.nombre} onChange={handleMaquinariaChange} placeholder="Ej: Sierra circular" maxLength="255" /></div>
                <div><label>Categoría</label><input name="categoria" value={maquinaria.categoria} onChange={handleMaquinariaChange} placeholder="Ej: Corte, transporte, producción" maxLength="100" /></div>
                <div><label>Estado operativo</label><select name="estado_operativo" value={maquinaria.estado_operativo} onChange={handleMaquinariaChange}><option>Operativa</option><option>En mantenimiento</option><option>Fuera de servicio</option><option>Retirada</option></select></div>
                <div><label>Marca</label><input name="marca" value={maquinaria.marca} onChange={handleMaquinariaChange} placeholder="Marca" maxLength="255" /></div>
                <div><label>Modelo</label><input name="modelo" value={maquinaria.modelo} onChange={handleMaquinariaChange} placeholder="Modelo" maxLength="255" /></div>
                <div><label>Serie</label><input name="serie" value={maquinaria.serie} onChange={handleMaquinariaChange} placeholder="Número de serie" maxLength="100" /></div>
                <div><label>Ubicación</label><input name="ubicacion" value={maquinaria.ubicacion} onChange={handleMaquinariaChange} placeholder="Área o sede" maxLength="255" /></div>
                <div><label>Responsable</label><input name="responsable" value={maquinaria.responsable} onChange={handleMaquinariaChange} placeholder="Persona encargada" maxLength="255" /></div>
                <div><label>Fecha compra</label><input type="date" name="fecha_compra" value={maquinaria.fecha_compra} onChange={handleMaquinariaChange} /></div>
                <div><label>Valor compra</label><input type="number" name="valor_compra" value={maquinaria.valor_compra} onChange={handleMaquinariaChange} placeholder="0" min="0" step="0.01" /></div>
                <div className={styles["field-full"]}><label>Descripción</label><textarea name="descripcion" value={maquinaria.descripcion} onChange={handleMaquinariaChange} placeholder="Descripción técnica o general" maxLength="2000" /></div>
                <div className={styles["field-full"]}><label>Observación</label><textarea name="observacion" value={maquinaria.observacion} onChange={handleMaquinariaChange} placeholder="Notas internas, estado actual o recomendaciones" maxLength="2000" /></div>
              </div>

              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setModalMaquinaria(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>{esEdicionMaquinaria ? "Actualizar maquinaria" : "Registrar maquinaria"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMantenimiento && (
        <div className={styles["modal-overlay"]}>
          <div className={`${styles.modal} ${styles["modal-large"]}`}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>{esEdicionMantenimiento ? "Editar mantenimiento" : "Registrar mantenimiento"}</h3>
                <p>El costo registrado entrará automáticamente al módulo de gastos.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setModalMantenimiento(false)}>×</button>
            </div>

            <form onSubmit={guardarMantenimiento}>
              <div className={styles["maintenance-form-layout"]}>
                <div className={styles["form-grid"]}>
                  <div><label>Tipo</label><select name="tipo_mantenimiento" value={mantenimiento.tipo_mantenimiento} onChange={handleMantenimientoChange}><option>Preventivo</option><option>Correctivo</option><option>Predictivo</option><option>Calibración</option><option>Repuesto</option><option>Otro</option></select></div>
                  <div><label>Costo</label><input type="number" name="costo" value={mantenimiento.costo} onChange={handleMantenimientoChange} placeholder="0" min="0" step="0.01" /></div>
                  <div className={styles["field-full"]}><label>Descripción</label><input name="descripcion" value={mantenimiento.descripcion} onChange={handleMantenimientoChange} placeholder="Ej: Cambio de rodamientos, revisión eléctrica..." maxLength="500" /></div>
                  <div><label>Técnico</label><input name="tecnico" value={mantenimiento.tecnico} onChange={handleMantenimientoChange} placeholder="Nombre del técnico" maxLength="255" /></div>
                  <div><label>Proveedor / Taller</label><input name="proveedor" value={mantenimiento.proveedor} onChange={handleMantenimientoChange} placeholder="Empresa o proveedor" maxLength="255" /></div>
                  <div><label>Próximo mantenimiento</label><input type="date" name="fecha_proximo" value={mantenimiento.fecha_proximo} onChange={handleMantenimientoChange} /></div>
                  <div className={styles["field-full"]}><label>Observación</label><textarea name="observacion" value={mantenimiento.observacion} onChange={handleMantenimientoChange} placeholder="Detalle del trabajo realizado, repuestos usados o recomendaciones" maxLength="2000" /></div>
                </div>

                <aside className={styles["upload-panel"]}>
                  <div className={styles["upload-title"]}><span>Comprobante</span><small>Factura, recibo o soporte del mantenimiento</small></div>
                  <label className={styles["upload-card"]}>
                    <input type="file" accept="image/*,application/pdf" onChange={handleArchivo} />
                    {previewComprobante ? (
                      <img src={previewComprobante} alt="Vista previa" />
                    ) : mantenimiento.comprobante ? (
                      <div className={styles["upload-empty"]}><div className={styles["upload-icon"]}>✓</div><strong>Comprobante guardado</strong><span>Selecciona otro archivo para reemplazarlo.</span></div>
                    ) : (
                      <div className={styles["upload-empty"]}><div className={styles["upload-icon"]}>＋</div><strong>Adjuntar soporte</strong><span>Imagen o PDF del mantenimiento</span></div>
                    )}
                  </label>
                </aside>
              </div>

              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setModalMantenimiento(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>{esEdicionMantenimiento ? "Actualizar mantenimiento" : "Registrar mantenimiento"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEliminar && (
        <div className={styles["modal-overlay"]}>
          <div className={styles.modal}>
            <h3>Desactivar maquinaria</h3>
            <p>¿Seguro que deseas desactivar <strong>{maquinariaAEliminar?.nombre}</strong>? No se borrará su historial, solo dejará de aparecer como activa.</p>
            <div className={styles["modal-actions"]}>
              <button type="button" className={styles["btn-light"]} onClick={() => setModalEliminar(false)}>Cancelar</button>
              <button type="button" className={styles["btn-danger"]} onClick={eliminarMaquinaria}>Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
