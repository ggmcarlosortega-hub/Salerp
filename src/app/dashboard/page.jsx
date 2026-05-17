"use client";
import React from 'react';

export default function DashboardHome() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Sección del Banner de Bienvenida */}
      <div className="bg-[#2B547E] text-white p-8 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold mb-2">¡Bienvenido a SalERP!</h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            El sistema integral diseñado para automatizar y controlar de manera eficiente la gestión empresarial, 
            el inventario de materias primas, el estado operativo de la maquinaria y los flujos financieros de tu negocio.
          </p>
        </div>
        <div className="text-5xl hidden md:block">🏢</div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📖</span> Guía de Operación del Software
      </h2>

      {/* Grid Informativo sobre el uso de los Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Tarjeta 1: Gestión de Terceros */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👥</span>
            <h3 className="text-lg font-bold text-gray-800">1. Registro de Clientes</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Permite el control y almacenamiento de los datos de terceros autorizados. Se prioriza el registro mediante 
            el número de RUT/NIT o documento de identidad correspondiente.
          </p>
          <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg font-medium border border-amber-100">
            📌 Regla Clave: Este módulo es el pilar del sistema. No se pueden emitir transacciones comerciales sin clientes previos en la base de datos.
          </div>
        </div>

        {/* Tarjeta 2: Control de Inventarios */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📦</span>
            <h3 className="text-lg font-bold text-gray-800">2. Gestión de Productos</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Administra el catálogo de materiales y productos terminados, permitiendo registrar costos de adquisición 
            y cantidades disponibles en tiempo real.
          </p>
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg font-medium border border-blue-100">
            ⚠️ Alerta Automática: El sistema exige un límite mínimo de ingreso de 3 unidades para asegurar que no ocurran desabastecimientos de materia prima.
          </div>
        </div>

        {/* Tarjeta 3: Procesos Comerciales */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📄</span>
            <h3 className="text-lg font-bold text-gray-800">3. Facturación y Cotizaciones</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Permite la generación de documentos comerciales dinámicos con base en los clientes y productos cargados. 
            Las facturas reflejan la venta final, mientras que las cotizaciones calculan propuestas económicas ágiles para optimizar los tiempos de espera.
          </p>
        </div>

        {/* Tarjeta 4: Salud Financiera */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📉</span>
            <h3 className="text-lg font-bold text-gray-800">4. Control de Gastos</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Módulo dedicado al registro minucioso de egresos operacionales (servicios públicos, adquisición de materia prima externa, nóminas). El vaciado correcto de esta información alimenta los gráficos financieros globales para mitigar pérdidas.
          </p>
        </div>

      </div>

      {/* Barra de estado rápido o notas del sistema */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500">
        SalERP v1.0 • Interfaz optimizada • Para soporte técnico o configuraciones avanzadas, contacte al administrador del sistema.
      </div>

    </div>
  );
}