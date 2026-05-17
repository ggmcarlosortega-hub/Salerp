"use client";
import React, { useState, useEffect } from 'react';

// Ajusta los puertos según corresponda en tu entorno local
const API_FACTURAS = 'http://localhost:3001/api/factura';
const API_CLIENTES = 'http://localhost:3001/api/cliente'; 

export default function GestionFacturas() {
  const [factura, setFactura] = useState({ 
    id_factura: '', 
    id_cliente: '', 
    total: '', 
    observaciones: '' 
  });
  
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]); // <-- Estado para almacenar los clientes de la BD
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargamos tanto las facturas como los clientes al iniciar
    Promise.all([obtenerFacturas(), obtenerClientes()])
      .finally(() => setLoading(false));
  }, []);

  const obtenerFacturas = async () => {
    try {
      const respuesta = await fetch(API_FACTURAS);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setLista(datos);
      }
    } catch (error) {
      console.error("Error al cargar las facturas:", error);
    }
  };

  const obtenerClientes = async () => {
    try {
      const respuesta = await fetch(API_CLIENTES);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setClientes(datos);
      }
    } catch (error) {
      console.error("Error al cargar los clientes:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFactura({ ...factura, [name]: value });
  };

  const RegistrarFactura = async (e) => {
    e.preventDefault();
    if (!factura.id_cliente || !factura.total) {
      alert("El cliente y el total son obligatorios.");
      return;
    }

    try {
      const respuesta = await fetch(API_FACTURAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: parseInt(factura.id_cliente),
          total: parseFloat(factura.total),
          observaciones: factura.observaciones
        })
      });

      if (respuesta.ok) {
        setFactura({ id_factura: '', id_cliente: '', total: '', observaciones: '' });
        obtenerFacturas();
      }
    } catch (error) {
      console.error("Error al registrar factura:", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando datos del módulo...</div>;
  }

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Facturas</h2>
      
      {/* VALIDACIÓN CRÍTICA: Si no hay clientes, bloquea el formulario */}
      {clientes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl mb-8 text-center">
          <p className="font-semibold text-lg">No hay clientes registrados en el sistema.</p>
          <p className="text-sm mt-1 text-amber-700">
            Para poder generar una factura, primero debes registrar al menos un cliente en el módulo correspondiente.
          </p>
        </div>
      ) : (
        /* Formulario habilitado únicamente si existen clientes */
        <form onSubmit={RegistrarFactura} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* Dropdown dinámico que reemplaza el input manual del ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
              <select
                name="id_cliente"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E] bg-white"
                value={factura.id_cliente}
                onChange={handleChange}
              >
                <option value="">-- Seleccione un cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre} {c.apellido} ({c.tipo_documento}: {c.documento})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Factura</label>
              <input
                type="number"
                name="total"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
                value={factura.total}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <input
                type="text"
                name="observaciones"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
                value={factura.observaciones}
                onChange={handleChange}
                placeholder="Detalles adicionales opcionales"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm">
            Registrar Factura
          </button>
        </form>
      )}

      {/* Tabla de Historial de Facturas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">N° Factura</th>
              <th className="p-4 font-semibold text-gray-600">Cliente ID / Datos</th>
              <th className="p-4 font-semibold text-gray-600">Fecha</th>
              <th className="p-4 font-semibold text-gray-600">Total</th>
              <th className="p-4 font-semibold text-gray-600">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => {
              // Buscamos los datos completos del cliente para mostrarlos directamente en la lista
              const datosCliente = clientes.find(c => c.id_cliente === f.id_cliente);
              return (
                <tr key={f.id_factura} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500 text-sm">#{f.id_factura}</td>
                  <td className="p-4 text-gray-800 font-medium">
                    {datosCliente ? `${datosCliente.nombre} ${datosCliente.apellido}` : `Cliente #${f.id_cliente}`}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {f.fecha ? new Date(f.fecha).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4 text-gray-800 font-bold">${f.total}</td>
                  <td className="p-4 text-gray-600 italic text-sm">
                    {f.observaciones || 'Sin observaciones'}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">No hay facturas emitidas aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}