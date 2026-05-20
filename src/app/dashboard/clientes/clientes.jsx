"use client";
import React, { useState, useEffect } from 'react';

export default function GestionClientes() {
  // Estado general
  const [lista, setLista] = useState([]);
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista' | 'detalle'
  
  // Estado del cliente seleccionado
  const [cliente, setCliente] = useState({ 
    id_cliente: '', nombre: '', apellido: '', tipo_documento: '', 
    documento: '', telefono: '', direccion: '', correo: ''
  });

  // Estados de la vista de detalle
  const [verMas, setVerMas] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [tipoDocumentos, setTipoDocumentos] = useState('cotizaciones');
  
  // Estados para documentos reales del backend
  const [busquedaDoc, setBusquedaDoc] = useState("");
  const [cotizaciones, setCotizaciones] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);

  // Estados para los modales de desactivación
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // URLs de las APIs
  const API_CLIENTE = 'http://localhost:3001/api/cliente'; 
  const API_COTIZACION = 'http://localhost:3001/api/cotizacion'; 
  const API_FACTURA = 'http://localhost:3001/api/factura'; 

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (vistaActual === 'detalle' && cliente.id_cliente) {
      cargarDocumentosCliente(cliente.id_cliente);
    }
  }, [vistaActual, cliente.id_cliente]);

  const cargarClientes = async () => {
    try {
      const response = await fetch(API_CLIENTE);
      if (response.ok) {
        const data = await response.json();
        setLista(data); 
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const cargarDocumentosCliente = async (idCliente) => {
    setCargandoDocs(true);
    try {
      const [resCotizaciones, resFacturas] = await Promise.all([
        fetch(API_COTIZACION),
        fetch(API_FACTURA)
      ]);

      let dataCotizaciones = [];
      let dataFacturas = [];

      if (resCotizaciones.ok) dataCotizaciones = await resCotizaciones.json();
      if (resFacturas.ok) dataFacturas = await resFacturas.json();

      const cotizacionesDelCliente = dataCotizaciones.filter(
        (doc) => String(doc.idcliente) === String(idCliente) || String(doc.id_cliente) === String(idCliente)
      );
      
      const facturasDelCliente = dataFacturas.filter(
        (doc) => String(doc.idcliente) === String(idCliente) || String(doc.id_cliente) === String(idCliente)
      );

      setCotizaciones(cotizacionesDelCliente);
      setFacturas(facturasDelCliente);
    } catch (error) {
      console.error("Error al cargar documentos del cliente:", error);
    } finally {
      setCargandoDocs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const AbrirDetalle = (c) => {
    setCliente(c);
    setVerMas(false);
    setModoEdicion(false);
    setMenuAbierto(false);
    setBusquedaDoc("");
    setVistaActual('detalle');
  };

  const VolverALista = () => {
    setVistaActual('lista');
    setCliente({ id_cliente: '', nombre: '', apellido: '', tipo_documento: '', documento: '', telefono: '', direccion: '', correo: '' });
  };

  const NuevoCliente = () => {
    setCliente({ id_cliente: '', nombre: '', apellido: '', tipo_documento: '', documento: '', telefono: '', direccion: '', correo: '' });
    setModoEdicion(true);
    setVerMas(true);
    setVistaActual('detalle');
    setCotizaciones([]);
    setFacturas([]);
  };

  const Guardar = async (e) => {
    e.preventDefault();
    if (!cliente.nombre || !cliente.documento || !cliente.tipo_documento) {
      alert('El nombre, el tipo y número de documento son obligatorios');
      return;
    }

    try {
      if (cliente.id_cliente) {
        await fetch(`${API_CLIENTE}/${cliente.id_cliente}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cliente) 
        });
        setModoEdicion(false); 
      } else {
        const { id_cliente, ...datosNuevoCliente } = cliente;
        await fetch(API_CLIENTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosNuevoCliente)
        });
        VolverALista(); 
      }
      cargarClientes();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
    }
  };

  // --- LÓGICA DE LOS MODALES DE DESACTIVACIÓN ---
  const IniciarDesactivacion = () => {
    setMenuAbierto(false);
    setMostrarModalConfirmacion(true);
  };

  const ConfirmarDesactivacion = async () => {
    try {
      await fetch(`${API_CLIENTE}/${cliente.id_cliente}`, { method: 'DELETE' });
      cargarClientes();
      setMostrarModalConfirmacion(false);
      setMostrarModalExito(true); // Muestra el mensaje de éxito
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Hubo un error al intentar desactivar el cliente.");
      setMostrarModalConfirmacion(false);
    }
  };

  const CerrarModalExito = () => {
    setMostrarModalExito(false);
    VolverALista(); // Regresa a la tabla principal
  };

  // Filtrado de documentos
  const documentosActivos = tipoDocumentos === 'cotizaciones' ? cotizaciones : facturas;
  const documentosFiltrados = documentosActivos.filter(doc => {
    const textoBusqueda = busquedaDoc.toLowerCase();
    const observaciones = (doc.observaciones || '').toLowerCase();
    const total = String(doc.total || '').toLowerCase();
    return observaciones.includes(textoBusqueda) || total.includes(textoBusqueda);
  });

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500 relative">
      
      {vistaActual === 'lista' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
            <button 
              onClick={NuevoCliente}
              className="px-4 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm"
            >
              + Nuevo Cliente
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Nombre Completo</th>
                  <th className="p-4 font-semibold text-gray-600">Documento</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id_cliente} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onClick={() => AbrirDetalle(c)}>
                    <td className="p-4 text-gray-800 font-medium">{c.nombre} {c.apellido}</td>
                    <td className="p-4 text-gray-600">
                      <span className="font-semibold text-gray-700">{c.tipo_documento}:</span> {c.documento}
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); AbrirDetalle(c); }} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-medium">
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-400">
                      Cargando clientes o no hay registros...
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
            
            {/* SECCIÓN SUPERIOR: Info del Cliente */}
            <div className="border border-gray-300 rounded-xl p-5 mb-6 relative">
              <form onSubmit={Guardar}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 uppercase">
                        {cliente.nombre || cliente.apellido ? `${cliente.nombre} ${cliente.apellido}` : 'Nuevo Cliente'}
                      </h2>
                      <p className="text-gray-600 font-medium">
                        [{cliente.tipo_documento || 'Tipo'}] {cliente.documento || 'Documento'}
                      </p>
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
                        {/* Botón modificado para abrir el modal */}
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
                      <div className="md:col-span-6">
                        <input type="text" name="nombre" value={cliente.nombre} onChange={handleChange} placeholder="Nombre" required disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>
                      <div className="md:col-span-6">
                        <input type="text" name="apellido" value={cliente.apellido} onChange={handleChange} placeholder="Apellido" disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>

                      <div className="md:col-span-4">
                        {modoEdicion ? (
                          <select name="tipo_documento" value={cliente.tipo_documento} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E] bg-white">
                            <option value="">Tipo Doc</option>
                            <option value="NIT">NIT</option>
                            <option value="CC">CC</option>
                            <option value="CE">CE</option>
                          </select>
                        ) : (
                           <input type="text" value={cliente.tipo_documento || 'Tipo Doc'} disabled className="w-full px-3 py-2 rounded-md bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center" />
                        )}
                      </div>
                      <div className="md:col-span-4">
                        <input type="text" name="documento" value={cliente.documento} onChange={handleChange} placeholder="Documento" required disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>
                      <div className="md:col-span-4">
                        <input type="text" name="telefono" value={cliente.telefono} onChange={handleChange} placeholder="Teléfono" disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>

                      <div className="md:col-span-5">
                        <input type="text" name="direccion" value={cliente.direccion} onChange={handleChange} placeholder="Dirección" disabled={!modoEdicion}
                          className={`w-full px-3 py-2 rounded-md focus:outline-none transition-colors ${modoEdicion ? 'border border-gray-300 bg-white focus:ring-2 focus:ring-[#2B547E]' : 'bg-gray-50 text-gray-600 border border-gray-100 cursor-not-allowed text-center'}`} />
                      </div>
                      <div className="md:col-span-6">
                        <input type="email" name="correo" value={cliente.correo} onChange={handleChange} placeholder="Correo Electrónico" disabled={!modoEdicion}
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
                    
                    {modoEdicion && cliente.id_cliente && (
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

            {/* SECCIÓN INFERIOR: Cotizaciones y Facturas */}
            <div className="border border-gray-300 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                
                <div className="relative">
                  <select 
                    value={tipoDocumentos} 
                    onChange={(e) => { setTipoDocumentos(e.target.value); setBusquedaDoc(""); }}
                    className="appearance-none border border-gray-300 rounded-md pl-4 pr-10 py-1.5 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2B547E] cursor-pointer"
                  >
                    <option value="cotizaciones">Cotizaciones</option>
                    <option value="facturas">Facturas</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div>
                  <input 
                    type="text" 
                    placeholder="Busca por observación o valor..." 
                    value={busquedaDoc}
                    onChange={(e) => setBusquedaDoc(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
                  />
                </div>
              </div>

              <div className="min-h-[250px] border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                {cargandoDocs ? (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-gray-400 font-medium">Cargando documentos...</p>
                  </div>
                ) : documentosFiltrados.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Observaciones</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosFiltrados.map((doc, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-white transition">
                          <td className="px-4 py-3 text-gray-500">#{doc.id || doc.id_cotizacion || doc.id_factura || index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">{doc.observaciones || 'Sin observaciones'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">${doc.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-gray-400 font-medium">
                      No se encontraron {tipoDocumentos} {busquedaDoc && 'con esa búsqueda'}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Desactivar Cliente</h3>
            <p className="text-gray-600 mb-6 text-sm">
              ¿Estás seguro de que deseas desactivar a <strong>{cliente.nombre} {cliente.apellido}</strong>? El cliente será desactivado del sistema y no podrás gestionarlo hasta volver a activarlo.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setMostrarModalConfirmacion(false)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-semibold"
              >
                Cancelar
              </button>
              <button 
                onClick={ConfirmarDesactivacion} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-semibold shadow-sm"
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Completado!</h3>
            <p className="text-gray-600 mb-6 text-sm">
              La acción fue completada con éxito. El cliente ha sido desactivado correctamente.
            </p>
            <button 
              onClick={CerrarModalExito} 
              className="w-full px-4 py-2 bg-[#2B547E] text-white rounded-md hover:bg-blue-800 transition text-sm font-semibold shadow-sm"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}