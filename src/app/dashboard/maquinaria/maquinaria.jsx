"use client";
import { ApiError } from 'next/dist/server/api-utils';
import React, { useState , useEffect, useMemo} from 'react';

export default function GestionMaquinaria() {
  // Estado para el formulario (basado en tu modelo de Blazor)
  const [maquinaria, setMaquinaria] = useState({
    id_maquinaria: '',
    nombre: '',
    descripcion: '',
    observacion: ''
  });

  const [lista, setLista] = useState([]);
  const [esEdicion, setEsEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const maquinariaFiltrada = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return lista.filter((m) => {
      return (
        m.nombre?.toLowerCase().includes(texto) ||
        m.descripcion?.toLowerCase().includes(texto) ||
        m.observacion?.toLowerCase().includes(texto)
      );
    });
  }, [lista, busqueda]);

  const API_URL = 'http://localhost:3001/api/maquinaria';

  useEffect(() => {
    cargarMaquinaria();
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem('pendingAction');
    if (pending) {
      try {
        const { action } = JSON.parse(pending);
        localStorage.removeItem('pendingAction');
        if (action === 'nuevo') {
          Cancelar();
          setEsEdicion(true);
        }
      } catch (e) {
        console.error('Error parsing pending action:', e);
      }
    }
  }, []);

  const cargarMaquinaria = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setLista(data);
      }
    } catch (error) {
      console.error("Error al cargar la maquinaria: ", error);
    }
  };

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaquinaria({ ...maquinaria, [name]: value });
  };

  // Método Guardar
  const Guardar = async (e) => {
    e.preventDefault();

    if (!maquinaria.nombre) {
      alert('El nombre de la maquinaria es obligatorio');
      return;
    }
    try{
    if (esEdicion) {
      await fetch(`${API_URL}/${maquinaria.id_maquinaria}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maquinaria)
      });
    } else {
      const {id_maquinaria , ...datosNuevaMaquinaria} = maquinaria;
       await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosNuevaMaquinaria)
      });
    }
    cargarMaquinaria();
    Cancelar();
  }catch(error){
    console.error("Error al cargar la maquinaria: ", error);
  }
  };

  // Cargar datos al formulario para editar
  const IniciarEdicion = (m) => {
    setMaquinaria(m);
    setEsEdicion(true);
  };

  // Eliminar elemento de la lista
  const Eliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta maquinaria?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      cargarMaquinaria();
    } catch (error) {
      console.error("Error al eliminar la maquinaria: ", error);
    }
  };

  // Limpiar formulario
  const Cancelar = () => {
    setMaquinaria({ id_maquinaria: '', nombre: '', descripcion: '', observacion: '' });
    setEsEdicion(false);
  };

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Maquinaria</h2>

      {/* Formulario */}
      <form onSubmit={Guardar} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">

        {/* Fila 1: Nombre */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Maquinaria</label>
          <input
            type="text"
            name="nombre"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
            value={maquinaria.nombre}
            onChange={handleChange}
            placeholder="Ej. Retroexcavadora, Taladro de banco..."
          />
        </div>

        {/* Fila 2: Descripción y Observación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              name="descripcion"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
              value={maquinaria.descripcion}
              onChange={handleChange}
              placeholder="Descripción técnica o general"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
            <input
              type="text"
              name="observacion"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
              value={maquinaria.observacion}
              onChange={handleChange}
              placeholder="Estado actual, mantenimientos, etc."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm">
            {!esEdicion ? "Registrar" : "Actualizar"}
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
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Descripción</th>
              {/* Añadí la columna Observación para que se vea en la tabla */}
              <th className="p-4 font-semibold text-gray-600">Observación</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id_maquinaria} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-800 font-medium">{m.nombre}</td>
                <td className="p-4 text-gray-600">{m.descripcion}</td>
                <td className="p-4 text-gray-600 text-sm">{m.observacion}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => IniciarEdicion(m)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition text-sm font-medium">
                    Editar
                  </button>
                  <button onClick={() => Eliminar(m.id_maquinaria)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">
                  No hay maquinaria registrada aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}