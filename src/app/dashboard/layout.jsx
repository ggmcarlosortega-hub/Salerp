"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';

const UserIcon = ({ letra }) => (
  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-md transition-transform duration-200">
    {letra || "N"}
  </div>
);

const SidebarItem = ({ href, icon: Icon, title, label, isHighlighted, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`hover:scale-110 transition cursor-pointer flex flex-col items-center gap-1 group relative ${isHighlighted ? 'bg-white/20 rounded-lg p-2' : ''}`}
    title={title}
  >
    {isHighlighted && (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" title="Más usado" />
    )}
    <Icon />
    <span className="text-xs group-hover:underline text-center">{label}</span>
  </Link>
);

const ClienteIcon = () => <Image width={32} height={32} src="/nueva-cuenta.png" alt="cliente" />;
const MaquinariaIcon = () => <Image width={32} height={32} src="/excavador.png" alt="maquinaria" />;
const ProductosIcon = () => <Image width={32} height={32} src="/agregar-producto.png" alt="productos" />;
const GastoIcon = () => <Image width={32} height={32} src="/gastos.png" alt="gastos" />;
const ProveedorIcon = () => <Image width={32} height={32} src="/proveedor.png" alt='proveedor' />;

const modulosData = {
  clientes: {
    label: "Clientes",
    functions: [
      { label: "Nuevo cliente", action: "nuevoCliente" },
      { label: "Ver clientes", action: "verLista" },
    ]
  },
  maquinaria: {
    label: "Maquinaria",
    functions: [
      { label: "Nueva maquinaria", action: "nuevo" },
      { label: "Ver maquinaria", action: "verLista" },
    ]
  },
  productos: {
    label: "Productos",
    functions: [
      { label: "Nuevo producto", action: "nuevoProducto" },
      { label: "Ver productos", action: "verLista" },
      { label: "Nueva categoría", action: "nuevaCategoria" },
    ]
  },
  gastos: {
    label: "Gastos",
    functions: [
      { label: "Nuevo gasto", action: "nuevo" },
      { label: "Ver gastos", action: "verLista" },
    ]
  },
  proveedor: {
    label: "Proveedor",
    functions: [
      { label: "Nuevo proveedor", action: "nuevoProveedor" },
      { label: "Ver proveedores", action: "verLista" },
    ]
  }
};

