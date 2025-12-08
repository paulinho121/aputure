import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OrderStatus, ServiceOrderItem } from '../types';
import { FileText, Plus, Trash2, Printer, Send } from 'lucide-react';

const Quotes = () => {
  const { orders, parts, updateOrder, clients } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState(searchParams.get('orderId') || '');

  useEffect(() => {
    const id = searchParams.get('orderId');
    if (id) setSelectedOrderId(id);
  }, [searchParams]);

  // Find orders that need a quote (Diagnosing or Waiting Approval)
  const pendingOrders = orders.filter(o =>
    [OrderStatus.DIAGNOSING, OrderStatus.WAITING_APPROVAL].includes(o.status)
  );

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedClient = selectedOrder ? clients.find(c => c.id === selectedOrder.clientId) : null;

  const handleAddItem = (partId: string) => {
    if (!selectedOrder) return;
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const newItem: ServiceOrderItem = {
      partId: part.id,
      quantity: 1,
      unitPrice: part.price
    };

    const updatedOrder = {
      ...selectedOrder,
      items: [...selectedOrder.items, newItem]
    };
    updateOrder(updatedOrder);
  };

  const handleRemoveItem = (index: number) => {
    if (!selectedOrder) return;
    const newItems = [...selectedOrder.items];
    newItems.splice(index, 1);
    updateOrder({ ...selectedOrder, items: newItems });
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    if (!selectedOrder) return;
    const newItems = [...selectedOrder.items];
    newItems[index] = { ...newItems[index], unitPrice: newPrice };
    updateOrder({ ...selectedOrder, items: newItems });
  };

  const handleLaborChange = (val: number) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, laborCost: val });
    }
  };

  const handleShippingChange = (method: string, cost: number) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, shippingMethod: method, shippingCost: cost });
    }
  };

  const handleDiscountChange = (val: number) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, discount: val });
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, paymentMethod: method });
    }
  };

  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedOrder && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      updateOrder({ ...selectedOrder, paymentProofUrl: url });
    }
  };

  const calculateTotal = () => {
    if (!selectedOrder) return 0;
    const partsTotal = selectedOrder.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const subtotal = partsTotal + (selectedOrder.laborCost || 0) + (selectedOrder.shippingCost || 0);
    return subtotal - (selectedOrder.discount || 0);
  };

  const handleStatusChange = (status: OrderStatus) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, status });
    }
  }

  // Printable Component
  const PrintableQuote = ({ order, client, parts, total }: any) => {
    if (!order) return null;

    return (
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src="/mci-logo.png" alt="MCI" className="h-16 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ASSISTÊNCIA TÉCNICA</h1>
              <p className="text-sm text-slate-500">Aputure • Amaran • Cream Source • Astera</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800">ORÇAMENTO</h2>
            <p className="text-slate-500 font-mono">#{order.id}</p>
            <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-800 text-lg">{client?.name || 'Cliente Não Identificado'}</p>
              <p className="text-slate-600">{client?.document}</p>
              <p className="text-slate-600">{client?.email}</p>
              <p className="text-slate-600">{client?.phone}</p>
              <p className="text-slate-500 text-sm mt-2">{client?.address}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Equipamento</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800 text-lg">{order.model}</p>
                  <p className="text-slate-600">Série: {order.serialNumber || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.serviceType === 'Warranty' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {order.serviceType === 'Warranty' ? 'Garantia' : 'Orçamento'}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Defeito Relatado</p>
                <p className="text-slate-700">{order.faultDescription}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Peças e Serviços</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="text-left py-3 text-slate-600 font-bold">Descrição</th>
                <th className="text-right py-3 text-slate-600 font-bold">Qtd</th>
                <th className="text-right py-3 text-slate-600 font-bold">Unitário</th>
                <th className="text-right py-3 text-slate-600 font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item: any, idx: number) => {
                const part = parts.find((p: any) => p.id === item.partId);
                return (
                  <tr key={idx}>
                    <td className="py-3 text-slate-800">
                      <span className="font-medium">{part?.name || 'Item Diverso'}</span>
                      {!part && <span className="text-xs text-slate-400 ml-2">({item.partId})</span>}
                    </td>
                    <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 text-right text-slate-800 font-medium">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
              {/* Labor Row */}
              {order.laborCost > 0 && (
                <tr className="bg-slate-50/50">
                  <td className="py-3 text-slate-800 font-medium">Mão de Obra Especializada</td>
                  <td className="py-3 text-right text-slate-600">1</td>
                  <td className="py-3 text-right text-slate-600">R$ {order.laborCost.toFixed(2)}</td>
                  <td className="py-3 text-right text-slate-800 font-medium">R$ {order.laborCost.toFixed(2)}</td>
                </tr>
              )}
              {/* Shipping Row */}
              {(order.shippingCost > 0 || order.shippingMethod) && (
                <tr className="bg-slate-50/50">
                  <td className="py-3 text-slate-800 font-medium">Frete: {order.shippingMethod || 'Envio'}</td>
                  <td className="py-3 text-right text-slate-600">1</td>
                  <td className="py-3 text-right text-slate-600">R$ {(order.shippingCost || 0).toFixed(2)}</td>
                  <td className="py-3 text-right text-slate-800 font-medium">R$ {(order.shippingCost || 0).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="pt-4 text-right text-slate-600">Subtotal</td>
                <td className="pt-4 text-right text-slate-800">R$ {(total + (order.discount || 0)).toFixed(2)}</td>
              </tr>
              {order.discount > 0 && (
                <tr>
                  <td colSpan={3} className="pt-2 text-right text-red-500">Desconto</td>
                  <td className="pt-2 text-right text-red-500">- R$ {(order.discount || 0).toFixed(2)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-800">
                <td colSpan={3} className="pt-4 text-right font-bold text-slate-800 text-lg">TOTAL</td>
                <td className="pt-4 text-right font-bold text-emerald-600 text-lg">R$ {total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms & Signature */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-12">
            <div className="text-xs text-slate-400 text-justify">
              <p className="mb-2"><strong>Condições:</strong> Validade deste orçamento é de 10 dias. O serviço será iniciado após aprovação formal.</p>
              <p>Garantia de 90 dias sobre as peças trocadas e serviço executado, exceto por mau uso.</p>
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="w-full border-b border-slate-300 mb-2"></div>
              <p className="text-sm font-medium text-slate-600">Assinatura do Responsável</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-8 left-0 w-full text-center">
          <p className="text-slate-800 font-bold mb-1">Técnico Responsável: Jonathan Jow • WhatsApp: (85) 98881-7194</p>
          <p className="text-xs text-slate-400">MCI Assistência Técnica • www.mci-store.com.br</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 lg:gap-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-quote, .print-quote * {
            visibility: visible;
          }
          .print-quote {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            display: block !important;
          }
          @page {
            margin: 0;
          }
        }
      `}</style>

      {/* Render Printable Component Hiddenly (visible only via CSS print media) */}
      <div className="print-quote hidden">
        <PrintableQuote
          order={selectedOrder}
          client={selectedClient}
          parts={parts}
          total={calculateTotal()}
        />
      </div>

      {/* Sidebar: Select Order */}
      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden print:hidden max-h-96 lg:max-h-none">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Pendentes de Orçamento</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {pendingOrders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedOrderId === order.id
                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-xs font-medium text-slate-500">{order.id}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-1 rounded">{order.status}</span>
              </div>
              <h3 className="font-medium text-slate-800">{order.model}</h3>
              <p className="text-xs text-slate-500 truncate">{order.faultDescription}</p>
            </div>
          ))}
          {pendingOrders.length === 0 && (
            <div className="p-4 text-center text-slate-400 text-sm">
              Nenhum equipamento aguardando orçamento.
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Quote Builder */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {selectedOrder ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">Orçamento #{selectedOrder.id}</h1>
                <p className="text-slate-500 text-sm">
                  Cliente: <span className="font-semibold text-slate-700">{selectedClient?.name}</span> •
                  Modelo: <span className="font-semibold text-slate-700">{selectedOrder.model}</span>
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg" title="Imprimir">
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => handleStatusChange(OrderStatus.WAITING_APPROVAL)}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm flex-1 sm:flex-initial"
                >
                  <Send size={16} /> Enviar p/ Aprovação
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Parts Selection */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Peças e Componentes</h3>
                  <div className="flex gap-2">
                    <select
                      className="text-sm border-slate-200 rounded-lg p-2 w-64"
                      onChange={(e) => {
                        handleAddItem(e.target.value);
                        e.target.value = ''; // Reset select
                      }}
                    >
                      <option value="">+ Adicionar Peça</option>
                      {parts.map(part => (
                        <option key={part.id} value={part.id}>
                          {part.name} - R$ {part.price}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 text-right">Unitário</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => {
                      const part = parts.find(p => p.id === item.partId);
                      return (
                        <tr key={idx}>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{part ? part.name : 'Item Customizado / Excluído'}</div>
                            {!part && <div className="text-xs text-slate-400">ID: {item.partId}</div>}
                          </td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              className="w-24 p-1 border rounded text-right text-sm"
                              value={item.unitPrice}
                              onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-3 text-right font-medium">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Labor and Shipping */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Método de Envio</label>
                    <select
                      className="w-full p-2 border rounded-lg text-sm"
                      value={selectedOrder.shippingMethod || ''}
                      onChange={(e) => handleShippingChange(e.target.value, selectedOrder.shippingCost || 0)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Correios - PAC">Correios - PAC</option>
                      <option value="Correios - Sedex">Correios - Sedex</option>
                      <option value="Transportadora">Transportadora</option>
                      <option value="Retirada">Retirada no Local</option>
                      <option value="Entrega Própria">Entrega Própria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frete (R$)</label>
                    <input
                      type="number"
                      value={selectedOrder.shippingCost || 0}
                      onChange={(e) => handleShippingChange(selectedOrder.shippingMethod || '', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg text-right font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mão de Obra (R$)</label>
                    <input
                      type="number"
                      value={selectedOrder.laborCost}
                      onChange={(e) => handleLaborChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg text-right font-medium"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    value={selectedOrder.discount || 0}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-red-200 rounded-lg text-right font-medium text-red-600"
                  />
                </div>

                <div className="w-full mt-4 border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Dados de Pagamento</h4>
                  <div className="flex gap-6 items-start">
                    <div className="w-64">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                      <select
                        className="w-full p-2 border rounded-lg text-sm"
                        value={selectedOrder.paymentMethod || ''}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Comprovante de Pagamento</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handlePaymentProofUpload}
                          className="text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-emerald-50 file:text-emerald-700
                            hover:file:bg-emerald-100"
                        />
                        {selectedOrder.paymentProofUrl && (
                          <a
                            href={selectedOrder.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText size={16} /> Ver Comprovante
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 items-end">
              <div className="flex justify-between items-center gap-4 text-slate-500">
                <span>Subtotal</span>
                <span>R$ {((selectedOrder.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)) + (selectedOrder.laborCost || 0) + (selectedOrder.shippingCost || 0)).toFixed(2)}</span>
              </div>
              {selectedOrder.discount && selectedOrder.discount > 0 && (
                <div className="flex justify-between items-center gap-4 text-red-500">
                  <span>Desconto</span>
                  <span>- R$ {selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-end items-center gap-4 mt-2">
                <span className="text-slate-500 text-lg">Total do Orçamento</span>
                <span className="text-3xl font-bold text-slate-800">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText size={64} className="mb-4 opacity-20" />
            <p>Selecione uma ordem de serviço para gerar o orçamento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotes;