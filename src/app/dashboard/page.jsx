"use client";
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, ArrowDownCircle, Package, TrendingUp, X, FileText, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiFetch } from '@/services/api';

const MESES_INDEX = { 'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12 };
const MESES_NOMBRE = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const COLORS = ['#2B547E', '#4a7ab3', '#6f9ce0', '#94bdf5', '#b8d4f5', '#d4e6f5'];

function formatCOP(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function formatPercent(value, total) {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export default function DashboardHome() {
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [productosData, setProductosData] = useState(null);
  const [cotizacionesData, setCotizacionesData] = useState(null);
  const [contratosData, setContratosData] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resultado = await apiFetch('http://localhost:3001/api/dashboard');
        setData(resultado);
      } catch (error) {
        console.error("Error conectando al servidor:", error);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const cargarCotizaciones = async () => {
      try {
        const [productosRes, detalleRes] = await Promise.all([
          apiFetch(`http://localhost:3001/api/dashboard/cotizaciones/productos?mes=${String(selectedMes).padStart(2, '0')}&year=${selectedYear}`),
          apiFetch(`http://localhost:3001/api/dashboard/cotizaciones/detalle?mes=${String(selectedMes).padStart(2, '0')}&year=${selectedYear}`)
        ]);
        setProductosData(productosRes);
        setCotizacionesData(detalleRes);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    cargarCotizaciones();
  }, [selectedMes, selectedYear]);

  useEffect(() => {
    const cargarContratos = async () => {
      try {
        const res = await apiFetch(`http://localhost:3001/api/dashboard/contratos?mes=${selectedMes}&year=${selectedYear}`);
        setContratosData(res);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    cargarContratos();
  }, [selectedMes, selectedYear]);

  if (!data) return <div className="p-10 text-center text-gray-500 font-bold">Cargando estadísticas de SalERP...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-700 mt-4">

      <div className="bg-[#2B547E] text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control SalERP</h1>
          <p className="text-blue-100 text-sm">Resumen estadístico y financiero de tu negocio</p>
        </div>
        <TrendingUp size={40} className="opacity-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Ingresos" value={`$${data.tarjetas.ingresos}`} icon={<DollarSign/>} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Gastos" value={`$${data.tarjetas.gastos}`} icon={<ArrowDownCircle/>} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Utilidad" value={`$${data.tarjetas.balance}`} icon={<TrendingUp/>} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Alertas Stock" value={data.tarjetas.alertas} icon={<Package/>} color="text-amber-600" bg="bg-amber-50" footer="Productos con 3 o menos unidades" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Comparativa Mensual: Ingresos vs Gastos</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.grafica}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={formatCOP} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '10px', border: 'none'}} formatter={(value) => [`$${Number(value).toLocaleString('es-CO')}`, '']} />
              <Bar dataKey="ingresos" fill="#2B547E" radius={[4, 4, 0, 0]} name="Ingresos ($)" onClick={(entry) => handleBarClick(entry)} style={{cursor: 'pointer'}} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Haz clic en una barra de mes para ver el detalle</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#2B547E]" />
            <h3 className="text-lg font-bold text-gray-800">Productos Cotizados del Mes</h3>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => changeMonth(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2B547E] text-white hover:bg-[#1e3d6a] transition-colors shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold min-w-[130px] text-center text-gray-700">{MESES_NOMBRE[selectedMes - 1]} {selectedYear}</span>
            <button onClick={() => changeMonth(1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2B547E] text-white hover:bg-[#1e3d6a] transition-colors shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {!productosData ? (
          <div className="text-center py-10 text-gray-500">Cargando...</div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-shrink-0" style={{ width: 280, height: 280 }}>
                {productosData.productos && productosData.productos.length > 0 ? (
                  <SimplePie productos={productosData.productos} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
                )}
              </div>

              <div className="flex-1 w-full">
                {productosData.productos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No hay productos cotizados este mes</div>
                ) : (
                  <div className="space-y-2">
                    {productosData.productos.map((prod, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-medium text-gray-800">{prod.nombre}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{prod.cantidad} und</span>
                          <span className="text-sm font-bold text-[#2B547E] w-14 text-right">
                            {formatPercent(prod.cantidad, productosData.productos.reduce((sum, p) => sum + Number(p.cantidad), 0))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Total cotizaciones este mes: <span className="font-bold text-[#2B547E]">{productosData.total}</span>
              </p>
            </div>

            <h4 className="text-sm font-bold text-gray-700 mt-6 mb-3">Detalle de Cotizaciones — {MESES_NOMBRE[selectedMes - 1]} {selectedYear}</h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {!cotizacionesData || cotizacionesData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay cotizaciones este mes</p>
              ) : cotizacionesData.map((cot) => (
                <div key={cot.id_cotizacion} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cot.estado === 'Aprobada' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cot.cliente}</p>
                      <p className="text-xs text-gray-500">{cot.asunto || 'Sin asunto'} · {new Date(cot.fecha).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#2B547E]">${Number(cot.total).toLocaleString('es-CO')}</p>
                    <p className="text-xs text-gray-500">{cot.estado}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">Contratos Vigentes</h3>
          </div>
        </div>
        {!contratosData ? (
          <div className="text-center py-6 text-gray-500">Cargando...</div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Total activos: <span className="font-bold text-green-700">{contratosData.total}</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {contratosData.contratos.length === 0 ? (
                <p className="text-center py-4 text-gray-400">No hay contratos vigentes</p>
              ) : contratosData.contratos.map((con, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{con.cliente}</p>
                    <p className="text-xs text-gray-500">{con.asunto || con.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">${Number(con.valor_total).toLocaleString('es-CO')}</p>
                    <p className="text-xs text-gray-500">
                      {con.dias_restantes > 0 ? `${con.dias_restantes}d restantes` : 'Vencido'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">Exportar Reporte de Ventas</h3>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download size={16} />
            Descargar Excel
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Genera un reporte con el resumen de ventas, costos de producción, márgenes de ganancia y observaciones de cambios en insumos del mes seleccionado.
        </p>
      </div>

      {detail && <MonthDetailModal mesIndex={detail.mesIndex} mesName={detail.mesName} onClose={() => setDetail(null)} />}

    </div>
  );

  function handleBarClick(entry) {
    if (entry.name === 'Hoy') return;
    const mesIndex = MESES_INDEX[entry.name];
    setDetail({ mesIndex, mesName: entry.name });
  }

  function changeMonth(delta) {
    let newMes = selectedMes + delta;
    let newYear = selectedYear;
    if (newMes > 12) { newMes = 1; newYear++; }
    if (newMes < 1) { newMes = 12; newYear--; }
    setSelectedMes(newMes);
    setSelectedYear(newYear);
  }

  function handleExport() {
    const url = `http://localhost:3001/api/reporte/ventas/excel?mes=${selectedMes}&year=${selectedYear}`;
    window.open(url, '_blank');
  }
}

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

function SimplePie({ productos }) {
  const total = productos.reduce((sum, p) => sum + Number(p.cantidad), 0);
  let currentAngle = 0;

  return (
    <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%' }}>
      {productos.map((prod, i) => {
        const angle = (Number(prod.cantidad) / total) * 360;
        if (angle === 0) return null;
        const startAngle = currentAngle - 90;
        const endAngle = startAngle + angle;
        currentAngle += angle;

        const largeArc = angle > 180 ? 1 : 0;

        const toRad = (deg) => (deg * Math.PI) / 180;
        const startX = 140 + 90 * Math.cos(toRad(startAngle));
        const startY = 140 + 90 * Math.sin(toRad(startAngle));
        const endX = 140 + 90 * Math.cos(toRad(endAngle));
        const endY = 140 + 90 * Math.sin(toRad(endAngle));

        const d = `M 140 140 L ${startX} ${startY} A 90 90 0 ${largeArc} 1 ${endX} ${endY} Z`;
        return <path key={i} d={d} fill={COLORS[i % COLORS.length]} />;
      })}
      <text x="140" y="135" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="#333333">
        {productos.length}
      </text>
      <text x="140" y="155" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#888888">
        productos
      </text>
    </svg>
  );
}

function MonthDetailModal({ mesIndex, mesName, onClose }) {
  const [info, setInfo] = useState(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await apiFetch(`http://localhost:3001/api/dashboard/detalle?mes=${mesIndex}&year=${year}`);
        setInfo(data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchDetail();
  }, [mesIndex, year]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Detalle: {mesName} {year}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
        </div>

        {!info ? (
          <div className="text-center py-10 text-gray-500">Cargando detalle...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-xs text-green-600 font-medium uppercase">Ingresos del mes</p>
                <p className="text-2xl font-bold text-green-700">${Number(info.ingresos).toLocaleString('es-CO')}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-xs text-red-600 font-medium uppercase">Gastos del mes</p>
                <p className="text-2xl font-bold text-red-700">${Number(info.gastos).toLocaleString('es-CO')}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl col-span-2">
                <p className="text-xs text-blue-600 font-medium uppercase">Utilidad del mes</p>
                <p className="text-2xl font-bold text-blue-700">${Number(info.utilidad).toLocaleString('es-CO')}</p>
              </div>
            </div>

            <h3 className="font-bold text-gray-700 mb-3">Comparativa por semana</h3>
            <div className="space-y-2 mb-6">
              {[1, 2, 3, 4].map((semana) => {
                const semanaData = info.semanas[semana - 1];
                return (
                  <div key={semana} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Semana {semana}</span>
                    <div className="flex gap-4">
                      <span className="text-sm text-green-600">+${Number(semanaData?.ingresos || 0).toLocaleString('es-CO')}</span>
                      <span className="text-sm text-red-600">-${Number(semanaData?.gastos || 0).toLocaleString('es-CO')}</span>
                      <span className="text-sm font-bold text-blue-600">${Number(semanaData?.utilidad || 0).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 className="font-bold text-gray-700 mb-3">Productos más vendidos</h3>
            <div className="space-y-2">
              {info.topProductos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay ventas registradas este mes</p>
              ) : info.topProductos.map((prod, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{prod.nombre}</span>
                  <span className="text-sm font-bold text-[#2B547E]">{prod.cantidad} und</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}