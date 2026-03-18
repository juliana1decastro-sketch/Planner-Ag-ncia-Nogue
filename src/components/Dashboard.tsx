import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Briefcase,
  Calendar as CalendarIcon
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { Task, Project, Client, FinanceRecord } from '../types';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface DashboardProps {
  setCurrentView: (view: any) => void;
}

export default function Dashboard({ setCurrentView }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects'), where('status', '==', 'active')), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });
    const unsubFinance = onSnapshot(collection(db, 'finance'), (snap) => {
      setFinance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRecord)));
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubClients();
      unsubFinance();
    };
  }, []);

  const todayTasks = tasks.filter(t => t.date && isToday(parseISO(t.date)));
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const priorityTasks = pendingTasks.filter(t => t.priority === 'high').slice(0, 5);
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyFinance = finance.filter(f => f.date.startsWith(currentMonth));
  const income = monthlyFinance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = monthlyFinance.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const stats = [
    { label: 'Tarefas Pendentes', value: pendingTasks.length, icon: CheckCircle2, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Projetos Ativos', value: projects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Clientes Ativos', value: clients.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Lucro do Mês', value: `R$ ${(income - expenses).toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tasks & Priorities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Tasks */}
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-orange" />
                Tarefas de Hoje ⚡
              </h3>
              <button 
                onClick={() => setCurrentView('planner')}
                className="text-sm text-brand-blue font-medium hover:underline"
              >
                Ver Planner
              </button>
            </div>
            <div className="p-6">
              {todayTasks.length > 0 ? (
                <div className="space-y-4">
                  {todayTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.time || 'Sem horário'}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.status === 'completed' ? 'Concluído' : 
                         task.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4">Nenhuma tarefa para hoje.</p>
              )}
            </div>
          </section>

          {/* Priority Tasks */}
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Prioridades Críticas ⚡
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {priorityTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-900">{task.title}</p>
                        <p className="text-xs text-red-700">Prazo: {task.date ? format(parseISO(task.date), 'dd/MM/yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentView('planner')}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Resolver
                    </button>
                  </div>
                ))}
                {priorityTasks.length === 0 && (
                  <p className="text-center text-slate-500 py-4">Nenhuma prioridade alta pendente. Bom trabalho!</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Projects & Deadlines */}
        <div className="space-y-8">
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-blue" />
                Próximas Entregas 📂
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {projects.slice(0, 5).map(project => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{project.name}</span>
                      <span className="text-slate-500">{format(parseISO(project.deadline), 'dd/MM')}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-blue h-full rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-center text-slate-500 py-4">Nenhum projeto ativo.</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-brand-orange rounded-2xl p-6 text-white shadow-xl shadow-brand-orange/20">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h3 className="text-lg font-bold">Resumo Financeiro 💰</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-orange-100 text-sm">Receitas</span>
                <span className="text-xl font-bold">R$ {income.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-orange-100 text-sm">Despesas</span>
                <span className="text-xl font-bold">R$ {expenses.toLocaleString('pt-BR')}</span>
              </div>
              <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                <span className="font-medium">Saldo</span>
                <span className="text-2xl font-black">R$ {(income - expenses).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
