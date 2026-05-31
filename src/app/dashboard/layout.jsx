"use client";
import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { NotificationProvider } from "../../context/NotificationContext";
import NotificationBell from "../../components/NotificationBell";
import Accesos from "../../components/Accesos";
import GlobalSearch from "../../components/GlobalSearch";
import ToastPopup from "../../components/ToastPopup";

const UserIcon = ({ letra }) => (
  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-md transition-transform duration-200">
    {letra || "N"}
  </div>
);

const SidebarItem = ({ href, icon: Icon, title, label }) => (
  <Link href={href} className="hover:scale-110 transition cursor-pointer flex flex-col items-center gap-1 group" title={title}>
    <Icon />
    <span className="text-xs group-hover:underline text-center">{label}</span>
  </Link>
);

const ClienteIcon = () => <Image width={32} height={32} src="/nueva-cuenta.png" alt="cliente" />;
const MaquinariaIcon = () => <Image width={32} height={32} src="/excavador.png" alt="maquinaria" />;
const ProductosIcon = () => <Image width={32} height={32} src="/agregar-producto.png" alt="productos" />;
const GastoIcon = () => <Image width={32} height={32} src="/gastos.png" alt="gastos" />;
const ProveedorIcon = () => <Image width={32} height={32} src="/proveedor.png" alt='proveedor' />;
const FabricacionIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const ComprasIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const CotizarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const DocumentosIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function DashboardLayout({ children }) {
  const appBlue = 'bg-[#2B547E]';
  const [usuario, setUsuario] = useState({ nombre: "", rol: "" });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user_salerp");
      if (raw) {
        const datos = JSON.parse(raw);
        setUsuario({
          nombre: datos.nombre || (datos.correo ? datos.correo.split('@')[0] : ""),
          rol: datos.rol || ""
        });
      }
    } catch {}
  }, []);

  const esAdmin = usuario.rol?.toLowerCase() === "admin";

  return (
    <NotificationProvider>
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden">
      
      <header className={`w-full h-16 ${appBlue} text-white flex items-center justify-between px-6 shadow-lg z-20 flex-shrink-0`}>
        <Link href={esAdmin ? "/dashboard" : "/dashboard/cotizar"} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm"></div>
          <span className="font-bold text-2xl tracking-wider">SALERP</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {esAdmin && <Accesos />}
          {esAdmin && <GlobalSearch />}
        </div>

        <div className="flex items-center gap-2">
          <ToastPopup />
          <NotificationBell />
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
                onClick={() => { sessionStorage.removeItem("user_salerp"); window.location.href = "/"; }}
                className="w-full text-left text-xs text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors font-medium"
              >
                Cerrar Sesión del Sistema
              </button>
            </div>
          </div>

        </div>
        </div>
      </header>

      <div className="w-full flex flex-grow overflow-hidden">
        
        <main className="flex-grow bg-white p-8 overflow-y-auto relative">
            {children}
        </main>

        <aside className={`w-1/4 max-w-[200px] min-w-[120px] ${appBlue} text-white py-8 px-4 flex flex-col items-center gap-10 shadow-inner z-0 overflow-y-auto`}>
          {esAdmin ? (
            <>
              <SidebarItem href="/dashboard/clientes" icon={ClienteIcon} label="Clientes" title="Agregar clientes" />
              <SidebarItem href="/dashboard/maquinaria" icon={MaquinariaIcon} label="Maquinaria" title="Estados de la maquinaria" />
              <SidebarItem href="/dashboard/productos" icon={ProductosIcon} label="Productos" title="Detalles de los productos" />
              <SidebarItem href="/dashboard/gastos" icon={GastoIcon} label="Gastos" title="Análisis de los gastos" />
              <SidebarItem href="/dashboard/proveedor" icon={ProveedorIcon} label="Proveedor" title="Gestion de Proveedor" />
              <SidebarItem href="/dashboard/fabricacion" icon={FabricacionIcon} label="Fabricacion" title="Ordenes de fabricacion" />
              <SidebarItem href="/dashboard/compras" icon={ComprasIcon} label="Compras" title="Compras a proveedores" />
            </>
          ) : (
            <>
              <SidebarItem href="/dashboard/cotizar" icon={CotizarIcon} label="Cotizar" title="Realiza tu cotización" />
              <SidebarItem href="/dashboard/mis-documentos" icon={DocumentosIcon} label="Mis Documentos" title="Revisa tus documentos" />
            </>
          )}
        </aside>

      </div>
    </div>
    </NotificationProvider>
  );
}
