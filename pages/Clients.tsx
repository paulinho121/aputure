import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, User, Phone, Mail, MapPin, ArrowRight, ArrowLeft, LayoutGrid, List as ListIcon, Save } from 'lucide-react';
import { Client } from '../types';

const Clients = () => {
  const { clients, addClient, updateClient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '', document: '', email: '', phone: '',
    zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', notes: ''
  });

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    // Construct full address for backward compatibility if needed, but we mostly use the structured fields now if available
    const fullAddress = `${newClient.street}, ${newClient.number} ${newClient.complement ? '- ' + newClient.complement : ''} - ${newClient.neighborhood}, ${newClient.city} - ${newClient.state} (${newClient.zipCode})`;

    if (isEditing && newClient.id) {
      updateClient({
        ...newClient as Client,
        address: newClient.address || fullAddress
      });
    } else {
      addClient({
        ...newClient as Client,
        address: fullAddress,
        id: Math.random().toString(36).substr(2, 9)
      });
    }

    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setIsEditing(false);
    setStep(1);
    setNewClient({
      name: '', document: '', email: '', phone: '',
      zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', notes: ''
    });
  };

  const handleEditClick = (client: Client) => {
    setIsEditing(true);
    setNewClient({ ...client });
    setStep(1);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setNewClient({
              name: '', document: '', email: '', phone: '',
              zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
            });
            setStep(1);
            setShowAddModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, documento ou email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* View Toggles */}
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            title="Visualização em Grade"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            title="Visualização em Lista"
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{client.name}</h3>
                    <p className="text-sm text-slate-500 font-mono">{client.document}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditClick(client)}
                  className="text-sm text-emerald-600 font-medium hover:underline"
                >
                  Detalhes / Editar
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">{client.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 md:px-6 py-3">Nome / Documento</th>
                <th className="px-4 md:px-6 py-3">Contato</th>
                <th className="px-4 md:px-6 py-3">Endereço</th>
                <th className="px-4 md:px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 md:px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-800">{client.name}</div>
                      <div className="text-xs font-mono text-slate-500">{client.document}</div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" /> {client.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" /> {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={client.address}>
                    {client.address}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <div className="flex justify-end flex-1">
                      <button
                        onClick={() => handleEditClick(client)}
                        className="text-sm text-emerald-600 font-medium hover:underline"
                      >
                        Detalhes / Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <p className="text-sm text-slate-500">Etapa {step} de 2: {step === 1 ? 'Dados Pessoais' : 'Endereço e Contato'}</p>
              </div>
              <div className="flex gap-2 mb-6">
                <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              </div>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              {step === 1 ? (
                // STEP 1: Personal Data
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input required type="text" className="w-full p-2 border rounded-lg" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF / CNPJ</label>
                    <input required type="text" className="w-full p-2 border rounded-lg" value={newClient.document} onChange={e => setNewClient({ ...newClient, document: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                      <input required type="email" className="w-full p-2 border rounded-lg" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                      <input required type="tel" className="w-full p-2 border rounded-lg" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
              ) : (
                // STEP 2: Address
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                      <input
                        required
                        type="text"
                        className="w-full p-2 border rounded-lg"
                        value={newClient.zipCode}
                        onChange={async (e) => {
                          const cep = e.target.value.replace(/\D/g, '');
                          setNewClient({ ...newClient, zipCode: cep });

                          if (cep.length === 8) {
                            try {
                              const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                              const data = await response.json();

                              if (!data.erro) {
                                setNewClient(prev => ({
                                  ...prev,
                                  zipCode: cep,
                                  street: data.logradouro,
                                  neighborhood: data.bairro,
                                  city: data.localidade,
                                  state: data.uf
                                }));
                              }
                            } catch (error) {
                              console.error('Erro ao buscar CEP:', error);
                            }
                          }
                        }}
                        maxLength={8}
                        autoFocus
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                      <input required type="text" className="w-full p-2 border rounded-lg bg-slate-50" value={newClient.city} onChange={e => setNewClient({ ...newClient, city: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rua / Avenida</label>
                      <input required type="text" className="w-full p-2 border rounded-lg" value={newClient.street} onChange={e => setNewClient({ ...newClient, street: e.target.value })} />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                      <input required type="text" className="w-full p-2 border rounded-lg" value={newClient.number} onChange={e => setNewClient({ ...newClient, number: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                      <input type="text" className="w-full p-2 border rounded-lg" value={newClient.complement} onChange={e => setNewClient({ ...newClient, complement: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                      <input required type="text" className="w-full p-2 border rounded-lg" value={newClient.neighborhood} onChange={e => setNewClient({ ...newClient, neighborhood: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF)</label>
                      <input required type="text" maxLength={2} className="w-full p-2 border rounded-lg uppercase" value={newClient.state} onChange={e => setNewClient({ ...newClient, state: e.target.value })} />
                    </div>
                    <div></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                {step === 2 ? (
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                ) : (
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    Cancelar
                  </button>
                )}

                {step === 1 ? (
                  <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Próximo
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    <Save size={18} /> {isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;