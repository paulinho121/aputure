import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, ShoppingCart, Trash2, MessageCircle, Printer, FileText, Send, Check, CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';
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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [installments, setInstallments] = useState(1);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingType, setShippingType] = useState('');

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

    const calculateSubtotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    };

    const calculateNewTotal = () => {
        const subtotal = calculateSubtotal();
        const discountAmount = subtotal * (discountPercentage / 100);
        return subtotal - discountAmount + shippingCost;
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
            paymentMethod: selectedPaymentMethod + (selectedPaymentMethod === 'Cartão de Crédito' ? ` (${installments}x)` : ''),
            stockDeducted: false,
            discountPercentage,
            shippingCost,
            shippingType
        };

        await addPurchaseOrder(newOrder);
        setShowNewModal(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedClientId('');
        setOrderItems([]);
        setPartSearch('');
        setSelectedPaymentMethod('');
        setInstallments(1);
        setDiscountPercentage(0);
        setShippingCost(0);
        setShippingType('');
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

    // Printable Purchase Receipt Component
    const PrintablePurchaseReceipt = ({ order }: { order: PurchaseOrder }) => {
        const client = clients.find(c => c.id === order.clientId);
        if (!order || !client) return null;

        return (
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <img src="/mci-logo.png" alt="MCI" className="h-16 w-auto object-contain" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">ASSISTÊNCIA TÉCNICA</h1>
                            <p className="text-sm text-slate-500">Aputure • Amaran • Cream Source • Astera</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">RECIBO DE VENDA</h2>
                        <p className="text-slate-500 font-mono">#{order.id}</p>
                        <p className="text-sm text-slate-500 mt-1">{new Date(order.entryDate).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Client and Payment Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-full">
                            <p className="font-bold text-slate-800 text-lg">{client.name}</p>
                            <p className="text-slate-600">{client.document}</p>
                            <p className="text-slate-600">{client.email}</p>
                            <p className="text-slate-600">{client.phone}</p>
                            <p className="text-slate-500 text-sm mt-2">{client.address}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Pagamento</h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-full">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-500">Método:</span>
                                <span className="font-bold text-slate-800">{order.paymentMethod || 'Não informado'}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-500">Status:</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    order.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' :
                                    order.status === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="mt-6 border-t pt-4">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total a Pagar</p>
                                <p className="text-3xl font-black text-emerald-600">R$ {order.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Itens da Venda</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3 text-left">Peça / Produto</th>
                                    <th className="p-3 text-right">Qtd</th>
                                    <th className="p-3 text-right">Unitário</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {order.items.map((item, idx) => {
                                    const part = parts.find(p => p.id === item.partId);
                                    return (
                                        <tr key={idx}>
                                            <td className="p-3">
                                                <div className="font-medium">{part?.name || 'Item não encontrado'}</div>
                                                <div className="text-xs text-slate-400">{part?.code}</div>
                                            </td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                            <td className="p-3 text-right font-bold">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right">Subtotal</td>
                                    <td className="p-3 text-right">R$ {order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0).toFixed(2)}</td>
                                </tr>
                                {order.discountPercentage && order.discountPercentage > 0 ? (
                                    <tr className="text-rose-600">
                                        <td colSpan={3} className="p-3 text-right">Desconto ({order.discountPercentage}%)</td>
                                        <td className="p-3 text-right">- R$ {(order.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) * (order.discountPercentage / 100)).toFixed(2)}</td>
                                    </tr>
                                ) : null}
                                {order.shippingCost && order.shippingCost > 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right">Frete {order.shippingType ? `(${order.shippingType})` : ''}</td>
                                        <td className="p-3 text-right">+ R$ {order.shippingCost.toFixed(2)}</td>
                                    </tr>
                                ) : null}
                                <tr className="border-t-2 border-slate-200">
                                    <td colSpan={3} className="p-3 text-right uppercase tracking-wider">TOTAL</td>
                                    <td className="p-3 text-right text-lg text-emerald-600 font-black">R$ {order.totalAmount.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Status and Info */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Data de Emissão</h3>
                        <p className="text-slate-700">{new Date(order.entryDate).toLocaleString()}</p>
                    </div>
                </div>

                {/* Signature */}
                <div className="grid grid-cols-2 gap-12 mt-20">
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-slate-300 mb-2"></div>
                        <p className="text-sm font-medium text-slate-600">Assinatura do Recebedor</p>
                        <p className="text-xs text-slate-400">{client.name}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-slate-300 mb-2"></div>
                        <p className="text-sm font-medium text-slate-600">Responsável pela Venda</p>
                        <p className="text-xs text-slate-400">MCI Assistência Técnica</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-8 left-0 w-full text-center">
                    <p className="text-xs text-slate-400">MCI Assistência Técnica • www.mci.tv • {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        );
    };

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

                            <div>
                                <h3 className="text-lg font-bold border-b pb-2 mb-4">3. Forma de Pagamento</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {[
                                        { id: 'PIX', icon: QrCode, color: 'text-teal-600', bg: 'bg-teal-50' },
                                        { id: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { id: 'Cartão de Débito', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                        { id: 'Dinheiro', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { id: 'Transferência', icon: Send, color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { id: 'Boleto', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod(method.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                                selectedPaymentMethod === method.id 
                                                ? `border-emerald-500 ${method.bg} shadow-md scale-105` 
                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                            }`}
                                        >
                                            <method.icon className={`${method.color} mb-2`} size={24} />
                                            <span className="text-[10px] font-bold uppercase text-center leading-tight">{method.id}</span>
                                        </button>
                                    ))}
                                </div>

                                {selectedPaymentMethod === 'Cartão de Crédito' && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-bold text-blue-900 mb-2">Parcelamento</label>
                                        <select 
                                            value={installments} 
                                            onChange={(e) => setInstallments(parseInt(e.target.value))}
                                            className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i+1} value={i+1}>{i+1}x {i === 0 ? '(À vista)' : `de R$ ${(calculateNewTotal() / (i+1)).toFixed(2)}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold border-b pb-2 mb-4">4. Desconto</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="0"
                                                className="w-full p-2 border rounded-lg pr-8"
                                                value={discountPercentage}
                                                onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        </div>
                                        <div className="text-sm text-slate-500 font-medium">
                                            Economia: R$ {(calculateSubtotal() * (discountPercentage / 100)).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold border-b pb-2 mb-4">5. Frete</h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            {['Correios', 'Motoboy', 'Transportadora', 'Retirada'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setShippingType(type)}
                                                    className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                                                        shippingType === type 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0.00"
                                                className="w-full p-2 pl-10 border rounded-lg"
                                                value={shippingCost}
                                                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 border-t pt-4">
                                <div className="text-slate-500">Valor Total</div>
                                <div className="text-3xl font-bold">R$ {calculateNewTotal().toFixed(2)}</div>
                                <button 
                                    onClick={handleSubmitOrder} 
                                    disabled={!selectedPaymentMethod || orderItems.length === 0}
                                    className={`mt-4 px-8 py-3 rounded-lg font-bold text-lg shadow-xl transition-all ${
                                        !selectedPaymentMethod || orderItems.length === 0
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    Finalizar Venda
                                </button>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h4>
                                    {(() => {
                                        const client = clients.find(c => c.id === selectedOrder.clientId);
                                        return client ? (
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                                <p className="font-bold text-slate-800">{client.name}</p>
                                                <p className="text-slate-600">{client.document}</p>
                                                <p className="text-slate-600">{client.email}</p>
                                                <p className="text-slate-600">{client.phone}</p>
                                                <p className="text-slate-500 mt-2 text-xs">{client.address}</p>
                                            </div>
                                        ) : (
                                            <p className="text-red-500">Cliente não encontrado</p>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pagamento e Total</h4>
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-emerald-600 font-medium">Forma de Pagamento:</span>
                                            <span className="text-emerald-900 font-bold">{selectedOrder.paymentMethod || 'Não informado'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-emerald-600 font-medium">Status:</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                selectedOrder.status === 'Pago' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                                            }`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-emerald-200 space-y-1">
                                            <div className="flex justify-between text-[10px] text-emerald-600 font-bold uppercase">
                                                <span>Subtotal</span>
                                                <span>R$ {selectedOrder.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0).toFixed(2)}</span>
                                            </div>
                                            {selectedOrder.discountPercentage && selectedOrder.discountPercentage > 0 && (
                                                <div className="flex justify-between text-[10px] text-rose-600 font-bold uppercase">
                                                    <span>Desconto ({selectedOrder.discountPercentage}%)</span>
                                                    <span>- R$ {(selectedOrder.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) * (selectedOrder.discountPercentage / 100)).toFixed(2)}</span>
                                                </div>
                                            )}
                                            {selectedOrder.shippingCost && selectedOrder.shippingCost > 0 && (
                                                <div className="flex justify-between text-[10px] text-emerald-600 font-bold uppercase">
                                                    <span>Frete {selectedOrder.shippingType ? `(${selectedOrder.shippingType})` : ''}</span>
                                                    <span>+ R$ {selectedOrder.shippingCost.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2">Valor Total</p>
                                            <p className="font-black text-emerald-700 text-3xl">R$ {selectedOrder.totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
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

                    {/* Printable Receipt */}
                    <PrintablePurchaseReceipt order={selectedOrder} />
                </div>
            )}
        </div>
    );
};

export default PurchaseOrders;

