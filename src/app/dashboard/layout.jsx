"use client";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link"; 

// Componente del círculo de perfil con inicial dinámica
const UserIcon = ({ letra }) => (
  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-md transition-transform duration-200">
    {letra || "N"}
  </div>
);

// Componente para los enlaces de la barra lateral
const SidebarItem = ({ href, icon: Icon, title, label }) => (
  <Link href={href} className="hover:scale-110 transition cursor-pointer flex flex-col items-center gap-1 group" title={title}>
    <Icon />
    <span className="text-xs group-hover:underline text-center">{label}</span>
  </Link>
);

// Declaración de iconos de módulos utilizando Next.js Image
const ClienteIcon = () => <Image width={32} height={32} src="/nueva-cuenta.png" alt="cliente" />;
const MaquinariaIcon = () => <Image width={32} height={32} src="/excavador.png" alt="maquinaria" />;
const ProductosIcon = () => <Image width={32} height={32} src="/agregar-producto.png" alt="productos" />;
const GastoIcon = () => <Image width={32} height={32} src="/gastos.png" alt="gastos" />;
const FacturaIcon = () => <Image width={32} height={32} src="/factura.png" alt="facturas" />; 
const CotizacionIcon = () => <Image width={32} height={32} src="/cotizacion.png" alt="cotizaciones" />;
const ProveedorIcon = () => <Image width={32} height={32} src="/proveedor.png" alt="Proveedor" />; 

// LISTA DE MÓDULOS PARA EL BUSCADOR RÁPIDO
const modulosAcceso = [
  { id: 1, label: 'Clientes', href: '/dashboard/clientes', desc: 'Agregar clientes' },
  { id: 2, label: 'Maquinaria', href: '/dashboard/maquinaria', desc: 'Estados de la maquinaria' },
  { id: 3, label: 'Productos', href: '/dashboard/productos', desc: 'Detalles de los productos' },
  { id: 4, label: 'Gastos', href: '/dashboard/gastos', desc: 'Análisis de los gastos' },
  { id: 5, label: 'Facturas', href: '/dashboard/facturas', desc: 'Asignar facturas' },
  { id: 6, label: 'Cotización', href: '/dashboard/cotizacion', desc: 'Cotizar productos' },
];

export default function DashboardLayout({ children }) {
  const appBlue = 'bg-[#2B547E]';

  // Estado del usuario
  const [usuario, setUsuario] = useState({ nombre: "Admin", rol: "Administrador" });

  // Estados para el buscador rápido
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  // Petición de lectura local una vez montado el DOM
  useEffect(() => {
    const sesion = localStorage.getItem("user_salerp");
    if (sesion) {
      try {
        const datos = JSON.parse(sesion);
        setUsuario({
          nombre: datos.nombre || datos.correo.split('@')[0],
          rol: datos.rol || "Administrador"
        });
      } catch (error) {
        console.error("Error leyendo datos de sesión:", error);
      }
    }
  }, []);

  // Función para manejar la búsqueda en tiempo real
  const handleBusqueda = (e) => {
    const texto = e.target.value;
    setBusqueda(texto);

    if (texto.trim().length > 0) {
      const filtrados = modulosAcceso.filter(mod => 
        mod.label.toLowerCase().includes(texto.toLowerCase()) || 
        mod.desc.toLowerCase().includes(texto.toLowerCase())
      );
      setResultados(filtrados);
      setMostrarBuscador(true);
    } else {
      setResultados([]);
      setMostrarBuscador(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden">
      
      {/* TOPBAR ESTÁTICA */}
      <header className={`w-full h-16 ${appBlue} text-white flex items-center justify-between px-6 shadow-lg z-20 flex-shrink-0`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm"></div>
          <span className="font-bold text-2xl tracking-wider">SALERP</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <button className="px-4 py-1.5 border border-white rounded font-medium hover:bg-white hover:text-[#2B547E] transition">+ Accesos</button>
          
          {/* CONTENEDOR DEL BUSCADOR RÁPIDO */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="búsqueda rápida..." 
              value={busqueda}
              onChange={handleBusqueda}
              onFocus={() => busqueda.trim().length > 0 && setMostrarBuscador(true)}
              // onBlur con setTimeout para dar tiempo a que el click en el enlace funcione antes de cerrar el cuadro
              onBlur={() => setTimeout(() => setMostrarBuscador(false), 200)}
              className="px-3 py-1.5 w-72 text-sm text-gray-800 rounded focus:outline-none bg-white transition-shadow focus:ring-2 focus:ring-blue-300" 
            />
            
            {/* DESPLEGABLE DE RESULTADOS */}
            {mostrarBuscador && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden z-50">
                {resultados.length > 0 ? (
                  resultados.map((res) => (
                    <Link 
                      key={res.id} 
                      href={res.href} 
                      className="block px-4 py-2 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        setBusqueda(""); // Limpia el input al hacer clic
                        setMostrarBuscador(false);
                      }}
                    >
                      <p className="text-sm font-bold text-[#2B547E]">{res.label}</p>
                      <p className="text-xs text-gray-500">{res.desc}</p>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No se encontraron módulos.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* ÁREA COOPERATIVA DEL PERFIL */}
        <div className="relative group p-2 cursor-pointer rounded-md hover:bg-white/10 transition-colors duration-200">
          <UserIcon letra={usuario.nombre.charAt(0).toUpperCase()} />

          <div className="absolute right-0 top-full mt-2 w-52 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 p-4 invisible opacity-0 scale-95 group-hover:visible group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nombre del Usuario</span>
              <span className="text-sm font-bold text-gray-900 truncate mb-1">{usuario.nombre}</span>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Rol de Sistema</span>
              <span className="inline-block text-xs font-semibold bg-blue-50 text-[#2B547E] px-2 py-1 rounded border border-blue-100 w-max">
                💼 {usuario.rol}
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

      {/* CUERPO PRINCIPAL CON DIVISIONES DE SCROLL INDEPENDIENTES */}
      <div className="w-full flex flex-grow overflow-hidden">
        
        {/* CONTENIDO INTERNO DINÁMICO (Izquierda) */}
        <main className="flex-grow bg-white p-8 overflow-y-auto relative">
          {children}
        </main>

        {/* BARRA LATERAL FIJA DE ACCESOS (Derecha) */}
        <aside className={`w-30 ${appBlue} text-white py-8 px-4 flex flex-col items-center gap-10 shadow-inner z-0 overflow-y-auto`}>
          <SidebarItem href="/dashboard/clientes" icon={ClienteIcon} label="Clientes" title="Agregar clientes" />
          <SidebarItem href="/dashboard/maquinaria" icon={MaquinariaIcon} label="Maquinaria" title="Estados de la maquinaria" />
          <SidebarItem href="/dashboard/productos" icon={ProductosIcon} label="Productos" title="Detalles de los productos" />
          <SidebarItem href="/dashboard/gastos" icon={GastoIcon} label="Gastos" title="Análisis de los gastos" />
          <SidebarItem href="/dashboard/facturas" icon={FacturaIcon} label="Facturas" title="Asignar facturas" />
          <SidebarItem href="/dashboard/cotizacion" icon={CotizacionIcon} label="Cotización" title="Cotizar productos" />
          <SidebarItem href="/dashboard/proveedor" icon={ProveedorIcon} label="Proveedor" title="Registrar Proveedores" />
        </aside>

      </div>
    </div>
  );
}