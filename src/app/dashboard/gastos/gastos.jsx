"use client";
import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001/api/gasto';

export default function GestionGastos() {
  const [gasto, setGasto] = useState({
    id_gasto: '',
    descripcion: '',
    tipo: '',
    monto: ''
  });
  const [lista, setLista] = useState([]);
  const [esEdicion, setEsEdicion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    obtenerGastos();
  }, []);

  const obtenerGastos = async () => {
    try {
      setCargando(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error cargando gastos');
      const data = await res.json();
      setLista(data);
    } catch (err) {
      setError(err.message || 'Error cargando gastos');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setGasto({ ...gasto, [name]: value });
  };

  const Guardar = async (e) => {
    e.preventDefault();
    if (!gasto.descripcion || !gasto.monto || !gasto.tipo) {
      setError('La descripción, el tipo y el monto son obligatorios');
      return;
    }
    try {
      if (esEdicion) {
        const res = await fetch(`${API_URL}/${gasto.id_gasto}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasto)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al actualizar');
        }
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasto)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al crear');
        }
      }
      await obtenerGastos();
      Cancelar();
      setSuccess('Gasto guardado correctamente');
    } catch (err) {
      setError(err.message || 'Error al guardar');
    }
  };

  const IniciarEdicion = (m) => {
    setGasto(m);
    setEsEdicion(true);
  };

  const Eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await obtenerGastos();
      setSuccess('Gasto eliminado');
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    }
  };

  const Cancelar = () => {
    setGasto({ id_gasto: '', descripcion: '', tipo: '', monto: '' });
    setEsEdicion(false);
    setError('');
    setSuccess('');
  };

  const formatMoneda = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Number(val || 0));
  };

  const getTipoBadgeClass = (tipo) => {
    if (tipo === 'Produccion') return 'bg-green-100 text-green-700 border-green-200';
    if (tipo === 'Servicio') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (tipo === 'Materia Prima') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (tipo === 'Nomina') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Gastos</h2>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <form onSubmit={Guardar} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              name="descripcion"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
              value={gasto.descripcion}
              onChange={handleChange}
              placeholder="Ej. Pago de luz, Compra de acero..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto</label>
            <select
              name="tipo"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E] bg-white"
              value={gasto.tipo}
              onChange={handleChange}
            >
              <option value="">Tipo Gasto...</option>
              <option value="Servicio">Servicio</option>
              <option value="Materia Prima">Materia Prima</option>
              <option value="Nomina">Nómina</option>
              <option value="Produccion">Producción</option>
            </select>
          </div>
        </div>

        <div className="mb-6 w-full md:w-1/2 md:pr-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
          <input
            type="number"
            name="monto"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
            value={gasto.monto}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
          />
        </div>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Fecha</th>
              <th className="p-4 font-semibold text-gray-600">Descripción</th>
              <th className="p-4 font-semibold text-gray-600">Tipo</th>
              <th className="p-4 font-semibold text-gray-600">Monto</th>
              <th className="p-4 font-semibold text-gray-600">Origen</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id_gasto} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-600 text-sm">{new Date(m.fecha).toLocaleDateString('es-CO')}</td>
                <td className="p-4 text-gray-800 font-medium">{m.descripcion}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getTipoBadgeClass(m.tipo)}`}>
                    {m.tipo}
                  </span>
                </td>
                <td className="p-4 text-gray-800 font-medium">{formatMoneda(m.monto)}</td>
                <td className="p-4 text-gray-500 text-sm">
                  {m.origen_tipo === 'factura' ? (
                    <span className="text-green-600">Factura #{m.origen_id}</span>
                  ) : m.origen_nombre ? (
                    <span className="text-blue-600">{m.origen_nombre}</span>
                  ) : (
                    <span className="text-gray-400">Manual</span>
                  )}
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => IniciarEdicion(m)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition text-sm font-medium">
                    Editar
                  </button>
                  <button onClick={() => Eliminar(m.id_gasto)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">
                  No hay gastos registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
