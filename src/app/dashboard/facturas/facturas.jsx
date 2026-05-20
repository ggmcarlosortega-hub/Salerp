"use client";
import React, { useState, useEffect } from 'react';
import { PackagePlus, Trash2 } from 'lucide-react'; 

const API_FACTURAS = 'http://localhost:3001/api/factura';
const API_CLIENTES = 'http://localhost:3001/api/cliente'; 
const API_PRODUCTOS = 'http://localhost:3001/api/producto'; 

export default function GestionFacturas() {
  const [factura, setFactura] = useState({ id_cliente: '', observacion: '' });
  
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productosDb, setProductosDb] = useState([]); 
  
  const [carrito, setCarrito] = useState([]);
  const [prodSeleccionado, setProdSeleccionado] = useState('');
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([obtenerFacturas(), obtenerClientes(), obtenerProductos()])
      .finally(() => setLoading(false));
  }, []);

  const obtenerFacturas = async () => {
    try {
      const respuesta = await fetch(API_FACTURAS);
      if (respuesta.ok) setLista(await respuesta.json());
    } catch (error) { console.error("Error facturas:", error); }
  };

  const obtenerClientes = async () => {
    try {
      const respuesta = await fetch(API_CLIENTES);
      if (respuesta.ok) setClientes(await respuesta.json());
    } catch (error) { console.error("Error clientes:", error); }
  };

  const obtenerProductos = async () => {
    try {
      const respuesta = await fetch(API_PRODUCTOS);
      if (respuesta.ok) setProductosDb(await respuesta.json());
    } catch (error) { console.error("Error productos:", error); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFactura({ ...factura, [name]: value });
  };

  const agregarAlCarrito = () => {
    if (!prodSeleccionado || cantidadSeleccionada <= 0) return;
    
    const infoProducto = productosDb.find(p => p.id_producto === parseInt(prodSeleccionado));
    if (!infoProducto) return;

    // ALERTA: Si quieres vender aunque haya 0 stock, puedes comentar estas 4 líneas.
    // Por ahora las dejo para que el sistema te avise.
    if (cantidadSeleccionada > infoProducto.stock) {
      alert(`¡Stock insuficiente! Solo quedan ${infoProducto.stock} unidades de ${infoProducto.nombre}.`);
      return;
    }

    const nuevoItem = {
      id_producto: infoProducto.id_producto,
      nombre: infoProducto.nombre,
      cantidad: parseInt(cantidadSeleccionada),
      precio_unitario: parseFloat(infoProducto.precio) 
    };

    setCarrito([...carrito, nuevoItem]);
    setProdSeleccionado('');
    setCantidadSeleccionada(1);
  };

  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
  };

  const RegistrarFactura = async (e) => {
    e.preventDefault();
    if (!factura.id_cliente) {
      alert("El cliente es obligatorio.");
      return;
    }
    if (carrito.length === 0) {
      alert("Debes agregar al menos un producto a la factura.");
      return;
    }

    try {
      const respuesta = await fetch(API_FACTURAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: parseInt(factura.id_cliente),
          observacion: factura.observacion,
          productos: carrito 
        })
      });

      if (respuesta.ok) {
        alert("¡Factura registrada y stock descontado con éxito!");
        setFactura({ id_cliente: '', observacion: '' });
        setCarrito([]); 
        obtenerFacturas();
        obtenerProductos(); 
      } else {
        const err = await respuesta.json();
        alert(`Error del servidor: ${err.error}`);
      }
    } catch (error) {
      console.error("Error al registrar factura:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando datos del módulo...</div>;

  const totalVisual = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Emisión de Facturas</h2>
      
      {clientes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl mb-8 text-center">
          <p className="font-semibold text-lg">No hay clientes registrados en el sistema.</p>
          <p className="text-sm mt-1 text-amber-700">Para poder generar una factura, primero debes registrar al menos un cliente.</p>
        </div>
      ) : (
        <form onSubmit={RegistrarFactura} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          
          <h3 className="text-lg font-bold text-[#2B547E] border-b pb-2 mb-4">1. Datos Generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
              <select name="id_cliente" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2B547E] bg-white text-black" value={factura.id_cliente} onChange={handleChange}>
                <option value="">-- Seleccione un cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observacion</label>
              <input type="text" name="observacion" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2B547E]" value={factura.observacion} onChange={handleChange} placeholder="Detalles de la venta..." />
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#2B547E] border-b pb-2 mb-4">2. Agregar Productos</h3>
          <div className="flex gap-4 items-end mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
              {/* AQUÍ ESTABA EL ERROR: Se quitó el .filter para que muestre todos los productos */}
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black" value={prodSeleccionado} onChange={(e) => setProdSeleccionado(e.target.value)}>
                <option value="">-- Elija un producto --</option>
                {productosDb.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>{p.nombre} (Stock: {p.stock} | Precio: ${p.precio})</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input type="number" min="1" className="w-full px-4 py-2 border border-gray-300 rounded-md" value={cantidadSeleccionada} onChange={(e) => setCantidadSeleccionada(e.target.value)} />
            </div>
            <button type="button" onClick={agregarAlCarrito} className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 flex items-center gap-2 transition">
              <PackagePlus size={18} /> Agregar
            </button>
          </div>

          {carrito.length > 0 && (
            <div className="mb-6">
              <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-600">Producto</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Cantidad</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">P. Unitario</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Subtotal</th>
                    <th className="p-3 text-sm font-semibold text-gray-600 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 text-sm">{item.nombre}</td>
                      <td className="p-3 text-sm">{item.cantidad}</td>
                      <td className="p-3 text-sm">${item.precio_unitario}</td>
                      <td className="p-3 text-sm font-bold">${item.cantidad * item.precio_unitario}</td>
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => eliminarDelCarrito(index)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-2 text-sm text-gray-500">
                Subtotal antes de IVA: <span className="font-bold text-lg text-gray-800">${totalVisual.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-[#2B547E] text-white font-bold rounded-md hover:bg-blue-800 transition shadow-sm mt-4 text-lg">
            Procesar Factura y Descontar Inventario
          </button>
        </form>
      )}

      <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">Historial de Facturas Emitidas</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">N° Factura</th>
              <th className="p-4 font-semibold text-gray-600">Cliente</th>
              <th className="p-4 font-semibold text-gray-600">Fecha</th>
              <th className="p-4 font-semibold text-gray-600">Total + IVA</th>
              <th className="p-4 font-semibold text-gray-600">Observacion</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => {
              const datosCliente = clientes.find(c => c.id_cliente === f.id_cliente);
              return (
                <tr key={f.id_factura} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500 font-bold">#{f.id_factura}</td>
                  <td className="p-4 text-gray-800 font-medium">{datosCliente ? `${datosCliente.nombre} ${datosCliente.apellido}` : `Cliente #${f.id_cliente}`}</td>
                  {/* Se ajustó para leer f.fecha en lugar de f.fecha_emision */}
                  <td className="p-4 text-gray-600 text-sm">{f.fecha ? new Date(f.fecha).toLocaleString() : 'N/A'}</td>
                  <td className="p-4 text-green-700 font-bold">${f.total}</td>
                  <td className="p-4 text-gray-600 italic text-sm">{f.observacion || 'Sin observacion'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}