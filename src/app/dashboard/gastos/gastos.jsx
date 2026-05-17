// "use client";
// import React, { useState } from 'react';

// export default function GestionGastos() {
//   // Estado para el formulario de gastos
//   const [gasto, setGasto] = useState({ 
//     id_gasto: '', 
//     descripcion: '', 
//     tipo: '', 
//     monto: '' 
//   });
  
//   const [lista, setLista] = useState([]);
//   const [esEdicion, setEsEdicion] = useState(false);

//   // Manejador de cambios para inputs y el select
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setGasto({ ...gasto, [name]: value });
//   };

//   // Método Guardar
//   const Guardar = (e) => {
//     e.preventDefault();
    
//     // Validación básica
//     if (!gasto.descripcion || !gasto.monto || !gasto.tipo) {
//       alert('La descripción, el tipo y el monto son obligatorios');
//       return;
//     }

//     if (esEdicion) {
//       // Actualizar existente
//       setLista(lista.map(m => (m.id_gasto === gasto.id_gasto ? gasto : m)));
//     } else {
//       // Registrar nuevo (usamos Date.now() para simular un ID único de base de datos)
//       const nuevoGasto = { ...gasto, id_gasto: Date.now() };
//       setLista([...lista, nuevoGasto]);
//     }
//     Cancelar();
//   };

//   // Cargar datos al formulario para editar
//   const IniciarEdicion = (m) => {
//     setGasto(m);
//     setEsEdicion(true);
//   };

//   // Eliminar elemento de la lista
//   const Eliminar = (id) => {
//     setLista(lista.filter(m => m.id_gasto !== id));
//   };

//   // Limpiar formulario y salir de modo edición
//   const Cancelar = () => {
//     setGasto({ id_gasto: '', descripcion: '', tipo: '', monto: '' });
//     setEsEdicion(false);
//   };

//   return (
//     <div className="w-full mt-4 animate-in fade-in duration-500">
//       <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Gastos</h2>
      
//       {/* Formulario */}
//       <form onSubmit={Guardar} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        
//         {/* Fila 1: Descripción y Tipo de Gasto */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
//             <input
//               type="text"
//               name="descripcion"
//               className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
//               value={gasto.descripcion}
//               onChange={handleChange}
//               placeholder="Ej. Pago de luz, Compra de acero..."
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto</label>
//             <select
//               name="tipo"
//               className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E] bg-white"
//               value={gasto.tipo}
//               onChange={handleChange}
//             >
//               <option value="">Tipo Gasto...</option>
//               <option value="Servicio">Servicio</option>
//               <option value="Materia Prima">Materia Prima</option>
//               <option value="Nomina">Nómina</option>
//             </select>
//           </div>
//         </div>

//         {/* Fila 2: Monto */}
//         <div className="mb-6 w-full md:w-1/2 md:pr-2">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
//           <input
//             type="number"
//             name="monto"
//             className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B547E]"
//             value={gasto.monto}
//             onChange={handleChange}
//             placeholder="0.00"
//             step="0.01"
//           />
//         </div>

//         {/* Botones */}
//         <div className="flex gap-3">
//           <button type="submit" className="px-6 py-2 bg-[#2B547E] text-white font-medium rounded-md hover:bg-blue-800 transition shadow-sm">
//             {!esEdicion ? "Registrar" : "Actualizar"}
//           </button>
//           {esEdicion && (
//             <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition" onClick={Cancelar}>
//               Cancelar
//             </button>
//           )}
//         </div>
//       </form>

//       {/* Tabla de Registros */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="p-4 font-semibold text-gray-600">Descripción</th>
//               <th className="p-4 font-semibold text-gray-600">Tipo</th>
//               <th className="p-4 font-semibold text-gray-600">Monto</th>
//               <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
//             </tr>
//           </thead>
//           <tbody>
//             {lista.map((m) => (
//               <tr key={m.id_gasto} className="border-b border-gray-100 hover:bg-gray-50 transition">
//                 <td className="p-4 text-gray-800 font-medium">{m.descripcion}</td>
//                 <td className="p-4 text-gray-600">
//                   {/* Pequeño badge (etiqueta) para que el tipo resalte visualmente */}
//                   <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">
//                     {m.tipo}
//                   </span>
//                 </td>
//                 <td className="p-4 text-gray-800">${m.monto}</td>
//                 <td className="p-4 flex justify-center gap-2">
//                   <button onClick={() => IniciarEdicion(m)} className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition text-sm font-medium">
//                     Editar
//                   </button>
//                   <button onClick={() => Eliminar(m.id_gasto)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium">
//                     Eliminar
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {lista.length === 0 && (
//               <tr>
//                 <td colSpan="4" className="p-8 text-center text-gray-400">
//                   No hay gastos registrados aún.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

"use client";
import React, { useState, useEffect } from 'react';

// Define la ruta base de tu backend
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

  // 1. OBTENER DATOS (GET) al montar el componente
  useEffect(() => {
    obtenerGastos();
  }, []);

  const obtenerGastos = async () => {
    try {
      const respuesta = await fetch(API_URL);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setLista(datos);
      }
    } catch (error) {
      console.error("Error al cargar los gastos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGasto({ ...gasto, [name]: value });
  };

  // 2. CREAR (POST) o ACTUALIZAR (PUT)
  const Guardar = async (e) => {
    e.preventDefault();
    
    if (!gasto.descripcion || !gasto.monto || !gasto.tipo) {
      alert('La descripción, el tipo y el monto son obligatorios');
      return;
    }

    try {
      if (esEdicion) {
        // Petición PUT
        await fetch(`${API_URL}/${gasto.id_gasto}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasto)
        });
      } else {
        // Petición POST
        const {id_gasto, ...datosNuevaFactura} = gasto;
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosNuevaFactura)
        });
      }
      
      // Refrescar la tabla y limpiar el formulario
      await obtenerGastos();
      Cancelar();

    } catch (error) {
      console.error("Error al guardar el gasto:", error);
      alert("Hubo un error al comunicar con el servidor.");
    }
  };

  const IniciarEdicion = (m) => {
    setGasto(m);
    setEsEdicion(true);
  };

  // 3. ELIMINAR (DELETE)
  const Eliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este gasto?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      // Refrescar la tabla tras eliminar
      await obtenerGastos();
    } catch (error) {
      console.error("Error al eliminar el gasto:", error);
    }
  };

  const Cancelar = () => {
    setGasto({ id_gasto: '', descripcion: '', tipo: '', monto: '' });
    setEsEdicion(false);
  };

  return (
    <div className="w-full mt-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Gastos</h2>
      
      {/* Formulario */}
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

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Descripción</th>
              <th className="p-4 font-semibold text-gray-600">Tipo</th>
              <th className="p-4 font-semibold text-gray-600">Monto</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id_gasto} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4 text-gray-800 font-medium">{m.descripcion}</td>
                <td className="p-4 text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">
                    {m.tipo}
                  </span>
                </td>
                <td className="p-4 text-gray-800">${m.monto}</td>
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
                <td colSpan="4" className="p-8 text-center text-gray-400">
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