import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, AlertCircle, Filter, Package, Settings, Database, LayoutGrid, List as ListIcon, Edit2 } from 'lucide-react';
import { Part } from '../types';
import InventoryMaintenance from '../components/inventory/InventoryMaintenance';

const Inventory = () => {
  const { parts, addPart, updatePart, refreshParts } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'maintenance'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [manufacturerFilter, setManufacturerFilter] = useState<'all' | 'Aputure' | 'Astera' | 'Cream Source'>('all'); // Add filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Part>>({
    name: '', code: '', category: '', quantity: 0, minStock: 0, price: 0, location: '', imageUrl: ''
  });

  const filteredParts = parts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (manufacturerFilter === 'all') return matchesSearch;
    return matchesSearch && p.manufacturer === manufacturerFilter;
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      code: '',
      category: '',
      quantity: 0,
      minStock: 0,
      price: 0,
      location: '',
      imageUrl: 'https://picsum.photos/200',
      manufacturer: 'Aputure',
      unitsPerPackage: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (part: Part) => {
    setIsEditing(true);
    setFormData({ ...part });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (isEditing && formData.id) {
      await updatePart(formData as Part);
    } else {
      await addPart({
        ...formData as Part,
        id: Math.random().toString(36).substr(2, 9), // Temp ID, will be replaced by DB
        imageUrl: formData.imageUrl || 'https://picsum.photos/200'
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque de Peças</h1>
          <p className="text-slate-500 text-sm">Gerenciamento de componentes Aputure e Astera</p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-initial ${activeTab === 'list'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <Package size={18} />
            <span className="hidden sm:inline">Consulta</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-initial ${activeTab === 'maintenance'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Manutenção</span>
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="flex flex-col gap-4">
            {/* Manufacturer Filter Buttons */}
            <div className="grid grid-cols-2 sm:flex gap-2">
              <button
                onClick={() => setManufacturerFilter('all')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all ${manufacturerFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Todos
              </button>
              <button
                onClick={() => setManufacturerFilter('Aputure')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all flex items-center gap-1 sm:gap-2 justify-center ${manufacturerFilter === 'Aputure'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <img src="/aputure-logo.png" alt="Aputure" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
                <span className="hidden xs:inline">Aputure</span>
              </button>
              <button
                onClick={() => setManufacturerFilter('Astera')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all flex items-center gap-1 sm:gap-2 justify-center ${manufacturerFilter === 'Astera'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <img src="/astera-logo.png" alt="Astera" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
                <span className="hidden xs:inline">Astera</span>
              </button>
              <button
                onClick={() => setManufacturerFilter('Cream Source')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all flex items-center gap-1 sm:gap-2 justify-center ${manufacturerFilter === 'Cream Source'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <img src="/creamsource-logo.png" alt="Cream Source" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
                <span className="hidden xs:inline">Cream</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
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

              <button
                onClick={handleOpenAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm w-full sm:w-auto"
              >
                <Plus size={18} />
                Nova Peça
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, código ou categoria..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Filter size={18} />
              <span>Filtros</span>
            </button>
          </div>

          {/* Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredParts.map(part => (
                <div key={part.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="flex p-4 gap-4">
                    <img src={part.imageUrl} alt={part.name} className="w-20 h-20 object-cover rounded-lg bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-800 truncate">{part.name}</h3>
                        {part.quantity <= part.minStock && (
                          <div className="text-red-500" title="Estoque Baixo">
                            <AlertCircle size={18} />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 mb-2">{part.code}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          Loc: {part.location}
                        </span>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Qtd</p>
                          <p className={`font-bold ${part.quantity <= part.minStock ? 'text-red-600' : 'text-slate-800'}`}>
                            {part.quantity} un
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">R$ {part.price.toFixed(2)}</span>
                    <button
                      onClick={() => handleOpenEdit(part)}
                      className="text-xs text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 md:px-6 py-3">Peça</th>
                    <th className="px-4 md:px-6 py-3">Código</th>
                    <th className="px-4 md:px-6 py-3">Localização</th>
                    <th className="px-4 md:px-6 py-3 text-right">Preço</th>
                    <th className="px-4 md:px-6 py-3 text-right">Qtd</th>
                    <th className="px-4 md:px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParts.map(part => (
                    <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={part.imageUrl} alt="" className="w-8 h-8 rounded object-cover bg-slate-200" />
                          <span className="font-medium text-slate-800">{part.name}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-mono text-slate-600">{part.code}</td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-600">{part.location}</td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-600 text-right">R$ {part.price.toFixed(2)}</td>
                      <td className={`px-4 md:px-6 py-4 text-sm font-bold text-right ${part.quantity <= part.minStock ? 'text-red-600' : 'text-slate-600'}`}>
                        {part.quantity}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(part)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <InventoryMaintenance onUpdate={refreshParts} />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Peça' : 'Adicionar Nova Peça'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Peça</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código (SKU)</label>
                  <input required type="text" className="w-full p-2 border rounded-lg" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <input type="text" className="w-full p-2 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={formData.manufacturer || 'Aputure'}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value as any })}
                  >
                    <option value="Aputure">Aputure</option>
                    <option value="Astera">Astera</option>
                    <option value="Cream Source">Cream Source</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Un. por Pacote</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border rounded-lg"
                    value={formData.unitsPerPackage || 1}
                    onChange={e => setFormData({ ...formData, unitsPerPackage: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input required type="number" className="w-full p-2 border rounded-lg" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input required type="number" className="w-full p-2 border rounded-lg" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border rounded-lg" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
                  <input type="text" className="w-full p-2 border rounded-lg" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem</label>
                  <input type="text" className="w-full p-2 border rounded-lg" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                  {formData.imageUrl && (
                    <div className="mt-2 text-center">
                      <img src={formData.imageUrl} alt="Preview" className="h-32 object-contain mx-auto rounded border border-slate-200" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  {isEditing ? 'Salvar Alterações' : 'Criar Peça'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;