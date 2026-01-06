import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';
import { read, utils } from 'xlsx';
import { supabase } from '../../lib/supabase';

interface InventoryMaintenanceProps {
    onUpdate: () => void;
}

const InventoryMaintenance: React.FC<InventoryMaintenanceProps> = ({ onUpdate }) => {
    const [importType, setImportType] = useState<'general' | 'astera' | 'cream_source'>('general');
    const [isDragOver, setIsDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
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
        setProcessing(true);
        setLogs(prev => [`Lendo arquivo (${importType}): ${file.name}...`, ...prev]);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = utils.sheet_to_json(sheet);

                setLogs(prev => [`Arquivo lido com sucesso. Processando ${jsonData.length} linhas...`, ...prev]);

                if (jsonData.length > 0) {
                    const firstRowKeys = Object.keys(jsonData[0] as object).join(', ');
                    console.log('Headers detected:', firstRowKeys);
                    setLogs(prev => [`Colunas detectadas: ${firstRowKeys}`, ...prev]);
                }

                let successCount = 0;
                let errorCount = 0;

                for (const row of jsonData as any[]) {
                    try {
                        let result;

                        if (importType === 'astera') {
                            const code = row['Código']?.toString();
                            if (!code) continue;

                            const quantityKey = Object.keys(row).find(k => k.toLowerCase().startsWith('contagem'));

                            const part: any = {
                                code,
                                name: row['Nome da Peça'] || 'Nome desconhecido',
                                price: cleanCurrency(row['Valor unitário'] || 0),
                                quantity: parseInt(row[quantityKey || 'Contagem'] || '0'),
                                location: row['Prateleira'] || '',
                                units_per_package: parseInt(row['Unid. no pacote'] || '1'),
                                category: 'Astera'
                            };

                            // Try to insert with manufacturer (unified table)
                            result = await supabase.from('parts').upsert({ ...part, manufacturer: 'Astera' }, { onConflict: 'code,manufacturer' });

                            // Fallback if column doesn't exist
                            if (result.error && (
                                result.error.message.includes('column "manufacturer" does not exist') ||
                                result.error.message.includes('column "units_per_package" does not exist') ||
                                result.error.message.includes("Could not find the 'manufacturer' column")
                            )) {
                                result = await supabase.from('parts').upsert(part, { onConflict: 'code' });
                            }
                        } else if (importType === 'cream_source') {
                            const code = row['Código']?.toString();
                            if (!code) continue;

                            const part: any = {
                                code,
                                name: row['Nome da Peça'] || 'Nome desconhecido',
                                price: cleanCurrency(row['Price'] || row['Valor'] || 0),
                                quantity: parseInt(row['Quantidade'] || row['Contagem'] || '0'),
                                location: row['Prateleira'] || '',
                                category: 'Cream Source'
                            };

                            result = await supabase.from('parts').upsert({ ...part, manufacturer: 'Cream Source' }, { onConflict: 'code,manufacturer' });

                            if (result.error && (
                                result.error.message.includes('column "manufacturer" does not exist') ||
                                result.error.message.includes("Could not find the 'manufacturer' column")
                            )) {
                                result = await supabase.from('parts').upsert(part, { onConflict: 'code' });
                            }
                        } else {
                            const code = row['Código']?.toString();
                            if (!code) continue;

                            const part: any = {
                                code,
                                name: row['Nome da Peça'] || 'Nome desconhecido',
                                price: cleanCurrency(row['Price'] || row['Preço'] || 0),
                                quantity: parseInt(row['Contagem'] || row['Quantidade'] || '0'),
                                location: row['Prateleira'] || row['Local'] || '',
                                category: 'Geral',
                                min_stock: 5
                            };

                            result = await supabase.from('parts').upsert({ ...part, manufacturer: 'Aputure' }, { onConflict: 'code,manufacturer' });

                            if (result.error && (
                                result.error.message.includes('column "manufacturer" does not exist') ||
                                result.error.message.includes("Could not find the 'manufacturer' column")
                            )) {
                                result = await supabase.from('parts').upsert(part, { onConflict: 'code' });
                            }
                        }

                        if (result.error) {
                            console.error('Erro ao salvar:', row['Código'], result.error);
                            errorCount++;
                        } else {
                            successCount++;
                        }
                    } catch (err) {
                        console.error('Erro na linha:', row, err);
                        errorCount++;
                    }
                }

                setLogs(prev => [`Concluído! ${successCount} salvos, ${errorCount} erros.`, ...prev]);
                if (successCount > 0) {
                    onUpdate();
                }

            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                setLogs(prev => [`Erro fatal ao processar: ${error}`, ...prev]);
            } finally {
                setProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={() => setImportType('general')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${importType === 'general' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}
                >
                    Importação Geral
                </button>
                <button
                    onClick={() => setImportType('astera')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${importType === 'astera' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}
                >
                    Importação Astera
                </button>
                <button
                    onClick={() => setImportType('cream_source')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${importType === 'cream_source' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}
                >
                    Importação Cream Source
                </button>
            </div>

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
                            {importType === 'astera' ? 'Importar Planilha Astera' :
                                importType === 'cream_source' ? 'Importar Planilha Cream Source' :
                                    'Importar Estoque Geral'}
                        </h3>
                        <p className="text-slate-500 text-sm">Arraste seu arquivo CSV ou Excel aqui</p>
                        {importType === 'astera' || importType === 'cream_source' ? (
                            <p className="text-xs text-blue-500 mt-2 font-medium">Colunas: Código, Nome, Valor, Quantidade</p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">Colunas: Código, Nome, Preço, Qtd</p>
                        )}
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
