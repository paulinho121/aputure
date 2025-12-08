import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Database, Server, Users, Wrench, Package, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const Maintenance = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const downloadFile = (data: any, filename: string) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBackup = async (type: 'clients' | 'orders' | 'inventory' | 'full') => {
        setLoading(type);
        setMessage(null);

        try {
            if (type === 'clients') {
                const { data, error } = await supabase.from('clients').select('*');
                if (error) throw error;
                downloadFile(data, `backup_clientes_${new Date().toISOString().split('T')[0]}.json`);
                setMessage({ type: 'success', text: `Backup de ${data.length} clientes realizado com sucesso!` });
            }
            else if (type === 'orders') {
                const { data, error } = await supabase.from('service_orders').select('*');
                if (error) throw error;
                downloadFile(data, `backup_ordens_${new Date().toISOString().split('T')[0]}.json`);
                setMessage({ type: 'success', text: `Backup de ${data.length} ordens de serviço realizado com sucesso!` });
            }
            else if (type === 'inventory') {
                // Fetch from all inventory tables
                const { data: parts, error: err1 } = await supabase.from('parts').select('*');
                const { data: astera, error: err2 } = await supabase.from('astera_parts').select('*');
                const { data: creamsource, error: err3 } = await supabase.from('cream_source_parts').select('*');

                if (err1 || err2 || err3) throw err1 || err2 || err3;

                const allParts = {
                    general: parts || [],
                    astera: astera || [],
                    creamsource: creamsource || []
                };

                downloadFile(allParts, `backup_estoque_${new Date().toISOString().split('T')[0]}.json`);
                const total = (parts?.length || 0) + (astera?.length || 0) + (creamsource?.length || 0);
                setMessage({ type: 'success', text: `Backup de ${total} itens do estoque realizado com sucesso!` });
            }
            else if (type === 'full') {
                // Full Backup
                const { data: clients, error: errClients } = await supabase.from('clients').select('*');
                const { data: orders, error: errOrders } = await supabase.from('service_orders').select('*');
                const { data: parts, error: errParts } = await supabase.from('parts').select('*');
                const { data: astera, error: errAstera } = await supabase.from('astera_parts').select('*');
                const { data: creamsource, error: errCream } = await supabase.from('cream_source_parts').select('*');

                if (errClients || errOrders || errParts || errAstera || errCream) {
                    throw new Error("Erro ao coletar dados para backup completo.");
                }

                const fullBackup = {
                    timestamp: new Date().toISOString(),
                    clients: clients || [],
                    service_orders: orders || [],
                    inventory: {
                        general: parts || [],
                        astera: astera || [],
                        creamsource: creamsource || []
                    }
                };

                downloadFile(fullBackup, `backup_completo_mci_${new Date().toISOString().split('T')[0]}.json`);
                setMessage({ type: 'success', text: 'Backup completo do sistema realizado com sucesso!' });
            }

        } catch (error: any) {
            console.error('Backup error:', error);
            setMessage({ type: 'error', text: `Erro ao realizar backup: ${error.message || 'Erro desconhecido'}` });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manutenção e Segurança</h1>
                    <p className="text-slate-500">Gerencie backups e segurança dos dados do sistema</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <p>{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Backup de Dados</h2>
                            <p className="text-sm text-slate-500">Exportar dados para segurança</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleBackup('clients')}
                            disabled={loading !== null}
                            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-slate-400 group-hover:text-blue-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-slate-700 group-hover:text-blue-700">Clientes</p>
                                    <p className="text-xs text-slate-500">Exportar cadastro de clientes</p>
                                </div>
                            </div>
                            {loading === 'clients' ? <Loader2 className="animate-spin text-blue-600" /> : <Download size={18} className="text-slate-400 group-hover:text-blue-600" />}
                        </button>

                        <button
                            onClick={() => handleBackup('orders')}
                            disabled={loading !== null}
                            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Wrench size={20} className="text-slate-400 group-hover:text-blue-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-slate-700 group-hover:text-blue-700">Ordens de Serviço</p>
                                    <p className="text-xs text-slate-500">Exportar histórico de serviços</p>
                                </div>
                            </div>
                            {loading === 'orders' ? <Loader2 className="animate-spin text-blue-600" /> : <Download size={18} className="text-slate-400 group-hover:text-blue-600" />}
                        </button>

                        <button
                            onClick={() => handleBackup('inventory')}
                            disabled={loading !== null}
                            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Package size={20} className="text-slate-400 group-hover:text-blue-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-slate-700 group-hover:text-blue-700">Estoque</p>
                                    <p className="text-xs text-slate-500">Exportar todos os produtos</p>
                                </div>
                            </div>
                            {loading === 'inventory' ? <Loader2 className="animate-spin text-blue-600" /> : <Download size={18} className="text-slate-400 group-hover:text-blue-600" />}
                        </button>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={() => handleBackup('full')}
                                disabled={loading !== null}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                            >
                                {loading === 'full' ? <Loader2 className="animate-spin" size={18} /> : <Server size={18} />}
                                Fazer Backup Completo do Sistema
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white h-fit">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-amber-400" /> Importante
                    </h2>
                    <div className="space-y-4 text-slate-300 text-sm">
                        <p>
                            Mantenha seus backups em local seguro e externo ao sistema.
                        </p>
                        <p>
                            O backup é gerado no formato <strong>JSON</strong> (JavaScript Object Notation), que é um formato padrão universal para dados. Ele pode ser importado futuramente caso necessário.
                        </p>
                        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 mt-6">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Segurança</p>
                            <p>Seus dados estão seguros na nuvem da Supabase, mas é uma boa prática realizar backups semanais para garantir redundância.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
