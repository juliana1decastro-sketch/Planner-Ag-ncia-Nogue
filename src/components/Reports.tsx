import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { FinanceRecord, Project, Task, Client } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { TrendingUp, Briefcase, CheckCircle2, Users } from 'lucide-react';

export default function Reports() {
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const unsubFinance = onSnapshot(collection(db, 'finance'), (snap) => {
      setFinance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRecord)));
    });
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });

    return () => {
      unsubFinance();
      unsubProjects();
      unsubTasks();
      unsubClients();
    };
  }, []);

  // Prepare data for billing chart (last 6 months)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'yyyy-MM');
    const label = format(date, 'MMM', { locale: ptBR });
    
    const monthlyIncome = finance
      .filter(f => f.type === 'income' && f.date.startsWith(monthKey))
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    return { name: label, value: monthlyIncome, fullDate: date };
  }).reverse();

  // Prepare data for project status
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const archivedProjects = projects.filter(p => p.status === 'archived').length;
  const projectData = [
    { name: 'Ativos', value: activeProjects, color: '#FF6321' },
    { name: 'Arquivados', value: archivedProjects, color: '#2563EB' },
  ];

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-brand-orange/10 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
            </div>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Faturamento Total</span>
          </div>
          <p className="text-2xl font-black text-slate-800">
            R$ {finance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR')}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-brand-blue/10 p-2 rounded-lg">
              <Briefcase className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Projetos Ativos</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{activeProjects}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Taxa de Conclusão</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{taskCompletionRate}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total de Clientes</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{clients.length}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Billing Chart */}
        <section className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-orange" />
            Faturamento Mensal (Últimos 6 Meses)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {last6Months.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#FF6321' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Projects Distribution */}
        <section className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-blue" />
            Distribuição de Projetos
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pr-8">
              {projectData.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">{item.name}</p>
                    <p className="text-lg font-black text-slate-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
