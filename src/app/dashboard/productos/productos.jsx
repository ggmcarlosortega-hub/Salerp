"use client";
import React, { useState, useEffect } from 'react';

export default function GestionProductos() {
  const [producto, setProducto] = useState({ id_producto: '', nombre: '', descripcion: '', precio: '' });
  const [lista, setLista] = useState([]);
  const [esEdicion, setEsEdicion] = useState(false);

  const API_URL ='http://localhost:3001/api/producto';

  useEffect(()=> {
    cargaProductos();
  },[]);

  const cargaProductos = async ()=>{
    try{
      const response = await fetch(API_URL);
      if(response.ok){
        const data = await response.json();
        setLista(data);
      }
    }catch(error){
      console.error("Error al cargar los productos:" , error);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto({ ...producto, [name]: value });
  };

  const Guardar = async (e) => {
    e.preventDefault();
    if (!producto.nombre || !producto.precio) {
      alert('El nombre y el precio son obligatorios');
      return;
    }
    try{
    if (esEdicion) {
     await fetch(`${API_URL}/${producto.id_producto}`,{
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(producto)
     });
    } else {
      const {id_producto,...datosNuevoProducto} = producto;
      await fetch(API_URL,{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(datosNuevoProducto)
     });
    }
    cargaProductos();
    Cancelar();
  }catch(error){
    console.error("Error al cargar los productos: " , error);
  }
  };

  const IniciarEdicion = (m) => {
    setProducto(m);
    setEsEdicion(true);
  };

  const Desactivar = async (id) => {
    if (!window.confirm("¿Estás seguro de desactivar este producto?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
      });
      cargaProductos();
    } catch (error) {
      console.error("Error al desactivar el producto: ", error);
    }
  };

  const Cancelar = () => {
    setProducto({ id_producto: '', nombre: '', descripcion: '', precio: '' });
    setEsEdicion(false);
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Productos</h2>
      
      {/* Formulario con estilo Tailwind */}
      <form onSubmit={Guardar} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
            <input
              type="text"
              name="nombre"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
              value={producto.nombre}
              onChange={handleChange}
              placeholder="Ej. Materia Prima A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <input
              type="number"
              name="precio"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
              value={producto.precio}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              name="descripcion"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
              value={producto.descripcion}
              onChange={handleChange}
              placeholder="Descripción detallada del producto"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm">
            {!esEdicion ? "Registrar Producto" : "Actualizar Producto"}
          </button>
          {esEdicion && (
            <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition" onClick={Cancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla con estilo Tailwind */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Descripción</th>
              <th className="p-4 font-semibold text-gray-600">Precio</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id_producto} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-800">{m.nombre}</td>
                <td className="p-4 text-gray-600">{m.descripcion}</td>
                <td className="p-4 text-gray-800 font-medium">${m.precio}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => IniciarEdicion(m)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition text-sm font-medium">
                    Editar
                  </button>
                  <button onClick={() => Desactivar(m.id_producto)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium">
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">
                  No hay productos registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}