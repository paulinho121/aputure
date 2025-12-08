import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { OrderStatus } from '../types';

const Reports = () => {
    const { orders } = useApp();

    // Date Filtering State
    const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
    const [customStart, setCustomStart] = React.useState('');
    const [customEnd, setCustomEnd] = React.useState('');

    // Filter Logic
    const filteredOrders = useMemo(() => {
        let start = new Date(0); // Epoch
        let end = new Date();
        end.setHours(23, 59, 59, 999);

        const now = new Date();

        switch (dateFilter) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                // First day of current week (Sunday)
                start = new Date(now.setDate(now.getDate() - now.getDay()));
                start.setHours(0, 0, 0, 0);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'custom':
                if (customStart) start = new Date(customStart + 'T00:00:00');
                if (customEnd) end = new Date(customEnd + 'T23:59:59');
                break;
            case 'all':
            default:
                break;
        }

        return orders.filter(o => {
            if (!o.entryDate) return false;
            const entry = new Date(o.entryDate); // Assuming entryDate is ISO string or YYYY-MM-DD
            // If entryDate is just YYYY-MM-DD, new Date() treats it as UTC, which might cause off-by-one. 
            // Better to normalize everything to YYYY-MM-DD strings for comparison if possible, or use simple timestamps
            // For now, simple timestamp comparison:
            return entry >= start && entry <= end;
        });
    }, [orders, dateFilter, customStart, customEnd]);

    const metrics = useMemo(() => {
        const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED);
        const paidOrders = completedOrders.filter(o => o.serviceType === 'Paid' || !o.serviceType);
        const warrantyOrders = completedOrders.filter(o => o.serviceType === 'Warranty');

        // Revenue Breakdowns (Paid Orders only)
        const revenue = paidOrders.reduce((acc, order) => {
            const partsCost = order.items?.reduce((pSum, item) => pSum + (item.unitPrice * item.quantity), 0) || 0;
            const labor = order.laborCost || 0;
            const shipping = order.shippingCost || 0;
            const discountAmount = partsCost * ((order.discount || 0) / 100);

            return {
                parts: acc.parts + (partsCost - discountAmount),
                labor: acc.labor + labor,
                shipping: acc.shipping + shipping,
                total: acc.total + (partsCost - discountAmount) + labor + shipping
            };
        }, { parts: 0, labor: 0, shipping: 0, total: 0 });

        // Warranty Value (Cost absorbed)
        const warrantyValue = warrantyOrders.reduce((sum, order) => {
            const partsCost = order.items?.reduce((pSum, item) => pSum + (item.unitPrice * item.quantity), 0) || 0;
            return sum + partsCost + (order.laborCost || 0) + (order.shippingCost || 0);
        }, 0);

        return {
            revenue,
            warrantyValue,
            countPaid: paidOrders.length,
            countWarranty: warrantyOrders.length,
            countTotal: completedOrders.length
        };
    }, [filteredOrders]);

    const breakdownData = [
        { name: 'Peças', value: metrics.revenue.parts, fill: '#3B82F6' },
        { name: 'Serviços', value: metrics.revenue.labor, fill: '#10B981' },
        { name: 'Frete', value: metrics.revenue.shipping, fill: '#6366F1' },
    ];

    const pieData = [
        { name: 'Pago', value: metrics.countPaid },
        { name: 'Garantia', value: metrics.countWarranty },
    ];

    const COLORS = ['#10B981', '#F59E0B'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Relatórios de Faturamento</h1>
                    <p className="text-slate-500 text-sm">Controle financeiro detalhado</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="p-2 text-sm border-r border-slate-100 focus:outline-none bg-transparent"
                    >
                        <option value="month">Este Mês</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta Semana</option>
                        <option value="all">Todo o Período</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="text-sm p-1 border rounded"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-sm p-1 border rounded"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-emerald-50 p-6 rounded-xl shadow-sm border border-emerald-100">
                    <div className="flex justify-between items-start mb-2">
                        <span className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><DollarSign size={20} /></span>
                    </div>
                    <p className="text-sm font-medium text-emerald-800">Receita Total</p>
                    <h3 className="text-2xl font-bold text-emerald-700">R$ {metrics.revenue.total.toFixed(2)}</h3>
                    <p className="text-xs text-emerald-600 mt-1">{metrics.countPaid} serviços pagos</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Peças</p>
                    <h3 className="text-xl font-bold text-slate-800">R$ {metrics.revenue.parts.toFixed(2)}</h3>
                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${(metrics.revenue.parts / metrics.revenue.total || 0) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mão de Obra</p>
                    <h3 className="text-xl font-bold text-slate-800">R$ {metrics.revenue.labor.toFixed(2)}</h3>
                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(metrics.revenue.labor / metrics.revenue.total || 0) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Frete</p>
                    <h3 className="text-xl font-bold text-slate-800">R$ {metrics.revenue.shipping.toFixed(2)}</h3>
                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${(metrics.revenue.shipping / metrics.revenue.total || 0) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-slate-400" />
                        Detalhamento da Receita
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={breakdownData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Bar dataKey="value" name="Valor (R$)" radius={[0, 4, 4, 0]} barSize={40}>
                                    {
                                        breakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Volume de Serviços</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm font-medium text-amber-500">Valor em Garantias (Custo): R$ {metrics.warrantyValue.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
