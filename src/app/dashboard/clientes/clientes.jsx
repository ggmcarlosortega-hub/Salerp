"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./css/cliente.module.css";
import { useNotification } from "../../../context/NotificationContext";

import { API_CLIENTE, API_DOCUMENTO, getHeaders, getFileHeaders } from "@/utils/api";

const API_BASE = "http://localhost:3001";

const clienteInicial = {
  id_cliente: "",
  tipo_cliente: "Persona",
  nombre: "",
  apellido: "",
  tipo_documento: "CC",
  documento: "",
  telefono: "",
  direccion: "",
  correo: "",
  observacion: "",
};

const resumenInicial = {
  total_cotizaciones: 0,
  total_facturas: 0,
  total_contratos: 0,
  total_abonos: 0,
  total_facturado: 0,
  total_contratos_valor: 0,
  total_abonado: 0,
  saldo_pendiente: 0,
};

const documentoInicial = {
  asunto: "",
  iva: 0,
  descuento: 0,
  observaciones: "",
  condiciones_pago: "Anticipo del 50% del valor total. El restante se cancela a la hora de entregar los productos.",
  id_producto: "",
  cantidad: 1,
  items: [],
};

const contratoInicial = {
  id_factura: "",
  asunto: "",
  contratista: "CENTRO INDUSTRIAL DE LA MADERA",
  contratante: "",
  fecha_inicio: "",
  fecha_fin: "",
  valor_total: "",
  clausulas: "",
  observacion: "",
};

const abonoInicial = {
  id_factura: "",
  monto: "",
  metodo_pago: "Efectivo",
  referencia: "",
  observacion: "",
  comprobante: null,
};

