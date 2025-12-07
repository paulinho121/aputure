import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Client } from '../types';

interface ClientSearchProps {
    clients: Client[];
    onSelect: (clientId: string) => void;
    selectedClientId?: string;
}

const ClientSearch: React.FC<ClientSearchProps> = ({ clients, onSelect, selectedClientId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    useEffect(() => {
        if (selectedClient) {
            setSearchTerm(`${selectedClient.name} - ${selectedClient.document}`);
        } else {
            setSearchTerm('');
        }
    }, [selectedClient]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search term to selected client if clicked outside without selecting
                if (selectedClient) {
                    setSearchTerm(`${selectedClient.name} - ${selectedClient.document}`);
                } else {
                    setSearchTerm('');
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedClient]);

    const filteredClients = clients.filter(client => {
        const searchLower = searchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(searchLower) ||
            client.document.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''))
        );
    });

    const handleSelect = (client: Client) => {
        onSelect(client.id);
        setSearchTerm(`${client.name} - ${client.document}`);
        setIsOpen(false);
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect('');
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar por Nome, CPF ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        if (e.target.value === '') {
                            onSelect('');
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {selectedClientId && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && searchTerm && !selectedClientId && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                        <ul className="py-1">
                            {filteredClients.map(client => (
                                <li
                                    key={client.id}
                                    onClick={() => handleSelect(client)}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                                >
                                    <div>
                                        <div className="font-medium text-slate-800">{client.name}</div>
                                        <div className="text-xs text-slate-500">{client.document}</div>
                                    </div>
                                    {client.id === selectedClientId && <Check size={16} className="text-blue-500" />}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            Nenhum cliente encontrado
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientSearch;
