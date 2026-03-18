import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  FolderKanban, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

// Components (to be created)
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Finance from './components/Finance';
import AgencyManagement from './components/AgencyManagement';
import Reports from './components/Reports';

type View = 'dashboard' | 'planner' | 'projects' | 'clients' | 'finance' | 'management' | 'reports';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '⚡' },
    { id: 'planner', label: 'Planner Semanal', icon: Calendar, emoji: '📅' },
    { id: 'projects', label: 'Projetos', icon: FolderKanban, emoji: '📂' },
    { id: 'clients', label: 'Clientes', icon: Users, emoji: '👥' },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, emoji: '💰' },
    { id: 'management', label: 'Gestão da Agência', icon: Target, emoji: '🎯' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, emoji: '📊' },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
      case 'planner': return <Planner />;
      case 'projects': return <Projects />;
      case 'clients': return <Clients />;
      case 'finance': return <Finance />;
      case 'management': return <AgencyManagement />;
      case 'reports': return <Reports />;
      default: return <Dashboard setCurrentView={setCurrentView} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-slate-50">
        {/* Sidebar Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-brand-orange fill-brand-orange" />
                <span className="font-bold text-xl tracking-tight">Agência Nogue</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (currentView !== item.id) {
                      setCurrentView(item.id as View);
                    }
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${currentView === item.id 
                      ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                      : 'text-slate-600 hover:bg-slate-100'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.emoji} {item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                {navItems.find(i => i.id === currentView)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4 fill-brand-orange" />
                <span>Agência Nogue</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {renderView()}
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
