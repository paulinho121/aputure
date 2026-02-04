import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OrderStatus, ServiceOrder } from '../types';
import { CheckCircle2, Clock, Wrench, Package, Truck, MessageCircle, AlertCircle } from 'lucide-react';

const Tracking = () => {
    const { osId } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (!osId || !token) {
                    setError('Link de rastreio inválido ou incompleto.');
                    setLoading(false);
                    return;
                }

                const { data, error: fetchError } = await supabase
                    .from('service_orders')
                    .select('*')
                    .eq('id', osId)
                    .eq('tracking_token', token)
                    .maybeSingle();

                if (fetchError) throw fetchError;

                // Fetch Settings
                const { data: settingsData } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('id', 'global')
                    .maybeSingle();

                if (settingsData) {
                    setSettings({
                        techPhone: settingsData.tech_phone,
                        techEmail: settingsData.tech_email,
                        techName: settingsData.tech_name
                    });
                }

                if (!data) {
                    setError('Ordem de Serviço não encontrada ou token inválido.');
                } else {
                    // Map database row to ServiceOrder type
                    const mappedOrder: ServiceOrder = {
                        id: data.id,
                        clientId: data.client_id,
                        model: data.model,
                        serialNumber: data.serial_number,
                        condition: data.condition,
                        faultDescription: data.fault_description,
                        accessories: data.accessories || [],
                        entryDate: data.entry_date,
                        status: data.status as OrderStatus,
                        serviceType: data.service_type,
                        items: data.items || [],
                        laborCost: data.labor_cost || 0,
                        photos: data.photos || [],
                        technicalReport: data.technical_report,
                        trackingToken: data.tracking_token
                    };
                    setOrder(mappedOrder);
                }
            } catch (err: any) {
                console.error('Error fetching tracking data:', err);
                setError('Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [osId, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 font-medium">Buscando sua manutenção...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    const steps = [
        { status: OrderStatus.PENDING, label: 'Recebido', icon: Clock, desc: 'Equipamento deu entrada na assistência.' },
        { status: OrderStatus.DIAGNOSING, label: 'Em Análise', icon: Search, desc: 'Técnico está verificando o defeito.' },
        { status: OrderStatus.WAITING_APPROVAL, label: 'Orçamento', icon: AlertCircle, desc: 'Aguardando sua aprovação.' },
        { status: OrderStatus.IN_REPAIR, label: 'Manutenção', icon: Wrench, desc: 'Serviço sendo executado.' },
        { status: OrderStatus.COMPLETED, label: 'Pronto', icon: CheckCircle2, desc: 'Equipamento pronto para retirada.' },
        { status: OrderStatus.DELIVERED, label: 'Entregue', icon: Truck, desc: 'Manutenção finalizada com sucesso.' },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b px-6 py-8 text-center shadow-sm">
                <img src="/mci-logo.png" alt="MCI" className="h-12 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-800">Acompanhamento</h1>
                <p className="text-slate-500 font-mono text-sm leading-none mt-1">OS: {order.id}</p>
            </div>

            <div className="max-w-md mx-auto p-6 space-y-6">
                {/* Unit Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipamento</p>
                            <h2 className="text-lg font-bold text-slate-800">{order.model}</h2>
                            <p className="text-sm text-slate-500 font-mono">NS: {order.serialNumber}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${order.serviceType === 'Warranty' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {order.serviceType === 'Warranty' ? 'Garantia' : 'Orçamento'}
                        </span>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Entrada</p>
                        <p className="text-slate-700 font-medium">{new Date(order.entryDate).toLocaleDateString()} às {new Date(order.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        Status do Reparo
                    </h3>

                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const isPast = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const isFuture = index > currentStepIndex;
                            const Icon = step.icon;

                            return (
                                <div key={step.status} className="flex gap-4 relative">
                                    {/* Line connecting steps */}
                                    {index < steps.length - 1 && (
                                        <div className={`absolute left-[11px] top-6 w-[2px] h-full ${isPast ? 'bg-emerald-500' : 'bg-slate-100'
                                            }`}></div>
                                    )}

                                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${isPast ? 'bg-emerald-500 border-emerald-500 text-white' :
                                        isCurrent ? 'bg-white border-emerald-500 text-emerald-500' :
                                            'bg-white border-slate-200 text-slate-300'
                                        }`}>
                                        {isPast ? <CheckCircle2 size={14} /> : <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
                                    </div>

                                    <div className={`flex-1 pb-4 ${isFuture ? 'opacity-40' : ''}`}>
                                        <h4 className={`text-sm font-bold leading-tight ${isCurrent ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {step.label}
                                        </h4>
                                        {isCurrent && (
                                            <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Technical Report if finished or diagnosing */}
                {order.technicalReport && (
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                            Laudo do Técnico
                        </h3>
                        <p className="text-emerald-900 text-sm leading-relaxed whitespace-pre-wrap">
                            {order.technicalReport}
                        </p>
                    </div>
                )}

                {/* WhatsApp Help */}
                <a
                    href={`https://wa.me/${settings?.techPhone || '5511999999999'}?text=Olá, gostaria de falar sobre minha OS: ${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-emerald-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                    <MessageCircle size={24} />
                    Falar com o Técnico
                </a>
            </div>

            <footer className="text-center p-8 text-slate-400 text-xs">
                MCI Assistência Técnica Oficial <br />
                Todos os direitos reservados
            </footer>
        </div>
    );
};

// Simple Search Icon replacement since I forgot to import it
const Search = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export default Tracking;
