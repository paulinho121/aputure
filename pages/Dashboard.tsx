import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Wrench, Package, AlertTriangle, Clock, LayoutDashboard, DollarSign, PieChart as PieIcon, BarChart as BarIcon, Users } from 'lucide-react';
import Billing from '../components/dashboard/Billing';

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color} text-white`}>
      {icon}
    </div>
  </div>
);

const DashboardOverview = ({ activeRepairs, pendingQuotes, lowStock, partsLength, data, COLORS, recentOrders, activeClients }: any) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Em Manutenção"
          value={activeRepairs}
          icon={<Wrench size={24} />}
          color="bg-blue-500"
        />
        <StatCard
          title="Orçamentos Pendentes"
          value={pendingQuotes}
          icon={<Clock size={24} />}
          color="bg-amber-500"
        />
        <StatCard
          title="Clientes Ativos"
          value={activeClients.toString()}
          icon={<Users className="text-white" size={24} />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Peças Totais"
          value={partsLength}
          icon={<Package size={24} />}
          color="bg-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Status dos Serviços</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Gráfico de Barras"
              >
                <BarIcon size={18} />
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`p-1.5 rounded-md transition-all ${chartType === 'pie' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Gráfico de Pizza"
              >
                <PieIcon size={18} />
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Entradas Recentes</h2>
          <div className="space-y-4">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-800">{order.model}</p>
                  <p className="text-xs text-slate-500">{order.id} • {new Date(order.entryDate).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                  order.status === OrderStatus.WAITING_APPROVAL ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { orders, parts, clients } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'billing'>('overview');

  const activeRepairs = orders.filter(o =>
    [OrderStatus.DIAGNOSING, OrderStatus.IN_REPAIR, OrderStatus.WAITING_APPROVAL].includes(o.status)
  ).length;

  const pendingQuotes = orders.filter(o => o.status === OrderStatus.WAITING_APPROVAL).length;

  const lowStock = parts.filter(p => p.quantity <= p.minStock).length;

  const recentOrders = orders.slice(0, 5);

  const data = [
    { name: 'Recebidos', value: orders.filter(o => o.status === OrderStatus.PENDING).length },
    { name: 'Diagnóstico', value: orders.filter(o => o.status === OrderStatus.DIAGNOSING).length },
    { name: 'Aprovação', value: orders.filter(o => o.status === OrderStatus.WAITING_APPROVAL).length },
    { name: 'Em Reparo', value: orders.filter(o => o.status === OrderStatus.IN_REPAIR).length },
    { name: 'Prontos', value: orders.filter(o => o.status === OrderStatus.COMPLETED).length },
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Visão geral da assistência</p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <LayoutDashboard size={18} />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'billing'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <DollarSign size={18} />
            Faturamento
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <DashboardOverview
          activeRepairs={activeRepairs}
          pendingQuotes={pendingQuotes}
          lowStock={lowStock}
          partsLength={parts.length}
          data={data}
          COLORS={COLORS}
          recentOrders={recentOrders}
          activeClients={clients.length}
        />
      ) : (
        <Billing orders={orders} />
      )}
    </div>
  );
};

export default Dashboard;