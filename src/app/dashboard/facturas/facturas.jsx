'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './css/facturas.module.css';

export default function Facturas() {
  const contenedorRef = useRef(null);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [idCliente, setIdCliente] = useState('');

  const [asunto, setAsunto] = useState('');
  const [idProducto, setIdProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const [items, setItems] = useState([]);

  const [iva, setIva] = useState(0);
  const [descuento, setDescuento] = useState(0);

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api/factura';

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setError('');

      const respuesta = await fetch(`${API_URL}/datos`);

      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar los datos.');
      }

      const data = await respuesta.json();

      setClientes(data.clientes || []);
      setProductos(data.productos || []);
    } catch (error) {
      console.error(error);
      setError(`Error cargando datos: ${error.message}`);
    }
  };

  const descargarPDF = async (idFactura) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/factura/${idFactura}/pdf`
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error generando el PDF');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Factura-${idFactura}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error descargando el PDF');
    }
  };

  const seleccionarCliente = (e) => {
    const id = e.target.value;
    setIdCliente(id);

    const cliente = clientes.find(
      (c) => Number(c.id_cliente) === Number(id)
    );

    setClienteSeleccionado(cliente || null);
  };

  const agregarProducto = () => {
    setError('');
    setMensaje('');

    if (!idProducto) {
      setError('Debe seleccionar un producto.');
      return;
    }

    if (!cantidad || Number(cantidad) <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    const producto = productos.find(
      (p) => Number(p.id_producto) === Number(idProducto)
    );

    if (!producto) {
      setError('Producto no encontrado.');
      return;
    }

    const productoYaExiste = items.find(
      (item) => Number(item.id_producto) === Number(producto.id_producto)
    );

    if (productoYaExiste) {
      const nuevosItems = items.map((item) => {
        if (Number(item.id_producto) === Number(producto.id_producto)) {
          const nuevaCantidad = Number(item.cantidad) + Number(cantidad);

          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * Number(item.precio_unitario)
          };
        }

        return item;
      });

      setItems(nuevosItems);
    } else {
      const nuevoItem = {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        cantidad: Number(cantidad),
        precio_unitario: Number(producto.precio),
        subtotal: Number(producto.precio) * Number(cantidad)
      };

      setItems([...items, nuevoItem]);
    }

    setIdProducto('');
    setCantidad(1);
  };

  const eliminarProducto = (id_producto) => {
    const nuevosItems = items.filter(
      (item) => Number(item.id_producto) !== Number(id_producto)
    );

    setItems(nuevosItems);
  };

  const subtotalGeneral = items.reduce((total, item) => {
    return total + Number(item.subtotal);
  }, 0);

  const valorIva = subtotalGeneral * (Number(iva || 0) / 100);

  const totalFinal = subtotalGeneral + valorIva - Number(descuento || 0);

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  };

  const guardarFactura = async () => {
  try {
    setError('');
    setMensaje('');

    if (!idCliente) {
      setError('Debe seleccionar un cliente.');
      return;
    }

    if (items.length === 0) {
      setError('Debe agregar al menos un producto.');
      return;
    }

    if (totalFinal < 0) {
      setError('El total final no puede ser negativo.');
      return;
    }

    const datosFactura = {
      id_cliente: Number(idCliente),
      asunto,
      iva: Number(iva || 0),
      descuento: Number(descuento || 0),
      items: items.map((item) => ({
        id_producto: Number(item.id_producto),
        cantidad: Number(item.cantidad)
      }))
    };

    console.log('Datos enviados al backend:', datosFactura);

    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosFactura)
    });

    const data = await respuesta.json();

    console.log('Respuesta del backend:', data);

    if (!respuesta.ok) {
      throw new Error(data.error || 'Error guardando la Factura.');
    }

    const idFactura =
      data?.data?.id_factura ||
      data?.id_factura ||
      data?.resultado?.id_factura ||
      '';

    if (idFactura) {
      setMensaje(`Factura guardada correctamente. ID: ${idFactura}`);
    } else {
      setMensaje('Factura guardada correctamente.');
    }
    descargarPDF(idFactura);
    window.scrollTo(0, 0);
    limpiarFormulario();

  } catch (error) {
    console.error('Error al guardar Factura:', error);
    setError(error.message);
  }
};

  const limpiarFormulario = () => {
    setIdCliente('');
    setClienteSeleccionado(null);
    setAsunto('');
    setIdProducto('');
    setCantidad(1);
    setItems([]);
    setIva(0);
    setDescuento(0);
  };

  return (
    <div ref={contenedorRef}className={styles.container}>
      <h1>Nueva Factura</h1>

      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}

      {mensaje && (
        <div className={styles.alertSuccess}>
          {mensaje}
        </div>
      )}

      <div className={styles.gridCliente}>
        <div className={styles.formGroup}>
          <label>Cliente:</label>

          <select
            value={idCliente}
            onChange={seleccionarCliente}
            className={styles.select}
          >
            <option value="">-- Seleccione un cliente --</option>

            {clientes.map((cliente) => (
              <option
                key={cliente.id_cliente}
                value={cliente.id_cliente}
              >
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Identificación:</label>

          <input
            type="text"
            value={clienteSeleccionado?.documento || ''}
            readOnly
            className={`${styles.input} ${styles.inputReadonly}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Ciudad / Dirección:</label>

          <input
            type="text"
            value={clienteSeleccionado?.direccion || ''}
            readOnly
            className={`${styles.input} ${styles.inputReadonly}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Email:</label>

          <input
            type="text"
            value={clienteSeleccionado?.correo || ''}
            readOnly
            className={`${styles.input} ${styles.inputReadonly}`}
          />
        </div>
      </div>

      <div className={`${styles.formGroup} ${styles.asunto}`}>
        <label>Asunto:</label>

        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          className={styles.input}
        />
      </div>

      <hr className={styles.separador} />

      <div className={styles.gridProductos}>
        <div className={styles.formGroup}>
          <label>Producto:</label>

          <select
            value={idProducto}
            onChange={(e) => setIdProducto(e.target.value)}
            className={styles.select}
          >
            <option value="">-- Seleccione un producto --</option>

            {productos.map((producto) => (
              <option
                key={producto.id_producto}
                value={producto.id_producto}
              >
                {producto.nombre} - {formatoMoneda(producto.precio)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Cantidad:</label>

          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          type="button"
          onClick={agregarProducto}
          className={`${styles.btn} ${styles.btnAgregar}`}
        >
          + Agregar
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className={styles.empty}
              >
                No hay productos agregados
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id_producto}>
                <td>{item.nombre}</td>
                <td>{item.cantidad}</td>
                <td>{formatoMoneda(item.precio_unitario)}</td>
                <td>{formatoMoneda(item.subtotal)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => eliminarProducto(item.id_producto)}
                    className={`${styles.btn} ${styles.btnEliminar}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.gridTotales}>
        <div className={styles.formGroup}>
          <label>IVA (%):</label>

          <input
            type="number"
            min="0"
            value={iva}
            onChange={(e) => setIva(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Descuento ($):</label>

          <input
            type="number"
            min="0"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Total Final:</label>

          <input
            type="text"
            value={formatoMoneda(totalFinal)}
            readOnly
            className={`${styles.input} ${styles.inputReadonly}`}
          />
        </div>
      </div>

      <div className={styles.accionesFinales}>
        <button
          type="button"
          onClick={guardarFactura}
          className={`${styles.btn} ${styles.btnGuardar}`}
        >
          Guardar y Generar PDF
        </button>
      </div>
    </div>
  );
}