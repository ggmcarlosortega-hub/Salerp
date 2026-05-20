"use client";
import React, { useState, useEffect } from 'react';

export default function GestionProveedores() {
  const [lista, setLista] = useState([]);
  const [vistaActual, setVistaActual] = useState('lista'); 
  
  // Estado alineado exactamente con la base de datos tbl_proveedor
  const [proveedor, setProveedor] = useState({ 
    id: '', nombre: '', telefono: '', direccion: '', correo: ''
  });

  const [verMas, setVerMas] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  const [busquedaProd, setBusquedaProd] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargandoProds, setCargandoProds] = useState(false);

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  const API_PROVEEDOR = 'http://localhost:3001/api/proveedor'; 
  const API_PRODUCTO = 'http://localhost:3001/api/producto'; 

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    // Si la BD devuelve id_proveedor o id, lo leemos
    const idActual = proveedor.id || proveedor.id_proveedor;
    if (vistaActual === 'detalle' && idActual) {
      cargarProductosProveedor(idActual);
    }
  }, [vistaActual, proveedor]);

  const cargarProveedores = async () => {
    try {
      const response = await fetch(API_PROVEEDOR);
      if (response.ok) {
        const data = await response.json();
        setLista(data); 
      }
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  const cargarProductosProveedor = async (idProveedor) => {
    setCargandoProds(true);
    try {
      const resProductos = await fetch(API_PRODUCTO);
      if (resProductos.ok) {
        const dataProductos = await resProductos.json();
        const productosDelProveedor = dataProductos.filter(
          (prod) => String(prod.id_proveedor) === String(idProveedor) || String(prod.idproveedor) === String(idProveedor)
        );
        setProductos(productosDelProveedor);
      }
    } catch (error) {
      console.error("Error al cargar productos del proveedor:", error);
    } finally {
      setCargandoProds(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProveedor({ ...proveedor, [name]: value });
  };

  const AbrirDetalle = (p) => {
    // Normalizamos el ID por si viene como id o id_proveedor desde la BD
    const idNormalizado = p.id || p.id_proveedor;
    setProveedor({ ...p, id: idNormalizado });
    setVerMas(false);
    setModoEdicion(false);
    setMenuAbierto(false);
    setBusquedaProd("");
    setVistaActual('detalle');
  };

  const VolverALista = () => {
    setVistaActual('lista');
    setProveedor({ id: '', nombre: '', telefono: '', direccion: '', correo: '' });
  };

  const NuevoProveedor = () => {
    setProveedor({ id: '', nombre: '', telefono: '', direccion: '', correo: '' });
    setModoEdicion(true);
    setVerMas(true);
    setVistaActual('detalle');
    setProductos([]);
  };

  const Guardar = async (e) => {
    e.preventDefault();
    if (!proveedor.nombre || !proveedor.telefono || !proveedor.correo) {
      alert('Nombre, teléfono y correo son obligatorios');
      return;
    }

    try {
      const idActual = proveedor.id || proveedor.id_proveedor;
      
      if (idActual) {
        // ACTUALIZAR (PUT)
        await fetch(`${API_PROVEEDOR}/${idActual}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proveedor) 
        });
        setModoEdicion(false); 
      } else {
        // CREAR (POST)
        const { id, id_proveedor, ...datosNuevo } = proveedor; 
        await fetch(API_PROVEEDOR, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosNuevo)
        });
        VolverALista(); 
      }
      cargarProveedores();
    } catch (error) {
      console.error("Error al guardar el proveedor:", error);
    }
  };

  const IniciarDesactivacion = () => {
    setMenuAbierto(false);
    setMostrarModalConfirmacion(true);
  };

  const ConfirmarDesactivacion = async () => {
    try {
      const idActual = proveedor.id || proveedor.id_proveedor;
      await fetch(`${API_PROVEEDOR}/${idActual}`, { method: 'DELETE' });
      cargarProveedores();
      setMostrarModalConfirmacion(false);
      setMostrarModalExito(true); 
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Hubo un error al intentar desactivar el proveedor.");
      setMostrarModalConfirmacion(false);
    }
  };

  const CerrarModalExito = () => {
    setMostrarModalExito(false);
    VolverALista(); 
  };

  const productosFiltrados = productos.filter(prod => {
    const textoBusqueda = busquedaProd.toLowerCase();
    const nombre = (prod.nombre || '').toLowerCase();
    const descripcion = (prod.descripcion || '').toLowerCase();
    return nombre.includes(textoBusqueda) || descripcion.includes(textoBusqueda);
  });

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500 relative">
      
      {vistaActual === 'lista' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Proveedores</h2>
            <button 
              onClick={NuevoProveedor}
              className="px-4 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm"
            >
              + Nuevo Proveedor
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Nombre o Razón Social</th>
                  <th className="p-4 font-semibold text-gray-600">Contacto</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p, index) => (
                  <tr key={p.id_proveedor || p.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onClick={() => AbrirDetalle(p)}>
                    <td className="p-4 text-gray-800 font-medium">{p.nombre}</td>
                    <td className="p-4 text-gray-600">
                      <span className="font-semibold text-gray-700">{p.telefono}</span><br/>
                      <span className="text-sm text-gray-500">{p.correo}</span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); AbrirDetalle(p); }} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-medium">
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-400">
                      Cargando proveedores o no hay registros...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {vistaActual === 'detalle' && (
        <div className="max-w-4xl mx-auto">
          <button onClick={VolverALista} className="text-gray-500 hover:text-[#2B547E] mb-4 flex items-center gap-2 text-sm font-medium transition">
             ← Volver a la lista
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="border border-gray-300 rounded-xl p-5 mb-6 relative">
              <form onSubmit={Guardar}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 uppercase">
                        {proveedor.nombre || 'Nuevo Proveedor'}
                      </h2>
                      <p className="text-gray-600 font-medium">Proveedor de Servicios/Productos</p>
                    </div>
                  </div>

                  <div className="relative">
                    <button type="button" onClick={() => setMenuAbierto(!menuAbierto)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {menuAbierto && (
                      <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
                        <button type="button" onClick={() => { setModoEdicion(true); setVerMas(true); setMenuAbierto(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Editar
                        </button>
                        <button type="button" onClick={IniciarDesactivacion} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="button" onClick={() => setVerMas(!verMas)} className="flex items-center gap-2 text-sm font-bold text-[#1A2421] hover:text-gray-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${verMas ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Ver {verMas ? 'menos' : 'mas'}...
                </button>

                {verMas && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      
                      {/* Adaptación del Grid para 4 campos */}
                      <div className="md:col-span-12">
                        <input type="text" name="nombre" value={proveedor.nombre} onChange={handleChange} placeholder="Nombre o Razón Social" required disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>
                      
                      <div className="md:col-span-6">
                        <input type="text" name="telefono" value={proveedor.telefono} onChange={handleChange} placeholder="Teléfono" required disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>

                      <div className="md:col-span-6">
                        <input type="email" name="correo" value={proveedor.correo} onChange={handleChange} placeholder="Correo Electrónico" required disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>

                      <div className="md:col-span-11">
                        <input type="text" name="direccion" value={proveedor.direccion} onChange={handleChange} placeholder="Dirección Física" disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>
                      
                      <div className="md:col-span-1 flex items-center justify-end">
                        {modoEdicion && (
                          <button type="submit" title="Guardar Cambios" className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {modoEdicion && (proveedor.id || proveedor.id_proveedor) && (
                      <div className="flex justify-end mt-2">
                        <button type="button" onClick={() => { setModoEdicion(false); }} className="text-sm text-gray-500 hover:text-gray-800 underline">
                          Cancelar edición
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* SECCIÓN INFERIOR: Productos del Proveedor */}
            <div className="border border-gray-300 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800">Catálogo de Productos</h3>
                  <span className="bg-blue-100 text-[#2B547E] text-xs font-bold px-2 py-1 rounded-full">
                    {productosFiltrados.length}
                  </span>
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Busca por nombre o desc..." 
                    value={busquedaProd}
                    onChange={(e) => setBusquedaProd(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
                  />
                </div>
              </div>

              <div className="min-h-[250px] border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                {cargandoProds ? (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-gray-400 font-medium">Cargando catálogo...</p>
                  </div>
                ) : productosFiltrados.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Nombre del Producto</th>
                        <th className="px-4 py-2">Descripción</th>
                        <th className="px-4 py-2 text-right">Precio Unitario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((prod, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-white transition">
                          <td className="px-4 py-3 text-gray-500">#{prod.id_producto || prod.id || index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{prod.nombre || 'Producto sin nombre'}</td>
                          <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{prod.descripcion || 'Sin descripción'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">${prod.precio || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-full items-center justify-center p-8 flex-col gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-gray-400 font-medium">Este proveedor no tiene productos {busquedaProd && 'que coincidan'}.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Desactivar Proveedor</h3>
            <p className="text-gray-600 mb-6 text-sm">
              ¿Estás seguro de que deseas desactivar a <strong>{proveedor.nombre}</strong>? El proveedor será retirado del sistema.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMostrarModalConfirmacion(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-semibold">Cancelar</button>
              <button onClick={ConfirmarDesactivacion} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-semibold shadow-sm">Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Completado!</h3>
            <p className="text-gray-600 mb-6 text-sm">El proveedor ha sido desactivado correctamente.</p>
            <button onClick={CerrarModalExito} className="w-full px-4 py-2 bg-[#2B547E] text-white rounded-md hover:bg-blue-800 transition text-sm font-semibold shadow-sm">Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}