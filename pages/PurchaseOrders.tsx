import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, ShoppingCart, Trash2, MessageCircle, Printer, FileText, Send, Check } from 'lucide-react';
import { PurchaseOrder, ServiceOrderItem } from '../types';
import ClientSearch from '../components/ClientSearch';
import { supabase } from '../lib/supabase';

const PurchaseOrders = () => {
    const { clients, parts, purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, user } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    // New Purchase Order State
    const [selectedClientId, setSelectedClientId] = useState('');
    const [orderItems, setOrderItems] = useState<ServiceOrderItem[]>([]);
    const [partSearch, setPartSearch] = useState('');
    const [showPartDropdown, setShowPartDropdown] = useState(false);

    const filteredParts = parts.filter(part => {
        const search = partSearch.toLowerCase();
        return part.name.toLowerCase().includes(search) || part.code.toLowerCase().includes(search);
    });

    const handleAddItem = (partId: string) => {
        const part = parts.find(p => p.id === partId);
        if (!part) return;

        const existingItem = orderItems.find(item => item.partId === partId);
        if (existingItem) {
            setOrderItems(orderItems.map(item =>
                item.partId === partId ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setOrderItems([...orderItems, { partId: part.id, quantity: 1, unitPrice: part.price }]);
        }
        setPartSearch('');
        setShowPartDropdown(false);
    };

    const handleRemoveItem = (idx: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== idx));
    };

    const handleUpdateQty = (idx: number, qty: number) => {
        setOrderItems(orderItems.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
    };

    const calculateNewTotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId) return alert('Selecione um cliente');
        if (orderItems.length === 0) return alert('Adicione pelo menos uma peça');

        const year = new Date().getFullYear();
        const { data: allYearOrders } = await supabase
            .from('purchase_orders')
            .select('id')
            .ilike('id', `OC-${year}-%`);

        let nextSequence = 1;
        if (allYearOrders && allYearOrders.length > 0) {
            const sequences = allYearOrders.map(o => {
                const parts = o.id.split('-');
                return parts.length === 3 ? parseInt(parts[2]) : 0;
            }).filter(s => !isNaN(s));
            if (sequences.length > 0) nextSequence = Math.max(...sequences) + 1;
        }

        const newOrder: PurchaseOrder = {
            id: `OC-${year}-${nextSequence.toString().padStart(4, '0')}`,
            clientId: selectedClientId,
            entryDate: new Date().toISOString(),
            status: 'Pendente',
            items: orderItems,
            totalAmount: calculateNewTotal(),
            stockDeducted: false
        };

        await addPurchaseOrder(newOrder);
        setShowNewModal(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedClientId('');
        setOrderItems([]);
        setPartSearch('');
    };

    const handleStatusChange = async (order: PurchaseOrder, newStatus: string) => {
        await updatePurchaseOrder({ ...order, status: newStatus });
        if (selectedOrder?.id === order.id) {
            setSelectedOrder({ ...order, status: newStatus });
        }
    };

    const filteredOrders = purchaseOrders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clients.find(c => c.id === o.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="text-emerald-600" />
                    Ordens de Compra (Venda de Peças)
                </h1>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm w-full sm:w-auto"
                >
                    <Plus size={18} />
                    Nova Venda
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por OC ou nome do cliente..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                <table className="w-full text-left min-w-[768px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 text-sm">Nº OC</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm">Cliente</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm">Data</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm">Total</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map(order => {
                            const client = clients.find(c => c.id === order.clientId);
                            return (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-medium text-slate-800 text-sm">{order.id}</td>
                                    <td className="p-4 text-slate-600 text-sm">{client?.name || 'Desconhecido'}</td>
                                    <td className="p-4 text-slate-600 text-sm">{new Date(order.entryDate).toLocaleDateString()}</td>
                                    <td className="p-4 text-slate-800 font-bold text-sm">R$ {order.totalAmount.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            order.status === 'Entregue' ? 'bg-green-100 text-green-700' :
                                            order.status === 'Pago' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => setSelectedOrder(order)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">Detalhes</button>
                                        <button 
                                            onClick={() => { if(confirm('Excluir esta venda definitivamente?')) deletePurchaseOrder(order.id) }} 
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Excluir Ordem de Compra"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* NEW ORDER MODAL */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Nova Venda de Peças</h2>
                            <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
                        </div>
                        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                            <div>
                                <h3 className="text-lg font-bold border-b pb-2 mb-4">1. Selecionar Cliente</h3>
                                <ClientSearch clients={clients} onSelect={setSelectedClientId} selectedClientId={selectedClientId} />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold border-b pb-2">2. Adicionar Peças</h3>
                                    <div className="relative w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Buscar peça..."
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={partSearch}
                                            onChange={(e) => { setPartSearch(e.target.value); setShowPartDropdown(true); }}
                                            onFocus={() => setShowPartDropdown(true)}
                                        />
                                        {showPartDropdown && filteredParts.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {filteredParts.slice(0, 10).map(p => (
                                                    <button key={p.id} onClick={() => handleAddItem(p.id)} className="w-full text-left p-3 hover:bg-emerald-50 border-b last:border-0">
                                                        <div className="font-bold text-sm">{p.name}</div>
                                                        <div className="text-xs text-slate-500">{p.code} • R$ {p.price.toFixed(2)} • Estoque: {p.quantity}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm min-w-[500px]">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="p-3 text-left">Item</th>
                                                <th className="p-3 text-right">Qtd</th>
                                                <th className="p-3 text-right">Unitário</th>
                                                <th className="p-3 text-right">Subtotal</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {orderItems.map((item, idx) => {
                                                const part = parts.find(p => p.id === item.partId);
                                                return (
                                                    <tr key={idx}>
                                                        <td className="p-3 font-medium">{part?.name}</td>
                                                        <td className="p-3 text-right">
                                                            <input type="number" className="w-16 p-1 border rounded text-right" value={item.quantity} onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)} />
                                                        </td>
                                                        <td className="p-3 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                                        <td className="p-3 text-right font-bold">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {orderItems.length === 0 && (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum item adicionado</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 border-t pt-4">
                                <div className="text-slate-500">Valor Total</div>
                                <div className="text-3xl font-bold">R$ {calculateNewTotal().toFixed(2)}</div>
                                <button onClick={handleSubmitOrder} className="mt-4 bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-emerald-700 shadow-xl">Finalizar Venda</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Ordem de Compra #{selectedOrder.id}</h2>
                                <p className="text-sm text-slate-500">{new Date(selectedOrder.entryDate).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="flex gap-2 flex-wrap">
                                {['Pendente', 'Pago', 'Entregue', 'Cancelado'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(selectedOrder, s)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedOrder.status === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Cliente</h4>
                                    <p className="font-bold text-slate-800">{clients.find(c => c.id === selectedOrder.clientId)?.name}</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Total</h4>
                                    <p className="font-bold text-emerald-600 text-xl">R$ {selectedOrder.totalAmount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto border rounded-xl">
                                <table className="w-full text-sm min-w-[500px]">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3 text-left">Item</th>
                                            <th className="p-3 text-right">Qtd</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedOrder.items.map((item, idx) => {
                                            const part = parts.find(p => p.id === item.partId);
                                            return (
                                                <tr key={idx}>
                                                    <td className="p-3">{part?.name}</td>
                                                    <td className="p-3 text-right">{item.quantity}</td>
                                                    <td className="p-3 text-right font-bold">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {selectedOrder.stockDeducted && (
                                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <Check size={16} /> Estoque deduzido com sucesso
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                             <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"><Printer size={18} /> Imprimir Recibo</button>
                             <button onClick={() => setSelectedOrder(null)} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrders;