export default function GestionClientes() {
  const [lista, setLista] = useState([]);
  const [vistaActual, setVistaActual] = useState("lista");

  const [cliente, setCliente] = useState(clienteInicial);
  const [resumen, setResumen] = useState(resumenInicial);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [productos, setProductos] = useState([]);

  const [tipoDocumentos, setTipoDocumentos] = useState("cotizaciones");
  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDoc, setBusquedaDoc] = useState("");
  const [menuDocumentoAbierto, setMenuDocumentoAbierto] = useState(null);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardandoDocumento, setGuardandoDocumento] = useState(false);

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [modalDocumento, setModalDocumento] = useState(null); // cotizacion | factura | contrato | abono
  const [clienteDirty, setClienteDirty] = useState(false);
  const [tipoConfirmarSalir, setTipoConfirmarSalir] = useState('documento'); // 'documento' | 'cliente'

  const [documentoForm, setDocumentoForm] = useState(documentoInicial);
  const [contratoForm, setContratoForm] = useState(contratoInicial);
  const [abonoForm, setAbonoForm] = useState(abonoInicial);

  const [documentoEnEdicion, setDocumentoEnEdicion] = useState(null);
  const [formDirty, setFormDirty] = useState(false);
  const [mostrarConfirmarSalir, setMostrarConfirmarSalir] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);

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
    cargarClientes();
    cargarDatosDocumento();
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
      return new Date(fecha).toLocaleDateString("es-CO");
    } catch {
      return "Sin fecha";
    }
  };

  const nombreCompletoCliente = (item = cliente) => {
    const nombre = item.nombre || "";
    const apellido = item.tipo_cliente === "Empresa" ? "" : item.apellido || "";
    return `${nombre} ${apellido}`.trim() || "Nuevo cliente";
  };

  const getArchivoUrl = (ruta) => {
    if (!ruta) return "";
    if (String(ruta).startsWith("http")) return ruta;
    return `${API_BASE}${ruta}`;
  };

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return lista.filter((c) => {
      return (
        c.nombre?.toLowerCase().includes(texto) ||
        c.apellido?.toLowerCase().includes(texto) ||
        c.documento?.toLowerCase().includes(texto) ||
        c.correo?.toLowerCase().includes(texto) ||
        c.telefono?.toLowerCase().includes(texto)
      );
    });
  }, [lista, busqueda]);

  const documentosActivos = useMemo(() => {
    if (tipoDocumentos === "cotizaciones") return cotizaciones;
    if (tipoDocumentos === "facturas") return facturas;
    if (tipoDocumentos === "contratos") return contratos;
    return abonos;
  }, [tipoDocumentos, cotizaciones, facturas, contratos, abonos]);

  const documentosFiltrados = useMemo(() => {
    const texto = busquedaDoc.toLowerCase();

    return documentosActivos.filter((doc) => {
      if (filtroEstado === "activos" && Number(doc.activo) !== 1) return false;
      if (filtroEstado === "desactivados" && Number(doc.activo) === 1) return false;

      return (
        String(doc.id_documento || "").toLowerCase().includes(texto) ||
        doc.titulo?.toLowerCase().includes(texto) ||
        doc.estado?.toLowerCase().includes(texto) ||
        doc.observacion?.toLowerCase().includes(texto) ||
        String(doc.total || "").includes(texto)
      );
    });
  }, [documentosActivos, busquedaDoc, filtroEstado]);

  const subtotalDocumento = useMemo(() => {
    return documentoForm.items.reduce((total, item) => {
      return total + Number(item.subtotal || 0);
    }, 0);
  }, [documentoForm.items]);

  const ivaDocumento = documentoForm.items.reduce((total, item) => {
    return total + Number(item.subtotal || 0) * (Number(item.iva_porcentaje || 0) / 100);
  }, 0);
  const descuentoValor = subtotalDocumento * (Number(documentoForm.descuento || 0) / 100);
  const totalDocumento = subtotalDocumento + ivaDocumento - descuentoValor;

  const facturasPendientes = useMemo(() => {
    return facturas.filter((f) => Number(f.saldo_pendiente ?? f.total ?? 0) > 0);
  }, [facturas]);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(API_CLIENTE, { headers: getHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar clientes.");
      }

      setLista(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosDocumento = async () => {
    try {
      const response = await fetch(`${API_DOCUMENTO}/datos`, { headers: getHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar productos para documentos.");
      }

      setProductos(data.productos || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarDetalleCliente = async (idCliente) => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(`${API_CLIENTE}/${idCliente}`, { headers: getHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar detalle del cliente.");
      }

      setCliente(data.cliente);
      setResumen(data.resumen || resumenInicial);
      setCotizaciones(data.cotizaciones || []);
      setFacturas(data.facturas || []);
      setContratos(data.contratos || []);
      setAbonos(data.abonos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const abrirDetalle = async (item) => {
    setMensaje("");
    setError("");
    setModoEdicion(false);
    setBusquedaDoc("");
    setMenuDocumentoAbierto(null);
    setVistaActual("detalle");
    await cargarDetalleCliente(item.id_cliente);
  };

  const nuevoCliente = () => {
    setCliente(clienteInicial);
    setResumen(resumenInicial);
    setCotizaciones([]);
    setFacturas([]);
    setContratos([]);
    setAbonos([]);
    setModoEdicion(true);
    setMensaje("");
    setError("");
    setClienteDirty(false);
    setMostrarModalCliente(true);
  };

  const volverLista = () => {
    setCliente(clienteInicial);
    setResumen(resumenInicial);
    setCotizaciones([]);
    setFacturas([]);
    setContratos([]);
    setAbonos([]);
    setModoEdicion(false);
    setClienteDirty(false);
    setVistaActual("lista");
    cargarClientes();
  };

  const manejarSalirCliente = (force = false) => {
    if (clienteDirty && !force) {
      setTipoConfirmarSalir('cliente');
      setMostrarConfirmarSalir(true);
      return;
    }
    volverLista();
  };

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setClienteDirty(true);

    setCliente((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipo_cliente" && value === "Empresa" ? { apellido: "", tipo_documento: "NIT" } : {}),
    }));
  };

  const guardarCliente = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!cliente.nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    if (!cliente.tipo_documento || !cliente.documento.trim()) {
      setError("El tipo de documento y el documento son obligatorios.");
      return;
    }

    try {
      const esEdicion = Boolean(cliente.id_cliente);

      const response = await fetch(
        esEdicion ? `${API_CLIENTE}/${cliente.id_cliente}` : API_CLIENTE,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(cliente),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar cliente.");
      }

      setMensaje(
        esEdicion
          ? "Cliente actualizado correctamente."
          : "Cliente registrado correctamente."
      );

      setModoEdicion(false);
      setClienteDirty(false);
      setMostrarModalCliente(false);

      if (esEdicion) {
        await cargarDetalleCliente(cliente.id_cliente);
      } else {
        setCliente(clienteInicial);
        setResumen(resumenInicial);
        setCotizaciones([]);
        setFacturas([]);
        setContratos([]);
        setAbonos([]);
        setVistaActual("lista");
      }

      cargarClientes();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmarDesactivacion = async () => {
    try {
      setMensaje("");
      setError("");

      const response = await fetch(`${API_CLIENTE}/${cliente.id_cliente}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al desactivar cliente.");
      }

      setMostrarModalConfirmacion(false);
      volverLista();
    } catch (err) {
      setError(err.message);
      setMostrarModalConfirmacion(false);
    }
  };

  const abrirModalDocumento = (tipo) => {
    setMensaje("");
    setError("");
    setDocumentoEnEdicion(null); // Aseguramos que entra en modo "Nuevo"
    setFormDirty(false);

    if (!cliente.id_cliente) {
      setError("Primero debes guardar el cliente para crear documentos.");
      return;
    }

    if (tipo === "cotizacion" || tipo === "factura") setDocumentoForm(documentoInicial);
    if (tipo === "contrato") setContratoForm({ ...contratoInicial, contratante: nombreCompletoCliente() });
    if (tipo === "abono") setAbonoForm(abonoInicial);

    setModalDocumento(tipo);
  };
  const cerrarModalDocumento = (force = false) => {
    if (formDirty && !force) {
      setTipoConfirmarSalir('documento');
      setMostrarConfirmarSalir(true);
      return;
    }
    setModalDocumento(null);
    setDocumentoEnEdicion(null);
    setDocumentoForm(documentoInicial);
    setContratoForm(contratoInicial);
    setAbonoForm(abonoInicial);
    setGuardandoDocumento(false);
    setFormDirty(false);
    setMostrarConfirmarSalir(false);
  };

  const handleDocumentoChange = (e) => {
    const { name, value } = e.target;
    setFormDirty(true);

    setDocumentoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarProductoDocumento = () => {
    setError("");
    setMensaje("");

    if (!documentoForm.id_producto) {
      setError("Selecciona un producto.");
      return;
    }

    if (!documentoForm.cantidad || Number(documentoForm.cantidad) <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    const producto = productos.find(
      (p) => Number(p.id_producto) === Number(documentoForm.id_producto)
    );

    if (!producto) {
      setError("Producto no encontrado.");
      return;
    }

    const precioConIva = Number(producto.precio_venta || 0);

    if (precioConIva <= 0) {
      setError(`El producto ${producto.nombre} no tiene precio de venta calculado.`);
      return;
    }

    const ivaProd = Number(producto.iva_porcentaje || 0);
    const precioUnitario = ivaProd > 0 ? precioConIva / (1 + ivaProd / 100) : precioConIva;

    const cantidad = Number(documentoForm.cantidad);

    setDocumentoForm((prev) => {
      const existe = prev.items.find(
        (item) => Number(item.id_producto) === Number(producto.id_producto)
      );

      if (existe) {
        return {
          ...prev,
          id_producto: "",
          cantidad: 1,
          items: prev.items.map((item) => {
            if (Number(item.id_producto) !== Number(producto.id_producto)) {
              return item;
            }

            const nuevaCantidad = Number(item.cantidad) + cantidad;

            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * Number(item.precio_unitario),
            };
          }),
        };
      }

      return {
        ...prev,
        id_producto: "",
        cantidad: 1,
          items: [
            ...prev.items,
            {
              id_producto: producto.id_producto,
              nombre: producto.nombre,
              tipo_producto: producto.tipo_producto,
              unidad_medida: producto.unidad_medida,
              cantidad,
              precio_unitario: precioUnitario,
              subtotal: precioUnitario * cantidad,
              costo_total: Number(producto.costo_total || 0),
              iva_porcentaje: Number(producto.iva_porcentaje || 0),
            },
          ],
      };
    });
  };

  const eliminarProductoDocumento = (idProducto) => {
    setDocumentoForm((prev) => ({
      ...prev,
      items: prev.items.filter(
        (item) => Number(item.id_producto) !== Number(idProducto)
      ),
    }));
  };

const guardarDocumentoComercial = async () => {
    const tipo = modalDocumento;
    // 1. Detectar si estamos editando o creando
    const esEdicion = Boolean(documentoEnEdicion);

    setMensaje("");
    setError("");

    if (!cliente.id_cliente) {
      setError("Primero debes guardar el cliente.");
      return;
    }

    if (!documentoForm.items.length) {
      setError("Debes agregar al menos un producto.");
      return;
    }

    if (totalDocumento < 0) {
      setError("El total no puede ser negativo.");
      return;
    }

    if (Number(documentoForm.descuento || 0) > 100) {
      setError("El descuento no puede ser mayor a 100%.");
      return;
    }

    try {
      setGuardandoDocumento(true);

      const endpoint = tipo === "cotizacion" ? "cotizacion" : "factura";

      const descuentoPorcentaje = Number(documentoForm.descuento || 0) / 100;
      const descuentoValorCalculado = subtotalDocumento * descuentoPorcentaje;

      const payload = {
        id_cliente: Number(cliente.id_cliente),
        asunto: documentoForm.asunto,
        iva: ivaDocumento,
        descuento: descuentoValorCalculado,
        observaciones: documentoForm.observaciones,
        condiciones_pago: documentoForm.condiciones_pago,
        items: documentoForm.items.map((item) => ({
          id_producto: Number(item.id_producto),
          cantidad: Number(item.cantidad),
        })),
      };

      // 2. Construir la URL dinámica (con ID si es PUT, sin ID si es POST)
      const idParaUrl = documentoEnEdicion?.id_documento || documentoEnEdicion?.id_factura || documentoEnEdicion?.id_cotizacion;
      
      const url = esEdicion
        ? `${API_DOCUMENTO}/${endpoint}/${idParaUrl}`
        : `${API_DOCUMENTO}/${endpoint}`;

      // 3. Enviar la petición dinámica (PUT o POST)
      const response = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar documento.");
      }

      // Si es edición usamos el ID que ya teníamos, si es nuevo usamos el que devuelve el backend
      const idDocumento = esEdicion ? idParaUrl : (tipo === "cotizacion" ? data.id_cotizacion : data.id_factura);

      setMensaje(
        tipo === "cotizacion"
          ? `Cotización ${esEdicion ? "actualizada" : "registrada"} correctamente. ID: ${idDocumento}`
          : `Factura ${esEdicion ? "actualizada" : "registrada"} correctamente. ID: ${idDocumento}`
      );

      cerrarModalDocumento(true);
      await cargarDetalleCliente(cliente.id_cliente);
      await cargarClientes();
      abrirPDFDocumento(tipo === "cotizacion" ? "Cotización" : "Factura", idDocumento);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoDocumento(false);
    }
  };

  const handleContratoChange = (e) => {
    const { name, value } = e.target;
    setFormDirty(true);

    if (name === "id_factura") {
      const factura = facturas.find(
        (f) => Number(f.id_documento) === Number(value)
      );

      setContratoForm((prev) => ({
        ...prev,
        id_factura: value,
        asunto: factura?.titulo || prev.asunto,
        valor_total: factura?.total || prev.valor_total,
      }));

      return;
    }

    setContratoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarContrato = async () => {
    setMensaje("");
    setError("");

    if (!contratoForm.asunto.trim()) {
      setError("El asunto del contrato es obligatorio.");
      return;
    }

    if (!contratoForm.valor_total || Number(contratoForm.valor_total) <= 0) {
      setError("El valor del contrato debe ser mayor a cero.");
      return;
    }

    try {
      setGuardandoDocumento(true);

      const esEdicion = Boolean(documentoEnEdicion);
      const idContrato = documentoEnEdicion?.id_documento;

      const payload = {
        id_cliente: Number(cliente.id_cliente),
        id_factura: contratoForm.id_factura || null,
        asunto: contratoForm.asunto,
        contratista: contratoForm.contratista,
        contratante: contratoForm.contratante || nombreCompletoCliente(),
        fecha_inicio: contratoForm.fecha_inicio || null,
        fecha_fin: contratoForm.fecha_fin || null,
        valor_total: Number(contratoForm.valor_total || 0),
        clausulas: contratoForm.clausulas,
        observacion: contratoForm.observacion,
      };

      const url = esEdicion
        ? `${API_DOCUMENTO}/contrato/${idContrato}`
        : `${API_DOCUMENTO}/contrato`;

      const response = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${esEdicion ? "actualizar" : "registrar"} contrato.`);
      }

      setMensaje(`Contrato ${esEdicion ? "actualizado" : "registrado"} correctamente. ID: ${esEdicion ? idContrato : data.id_contrato}`);
      cerrarModalDocumento(true);
      await cargarDetalleCliente(cliente.id_cliente);
      await cargarClientes();
      abrirPDFDocumento("Contrato", esEdicion ? idContrato : data.id_contrato);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoDocumento(false);
    }
  };

  const handleAbonoChange = (e) => {
    const { name, value, files } = e.target;
    setFormDirty(true);

    if (name === "comprobante") {
      setAbonoForm((prev) => ({
        ...prev,
        comprobante: files?.[0] || null,
      }));
      return;
    }

    setAbonoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarAbono = async () => {
    setMensaje("");
    setError("");

    if (!abonoForm.id_factura) {
      setError("Selecciona una factura para aplicar el abono.");
      return;
    }

    if (!abonoForm.monto || Number(abonoForm.monto) <= 0) {
      setError("El monto del abono debe ser mayor a cero.");
      return;
    }

    try {
      setGuardandoDocumento(true);

      const esEdicion = Boolean(documentoEnEdicion);
      const idAbono = documentoEnEdicion?.id_documento;

      const formData = new FormData();
      formData.append("id_cliente", cliente.id_cliente);
      formData.append("id_factura", abonoForm.id_factura);
      formData.append("monto", abonoForm.monto);
      formData.append("metodo_pago", abonoForm.metodo_pago);
      formData.append("referencia", abonoForm.referencia || "");
      formData.append("observacion", abonoForm.observacion || "");

      if (abonoForm.comprobante) {
        formData.append("comprobante", abonoForm.comprobante);
      }

      const url = esEdicion
        ? `${API_DOCUMENTO}/abono/${idAbono}`
        : `${API_DOCUMENTO}/abono`;

      const response = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: getFileHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${esEdicion ? "actualizar" : "registrar"} abono.`);
      }

      setMensaje(`Abono ${esEdicion ? "actualizado" : "registrado"} correctamente. ID: ${esEdicion ? idAbono : data.id_abono}`);
      cerrarModalDocumento(true);
      await cargarDetalleCliente(cliente.id_cliente);
      await cargarClientes();
      abrirPDFDocumento("Abono", esEdicion ? idAbono : data.id_abono);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoDocumento(false);
    }
  };

  const abrirPDFDocumento = (tipo, id) => {
    if (!id) return;

    const rutas = {
      Cotización: `${API_DOCUMENTO}/cotizacion/${id}/pdf`,
      Factura: `${API_DOCUMENTO}/factura/${id}/pdf`,
      Contrato: `${API_DOCUMENTO}/contrato/${id}/pdf`,
      Abono: `${API_DOCUMENTO}/abono/${id}/pdf`,
    };

    if (rutas[tipo]) {
      window.open(rutas[tipo], "_blank");
    }
  };

  const accionDocumento = async (accion, doc) => {
    setMenuDocumentoAbierto(null);

    if (accion === "pdf" || accion === "ver") {
      const mapTipo = {
        Cotización: "cotizacion",
        Factura: "factura",
        Contrato: "contrato",
        Abono: "abono",
      };
      const tipoEndpoint = mapTipo[doc.tipo_documento] || "factura";
      const url = `${API_DOCUMENTO}/${tipoEndpoint}/${doc.id_documento}/pdf`;
      window.open(url, "_blank");
      return;
    }

    if (accion === "modificar") {
      try {
        setCargando(true);
        setError("");
        setMensaje("");

        let endpoint = "";
        let tipoModal = "";
        
        if (doc.tipo_documento === "Cotización") { endpoint = "cotizacion"; tipoModal = "cotizacion"; }
        else if (doc.tipo_documento === "Factura") { endpoint = "factura"; tipoModal = "factura"; }
        else if (doc.tipo_documento === "Contrato") { endpoint = "contrato"; tipoModal = "contrato"; }
        else if (doc.tipo_documento === "Abono") { endpoint = "abono"; tipoModal = "abono"; }

        let data = {}; // Aquí guardaremos los datos (del backend o de fallback)

        // Intentamos obtener los detalles completos del backend
        try {
          const response = await fetch(`${API_DOCUMENTO}/${endpoint}/${doc.id_documento}`, { headers: getHeaders() });
          console.log(response);
          if (response.ok) {
            data = await response.json();
            console.log(data);
          } else {
            // Si el backend lanza 404, usamos los datos básicos que ya tenemos en la vista
            console.warn(`⚠️ Endpoint GET /api/documento/${endpoint}/${doc.id_documento} no encontrado. Usando datos básicos.`);
            data = doc; 
          }
        } catch (fetchError) {
          console.warn("⚠️ Error de conexión. Usando datos de la tabla.", fetchError);
          data = doc;
        }

        setDocumentoEnEdicion(doc); // Activamos el modo edición
        setFormDirty(false); // Formulario recien cargado, no esta sucio

        // Llenar los formularios con los datos obtenidos (o los de fallback)
        if (tipoModal === "cotizacion" || tipoModal === "factura") {
          setDocumentoForm({
            asunto: data.asunto || doc.titulo || "",
            iva: data.iva || 0,
            descuento: Number(data.descuento) > 0 && Number(data.subtotal) > 0
              ? Number(((Number(data.descuento) / Number(data.subtotal)) * 100).toFixed(2))
              : 0,
            observaciones: data.observaciones || doc.observacion || "",
            condiciones_pago: data.condiciones_pago || documentoInicial.condiciones_pago,
            id_producto: "",
            cantidad: 1,
            // Si el backend no devolvió items, dejamos el arreglo vacío temporalmente
            items: data.items || data.detalles ||[] 
          });
        } else if (tipoModal === "contrato") {
          setContratoForm({
            ...contratoInicial,
            id_factura: data.id_factura || doc.id_factura || "",
            asunto: data.asunto || doc.titulo || "",
            contratista: data.contratista || contratoInicial.contratista,
            contratante: data.contratante || nombreCompletoCliente(),
            fecha_inicio: data.fecha_inicio || "",
            fecha_fin: data.fecha_fin || "",
            valor_total: data.valor_total || doc.total || "",
            clausulas: data.clausulas || "",
            observacion: data.observacion || doc.observacion || ""
          });
        } else if (tipoModal === "abono") {
          setAbonoForm({
            ...abonoInicial,
            id_factura: data.id_factura || "",
            id_contrato: data.id_contrato || "",
            monto: data.monto || doc.total || "",
            metodo_pago: data.metodo_pago || abonoInicial.metodo_pago,
            referencia: data.referencia || "",
            observacion: data.observacion || doc.observacion || ""
          });
        }

        setModalDocumento(tipoModal); // Abrimos el modal
      } catch (err) {
        setError("Error al preparar el documento para edición.");
        console.error(err);
      } finally {
        setCargando(false);
      }
      return;
    }

    if (accion === "desactivar" || accion === "activar") {
      try {
        const mapTipo = {
          Cotización: "cotizacion",
          Factura: "factura",
          Contrato: "contrato",
          Abono: "abono",
        };
        const tipoEndpoint = mapTipo[doc.tipo_documento] || "factura";
        const url = accion === "activar"
          ? `${API_DOCUMENTO}/${tipoEndpoint}/${doc.id_documento}/reactivar`
          : `${API_DOCUMENTO}/${tipoEndpoint}/${doc.id_documento}`;
        const method = accion === "desactivar" ? "DELETE" : "PUT";
        const response = await fetch(url, { method, headers: getHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al cambiar estado del documento.");
        setMensaje(`${doc.tipo_documento} #${doc.id_documento} ${accion === "desactivar" ? "desactivado" : "activado"} correctamente.`);
        await cargarDetalleCliente(cliente.id_cliente);
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    if (accion === "aprobar") {
      try {
        const url = `${API_DOCUMENTO}/cotizacion/${doc.id_documento}/aprobar`;
        const response = await fetch(url, { method: "POST", headers: getHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al aprobar cotización.");
        setMensaje(`Cotización #${doc.id_documento} aprobada. Factura #${data.id_factura} creada.`);
        await cargarDetalleCliente(cliente.id_cliente);
      } catch (err) {
        setError(err.message);
      }
      return;
    }
  };
  const tituloDocumentos = {
    cotizaciones: "Cotizaciones",
    facturas: "Facturas",
    contratos: "Contratos",
    abonos: "Abonos",
  };

  const renderModalDocumentoComercial = () => {
    // 1. PRIMERO definimos qué tipo de documento es
    const esCotizacion = modalDocumento === "cotizacion";
    
    // 2. LUEGO usamos esa variable para los textos dinámicos de edición/creación
    const titulo = esCotizacion 
      ? (documentoEnEdicion ? "Modificar cotización" : "Nueva cotización") 
      : (documentoEnEdicion ? "Modificar factura" : "Nueva factura");

    const subtitulo = esCotizacion
      ? "La cotización no descuenta inventario. Solo reserva la información comercial."
      : "La factura registra la venta y descuenta inventario según productos y recetas.";

    return (
      <div className={styles["modal-overlay"]}>
        <div className={`${styles["modal"]} ${styles["modal-xl"]}`}>
          <div className={styles["modal-header"]}>
            <div>
              <span className={styles["modal-badge"]}>{esCotizacion ? "Cotización" : "Factura"}</span>
              <h3>{titulo}</h3>
              <p>{subtitulo}</p>
            </div>

            <button type="button" onClick={cerrarModalDocumento} className={styles["btn-close"]}>×</button>
          </div>

          <div className={styles["modal-body-grid"]}>
            <section className={styles["modal-section"]}>
              <h4>Datos del documento</h4>

              <div className={styles["mini-grid"]}>
                <div className={styles["field-full"]}>
                  <label>Cliente</label>
                  <input type="text" value={nombreCompletoCliente()} disabled />
                </div>

                <div className={styles["field-full"]}>
                  <label>Asunto</label>
                  <input
                    type="text"
                    name="asunto"
                    value={documentoForm.asunto}
                    onChange={handleDocumentoChange}
                    placeholder="Ej: Fabricación de puertas, venta de productos..."
                    maxLength="255"
                  />
                </div>

                <div>
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    name="descuento"
                    value={documentoForm.descuento}
                    onChange={handleDocumentoChange}
                  />
                </div>

                <div className={styles["field-full"]}>
                  <label>{esCotizacion ? "Observaciones" : "Observaciones de la factura"}</label>
                  <textarea
                    name="observaciones"
                    value={documentoForm.observaciones}
                    onChange={handleDocumentoChange}
                    placeholder="Notas que aparecerán en el documento..."
                    maxLength="2000"
                  />
                </div>

                <div className={styles["field-full"]}>
                  <label>Condiciones de pago</label>
                  <textarea
                    name="condiciones_pago"
                    value={documentoForm.condiciones_pago}
                    onChange={handleDocumentoChange}
                    maxLength="2000"
                  />
                </div>
              </div>
            </section>

            <section className={styles["modal-section"]}>
              <h4>Agregar productos</h4>

              <div className={styles["add-product-row"]}>
                <div>
                  <label>Producto</label>
                  <select
                    name="id_producto"
                    value={documentoForm.id_producto}
                    onChange={handleDocumentoChange}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>{p.nombre} - {formatoMoneda(p.precio_venta)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    name="cantidad"
                    value={documentoForm.cantidad}
                    onChange={handleDocumentoChange}
                  />
                </div>

                <button type="button" onClick={agregarProductoDocumento} className={styles["btn-primary"]}>
                  + Agregar
                </button>
              </div>

              <div className={styles["modal-table-wrap"]}>
                <table className={styles["table"]}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Costo</th>
                      <th>IVA %</th>
                      <th>IVA $</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {documentoForm.items.map((item) => {
                      const ivaItem = Number(item.subtotal || 0) * (Number(item.iva_porcentaje || 0) / 100);
                      const ivaP = Number(item.iva_porcentaje || 0);
                      const precioFinal = ivaP > 0 ? Number(item.precio_unitario) * (1 + ivaP / 100) : Number(item.precio_unitario);
                      return (
                        <tr key={item.id_producto}>
                          <td>
                            <strong>{item.nombre}</strong>
                            <span>{item.tipo_producto} · {item.unidad_medida || "Unidad"}</span>
                          </td>
                          <td>{Number(item.cantidad || 0).toFixed(3)}</td>
                          <td>
                            {formatoMoneda(item.precio_unitario)}
                            {ivaP > 0 && <small style={{ display: "block", color: "#64748b", fontSize: ".72rem" }}>con IVA: {formatoMoneda(precioFinal)}</small>}
                          </td>
                          <td>{formatoMoneda(item.costo_total)}</td>
                          <td>{ivaP}%</td>
                          <td>{formatoMoneda(ivaItem)}</td>
                          <td><strong>{formatoMoneda(item.subtotal)}</strong></td>
                          <td>
                            <button
                              type="button"
                              onClick={() => eliminarProductoDocumento(item.id_producto)}
                              className={styles["btn-delete-small"]}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {documentoForm.items.length === 0 && (
                      <tr>
                        <td colSpan="8" className={styles["empty"]}>No hay productos agregados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles["totals-panel"]}>
                <div><span>Subtotal</span><strong>{formatoMoneda(subtotalDocumento)}</strong></div>
                <div><span>IVA</span><strong>{formatoMoneda(ivaDocumento)}</strong></div>
                <div><span>Descuento ({documentoForm.descuento || 0}%)</span><strong>{formatoMoneda(descuentoValor)}</strong></div>
                <div className={styles["total-final"]}><span>Total</span><strong>{formatoMoneda(totalDocumento)}</strong></div>
              </div>
            </section>
          </div>

          <div className={styles["modal-actions"]}>
            <button type="button" onClick={cerrarModalDocumento} className={styles["btn-light"]}>Cancelar</button>
            <button type="button" onClick={guardarDocumentoComercial} className={styles["btn-primary"]} disabled={guardandoDocumento}>
              {guardandoDocumento 
                ? "Guardando..." 
                : `${documentoEnEdicion ? "Actualizar" : "Guardar"} ${esCotizacion ? "cotización" : "factura"}`
              }
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderModalContrato = () => (
    <div className={styles["modal-overlay"]}>
      <div className={`${styles["modal"]} ${styles["modal-lg"]}`}>
        <div className={styles["modal-header"]}>
          <div>
            <span className={styles["modal-badge"]}>Contrato</span>
            <h3>{documentoEnEdicion ? "Modificar contrato" : "Nuevo contrato"}</h3>
            <p>Genera un contrato de obra menor para este cliente. Puede relacionarse con una factura.</p>
          </div>
          <button type="button" onClick={cerrarModalDocumento} className={styles["btn-close"]}>×</button>
        </div>

        <div className={styles["mini-grid"]}>
          <div className={styles["field-full"]}>
            <label>Relacionar factura opcional</label>
            <select
              name="id_factura"
              value={contratoForm.id_factura}
              onChange={handleContratoChange}
            >
              <option value="">Sin factura relacionada</option>
              {facturas.map(f => (
                <option key={f.id_documento} value={f.id_documento}>Factura #{f.id_documento} - {formatoMoneda(f.total)}</option>
              ))}
            </select>
          </div>

          <div className={styles["field-full"]}>
            <label>Objeto / asunto</label>
            <input name="asunto" value={contratoForm.asunto} onChange={handleContratoChange} placeholder="Ej: Fabricación e instalación de puertas..." maxLength="255" />
          </div>

          <div>
            <label>Contratista</label>
            <input name="contratista" value={contratoForm.contratista} onChange={handleContratoChange} maxLength="255" />
          </div>

          <div>
            <label>Contratante</label>
            <input name="contratante" value={contratoForm.contratante} onChange={handleContratoChange} maxLength="255" />
          </div>

          <div>
            <label>Fecha inicio</label>
            <input type="date" name="fecha_inicio" value={contratoForm.fecha_inicio} onChange={handleContratoChange} />
          </div>

          <div>
            <label>Fecha fin</label>
            <input type="date" name="fecha_fin" value={contratoForm.fecha_fin} onChange={handleContratoChange} />
          </div>

          <div>
            <label>Valor total</label>
            <input type="number" name="valor_total" min="0" step="0.01" value={contratoForm.valor_total} onChange={handleContratoChange} placeholder="0" />
          </div>

          <div className={styles["field-full"]}>
            <label>Cláusulas adicionales</label>
            <textarea name="clausulas" value={contratoForm.clausulas} onChange={handleContratoChange} placeholder="Escribe cláusulas adicionales si las necesitas..." maxLength="5000" />
          </div>

          <div className={styles["field-full"]}>
            <label>Observación interna</label>
            <textarea name="observacion" value={contratoForm.observacion} onChange={handleContratoChange} placeholder="Notas internas del contrato..." maxLength="2000" />
          </div>
        </div>

        <div className={styles["modal-actions"]}>
          <button type="button" onClick={cerrarModalDocumento} className={styles["btn-light"]}>Cancelar</button>
          <button type="button" onClick={guardarContrato} className={styles["btn-primary"]} disabled={guardandoDocumento}>
            {guardandoDocumento ? "Guardando..." : (documentoEnEdicion ? "Actualizar contrato" : "Guardar contrato")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderModalAbono = () => (
    <div className={styles["modal-overlay"]}>
      <div className={`${styles["modal"]} ${styles["modal-lg"]}`}>
        <div className={styles["modal-header"]}>
          <div>
            <span className={styles["modal-badge"]}>Abono</span>
            <h3>{documentoEnEdicion ? "Modificar abono" : "Registrar abono"}</h3>
            <p>Registra pagos parciales o totales sobre facturas del cliente.</p>
          </div>
          <button type="button" onClick={cerrarModalDocumento} className={styles["btn-close"]}>×</button>
        </div>

        <div className={styles["mini-grid"]}>
          {facturasPendientes.length === 0 ? (
            <div className={styles["field-full"]}>
              <p className="text-sm text-gray-500 text-center py-4">No hay facturas pendientes para este cliente.</p>
            </div>
          ) : (
            <>
              <div>
                <label>Factura</label>
                <select
                  name="id_factura"
                  value={abonoForm.id_factura}
                  onChange={handleAbonoChange}
                >
                  <option value="">Seleccionar factura</option>
                  {facturasPendientes.map(f => (
                    <option key={f.id_documento} value={f.id_documento}>Factura #{f.id_documento} - Saldo {formatoMoneda(f.saldo_pendiente ?? f.total)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Monto</label>
                <input type="number" name="monto" min="0" step="0.01" value={abonoForm.monto} onChange={handleAbonoChange} placeholder="0" />
              </div>

              <div>
                <label>Método de pago</label>
                <select name="metodo_pago" value={abonoForm.metodo_pago} onChange={handleAbonoChange}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label>Referencia</label>
                <input name="referencia" value={abonoForm.referencia} onChange={handleAbonoChange} placeholder="N° transferencia, recibo, nota..." maxLength="255" />
              </div>

              <div>
                <label>Comprobante</label>
                <input type="file" name="comprobante" accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf" onChange={handleAbonoChange} />
              </div>

              <div className={styles["field-full"]}>
                <label>Observación</label>
                <textarea name="observacion" value={abonoForm.observacion} onChange={handleAbonoChange} placeholder="Detalles del pago o comprobante..." maxLength="2000" />
              </div>
            </>
          )}
        </div>

        {facturasPendientes.length > 0 && (
          <div className={styles["modal-actions"]}>
            <button type="button" onClick={cerrarModalDocumento} className={styles["btn-light"]}>Cancelar</button>
            <button type="button" onClick={guardarAbono} className={styles["btn-primary"]} disabled={guardandoDocumento}>
              {guardandoDocumento ? "Guardando..." : (documentoEnEdicion ? "Actualizar abono" : "Registrar abono")}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmarSalir = () => (
    <div className={styles["modal-overlay"]}>
      <div className={`${styles["modal"]} ${styles["modal-sm"]}`}>
        <div className={styles["modal-header"]}>
          <h3>¿Salir sin guardar?</h3>
        </div>
        <div className={styles["modal-body"]}>
          <p>Tenés cambios sin guardar. Si salís ahora, se perderán.</p>
        </div>
        <div className={styles["modal-actions"]}>
          <button type="button" onClick={() => setMostrarConfirmarSalir(false)} className={styles["btn-light"]}>
            Quedarme
          </button>
          <button type="button" onClick={() => {
            setMostrarConfirmarSalir(false);
            if (tipoConfirmarSalir === 'cliente') {
              volverLista();
            } else {
              cerrarModalDocumento(true);
            }
          }} className={styles["btn-primary"]}>
            Salir sin guardar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles["page"]}>
      {mostrarConfirmarSalir && (
        <div className={styles["modal-overlay"]} onClick={(e) => { if (e.target === e.currentTarget) setMostrarConfirmarSalir(false); }}>
          <div className={`${styles["modal"]} ${styles["modal-sm"]}`}>
            <div className={styles["modal-header"]}>
              <h3>¿Salir sin guardar?</h3>
            </div>
            <div className={styles["modal-body"]}>
              <p>Tenés cambios sin guardar. Si salís ahora, se perderán.</p>
            </div>
            <div className={styles["modal-actions"]}>
              <button type="button" onClick={() => setMostrarConfirmarSalir(false)} className={styles["btn-light"]}>Quedarme</button>
              <button type="button" onClick={() => {
                setMostrarConfirmarSalir(false);
                if (tipoConfirmarSalir === 'cliente') {
                  volverLista();
                } else {
                  cerrarModalDocumento(true);
                }
              }} className={styles["btn-primary"]}>Salir sin guardar</button>
            </div>
          </div>
        </div>
      )}

      {vistaActual === "lista" && (
        <>
          <section className={styles["hero"]}>
            <div>
              <span className={styles["hero-badge"]}>Relación comercial</span>
              <h1>Gestión de clientes</h1>
              <p>
                Administra clientes, cotizaciones, facturas, contratos, abonos y saldo pendiente en un solo lugar.
              </p>
            </div>

            <button onClick={nuevoCliente} className={styles["btn-hero"]}>
              + Nuevo cliente
            </button>
          </section>

          <section className={styles["panel"]}>
            <div className={styles["panel-header"]}>
              <div>
                <h2>Clientes registrados</h2>
                <p>Consulta información general y estado comercial de cada cliente.</p>
              </div>

              <div className={styles["search-box"]}>
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className={styles["table-wrap"]}>
              <table className={styles["table"]}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Contacto</th>
                    <th>Facturado</th>
                    <th>Saldo</th>
                    <th>Documentos</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {clientesFiltrados.map((item) => (
                    <tr key={item.id_cliente} onClick={() => abrirDetalle(item)}>
                      <td>
                        <div className={styles["client-cell"]}>
                          <div className={styles["client-icon"]}>
                            {item.nombre?.charAt(0)?.toUpperCase() || "C"}
                          </div>

                          <div>
                            <strong>{nombreCompletoCliente(item)}</strong>
                            <span>{item.correo || "Sin correo registrado"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{item.tipo_documento || "Doc"}: {item.documento}</strong>
                        <span>{item.tipo_cliente || "Persona"}</span>
                      </td>

                      <td>
                        <strong>{item.telefono || "Sin teléfono"}</strong>
                        <span>{item.direccion || "Sin dirección"}</span>
                      </td>

                      <td>{formatoMoneda(item.resumen?.total_facturado)}</td>

                      <td>
                        <span
                          className={
                            Number(item.resumen?.saldo_pendiente || 0) > 0
                              ? styles["pill-danger"]
                              : styles["pill-success"]
                          }
                        >
                          {formatoMoneda(item.resumen?.saldo_pendiente)}
                        </span>
                      </td>

                      <td>
                        <span className={styles["pill-blue"]}>
                          {(item.resumen?.total_cotizaciones || 0) +
                            (item.resumen?.total_facturas || 0) +
                            (item.resumen?.total_contratos || 0) +
                            (item.resumen?.total_abonos || 0)}{" "}
                          registros
                        </span>
                      </td>

                      <td>
                        <button
                          className={styles["btn-table"]}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalle(item);
                          }}
                        >
                          Ver historial
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!cargando && clientesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="7" className={styles["empty"]}>
                        No hay clientes registrados.
                      </td>
                    </tr>
                  )}

                  {cargando && (
                    <tr>
                      <td colSpan="7" className={styles["empty"]}>
                        Cargando clientes...
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
          <button onClick={manejarSalirCliente} className={styles["back-btn"]}>
            ← Volver a clientes
          </button>

          <section className={styles["detail-hero"]}>
            <div className={styles["detail-title"]}>
              <div className={styles["big-icon"]}>
                {cliente.nombre?.charAt(0)?.toUpperCase() || "C"}
              </div>

              <div>
                <span>{cliente.tipo_cliente || "Cliente"}</span>
                <h1>{nombreCompletoCliente()}</h1>
                <p>
                  {cliente.tipo_documento || "Doc"} {cliente.documento || "Sin documento"} ·{" "}
                  {cliente.telefono || "Sin teléfono"}
                </p>
              </div>
            </div>

            <div className={styles["detail-actions"]}>
              {cliente.id_cliente && !modoEdicion && (
                <>
                  <button type="button" onClick={() => setModoEdicion(true)} className={styles["btn-secondary"]}>
                    Editar cliente
                  </button>

                  <button type="button" onClick={() => setMostrarModalConfirmacion(true)} className={styles["btn-danger"]}>
                    Desactivar
                  </button>
                </>
              )}
            </div>
          </section>

          {cliente.id_cliente && (
            <section className={styles["summary-grid"]}>
              <article className={styles["summary-card"]}>
                <span>Total facturado</span>
                <strong>{formatoMoneda(resumen.total_facturado)}</strong>
                <small>Ventas registradas al cliente</small>
              </article>

              <article className={styles["summary-card"]}>
                <span>Saldo pendiente</span>
                <strong>{formatoMoneda(resumen.saldo_pendiente)}</strong>
                <small>Facturas y contratos por cobrar</small>
              </article>

              <article className={styles["summary-card"]}>
                <span>Abonos</span>
                <strong>{formatoMoneda(resumen.total_abonado)}</strong>
                <small>Pagos registrados</small>
              </article>

              <article className={styles["summary-card"]}>
                <span>Documentos</span>
                <strong>
                  {Number(resumen.total_cotizaciones || 0) +
                    Number(resumen.total_facturas || 0) +
                    Number(resumen.total_contratos || 0) +
                    Number(resumen.total_abonos || 0)}
                </strong>
                <small>Historial comercial</small>
              </article>
            </section>
          )}

          <section className={styles["content-grid"]}>
            <form onSubmit={guardarCliente} className={styles["card"]} style={{ gridColumn: cliente.id_cliente ? undefined : "1 / -1" }}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Información del cliente</h2>
                  <p>Datos principales para cotizaciones, facturas, contratos y abonos.</p>
                </div>
              </div>

              <div className={styles["form-grid"]}>
                <div>
                  <label>Tipo de cliente</label>
                  <select name="tipo_cliente" value={cliente.tipo_cliente || "Persona"} onChange={handleClienteChange} disabled={!modoEdicion}>
                    <option value="Persona">Persona</option>
                    <option value="Empresa">Empresa</option>
                  </select>
                </div>

                <div>
                  <label>Tipo documento</label>
                  <select name="tipo_documento" value={cliente.tipo_documento || "CC"} onChange={handleClienteChange} disabled={!modoEdicion}>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label>Documento</label>
                  <input type="text" name="documento" value={cliente.documento || ""} onChange={handleClienteChange} disabled={!modoEdicion} placeholder="Documento" maxLength="50" />
                </div>

                <div className={styles["field-large"]}>
                  <label>Nombre / Razón social</label>
                  <input type="text" name="nombre" value={cliente.nombre || ""} onChange={handleClienteChange} disabled={!modoEdicion} placeholder="Nombre del cliente" maxLength="255" />
                </div>

                <div>
                  <label>Apellido</label>
                  <input type="text" name="apellido" value={cliente.apellido || ""} onChange={handleClienteChange} disabled={!modoEdicion || cliente.tipo_cliente === "Empresa"} placeholder="Apellido" maxLength="255" />
                </div>

                <div>
                  <label>Teléfono</label>
                  <input type="tel" name="telefono" value={cliente.telefono || ""} onChange={handleClienteChange} disabled={!modoEdicion} placeholder="Teléfono" pattern="[\d\s+\-()]{7,20}" title="Ingresa un número de teléfono válido (7-20 dígitos)" maxLength="20" />
                </div>

                <div>
                  <label>Correo</label>
                  <input type="email" name="correo" value={cliente.correo || ""} onChange={handleClienteChange} disabled={!modoEdicion} placeholder="correo@cliente.com" maxLength="255" />
                </div>

                <div className={styles["field-full"]}>
                  <label>Dirección</label>
                  <input type="text" name="direccion" value={cliente.direccion || ""} onChange={handleClienteChange} disabled={!modoEdicion} placeholder="Dirección" maxLength="255" />
                </div>

                <div className={styles["field-full"]}>
                  <label>Observación</label>
                  <textarea name="observacion" value={cliente.observacion || ""} onChange={handleClienteChange} disabled={!modoEdicion} placeholder="Notas internas del cliente..." maxLength="2000" />
                </div>
              </div>

              {modoEdicion && (
                <div className={styles["form-actions"]}>
                  <button type="submit" className={styles["btn-primary"]}>Guardar cliente</button>

                  {cliente.id_cliente && (
                    <button type="button" onClick={() => manejarSalirCliente()} className={styles["btn-light"]}>Cancelar</button>
                  )}
                </div>
              )}
            </form>

            {cliente.id_cliente && (
              <section className={styles["card"]}>
                <div className={styles["card-header"]}>
                  <div>
                    <h2>Acciones rápidas</h2>
                    <p>Crea documentos asociados directamente a este cliente.</p>
                  </div>
                </div>

                <div className={styles["quick-actions"]}>
                  <button type="button" onClick={() => abrirModalDocumento("cotizacion")} className={styles["quick-card"]}>
                    <span>＋</span>
                    <div><strong>Nueva cotización</strong><small>No descuenta inventario</small></div>
                  </button>

                  <button type="button" onClick={() => abrirModalDocumento("factura")} className={styles["quick-card"]}>
                    <span>＋</span>
                    <div><strong>Nueva factura</strong><small>Descuenta inventario</small></div>
                  </button>

                  <button type="button" onClick={() => abrirModalDocumento("contrato")} className={styles["quick-card"]}>
                    <span>＋</span>
                    <div><strong>Nuevo contrato</strong><small>Puede salir desde factura</small></div>
                  </button>

                  <button type="button" onClick={() => abrirModalDocumento("abono")} className={styles["quick-card"]}>
                    <span>＋</span>
                    <div><strong>Registrar abono</strong><small>Pago o comprobante</small></div>
                  </button>
                </div>
              </section>
            )}
          </section>

          {cliente.id_cliente && (
            <section className={`${styles["card"]} ${styles["card-documentos"]}`}>
              <div className={styles["card-header"]}>
                <div>
                  <h2>Historial del cliente</h2>
                  <p>Cotizaciones, facturas, contratos y abonos relacionados con este cliente.</p>
                </div>

                <div className={styles["doc-toolbar"]}>
                  <select
                    value={tipoDocumentos}
                    onChange={(e) => {
                      setTipoDocumentos(e.target.value);
                      setBusquedaDoc("");
                      setMenuDocumentoAbierto(null);
                    }}
                  >
                    <option value="cotizaciones">Cotizaciones</option>
                    <option value="facturas">Facturas</option>
                    <option value="contratos">Contratos</option>
                    <option value="abonos">Abonos</option>
                  </select>
                  <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="activos">Activos</option>
                    <option value="desactivados">Desactivados</option>
                    <option value="todos">Todos</option>
                  </select>
                  <input type="text" placeholder={`Buscar en ${tituloDocumentos[tipoDocumentos]}...`} value={busquedaDoc} onChange={(e) => setBusquedaDoc(e.target.value)} />
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
                    {documentosFiltrados.map((doc) => (
                      <tr key={`${tipoDocumentos}-${doc.id_documento}`}>
                        <td>
                          <strong>{doc.tipo_documento} #{doc.id_documento}</strong>
                          <span>{doc.titulo || "Sin asunto"}</span>
                        </td>

                        <td>{formatoFecha(doc.fecha)}</td>

                        <td>
                          <span
                            className={
                              Number(doc.activo) !== 1
                                ? styles["pill-gray"]
                                : doc.estado === "Pagada" ||
                                  doc.estado === "Aprobada" ||
                                  doc.estado === "Activo" ||
                                  doc.estado === "Efectivo"
                                ? styles["pill-success"]
                                : styles["pill-blue"]
                            }
                          >
                            {Number(doc.activo) !== 1 ? "Desactivado" : doc.estado || "Sin estado"}
                          </span>
                        </td>

                        <td><strong>{formatoMoneda(doc.total)}</strong></td>

                        <td>{doc.observacion || "Sin observación"}</td>

                        <td className={styles["actions-cell"]}>
                          <button
                            type="button"
                            className={styles["btn-dots"]}
                            onClick={() => setMenuDocumentoAbierto(menuDocumentoAbierto === `${tipoDocumentos}-${doc.id_documento}` ? null : `${tipoDocumentos}-${doc.id_documento}`)}
                          >
                            ⋮
                          </button>

                          {menuDocumentoAbierto === `${tipoDocumentos}-${doc.id_documento}` && (
                            <div className={styles["doc-menu"]}>
                              {Number(doc.activo) === 1 ? (
                                <>
                                  <button type="button" onClick={() => accionDocumento("modificar", doc)}>Modificar</button>
                                  <button type="button" onClick={() => accionDocumento("desactivar", doc)}>Desactivar</button>
                                  {doc.tipo_documento === "Cotización" && doc.estado !== "Aprobada" && (
                                    <button type="button" onClick={() => accionDocumento("aprobar", doc)} className={styles["btn-aprobar"]}>Aprobar</button>
                                  )}
                                </>
                              ) : (
                                <button type="button" onClick={() => accionDocumento("activar", doc)}>Activar</button>
                              )}
                              <button type="button" onClick={() => accionDocumento("pdf", doc)}>
                                {doc.tipo_documento === "Abono" ? "Ver comprobante" : "Ver PDF"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {documentosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="6" className={styles["empty"]}>
                          {filtroEstado === "activos"
                            ? `No hay ${tituloDocumentos[tipoDocumentos].toLowerCase()} activos para este cliente.`
                            : filtroEstado === "desactivados"
                            ? `No hay ${tituloDocumentos[tipoDocumentos].toLowerCase()} desactivados para este cliente.`
                            : `No hay ${tituloDocumentos[tipoDocumentos].toLowerCase()} registrados para este cliente.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {mostrarModalConfirmacion && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <h3>Desactivar cliente</h3>
            <p>¿Seguro que deseas desactivar a <strong>{nombreCompletoCliente()}</strong>? El cliente dejará de aparecer en la lista principal.</p>

            <div className={styles["modal-actions"]}>
              <button onClick={() => setMostrarModalConfirmacion(false)} className={styles["btn-light"]}>Cancelar</button>
              <button onClick={confirmarDesactivacion} className={styles["btn-danger"]}>Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}

      {(modalDocumento === "cotizacion" || modalDocumento === "factura") && renderModalDocumentoComercial()}
      {modalDocumento === "contrato" && renderModalContrato()}
      {modalDocumento === "abono" && renderModalAbono()}

      {mostrarModalCliente && (
        <div className={styles["modal-overlay"]} onClick={() => setMostrarModalCliente(false)}>
          <div className={`${styles.modal} ${styles["modal-lg"]}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "38rem" }}>
            <div className={styles["modal-header"]}>
              <div>
                <h3>{modoEdicion && cliente.id_cliente ? "Editar cliente" : "Nuevo cliente"}</h3>
                <p>Registra los datos principales del cliente.</p>
              </div>
              <button type="button" className={styles["btn-close"]} onClick={() => setMostrarModalCliente(false)}>×</button>
            </div>

            <form onSubmit={guardarCliente}>
              <div className={styles["form-grid"]}>
                <div>
                  <label>Tipo de cliente</label>
                  <select name="tipo_cliente" value={cliente.tipo_cliente || "Persona"} onChange={handleClienteChange}>
                    <option value="Persona">Persona</option>
                    <option value="Empresa">Empresa</option>
                  </select>
                </div>

                <div>
                  <label>Tipo documento</label>
                  <select name="tipo_documento" value={cliente.tipo_documento || "CC"} onChange={handleClienteChange}>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label>Documento</label>
                  <input type="text" name="documento" value={cliente.documento || ""} onChange={handleClienteChange} placeholder="Documento" maxLength="50" />
                </div>

                <div className={styles["field-large"]}>
                  <label>Nombre / Razón social</label>
                  <input type="text" name="nombre" value={cliente.nombre || ""} onChange={handleClienteChange} placeholder="Nombre del cliente" maxLength="255" />
                </div>

                <div>
                  <label>Apellido</label>
                  <input type="text" name="apellido" value={cliente.apellido || ""} onChange={handleClienteChange} disabled={cliente.tipo_cliente === "Empresa"} placeholder="Apellido" maxLength="255" />
                </div>

                <div>
                  <label>Teléfono</label>
                  <input type="tel" name="telefono" value={cliente.telefono || ""} onChange={handleClienteChange} placeholder="Teléfono" pattern="[\d\s+\-()]{7,20}" title="Ingresa un número de teléfono válido (7-20 dígitos)" maxLength="20" />
                </div>

                <div>
                  <label>Correo</label>
                  <input type="email" name="correo" value={cliente.correo || ""} onChange={handleClienteChange} placeholder="correo@cliente.com" maxLength="255" />
                </div>

                <div className={styles["field-full"]}>
                  <label>Dirección</label>
                  <input type="text" name="direccion" value={cliente.direccion || ""} onChange={handleClienteChange} placeholder="Dirección" maxLength="255" />
                </div>

                <div className={styles["field-full"]}>
                  <label>Observación</label>
                  <textarea name="observacion" value={cliente.observacion || ""} onChange={handleClienteChange} placeholder="Notas internas del cliente..." maxLength="2000" />
                </div>
              </div>

              <div className={styles["modal-actions"]}>
                <button type="button" className={styles["btn-light"]} onClick={() => setMostrarModalCliente(false)}>Cancelar</button>
                <button type="submit" className={styles["btn-primary"]}>
                  {modoEdicion && cliente.id_cliente ? "Actualizar cliente" : "Registrar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}