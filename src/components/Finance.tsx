import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Tag, 
  Trash2, 
  CheckCircle2, 
  Clock,
  X,
  Filter
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { FinanceRecord, Client, FinanceType, FinanceStatus } from '../types';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

export default function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form state
  const [newRecord, setNewRecord] = useState<Partial<FinanceRecord>>({
    type: 'income',
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
    clientId: '',
    category: ''
  });

  useEffect(() => {
    const unsubFinance = onSnapshot(query(collection(db, 'finance'), orderBy('date', 'desc')), (snap) => {
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRecord)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finance');
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return () => {
      unsubFinance();
      unsubClients();
    };
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.description || !newRecord.amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'finance'), {
        ...newRecord,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewRecord({
        type: 'income',
        description: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending',
        clientId: '',
        category: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'finance', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `finance/${id}`);
    }
  };

  const monthStr = format(currentMonth, 'yyyy-MM');
  const filteredRecords = records.filter(r => r.date.startsWith(monthStr));

  const totalIncome = filteredRecords.filter(r => r.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = filteredRecords.filter(r => r.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const profit = totalIncome - totalExpenses;

  return (
    <div className="space-y-8">
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && deleteRecord(deleteConfirm.id)}
        title="Excluir Registro ⚡"
        message="Deseja realmente excluir este registro financeiro? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-2xl border-l-4 border-emerald-500">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Receitas do Mês</p>
              <p className="text-2xl font-bold text-emerald-700">R$ {totalIncome.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl border-l-4 border-red-500">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Despesas do Mês</p>
              <p className="text-2xl font-bold text-red-700">R$ {totalExpenses.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-brand-orange p-6 rounded-2xl text-white shadow-xl shadow-brand-orange/20">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-100 font-medium">Lucro Estimado</p>
              <p className="text-2xl font-black">R$ {profit.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <input 
            type="month" 
            className="input-field w-auto"
            value={monthStr}
            onChange={e => setCurrentMonth(new Date(e.target.value + '-01'))}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </div>

      {/* Records Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Data</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Categoria/Cliente</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(parseISO(record.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {record.type === 'income' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-semibold text-slate-800">{record.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {record.type === 'income' 
                      ? clients.find(c => c.id === record.clientId)?.name || 'Cliente Geral'
                      : record.category || 'Geral'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {record.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    record.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {record.type === 'income' ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, id: record.id! })}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum lançamento encontrado para este mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                <h3 className="text-xl font-bold">Novo Lançamento 💰</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddRecord} className="p-6 space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewRecord({...newRecord, type: 'income'})}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newRecord.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRecord({...newRecord, type: 'expense'})}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newRecord.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Despesa
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <input 
                    type="text" 
                    required
                    className="input-field"
                    value={newRecord.description}
                    onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                    placeholder="Ex: Pagamento Projeto X"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      className="input-field"
                      value={newRecord.amount}
                      onChange={e => setNewRecord({...newRecord, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                    <input 
                      type="date" 
                      required
                      className="input-field"
                      value={newRecord.date}
                      onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                    <select 
                      className="input-field"
                      value={newRecord.status}
                      onChange={e => setNewRecord({...newRecord, status: e.target.value as FinanceStatus})}
                    >
                      <option value="pending">Pendente</option>
                      <option value="paid">Pago</option>
                    </select>
                  </div>
                  <div>
                    {newRecord.type === 'income' ? (
                      <>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
                        <select 
                          className="input-field"
                          value={newRecord.clientId}
                          onChange={e => setNewRecord({...newRecord, clientId: e.target.value})}
                        >
                          <option value="">Nenhum</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                        <input 
                          type="text" 
                          className="input-field"
                          value={newRecord.category}
                          onChange={e => setNewRecord({...newRecord, category: e.target.value})}
                          placeholder="Ex: Aluguel, Software..."
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full btn-primary justify-center py-3 text-lg bg-emerald-600 hover:bg-emerald-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar Lançamento ⚡'}
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
