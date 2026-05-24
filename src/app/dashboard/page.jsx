"use client";
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ArrowDownCircle, Package, TrendingUp } from 'lucide-react';

export default function DashboardHome() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/dashboard');
        if (response.ok) {
          const resultado = await response.json();
          setData(resultado);
        }
      } catch (error) {
        console.error("Error conectando al servidor:", error);
      }
    };
    cargarDatos();
  }, []);

  if (!data) return <div className="p-10 text-center text-gray-500 font-bold">Cargando estadísticas de SalERP...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-700 mt-4">
      
      {/* Banner Superior */}
      <div className="bg-[#2B547E] text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control SalERP</h1>
          <p className="text-blue-100 text-sm">Resumen estadístico y financiero de tu negocio</p>
        </div>
        <TrendingUp size={40} className="opacity-20" />
      </div>

      {/* Tarjetas de Resumen */}
      <div style={{ width: "100%", height: "300px" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Ingresos" value={`$${data.tarjetas.ingresos}`} icon={<DollarSign/>} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Gastos" value={`$${data.tarjetas.gastos}`} icon={<ArrowDownCircle/>} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Utilidad" value={`$${data.tarjetas.balance}`} icon={<TrendingUp/>} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Alertas Stock" value={data.tarjetas.alertas} icon={<Package/>} color="text-amber-600" bg="bg-amber-50" footer="Productos con 3 o menos unidades" />
      </div>
      </div>

      {/* Gráfica de Barras */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Comparativa Mensual: Ingresos vs Gastos</h3>
        <div className="h-[350px] w-full">
          <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.grafica}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '10px', border: 'none'}} />
              <Bar dataKey="ingresos" fill="#2B547E" radius={[4, 4, 0, 0]} name="Ingresos ($)" />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos ($)" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// Componente para pintar las tarjetas rápidamente
function StatCard({ title, value, icon, color, bg, footer }) {
  return (
    <div className={`p-5 rounded-xl border border-gray-100 shadow-sm bg-white`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</span>
      </div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-xl font-bold text-gray-800">{value}</h3>
      {footer && <p className="text-[10px] text-amber-600 mt-1 font-medium">{footer}</p>}
    </div>
  );
}