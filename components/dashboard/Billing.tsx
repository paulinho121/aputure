import React, { useMemo, useState } from 'react';
import { ServiceOrder, OrderStatus } from '../../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Calendar, Filter, X } from 'lucide-react';

interface BillingProps {
    orders: ServiceOrder[];
}

const StatCard = ({ title, value, subtext, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
        <div>
            <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color} text-white`}>
            {icon}
        </div>
    </div>
);

const Billing: React.FC<BillingProps> = ({ orders }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (!startDate && !endDate) return true;

            const orderDate = new Date(order.entryDate);
            // Normalize dates to ignore time functionality for comparison
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999); // Include the entire end day

            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;

            return true;
        });
    }, [orders, startDate, endDate]);

    const stats = useMemo(() => {
        // Filter pertinent orders from the time-filtered list
        const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED);
        const inProgressOrders = filteredOrders.filter(o =>
            [OrderStatus.DIAGNOSING, OrderStatus.WAITING_APPROVAL, OrderStatus.IN_REPAIR].includes(o.status)
        );

        // Calculate totals
        const totalRevenue = completedOrders.reduce((acc, order) => {
            const partsCost = order.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
            return acc + (order.laborCost || 0) + partsCost;
        }, 0);

        const pendingRevenue = inProgressOrders.reduce((acc, order) => {
            const partsCost = order.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
            return acc + (order.laborCost || 0) + partsCost;
        }, 0);

        const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

        // Monthly data simulation (grouping by entryDate)
        const monthlyData = filteredOrders.reduce((acc: any, order) => {
            const date = new Date(order.entryDate);
            const mouthYear = `${date.toLocaleString('default', { month: 'short' })}/${date.getFullYear()}`;

            if (!acc[mouthYear]) {
                acc[mouthYear] = { name: mouthYear, revenue: 0, pending: 0 };
            }

            const partsCost = order.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
            const total = (order.laborCost || 0) + partsCost;

            if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED) {
                acc[mouthYear].revenue += total;
            } else if ([OrderStatus.DIAGNOSING, OrderStatus.WAITING_APPROVAL, OrderStatus.IN_REPAIR].includes(order.status)) {
                acc[mouthYear].pending += total;
            }

            return acc;
        }, {});

        return {
            totalRevenue,
            pendingRevenue,
            averageTicket,
            chartData: Object.values(monthlyData) // Don't slice if filtering, show strictly what's in range
        };
    }, [filteredOrders]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                    <Filter size={20} />
                    <span className="font-medium">Filtrar por data:</span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <label className="text-sm text-slate-500 whitespace-nowrap">De:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <label className="text-sm text-slate-500 whitespace-nowrap">Até:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {(startDate || endDate) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <X size={16} />
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Faturamento Total"
                    value={formatCurrency(stats.totalRevenue)}
                    subtext={startDate || endDate ? "No período selecionado" : "Ordens finalizadas ou entregues"}
                    icon={<DollarSign size={24} />}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Faturamento Pendente"
                    value={formatCurrency(stats.pendingRevenue)}
                    subtext={startDate || endDate ? "No período selecionado" : "Ordens em andamento"}
                    icon={<TrendingUp size={24} />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Ticket Médio"
                    value={formatCurrency(stats.averageTicket)}
                    icon={<CreditCard size={24} />}
                    color="bg-violet-500"
                />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Receita Mensal</h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Realizado"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                            <Area
                                type="monotone"
                                dataKey="pending"
                                name="Previsto"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorPending)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Billing;
