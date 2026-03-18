import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Target, 
  Lightbulb, 
  FileText, 
  StickyNote, 
  Trash2, 
  CheckCircle2, 
  X,
  Calendar
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import type { AgencyManagement, AgencyManagementType } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

export default function AgencyManagement() {
  const [items, setItems] = useState<AgencyManagement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [activeTab, setActiveTab] = useState<AgencyManagementType>('goal');

  // Form state
  const [newItem, setNewItem] = useState<Partial<AgencyManagement>>({
    type: 'goal',
    content: '',
    targetDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending'
  });

  useEffect(() => {
    const unsubAgency = onSnapshot(query(collection(db, 'agency'), orderBy('createdAt', 'desc')), (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencyManagement)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'agency');
    });
    return () => unsubAgency();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.content || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'agency'), {
        ...newItem,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewItem({
        type: activeTab,
        content: '',
        targetDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'agency');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (item: AgencyManagement) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(doc(db, 'agency', item.id!), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `agency/${item.id}`);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'agency', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `agency/${id}`);
    }
  };

  const tabs: { id: AgencyManagementType; label: string; icon: any; emoji: string }[] = [
    { id: 'goal', label: 'Metas', icon: Target, emoji: '🎯' },
    { id: 'idea', label: 'Ideias', icon: Lightbulb, emoji: '💡' },
    { id: 'content_plan', label: 'Conteúdo', icon: FileText, emoji: '📝' },
    { id: 'note', label: 'Notas', icon: StickyNote, emoji: '📌' },
  ];

  const filteredItems = items.filter(i => i.type === activeTab);

  return (
    <div className="space-y-8">
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && deleteItem(deleteConfirm.id)}
        title="Excluir Item ⚡"
        message="Deseja realmente excluir este item estratégico? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-brand-orange shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800">
          {tabs.find(t => t.id === activeTab)?.emoji} {tabs.find(t => t.id === activeTab)?.label}
        </h3>
        <button 
          onClick={() => {
            setNewItem({...newItem, type: activeTab});
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Adicionar {tabs.find(t => t.id === activeTab)?.label}
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`
                glass-card rounded-2xl p-6 flex flex-col gap-4 relative group
                ${item.status === 'completed' ? 'opacity-60 bg-slate-50' : ''}
              `}
            >
              <div className="flex-1">
                <p className={`text-lg font-medium text-slate-800 ${item.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                  {item.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                  <Calendar className="w-3 h-3" />
                  {item.targetDate ? format(new Date(item.targetDate), 'dd/MM/yyyy') : 'Sem data'}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(item)}
                    className={`p-2 rounded-lg transition-colors ${item.status === 'completed' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm({ isOpen: true, id: item.id! })}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(tabs.find(t => t.id === activeTab)?.icon, { className: "w-8 h-8 text-slate-300" })}
              </div>
              <p className="text-slate-400 font-medium">Nenhum registro encontrado nesta categoria.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-orange text-white">
                <h3 className="text-xl font-bold">Adicionar {tabs.find(t => t.id === activeTab)?.label} ⚡</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Conteúdo / Descrição</label>
                  <textarea 
                    required
                    className="input-field min-h-[150px]"
                    value={newItem.content}
                    onChange={e => setNewItem({...newItem, content: e.target.value})}
                    placeholder={`Escreva sua ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} aqui...`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Data Alvo (Opcional)</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={newItem.targetDate}
                    onChange={e => setNewItem({...newItem, targetDate: e.target.value})}
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full btn-primary justify-center py-3 text-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Registro ⚡'}
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
