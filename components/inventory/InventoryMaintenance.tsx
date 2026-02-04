import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { read, utils } from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Brand } from '../../types';

interface InventoryMaintenanceProps {
    onUpdate: () => void;
}

const InventoryMaintenance: React.FC<InventoryMaintenanceProps> = ({ onUpdate }) => {
    const { brands, bulkAddParts } = useApp();
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [importType, setImportType] = useState<'general' | 'csv_text'>('general');
    const [isDragOver, setIsDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [csvText, setCsvText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('InventoryMaintenance mounted');
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const cleanCurrency = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const cleanStr = value.replace(/[R$\s]/g, '').replace('.', '').replace(',', '.').trim();
            const num = parseFloat(cleanStr);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    };

    const processFile = async (file: File) => {
        if (!selectedBrandId && importType === 'general') {
            alert('Por favor, selecione uma marca antes de importar.');
            return;
        }

        setProcessing(true);
        setLogs(prev => [`Lendo arquivo: ${file.name}...`, ...prev]);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = utils.sheet_to_json(sheet);

                const brand = brands.find(b => b.id === selectedBrandId);
                setLogs(prev => [`Arquivo lido. Processando ${jsonData.length} itens para a marca ${brand?.name}...`, ...prev]);

                const partsToInsert: any[] = [];

                for (const row of jsonData as any[]) {
                    const code = row['Código']?.toString() || row['SKU']?.toString();
                    if (!code) continue;

                    partsToInsert.push({
                        code,
                        name: row['Nome'] || row['Nome da Peça'] || 'Peça sem nome',
                        price: cleanCurrency(row['Preço'] || row['Valor'] || row['Price'] || 0),
                        quantity: parseInt(row['Qtd'] || row['Quantidade'] || row['Contagem'] || '0'),
                        location: row['Local'] || row['Localização'] || row['Prateleira'] || '',
                        unitsPerPackage: parseInt(row['Unid. no pacote'] || row['Units'] || '1'),
                        brandId: selectedBrandId,
                        manufacturer: brand?.name,
                        category: row['Categoria'] || 'Geral',
                        minStock: 5
                    });
                }

                if (partsToInsert.length > 0) {
                    await bulkAddParts(partsToInsert);
                    setLogs(prev => [`Sucesso! ${partsToInsert.length} peças importadas.`, ...prev]);
                    onUpdate();
                } else {
                    setLogs(prev => [`Nenhuma peça válida encontrada no arquivo. Verifique se as colunas 'Código' e 'Nome' existem.`, ...prev]);
                }

            } catch (error: any) {
                console.error('Erro ao processar arquivo:', error);
                setLogs(prev => [`Erro fatal: ${error.message || 'Erro desconhecido'}`, ...prev]);
            } finally {
                setProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkTextInsert = async () => {
        if (!csvText.trim()) return;
        if (!selectedBrandId) {
            alert('Selecione uma marca primeiro.');
            return;
        }

        setProcessing(true);
        try {
            const brand = brands.find(b => b.id === selectedBrandId);
            const lines = csvText.split('\n');
            const partsToInsert: any[] = [];

            for (const line of lines) {
                if (!line.trim()) continue;
                // Formato esperado: Codigo;Nome;Preco;Quantidade;Local
                const [code, name, price, qty, loc] = line.split(';').map(s => s.trim());

                if (code && name) {
                    partsToInsert.push({
                        code,
                        name,
                        price: cleanCurrency(price || 0),
                        quantity: parseInt(qty || '0'),
                        location: loc || '',
                        brandId: selectedBrandId,
                        manufacturer: brand?.name,
                        category: 'Geral',
                        minStock: 5
                    });
                }
            }

            if (partsToInsert.length > 0) {
                await bulkAddParts(partsToInsert);
                setLogs(prev => [`Inserção manual concluída: ${partsToInsert.length} itens.`, ...prev]);
                setCsvText('');
                onUpdate();
            }
        } catch (error: any) {
            setLogs(prev => [`Erro na inserção manual: ${error.message}`, ...prev]);
        } finally {
            setProcessing(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle className="text-blue-500" size={20} />
                    Configuração da Importação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Selecione a Marca</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={selectedBrandId}
                            onChange={(e) => setSelectedBrandId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {brands.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Método de Entrada</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setImportType('general')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${importType === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Planilha (Excel/CSV)
                            </button>
                            <button
                                onClick={() => setImportType('csv_text')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${importType === 'csv_text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Texto (Massa)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {importType === 'general' ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className={`p-4 rounded-full ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <FileSpreadsheet size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-700">
                                Importar Planilha de Peças
                            </h3>
                            <p className="text-slate-500 text-sm">Arraste seu arquivo CSV ou Excel aqui</p>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Colunas recomendadas: Código, Nome, Preço, Qtd, Local</p>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv, .xlsx, .xls"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    processFile(e.target.files[0]);
                                }
                            }}
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={processing}
                            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                            {processing ? 'Processando...' : 'Selecionar Arquivo'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">Inserção em Massa (Texto)</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Cole os dados formatados como: <b>Código; Nome; Preço; Qtd; Local</b> (um por linha)
                        </p>
                        <textarea
                            className="w-full h-48 p-4 border rounded-lg font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="APT-LS600; Aputure LS 600d; 8500; 5; Prateleira A1"
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleBulkTextInsert}
                        disabled={processing || !csvText.trim()}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
                    >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        {processing ? 'Processando...' : 'Processar Inserção em Massa'}
                    </button>
                </div>
            )}

            {logs.length > 0 && (
                <div className="bg-slate-900 rounded-xl p-4 text-sm font-mono text-slate-300 max-h-60 overflow-y-auto">
                    <h4 className="flex items-center gap-2 text-white font-bold mb-2 border-b border-slate-700 pb-2">
                        <CheckCircle size={16} className="text-green-500" />
                        Log de Processamento
                    </h4>
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="border-l-2 border-slate-700 pl-2">
                                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryMaintenance;
