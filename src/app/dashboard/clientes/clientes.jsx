"use client";
import React, { useState, useEffect } from 'react';

export default function GestionClientes() {
  const [cliente, setCliente] = useState({ 
    id_cliente: '', nombre: '', apellido: '', tipo_documento: '', 
    documento: '', telefono: '', direccion: '', correo: ''
  });
  
  const [lista, setLista] = useState([]);
  const [esEdicion, setEsEdicion] = useState(false);

  // Apuntamos al puerto 4000 (Node) y a la ruta en singular que definiste en server.js
  const API_URL = 'http://localhost:3001/api/cliente'; 

  // 1. GET: Cargar clientes al iniciar la pantalla
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setLista(data); 
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  // 2. POST y PUT: Guardar o Actualizar
  const Guardar = async (e) => {
    e.preventDefault();
    
    if (!cliente.nombre || !cliente.documento || !cliente.tipo_documento) {
      alert('El nombre, el tipo y número de documento son obligatorios');
      return;
    }

    try {
      if (esEdicion) {
        // Petición PUT
        await fetch(`${API_URL}/${cliente.id_cliente}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cliente) 
        });
      } else {
        // Petición POST (Se excluye el id_cliente para que MySQL lo genere)
        const { id_cliente, ...datosNuevoCliente } = cliente;
        
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosNuevoCliente)
        });
      }
      
      cargarClientes();
      Cancelar();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
    }
  };

  const IniciarEdicion = (c) => {
    setCliente(c);
    setEsEdicion(true);
  };

  // 3. DELETE: Eliminar
  const Eliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      cargarClientes();
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
    }
  };

  const Cancelar = () => {
    setCliente({ 
      id_cliente: '', nombre: '', apellido: '', tipo_documento: '', 
      documento: '', telefono: '', direccion: '', correo: '' 
    });
    setEsEdicion(false);
  };

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Clientes</h2>
      
      {/* Formulario */}
      <form onSubmit={Guardar} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" name="nombre" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]" value={cliente.nombre} onChange={handleChange} placeholder="Nombre del cliente" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input type="text" name="apellido" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]" value={cliente.apellido} onChange={handleChange} placeholder="Apellido" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
            <select name="tipo_documento" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E] bg-white" value={cliente.tipo_documento} onChange={handleChange}>
              <option value="">Seleccione...</option>
              <option value="NIT">NIT</option>
              <option value="CC">CC</option>
              <option value="CE">CE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
            <input type="text" name="documento" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]" value={cliente.documento} onChange={handleChange} placeholder="Número" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="text" name="telefono" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]" value={cliente.telefono} onChange={handleChange} placeholder="Contacto" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" name="direccion" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]" value={cliente.direccion} onChange={handleChange} placeholder="Dirección física" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" name="correo" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]" value={cliente.correo} onChange={handleChange} placeholder="correo@ejemplo.com" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm">
            {!esEdicion ? "Registrar Cliente" : "Actualizar Cliente"}
          </button>
          {esEdicion && (
            <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition" onClick={Cancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Nombre Completo</th>
              <th className="p-4 font-semibold text-gray-600">Documento</th>
              <th className="p-4 font-semibold text-gray-600">Contacto</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id_cliente} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-800 font-medium">{c.nombre} {c.apellido}</td>
                <td className="p-4 text-gray-600">
                  <span className="font-semibold text-gray-700">{c.tipo_documento}:</span> {c.documento}
                </td>
                <td className="p-4 text-gray-600 text-sm">
                  {c.telefono} <br/>
                  <span className="text-gray-400">{c.correo}</span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => IniciarEdicion(c)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition text-sm font-medium">Editar</button>
                  <button onClick={() => Eliminar(c.id_cliente)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">
                  Cargando clientes o no hay registros...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}