export default function DashboardLayout({ children }) {
  const appBlue = 'bg-[#2B547E]';
  const router = useRouter();

  const [usuario, setUsuario] = useState({ nombre: "Admin", rol: "Administrador" });
  const [usuarioId, setUsuarioId] = useState(null);
  const [moduloMasUsado, setModuloMasUsado] = useState(null);
  const [showAccesos, setShowAccesos] = useState(false);
  const [estadisticasAccesos, setEstadisticasAccesos] = useState([]);
  const [busquedaQuery, setBusquedaQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const busquedaRef = useRef(null);

  useEffect(() => {
    const sesion = localStorage.getItem("user_salerp");
    if (sesion) {
      try {
        const datos = JSON.parse(sesion);
        setUsuario({
          nombre: datos.nombre || datos.correo.split('@')[0],
          rol: datos.rol || "Administrador"
        });
        setUsuarioId(datos.id_acceso);
      } catch (error) {
        console.error("Error leyendo datos de sesión:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (usuarioId) {
      fetch(`http://localhost:3001/api/actividad/mas-usado/${usuarioId}`)
        .then(res => res.json())
        .then(data => {
          if (data.moduloMasUsado) {
            setModuloMasUsado(data.moduloMasUsado);
          }
        })
        .catch(err => console.error("Error cargando módulo más usado:", err));
    }
  }, [usuarioId]);

  useEffect(() => {
    if (showAccesos && usuarioId) {
      fetch(`http://localhost:3001/api/actividad/estadisticas/${usuarioId}`)
        .then(res => res.json())
        .then(data => {
          if (data.estadisticas) {
            setEstadisticasAccesos(data.estadisticas);
          }
        })
        .catch(err => console.error("Error cargando estadísticas:", err));
    }
  }, [showAccesos, usuarioId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAccesos && !e.target.closest('.accesos-dropdown')) {
        setShowAccesos(false);
      }
      if (showDropdown && busquedaRef.current && !busquedaRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAccesos, showDropdown]);

  const handleBusquedaChange = (e) => {
    const query = e.target.value.toLowerCase();
    setBusquedaQuery(e.target.value);
    setSelectedIndex(0);
    if (query.length < 2) {
      setResultados([]);
      setShowDropdown(false);
      return;
    }
    const results = [];
    Object.entries(modulosData).forEach(([modKey, modData]) => {
      const modMatches = modKey.includes(query) || modData.label.toLowerCase().includes(query);
      if (modMatches) {
        results.push({ tipo: 'modulo', key: modKey, label: modData.label });
      }
      modData.functions.forEach(fn => {
        if (fn.label.toLowerCase().includes(query)) {
          results.push({ tipo: 'funcion', modulo: modKey, moduloLabel: modData.label, ...fn });
        }
      });
    });
    setResultados(results.slice(0, 10));
    setShowDropdown(true);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = resultados[selectedIndex];
      if (selected) {
        navigateToResult(selected);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const navigateToResult = (result) => {
    setShowDropdown(false);
    setBusquedaQuery("");
    setResultados([]);
    if (result.tipo === 'modulo') {
      router.push(`/dashboard/${result.key}`);
    } else {
      const accion = result.action;
      localStorage.setItem('pendingAction', JSON.stringify({
        modulo: result.modulo,
        action: accion
      }));
      router.push(`/dashboard/${result.modulo}`);
    }
  };

  const registrarAcceso = async (modulo) => {
    if (!usuarioId) return;
    try {
      await fetch('http://localhost:3001/api/actividad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idAcceso: usuarioId, modulo })
      });
    } catch (err) {
      console.error("Error registrando acceso:", err);
    }
  };

  const modulos = [
    { href: "/dashboard/clientes", icon: ClienteIcon, label: "Clientes", key: "clientes" },
    { href: "/dashboard/maquinaria", icon: MaquinariaIcon, label: "Maquinaria", key: "maquinaria" },
    { href: "/dashboard/productos", icon: ProductosIcon, label: "Productos", key: "productos" },
    { href: "/dashboard/gastos", icon: GastoIcon, label: "Gastos", key: "gastos" },
    { href: "/dashboard/proveedor", icon: ProveedorIcon, label: "Proveedor", key: "proveedor" },
  ];

  const groupedResults = {
    modulo: resultados.filter(r => r.tipo === 'modulo'),
    funciones: resultados.filter(r => r.tipo === 'funcion')
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden">
      <header className={`w-full h-16 ${appBlue} text-white flex items-center justify-between px-6 shadow-lg z-20 flex-shrink-0`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm"></div>
          <span className="font-bold text-2xl tracking-wider">SALERP</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="relative" ref={busquedaRef}>
            <input
              type="text"
              placeholder="búsqueda..."
              value={busquedaQuery}
              onChange={handleBusquedaChange}
              onKeyDown={handleKeyDown}
              onFocus={() => busquedaQuery.length >= 2 && setShowDropdown(true)}
              className="px-3 py-1.5 w-72 text-sm text-gray-800 rounded focus:outline-none bg-white"
            />
            {showDropdown && busquedaQuery.length >= 2 && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                {resultados.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">Sin resultados</div>
                ) : (
                  <>
                    {groupedResults.modulo.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b">Módulos</div>
                        {groupedResults.modulo.map((item, idx) => {
                          const globalIdx = idx;
                          return (
                            <div
                              key={item.key}
                              onClick={() => navigateToResult(item)}
                              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${selectedIndex === globalIdx ? 'bg-blue-50' : ''}`}
                            >
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {groupedResults.funciones.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b">Funciones</div>
                        {groupedResults.funciones.map((item, idx) => {
                          const globalIdx = groupedResults.modulo.length + idx;
                          return (
                            <div
                              key={`${item.modulo}-${item.action}`}
                              onClick={() => navigateToResult(item)}
                              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 ${selectedIndex === globalIdx ? 'bg-blue-50' : ''}`}
                            >
                              <span className="text-xs text-gray-400 w-16">{item.moduloLabel}</span>
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="relative accesos-dropdown">
            <button
              onClick={() => setShowAccesos(!showAccesos)}
              className="px-4 py-1.5 border border-white rounded font-medium hover:bg-white hover:text-[#2B547E] transition"
            >
              + Accesos
            </button>
            {showAccesos && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Módulos más usados (30 días)</h3>
                {estadisticasAccesos.length > 0 ? (
                  <ul className="space-y-1">
                    {estadisticasAccesos.map((stat, idx) => (
                      <li key={stat.modulo} className="flex justify-between text-sm">
                        <span className="capitalize">{stat.modulo}</span>
                        <span className="text-gray-500">{stat.cantidad} accesos</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Sin datos aún</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative group p-2 cursor-pointer rounded-md hover:bg-white/10 transition-colors duration-200">
          <UserIcon letra={usuario.nombre.charAt(0).toUpperCase()} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 p-4 invisible opacity-0 scale-95 group-hover:visible group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nombre del Usuario</span>
              <span className="text-sm font-bold text-gray-900 truncate mb-1">{usuario.nombre}</span>
              <div className="border-t border-gray-100 my-1"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Rol de Sistema</span>
              <span className="inline-block text-xs font-semibold bg-blue-50 text-[#2B547E] px-2 py-1 rounded border border-blue-100 w-max">
                {usuario.rol}
              </span>
              <div className="border-t border-gray-100 my-2"></div>
              <button
                onClick={() => { localStorage.removeItem("user_salerp"); window.location.href = "/"; }}
                className="w-full text-left text-xs text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors font-medium"
              >
                Cerrar Sesión del Sistema
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full flex flex-grow overflow-hidden">
        <main className="flex-grow bg-white p-8 overflow-y-auto relative">
          {children}
        </main>
        <aside className={`w-1/4 max-w-[200px] min-w-[120px] ${appBlue} text-white py-8 px-4 flex flex-col items-center gap-10 shadow-inner z-0 overflow-y-auto`}>
          {modulos.map(mod => (
            <SidebarItem
              key={mod.key}
              href={mod.href}
              icon={mod.icon}
              label={mod.label}
              title={mod.label}
              isHighlighted={moduloMasUsado === mod.key}
              onClick={() => registrarAcceso(mod.key)}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
