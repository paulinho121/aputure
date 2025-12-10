import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, Plus, ClipboardList, Camera, CheckSquare, Printer, Trash2 } from 'lucide-react';
import { OrderStatus, ServiceOrder } from '../types';
import ClientSearch from '../components/ClientSearch';
import { supabase } from '../lib/supabase';

const ServiceOrders = () => {
  const navigate = useNavigate();
  const { user, orders, clients, addOrder, updateOrder, deleteOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  // New Order State
  const [newOrder, setNewOrder] = useState<Partial<ServiceOrder>>({
    model: '', serialNumber: '', condition: '', faultDescription: '', accessories: [], serviceType: 'Paid'
  });
  const [selectedClientId, setSelectedClientId] = useState('');
  const [accessoryInput, setAccessoryInput] = useState('');

  const commonAccessories = ['Fonte', 'Cabo AC', 'Refletor', 'Case', 'Control Box', 'Head Cable'];

  const handleAddAccessory = (acc: string) => {
    const current = newOrder.accessories || [];
    if (current.includes(acc)) {
      setNewOrder({ ...newOrder, accessories: current.filter(a => a !== acc) });
    } else {
      setNewOrder({ ...newOrder, accessories: [...current, acc] });
    }
  };



  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Selecione um cliente');
      return;
    }

    try {
      const year = new Date().getFullYear();
      const { data: lastOrders, error } = await supabase
        .from('service_orders')
        .select('id')
        .ilike('id', `OS-${year}-%`)
        .order('id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last order:', error);
        alert('Erro ao gerar número da OS. Tente novamente.');
        return;
      }

      let nextSequence = 1;
      if (lastOrders && lastOrders.length > 0) {
        const lastId = lastOrders[0].id;
        const parts = lastId.split('-');
        if (parts.length === 3) {
          const sequence = parseInt(parts[2]);
          if (!isNaN(sequence)) {
            nextSequence = sequence + 1;
          }
        }
      }

      const order: ServiceOrder = {
        id: `OS-${year}-${nextSequence.toString().padStart(3, '0')}`,
        clientId: selectedClientId,
        model: newOrder.model!,
        serialNumber: newOrder.serialNumber!,
        condition: newOrder.condition!,
        faultDescription: newOrder.faultDescription!,
        accessories: newOrder.accessories || [],
        entryDate: new Date().toISOString(),
        status: OrderStatus.PENDING,
        serviceType: newOrder.serviceType || 'Paid',
        items: [],
        laborCost: 0,
        photos: []
      };
      addOrder(order);
      setShowNewModal(false);
      setNewOrder({ model: '', serialNumber: '', condition: '', faultDescription: '', accessories: [], serviceType: 'Paid' });
      setSelectedClientId('');
    } catch (err) {
      console.error('Unexpected error creating order:', err);
      alert('Erro inesperado ao criar OS.');
    }
  };

  const handleStatusChange = (status: OrderStatus) => {
    if (selectedOrder) {
      // If changing to DELIVERED, show invoice modal
      if (status === OrderStatus.DELIVERED) {
        setPendingStatus(status);
        setShowInvoiceModal(true);
      } else {
        // For other statuses, update immediately
        const updated = { ...selectedOrder, status };
        updateOrder(updated);
        setSelectedOrder(updated);
      }
    }
  };

  const handleInvoiceSubmit = () => {
    if (!invoiceNumber.trim()) {
      alert('Por favor, digite o número da nota fiscal.');
      return;
    }
    if (selectedOrder && pendingStatus) {
      const updated = {
        ...selectedOrder,
        status: pendingStatus,
        invoiceNumber: invoiceNumber.trim()
      };
      updateOrder(updated);
      setSelectedOrder(updated);
      setShowInvoiceModal(false);
      setInvoiceNumber('');
      setPendingStatus(null);
    }
  };

  const handleInvoiceCancel = () => {
    setShowInvoiceModal(false);
    setInvoiceNumber('');
    setPendingStatus(null);
  };

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Printable Entry Receipt Component
  const PrintableEntryReceipt = ({ order }: { order: ServiceOrder }) => {
    const client = clients.find(c => c.id === order.clientId);
    if (!order || !client) return null;

    return (
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
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
            <h2 className="text-xl font-bold text-slate-800">TERMO DE ENTRADA</h2>
            <p className="text-slate-500 font-mono">#{order.id}</p>
            <p className="text-sm text-slate-500 mt-1">{new Date(order.entryDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Client and Equipment Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-800 text-lg">{client.name}</p>
              <p className="text-slate-600">{client.document}</p>
              <p className="text-slate-600">{client.email}</p>
              <p className="text-slate-600">{client.phone}</p>
              <p className="text-slate-500 text-sm mt-2">{client.address}</p>
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
                <p className="text-xs font-bold text-slate-400 uppercase">Estado Físico</p>
                <p className="text-slate-700">{order.condition}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fault Description */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Defeito Relatado</h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-slate-700">{order.faultDescription}</p>
          </div>
        </div>

        {/* Accessories Checklist */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Acessórios Recebidos</h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            {order.accessories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {order.accessories.map((acc, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-700">
                    ✓ {acc}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">Nenhum acessório registrado</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="mb-12 pt-8 border-t border-slate-200">
          <div className="text-xs text-slate-400 text-justify">
            <p className="mb-2"><strong>Condições:</strong> O equipamento será analisado e um orçamento será enviado para aprovação.</p>
            <p className="mb-2">Toda manutenção e peças possuem garantia de 1 ano, exceto por mau uso.</p>
            <p>O cliente autoriza a abertura e análise do equipamento para diagnóstico.</p>
          </div>
        </div>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-12 mt-16">
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-300 mb-2"></div>
            <p className="text-sm font-medium text-slate-600">Assinatura do Cliente</p>
            <p className="text-xs text-slate-400">{client.name}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-300 mb-2"></div>
            <p className="text-sm font-medium text-slate-600">Técnico Responsável</p>
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
        <h1 className="text-2xl font-bold text-slate-800">Ordens de Serviço</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Nova Entrada
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar OS, modelo ou serial..."
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
              <th className="p-3 md:p-4 font-semibold text-slate-600 text-sm">Nº OS</th>
              <th className="p-3 md:p-4 font-semibold text-slate-600 text-sm">Cliente</th>
              <th className="p-3 md:p-4 font-semibold text-slate-600 text-sm">Equipamento</th>
              <th className="p-3 md:p-4 font-semibold text-slate-600 text-sm">Data Entrada</th>
              <th className="p-3 md:p-4 font-semibold text-slate-600 text-sm">Status</th>
              <th className="p-3 md:p-4 font-semibold text-slate-600 text-sm">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map(order => {
              const client = clients.find(c => c.id === order.clientId);
              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 md:p-4 font-mono font-medium text-slate-800 text-sm">{order.id}</td>
                  <td className="p-3 md:p-4 text-slate-600 text-sm">{client?.name || 'Desconhecido'}</td>
                  <td className="p-3 md:p-4 text-slate-600">
                    <div className="font-medium text-slate-800 text-sm">{order.model}</div>
                    <div className="text-xs text-slate-400 font-mono">{order.serialNumber}</div>
                  </td>
                  <td className="p-3 md:p-4 text-slate-600 text-sm">{new Date(order.entryDate).toLocaleDateString()}</td>
                  <td className="p-3 md:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                      order.status === OrderStatus.WAITING_APPROVAL ? 'bg-amber-100 text-amber-700' :
                        order.status === OrderStatus.DIAGNOSING ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 md:p-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                    >
                      Detalhes
                    </button>
                    {user?.email === 'jonathan@mcistore.com.br' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.')) {
                            deleteOrder(order.id);
                          }
                        }}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium"
                        title="Excluir Ordem"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
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
              <h2 className="text-xl font-bold">Nova Ordem de Serviço</h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>
            <div className="p-8">
              <form onSubmit={handleSubmitOrder} className="space-y-8">
                {/* Client Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2"><CheckSquare size={20} /> Cliente</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecionar Cliente</label>
                    <ClientSearch
                      clients={clients}
                      onSelect={setSelectedClientId}
                      selectedClientId={selectedClientId}
                    />
                  </div>
                </div>



                {/* Service Type Selection */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2"><ClipboardList size={20} /> Tipo de Serviço</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${newOrder.serviceType === 'Paid' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="serviceType"
                        className="hidden"
                        checked={newOrder.serviceType === 'Paid'}
                        onChange={() => setNewOrder({ ...newOrder, serviceType: 'Paid' })}
                      />
                      <div className="font-bold text-slate-800">Orçamento / Pago</div>
                      <div className="text-sm text-slate-500">Serviço com custo para o cliente</div>
                    </label>

                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${newOrder.serviceType === 'Warranty' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="serviceType"
                        className="hidden"
                        checked={newOrder.serviceType === 'Warranty'}
                        onChange={() => setNewOrder({ ...newOrder, serviceType: 'Warranty' })}
                      />
                      <div className="font-bold text-slate-800">Garantia</div>
                      <div className="text-sm text-slate-500">Serviço coberto pela garantia</div>
                    </label>
                  </div>
                </div>

                {/* Equipment Info */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2"><ClipboardList size={20} /> Equipamento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                      <input required type="text" placeholder="Ex: LS 600d Pro" className="w-full p-2 border rounded-lg" value={newOrder.model} onChange={e => setNewOrder({ ...newOrder, model: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nº Série</label>
                      <input required type="text" className="w-full p-2 border rounded-lg font-mono" value={newOrder.serialNumber} onChange={e => setNewOrder({ ...newOrder, serialNumber: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado Físico / Condições</label>
                    <input required type="text" placeholder="Riscos, amassados, sujeira..." className="w-full p-2 border rounded-lg" value={newOrder.condition} onChange={e => setNewOrder({ ...newOrder, condition: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Defeito Reclamado</label>
                    <textarea required rows={3} className="w-full p-2 border rounded-lg" value={newOrder.faultDescription} onChange={e => setNewOrder({ ...newOrder, faultDescription: e.target.value })} />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold border-b pb-2">Checklist de Acessórios</h2>
                  <div className="flex flex-wrap gap-3">
                    {commonAccessories.map(acc => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => handleAddAccessory(acc)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${(newOrder.accessories || []).includes(acc)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                          }`}
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Outro acessório..."
                      className="flex-1 p-2 border rounded-lg text-sm"
                      value={accessoryInput}
                      onChange={e => setAccessoryInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (accessoryInput) {
                          handleAddAccessory(accessoryInput);
                          setAccessoryInput('');
                        }
                      }}
                      className="bg-slate-200 px-3 rounded-lg text-sm font-medium hover:bg-slate-300"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all">
                    Gerar Ordem de Serviço
                  </button>
                </div>
              </form>
            </div>
          </div >
        </div >
      )}

      {/* VIEW/EDIT MODAL */}
      {
        selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Ordem de Serviço #{selectedOrder.id}</h2>
                  <p className="text-sm text-slate-500">{new Date(selectedOrder.entryDate).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Status Control */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-900 mb-2">Status Atual</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.values(OrderStatus).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedOrder.status === status
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Equipamento</h3>
                    <p className="font-medium text-lg text-slate-800">{selectedOrder.model}</p>
                    <p className="font-mono text-sm text-slate-500">{selectedOrder.serialNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente</h3>
                    <p className="font-medium text-lg text-slate-800">
                      {clients.find(c => c.id === selectedOrder.clientId)?.name || 'Cliente Removido'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Defeito Reclamado</h3>
                  <div className="bg-slate-50 p-3 rounded-lg text-slate-700 border border-slate-100">
                    {selectedOrder.faultDescription}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Acessórios Checkados</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.accessories.map(acc => (
                      <span key={acc} className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded-md border border-slate-200">
                        {acc}
                      </span>
                    ))}
                    {selectedOrder.accessories.length === 0 && <span className="text-slate-400 italic">Nenhum acessório registrado</span>}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                  <Printer size={18} />
                  Imprimir Termo
                </button>
                <button
                  onClick={() => {
                    navigate(`/quotes?orderId=${selectedOrder.id}`);
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Gerar Orçamento
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Printable Entry Receipt */}
            <PrintableEntryReceipt order={selectedOrder} />
          </div>
        )
      }

      {/* INVOICE NUMBER MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b bg-emerald-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Número da Nota Fiscal</h2>
                <p className="text-sm text-slate-500">Ordem #{selectedOrder?.id}</p>
              </div>
              <button onClick={handleInvoiceCancel} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Digite o número da nota fiscal
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-12345"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInvoiceSubmit();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  Este campo é obrigatório para marcar a ordem como entregue.
                </p>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <button
                onClick={handleInvoiceCancel}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvoiceSubmit}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default ServiceOrders;