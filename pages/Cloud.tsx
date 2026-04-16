import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  File, FileText, Image, FileArchive, Search, Plus, 
  Trash2, Download, Upload, MoreVertical, FolderOpen, 
  ChevronRight, HardDrive, Share2, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CloudFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

const Cloud = () => {
    const { user } = useApp();
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage.from('aputure-cloud').list();
            if (error) {
                console.error('Error fetching files:', error);
                // If bucket doesn't exist, it might fail. Usually first time user needs to create it.
            } else {
                setFiles(data as any || []);
            }
        } catch (err) {
            console.error('Unexpected error fetching files:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${file.name}`;
            
            const { error } = await supabase.storage
                .from('aputure-cloud')
                .upload(fileName, file);

            if (error) throw error;
            
            await fetchFiles();
            alert('Arquivo enviado com sucesso!');
        } catch (err: any) {
            console.error('Error uploading file:', err);
            alert('Erro ao enviar arquivo: ' + err.message + '\n\nCertifique-se de que o bucket "aputure-cloud" foi criado e é público/acessível no Supabase.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm('Excluir este arquivo definitivamente?')) return;

        try {
            const { error } = await supabase.storage.from('aputure-cloud').remove([fileName]);
            if (error) throw error;
            await fetchFiles();
        } catch (err: any) {
            console.error('Error deleting file:', err);
            alert('Erro ao excluir arquivo: ' + err.message);
        }
    };

    const handleDownload = async (fileName: string) => {
        try {
            const { data, error } = await supabase.storage.from('aputure-cloud').download(fileName);
            if (error) throw error;
            
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error downloading file:', err);
            alert('Erro ao baixar arquivo: ' + err.message);
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype?.includes('image/')) return <Image className="text-blue-500" />;
        if (mimetype?.includes('pdf')) return <FileText className="text-red-500" />;
        if (mimetype?.includes('zip') || mimetype?.includes('rar')) return <FileArchive className="text-purple-500" />;
        return <File className="text-slate-400" />;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <HardDrive className="text-emerald-600" />
                        Nuvem Aputure (Cloud)
                    </h1>
                    <p className="text-sm text-slate-500">Repositório compartilhado para manuais, firmwares e documentos técnicos.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUpload} 
                        className="hidden" 
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm flex-1 sm:flex-initial"
                    >
                        <Upload size={18} />
                        {uploading ? 'Enviando...' : 'Carregar Arquivo'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar arquivos por nome..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs text-slate-500 px-2 justify-center md:justify-end">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Imagens</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> PDFs</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Outros</div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <div className="animate-spin mb-4"><FolderOpen size={48} /></div>
                    <p>Sincronizando com a nuvem...</p>
                </div>
            ) : filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFiles.map(file => (
                        <div key={file.id || file.name} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                    {getFileIcon(file.metadata?.mimetype)}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDownload(file.name)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Download"><Download size={16} /></button>
                                    {user?.is_master && (
                                        <button onClick={() => handleDelete(file.name)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Excluir"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </div>
                            <h3 className="font-medium text-slate-800 text-sm truncate mb-1" title={file.name}>{file.name}</h3>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                <span>{formatSize(file.metadata?.size)}</span>
                                <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center">
                    <HardDrive size={48} className="mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-slate-600">Sua nuvem está vazia</h3>
                    <p className="max-w-xs mx-auto mt-2">Comece a carregar manuais, esquemas e documentos importantes para compartilhar com a equipe.</p>
                </div>
            )}

            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                    <Share2 size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-emerald-900">Compartilhamento de Inteligência</h3>
                    <p className="text-emerald-700 text-sm">Esta nuvem é sincronizada em tempo real com toda a equipe da MCI. Arquivos carregados aqui ficam disponíveis instantaneamente para todos os técnicos.</p>
                </div>
            </div>
        </div>
    );
};

export default Cloud;
