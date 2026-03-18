import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Archive, 
  Trash2, 
  ExternalLink,
  Clock,
  User,
  Briefcase,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Project, Client, ServiceType, ProjectStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active');

  // Form state
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    clientId: '',
    serviceType: 'marketing',
    briefing: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    deadline: format(new Date(), 'yyyy-MM-dd'),
    responsible: '',
    status: 'active'
  });

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return () => {
      unsubProjects();
      unsubClients();
    };
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.clientId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewProject({
        name: '',
        clientId: '',
        serviceType: 'marketing',
        briefing: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        deadline: format(new Date(), 'yyyy-MM-dd'),
        responsible: '',
        status: 'active'
      });
    } catch (err: any) {
      console.error("Error adding project:", err);
      setError(err.message || "Erro ao salvar projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProjectStatus = async (id: string, status: ProjectStatus) => {
    try {
      await updateDoc(doc(db, 'projects', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? p.status !== 'deleted' : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const serviceLabels: Record<ServiceType, string> = {
    video: 'Produção Audiovisual',
    marketing: 'Marketing Digital',
    social_media: 'Social Media',
    advertising: 'Publicidade',
    branding: 'Branding',
    other: 'Outros'
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && deleteProject(deleteConfirm.id)}
        title="Excluir Projeto ⚡"
        message="Deseja realmente excluir este projeto permanentemente? Todos os dados vinculados serão afetados."
        confirmText="Excluir"
      />
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar projetos..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input-field w-auto"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
            <option value="all">Todos</option>
          </select>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateProjectStatus(project.id!, project.status === 'active' ? 'archived' : 'active')}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-blue transition-colors"
                      title={project.status === 'active' ? 'Arquivar' : 'Ativar'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, id: project.id! })}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{project.name}</h3>
                  <p className="text-sm text-brand-blue font-medium flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {clients.find(c => c.id === project.clientId)?.name || 'Cliente não encontrado'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Prazo: {format(parseISO(project.deadline), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    <span>Resp: {project.responsible}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{serviceLabels[project.serviceType]}</span>
                  </div>
                </div>

                {project.briefing && (
                  <p className="text-sm text-slate-500 line-clamp-3 bg-slate-50 p-3 rounded-xl italic">
                    "{project.briefing}"
                  </p>
                )}
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-bold border-2 border-white">AN</div>
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold border-2 border-white">
                    {project.responsible.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <button className="text-sm font-bold text-brand-orange flex items-center gap-1 hover:underline">
                  Ver Detalhes <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-blue text-white">
                <h3 className="text-xl font-bold">Novo Projeto 📂</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddProject} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error.includes('insufficient permissions') ? "Sem permissão para salvar." : error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Projeto</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={newProject.name}
                      onChange={e => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Ex: Campanha de Verão 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
                    <select 
                      required
                      className="input-field"
                      value={newProject.clientId}
                      onChange={e => setNewProject({...newProject, clientId: e.target.value})}
                    >
                      <option value="">Selecionar Cliente</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Serviço</label>
                    <select 
                      className="input-field"
                      value={newProject.serviceType}
                      onChange={e => setNewProject({...newProject, serviceType: e.target.value as ServiceType})}
                    >
                      {Object.entries(serviceLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data de Início</label>
                    <input 
                      type="date" 
                      className="input-field"
                      value={newProject.startDate}
                      onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Prazo de Entrega</label>
                    <input 
                      type="date" 
                      required
                      className="input-field"
                      value={newProject.deadline}
                      onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Responsável</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={newProject.responsible}
                      onChange={e => setNewProject({...newProject, responsible: e.target.value})}
                      placeholder="Quem vai liderar este projeto?"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Briefing / Descrição</label>
                    <textarea 
                      className="input-field min-h-[120px]"
                      value={newProject.briefing}
                      onChange={e => setNewProject({...newProject, briefing: e.target.value})}
                      placeholder="Detalhes, objetivos e requisitos do projeto..."
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full btn-secondary justify-center py-3 text-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Projeto ⚡'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
