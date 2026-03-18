import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Globe, 
  Trash2, 
  Edit2, 
  Briefcase,
  X,
  MessageSquare
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Client, Project } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form state
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    socialMedia: '',
    notes: ''
  });

  useEffect(() => {
    const unsubClients = onSnapshot(query(collection(db, 'clients'), orderBy('name', 'asc')), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => {
      unsubClients();
      unsubProjects();
    };
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (selectedClient) {
        await updateDoc(doc(db, 'clients', selectedClient.id!), {
          ...newClient
        });
      } else {
        await addDoc(collection(db, 'clients'), {
          ...newClient,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, selectedClient ? OperationType.UPDATE : OperationType.CREATE, `clients/${selectedClient?.id || ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setNewClient(client);
    } else {
      setSelectedClient(null);
      setNewClient({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        socialMedia: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && deleteClient(deleteConfirm.id)}
        title="Excluir Cliente ⚡"
        message="Deseja realmente excluir este cliente? Todos os dados e projetos vinculados serão perdidos."
        confirmText="Excluir"
      />
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar clientes por nome ou responsável..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClients.map((client) => {
          const clientProjects = projects.filter(p => p.clientId === client.id);
          return (
            <motion.div
              layout
              key={client.id}
              className="glass-card rounded-2xl p-6 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-all border-l-4 border-brand-orange"
            >
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{client.name}</h3>
                    <p className="text-slate-500 font-medium">{client.contactPerson || 'Sem responsável'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openModal(client)}
                      className="p-2 hover:bg-blue-50 text-slate-400 hover:text-brand-blue rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, id: client.id! })}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-brand-orange" />
                    <span>{client.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-brand-orange" />
                    <span>{client.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="w-4 h-4 text-brand-orange" />
                    <span>{client.socialMedia || 'N/A'}</span>
                  </div>
                </div>

                {client.notes && (
                  <div className="flex gap-2 p-3 bg-slate-50 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <p className="text-sm text-slate-500 italic">{client.notes}</p>
                  </div>
                )}
              </div>

              <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Briefcase className="w-3 h-3" />
                  Projetos ({clientProjects.length})
                </h4>
                <div className="space-y-2">
                  {clientProjects.slice(0, 3).map(p => (
                    <div key={p.id} className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 truncate">
                      {p.name}
                    </div>
                  ))}
                  {clientProjects.length > 3 && (
                    <p className="text-xs text-brand-blue font-bold">+ {clientProjects.length - 3} outros</p>
                  )}
                  {clientProjects.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Nenhum projeto registrado.</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-orange text-white">
                <h3 className="text-xl font-bold">{selectedClient ? 'Editar Cliente 👥' : 'Novo Cliente 👥'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddClient} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Empresa / Cliente</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={newClient.name}
                      onChange={e => setNewClient({...newClient, name: e.target.value})}
                      placeholder="Ex: Nogueira Produções"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Responsável</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={newClient.contactPerson}
                      onChange={e => setNewClient({...newClient, contactPerson: e.target.value})}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      className="input-field"
                      value={newClient.email}
                      onChange={e => setNewClient({...newClient, email: e.target.value})}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Redes Sociais / Site</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={newClient.socialMedia}
                      onChange={e => setNewClient({...newClient, socialMedia: e.target.value})}
                      placeholder="@empresa ou www.site.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Observações</label>
                    <textarea 
                      className="input-field min-h-[100px]"
                      value={newClient.notes}
                      onChange={e => setNewClient({...newClient, notes: e.target.value})}
                      placeholder="Histórico, preferências ou detalhes importantes..."
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full btn-primary justify-center py-3 text-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Salvando...' : (selectedClient ? 'Atualizar Cliente ⚡' : 'Cadastrar Cliente ⚡')}
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
