import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  MoreVertical,
  Trash2,
  Clock,
  Tag,
  AlertCircle,
  Search,
  X,
  Filter,
  Calendar as CalendarIcon
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocFromServer } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Task, Client, Project } from '../types';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  addWeeks, 
  subWeeks 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

export default function Planner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  
  // Form state
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: ''
  });

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    }
    testConnection();

    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'asc')), (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
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
      unsubTasks();
      unsubClients();
      unsubProjects();
    };
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: ''
      });
    } catch (err: any) {
      console.error("Error adding task:", err);
      setError(err.message || "Erro ao salvar tarefa. Verifique sua conexão e permissões.");
      // Don't throw here so we can show the error in the UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(doc(db, 'tasks', task.id!), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && deleteTask(deleteConfirm.id)}
        title="Excluir Tarefa ⚡"
        message="Deseja realmente excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button 
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-2 hover:bg-slate-50 border-r border-slate-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 font-semibold text-sm">
              {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(addDays(weekStart, 6), 'dd MMM', { locale: ptBR })}
            </div>
            <button 
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-2 hover:bg-slate-50 border-l border-slate-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Hoje
          </button>
        </div>
        <button 
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* Planner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter(t => t.date && isSameDay(parseISO(t.date), day));
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="min-w-[200px] flex flex-col gap-4">
              <div className={`
                p-3 rounded-xl text-center border-b-4 
                ${isToday ? 'bg-brand-orange/10 border-brand-orange' : 'bg-white border-slate-100'}
              `}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={`text-xl font-black ${isToday ? 'text-brand-orange' : 'text-slate-800'}`}>
                  {format(day, 'dd')}
                </p>
              </div>

              <div className="flex-1 space-y-3">
                {dayTasks.map((task) => (
                  <motion.div
                    layout
                    key={task.id}
                    className={`
                      p-3 rounded-xl border border-slate-200 shadow-sm group relative
                      ${task.status === 'completed' ? 'bg-slate-50 opacity-60' : 'bg-white'}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className="mt-1 flex-shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-brand-orange transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm leading-tight ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        {task.time && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {task.time}
                          </div>
                        )}
                        {task.projectId && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-brand-blue font-medium">
                            <Tag className="w-3 h-3" />
                            {projects.find(p => p.id === task.projectId)?.name}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, id: task.id! })}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className={`
                      mt-2 h-1 w-full rounded-full 
                      ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}
                    `} />
                  </motion.div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-medium">Livre</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
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
                <h3 className="text-xl font-bold">Nova Tarefa ⚡</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddTask} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error.includes('insufficient permissions') 
                      ? "Sem permissão para salvar. Você é o administrador?" 
                      : error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                  <input 
                    type="text" 
                    required
                    className="input-field"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    placeholder="O que precisa ser feito?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea 
                    className="input-field min-h-[100px]"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Detalhes da tarefa..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                    <input 
                      type="date" 
                      required
                      className="input-field"
                      value={newTask.date}
                      onChange={e => setNewTask({...newTask, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Horário</label>
                    <input 
                      type="time" 
                      className="input-field"
                      value={newTask.time}
                      onChange={e => setNewTask({...newTask, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Prioridade</label>
                    <select 
                      className="input-field"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Projeto</label>
                    <select 
                      className="input-field"
                      value={newTask.projectId}
                      onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                    >
                      <option value="">Nenhum</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full btn-primary justify-center py-3 text-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Tarefa ⚡'}
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
