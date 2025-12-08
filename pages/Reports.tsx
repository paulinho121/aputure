import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { OrderStatus } from '../types';

const Reports = () => {
    const { orders } = useApp();

    const metrics = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED);
        const paidOrders = completedOrders.filter(o => o.serviceType === 'Paid' || !o.serviceType); // Default to Paid if undefined for legacy
        const warrantyOrders = completedOrders.filter(o => o.serviceType === 'Warranty');

        const totalRevenue = paidOrders.reduce((sum, order) => {
            const partsCost = order.items?.reduce((pSum, item) => pSum + (item.unitPrice * item.quantity), 0) || 0;
            return sum + partsCost + (order.laborCost || 0);
        }, 0);

        const totalWarrantyValue = warrantyOrders.reduce((sum, order) => {
            const partsCost = order.items?.reduce((pSum, item) => pSum + (item.unitPrice * item.quantity), 0) || 0;
            return sum + partsCost + (order.laborCost || 0);
        }, 0);

        return {
            totalRevenue,
            totalWarrantyValue,
            countPaid: paidOrders.length,
            countWarranty: warrantyOrders.length,
            countTotal: completedOrders.length
        };
    }, [orders]);

    const data = [
        { name: 'Faturamento', value: metrics.totalRevenue, fill: '#10B981' },
        { name: 'Valor em Garantia', value: metrics.totalWarrantyValue, fill: '#F59E0B' },
    ];

    const pieData = [
        { name: 'Pago', value: metrics.countPaid },
        { name: 'Garantia', value: metrics.countWarranty },
    ];

    const COLORS = ['#10B981', '#F59E0B'];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Relatórios de Faturamento</h1>
                <p className="text-slate-500 text-sm">Controle de receitas e garantias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Faturamento Total (Pago)</p>
                            <h3 className="text-2xl font-bold text-emerald-600">R$ {metrics.totalRevenue.toFixed(2)}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">Ordens concluídas pagas</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Valor em Garantias</p>
                            <h3 className="text-2xl font-bold text-amber-500">R$ {metrics.totalWarrantyValue.toFixed(2)}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-500">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">Custo absorvido por garantia</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total de Reparos</p>
                            <h3 className="text-2xl font-bold text-blue-600">{metrics.countTotal}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <span className="text-emerald-600 font-medium">{metrics.countPaid} Pagos</span>
                        <span className="text-amber-500 font-medium">{metrics.countWarranty} Garantias</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Comparativo Financeiro</h3>
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Bar dataKey="value" name="Valor (R$)" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuição por Tipo</h3>
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
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
                </div>
            </div>
        </div>
    );
};

export default Reports;
