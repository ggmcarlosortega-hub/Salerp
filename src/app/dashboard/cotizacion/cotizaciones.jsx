"use client";
import React, { useState, useEffect } from 'react';

// Ajusta las URLs según los puertos reales de tu entorno
const API_COTIZACION = 'http://localhost:3001/api/cotizacion';
const API_CLIENTES = 'http://localhost:3001/api/cliente';

export default function GestionCotizaciones() {
  // Estado para el formulario de cotización
  const [cotizacion, setCotizacion] = useState({ 
    id_cotizacion: '', 
    id_cliente: '', 
    total: '', 
    observaciones: '' 
  });
  
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]); // <-- Almacena los clientes de la BD
  const [loading, setLoading] = useState(true);

  // 1. OBTENER DATOS AL INICIAR
  useEffect(() => {
    Promise.all([obtenerCotizaciones(), obtenerClientes()])
      .finally(() => setLoading(false));
  }, []);

  const obtenerCotizaciones = async () => {
    try {
      const respuesta = await fetch(API_COTIZACION);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setLista(datos);
      }
    } catch (error) {
      console.error("Error al cargar las cotizaciones:", error);
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

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCotizacion({ ...cotizacion, [name]: value });
  };

  // 2. REGISTRAR COTIZACIÓN (POST)
  const RegistrarCotizacion = async (e) => {
    e.preventDefault();
    if (!cotizacion.id_cliente || !cotizacion.total) {
      alert("El cliente y el total son obligatorios.");
      return;
    }

    try {
      const respuesta = await fetch(API_COTIZACION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: parseInt(cotizacion.id_cliente),
          total: parseFloat(cotizacion.total),
          observaciones: cotizacion.observaciones
        })
      });

      if (respuesta.ok) {
        setCotizacion({ id_cotizacion: '', id_cliente: '', total: '', observaciones: '' });
        obtenerCotizaciones();
      }
    } catch (error) {
      console.error("Error al registrar cotización:", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando datos del módulo...</div>;
  }

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Cotizaciones</h2>
      
      {/* VALIDACIÓN CRÍTICA: Bloqueo si no hay clientes registrados */}
      {clientes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl mb-8 text-center">
          <p className="font-semibold text-lg">No hay clientes registrados en el sistema.</p>
          <p className="text-sm mt-1 text-amber-700">
            Para poder generar una cotización, primero debes registrar al menos un cliente en el módulo correspondiente.
          </p>
        </div>
      ) : (
        /* Formulario habilitado */
        <form onSubmit={RegistrarCotizacion} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* Dropdown dinámico de Clientes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
              <select
                name="id_cliente"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E] bg-white"
                value={cotizacion.id_cliente}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cotización</label>
              <input
                type="number"
                name="total"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
                value={cotizacion.total}
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
                value={cotizacion.observaciones}
                onChange={handleChange}
                placeholder="Detalles o validez de la cotización"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm">
            Registrar Cotización
          </button>
        </form>
      )}

      {/* Tabla de Historial de Cotizaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">N° Cotización</th>
              <th className="p-4 font-semibold text-gray-600">Cliente / Empresa</th>
              <th className="p-4 font-semibold text-gray-600">Fecha</th>
              <th className="p-4 font-semibold text-gray-600">Total</th>
              <th className="p-4 font-semibold text-gray-600">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c, index) => {
              // Cruce de datos para renderizar el nombre del cliente en vez de solo su ID numérico
              const datosCliente = clientes.find(item => item.id_cliente === (c.idcliente || c.id_cliente));
              return (
                <tr key={c.id_cotizacion || index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500 text-sm">#{c.id_cotizacion || (index + 1)}</td>
                  <td className="p-4 text-gray-800 font-medium">
                    {datosCliente ? `${datosCliente.nombre} ${datosCliente.apellido}` : `Cliente #${c.idcliente || c.id_cliente}`}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {c.fecha ? new Date(c.fecha).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4 text-gray-800 font-bold">${c.total}</td>
                  <td className="p-4 text-gray-600 italic text-sm">
                    {c.observaciones || 'Sin observaciones'}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">No hay cotizaciones emitidas aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}