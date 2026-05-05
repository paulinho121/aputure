import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OrderStatus, ServiceOrderItem } from '../types';
import { FileText, Plus, Trash2, Printer, Send, CreditCard, Banknote, QrCode, Wallet, Check, Save } from 'lucide-react';

const Quotes = () => {
  const { orders, parts, updateOrder, clients, user } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState(searchParams.get('orderId') || '');
  const [partSearch, setPartSearch] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [laborDescription, setLaborDescription] = useState(''); // Local state for optimization
  const [technicalReport, setTechnicalReport] = useState(''); // Local state for optimization
  const [laborCostLocal, setLaborCostLocal] = useState('0');
  const [shippingCostLocal, setShippingCostLocal] = useState('0');
  const [discountLocal, setDiscountLocal] = useState('0');
  const [localItems, setLocalItems] = useState<ServiceOrderItem[]>([]);
  const [installments, setInstallments] = useState(1);

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

  // Get technician data based on logged user
  const getTechnicianData = () => {
    if (user?.email === 'assistenciatecnica@mcistore.com.br') {
      return {
        name: 'Pietro de Jesus Felix',
        email: 'assistenciatecnica@mcistore.com.br',
        phone: '11 2365-1756'
      };
    }
    // Default technician (Jonathan)
    return {
      name: 'Jonathan Ferreira do Nascimento',
      email: 'jonathan@mcistore.com.br',
      phone: '11 97762-8661'
    };
  };

  const technicianData = getTechnicianData();

  const handleAddItem = (partId: string) => {
    if (!selectedOrder) return;
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    let updatedItems;
    const existingItemIndex = selectedOrder.items.findIndex(item => item.partId === partId);

    if (existingItemIndex > -1) {
      updatedItems = [...selectedOrder.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1
      };
    } else {
      const newItem: ServiceOrderItem = {
        partId: part.id,
        quantity: 1,
        unitPrice: part.price
      };
      updatedItems = [...selectedOrder.items, newItem];
    }

    const updatedOrder = {
      ...selectedOrder,
      items: updatedItems
    };
    
    // Update local state immediately for UI responsiveness
    setLocalItems(updatedOrder.items);
    // Update DB
    updateOrder(updatedOrder);
    setPartSearch('');
    setShowPartDropdown(false);
  };

  // Filter parts based on search (name or code)
  const filteredParts = parts.filter(part => {
    const search = partSearch.toLowerCase();
    const name = part.name?.toLowerCase() || '';
    const code = part.code?.toLowerCase() || '';
    return name.includes(search) || code.includes(search);
  });

  const handleRemoveItem = (index: number) => {
    if (!selectedOrder) return;
    const newItems = [...localItems];
    newItems.splice(index, 1);
    setLocalItems(newItems);
    updateOrder({ ...selectedOrder, items: newItems });
  };

  const handleItemPriceChange = (index: number, newPrice: string) => {
    if (!selectedOrder) return;
    const newItems = [...localItems];
    // Create a new object to avoid mutating the original
    // Use the raw string for the input if possible, but here we still store as number
    // To fix trailing dot/zero issues, we'd need to store strings in localItems.
    // However, simply using localItems for the map fixes the main "stuck" issue.
    const numericPrice = parseFloat(newPrice.replace(',', '.'));
    newItems[index] = { ...newItems[index], unitPrice: isNaN(numericPrice) ? 0 : numericPrice };
    setLocalItems(newItems);
  };

  const handleItemPriceBlur = (index: number) => {
    if (!selectedOrder) return;
    // Sync with DB on blur
    updateOrder({ ...selectedOrder, items: localItems });
  };

  const handleItemQtyChange = (index: number, newQty: number) => {
    if (!selectedOrder) return;
    const newItems = [...localItems];
    newItems[index] = { ...newItems[index], quantity: newQty };
    setLocalItems(newItems);
    updateOrder({ ...selectedOrder, items: newItems });
  };

  const handleLaborChange = (val: number) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, laborCost: val });
    }
  };

  // Sync local state when selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setLaborDescription(selectedOrder.laborDescription || '');
      setTechnicalReport(selectedOrder.technicalReport || '');
      setLaborCostLocal(String(selectedOrder.laborCost || 0));
      setShippingCostLocal(String(selectedOrder.shippingCost || 0));
      setDiscountLocal(String(selectedOrder.discount || 0));
      setLocalItems(selectedOrder.items || []);
    }
  }, [selectedOrder?.id]); // Only reset when ID changes, preventing loops if we depended on full object

  const handleLaborDescriptionChange = (description: string) => {
    setLaborDescription(description);
  };

  const handleLaborDescriptionBlur = () => {
    if (selectedOrder && selectedOrder.laborDescription !== laborDescription) {
      updateOrder({ ...selectedOrder, laborDescription });
    }
  };

  const handleTechnicalReportChange = (report: string) => {
    setTechnicalReport(report);
  };

  const handleTechnicalReportBlur = () => {
    if (selectedOrder && selectedOrder.technicalReport !== technicalReport) {
      updateOrder({ ...selectedOrder, technicalReport });
    }
  };

  const handleShippingChangeLocal = (method: string) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, shippingMethod: method });
    }
  };

  const handleLaborBlur = () => {
    const val = parseFloat(laborCostLocal) || 0;
    if (selectedOrder && selectedOrder.laborCost !== val) {
      updateOrder({ ...selectedOrder, laborCost: val });
    }
  };

  const handleShippingBlur = () => {
    const val = parseFloat(shippingCostLocal) || 0;
    if (selectedOrder && selectedOrder.shippingCost !== val) {
      updateOrder({ ...selectedOrder, shippingCost: val });
    }
  };

  const handleDiscountBlur = () => {
    const val = parseFloat(discountLocal) || 0;
    if (selectedOrder && selectedOrder.discount !== val) {
      updateOrder({ ...selectedOrder, discount: val });
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    if (selectedOrder) {
      const finalMethod = method === 'Cartão de Crédito' ? `${method} (${installments}x)` : method;
      updateOrder({ ...selectedOrder, paymentMethod: finalMethod });
    }
  };

  useEffect(() => {
    if (selectedOrder?.paymentMethod?.includes('Cartão de Crédito')) {
        const match = selectedOrder.paymentMethod.match(/\((\d+)x\)/);
        if (match) setInstallments(parseInt(match[1]));
    }
  }, [selectedOrder?.id]);

  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedOrder && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      updateOrder({ ...selectedOrder, paymentProofUrl: url });
    }
  };

  const calculateTotal = () => {
    if (!selectedOrder) return 0;
    const partsTotal = localItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const discountAmount = partsTotal * ((selectedOrder.discount || 0) / 100);
    const partsWithDiscount = partsTotal - discountAmount;
    return partsWithDiscount + (selectedOrder.laborCost || 0) + (selectedOrder.shippingCost || 0);
  };

  const calculateDiscountAmount = () => {
    if (!selectedOrder) return 0;
    const partsTotal = localItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    return partsTotal * ((selectedOrder.discount || 0) / 100);
  };

  const handleStatusChange = (status: OrderStatus) => {
    if (selectedOrder) {
      updateOrder({ ...selectedOrder, status });
    }
  }

  const handleSaveQuote = async () => {
    if (!selectedOrder) return;
    
    const updatedOrder = {
      ...selectedOrder,
      items: localItems,
      laborDescription,
      technicalReport,
      laborCost: parseFloat(laborCostLocal) || 0,
      shippingCost: parseFloat(shippingCostLocal) || 0,
      discount: parseFloat(discountLocal) || 0,
    };

    try {
      await updateOrder(updatedOrder);
      alert('Orçamento salvo com sucesso!');
    } catch (err) {
      console.error('Error saving quote:', err);
      alert('Erro ao salvar orçamento.');
    }
  };

  // Printable Component
  const PrintableQuote = ({ order, client, parts, total }: any) => {
    if (!order) return null;

    return (
      <div className="hidden print:flex flex-col fixed inset-0 bg-white z-[9999]">
        {/* Main Content Wrapper */}
        <div className="flex-1 p-8">
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

          {/* Info Grid - Row 1 (MCI and Client) */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Prestador de Serviço</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-full">
                <p className="font-bold text-slate-800 text-lg">Multi Comercial Importadora</p>
                <p className="text-slate-600">CNPJ: 05.502.390/0003-83</p>
                <p className="text-slate-600">Av. Imperatriz Leopoldina, 1718 - Vila Leopoldina</p>
                <p className="text-slate-600">São Paulo-SP, 05305-003</p>
                <p className="text-slate-600">2° andar</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 h-full">
                <p className="font-bold text-slate-800 text-lg">{client?.name || 'Cliente Não Identificado'}</p>
                <p className="text-slate-600">{client?.document}</p>
                <p className="text-slate-600">{client?.email}</p>
                <p className="text-slate-600">{client?.phone}</p>
                <p className="text-slate-500 text-sm mt-2">{client?.address}</p>
              </div>
            </div>
          </div>

          {/* Info Grid - Row 2 (Equipment) */}
          <div className="mb-8">
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
              {order.accessories && order.accessories.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Acessórios</p>
                  <p className="text-slate-700 text-sm">{Array.isArray(order.accessories) ? order.accessories.join(', ') : order.accessories}</p>
                </div>
              )}
            </div>
          </div>

          {/* Technical Report */}
          {order.technicalReport && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Relatório Técnico</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                {order.technicalReport}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Peças e Serviços</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="text-left py-3 text-slate-600 font-bold">Código</th>
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
                      <td className="py-3 text-slate-600 font-mono text-xs">{part?.code || '-'}</td>
                      <td className="py-3 text-slate-800">
                        <span className="font-medium">{part?.name || 'Item Diverso'}</span>
                        {!part && <span className="text-xs text-slate-400 ml-2">({item.partId})</span>}
                      </td>
                      <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600 whitespace-nowrap">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right text-slate-800 font-medium whitespace-nowrap">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  );
                })}
                {/* Labor Description Detail */}
                {order.laborCost > 0 && order.laborDescription && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-2 text-sm text-slate-500 italic pl-4 border-l-2 border-slate-200">
                      {order.laborDescription}
                    </td>
                  </tr>
                )}
                {/* Labor Row */}
                {order.laborCost > 0 && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={2} className="py-3 text-slate-800 font-medium">Mão de Obra Especializada</td>
                    <td className="py-3 text-right text-slate-600">1</td>
                    <td className="py-3 text-right text-slate-600 whitespace-nowrap">R$ {order.laborCost.toFixed(2)}</td>
                    <td className="py-3 text-right text-slate-800 font-medium whitespace-nowrap">R$ {order.laborCost.toFixed(2)}</td>
                  </tr>
                )}
                {/* Shipping Row */}
                {(order.shippingCost > 0 || order.shippingMethod) && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={2} className="py-3 text-slate-800 font-medium">Frete: {order.shippingMethod || 'Envio'}</td>
                    <td className="py-3 text-right text-slate-600">1</td>
                    <td className="py-3 text-right text-slate-600 whitespace-nowrap">R$ {(order.shippingCost || 0).toFixed(2)}</td>
                    <td className="py-3 text-right text-slate-800 font-medium whitespace-nowrap">R$ {(order.shippingCost || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="pt-4 text-right text-slate-600">Subtotal Peças</td>
                  <td className="pt-4 text-right text-slate-800 whitespace-nowrap">R$ {order.items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0).toFixed(2)}</td>
                </tr>
                {order.discount > 0 && (
                  <tr>
                    <td colSpan={4} className="pt-2 text-right text-red-500">Desconto {order.discount}% (sobre peças)</td>
                    <td className="pt-2 text-right text-red-500 whitespace-nowrap">- R$ {(order.items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0) * (order.discount / 100)).toFixed(2)}</td>
                  </tr>
                )}
                {order.laborCost > 0 && (
                  <tr>
                    <td colSpan={4} className="pt-2 text-right text-slate-600">Mão de Obra</td>
                    <td className="pt-2 text-right text-slate-800 whitespace-nowrap">R$ {order.laborCost.toFixed(2)}</td>
                  </tr>
                )}
                {order.shippingCost > 0 && (
                  <tr>
                    <td colSpan={4} className="pt-2 text-right text-slate-600">Frete ({order.shippingMethod || 'Envio'})</td>
                    <td className="pt-2 text-right text-slate-800 whitespace-nowrap">R$ {order.shippingCost.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-slate-800">
                  <td colSpan={4} className="pt-4 text-right font-bold text-slate-800 text-lg">TOTAL</td>
                  <td className="pt-4 text-right font-bold text-emerald-600 text-lg whitespace-nowrap">R$ {total.toFixed(2)}</td>
                </tr>
                {order.paymentMethod && (
                  <tr>
                    <td colSpan={4} className="pt-3 text-right text-slate-600 font-medium">Forma de Pagamento</td>
                    <td className="pt-3 text-right text-slate-800 font-semibold">{order.paymentMethod}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Terms & Signature */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-12">
              <div className="text-xs text-slate-400 text-justify">
                <p className="mb-2"><strong>Condições:</strong> Validade deste orçamento é de 10 dias.</p>
                <p>Toda manutenção e peças possuem garantia de 1 ano, exceto por mau uso.</p>
              </div>
              <div className="flex flex-col items-center justify-end">
                <div className="w-full border-b border-slate-300 mb-2"></div>
                <p className="text-sm font-medium text-slate-600">Assinatura do Responsável</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full mt-auto bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-400 py-2">
          <div className="max-w-4xl mx-auto px-8">
            <div className="bg-white rounded shadow-sm border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Técnico Responsável</p>
                  <p className="text-sm font-semibold text-emerald-600">{technicianData.name}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="font-medium">{technicianData.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="font-semibold text-green-700">{technicianData.phone}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] text-slate-500">MCI Assistência Técnica • www.mci.tv</p>
                <p className="text-[10px] text-slate-600 font-medium">Garantia de 1 ano em toda manutenção e peças</p>
              </div>
            </div>
          </div>
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
            padding: 0;
            background: white;
            display: flex !important;
            flex-direction: column;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 0;
          }
          /* Force single page */
          html, body {
            height: 100%;
            overflow: hidden;
          }
          .print-quote {
            transform: scale(0.95);
            transform-origin: top center;
          }
        }
      `}</style>

      {/* Render Printable Component Hiddenly */}
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
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg" title="Imprimir">
                  <Printer size={20} />
                </button>
                <button
                  onClick={handleSaveQuote}
                  className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-medium text-sm flex-1 sm:flex-initial border border-slate-200"
                >
                  <Save size={16} /> Salvar
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
              {/* Technical Report Input */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-800 mb-4">Relatório Técnico</h3>
                <textarea
                  className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  placeholder="Descreva o laudo técnico do equipamento..."
                  value={technicalReport}
                  onChange={(e) => handleTechnicalReportChange(e.target.value)}
                  onBlur={handleTechnicalReportBlur}
                />
              </div>

              {/* Parts Selection */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Peças e Componentes</h3>
                  <div className="relative w-80">
                    <input
                      type="text"
                      placeholder="Buscar por nome ou código..."
                      value={partSearch}
                      onChange={(e) => {
                        setPartSearch(e.target.value);
                        setShowPartDropdown(true);
                      }}
                      onFocus={() => setShowPartDropdown(true)}
                      className="w-full text-sm border-slate-200 rounded-lg p-2 pr-10"
                    />
                    {partSearch && (
                      <button
                        onClick={() => {
                          setPartSearch('');
                          setShowPartDropdown(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                    {showPartDropdown && filteredParts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredParts.slice(0, 20).map(part => (
                          <button
                            key={part.id}
                            onClick={() => handleAddItem(part.id)}
                            className="w-full text-left px-4 py-2 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="font-medium text-slate-800">{part.name}</div>
                            <div className="text-xs text-slate-500">Código: {part.code} • R$ {part.price.toFixed(2)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="p-3 text-left">Código</th>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 text-right">Unitário</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localItems.map((item, idx) => {
                      const part = parts.find(p => p.id === item.partId);
                      return (
                        <tr key={idx}>
                          <td className="p-3 text-slate-500 font-mono text-sm">{part?.code || '-'}</td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{part ? part.name : 'Item Customizado / Excluído'}</div>
                            {!part && <div className="text-xs text-slate-400">ID: {item.partId}</div>}
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              className="w-16 p-1 border rounded text-right text-sm"
                              value={item.quantity}
                              onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              className="w-24 p-1 border rounded text-right text-sm font-medium"
                              value={item.unitPrice}
                              onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                              onBlur={() => handleItemPriceBlur(idx)}
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
                      onChange={(e) => handleShippingChangeLocal(e.target.value)}
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
                      value={shippingCostLocal}
                      onChange={(e) => setShippingCostLocal(e.target.value)}
                      onBlur={handleShippingBlur}
                      className="w-full p-2 border rounded-lg text-right font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mão de Obra (R$)</label>
                    <input
                      type="number"
                      value={laborCostLocal}
                      onChange={(e) => setLaborCostLocal(e.target.value)}
                      onBlur={handleLaborBlur}
                      className="w-full p-2 border rounded-lg text-right font-medium"
                    />
                  </div>
                </div>

                {/* Labor Description */}
                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-4">Descrição do Serviço / Mão de Obra</h3>
                  <textarea
                    className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    placeholder="Descreva detalhadamente o serviço a ser realizado..."
                    value={laborDescription}
                    onChange={(e) => handleLaborDescriptionChange(e.target.value)}
                    onBlur={handleLaborDescriptionBlur}
                  />
                  <p className="text-xs text-slate-400 mt-2">Esta descrição aparecerá no orçamento impresso</p>
                </div>

                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Desconto sobre Peças (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={discountLocal}
                    onChange={(e) => setDiscountLocal(e.target.value)}
                    onBlur={handleDiscountBlur}
                    className="w-full p-2 border border-red-200 rounded-lg text-right font-medium text-red-600"
                  />
                  <p className="text-xs text-slate-500 mt-1">Percentual aplicado ao valor das peças</p>
                </div>

                <div className="w-full mt-4 border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Formas de Pagamento</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                      {[
                          { id: 'Pix', icon: QrCode, color: 'text-teal-600', bg: 'bg-teal-50' },
                          { id: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                          { id: 'Cartão de Débito', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                          { id: 'Dinheiro', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { id: 'Transferência', icon: Send, color: 'text-orange-600', bg: 'bg-orange-50' },
                          { id: 'Boleto', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
                      ].map((method) => {
                          const isSelected = selectedOrder.paymentMethod?.startsWith(method.id);
                          return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => {
                                    const finalMethod = method.id === 'Cartão de Crédito' ? `${method.id} (${installments}x)` : method.id;
                                    updateOrder({ ...selectedOrder, paymentMethod: finalMethod });
                                }}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                    isSelected 
                                    ? `border-emerald-500 ${method.bg} shadow-md scale-105` 
                                    : 'border-slate-100 hover:border-slate-200 bg-white'
                                }`}
                            >
                                <method.icon className={`${method.color} mb-2`} size={24} />
                                <span className="text-[10px] font-bold uppercase text-center leading-tight">{method.id}</span>
                            </button>
                          );
                      })}
                  </div>

                  {selectedOrder.paymentMethod?.startsWith('Cartão de Crédito') && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 max-w-sm">
                          <label className="block text-sm font-bold text-blue-900 mb-2">Parcelamento</label>
                          <select 
                              value={installments} 
                              onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setInstallments(val);
                                  updateOrder({ ...selectedOrder, paymentMethod: `Cartão de Crédito (${val}x)` });
                              }}
                              className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                          >
                              {[...Array(12)].map((_, i) => (
                                  <option key={i+1} value={i+1}>{i+1}x {i === 0 ? '(À vista)' : `de R$ ${(calculateTotal() / (i+1)).toFixed(2)}`}</option>
                              ))}
                          </select>
                      </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-3">Comprovante de Pagamento</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative overflow-hidden inline-block w-full sm:w-auto">
                        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors w-full sm:w-auto">
                          Escolher Arquivo
                        </button>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handlePaymentProofUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      
                      {selectedOrder.paymentProofUrl ? (
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                          <Check className="text-emerald-500" size={16} />
                          <a
                            href={selectedOrder.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText size={16} /> Ver Comprovante
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Nenhum arquivo enviado</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 items-end">
              <div className="flex justify-between items-center gap-4 text-slate-500">
                <span>Peças</span>
                <span>R$ {localItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0).toFixed(2)}</span>
              </div>
              {selectedOrder.discount && selectedOrder.discount > 0 && (
                <div className="flex justify-between items-center gap-4 text-red-500">
                  <span>Desconto {selectedOrder.discount}% (sobre peças)</span>
                  <span>- R$ {calculateDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              {(selectedOrder.laborCost > 0) && (
                <div className="flex justify-between items-center gap-4 text-slate-500">
                  <span>Mão de Obra</span>
                  <span>R$ {selectedOrder.laborCost.toFixed(2)}</span>
                </div>
              )}
              {(selectedOrder.shippingCost > 0) && (
                <div className="flex justify-between items-center gap-4 text-slate-500">
                  <span>Frete</span>
                  <span>R$ {selectedOrder.shippingCost.toFixed(2)}</span>
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